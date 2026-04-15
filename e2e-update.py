#!/usr/bin/env python3
"""
e2e-update.py — One-command E2E Fashion Portal full refresh.

Usage:
    python3 e2e-update.py                # full refresh → test + prod
    python3 e2e-update.py --dry-run      # show what would change, no writes
    python3 e2e-update.py --no-publish   # refresh + build, skip publish
    python3 e2e-update.py --test-only    # publish to TEST only, skip PROD
    python3 e2e-update.py --build-only   # skip Confluence pull, rebuild + publish

What this does (in order):
    1. Pull fresh Confluence data via Chrome + AppleScript
       - Pass 1: extract from the existing loaded "Long Lead Time" tab (no nav)
       - Pass 2: open a new tab, wait for render, retry
       - Fallback: last good archived export if Chrome fails entirely
    2. Detect OPIF status / date / owner changes vs portal cards
    3. Patch changed fields into data-*.js card definitions
    4. Rebuild portal-inlined.html + portal-final.html
    5. Inject OPIF Field Guide
    6. Publish to TEST (canary preflight) then PROD
    7. Git commit with change summary
    8. Print rich results summary

Triggered by Code Puppy skill: `-e2e update`
Portal: ~/Downloads/fashion-portal/
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from datetime import date, datetime
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE          = Path(__file__).parent
EXPORTS_DIR   = BASE / "confluence-exports"
LATEST_JSON   = EXPORTS_DIR / "latest.json"
CHANGELOG_JS  = BASE / "data-changelog.js"
PORTAL_FINAL  = BASE / "portal-final.html"
LOG_FILE      = BASE / "sync.log"
TODAY         = date.today().isoformat()
NOW_PRETTY    = datetime.now().strftime("%B %-d, %Y")
TIMESTAMP     = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

# Temp files used during Chrome extraction — cleaned up after each run
_JS_TMP    = Path("/tmp/e2e-portal-extract.js")
_AS_TMP    = Path("/tmp/e2e-portal-extract.applescript")

CONFLUENCE_URL = (
    "https://confluence.walmart.com/display/APREC/"
    "Long+Lead+Time+Transformation+Work+Management+Dashboard"
)

DATA_FILES = [
    "data-strategy.js",
    "data-design.js",
    "data-buying.js",
    "data-allocation.js",
]

STATUS_MAP = {
    "yellow":               ("yellow",   "Yellow — At Risk"),
    "green":                ("green",    "Green — In Progress"),
    "red":                  ("red",      "Red — Blocked"),
    "in progress":          ("yellow",   "Yellow — Work in Progress"),
    "work in progress":     ("yellow",   "Yellow — Work in Progress"),
    "at risk":              ("red",      "Red — At Risk"),
    "on track":             ("green",    "Green — On Track"),
    "done":                 ("complete", "Complete"),
    "completed":            ("complete", "Complete"),
    "launched":             ("complete", "Complete"),
    "closed":               ("complete", "Complete"),
    "roadmap":              ("roadmap",  "Roadmap"),
    "planned":              ("roadmap",  "Roadmap"),
    "backlog":              ("roadmap",  "Roadmap"),
    "initial requirements": ("roadmap",  "Roadmap — Initial Requirements"),
    "pending sizing":       ("roadmap",  "Roadmap — Pending Sizing"),
    "ready to start":       ("yellow",   "Yellow — Ready to Start"),
    "ready for walkthrough":("yellow",   "Yellow — Ready for Walkthrough"),
    "product discovery":    ("yellow",   "Yellow — Product Discovery"),
    "development":          ("green",    "Green — In Development"),
}


# ── Logging ────────────────────────────────────────────────────────────────────
class Log:
    @staticmethod
    def _write(msg: str) -> None:
        ts   = datetime.now().strftime("%H:%M:%S")
        line = f"[{ts}] {msg}"
        print(line)
        with LOG_FILE.open("a") as f:
            f.write(line + "\n")

    @classmethod
    def info(cls, msg: str)                    -> None: cls._write(msg)
    @classmethod
    def ok(cls, msg: str)                      -> None: cls._write(f"✅ {msg}")
    @classmethod
    def warn(cls, msg: str)                    -> None: cls._write(f"⚠️  {msg}")
    @classmethod
    def err(cls, msg: str)                     -> None: cls._write(f"❌ {msg}")
    @classmethod
    def step(cls, n: int, tot: int, msg: str)  -> None: cls._write(f"[{n}/{tot}] {msg}")


# ── Chrome extraction ──────────────────────────────────────────────────────────
# The JavaScript lives in a separate file loaded by AppleScript via `cat`.
# This avoids ALL multiline-string / escaping issues in osascript.

_EXTRACT_JS = """\
(function() {
  var results = [];
  var tables = document.querySelectorAll('table');
  tables.forEach(function(table, tIdx) {
    table.querySelectorAll('tr').forEach(function(row, rIdx) {
      var cells = Array.from(row.querySelectorAll('td,th')).map(function(c) {
        return c.innerText.trim();
      });
      if (cells.length > 0 && cells.join('').length > 0) {
        results.push({ table: tIdx, row: rIdx, cells: cells });
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
})()
"""

# AppleScript template — {JS_PATH} is substituted at runtime.
# Priority 1: tab whose title contains "Long Lead Time" (fully rendered dashboard).
# Priority 2: any confluence.walmart.com tab that is not a chrome-error page.
_APPLES_TMPL = '''\
tell application "Google Chrome"
    set jsCode to do shell script "cat {JS_PATH}"
    set bestTab to missing value
    set fallbackTab to missing value
    repeat with aWindow in every window
        repeat with atab in every tab of aWindow
            set tabURL to URL of atab
            set tabTitle to title of atab
            if tabURL does not contain "chrome-error" then
                if tabTitle contains "Long Lead Time" then
                    set bestTab to atab
                    exit repeat
                else if tabURL contains "confluence.walmart.com" and fallbackTab is missing value then
                    set fallbackTab to atab
                end if
            end if
        end repeat
        if bestTab is not missing value then exit repeat
    end repeat
    if bestTab is missing value then set bestTab to fallbackTab
    if bestTab is missing value then return "{\\"error\\": \\"no_tab\\"}"
    return execute bestTab javascript jsCode
end tell
'''


def _run_applescript() -> dict | None:
    """Write JS to temp file, run AppleScript, parse and return JSON."""
    _JS_TMP.write_text(_EXTRACT_JS)
    script = _APPLES_TMPL.replace("{JS_PATH}", str(_JS_TMP))
    _AS_TMP.write_text(script)
    try:
        res = subprocess.run(
            ["osascript", str(_AS_TMP)],
            capture_output=True, text=True, timeout=30
        )
    except subprocess.TimeoutExpired:
        Log.warn("AppleScript timed out")
        return None
    finally:
        _AS_TMP.unlink(missing_ok=True)
        _JS_TMP.unlink(missing_ok=True)

    if res.stderr.strip():
        Log.warn(f"osascript stderr: {res.stderr.strip()[:200]}")

    raw = res.stdout.strip()
    if not raw:
        Log.warn("AppleScript returned empty output")
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        Log.warn(f"AppleScript JSON parse error: {raw[:200]}")
        return None


def _chrome_extract_fresh() -> dict | None:
    """
    Extract Confluence table data from Chrome — two-pass strategy:
      Pass 1: use the already-loaded 'Long Lead Time' tab (no navigation).
      Pass 2: open a fresh tab, wait 20s for render, retry.
    Returns None on all failures so caller falls back to archive.
    """
    # ── Pass 1: existing loaded tab ───────────────────────────────────────────
    Log.info("Checking for existing 'Long Lead Time' tab in Chrome…")
    data = _run_applescript()

    if data and not data.get("error"):
        rows = data.get("rowsExtracted", 0)
        url  = data.get("url", "")
        if "chrome-error" in url:
            Log.warn(f"Tab is an error page ({url})")
            data = None
        elif rows > 0:
            Log.ok(f"Live tab extracted {rows} rows from {data.get('tablesFound',0)} tables ✨")
            return data
        else:
            Log.warn("Tab found but returned 0 rows — page may still be rendering")
            data = None
    elif data and data.get("error") == "no_tab":
        Log.info("No matching tab found — will open a new one")
        data = None

    # ── Pass 2: open fresh tab + wait ─────────────────────────────────────────
    Log.info("Opening Confluence in a new Chrome tab…")
    subprocess.run(["open", "-a", "Google Chrome", CONFLUENCE_URL], check=False)
    Log.info("Waiting 20s for JavaScript render…")
    time.sleep(20)

    data = _run_applescript()
    if not data or data.get("error"):
        Log.warn(f"Pass-2 returned: {data}")
        return None

    url  = data.get("url", "")
    rows = data.get("rowsExtracted", 0)
    if "chrome-error" in url:
        Log.warn(f"Chrome DNS error on new tab ({url})")
        return None

    if rows == 0:
        Log.info("Still 0 rows — final retry in 15s…")
        time.sleep(15)
        data = _run_applescript() or {}
        rows = data.get("rowsExtracted", 0)
        if rows == 0:
            Log.warn("All passes returned 0 rows")
            return None

    Log.ok(f"Chrome extracted {rows} rows from {data.get('tablesFound',0)} tables ✨")
    return data


def _latest_archive() -> Path | None:
    """Return the most recent non-empty archive JSON."""
    for arch in sorted(
        EXPORTS_DIR.glob("archive_*.json"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    ):
        if arch.stat().st_size > 1024:
            return arch
    return None


def pull_confluence_data() -> tuple[dict, str]:
    """Pull Confluence data. Returns (parsed_json, source_label)."""
    EXPORTS_DIR.mkdir(exist_ok=True)

    fresh = _chrome_extract_fresh()
    if fresh and fresh.get("rowsExtracted", 0) > 0:
        archive = EXPORTS_DIR / f"archive_{TIMESTAMP}.json"
        LATEST_JSON.write_text(json.dumps(fresh))
        archive.write_text(json.dumps(fresh))
        Log.ok(f"Saved fresh export ({fresh['rowsExtracted']} rows, {fresh['tablesFound']} tables)")
        return fresh, "live Confluence (Chrome)"

    Log.warn("Chrome extraction failed — falling back to last good archive")
    fallback = _latest_archive()
    if fallback:
        payload = json.loads(fallback.read_text())
        LATEST_JSON.write_text(fallback.read_text())
        mtime = datetime.fromtimestamp(fallback.stat().st_mtime).strftime("%b %-d, %Y")
        Log.ok(f"Using archive from {mtime} ({payload.get('rowsExtracted', 0)} rows)")
        return payload, f"archive ({mtime})"

    raise RuntimeError(
        "No Confluence data available.\n"
        "  → Open Chrome, navigate to the LLTT Dashboard, confirm it loads, then retry."
    )


# ── Parse OPIF records ─────────────────────────────────────────────────────────
def _fmt_date(raw: str) -> str:
    for fmt in ("%b %d, %Y", "%B %d, %Y", "%Y-%m-%d", "%b %-d, %Y", "%-d-%b"):
        try:
            return datetime.strptime(raw.strip(), fmt).strftime("%b %-d, %Y")
        except ValueError:
            continue
    return raw.strip()


def _quarter(raw: str) -> str:
    for fmt in ("%b %d, %Y", "%B %d, %Y", "%Y-%m-%d"):
        try:
            d = datetime.strptime(raw.strip(), fmt)
            return f"Q{(d.month - 1) // 3 + 1}"
        except ValueError:
            continue
    return ""


# Placeholder values in Status Remarks that carry no real information
_REMARKS_JUNK = {
    ".", "", "n/a", "tbd", "pending",
    "milestone only", "milestone only.",      # drop bare milestone markers
    "new request to review", "consultation only.",
}

# Sub-table header fragments that appear when Confluence flattens nested tables.
# Everything from this pattern onward is milestone schedule noise, not narrative.
_SUB_TABLE_HEADERS = (
    " Module Timeline",
    " Deliverables Timeline",
    " Tasks/Deliverables",
)


def _clean_remarks(raw: str) -> str:
    """
    Clean and normalise a Status Remarks string pulled from Confluence.

    - Replace non-breaking spaces with regular spaces
    - Collapse internal whitespace / newlines to single space
    - Strip leading/trailing whitespace
    - Cut off flattened sub-table content ("Module Timeline Status ...") —
      Confluence merges milestone schedule rows into cells[20], which we
      don't want in the WPR narrative update
    - Drop known placeholder values (see _REMARKS_JUNK)
    - Truncate to 300 chars at a word boundary
    """
    if not raw:
        return ""
    # Remove NBSP and other Unicode whitespace variants
    cleaned = raw.replace("\xa0", " ").replace("\u200b", "")
    # Collapse newlines + multiple spaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    # Strip flattened milestone sub-table content
    for hdr in _SUB_TABLE_HEADERS:
        idx = cleaned.find(hdr)
        if idx > 0:
            cleaned = cleaned[:idx].strip()
            break
    # Drop junk
    if cleaned.lower().rstrip(".") in _REMARKS_JUNK:
        return ""
    # Truncate at word boundary
    if len(cleaned) > 300:
        cleaned = cleaned[:300].rsplit(" ", 1)[0] + "…"
    return cleaned


# RAG color values that uniquely identify the main LLTT dashboard table rows.
# Other tables put names / dates / free text in cells[7].
_RAG_COLORS = {"green", "yellow", "red"}


def parse_opif_records(data: dict) -> dict[str, dict]:
    """
    Extract OPIF records from Confluence table data.

    The live Confluence page flattens nested sub-tables, so each OPIF ID
    may appear in 3-5 rows from different summary/cross-ref tables.

    Row selection strategy:
      1. Prefer rows where cells[7] is exactly 'Green'/'Yellow'/'Red'
         (the RAG status column in the main LLTT dashboard table).
      2. Fall back to the longest row if no RAG row exists.

    Target date strategy (main table layout):
      - cells[14] = program start date (skip)
      - cells[16] = target date ← this is what we want
      - cells[17] = target date duplicate
    """
    opif_re = re.compile(r"OPIF-\d+")

    # Group all rows by OPIF ID (only rows where ID is in cells[0..2])
    candidates: dict[str, list[list[str]]] = {}
    for row_obj in data.get("data", []):
        cells = row_obj.get("cells", [])
        opif_id = None
        for cell in cells[:3]:
            m = opif_re.match(cell.strip())
            if m:
                opif_id = m.group(0)
                break
        if opif_id:
            candidates.setdefault(opif_id, []).append(cells)

    records: dict[str, dict] = {}
    for opif_id, rows in candidates.items():
        # Priority: rows whose cells[7] is a RAG color (main dashboard table)
        rag_rows = [
            r for r in rows
            if len(r) > 7 and r[7].strip().lower() in _RAG_COLORS
        ]
        best = rag_rows[0] if rag_rows else max(rows, key=len)

        is_rag_row  = len(best) > 7 and best[7].strip().lower() in _RAG_COLORS
        program     = best[1].strip()  if len(best) > 1  else ""

        if is_rag_row:
            # Main table: fixed column layout
            raw_status = best[7].strip().lower()          # e.g. "green"
            tpm        = best[12].strip() if len(best) > 12 else ""
            pm         = best[13].strip() if len(best) > 13 else ""
            x_rank     = best[5].strip()  if len(best) > 5  else ""
            # cells[14]=start date, cells[16]=target date
            target     = best[16].strip() if len(best) > 16 and best[16].strip() else ""
            if not target and len(best) > 17:
                target = best[17].strip()
        else:
            # Fallback: scan for status keyword + any date
            raw_status = best[7].strip().lower() if len(best) > 7 else ""
            tpm        = best[12].strip() if len(best) > 12 else ""
            pm         = best[13].strip() if len(best) > 13 else ""
            x_rank     = best[5].strip()  if len(best) > 5  else ""
            date_pat   = re.compile(r"^[A-Z][a-z]{2,8} \d{1,2}, \d{4}$")
            target     = next((c.strip() for c in best[10:] if date_pat.match(c.strip())), "")

        status_key, status_label = STATUS_MAP.get(
            raw_status,
            STATUS_MAP.get(
                next((k for k in STATUS_MAP if k in raw_status), ""),
                ("", raw_status.title()),
            ),
        )
        # cells[19] = brief status, cells[20] = full timestamped Status Remarks.
        # We prefer cells[20] — it has dated updates like "6-Apr-2026 – Dev in progress..."
        raw_remarks = ""
        if is_rag_row:
            raw_remarks = best[20].strip() if len(best) > 20 else ""
            if not raw_remarks:
                raw_remarks = best[19].strip() if len(best) > 19 else ""
        else:
            raw_remarks = best[20].strip() if len(best) > 20 else ""

        records[opif_id] = {
            "opifId":        opif_id,
            "title":         program,
            "status":        status_key,
            "statusLabel":   status_label,
            "targetDate":    _fmt_date(target) if target else "",
            "quarter":       _quarter(target)  if target else "",
            "tpm":           tpm,
            "pm":            pm,
            "xRank":         x_rank,
            "statusRemarks": _clean_remarks(raw_remarks),
        }
    return records


def parse_timeline_rows(data: dict) -> list[dict]:
    rows, seen = [], set()
    for row_obj in data.get("data", []):
        cells = row_obj.get("cells", [])
        if len(cells) < 3:
            continue
        header   = cells[0].strip()
        timeline = cells[1].strip() if len(cells) > 1 else ""
        status   = cells[2].strip() if len(cells) > 2 else ""
        if header.lower() in ("module", "deliverables"):
            continue
        if timeline and re.search(r"\d", timeline):
            key = (header, timeline)
            if key not in seen:
                seen.add(key)
                rows.append({"module": header, "timeline": timeline, "status": status})
    return rows


# ── Patch data-*.js files ──────────────────────────────────────────────────────
def load_current_opifs() -> dict[str, dict]:
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
            start   = max(0, m.start() - 2000)
            snippet = txt[start: m.start() + 3000]
            found[oid] = {
                "file":        fname,
                "status":      (re.search(r"status:\s*'([^']*)'", snippet) or type("", (), {"group": lambda s, n: ""})()).group(1),
                "statusLabel": (re.search(r"statusLabel:\s*'([^']*)'", snippet) or type("", (), {"group": lambda s, n: ""})()).group(1),
                "targetDate":  (re.search(r"targetDate:\s*'([^']*)'", snippet) or type("", (), {"group": lambda s, n: ""})()).group(1),
            }
    return found


def _safe_get(m, group=1, default=""):
    return m.group(group) if m else default


def load_current_opifs() -> dict[str, dict]:  # noqa: F811  (clean redefinition)
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
            start   = max(0, m.start() - 2000)
            snippet = txt[start: m.start() + 3000]
            found[oid] = {
                "file":        fname,
                "status":      _safe_get(re.search(r"status:\s*'([^']*)'", snippet)),
                "statusLabel": _safe_get(re.search(r"statusLabel:\s*'([^']*)'", snippet)),
                "targetDate":  _safe_get(re.search(r"targetDate:\s*'([^']*)'", snippet)),
            }
    return found


def patch_card(opif_id: str, fname: str, updates: dict[str, str]) -> bool:
    fpath = BASE / fname
    txt   = fpath.read_text()
    m     = re.search(re.escape(opif_id), txt)
    if not m:
        return False
    bs = txt.rfind("{", 0, m.start())
    be = txt.find("},", m.start())
    if bs == -1 or be == -1:
        return False
    block = txt[bs: be + 2]
    new_block = block
    changed = False
    for field, val in updates.items():
        replaced = re.sub(
            rf"({re.escape(field)}:\s*)'([^']*)'",
            rf"\g<1>'{val}'",
            new_block, count=1
        )
        if replaced != new_block:
            new_block = replaced
            changed = True
    if changed:
        fpath.write_text(txt[:bs] + new_block + txt[be + 2:])
    return changed


def apply_changes(
    current: dict[str, dict],
    scraped: dict[str, dict],
    dry_run: bool,
) -> list[dict]:
    changes = []
    for oid, sc in scraped.items():
        cur = current.get(oid)
        if not cur:
            continue
        diffs: dict[str, str] = {}

        if sc["status"] and sc["status"] != cur["status"]:
            diffs["status"]      = sc["status"]
            diffs["statusLabel"] = sc["statusLabel"]
            changes.append({"opif": oid, "field": "status",
                            "from": cur["status"], "to": sc["status"],
                            "fromLbl": cur["statusLabel"], "toLbl": sc["statusLabel"],
                            "date": TODAY})

        if sc["targetDate"] and sc["targetDate"] != cur["targetDate"]:
            diffs["targetDate"] = sc["targetDate"]
            if sc["quarter"]:
                diffs["quarter"] = sc["quarter"]
            changes.append({"opif": oid, "field": "targetDate",
                            "from": cur["targetDate"], "to": sc["targetDate"],
                            "date": TODAY})

        if diffs and not dry_run:
            patch_card(oid, cur["file"], diffs)
    return changes


# ── WPR Status Remarks ────────────────────────────────────────────────────────
def _extract_card_opifs(block: str) -> list[str]:
    """Return deduped ordered list of OPIF-IDs found inside a card JS block."""
    return list(dict.fromkeys(re.findall(r"OPIF-\d+", block)))


def _compose_card_remarks(
    opif_ids: list[str],
    scraped: dict[str, dict],
) -> str:
    """
    Build the `recentUpdate` string for one WPR card.

    If only one OPIF has remarks → return its remarks directly.
    If multiple OPIFs have remarks → stitch together as:
      "[ProgramName] (OPIF-XXXXXX): <remarks>  |  [ProgramName2] ..."
    OPIFs with no meaningful remarks are skipped.
    """
    parts: list[str] = []
    for oid in opif_ids:
        rec = scraped.get(oid)
        if not rec:
            continue
        remarks = rec.get("statusRemarks", "")
        if not remarks:
            continue
        if len(opif_ids) == 1 or (len(parts) == 0 and len(opif_ids) > 1):
            # Single-OPIF card, or first entry in a multi-OPIF card
            name = rec.get("title", oid)
            parts.append(f"{remarks}" if len(opif_ids) == 1
                         else f"{name} ({oid}): {remarks}")
        else:
            name = rec.get("title", oid)
            parts.append(f"{name} ({oid}): {remarks}")
    composed = "  |  ".join(parts)
    # Final safety truncation for the composed string
    if len(composed) > 400:
        composed = composed[:400].rsplit(" ", 1)[0] + "\u2026"
    return composed


def _write_recent_update(fpath: Path, card_id: str, update_text: str) -> bool:
    """
    Write (or replace) the `recentUpdate:` field inside the named card block.

    Returns True if the file was modified.
    """
    txt = fpath.read_text()
    # Locate the card by its id string
    id_pat = re.compile(r"\{\s*id\s*:\s*'" + re.escape(card_id) + r"'")
    m_id = id_pat.search(txt)
    if not m_id:
        return False

    # Walk braces to find the full card block
    start = m_id.start()
    depth, end = 0, start
    for i, ch in enumerate(txt[start:], start):
        if ch == "{": depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end <= start:
        return False

    block = txt[start:end]
    # Escape single quotes in update_text for a JS single-quoted string
    safe_text = update_text.replace("'", "\\'")
    new_field  = f"    recentUpdate: '{safe_text}',"

    if "recentUpdate:" in block:
        # Replace existing value (handles multi-line via greedy match)
        new_block = re.sub(
            r"    recentUpdate\s*:\s*'(?:[^'\\]|\\.)*',",
            new_field,
            block,
            count=1,
        )
    else:
        # Inject after `description:` line if present, else after `tag:`
        anchor = r"(    (?:description|tag)\s*:[^\n]+\n)"
        new_block, n = re.subn(anchor, r"\g<1>" + new_field + "\n", block, count=1)
        if n == 0:
            return False  # couldn't find an anchor — skip rather than corrupt

    if new_block == block:
        return False

    fpath.write_text(txt[:start] + new_block + txt[end:])
    return True


def update_wpr_status_remarks(
    scraped: dict[str, dict],
    dry_run: bool,
) -> list[dict]:
    """
    For every Critical Program card in the data-*.js files:
      1. Collect all OPIF IDs referenced in that card block.
      2. Compose a `recentUpdate` string from each OPIF's statusRemarks.
      3. Write the value back into the file (or report in dry-run mode).

    Returns a list of change records for the summary log.
    """
    changes: list[dict] = []

    for fname in DATA_FILES:
        fpath = BASE / fname
        if not fpath.exists():
            continue
        txt = fpath.read_text()

        # Find every card block that has tag: 'Critical Program'
        for m_id in re.finditer(r"\{\s*id\s*:\s*'([^']+)'", txt):
            card_id = m_id.group(1)
            start   = m_id.start()
            depth, end = 0, start
            for i, ch in enumerate(txt[start:], start):
                if ch == "{": depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        end = i + 1
                        break
            block = txt[start:end]
            if "Critical Program" not in block:
                continue

            opif_ids = _extract_card_opifs(block)
            if not opif_ids:
                Log.info(f"  ⚠ {card_id}: no OPIFs mapped — skipping remarks")
                continue

            new_update = _compose_card_remarks(opif_ids, scraped)
            if not new_update:
                Log.info(f"  ◌ {card_id}: all OPIFs have empty remarks — skipping")
                continue

            # Read current value for diff
            cur_m   = re.search(r"recentUpdate\s*:\s*'((?:[^'\\]|\\.)*)'" , block)
            cur_val = cur_m.group(1) if cur_m else ""

            if new_update == cur_val.replace("\\'", "'"):
                Log.info(f"  ✔ {card_id}: recentUpdate unchanged")
                continue

            changes.append({
                "card":  card_id,
                "file":  fname,
                "opifs": opif_ids,
                "from":  cur_val[:80] + ("…" if len(cur_val) > 80 else ""),
                "to":    new_update[:80] + ("…" if len(new_update) > 80 else ""),
            })

            if not dry_run:
                ok = _write_recent_update(fpath, card_id, new_update)
                if ok:
                    Log.info(f"  ✔ {card_id}: recentUpdate written "
                             f"(from {len(opif_ids)} OPIF(s))")
                else:
                    Log.warn(f"  {card_id}: failed to write recentUpdate")

    return changes


# ── Changelog ──────────────────────────────────────────────────────────────────
def update_changelog() -> None:
    txt = CHANGELOG_JS.read_text()
    txt = re.sub(r"const LAST_SYNC_DATE = '[^']+'",
                 f"const LAST_SYNC_DATE = '{NOW_PRETTY}'", txt)
    txt = re.sub(r"(Last sync:).*", rf"\1 {NOW_PRETTY}", txt)
    CHANGELOG_JS.write_text(txt)


# ── Subprocess helpers ─────────────────────────────────────────────────────────
def run(cmd: list[str], label: str) -> bool:
    res = subprocess.run(cmd, cwd=str(BASE), capture_output=True, text=True)
    if res.returncode != 0:
        Log.err(f"{label} failed:\n{res.stderr[:400]}")
        return False
    for line in res.stdout.strip().splitlines():
        Log.info(f"  {line}")
    Log.ok(label)
    return True


def git_commit(n: int, source: str) -> None:
    subprocess.run(["git", "add", "-A"], cwd=str(BASE), capture_output=True)
    diff = subprocess.run(
        ["git", "diff", "--cached", "--stat"],
        cwd=str(BASE), capture_output=True, text=True
    ).stdout.strip()
    if not diff:
        Log.info("Git: nothing new to commit")
        return
    msg = (
        f"sync({TODAY}): e2e-update — {n} card changes\n\n"
        f"Source: {source}\n"
        f"Built: portal-final.html\n"
        f"Published: test + prod via puppy.walmart.com"
    )
    subprocess.run(["git", "commit", "-m", msg], cwd=str(BASE), capture_output=True)
    stat = diff.splitlines()[-1] if diff else "no stat"
    Log.ok(f"Git committed ({stat})")


# ── Banner ─────────────────────────────────────────────────────────────────────
def banner(title: str) -> None:
    bar = "─" * 62
    Log.info(f"\n┌{bar}┐")
    Log.info(f"│  {title:<60}│")
    Log.info(f"└{bar}┘")


# ── Summary ────────────────────────────────────────────────────────────────────
def print_summary(
    t_start: float,
    errors: list[str],
    urls: list[str],
    source: str,
    changes: list[dict] | None = None,
    milestones: list[dict] | None = None,
) -> None:
    elapsed = time.monotonic() - t_start
    Log.info("")
    banner("Summary")
    icon = "✅" if not errors else "⚠️ "
    Log.info(f"{icon} Completed in {elapsed:.1f}s  |  Source: {source}")
    Log.info("")

    if changes:
        Log.info("📋 Program Card Changes:")
        for ch in changes:
            if "opif" in ch:
                # Status / date change from apply_changes()
                lbl = ch.get("toLbl") or ch["to"]
                Log.info(f"   {ch['opif']}  {ch['field']}: {ch['from']!r} → {lbl!r}")
            else:
                # recentUpdate change from update_wpr_status_remarks()
                Log.info(f"   {ch['card']} ({ch['file']})  recentUpdate refreshed")
        Log.info("")

    if milestones:
        Log.info("🗓  Upcoming Milestones (from Confluence):")
        for r in milestones[:8]:
            Log.info(f"   {r['module']:<40} {r['timeline']:<12} {r['status']}")
        Log.info("")

    if urls:
        Log.info("🔗 Live portals:")
        for url in urls:
            Log.info(f"   {url}")
        Log.info("")

    if errors:
        Log.info("⚠️  Warnings:")
        for e in errors:
            Log.info(f"   • {e}")
        Log.info("")

    Log.info("💡 Hard-refresh browser (⌘+Shift+R) to see latest content.")


# ── Main ───────────────────────────────────────────────────────────────────────
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run",    action="store_true")
    ap.add_argument("--no-publish", action="store_true")
    ap.add_argument("--test-only",  action="store_true")
    ap.add_argument("--build-only", action="store_true",
                    help="Skip Confluence pull, just rebuild + publish")
    args = ap.parse_args()

    t0     = time.monotonic()
    TOTAL  = 7
    errors : list[str] = []

    banner(f"E2E Fashion Portal — Full Refresh    {datetime.now():%Y-%m-%d %H:%M}")
    Log.info(f"Portal dir : {BASE}")
    Log.info(f"Mode       : {'DRY RUN' if args.dry_run else 'LIVE'}")
    Log.info("")

    # ── 1 · Pull Confluence data ───────────────────────────────────────────────
    Log.step(1, TOTAL, "Pull Confluence data")
    source        = "skipped (--build-only)"
    scraped_opifs : dict[str, dict] = {}
    timeline_rows : list[dict]      = []

    if not args.build_only:
        try:
            conf_data, source = pull_confluence_data()
            scraped_opifs  = parse_opif_records(conf_data)
            timeline_rows  = parse_timeline_rows(conf_data)
            Log.ok(f"Parsed {len(scraped_opifs)} OPIF records, "
                   f"{len(timeline_rows)} timeline rows  [{source}]")
        except RuntimeError as exc:
            Log.err(str(exc))
            errors.append("Confluence pull failed — used cached data")
            source = "failed"
    else:
        Log.info("  --build-only: skipping Confluence pull")

    # ── 2 · Detect + apply changes ────────────────────────────────────────────
    Log.step(2, TOTAL, "Detect + apply Program Card changes")
    all_changes: list[dict] = []

    if scraped_opifs and not args.dry_run:
        current = load_current_opifs()
        Log.info(f"  Portal has {len(current)} OPIF-linked cards")
        all_changes = apply_changes(current, scraped_opifs, dry_run=False)
        if all_changes:
            Log.ok(f"{len(all_changes)} status/date field(s) updated")
            for ch in all_changes:
                lbl = ch.get("toLbl") or ch["to"]
                Log.info(f"  {ch['opif']}  {ch['field']}: {ch['from']!r} → {lbl!r}")
        else:
            Log.ok("No status/date changes — portal already current")

        # Stitch Status Remarks from OPIF into WPR recentUpdate for all Critical cards
        Log.info("  ↳ Updating WPR Status Remarks for Critical Program cards…")
        remarks_changes = update_wpr_status_remarks(scraped_opifs, dry_run=False)
        if remarks_changes:
            Log.ok(f"{len(remarks_changes)} Critical card(s) recentUpdate written")
            for ch in remarks_changes:
                Log.info(f"  {ch['card']} ({ch['file']})")
                Log.info(f"    OPIFs : {ch['opifs']}")
                Log.info(f"    before: {ch['from']!r}")
                Log.info(f"    after : {ch['to']!r}")
        else:
            Log.ok("WPR Status Remarks already current — no changes")
        all_changes = all_changes + remarks_changes

    elif args.dry_run:
        Log.info("  DRY RUN: skipping card patches")

    # ── 3 · Stamp changelog ────────────────────────────────────────────────────
    Log.step(3, TOTAL, f"Stamp changelog → {NOW_PRETTY}")
    if not args.dry_run:
        update_changelog()
        Log.ok("data-changelog.js updated")
    else:
        Log.info("  DRY RUN: skipping")

    if args.dry_run:
        Log.info("\nDRY RUN complete — no files written.")
        return

    # ── 4 · Rebuild portal ────────────────────────────────────────────────────
    Log.step(4, TOTAL, "Build portal-inlined.html + portal-final.html")
    if not run([sys.executable, str(BASE / "build-inlined.py")], "build-inlined.py"):
        errors.append("Build failed — publish aborted")
        print_summary(t0, errors, [], source)
        sys.exit(1)

    # ── 5 · Inject OPIF guide ─────────────────────────────────────────────────
    Log.step(5, TOTAL, "Inject OPIF Field Guide")
    run([sys.executable, str(BASE / "add-opif-guide.py")], "add-opif-guide.py")

    # ── 6 · Publish ───────────────────────────────────────────────────────────
    urls: list[str] = []
    Log.step(6, TOTAL, "Publish" if not args.no_publish else "Publish — SKIPPED")

    if not args.no_publish:
        # Always publish to TEST first (canary preflight)
        Log.info("  → TEST (canary preflight)…")
        if run([sys.executable, str(BASE / "publish-portal.py"), "--test"], "Published TEST"):
            urls.append("https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-test")
        else:
            errors.append("TEST publish failed")

        # Only publish to PROD when --test-only is NOT set
        if not args.test_only:
            Log.info("  → PROD…")
            if run([sys.executable, str(BASE / "publish-portal.py"), "--prod"], "Published PROD"):
                urls.append("https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-prod")
            else:
                errors.append("PROD publish failed")

    # ── 7 · Git commit ────────────────────────────────────────────────────────
    Log.step(7, TOTAL, "Git commit")
    git_commit(len(all_changes), source)

    print_summary(t0, errors, urls, source, all_changes, timeline_rows)

    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
