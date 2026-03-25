#!/usr/bin/env python3
"""
process-confluence-export.py
Processes Confluence table exports, detects changes, updates portal data files
"""
import json
import sqlite3
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Tuple

BASE_DIR = Path(__file__).parent
EXPORT_DIR = BASE_DIR / 'confluence-exports'
LATEST_FILE = EXPORT_DIR / 'latest.json'
DB_FILE = BASE_DIR / 'confluence-history.db'
CHANGELOG_FILE = BASE_DIR / 'data-changelog.js'

# Status mapping - maps Confluence status to portal status
STATUS_MAP = {
    # Green statuses
    'green': ('green', 'Green — In Progress'),
    'on track': ('green', 'Green — On Track'),
    'initial requirements': ('green', 'Green — Initial Requirements'),
    'in development': ('green', 'Green — In Development'),
    
    # Yellow statuses
    'yellow': ('yellow', 'Yellow — At Risk'),
    'in progress': ('yellow', 'Yellow — In Progress'),
    'ready to start': ('yellow', 'Yellow — Ready to Start'),
    'ready for walkthrough': ('yellow', 'Yellow — Ready for Walkthrough'),
    'pending': ('yellow', 'Yellow — Pending'),
    
    # Red statuses
    'red': ('red', 'Red — Blocked'),
    'at risk': ('red', 'Red — At Risk'),
    'blocked': ('red', 'Red — Blocked'),
    
    # Complete statuses
    'complete': ('completed', 'Complete'),
    'completed': ('completed', 'Complete'),
    'done': ('completed', 'Complete'),
    'closed': ('completed', 'Complete'),
    
    # Roadmap/Backlog statuses
    'roadmap': ('roadmap', 'Roadmap'),
    'backlog': ('roadmap', 'Roadmap — Backlog'),
    'planned': ('roadmap', 'Roadmap — Planned'),
}

def init_database():
    """Initialize SQLite database for tracking historical data"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS confluence_exports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            table_index INTEGER,
            row_index INTEGER,
            cell_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS opif_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            opif_id TEXT NOT NULL,
            program_name TEXT,
            status TEXT,
            status_label TEXT,
            target_date TEXT,
            quarter TEXT,
            owner TEXT,
            workstream TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(opif_id, last_updated)
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS change_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            opif_id TEXT,
            program_name TEXT,
            field_changed TEXT,
            old_value TEXT,
            new_value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def load_latest_export() -> Dict[str, Any]:
    """Load the latest Confluence export"""
    if not LATEST_FILE.exists():
        print(f"ERROR: No export file found at {LATEST_FILE}")
        print("Run confluence-auto-export.sh first!")
        return {}
    
    with open(LATEST_FILE) as f:
        return json.load(f)

def extract_opifs_from_table(data: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Extract OPIF records from the Confluence table data.
    Expected table format:
    | OPIF ID | Program Name | Status | Target Date | Owner | ...
    """
    opifs = []
    
    if not data.get('success'):
        print(f"ERROR in export: {data.get('error', 'Unknown error')}")
        return opifs
    
    table_data = data.get('data', [])
    
    if not table_data:
        print("WARNING: No table data found in export")
        return opifs
    
    print(f"Processing {len(table_data)} rows from {data.get('tablesCount', 0)} table(s)...")
    
    # Group by table
    tables = {}
    for row in table_data:
        table_idx = row['table']
        if table_idx not in tables:
            tables[table_idx] = []
        tables[table_idx].append(row)
    
    # Process each table
    for table_idx, rows in tables.items():
        print(f"\nTable {table_idx}: {len(rows)} rows")
        
        # Find header row (contains 'OPIF' or 'Program' or 'Status')
        header_idx = None
        header_row = None
        
        for row in rows:
            cells = row['cells']
            if any('opif' in str(cell).lower() for cell in cells):
                header_idx = row['row']
                header_row = [str(c).strip() for c in cells]
                print(f"  Found header at row {header_idx}: {header_row}")
                break
        
        if not header_row:
            print(f"  No header found in table {table_idx}, skipping...")
            continue
        
        # Find column indices
        # For Confluence LLTT Dashboard, the structure is typically:
        # Col 0: OPIF ID, Col 1: Program Name, Col 7: Status, Col 12-13: Owner, Col 14: Start, Col 17: Target
        opif_col = 0  # OPIF ID is always first column
        program_col = 1  # Program name is second column
        status_col = 7  # Status column
        date_col = 17  # Target date
        owner_col = 12  # Product owner
        
        print(f"  Column mapping: OPIF={opif_col}, Program={program_col}, Status={status_col}, Date={date_col}, Owner={owner_col}")
        
        # Process data rows
        for row in rows:
            if row['row'] <= header_idx:
                continue  # Skip header and anything before it
            
            cells = row['cells']
            if len(cells) <= max(filter(None, [opif_col, program_col, status_col])):
                continue  # Not enough cells
            
            # Extract OPIF ID
            opif_match = re.search(r'OPIF-\d+', cells[opif_col] if opif_col is not None else '', re.IGNORECASE)
            if not opif_match:
                continue
            
            opif_id = opif_match.group(0).upper()
            program_name = cells[program_col].strip() if program_col is not None and program_col < len(cells) else ''
            status_raw = cells[status_col].strip().lower() if status_col is not None and status_col < len(cells) else ''
            target_date = cells[date_col].strip() if date_col is not None and date_col < len(cells) else ''
            owner = cells[owner_col].strip() if owner_col is not None and owner_col < len(cells) else ''
            
            # Map status
            status, status_label = STATUS_MAP.get(status_raw, ('roadmap', 'Roadmap'))
            
            # Derive quarter from date if possible
            quarter = 'TBD'
            if target_date:
                # Try to extract quarter
                q_match = re.search(r'Q([1-4])', target_date, re.IGNORECASE)
                if q_match:
                    quarter = f"Q{q_match.group(1)}"
            
            opifs.append({
                'opif_id': opif_id,
                'program_name': program_name,
                'status': status,
                'status_label': status_label,
                'target_date': target_date,
                'quarter': quarter,
                'owner': owner,
            })
    
    print(f"\nExtracted {len(opifs)} OPIF records")
    return opifs

def get_previous_state(opif_id: str) -> Dict[str, str]:
    """Get the last known state of an OPIF from database"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    c.execute('''
        SELECT status, status_label, target_date, quarter, owner, program_name
        FROM opif_tracking
        WHERE opif_id = ?
        ORDER BY last_updated DESC
        LIMIT 1
    ''', (opif_id,))
    
    row = c.fetchone()
    conn.close()
    
    if not row:
        return {}
    
    return {
        'status': row[0],
        'status_label': row[1],
        'target_date': row[2],
        'quarter': row[3],
        'owner': row[4],
        'program_name': row[5],
    }

def save_opif_state(opif: Dict[str, str]):
    """Save current OPIF state to database"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    c.execute('''
        INSERT INTO opif_tracking (
            opif_id, program_name, status, status_label,
            target_date, quarter, owner, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        opif[('opif_id')],
        opif.get('program_name', ''),
        opif.get('status', ''),
        opif.get('status_label', ''),
        opif.get('target_date', ''),
        opif.get('quarter', ''),
        opif.get('owner', ''),
        datetime.now().isoformat(),
    ))
    
    conn.commit()
    conn.close()

def log_change(opif_id: str, program_name: str, field: str, old_val: str, new_val: str):
    """Log a change to the database"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    c.execute('''
        INSERT INTO change_log (
            timestamp, opif_id, program_name, field_changed, old_value, new_value
        ) VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        datetime.now().isoformat(),
        opif_id,
        program_name,
        field,
        old_val,
        new_val,
    ))
    
    conn.commit()
    conn.close()

def detect_changes(opifs: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """Detect changes between current and previous OPIF states"""
    changes = []
    
    for opif in opifs:
        opif_id = opif['opif_id']
        previous = get_previous_state(opif_id)
        
        if not previous:
            # New OPIF
            changes.append({
                'type': 'new',
                'opif_id': opif_id,
                'program_name': opif.get('program_name', ''),
                'changes': {'all': 'New OPIF added to tracking'},
            })
        else:
            # Check for changes
            opif_changes = {}
            
            for field in ['status', 'status_label', 'target_date', 'quarter', 'owner']:
                old_val = previous.get(field, '')
                new_val = opif.get(field, '')
                
                if old_val != new_val and new_val:  # Only if new value is not empty
                    opif_changes[field] = {'old': old_val, 'new': new_val}
                    log_change(opif_id, opif.get('program_name', ''), field, old_val, new_val)
            
            if opif_changes:
                changes.append({
                    'type': 'modified',
                    'opif_id': opif_id,
                    'program_name': opif.get('program_name', previous.get('program_name', '')),
                    'changes': opif_changes,
                })
        
        # Save current state
        save_opif_state(opif)
    
    return changes

def print_change_summary(changes: List[Dict[str, Any]]):
    """Print a human-readable summary of changes"""
    print("\n" + "="*80)
    print(f"CHANGE SUMMARY - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    if not changes:
        print("✅ No changes detected - all OPIFs unchanged")
        return
    
    new_opifs = [c for c in changes if c['type'] == 'new']
    modified_opifs = [c for c in changes if c['type'] == 'modified']
    
    if new_opifs:
        print(f"\n🆕 NEW OPIFs ({len(new_opifs)}):")
        for change in new_opifs:
            print(f"  • {change['opif_id']}: {change['program_name']}")
    
    if modified_opifs:
        print(f"\n📝 MODIFIED OPIFs ({len(modified_opifs)}):")
        for change in modified_opifs:
            print(f"\n  {change['opif_id']}: {change['program_name']}")
            for field, vals in change['changes'].items():
                print(f"    - {field}: '{vals['old']}' → '{vals['new']}'")
    
    print("\n" + "="*80)

def main():
    print("\n" + "="*80)
    print("Confluence Export Processor")
    print("="*80)
    
    # Initialize database
    print("\n[1/4] Initializing database...")
    init_database()
    
    # Load latest export
    print("[2/4] Loading latest Confluence export...")
    data = load_latest_export()
    
    if not data:
        return 1
    
    # Extract OPIF data
    print("[3/4] Extracting OPIF data from tables...")
    opifs = extract_opifs_from_table(data)
    
    if not opifs:
        print("WARNING: No OPIF data extracted!")
        print("Check that the Confluence page has a table with OPIF IDs")
        return 1
    
    # Detect changes
    print("[4/4] Detecting changes from previous export...")
    changes = detect_changes(opifs)
    
    # Print summary
    print_change_summary(changes)
    
    print("\n✅ Export processing complete!")
    print(f"   Database: {DB_FILE}")
    print(f"   Latest export: {LATEST_FILE}")
    
    return 0

if __name__ == '__main__':
    exit(main())
