#!/usr/bin/env python3
"""Fetch OPIF updates from Jira for Weekly Program Review.

This script:
1. Parses all card data files to extract OPIF IDs
2. Fetches comment/history data from Jira for last 14 days
3. Uses LLM to generate executive summaries of recent work
4. Outputs JSON file with updates for each card

Usage:
    python3 fetch-opif-updates.py
    
Outputs:
    opif-updates.json — Card updates for WPR "Update" column
"""

import re
import json
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

# Parse OPIF IDs from card resources
def extract_opif_ids_from_card(card_text):
    """Extract OPIF IDs from a card definition."""
    opif_ids = []
    
    # Match OPIF-XXXXXX in URLs
    url_matches = re.findall(r'https://jira\.walmart\.com/browse/(OPIF-\d+)', card_text)
    opif_ids.extend(url_matches)
    
    # Match OPIF-XXXXXX in descriptions/text
    text_matches = re.findall(r'\b(OPIF-\d+)\b', card_text)
    opif_ids.extend(text_matches)
    
    # Return unique IDs
    return list(set(opif_ids))

def extract_card_id(card_text):
    """Extract card ID from card definition."""
    match = re.search(r"id:\s*'([^']+)'", card_text)
    return match.group(1) if match else None

def parse_data_files():
    """Parse all data-*.js files to extract card IDs and their OPIF IDs."""
    card_opif_map = {}  # {card_id: [opif_id1, opif_id2, ...]}
    
    data_files = [
        'data-strategy.js',
        'data-design.js',
        'data-buying.js',
        'data-allocation.js',
    ]
    
    for file in data_files:
        if not Path(file).exists():
            print(f"⚠️  Skipping {file} (not found)")
            continue
            
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Split into individual cards (rough split by card objects)
        card_blocks = re.split(r'\{\s*id:', content)
        
        for block in card_blocks[1:]:
            card_text = '{id:' + block
            card_id = extract_card_id(card_text)
            opif_ids = extract_opif_ids_from_card(card_text)
            
            if card_id and opif_ids:
                card_opif_map[card_id] = opif_ids
                print(f"✓ {card_id}: {', '.join(opif_ids)}")
    
    return card_opif_map

def fetch_jira_history(opif_id):
    """Fetch Jira issue history and comments for the last 14 days using REST API."""
    try:
        # Use Jira REST API to fetch issue with changelog and comments
        jira_url = f'https://jira.walmart.com/rest/api/2/issue/{opif_id}?expand=changelog,comment'
        
        result = subprocess.run(
            ['curl', '-s', '-X', 'GET', jira_url,
             '-H', 'Content-Type: application/json'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            print(f"⚠️  Failed to fetch {opif_id}: {result.stderr}")
            return None
        
        # Parse JSON response
        try:
            data = json.loads(result.stdout)
            return data
        except json.JSONDecodeError as e:
            print(f"⚠️  Failed to parse JSON for {opif_id}: {e}")
            return None
            
    except subprocess.TimeoutExpired:
        print(f"⚠️  Timeout fetching {opif_id}")
        return None

def summarize_updates_with_llm(opif_id, jira_data):
    """Use LLM to generate executive summary of recent OPIF updates."""
    # This will be implemented using Pydantic AI or similar
    # For now, return a placeholder
    return f"Recent activity on {opif_id} (summary pending LLM integration)"

def main():
    print("=== OPIF Update Fetcher ===")
    print("Parsing card data files...\n")
    
    card_opif_map = parse_data_files()
    
    print(f"\n📊 Found {len(card_opif_map)} cards with OPIFs mapped\n")
    print("Fetching Jira updates...\n")
    
    card_updates = {}
    
    for card_id, opif_ids in card_opif_map.items():
        # For now, just use the first OPIF (primary)
        primary_opif = opif_ids[0]
        
        print(f"Fetching {primary_opif} for {card_id}...")
        jira_data = fetch_jira_history(primary_opif)
        
        if jira_data:
            summary = summarize_updates_with_llm(primary_opif, jira_data)
            card_updates[card_id] = {
                'opif_id': primary_opif,
                'summary': summary,
                'last_updated': datetime.now().isoformat()
            }
    
    # Write to JSON file
    output_file = 'opif-updates.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(card_updates, f, indent=2)
    
    print(f"\n✅ Wrote updates to {output_file}")
    print(f"📝 {len(card_updates)} cards have OPIF updates")

if __name__ == '__main__':
    main()
