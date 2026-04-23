#!/usr/bin/env python3
"""
enhanced-jira-sync.py — Pull detailed OPIF breakdowns from JIRA by Commit Status

This script queries JIRA using the same filters as the Confluence dashboards
and groups OPIFs by their "OPIF Commit Status" field to get the exact
breakdown the user needs.

Usage:
    python3 enhanced-jira-sync.py --quarter Q1
    python3 enhanced-jira-sync.py --quarter Q2
    python3 enhanced-jira-sync.py --quarter Q1 --dry-run

JIRA Fields we extract:
    - OPIF Commit Status (customfield_XXXXX) → maps to categories like:
      • Committed
      • Pending Sizing
      • Product Discovery
      • Cannot Commit
      • Sizing Complete
      • Ready for Walkthrough
      • Initial Requirements
    - Status (workflow status)
    - Target Quarter
    - Workstream (filter by "Stability")
"""
import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent

JIRA_BASE = "https://jira.walmart.com"

# JIRA JQL Filters (from Confluence dashboard URLs)
FILTERS = {
    "Q1": "FY27-Q1-Assortment",
    "Q2": "FY27-Q2-Assortment",
}

# OPIF Commit Status mapping → User-friendly categories
COMMIT_STATUS_MAP = {
    # Q1 categories (focused on delivery status)
    "done": "delivered_to_production",
    "completed": "delivered_to_production",
    "launched": "delivered_to_production",
    "ready for review": "in_qe_testing",
    "work in progress": "in_qe_testing",
    "in progress": "in_qe_testing",
    "qa": "in_qe_testing",
    "uat": "in_qe_testing",
    "testing": "in_qe_testing",
    
    # Q2 categories (focused on planning status)
    "committed": "sized_and_committed",
    "sizing complete": "sized_and_committed",
    "ready to start": "sized_and_committed",
    "ready for walkthrough": "sized_and_committed",
    "pending sizing": "pending_sizing",
    "pending estimate": "pending_sizing",
    "product discovery": "product_discovery",
    "discovery": "product_discovery",
    "backlog": "product_discovery",
    "cannot commit": "cannot_commit",
    "not committed": "cannot_commit",
    "blocked": "cannot_commit",
}

# Human-readable labels for reporting
CATEGORY_LABELS = {
    # Q1
    "delivered_to_production": "✅ Delivered to Production",
    "in_qe_testing": "🧪 In QE Testing/UAT",
    
    # Q2
    "sized_and_committed": "🟢 Sized & Committed for Delivery",
    "pending_sizing": "🟡 Pending Sizing",
    "product_discovery": "🔵 In Product Discovery",
    "cannot_commit": "🔴 Cannot Be Committed",
}


def jira_get(path: str, token: str) -> dict:
    """Make authenticated GET request to JIRA REST API."""
    url = f"{JIRA_BASE}{path}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 401:
            print(f"\n❌ 401 Unauthorized — your token is invalid.")
            print("   Generate a new one: python3 generate-jira-pat.py")
            sys.exit(1)
        if e.code == 403:
            print(f"\n❌ 403 Forbidden — no permission for {path}")
            sys.exit(1)
        raise RuntimeError(f"JIRA API error {e.code}: {body[:300]}")


def get_filter_jql(filter_name: str, token: str) -> str:
    """Get the JQL query for a saved JIRA filter by name."""
    # Search for filter by name
    search_url = f"/rest/api/2/filter/search?filterName={urllib.parse.quote(filter_name)}"
    data = jira_get(search_url, token)
    
    if not data.get("values"):
        raise ValueError(f"Filter '{filter_name}' not found in JIRA")
    
    filter_obj = data["values"][0]
    jql = filter_obj.get("jql", "")
    
    if not jql:
        raise ValueError(f"Filter '{filter_name}' has no JQL query")
    
    return jql


def query_opifs(jql: str, token: str, workstream: str = "Stability") -> list:
    """Execute JQL query and return matching OPIFs filtered by workstream."""
    # Add workstream filter to JQL
    jql_filtered = f"({jql}) AND labels = Assortment-{workstream}"
    
    # JQL search endpoint
    search_url = f"/rest/api/2/search?jql={urllib.parse.quote(jql_filtered)}&maxResults=1000"
    
    print(f"   Querying: {jql_filtered[:100]}...")
    data = jira_get(search_url, token)
    
    issues = data.get("issues", [])
    print(f"   Found {len(issues)} issues")
    
    return issues


def extract_opif_data(issue: dict) -> dict:
    """Extract relevant fields from a JIRA issue."""
    fields = issue.get("fields", {})
    key = issue.get("key", "")
    
    # Status (workflow)
    status = fields.get("status", {}).get("name", "").lower()
    
    # Activity Type / Commit Status (custom field - need to discover ID)
    # Common field names: "OPIF Commit Status", "Activity Type (OPIF Commit Status)"
    commit_status = ""
    for field_id, value in fields.items():
        if not field_id.startswith("customfield_"):
            continue
        if isinstance(value, dict):
            val_str = value.get("value", "")
        elif isinstance(value, str):
            val_str = value
        else:
            continue
        
        # Look for commit status keywords
        val_lower = val_str.lower()
        if any(kw in val_lower for kw in ["commit", "sizing", "discovery", "walkthrough"]):
            commit_status = val_lower
            break
    
    # Fallback to workflow status if no commit status found
    if not commit_status:
        commit_status = status
    
    # Summary
    summary = fields.get("summary", "")
    
    # Assignee
    assignee_obj = fields.get("assignee") or {}
    assignee = assignee_obj.get("displayName", "")
    
    # Story points / sizing
    points = fields.get("customfield_10004")  # Common story points field
    
    return {
        "key": key,
        "summary": summary,
        "status": status,
        "commit_status": commit_status,
        "assignee": assignee,
        "points": points or 0,
    }


def categorize_opif(opif_data: dict, quarter: str) -> str:
    """Categorize an OPIF based on its commit status."""
    commit_status = opif_data["commit_status"]
    
    # Try exact match first
    category = COMMIT_STATUS_MAP.get(commit_status)
    if category:
        return category
    
    # Fuzzy match - check if any keyword appears in commit status
    for keyword, cat in COMMIT_STATUS_MAP.items():
        if keyword in commit_status:
            return cat
    
    # Default fallback based on quarter
    if quarter == "Q1":
        return "in_qe_testing"  # Assume in-progress if unknown
    else:
        return "product_discovery"  # Assume backlog if unknown


def group_opifs_by_category(opifs: list, quarter: str) -> dict:
    """Group OPIFs into user-defined categories."""
    grouped = defaultdict(list)
    
    for opif in opifs:
        category = categorize_opif(opif, quarter)
        grouped[category].append(opif)
    
    return dict(grouped)


def print_report(quarter: str, grouped: dict):
    """Print a summary report of OPIFs by category."""
    total = sum(len(opifs) for opifs in grouped.values())
    
    print("\n" + "="*80)
    print(f"📊 {quarter} AEX Stability Breakdown ({total} total OPIFs)")
    print("="*80)
    
    for category in sorted(grouped.keys()):
        opifs = grouped[category]
        label = CATEGORY_LABELS.get(category, category.replace("_", " ").title())
        print(f"\n{label}: {len(opifs)}")
        
        for opif in opifs[:5]:  # Show first 5
            pts = f"({opif['points']} pts)" if opif['points'] else ""
            print(f"  • {opif['key']}: {opif['summary'][:60]}... {pts}")
        
        if len(opifs) > 5:
            print(f"  ... and {len(opifs) - 5} more")
    
    print("\n" + "="*80)


def update_portal_card(quarter: str, grouped: dict, dry_run: bool = False):
    """Update the portal data-buying.js file with new counts."""
    data_file = BASE / "data-buying.js"
    
    if not data_file.exists():
        print(f"❌ File not found: {data_file}")
        return
    
    content = data_file.read_text()
    
    # Find the Q1 or Q2 card
    card_pattern = rf"id: 'aex-stability-{quarter.lower()}'"
    if card_pattern not in content:
        print(f"❌ Card 'aex-stability-{quarter.lower()}' not found in {data_file.name}")
        return
    
    # Build new description based on quarter
    total = sum(len(opifs) for opifs in grouped.values())
    
    if quarter == "Q1":
        delivered = len(grouped.get("delivered_to_production", []))
        in_testing = len(grouped.get("in_qe_testing", []))
        new_desc = (
            f"{total} total projects — ✅ {delivered} Delivered to Production · "
            f"🧪 {in_testing} In QE Testing/UAT (still in progress)"
        )
    elif quarter == "Q2":
        committed = len(grouped.get("sized_and_committed", []))
        pending = len(grouped.get("pending_sizing", []))
        discovery = len(grouped.get("product_discovery", []))
        cannot = len(grouped.get("cannot_commit", []))
        new_desc = (
            f"{total} total projects — 🟢 {committed} Sized & Committed for Delivery · "
            f"🟡 {pending} Pending Sizing · 🔵 {discovery} In Product Discovery · "
            f"🔴 {cannot} Cannot Be Committed"
        )
    else:
        return
    
    # Find and replace the description field
    desc_pattern = rf"(id: 'aex-stability-{quarter.lower()}'.*?description: ')[^']*(')"
    new_content = re.sub(
        desc_pattern,
        rf"\g<1>{new_desc}\g<2>",
        content,
        flags=re.DOTALL
    )
    
    if new_content == content:
        print(f"⚠️  No changes detected in description for {quarter}")
        return
    
    if dry_run:
        print(f"\n[DRY RUN] Would update {data_file.name}:")
        print(f"  New description: {new_desc}")
    else:
        data_file.write_text(new_content)
        print(f"\n✅ Updated {data_file.name}")
        print(f"   New description: {new_desc}")


def main():
    parser = argparse.ArgumentParser(description="Enhanced JIRA sync for AEX Stability breakdown")
    parser.add_argument("--quarter", required=True, choices=["Q1", "Q2"], help="Which quarter to sync")
    parser.add_argument("--token", default="", help="JIRA Personal Access Token")
    parser.add_argument("--dry-run", action="store_true", help="Show report only, don't update files")
    args = parser.parse_args()
    
    # Load token
    token = args.token or load_token_from_env()
    if not token:
        print("\n❌ No JIRA token found.")
        print("   Generate: python3 generate-jira-pat.py")
        print("   Then save: echo 'JIRA_TOKEN=<token>' >> .env")
        sys.exit(1)
    
    print(f"\n🐶 Enhanced JIRA Sync - {args.quarter} AEX Stability")
    print("━" * 60)
    
    # Step 1: Get filter JQL
    filter_name = FILTERS[args.quarter]
    print(f"\n[1/4] Loading JIRA filter '{filter_name}'...")
    jql = get_filter_jql(filter_name, token)
    print(f"   JQL: {jql[:80]}...")
    
    # Step 2: Query OPIFs
    print(f"\n[2/4] Querying OPIFs (Workstream = Stability)...")
    issues = query_opifs(jql, token, workstream="Stability")
    
    # Step 3: Extract and categorize
    print(f"\n[3/4] Extracting and categorizing {len(issues)} OPIFs...")
    opifs = [extract_opif_data(issue) for issue in issues]
    grouped = group_opifs_by_category(opifs, args.quarter)
    
    # Step 4: Print report
    print_report(args.quarter, grouped)
    
    # Step 5: Update portal (if not dry-run)
    print(f"\n[4/4] Updating portal card...")
    update_portal_card(args.quarter, grouped, dry_run=args.dry_run)
    
    print("\n✅ Sync complete!")
    if args.dry_run:
        print("   (Dry run - no files were modified)")
    else:
        print("\n📋 Next steps:")
        print("   1. Review: git diff data-buying.js")
        print("   2. Rebuild: python3 build-inlined.py")
        print("   3. Publish: python3 publish-portal.py --test")


def load_token_from_env() -> str:
    """Load JIRA token from .env file."""
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line.startswith('JIRA_TOKEN=') and not line.startswith('#'):
                return line.split('=', 1)[1].strip().strip('"').strip("'")
    return ''


if __name__ == "__main__":
    main()
