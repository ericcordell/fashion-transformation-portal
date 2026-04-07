#!/usr/bin/env python3
"""
e2e-update.py — One-command E2E Fashion Portal full refresh.

Usage:
    python3 e2e-update.py                # full refresh → test + prod
    python3 e2e-update.py --dry-run      # show what would change, no writes
    python3 e2e-update.py --no-publish   # refresh + build, skip publish
    python3 e2e-update.py --test-only    # publish to TEST only, skip PROD

What this does (in order):
    1. Pull fresh Confluence data via Chrome + AppleScript
       └─ Fallback: last good archived export if Chrome fails
    2. Process export → detect OPIF status/date/owner changes
    3. Patch changed fields into data-*.js card definitions
    4. Rebuild portal-inlined.html + portal-final.html
    5. Inject OPIF Field Guide
    6. Publish to TEST (canary preflight) then PROD
    7. Git commit with change summary
    8. Print rich results summary

Triggered by Code Puppy skill: `-e2e update`
Portal: Downloads/fashion-portal/
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import time
from datetime import date, datetime
from pathlib import Path
from typing import Any

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE          = Path(__file__).parent
EXPORTS_DIR   = BASE / "confluence-exports"
LATEST_JSON   = EXPORTS_DIR / "latest.json"
CHANGELOG_JS  = BASE / "data-changelog.js"
PORTAL_FINAL  = BASE / "portal-final.html"
LOG_FILE      = BASE / "sync.log"
TODAY         = date.today().isoformat()
NOW_PRETTY    = datetime.now().strftime("%B %-d, %Y")
TIMESTAMP     = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

CONFLUENCE_URL = (
    "https://confluence.walmart.com/display/APREC/"
    "Long+Lead+Time+Transformation+Work+Management+Dashboard"
)
APPLESCRIPT_TMP = Path("/tmp/e2e-portal-extract.applescript")

# Data files to scan for card updates
DATA_FILES = [
    "data-strategy.js",
    "data-design.js",
    "data-buying.js",
    "data-allocation.js",
]

STATUS_MAP = {
    "yellow":            ("yellow",   "Yellow — At Risk"),
    "green":             ("green",    "Green — In Progress"),
    "red":               ("red",      "Red — Blocked"),
    "in progress":       ("yellow",   "Yellow — Work in Progress"),
    "work in progress":  ("yellow",   "Yellow — Work in Progress"),
    "at risk":           ("red",      "Red — At Risk"),
    "on track":          ("green",    "Green — On Track"),
    "done":              ("complete", "Complete"),
    "completed":         ("complete", "Complete"),
    "launched":          ("complete", "Complete"),
    "closed":            ("complete", "Complete"),
    "roadmap":           ("roadmap",  "Roadmap"),
    "planned":           ("roadmap",  "Roadmap"),
    "backlog":           ("roadmap",  "Roadmap"),
    "initial requirements": ("roadmap", "Roadmap — Initial Requirements"),
    "pending sizing":    ("roadmap",  "Roadmap — Pending Sizing"),
    "ready to start":    ("yellow",   "Yellow — Ready to Start"),
    "ready for walkthrough": ("yellow", "Yellow — Ready for Walkthrough"),
    "product discovery": ("yellow",   "Yellow — Product Discovery"),
    "development":       ("green",    "Green — In Development"),
}


# ── Logging ───────────────────────────────────────────────────────────────────
class Log:
    _indent = 0

    @classmethod
    def _write(cls, msg: str) -> None:
        ts   = datetime.now().strftime("%H:%M:%S")
        line = f"[{ts}] {'  ' * cls._indent}{msg}"
        print(line)
        with LOG_FILE.open("a") as f:
            f.write(line + "\n")

    @classmethod
    def info(cls, msg: str) -> None:    cls._write(msg)
    @classmethod
    def ok(cls, msg: str) -> None:      cls._write(f"✅ {msg}")
    @classmethod
    def warn(cls, msg: str) -> None:    cls._write(f"⚠️  {msg}")
    @classmethod
    def err(cls, msg: str) -> None:     cls._write(f"❌ {msg}")
    @classmethod
    def step(cls, n: int, total: int, msg: str) -> None:
        cls._write(f"[{n}/{total}] {msg}")


# ── Chrome / AppleScript extraction ───────────────────────────────────────────
_APPLES = """\
tell application "Google Chrome"
    set windowList to every window
    repeat with aWindow in windowList
        set tabList to every tab of aWindow
        repeat with atab in tabList
            if (URL of atab contains "confluence.walmart.com") then
                set jsCode to "
(function() {
  const results = [];
  const tables = document.querySelectorAll('table');
  tables.forEach(function(table, tIdx) {
    table.querySelectorAll('tr').forEach(function(row, rIdx) {
      const cells = Array.from(row.querySelectorAll('td,th')).map(function(c){return c.innerText.trim();});
      if (cells.length > 0 && cells.join('').length > 0) {
        results.push({table: tIdx, row: rIdx, cells: cells});
      }
    });
  });
  return JSON.stringify({
    success: true,
    url: window.location.href,
    title: document.title,
    tablesFound: tables.length,
    rowsExtracted: results.length,
    data: results
  });
})();"
                set extractedData to execute atab javascript jsCode
                return extractedData
            end if
        end repeat
    end repeat
    return "{\\"error\\": \\"no_tab\\"}"
end tell
"""


def _chrome_extract_fresh() -> dict | None:
    """
    Open Confluence in Chrome, wait for JS render, extract table data.
    Returns parsed JSON dict or None on failure.
    """
    Log.info("Opening Confluence in Chrome…")
    subprocess.run(["open", "-a", "Google Chrome", CONFLUENCE_URL], check=False)
    Log.info("Waiting 20s for JavaScript render…")
    time.sleep(20)

    APPLESCRIPT_TMP.write_text(_APPLES)
    try:
        result = subprocess.run(
            ["osascript", str(APPLESCRIPT_TMP)],
            capture_output=True, text=True, timeout=30
        )
    except subprocess.TimeoutExpired:
        Log.warn("AppleScript timed out")
        return None
    finally:
        APPLESCRIPT_TMP.unlink(missing_ok=True)

    raw = result.stdout.strip()
    if not raw:
        Log.warn("AppleScript returned empty output")
        return None

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        Log.warn(f"AppleScript JSON parse failed: {raw[:100]}")
        return None

    # Detect Chrome DNS error page
    body_url = data.get("url", "")
    if "chrome-error" in body_url or "DNS_PROBE" in str(data):
        Log.warn(f"Chrome DNS error — Confluence unreachable from Chrome ({body_url})")
        return None

    rows = data.get("rowsExtracted", 0)
    if rows == 0:
        Log.warn("Chrome extraction returned 0 rows — page may still be loading")
        # Give it another 15s and retry once
        Log.info("Retrying extraction in 15s…")
        time.sleep(15)
        APPLESCRIPT_TMP.write_text(_APPLES)
        try:
            result = subprocess.run(
                ["osascript", str(APPLESCRIPT_TMP)],
                capture_output=True, text=True, timeout=30
            )
            data = json.loads(result.stdout.strip() or "{}")
            rows = data.get("rowsExtracted", 0)
        except Exception:
            pass
        finally:
            APPLESCRIPT_TMP.unlink(missing_ok=True)

        if rows == 0:
            Log.warn("Retry also returned 0 rows")
            return None

    Log.ok(f"Chrome extracted {rows} rows from {data.get('tablesFound', 0)} tables")
    return data


def _latest_archive() -> Path | None:
    """Return the most recently modified archive JSON (excluding today's failed run)."""
    archives = sorted(
        EXPORTS_DIR.glob("archive_*.json"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    # Skip archives that are clearly empty/failed (< 1 KB)
    for arch in archives:
        if arch.stat().st_size > 1024:
            return arch
    return None


def pull_confluence_data() -> tuple[dict, str]:
    """
    Pull Confluence data. Returns (parsed_json, source_label).
    Tries Chrome first, falls back to last good archive.
    """
    EXPORTS_DIR.mkdir(exist_ok=True)

    # ── Attempt 1: Fresh Chrome extraction ──────────────────────────────────
    fresh = _chrome_extract_fresh()
    if fresh and fresh.get("rowsExtracted", 0) > 0:
        archive = EXPORTS_DIR / f"archive_{TIMESTAMP}.json"
        LATEST_JSON.write_text(json.dumps(fresh))
        archive.write_text(json.dumps(fresh))
        rows = fresh["rowsExtracted"]
        tables = fresh["tablesFound"]
        Log.ok(f"Fresh Confluence data saved ({rows} rows, {tables} tables)")
        return fresh, "live Confluence (Chrome)"

    # ── Attempt 2: Last good archive ────────────────────────────────────────
    Log.warn("Chrome extraction failed — falling back to last good archive")
    fallback = _latest_archive()
    if fallback:
        data = json.loads(fallback.read_text())
        LATEST_JSON.write_text(fallback.read_text())
        mtime = datetime.fromtimestamp(fallback.stat().st_mtime).strftime("%b %-d, %Y")
        rows = data.get("rowsExtracted", 0)
        Log.ok(f"Using archive from {mtime} ({rows} rows)")
        return data, f"archive ({mtime})"

    raise RuntimeError(
        "No Confluence data available.\n"
        "  → Open Chrome, navigate to confluence.walmart.com, then re-run."
    )


# ── Parse Confluence export ────────────────────────────────────────────────────
def _fmt_date(raw: str) -> str:
    """Try to parse and normalize a date string."""
    for fmt in ("%b %d, %Y", "%B %d, %Y", "%Y-%m-%d", "%d-%b", "%b %-d, %Y"):
        try:
            d = datetime.strptime(raw.strip(), fmt)
            return d.strftime("%b %-d, %Y")
        except ValueError:
            continue
    return raw.strip()


def _quarter(raw_date: str) -> str:
    for fmt in ("%b %d, %Y", "%B %d, %Y", "%Y-%m-%d"):
        try:
            d = datetime.strptime(raw_date.strip(), fmt)
            return f"Q{(d.month - 1) // 3 + 1}"
        except ValueError:
            continue
    return ""


def parse_opif_records(data: dict) -> dict[str, dict]:
    """
    Extract OPIF records from the Confluence table data.
    Returns dict keyed by OPIF-ID.
    """
    records: dict[str, dict] = {}
    opif_re = re.compile(r"OPIF-\d+")

    for row_obj in data.get("data", []):
        cells = row_obj.get("cells", [])
        if not cells:
            continue

        # Check if any cell starts with OPIF-NNNNN
        opif_id = None
        for cell in cells[:3]:
            m = opif_re.match(cell.strip())
            if m:
                opif_id = m.group(0)
                break
        if not opif_id:
            continue

        # Column heuristics: [OPIF, Program, ..., Status(7), ..., TargetDate(17), ..., TPM(12), PM(13)]
        program_name = cells[1].strip() if len(cells) > 1 else ""
        raw_status   = cells[7].strip().lower() if len(cells) > 7 else ""
        target_raw   = cells[17].strip() if len(cells) > 17 else ""
        tpm          = cells[12].strip() if len(cells) > 12 else ""
        pm           = cells[13].strip() if len(cells) > 13 else ""
        x_rank       = cells[5].strip() if len(cells) > 5 else ""

        status_key, status_label = STATUS_MAP.get(
            raw_status,
            STATUS_MAP.get(
                next((k for k in STATUS_MAP if k in raw_status), ""),
                ("", raw_status.title()),
            ),
        )
        target_fmt = _fmt_date(target_raw) if target_raw else ""
        quarter    = _quarter(target_raw) if target_raw else ""

        records[opif_id] = {
            "opifId":      opif_id,
            "title":       program_name,
            "status":      status_key,
            "statusLabel": status_label,
            "targetDate":  target_fmt,
            "quarter":     quarter,
            "tpm":         tpm,
            "pm":          pm,
            "xRank":       x_rank,
            "rawStatus":   raw_status,
        }

    return records


def parse_timeline_rows(data: dict) -> list[dict]:
    """
    Extract Module/Timeline/Status rows for the Weekly Program Review.
    Returns list of {module, timeline, status} dicts.
    """
    rows = []
    for row_obj in data.get("data", []):
        cells = row_obj.get("cells", [])
        if len(cells) >= 3:
            header = cells[0].strip()
            if header.lower() in ("module", "deliverables"):
                continue  # skip header rows
            # Look for rows with date-like timeline values
            timeline = cells[1].strip() if len(cells) > 1 else ""
            status   = cells[2].strip() if len(cells) > 2 else ""
            if timeline and re.search(r"\d", timeline):  # has digits → date-like
                rows.append({"module": header, "timeline": timeline, "status": status})
    # Deduplicate
    seen = set()
    unique = []
    for r in rows:
        key = (r["module"], r["timeline"])
        if key not in seen:
            seen.add(key)
            unique.append(r)
    return unique


# ── Patch data-*.js files ──────────────────────────────────────────────────────
def load_current_opifs() -> dict[str, dict]:
    """Read all data-*.js files and extract OPIF IDs + current field values."""
    found: dict[str, dict] = {}
    opif_re = re.compile(r"OPIF-\d+")
    for fname in DATA_FILES:
        fpath = BASE / fname
        if not fpath.exists():
            continue
        txt = fpath.read_text()
        for m in opif_re.finditer(txt):
            oid = m.group(0)
            if oid in found:
                continue
            # Grab card block around this OPIF reference (±3000 chars)
            start = max(0, m.start() - 2000)
            snippet = txt[start: m.start() + 3000]
            status_m   = re.search(r"status:\s*'([^']*)'", snippet)
            target_m   = re.search(r"targetDate:\s*'([^']*)'", snippet)
            label_m    = re.search(r"statusLabel:\s*'([^']*)'", snippet)
            found[oid] = {
                "file":        fname,
                "status":      status_m.group(1)  if status_m  else "",
                "statusLabel": label_m.group(1)   if label_m   else "",
                "targetDate":  target_m.group(1)  if target_m  else "",
            }
    return found


def patch_card(opif_id: str, fname: str, updates: dict[str, str]) -> bool:
    """Apply field updates to a card block containing opif_id in fname."""
    fpath = BASE / fname
    txt   = fpath.read_text()
    changed = False

    opif_re = re.compile(re.escape(opif_id))
    m = opif_re.search(txt)
    if not m:
        return False

    # Find the enclosing card object start (look back for nearest `{`)
    block_start = txt.rfind("{", 0, m.start())
    block_end   = txt.find("},", m.start())
    if block_start == -1 or block_end == -1:
        return False

    card_block = txt[block_start: block_end + 2]
    new_block  = card_block

    for field, new_val in updates.items():
        pat = re.compile(rf"({re.escape(field)}:\s*)'([^']*)'")
        replaced = pat.sub(rf"\g<1>'{new_val}'", new_block, count=1)
        if replaced != new_block:
            new_block = replaced
            changed = True

    if changed:
        fpath.write_text(txt[:block_start] + new_block + txt[block_end + 2:])

    return changed


def apply_changes(
    current: dict[str, dict],
    scraped: dict[str, dict],
    dry_run: bool,
) -> list[dict]:
    """
    Compare current portal state to scraped OPIF data.
    Returns list of change records. Patches files if not dry_run.
    """
    changes = []
    for oid, scraped_card in scraped.items():
        cur = current.get(oid)
        if not cur:
            continue  # New OPIF — not yet in portal, skip patching

        diffs: dict[str, str] = {}

        # Status
        if scraped_card["status"] and scraped_card["status"] != cur["status"]:
            diffs["status"]      = scraped_card["status"]
            diffs["statusLabel"] = scraped_card["statusLabel"]
            changes.append({
                "opif":    oid,
                "field":   "status",
                "from":    cur["status"],
                "to":      scraped_card["status"],
                "fromLbl": cur["statusLabel"],
                "toLbl":   scraped_card["statusLabel"],
                "date":    TODAY,
            })

        # Target date
        if scraped_card["targetDate"] and scraped_card["targetDate"] != cur["targetDate"]:
            diffs["targetDate"] = scraped_card["targetDate"]
            if scraped_card["quarter"]:
                diffs["quarter"] = scraped_card["quarter"]
            changes.append({
                "opif":  oid,
                "field": "targetDate",
                "from":  cur["targetDate"],
                "to":    scraped_card["targetDate"],
                "date":  TODAY,
            })

        if diffs and not dry_run:
            patch_card(oid, cur["file"], diffs)

    return changes


# ── Changelog ─────────────────────────────────────────────────────────────────
def update_changelog(changes: list[dict]) -> None:
    """Append new changes to data-changelog.js and stamp today's date."""
    txt  = CHANGELOG_JS.read_text()

    # Update sync date
    txt = re.sub(r"const LAST_SYNC_DATE = '[^']+';",
                 f"const LAST_SYNC_DATE = '{NOW_PRETTY}';", txt)
    txt = re.sub(r"(Last sync:).*", rf"\1 {NOW_PRETTY}", txt)

    CHANGELOG_JS.write_text(txt)


# ── Subprocess helpers ─────────────────────────────────────────────────────────
def run(cmd: list[str], label: str) -> bool:
    """Run a subprocess, stream output, return success bool."""
    result = subprocess.run(cmd, cwd=str(BASE), capture_output=True, text=True)
    if result.returncode != 0:
        Log.err(f"{label} failed:\n{result.stderr[:400]}")
        return False
    if result.stdout.strip():
        for line in result.stdout.strip().splitlines():
            Log.info(f"  {line}")
    Log.ok(label)
    return True


# ── Git ────────────────────────────────────────────────────────────────────────
def git_commit(n_changes: int, source: str) -> None:
    subprocess.run(["git", "add", "-A"], cwd=str(BASE), capture_output=True)
    diff = subprocess.run(
        ["git", "diff", "--cached", "--stat"],
        cwd=str(BASE), capture_output=True, text=True
    ).stdout.strip()
    if not diff:
        Log.info("Git: nothing new to commit")
        return
    msg = (
        f"sync({TODAY}): e2e-update — {n_changes} card changes\n\n"
        f"Source: {source}\n"
        f"Built: portal-final.html\n"
        f"Published: test + prod via puppy.walmart.com"
    )
    subprocess.run(["git", "commit", "-m", msg], cwd=str(BASE), capture_output=True)
    Log.ok(f"Git committed ({diff.splitlines()[-1] if diff else 'no stat'})")


# ── Banner ─────────────────────────────────────────────────────────────────────
def banner(title: str) -> None:
    bar = "─" * 62
    Log.info(f"\n┌{bar}┐")
    Log.info(f"│  {title:<60}│")
    Log.info(f"└{bar}┘")


# ── Main ───────────────────────────────────────────────────────────────────────
def main() -> None:
    ap = argparse.ArgumentParser(description="E2E Fashion Portal — one-command refresh")
    ap.add_argument("--dry-run",    action="store_true", help="Preview changes only, no writes")
    ap.add_argument("--no-publish", action="store_true", help="Build only, skip publish")
    ap.add_argument("--test-only",  action="store_true", help="Publish to TEST only")
    ap.add_argument("--build-only", action="store_true", help="Skip Confluence pull, just rebuild + publish")
    args = ap.parse_args()

    t_start = time.monotonic()

    banner(f"E2E Fashion Portal — Full Refresh    {datetime.now():%Y-%m-%d %H:%M}")
    Log.info(f"Portal dir : {BASE}")
    Log.info(f"Mode       : {'DRY RUN' if args.dry_run else 'LIVE'}")
    Log.info("")

    TOTAL_STEPS = 7
    errors: list[str] = []

    # ── Step 1: Pull Confluence data ──────────────────────────────────────────
    Log.step(1, TOTAL_STEPS, "Pull Confluence data")
    source_label = "skipped (--build-only)"
    scraped_opifs: dict[str, dict] = {}
    timeline_rows: list[dict] = []

    if not args.build_only:
        try:
            conf_data, source_label = pull_confluence_data()
            scraped_opifs  = parse_opif_records(conf_data)
            timeline_rows  = parse_timeline_rows(conf_data)
            Log.ok(f"Parsed {len(scraped_opifs)} OPIF records, "
                   f"{len(timeline_rows)} timeline rows  [{source_label}]")
        except RuntimeError as exc:
            Log.err(str(exc))
            errors.append("Confluence pull failed — used cached data")
            source_label = "failed"
    else:
        Log.info("  --build-only: skipping Confluence pull")

    # ── Step 2: Detect + apply card changes ───────────────────────────────────
    Log.step(2, TOTAL_STEPS, "Detect + apply Program Card changes")
    all_changes: list[dict] = []

    if scraped_opifs and not args.dry_run:
        current_opifs = load_current_opifs()
        Log.info(f"  Portal has {len(current_opifs)} OPIF-linked cards")
        all_changes = apply_changes(current_opifs, scraped_opifs, dry_run=args.dry_run)

        if all_changes:
            Log.ok(f"{len(all_changes)} field(s) updated across portal cards")
            for ch in all_changes:
                lbl = ch.get("toLbl") or ch["to"]
                Log.info(f"  {ch['opif']}  {ch['field']}: {ch['from']!r} → {lbl!r}")
        else:
            Log.ok("No card changes detected — portal already current")
    elif args.dry_run:
        Log.info("  DRY RUN: skipping card patches")

    # ── Step 3: Update changelog date ─────────────────────────────────────────
    Log.step(3, TOTAL_STEPS, f"Stamp changelog → {NOW_PRETTY}")
    if not args.dry_run:
        update_changelog(all_changes)
        Log.ok("data-changelog.js updated")
    else:
        Log.info("  DRY RUN: skipping changelog write")

    if args.dry_run:
        Log.info("\nDRY RUN complete — no files written.")
        return

    # ── Step 4: Rebuild portal ────────────────────────────────────────────────
    Log.step(4, TOTAL_STEPS, "Build portal-inlined.html + portal-final.html")
    ok = run([sys.executable, str(BASE / "build-inlined.py")], "build-inlined.py")
    if not ok:
        errors.append("Build failed — publish aborted")
        _print_summary(t_start, errors, [], source_label)
        sys.exit(1)

    # ── Step 5: Inject OPIF guide ─────────────────────────────────────────────
    Log.step(5, TOTAL_STEPS, "Inject OPIF Field Guide")
    run([sys.executable, str(BASE / "add-opif-guide.py")], "add-opif-guide.py")

    # ── Step 6: Publish ───────────────────────────────────────────────────────
    published_urls: list[str] = []

    if args.no_publish:
        Log.step(6, TOTAL_STEPS, "Publish — SKIPPED (--no-publish)")
    else:
        Log.step(6, TOTAL_STEPS, "Publish")

        if not args.test_only:
            # TEST first (with canary)
            Log.info("  → TEST (canary preflight)…")
            ok_test = run(
                [sys.executable, str(BASE / "publish-portal.py"), "--test"],
                "Published TEST"
            )
            if ok_test:
                published_urls.append(
                    "https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-test"
                )
            else:
                errors.append("TEST publish failed")

        # PROD
        Log.info("  → PROD…")
        ok_prod = run(
            [sys.executable, str(BASE / "publish-portal.py"), "--prod"],
            "Published PROD"
        )
        if ok_prod:
            published_urls.append(
                "https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-prod"
            )
        else:
            errors.append("PROD publish failed")

    # ── Step 7: Git commit ────────────────────────────────────────────────────
    Log.step(7, TOTAL_STEPS, "Git commit")
    git_commit(len(all_changes), source_label)

    # ── Summary ───────────────────────────────────────────────────────────────
    _print_summary(t_start, errors, published_urls, source_label,
                   all_changes, timeline_rows)

    if errors:
        sys.exit(1)


def _print_summary(
    t_start: float,
    errors: list[str],
    published_urls: list[str],
    source_label: str,
    changes: list[dict] | None = None,
    timeline_rows: list[dict] | None = None,
) -> None:
    elapsed = time.monotonic() - t_start
    Log.info("")
    banner("Summary")

    status_icon = "✅" if not errors else "⚠️ "
    Log.info(f"{status_icon} Completed in {elapsed:.1f}s  |  Source: {source_label}")
    Log.info("")

    if changes:
        Log.info("📋 Program Card Changes:")
        for ch in changes:
            lbl = ch.get("toLbl") or ch["to"]
            Log.info(f"   {ch['opif']}  {ch['field']}: {ch['from']!r} → {lbl!r}")
        Log.info("")

    if timeline_rows:
        Log.info("🗓  Upcoming Milestones (from Confluence):")
        for r in timeline_rows[:8]:
            Log.info(f"   {r['module']:<40} {r['timeline']:<12} {r['status']}")
        Log.info("")

    if published_urls:
        Log.info("🔗 Live portals:")
        for url in published_urls:
            Log.info(f"   {url}")
        Log.info("")

    if errors:
        Log.info("⚠️  Errors / Warnings:")
        for e in errors:
            Log.info(f"   • {e}")
        Log.info("")

    Log.info("💡 Hard-refresh browser (⌘+Shift+R) to see latest content.")


if __name__ == "__main__":
    main()
