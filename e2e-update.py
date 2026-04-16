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
    1. Pull fresh Confluence data via REST API (uses Chrome cookies for auth)
       - Fallback: last good archived export if API call fails
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
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime
from html.parser import HTMLParser
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

CONFLUENCE_URL = (
    "https://confluence.walmart.com/display/APREC/"
    "Long+Lead+Time+Transformation+Work+Management+Dashboard"
)
CONFLUENCE_BASE    = "https://confluence.walmart.com"
CONFLUENCE_PAGE_ID = "3276735219"  # Long Lead Time Transformation Work Management Dashboard

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
    "initial requirements": ("roadmap",  "Roadmap — Initial Requirements"),
    "backlog":              ("roadmap",  "Roadmap"),
    "not started":          ("roadmap",  "Roadmap"),
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


# ── Confluence REST API extraction ─────────────────────────────────────────────
# Uses Chrome cookies for auth — no browser permissions or AppleScript required.
# browser_cookie3 reads Chrome’s local cookie store directly.


class _TableParser(HTMLParser):
    """Pull text from every <td>/<th> in an HTML string into row dicts."""
    def __init__(self):
        super().__init__()
        self.results: list[dict] = []
        self._row: list[str]    = []
        self._cell: list[str]   = []
        self._in_cell: bool     = False
        self.table_idx: int     = 0
        self.row_idx: int       = 0

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.table_idx += 1
            self.row_idx    = 0
        elif tag == "tr":
            self._row     = []
            self.row_idx += 1
        elif tag in ("td", "th"):
            self._cell    = []
            self._in_cell = True

    def handle_endtag(self, tag):
        if tag in ("td", "th"):
            self._row.append(" ".join(self._cell).strip())
            self._in_cell = False
        elif tag == "tr":
            if self._row and any(self._row):
                self.results.append({
                    "table": self.table_idx,
                    "row":   self.row_idx,
                    "cells": self._row,
                })

    def handle_data(self, data):
        if self._in_cell:
            self._cell.append(data.strip())


def _confluence_api_extract() -> dict | None:
    """Fetch the LLTT dashboard via Confluence REST API using Chrome cookies.

    Returns the same structure as the old Chrome extraction so the rest of
    the pipeline is unchanged:
      {
        success:       True,
        url:           <page url>,
        title:         <page title>,
        tablesFound:   <int>,
        rowsExtracted: <int>,
        data:          [{table, row, cells}, ...]
      }
    Returns None on any failure.
    """
    try:
        import browser_cookie3
        jar        = browser_cookie3.chrome(domain_name=".walmart.com")
        cookie_hdr = "; ".join(f"{c.name}={c.value}" for c in jar)
    except Exception as exc:
        Log.warn(f"browser_cookie3 failed: {exc}")
        return None

    url = (
        f"{CONFLUENCE_BASE}/rest/api/content/{CONFLUENCE_PAGE_ID}"
        "?expand=body.export_view"
    )
    req = urllib.request.Request(url, headers={
        "Cookie":     cookie_hdr,
        "Accept":     "application/json",
        "User-Agent": "Mozilla/5.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        Log.warn(f"Confluence API HTTP {exc.code}: {exc.read().decode()[:200]}")
        return None
    except Exception as exc:
        Log.warn(f"Confluence API request failed: {exc}")
        return None

    html  = payload.get("body", {}).get("export_view", {}).get("value", "")
    title = payload.get("title", "")
    if not html:
        Log.warn("Confluence API returned empty body")
        return None

    parser = _TableParser()
    parser.feed(html)
    rows = parser.results

    return {
        "success":       True,
        "url":           CONFLUENCE_URL,
        "title":         title,
        "tablesFound":   parser.table_idx,
        "rowsExtracted": len(rows),
        "data":          rows,
    }


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

    Log.info("Fetching via Confluence REST API…")
    fresh = _confluence_api_extract()
    if fresh and fresh.get("rowsExtracted", 0) > 0:
        archive = EXPORTS_DIR / f"archive_{TIMESTAMP}.json"
        LATEST_JSON.write_text(json.dumps(fresh))
        archive.write_text(json.dumps(fresh))
        rows   = fresh['rowsExtracted']
        tables = fresh['tablesFound']
        Log.ok(f"REST API — {rows} rows from {tables} tables ✨")
        return fresh, "live Confluence (REST API)"

    Log.warn("REST API extraction failed — falling back to last good archive")
    fallback = _latest_archive()
    if fallback:
        payload = json.loads(fallback.read_text())
        LATEST_JSON.write_text(fallback.read_text())
        mtime = datetime.fromtimestamp(fallback.stat().st_mtime).strftime("%b %-d, %Y")
        Log.ok(f"Using archive from {mtime} ({payload.get('rowsExtracted', 0)} rows)")
        return payload, f"archive ({mtime})"

    raise RuntimeError(
        "No Confluence data available.\n"
        "  → Ensure you are on Walmart VPN/WiFi and logged into Chrome at:\n"
        f"    {CONFLUENCE_URL}"
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
# Status columns we check in priority order when cells[7] is not a RAG color.
# The LLTT page has multiple sub-tables with different column offsets.
_STATUS_COL_CANDIDATES = [7, 8, 9, 12, 13]


def _find_rag_col(cells: list[str]) -> int | None:
    """Return the index of the first cell that is exactly a RAG color, or None."""
    for idx in _STATUS_COL_CANDIDATES:
        if idx < len(cells) and cells[idx].strip().lower() in _RAG_COLORS:
            return idx
    return None


def parse_opif_records(data: dict) -> dict[str, dict]:
    """
    Extract OPIF records from Confluence table data.

    The LLTT Confluence page has two sub-table formats:

    Type A — Main LLTT dashboard (OPIF ID in cells[0]):
      cells[7]  = RAG status (Green/Yellow/Red) — standard layout
      cells[12] = RAG status — alternate AEX sub-table layout
      cells[16] = target date

    Type B — Cross-reference summary table (OPIF ID in cells[5]):
      cells[8]  = status text (e.g. 'Initial Requirements', 'Yellow')
      No fixed target date column — scan for date pattern

    We handle both by:
      1. Searching cells[:7] for OPIF ID (not just cells[:3]).
      2. Calling _find_rag_col() to find the actual status column.
      3. Using column-based date extraction for Type A, scan-based for Type B.
    """
    opif_re = re.compile(r"OPIF-\d+")

    # Group all rows by the first OPIF ID found in cells[:7].
    # Track which column index the ID came from so date-extraction skips it.
    candidates: dict[str, list[tuple[list[str], int]]] = {}
    for row_obj in data.get("data", []):
        cells = row_obj.get("cells", [])
        opif_id = None
        opif_col = -1
        for idx, cell in enumerate(cells[:7]):
            m = opif_re.match(cell.strip())
            if m:
                opif_id  = m.group(0)
                opif_col = idx
                break
        if opif_id:
            candidates.setdefault(opif_id, []).append((cells, opif_col))

    records: dict[str, dict] = {}
    for opif_id, row_tuples in candidates.items():
        rows     = [t[0] for t in row_tuples]
        # opif_col is consistent within a candidate group — take first
        opif_col = row_tuples[0][1]

        # Prefer rows that contain a RAG color anywhere in _STATUS_COL_CANDIDATES
        rag_rows = [r for r in rows if _find_rag_col(r) is not None]
        best     = rag_rows[0] if rag_rows else max(rows, key=len)

        rag_col    = _find_rag_col(best)
        is_type_a  = opif_col == 0   # OPIF ID was in cells[0] (main table layout)
        program    = best[1].strip() if len(best) > 1 else ""

        if rag_col is not None:
            raw_status = best[rag_col].strip().lower()
        else:
            # No RAG color found — try a known-status keyword scan
            raw_status = ""
            for c in best:
                cl = c.strip().lower()
                if cl in STATUS_MAP:
                    raw_status = cl
                    break

        tpm    = best[12].strip() if is_type_a and len(best) > 12 and rag_col == 7 else ""
        pm     = best[13].strip() if is_type_a and len(best) > 13 and rag_col == 7 else ""
        x_rank = best[5].strip()  if is_type_a and len(best) > 5  and rag_col == 7 else ""

        # ── Target date extraction ────────────────────────────────────────────
        # date_pat: strict match so we don't confuse remarks text for dates.
        date_pat = re.compile(
            r"^(?:\d{1,2}-)?[A-Z][a-z]{2,8}[\s\-]\d{1,2},?[\s\-]?\d{4}$"
            r"|^\d{4}-\d{2}-\d{2}$"
            r"|^Q[1-4]\s*FY\d{2,4}$",
            re.I,
        )

        def _is_date(s: str) -> bool:
            return bool(date_pat.match(s.strip()))

        target = ""
        if rag_col == 7:
            # Standard main table: date at cells[16], fallback cells[17]
            c16 = best[16].strip() if len(best) > 16 else ""
            c17 = best[17].strip() if len(best) > 17 else ""
            target = c16 if _is_date(c16) else (c17 if _is_date(c17) else "")
        elif rag_col == 12:
            # AEX sub-table: date at cells[5] or cells[13]
            c5  = best[5].strip()  if len(best) > 5  else ""
            c13 = best[13].strip() if len(best) > 13 else ""
            target = c5 if _is_date(c5) else (c13 if _is_date(c13) else "")
        # Scan fallback for all cases (Type C / no RAG / date not in expected col).
        # Explicitly skip opif_col so we don't mistake the ID for a date.
        if not target:
            for idx in [5, 13, 16, 17, 3, 4, 15, 29]:
                if idx == opif_col:
                    continue
                val = best[idx].strip() if len(best) > idx else ""
                if _is_date(val):
                    target = val
                    break

        # Status remarks: col 20 for standard rows; col 11 for Type C
        raw_remarks = ""
        if is_type_a:
            # Prefer cells[20] (full dated notes); fall back to cells[19] then cells[11]
            for col in [20, 19, 11]:
                val = best[col].strip() if len(best) > col else ""
                if val and not val.lstrip('0123456789.-').lstrip() == "":
                    raw_remarks = val
                    break

        status_key, status_label = STATUS_MAP.get(
            raw_status,
            STATUS_MAP.get(
                next((k for k in STATUS_MAP if k in raw_status), ""),
                ("", raw_status.title()),
            ),
        )

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
def load_current_opifs() -> dict[str, dict]:  # noqa: F811  (clean redefinition)
    """
    Map every OPIF-ID found in the data files to the card that *owns* it.

    Three-tier ownership priority (highest wins):
      1. OPIF appears as the first argument to res(...) in a card block
         i.e. resources: res('https://jira.walmart.com/browse/OPIF-XXXXX', ...)
         This is the canonical Primary OPIF for that card.
      2. OPIF appears in any jira.walmart.com/browse/OPIF-XXXXX URL anywhere
         in the card block (linked but not primary).
      3. First card block where the OPIF appears anywhere in text (fallback).

    This prevents related/cross-referenced OPIFs from stealing ownership
    from the card that actually drives the OPIF.
    """
    primary:  dict[str, dict] = {}   # res() first arg  — definitive owner
    linked:   dict[str, dict] = {}   # any jira URL in the block
    fallback: dict[str, dict] = {}   # first text mention

    opif_re       = re.compile(r"OPIF-\d+")
    jira_re       = re.compile(r"jira\.walmart\.com/browse/(OPIF-\d+)")
    # res() first-arg pattern: res( 'https://jira.walmart.com/browse/OPIF-XXXXX'
    res_primary_re = re.compile(
        r"res\s*\(\s*'https://jira\.walmart\.com/browse/(OPIF-\d+)'"
    )

    for fname in DATA_FILES:
        fpath = BASE / fname
        if not fpath.exists():
            continue
        txt = fpath.read_text()

        for m_id in re.finditer(r"\{\s*id\s*:\s*'([^']+)'", txt):
            start = m_id.start()
            depth, end = 0, start
            for i, ch in enumerate(txt[start:], start):
                if ch == '{': depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0: end = i + 1; break
            block = txt[start:end]

            status_m = re.search(r"status:\s*'([^']*)'",      block)
            label_m  = re.search(r"statusLabel:\s*'([^']*)'", block)
            date_m   = re.search(r"targetDate:\s*'([^']*)'",  block)
            entry = {
                "file":        fname,
                "status":      status_m.group(1) if status_m else "",
                "statusLabel": label_m.group(1)  if label_m  else "",
                "targetDate":  date_m.group(1)   if date_m   else "",
            }

            # Tier 1 — primary: res() first arg
            for oid in dict.fromkeys(res_primary_re.findall(block)):
                if oid not in primary:
                    primary[oid] = entry

            # Tier 2 — linked: any jira URL
            for oid in dict.fromkeys(jira_re.findall(block)):
                if oid not in linked:
                    linked[oid] = entry

            # Tier 3 — fallback: any mention
            for oid in dict.fromkeys(opif_re.findall(block)):
                if oid not in fallback:
                    fallback[oid] = entry

    # Merge: primary wins; fill gaps with linked, then fallback
    found = {**fallback, **linked, **primary}
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

        # Never overwrite a card the PM has intentionally marked 'completed'.
        # Completed = done. The OPIF may still be open in Jira for trailing
        # work, but the portal card represents a shipped deliverable.
        if cur.get("status") == "completed":
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
