#!/usr/bin/env python3
"""Show current portal data for all cards with OPIF references"""
import re
from pathlib import Path

# Read all data files
data_files = ['data-strategy.js', 'data-design.js', 'data-buying.js', 'data-allocation.js']

print("="*80)
print("CURRENT PORTAL DATA - Programs with OPIF References")
print("="*80)

for file in data_files:
    if not Path(file).exists():
        continue
    
    content = Path(file).read_text()
    
    # Find all card objects
    cards = re.findall(r'\{[^}]+id:\s*[\'"]([^\'"]+)[\'"][^}]+title:\s*[\'"]([^\'"]+)[\'"][^}]+status:\s*[\'"]([^\'"]+)[\'"][^}]+statusLabel:\s*[\'"]([^\'"]+)[\'"][^}]+targetDate:\s*[\'"]([^\'"]+)[\'"]', content, re.DOTALL)
    
    if cards:
        workstream = file.replace('data-', '').replace('.js', '').upper()
        print(f"\n{'='*80}")
        print(f"{workstream} WORKSTREAM")
        print('='*80)
        
        for match in cards:
            card_id, title, status, status_label, target_date = match
            # Find OPIF reference for this card
            card_match = re.search(rf"id:\s*['\"]" + re.escape(card_id) + r"['\"][^}]{{1,2000}}techIntegration:\s*['\"]([^'\"]*OPIF[^'\"]*)['\"]", content, re.DOTALL)
            
            if card_match and 'OPIF-' in card_match.group(1):
                opif_refs = re.findall(r'OPIF-\d+', card_match.group(1))
                print(f"\n📌 {title}")
                print(f"   ID: {card_id}")
                print(f"   Status: {status} | {status_label}")
                print(f"   Target: {target_date}")
                print(f"   OPIFs: {', '.join(opif_refs)}")

print("\n" + "="*80)
print("END OF CURRENT DATA")
print("="*80)
