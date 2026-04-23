#!/usr/bin/env python3
"""
audit-wpr-owners.py — Audit Weekly Program Review owners against JIRA OPIFs

Pulls owner data from primary OPIFs in JIRA and compares with portal card owners.
"""
import re
import json
import subprocess
from pathlib import Path

BASE = Path(__file__).parent

# Read latest Confluence export which has OPIF owner data
confluence_data = BASE / 'confluence-exports/latest.json'
if not confluence_data.exists():
    print("❌ No Confluence export found. Run ./update-portal-data.sh first.")
    exit(1)

with open(confluence_data) as f:
    confluence = json.load(f)

# Build OPIF → Owner mapping from Confluence
opif_owners = {}
for table in confluence.get('tables', []):
    for row in table.get('data', []):
        if len(row) > 12:  # Owner is typically column 12
            opif_id = row[0] if row[0].startswith('OPIF-') else None
            owner = row[12] if len(row) > 12 else 'Unassigned'
            
            if opif_id:
                opif_owners[opif_id] = owner

print(f"📊 Loaded {len(opif_owners)} OPIF owners from Confluence")
print()

# Parse portal data files to extract cards and their primary OPIFs
DATA_FILES = ['data-strategy.js', 'data-design.js', 'data-buying.js', 'data-allocation.js']

def extract_primary_opif(card_text):
    """Extract primary OPIF from card resources."""
    # Look for first JIRA link in resources
    match = re.search(r"'https://jira\.walmart\.com/browse/(OPIF-\d+)'", card_text)
    if match:
        return match.group(1)
    return None

def extract_card_owner(card_text):
    """Extract current owner from card."""
    # Look for owners: pptOwners(...) pattern
    match = re.search(r"owners:\s*pptOwners\([^)]+\)", card_text)
    if match:
        owner_line = match.group(0)
        # Extract first non-empty name
        names = re.findall(r"'([^']+)'", owner_line)
        for name in names:
            if name and name != '':
                return name
    return None

def extract_card_id(card_text):
    """Extract card ID."""
    match = re.search(r"id:\s*'([^']+)'", card_text)
    return match.group(1) if match else None

def extract_card_title(card_text):
    """Extract card title."""
    match = re.search(r"title:\s*'([^']+)'", card_text)
    return match.group(1) if match else None

# Audit all cards
mismatches = []
total_cards = 0

for filename in DATA_FILES:
    filepath = BASE / filename
    if not filepath.exists():
        continue
    
    content = filepath.read_text()
    
    # Split into card blocks
    cards = re.split(r'\n  \{\n', content)
    
    for card_block in cards[1:]:  # Skip first split (before first card)
        total_cards += 1
        
        card_id = extract_card_id(card_block)
        card_title = extract_card_title(card_block)
        primary_opif = extract_primary_opif(card_block)
        current_owner = extract_card_owner(card_block)
        
        if not primary_opif:
            continue
        
        jira_owner = opif_owners.get(primary_opif, 'Unknown')
        
        # Check if owner matches
        if jira_owner != 'Unassigned' and jira_owner != 'Unknown':
            # Compare first name or full name
            if current_owner and jira_owner not in current_owner and current_owner not in jira_owner:
                mismatches.append({
                    'file': filename,
                    'card_id': card_id,
                    'title': card_title,
                    'opif': primary_opif,
                    'current_owner': current_owner,
                    'jira_owner': jira_owner,
                })

print("━" * 80)
print("📋 OWNER AUDIT RESULTS")
print("━" * 80)
print()

if not mismatches:
    print("✅ All owners match JIRA! No issues found.")
else:
    print(f"⚠️  Found {len(mismatches)} owner mismatches:\n")
    
    for m in mismatches:
        print(f"📝 {m['card_id']} — {m['title'][:50]}")
        print(f"   File: {m['file']}")
        print(f"   OPIF: {m['opif']}")
        print(f"   Portal Owner:  {m['current_owner']}")
        print(f"   JIRA Owner:    {m['jira_owner']}")
        print()

print("━" * 80)
print(f"Total cards audited: {total_cards}")
print(f"Mismatches found: {len(mismatches)}")
print("━" * 80)

# Save mismatches to JSON for automated fixing
if mismatches:
    output = BASE / 'owner-mismatches.json'
    with open(output, 'w') as f:
        json.dump(mismatches, f, indent=2)
    print(f"\n💾 Saved mismatches to: {output}")
    print("\n📋 Next step: Run fix-wpr-owners.py to apply corrections")
