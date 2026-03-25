#!/bin/bash
# update-portal-data.sh
# ONE-COMMAND portal data update with change summary

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$BASE_DIR"

echo ""
echo "🐶 E2E Fashion Portal - Data Update"
echo "======================================================================"
echo ""

# Run the Confluence export
./confluence-auto-export.sh

echo ""
echo "======================================================================"
echo "📊 Current OPIF Status Summary"
echo "======================================================================"
echo ""

# Show summary by status
python3 << 'PYTHON'
import sqlite3

conn = sqlite3.connect('confluence-history.db')
c = conn.cursor()

# Get latest state of each OPIF
c.execute('''
    SELECT opif_id, program_name, status, status_label, target_date, owner
    FROM opif_tracking
    WHERE last_updated IN (
        SELECT MAX(last_updated)
        FROM opif_tracking
        GROUP BY opif_id
    )
    ORDER BY status, opif_id
''')

rows = c.fetchall()

# Group by status
by_status = {}
for row in rows:
    status = row[2]
    if status not in by_status:
        by_status[status] = []
    by_status[status].append(row)

# Print summary
status_icons = {
    'green': '✅',
    'yellow': '⚠️ ',
    'red': '🔴',
    'completed': '☑️ ',
    'roadmap': '🗺️ '
}

status_names = {
    'green': 'GREEN (In Progress)',
    'yellow': 'YELLOW (At Risk)',
    'red': 'RED (Blocked)',
    'completed': 'COMPLETED',
    'roadmap': 'ROADMAP'
}

for status in ['green', 'yellow', 'red', 'completed', 'roadmap']:
    if status in by_status:
        icon = status_icons.get(status, '•')
        name = status_names.get(status, status.upper())
        items = by_status[status]
        print(f"\n{icon} {name} ({len(items)} OPIFs)")
        print("="*80)
        for opif_id, program_name, _, status_label, target_date, owner in items:
            # Truncate long names
            prog_short = program_name[:50] + '...' if len(program_name) > 50 else program_name
            print(f"  {opif_id}: {prog_short}")
            print(f"    Target: {target_date} | Owner: {owner}")

print("\n" + "="*80)
print(f"Total: {len(rows)} OPIFs tracked")
print("="*80)

conn.close()
PYTHON

echo ""
echo "✅ Update complete!"
echo ""
echo "Next steps:"
echo "  1. Review the changes above"
echo "  2. Manually update data-*.js files as needed"
echo "  3. Run: python3 build-inlined.py"
echo "  4. Deploy with share-puppy agent"
echo ""
