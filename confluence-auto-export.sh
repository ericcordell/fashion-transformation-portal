#!/bin/bash
# confluence-auto-export.sh
# Automated Confluence Dashboard Export System
# Uses Chrome + AppleScript to extract JavaScript-rendered table data

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFLUENCE_URL="https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard"
OUTPUT_DIR="$BASE_DIR/confluence-exports"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LATEST_FILE="$OUTPUT_DIR/latest.json"
ARCHIVE_FILE="$OUTPUT_DIR/archive_${TIMESTAMP}.json"

echo "======================================================================"
echo "Confluence Dashboard Auto-Export - $(date)"
echo "======================================================================"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Open Confluence in Chrome
echo "[1/5] Opening Confluence dashboard in Chrome..."
open -a "Google Chrome" "$CONFLUENCE_URL"
sleep 5

echo "[2/5] Waiting for page to fully load (JavaScript rendering)..."
sleep 10

# Use AppleScript to execute JavaScript in Chrome and extract table data
echo "[3/5] Extracting table data from rendered page..."

cat > /tmp/extract-confluence.applescript << 'APPLESCRIPT'
tell application "Google Chrome"
    set windowList to every window
    repeat with aWindow in windowList
        set tabList to every tab of aWindow
        repeat with atab in tabList
            if (URL of atab contains "confluence.walmart.com") then
                set extractedData to execute atab javascript "
                    (function() {
                        const results = [];
                        
                        // Try multiple table selectors
                        const tables = document.querySelectorAll('table.confluenceTable, table[class*=\"table\"], .confluenceTable');
                        
                        if (tables.length === 0) {
                            return JSON.stringify({error: 'No tables found', tablesCount: 0});
                        }
                        
                        // Extract data from each table
                        tables.forEach((table, tableIndex) => {
                            const rows = table.querySelectorAll('tr');
                            
                            rows.forEach((row, rowIndex) => {
                                const cells = row.querySelectorAll('td, th');
                                const rowData = [];
                                
                                cells.forEach(cell => {
                                    rowData.push(cell.innerText.trim());
                                });
                                
                                if (rowData.length > 0) {
                                    results.push({
                                        table: tableIndex,
                                        row: rowIndex,
                                        cells: rowData
                                    });
                                }
                            });
                        });
                        
                        return JSON.stringify({
                            success: true,
                            timestamp: new Date().toISOString(),
                            tablesCount: tables.length,
                            rowsExtracted: results.length,
                            data: results
                        });
                    })();
                "
                return extractedData
            end if
        end repeat
    end repeat
    return "{\"error\": \"No Confluence tab found\"}"
end tell
APPLESCRIPT

# Execute AppleScript and save output
EXTRACTED_DATA=$(osascript /tmp/extract-confluence.applescript)

if [ -z "$EXTRACTED_DATA" ]; then
    echo "ERROR: No data extracted from Confluence"
    exit 1
fi

echo "[4/5] Saving extracted data..."

# Save to latest.json
echo "$EXTRACTED_DATA" > "$LATEST_FILE"
echo "  Saved to: $LATEST_FILE"

# Save to archive
echo "$EXTRACTED_DATA" > "$ARCHIVE_FILE"
echo "  Archived to: $ARCHIVE_FILE"

# Parse and validate
ROWS_EXTRACTED=$(echo "$EXTRACTED_DATA" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('rowsExtracted', 0))")
TABLES_FOUND=$(echo "$EXTRACTED_DATA" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('tablesCount', 0))")

echo "[5/5] Extraction complete!"
echo "  Tables found: $TABLES_FOUND"
echo "  Rows extracted: $ROWS_EXTRACTED"

# Now run the comparison and update script
echo ""
echo "======================================================================"
echo "Running change detection and portal update..."
echo "======================================================================"

python3 "$BASE_DIR/process-confluence-export.py"

echo ""
echo "✅ Confluence export complete!"
echo "======================================================================"
