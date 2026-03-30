#!/usr/bin/env python3
"""sync-from-jira.py — Pull OPIF field data from Jira and update portal cards.

Usage:
    python3 sync-from-jira.py --token YOUR_PAT_TOKEN
    python3 sync-from-jira.py --token YOUR_PAT_TOKEN --dry-run
    python3 sync-from-jira.py --token YOUR_PAT_TOKEN --opif OPIF-344926

Jira fields pulled per OPIF:
    - Status Color     → card status
    - Due Date         → card targetDate
    - Target Quarter   → card quarter
    - Priority         → card priority
    - Tech Rank        → card techRank (blank = backlog)
    - Activity Type    → part of statusLabel
    - Assignee         → shown in card details
"""
import re
import sys
import json
import argparse
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime

BASE        = Path(__file__).parent
JIRA_URL    = "https://jira.walmart.com"
DATA_FILES  = ["data-strategy.js", "data-design.js", "data-buying.js", "data-allocation.js"]

# ── Jira custom field IDs (standard OPIF project fields) ───────────────────
# These may need adjusting — run with --probe to discover your instance's IDs
FIELD_MAP = {
    "status_color":    "customfield_status_color",   # will be resolved at runtime
    "target_quarter":  "customfield_target_quarter",
    "activity_type":   "customfield_activity_type",
    "tech_rank":       "customfield_tech_rank",
    "due_date":        "duedate",
    "priority":        "priority",
    "assignee":        "assignee",
    "status":          "status",
}

STATUS_COLOR_MAP = {
    "green":   "green",
    "yellow":  "yellow",
    "amber":   "yellow",
    "red":     "red",
    "blue":    "green",    # sometimes used for 'in progress on track'
}


def jira_get(path: str, token: str) -> dict:
    """Make an authenticated GET request to the Jira REST API."""
    url = f"{JIRA_URL}{path}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept":        "application/json",
        "Content-Type":  "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 401:
            print(f"\n❌ 401 Unauthorized — your token is invalid or expired.")
            print("   Generate a new one at: https://jira.walmart.com/secure/ViewProfile.jspa")
            sys.exit(1)
        if e.code == 403:
            print(f"\n❌ 403 Forbidden — you don't have permission to view {path}")
            sys.exit(1)
        raise RuntimeError(f"Jira API error {e.code}: {body[:200]}")


def probe_custom_fields(token: str) -> dict:
    """Discover all custom field IDs on this Jira instance and find OPIF-relevant ones."""
    print("🔍 Probing Jira custom fields...")
    fields = jira_get("/rest/api/2/field", token)
    found = {}
    keywords = [
        "status color", "statuscolor", "color",
        "target quarter", "quarter",
        "activity type", "activity",
        "tech rank", "techrank", "rank",
    ]
    for f in fields:
        name_lower = f["name"].lower()
        fid = f["id"]
        for kw in keywords:
            if kw in name_lower:
                found[f["name"]] = fid
                break
    return found


def fetch_opif(opif_id: str, token: str, field_ids: dict) -> dict:
    """Fetch a single OPIF and extract all portal-relevant fields."""
    # Request all fields so we can inspect
    data = jira_get(f"/rest/api/2/issue/{opif_id}", token)
    fields = data.get("fields", {})

    # Priority
    priority_raw = fields.get("priority", {})
    priority = priority_raw.get("name", "") if priority_raw else ""
    # Normalize P1/P2/P3
    if priority and not priority.startswith("P"):
        p_map = {"highest": "P1", "high": "P1", "medium": "P2", "low": "P3", "lowest": "P3"}
        priority = p_map.get(priority.lower(), priority)

    # Status (workflow)
    status_name = fields.get("status", {}).get("name", "")

    # Due date
    due_raw = fields.get("duedate", "")
    due_formatted = ""
    if due_raw:
        try:
            dt = datetime.strptime(due_raw, "%Y-%m-%d")
            due_formatted = dt.strftime("%b %-d, %Y")   # e.g. "Jul 31, 2026"
        except ValueError:
            due_formatted = due_raw

    # Assignee
    assignee_raw = fields.get("assignee") or {}
    assignee = assignee_raw.get("displayName", "")

    # Custom fields — try each discovered ID
    status_color  = ""
    target_quarter = ""
    activity_type  = ""
    tech_rank      = ""

    for field_name, field_id in field_ids.items():
        val = fields.get(field_id)
        if val is None:
            continue
        name_lower = field_name.lower()

        if "status color" in name_lower or "statuscolor" in name_lower:
            raw = val.get("value", val) if isinstance(val, dict) else str(val)
            status_color = STATUS_COLOR_MAP.get(raw.lower(), raw.lower())

        elif "quarter" in name_lower:
            target_quarter = val.get("value", val) if isinstance(val, dict) else str(val)

        elif "activity" in name_lower:
            activity_type = val.get("value", val) if isinstance(val, dict) else str(val)

        elif "rank" in name_lower:
            tech_rank = str(val) if val else ""

    # Derive status color from workflow status if custom field is empty
    if not status_color:
        sl = status_name.lower()
        if any(w in sl for w in ["done", "complete", "closed"]):
            status_color = "completed"
        elif any(w in sl for w in ["block", "risk", "red"]):
            status_color = "red"
        elif any(w in sl for w in ["progress", "active", "open", "sizing", "discovery"]):
            status_color = "yellow"
        elif any(w in sl for w in ["backlog", "todo", "future"]):
            status_color = "backlog"
        else:
            status_color = "yellow"   # default: yellow = needs attention

    # Derive quarter from due date if not in custom field
    if not target_quarter and due_raw:
        try:
            dt = datetime.strptime(due_raw, "%Y-%m-%d")
            month = dt.month
            # Walmart FY: Feb=Q1, May=Q2, Aug=Q3, Nov=Q4
            if month in [2, 3, 4]:   target_quarter = "Q1"
            elif month in [5, 6, 7]: target_quarter = "Q2"
            elif month in [8, 9, 10]:target_quarter = "Q3"
            else:                    target_quarter = "Q4"
        except ValueError:
            pass

    # Build status label
    if status_color == "completed":
        status_label = "Completed"
    elif activity_type:
        color_word = {"green": "Green", "yellow": "Yellow", "red": "Red"}.get(status_color, status_color.capitalize())
        status_label = f"{color_word} \u2014 {activity_type}"
    else:
        status_label = {"green": "Green \u2014 On Track", "yellow": "Yellow \u2014 In Progress",
                        "red": "Red \u2014 At Risk", "backlog": "Backlog",
                        "completed": "Completed"}.get(status_color, status_color.capitalize())

    return {
        "opif":           opif_id,
        "jira_status":    status_name,
        "status_color":   status_color,
        "status_label":   status_label,
        "target_quarter": target_quarter,
        "activity_type":  activity_type,
        "due_date":       due_formatted,
        "priority":       priority,
        "tech_rank":      tech_rank,
        "assignee":       assignee,
    }


def extract_cards_from_file(path: Path) -> list:
    """Extract card blocks and their primary OPIF IDs from a data JS file."""
    content = path.read_text()
    cards = []
    parts = re.split(r'\n  \{', content)
    for part in parts[1:]:
        block = '  {' + part.split('\n  },')[0] + '\n  },'
        id_m  = re.search(r"id:\s*'([^']+)'", block)
        if not id_m:
            continue
        opifs = re.findall(r'OPIF-(\d+)', block)
        if not opifs:
            continue
        cards.append({
            "file":       path,
            "card_id":    id_m.group(1),
            "opif":       f"OPIF-{opifs[0]}",
            "block":      block,
            "all_opifs":  [f"OPIF-{o}" for o in opifs],
        })
    return cards


def apply_jira_data_to_file(path: Path, updates: dict, dry_run: bool) -> int:
    """Apply fetched Jira field data to matching cards in a JS data file."""
    content = path.read_text()
    changed = 0

    for opif_id, jira in updates.items():
        # Find all cards in this file that reference this OPIF
        for card in extract_cards_from_file(path):
            if card["opif"] != opif_id:
                continue

            old_block = card["block"]
            new_block = old_block

            def replace_field(block, key, value):
                return re.sub(rf"({key}:\s*')[^']*(')", rf"\g<1>{value}\g<2>", block)

            if jira["status_color"]:
                new_block = replace_field(new_block, "status",      jira["status_color"])
                new_block = replace_field(new_block, "statusLabel",  jira["status_label"])

            if jira["target_quarter"]:
                new_block = replace_field(new_block, "quarter",     jira["target_quarter"])

            if jira["due_date"]:
                new_block = replace_field(new_block, "targetDate",  jira["due_date"])

            if jira["priority"]:
                if "priority:" in new_block:
                    new_block = replace_field(new_block, "priority", jira["priority"])
                else:
                    new_block = re.sub(
                        r"(tag:\s*'[^']*',)",
                        rf"\g<1>\n    priority: '{jira['priority']}',",
                        new_block
                    )

            if jira["tech_rank"]:
                if "techRank:" in new_block:
                    new_block = re.sub(r"(techRank:\s*)\d+", rf"\g<1>{jira['tech_rank']}", new_block)
                else:
                    new_block = re.sub(
                        r"(priority:\s*'[^']*',)",
                        rf"\g<1>\n    techRank: {jira['tech_rank']},",
                        new_block
                    )

            if new_block != old_block:
                content = content.replace(old_block, new_block, 1)
                changed += 1
                print(f"   {'[DRY RUN] ' if dry_run else ''}✓ {card['card_id']:35s} "
                      f"→ {jira['status_color']:8s} | {jira['due_date']:18s} | "
                      f"{jira['priority']:4s} | rank {jira['tech_rank']}")

    if changed > 0 and not dry_run:
        path.write_text(content)

    return changed


def _load_token_from_env() -> str:
    """Read JIRA_TOKEN from .env in the project directory (if present)."""
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line.startswith('JIRA_TOKEN=') and not line.startswith('#'):
                return line.split('=', 1)[1].strip().strip('"').strip("'")
    return ''


def main():
    parser = argparse.ArgumentParser(description="Sync OPIF data from Jira into portal data files.")
    parser.add_argument("--token",   default='', help="Jira Personal Access Token (or set JIRA_TOKEN in .env)")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    parser.add_argument("--opif",    help="Sync a single OPIF (e.g. OPIF-344926)")
    parser.add_argument("--probe",   action="store_true", help="Print all custom field IDs and exit")
    args = parser.parse_args()

    # Resolve token: CLI flag → .env → fail with helpful message
    token = args.token or _load_token_from_env()
    if not token:
        print("\n❌ No Jira token found.")
        print("   Generate one:  python3 generate-jira-pat.py")
        print("   Then save it:  echo 'JIRA_TOKEN=<paste_token>' >> .env")
        print("   Or pass it:    --token <your_token>")
        sys.exit(1)

    print("\n🐶 OPIF → Portal Sync")
    print(   "━" * 60)

    # Step 1: probe custom fields
    field_ids = probe_custom_fields(token)
    if args.probe:
        print("\n📋 Discovered OPIF-relevant custom fields:")
        for name, fid in sorted(field_ids.items()):
            print(f"   {fid:30s} → {name}")
        return

    if field_ids:
        print(f"   Found {len(field_ids)} relevant custom fields: {list(field_ids.keys())}")
    else:
        print("   ⚠️  No custom fields matched keywords — will use standard fields only")
        print("   💡 Run with --probe to inspect all fields on your Jira instance")

    # Step 2: collect all cards with OPIFs
    print("\n📂 Scanning portal data files...")
    all_cards = []
    for fname in DATA_FILES:
        fpath = BASE / fname
        if not fpath.exists():
            continue
        cards = extract_cards_from_file(fpath)
        print(f"   {fname:25s} → {len(cards)} OPIF-linked cards")
        all_cards.extend(cards)

    # Filter if --opif specified
    if args.opif:
        all_cards = [c for c in all_cards if c["opif"] == args.opif.upper()]
        if not all_cards:
            print(f"\n❌ No cards found referencing {args.opif}")
            sys.exit(1)

    # Deduplicate OPIFs to fetch
    opif_ids = sorted(set(c["opif"] for c in all_cards))
    print(f"\n🔗 Fetching {len(opif_ids)} unique OPIFs from Jira...")
    if args.dry_run:
        print("   [DRY RUN MODE — no files will be written]")

    # Step 3: fetch each OPIF
    jira_data = {}
    errors = []
    for opif_id in opif_ids:
        try:
            result = fetch_opif(opif_id, token, field_ids)
            jira_data[opif_id] = result
            status_icon = {"green": "🟢", "yellow": "🟡", "red": "🔴",
                           "backlog": "⬜", "completed": "✅"}.get(result["status_color"], "❔")
            print(f"   {status_icon} {opif_id:15s} → {result['jira_status']:30s} | {result['due_date']:18s} | {result['priority']}")
        except Exception as e:
            errors.append((opif_id, str(e)))
            print(f"   ❌ {opif_id:15s} → ERROR: {e}")

    # Step 4: apply to files
    print(f"\n📝 Applying updates to portal data files...")
    total_changed = 0
    for fname in DATA_FILES:
        fpath = BASE / fname
        if not fpath.exists():
            continue
        n = apply_jira_data_to_file(fpath, jira_data, args.dry_run)
        if n:
            print(f"   {fname}: {n} card(s) updated")
        total_changed += n

    # Step 5: summary
    print(f"\n{'━'*60}")
    print(f"✅ Sync complete — {total_changed} card(s) updated across {len(DATA_FILES)} files")
    if errors:
        print(f"\n⚠️  {len(errors)} OPIF(s) failed to fetch:")
        for opif_id, err in errors:
            print(f"   {opif_id}: {err}")

    if total_changed > 0 and not args.dry_run:
        print("\n📋 Next steps:")
        print("   1. Review: git diff")
        print("   2. Rebuild: python3 build-inlined.py")
        print("   3. Preview: open portal-inlined.html")
        print("   4. Deploy:  (share-puppy or manual upload)")


if __name__ == "__main__":
    main()