#!/usr/bin/env python3
"""
audit-and-fix-wpr-owners.py — Audit and fix WPR owners from JIRA OPIFs

Pulls owner data from confluence-history.db and updates portal cards.
"""
import re
import json
import sqlite3
from pathlib import Path

BASE = Path(__file__).parent

# Connect to database
db = BASE / 'confluence-history.db'
if not db.exists():
    print("❌ Database not found. Run ./update-portal-data.sh first.")
    exit(1)

conn = sqlite3.connect(db)
c = conn.cursor()

# Get latest owner for each OPIF
c.execute('''
    SELECT opif_id, program_name, owner
    FROM opif_tracking
    WHERE last_updated IN (
        SELECT MAX(last_updated) FROM opif_tracking GROUP BY opif_id
    )
    ORDER BY opif_id
''')

opif_owners = {}
for row in c.fetchall():
    opif_id, program_name, owner = row
    opif_owners[opif_id] = {
        'owner': owner,
        'program': program_name
    }

conn.close()

print(f"📊 Loaded {len(opif_owners)} OPIF owners from database")
print()

# Parse portal data files
DATA_FILES = ['data-strategy.js', 'data-design.js', 'data-buying.js', 'data-allocation.js']

def extract_primary_opif(card_text):
    """Extract primary OPIF from card resources."""
    match = re.search(r"'https://jira\.walmart\.com/browse/(OPIF-\d+)'", card_text)
    if match:
        return match.group(1)
    return None

def extract_card_owner(card_text):
    """Extract current productOwner from card."""
    # Look for owners: pptOwners(...) pattern
    match = re.search(r"owners:\s*pptOwners\(([^)]+)\)", card_text)
    if match:
        args = match.group(1)
        # Extract first argument (Product Owner)
        names = [s.strip().strip("'") for s in args.split(',')]
        if names and names[0]:
            return names[0]
    return None

def extract_card_id(card_text):
    match = re.search(r"id:\s*'([^']+)'", card_text)
    return match.group(1) if match else None

def extract_card_title(card_text):
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
    cards = re.split(r'\n  \{\n', content)
    
    for card_block in cards[1:]:
        total_cards += 1
        
        card_id = extract_card_id(card_block)
        card_title = extract_card_title(card_block)
        primary_opif = extract_primary_opif(card_block)
        current_owner = extract_card_owner(card_block)
        
        if not primary_opif or primary_opif not in opif_owners:
            continue
        
        jira_data = opif_owners[primary_opif]
        jira_owner = jira_data['owner']
        
        if jira_owner == 'Unassigned':
            continue
        
        # Check if owners match (compare last names or full names)
        jira_lastname = jira_owner.split()[-1] if jira_owner else ''
        current_lastname = current_owner.split()[-1] if current_owner else ''
        
        if jira_lastname and current_lastname and jira_lastname != current_lastname:
            mismatches.append({
                'file': filename,
                'card_id': card_id,
                'title': card_title,
                'opif': primary_opif,
                'current_owner': current_owner,
                'jira_owner': jira_owner,
            })

print("━" * 80)
print("📋 WPR OWNER AUDIT RESULTS")
print("━" * 80)
print()

if not mismatches:
    print("✅ All owners match JIRA! No issues found.")
else:
    print(f"⚠️  Found {len(mismatches)} owner mismatches:\n")
    
    for m in mismatches:
        print(f"📝 {m['card_id']}")
        print(f"   Title: {m['title'][:60]}")
        print(f"   File: {m['file']}")
        print(f"   OPIF: {m['opif']}")
        print(f"   Portal Owner:  '{m['current_owner']}'")
        print(f"   JIRA Owner:    '{m['jira_owner']}' ✅")
        print()

print("━" * 80)
print(f"Total cards audited: {total_cards}")
print(f"Mismatches found: {len(mismatches)}")
print("━" * 80)

# Ask to fix
if mismatches:
    print("\n🔧 Do you want to auto-fix these owners? (y/n): ", end='')
    import sys
    response = input()
    
    if response.lower() == 'y':
        print("\n🔄 Applying owner fixes...\n")
        
        for m in mismatches:
            filepath = BASE / m['file']
            content = filepath.read_text()
            
            # Find and replace the owner in pptOwners()
            # Pattern: owners: pptOwners('OLD NAME', ...)
            # Replace with: owners: pptOwners('NEW NAME', ...)
            
            pattern = rf"(owners:\s*pptOwners\s*\(\s*')([^']*)(.*?{m['card_id']})"
            
            def replace_owner(match):
                return f"{match.group(1)}{m['jira_owner']}{match.group(3)}"
            
            # More robust: find the specific card block and update it
            card_pattern = rf"(id:\s*'{m['card_id']}'.*?owners:\s*pptOwners\s*\(\s*')([^']*)"
            
            new_content = re.sub(
                card_pattern,
                rf"\g<1>{m['jira_owner']}",
                content,
                flags=re.DOTALL
            )
            
            if new_content != content:
                filepath.write_text(new_content)
                print(f"   ✅ Fixed {m['card_id']}: {m['current_owner']} → {m['jira_owner']}")
            else:
                print(f"   ⚠️  Could not auto-fix {m['card_id']} - manual edit needed")
        
        print("\n✅ Owner fixes applied!")
        print("\n📋 Next steps:")
        print("   1. Review changes: git diff")
        print("   2. Rebuild portal: python3 build-inlined.py")
        print("   3. Publish: python3 publish-portal.py --prod")
    else:
        # Save mismatches to JSON
        output = BASE / 'owner-mismatches.json'
        with open(output, 'w') as f:
            json.dump(mismatches, f, indent=2)
        print(f"\n💾 Saved mismatches to: {output}")
