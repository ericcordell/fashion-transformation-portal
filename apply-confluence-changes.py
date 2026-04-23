#!/usr/bin/env python3
"""
apply-confluence-changes.py — Apply all detected changes to portal cards

Based on the Confluence sync results, this script updates all portal cards
with new statuses, dates, and owner information.
"""
import re
from pathlib import Path

BASE = Path(__file__).parent

# All changes detected from Confluence sync
CHANGES = {
    # CRITICAL: Red status
    'OPIF-325208': {
        'status': 'red',
        'statusLabel': 'Red — Contract Negotiation Blocked',
        'targetDate': 'Jul 31, 2026',
        'pathToGreen': 'Contract signed by end of April. Negotiations ongoing with Centric.',
    },
    
    # Green → Yellow downgrades
    'OPIF-358367': {
        'status': 'yellow',
        'statusLabel': 'Yellow — At Risk',
        'owners': {'softwareLead': {'name': 'Ryan Henderson', 'email': 'ryhender@walmart.com'}},
    },
    'OPIF-339291': {
        'status': 'yellow',
        'statusLabel': 'Yellow — At Risk',
        'owners': {'softwareLead': {'name': 'Dhaarna Singh', 'email': 'd0s0yfd@walmart.com'}},
    },
    'OPIF-325598': {
        'status': 'yellow',
        'statusLabel': 'Yellow — At Risk',
        'owners': {'softwareLead': {'name': 'Dhaarna Singh', 'email': 'd0s0yfd@walmart.com'}},
    },
    'OPIF-325373': {
        'status': 'yellow',
        'statusLabel': 'Yellow — At Risk',
    },
    
    # Roadmap → Yellow
    'OPIF-325221': {
        'status': 'yellow',
        'statusLabel': 'Yellow — At Risk',
    },
    'OPIF-325218': {
        'status': 'yellow',
        'statusLabel': 'Yellow — At Risk',
    },
    'OPIF-325374': {
        'status': 'yellow',
        'statusLabel': 'Yellow — At Risk',
    },
    'OPIF-349684': {
        'status': 'yellow',
        'statusLabel': 'Yellow — At Risk',
    },
}

DATA_FILES = [
    'data-strategy.js',
    'data-design.js',
    'data-buying.js',
    'data-allocation.js',
]


def find_card_with_opif(opif_id: str) -> tuple:
    """Find which file and card contains this OPIF."""
    for filename in DATA_FILES:
        filepath = BASE / filename
        if not filepath.exists():
            continue
        
        content = filepath.read_text()
        
        # Search for OPIF in resources or relatedOpifs
        if opif_id in content:
            # Extract the card block containing this OPIF
            lines = content.split('\n')
            in_card = False
            card_start = 0
            card_id = None
            
            for i, line in enumerate(lines):
                if "id: '" in line and '{' in lines[i-1]:
                    in_card = True
                    card_start = i - 1
                    # Extract card ID
                    match = re.search(r"id: '([^']+)'", line)
                    if match:
                        card_id = match.group(1)
                
                if in_card and opif_id in line:
                    # Found the OPIF in this card
                    return (filepath, card_id, card_start)
                
                if in_card and line.strip().startswith('},') and 'workstreams' in line:
                    in_card = False
    
    return (None, None, None)


def update_card_field(content: str, card_id: str, field: str, value: str) -> str:
    """Update a specific field in a card."""
    # Find the card block
    card_pattern = rf"(id: '{card_id}'.*?)(workstreams: \[)"
    
    match = re.search(card_pattern, content, re.DOTALL)
    if not match:
        return content
    
    card_block = match.group(1)
    original_block = card_block
    
    # Update the field
    if field == 'status':
        card_block = re.sub(r"status: '[^']*'", f"status: '{value}'", card_block)
    elif field == 'statusLabel':
        card_block = re.sub(r"statusLabel: '[^']*'", f"statusLabel: '{value}'", card_block)
    elif field == 'targetDate':
        card_block = re.sub(r"targetDate: '[^']*'", f"targetDate: '{value}'", card_block)
    elif field == 'pathToGreen':
        # Check if pathToGreen exists
        if 'pathToGreen:' in card_block:
            card_block = re.sub(r"pathToGreen: '[^']*'", f"pathToGreen: '{value}'", card_block)
        else:
            # Add it after statusLabel
            card_block = re.sub(
                r"(statusLabel: '[^']*',)",
                rf"\1\n    pathToGreen: '{value}',",
                card_block
            )
    
    # Replace in content
    return content.replace(original_block, card_block)


def apply_changes():
    """Apply all changes to portal data files."""
    print("\n🐶 Applying Confluence Changes to Portal Cards")
    print("=" * 70)
    
    updated_files = set()
    changes_applied = 0
    
    for opif_id, changes in CHANGES.items():
        filepath, card_id, _ = find_card_with_opif(opif_id)
        
        if not filepath:
            print(f"\n⚠️  {opif_id}: Card not found in portal")
            continue
        
        print(f"\n📝 {opif_id} → {card_id} ({filepath.name})")
        
        content = filepath.read_text()
        
        # Apply each change
        for field, value in changes.items():
            if field == 'owners':
                # Skip owner updates for now (complex nested structure)
                print(f"   ⏭️  Skipping owner update (needs manual edit)")
                continue
            
            old_content = content
            content = update_card_field(content, card_id, field, value)
            
            if content != old_content:
                print(f"   ✅ {field}: {value}")
                changes_applied += 1
            else:
                print(f"   ⚠️  {field}: No change made (field not found?)")
        
        # Write updated content
        filepath.write_text(content)
        updated_files.add(filepath.name)
    
    print("\n" + "=" * 70)
    print(f"✅ Applied {changes_applied} changes across {len(updated_files)} files")
    print(f"📁 Updated files: {', '.join(sorted(updated_files))}")
    
    return list(updated_files)


if __name__ == '__main__':
    updated = apply_changes()
    
    if updated:
        print("\n📋 Next steps:")
        print("   1. Review changes: git diff")
        print("   2. Rebuild portal: python3 build-inlined.py")
        print("   3. Publish to TEST: python3 publish-portal.py --test")
        print("   4. Publish to PROD: python3 publish-portal.py --prod")
