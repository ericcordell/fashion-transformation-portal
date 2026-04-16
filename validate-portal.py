#!/usr/bin/env python3
"""validate-portal.py — Pre-publish sanity check for all program card data.

Parses every data-*.js card file and validates critical attributes before
anything is allowed to reach PROD.

Exit codes:
  0  — all clear (warnings may exist but nothing blocks publish)
  1  — one or more ERRORS found; PROD publish must be aborted

Usage:
  python3 validate-portal.py              # full report
  python3 validate-portal.py --critical  # only critical: true cards
  python3 validate-portal.py --quiet     # suppress warnings, only show errors
"""
from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Optional

BASE = Path(__file__).parent

# Files that contain program card arrays (exclude changelog, goals, etc.)
CARD_FILES = [
    'data-strategy.js',
    'data-design.js',
    'data-buying.js',
    'data-allocation.js',
]

VALID_STATUSES = {'completed', 'green', 'yellow', 'red', 'roadmap'}

# For critical cards, statusLabel must start with one of these prefixes
# (case-insensitive) to match its status value.
LABEL_PREFIX_MAP: dict[str, list[str]] = {
    'completed': ['complete'],
    'green':     ['green'],
    'yellow':    ['yellow'],
    'red':       ['red'],
    'roadmap':   ['roadmap'],
}

# Statuses that require an active target date on critical cards.
ACTIVE_STATUSES = {'green', 'yellow', 'red'}

DATE_RE = re.compile(
    r"(?:"
    r"\d{1,2}-[A-Za-z]{3}-\d{4}"                   # 01-Jan-2026
    r"|[A-Za-z]{3,9}[\s\-]\d{1,2},?\s?\d{4}"        # Jan 1, 2026 / Jan 1 2026
    r"|\d{4}-\d{2}-\d{2}"                            # 2026-01-15
    r"|Q[1-4]\s*(?:FY)?\d{2,4}"                      # Q1 FY27 / Q1 2027
    r"|[A-Za-z]{3,9}\s+\d{4}"                        # Nov 2026 / Jan 2027 (month + year)
    r"|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
      r"[\u2013\-\/][A-Za-z]{3,9}\s+\d{4}"           # Feb\u2013Apr 2026 / Feb-Apr 2026
    r")",
    re.IGNORECASE,
)


# ── Card data model ────────────────────────────────────────────────────────────

@dataclass
class Card:
    id:          str
    title:       str
    status:      str
    statusLabel: str
    targetDate:  str
    quarter:     str
    critical:    bool
    source_file: str
    errors:      list[str] = field(default_factory=list)
    warnings:    list[str] = field(default_factory=list)


# ── Parser ─────────────────────────────────────────────────────────────────────

def _extract(pattern: str, text: str, default: str = '') -> str:
    """Pull first capture group from text, stripping JS unicode escapes."""
    m = re.search(pattern, text)
    if not m:
        return default
    val = m.group(1)
    # Decode \uXXXX sequences so we compare clean strings
    val = val.encode().decode('unicode_escape', errors='replace')
    return val.strip()


def parse_cards(files: list[str]) -> list[Card]:
    cards: list[Card] = []
    id_re = re.compile(r"\{\s*id\s*:\s*'([^']+)'")

    for fname in files:
        fpath = BASE / fname
        if not fpath.exists():
            continue
        txt = fpath.read_text('utf-8')

        for m_id in id_re.finditer(txt):
            # Brace-match to extract the full card object
            start = m_id.start()
            depth, end = 0, start
            for i, ch in enumerate(txt[start:], start):
                if ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0:
                        end = i + 1
                        break
            block = txt[start:end]

            cid    = m_id.group(1)
            title  = _extract(r"title\s*:\s*'([^']+)'",       block)
            status = _extract(r"(?<!\w)status\s*:\s*'([^']+)'", block)
            label  = _extract(r"statusLabel\s*:\s*'([^']+)'",  block)
            date   = _extract(r"targetDate\s*:\s*'([^']+)'",   block)
            qtr    = _extract(r"quarter\s*:\s*'([^']+)'",      block)
            crit   = bool(re.search(r"critical\s*:\s*true", block))

            # Skip non-card objects (e.g. nested helper objects)
            if not status and not label:
                continue

            cards.append(Card(
                id=cid, title=title, status=status, statusLabel=label,
                targetDate=date, quarter=qtr, critical=crit,
                source_file=fname,
            ))
    return cards


# ── Validation rules ───────────────────────────────────────────────────────────

def _looks_like_date(val: str) -> bool:
    return bool(DATE_RE.search(val))


# Month-name → number map for date parsing
_MONTHS = {
    'jan':1,'feb':2,'mar':3,'apr':4,'may':5,'jun':6,
    'jul':7,'aug':8,'sep':9,'oct':10,'nov':11,'dec':12,
}

def _parse_date(val: str) -> Optional[date]:
    """Try to parse a targetDate string into a date object.
    Returns None if the value is a range, quarter ref, or unparseable.
    Only attempts parsing on unambiguous specific dates.
    """
    if not val:
        return None
    # Skip ranges (en-dash, hyphen-range) and quarter refs — not specific enough
    if '\u2013' in val or re.search(r'Q[1-4]', val, re.I) or '\u2014' in val:
        return None
    # Patterns: "Apr 30, 2026" / "Apr 30 2026" / "April 30, 2026" / "30 Apr 2026"
    m = re.search(
        r'([A-Za-z]{3,9})[\s.]+([0-9]{1,2}),?\s+([0-9]{4})',
        val
    )
    if m:
        month_str = m.group(1)[:3].lower()
        month = _MONTHS.get(month_str)
        if month:
            try:
                return date(int(m.group(3)), month, int(m.group(2)))
            except ValueError:
                return None
    # ISO: 2026-04-30
    m = re.match(r'(\d{4})-(\d{2})-(\d{2})$', val.strip())
    if m:
        try:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            return None
    return None


def validate(card: Card) -> None:
    """Populate card.errors and card.warnings in-place."""

    # ── Rule 1: status must be a known value ──────────────────────────────────
    if not card.status:
        card.errors.append("status is missing")
    elif card.status not in VALID_STATUSES:
        card.errors.append(f"status '{card.status}' is not a valid value "
                           f"(must be one of: {', '.join(sorted(VALID_STATUSES))})")

    # ── Rule 2: statusLabel must not be empty ─────────────────────────────────
    if not card.statusLabel:
        card.errors.append("statusLabel is empty")

    # ── Rule 3: critical cards — statusLabel must match status prefix ─────────
    if card.critical and card.status in LABEL_PREFIX_MAP and card.statusLabel:
        prefixes = LABEL_PREFIX_MAP[card.status]
        label_lower = card.statusLabel.lower()
        if not any(label_lower.startswith(p) for p in prefixes):
            card.errors.append(
                f"statusLabel '{card.statusLabel}' does not match "
                f"status '{card.status}' "
                f"(expected label starting with: {prefixes[0].title()!r})"
            )
    elif not card.critical and card.status in LABEL_PREFIX_MAP and card.statusLabel:
        # Non-critical: warn only
        prefixes = LABEL_PREFIX_MAP[card.status]
        label_lower = card.statusLabel.lower()
        if not any(label_lower.startswith(p) for p in prefixes):
            card.warnings.append(
                f"statusLabel '{card.statusLabel}' may not match "
                f"status '{card.status}'"
            )

    # ── Rule 4: critical active cards must have a targetDate ──────────────────
    if card.critical and card.status in ACTIVE_STATUSES and not card.targetDate:
        card.errors.append(
            f"targetDate is missing (required for critical '{card.status}' cards)"
        )
    elif not card.critical and card.status in ACTIVE_STATUSES and not card.targetDate:
        card.warnings.append("targetDate is missing for an active card")

    # ── Rule 5: if targetDate is set, it must look like a real date ─────────────
    if card.targetDate and not _looks_like_date(card.targetDate):
        # Garbage text in targetDate — error for critical, warning for others
        msg = f"targetDate '{card.targetDate}' does not look like a valid date"
        if card.critical:
            card.errors.append(msg)
        else:
            card.warnings.append(msg)

    # ── Rule 6: non-completed cards must not have a specific past targetDate ───
    if card.status != 'completed' and card.targetDate:
        parsed = _parse_date(card.targetDate)
        if parsed and parsed < date.today():
            msg = (f"targetDate '{card.targetDate}' is in the past — "
                   f"verify status against source of truth before publishing")
            if card.critical:
                card.errors.append(msg)
            else:
                card.warnings.append(msg)


# ── Reporting ──────────────────────────────────────────────────────────────────

RESET  = '\033[0m'
BOLD   = '\033[1m'
RED    = '\033[31m'
YELLOW = '\033[33m'
GREEN  = '\033[32m'
CYAN   = '\033[36m'
DIM    = '\033[2m'

STATUS_ICON = {
    'completed': '✅',
    'green':     '🟢',
    'yellow':    '🟡',
    'red':       '🔴',
    'roadmap':   '🗺️ ',
    '':          '❓',
}


def _fmt_date(val: str) -> str:
    if not val:
        return DIM + '—' + RESET
    ok = _looks_like_date(val)
    color = RESET if ok else RED
    return f"{color}{val}{RESET}"


def report(cards: list[Card], critical_only: bool, quiet: bool) -> int:
    """Print validation report. Returns number of error-bearing cards."""
    display = [c for c in cards if not critical_only or c.critical]
    error_count   = sum(1 for c in display if c.errors)
    warning_count = sum(1 for c in display if c.warnings and not c.errors)

    width = 70
    print(f"\n{BOLD}{'─' * width}{RESET}")
    print(f"{BOLD}  Portal Card Validation{RESET}  "
          f"{'(critical only)' if critical_only else ''}")
    print(f"{'─' * width}{RESET}")

    for card in display:
        icon = STATUS_ICON.get(card.status, '❓')
        crit = f"{BOLD}★{RESET} " if card.critical else "  "
        file_lbl = DIM + card.source_file + RESET
        print(f"\n{crit}{icon}  {BOLD}{card.title}{RESET}  {DIM}({card.id}){RESET}")
        print(f"     {file_lbl}")
        print(f"     status:      {CYAN}{card.status or '(missing)'}{RESET}"
              f"   label: {card.statusLabel or DIM + '(empty)' + RESET}")
        print(f"     targetDate:  {_fmt_date(card.targetDate)}"
              f"   quarter: {DIM}{card.quarter or '—'}{RESET}")

        for err in card.errors:
            print(f"     {RED}✖ ERROR:  {err}{RESET}")
        if not quiet:
            for warn in card.warnings:
                print(f"     {YELLOW}⚠ WARN:   {warn}{RESET}")
        if not card.errors and not card.warnings:
            print(f"     {GREEN}✔ OK{RESET}")

    print(f"\n{'─' * width}")
    total = len(display)
    ok    = total - error_count - warning_count
    print(f"  {total} cards checked  ·  "
          f"{GREEN}{ok} OK{RESET}  ·  "
          f"{YELLOW}{warning_count} warnings{RESET}  ·  "
          f"{RED}{error_count} errors{RESET}")
    print(f"{'─' * width}\n")

    if error_count:
        print(f"{RED}{BOLD}❌ Validation FAILED — fix errors above before publishing to PROD.{RESET}\n")
    else:
        print(f"{GREEN}{BOLD}✅ Validation passed — safe to publish.{RESET}\n")

    return error_count


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--critical', action='store_true',
                    help='Show only critical: true cards')
    ap.add_argument('--quiet', action='store_true',
                    help='Suppress warnings, only show errors')
    args = ap.parse_args()

    cards = parse_cards(CARD_FILES)
    for card in cards:
        validate(card)

    error_count = report(cards, critical_only=args.critical, quiet=args.quiet)
    sys.exit(1 if error_count else 0)


if __name__ == '__main__':
    main()
