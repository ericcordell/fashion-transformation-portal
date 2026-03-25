# 🔄 Automated Confluence Export System

## What This Does

**Problem:** Confluence dashboard is JavaScript-rendered, can't be scraped with simple HTTP requests

**Solution:** Automated browser-based extraction using Chrome + AppleScript

**Result:** 
- ✅ Fully automated data export (no manual copy/paste)
- ✅ Historical tracking in SQLite database
- ✅ Automatic change detection
- ✅ Works consistently every day
- ✅ No API access required

---

## How It Works

### **System Architecture**

```
Chrome Browser (renders JavaScript)
         ↓
AppleScript (executes JS to extract table)
         ↓
JSON Export (saved with timestamp)
         ↓
SQLite Database (historical tracking)
         ↓
Change Detection (compare with previous)
         ↓
Summary Report (what changed since last run)
```

### **Files**

| File | Purpose |
|------|--------|
| `confluence-auto-export.sh` | Main orchestration script |
| `process-confluence-export.py` | Python processor for data extraction & change detection |
| `confluence-history.db` | SQLite database storing all historical OPIF data |
| `confluence-exports/` | Directory containing JSON exports (latest + archives) |
| `CONFLUENCE-EXPORT-SYSTEM.md` | This README |

---

## Usage

### **One-Command Update**

```bash
cd /Users/e0c0lzr/Downloads/fashion-portal
./confluence-auto-export.sh
```

**That's it!** The script will:

1. Open Confluence dashboard in Chrome
2. Wait for JavaScript to render the page (15 seconds)
3. Extract all table data using AppleScript
4. Save to `confluence-exports/latest.json`
5. Archive with timestamp
6. Compare with previous export
7. Show you a summary of what changed

### **Expected Output**

```
======================================================================
Confluence Dashboard Auto-Export - 2026-03-25 18:45:00
======================================================================
[1/5] Opening Confluence dashboard in Chrome...
[2/5] Waiting for page to fully load (JavaScript rendering)...
[3/5] Extracting table data from rendered page...
[4/5] Saving extracted data...
  Saved to: confluence-exports/latest.json
  Archived to: confluence-exports/archive_2026-03-25_18-45-00.json
[5/5] Extraction complete!
  Tables found: 1
  Rows extracted: 45

======================================================================
Running change detection and portal update...
======================================================================

Processing 45 rows from 1 table(s)...

Table 0: 45 rows
  Found header at row 0: ['OPIF ID', 'Program Name', 'Status', 'Target Date', 'Owner']
  Column mapping: OPIF=0, Program=1, Status=2, Date=3, Owner=4

Extracted 21 OPIF records

================================================================================
CHANGE SUMMARY - 2026-03-25 18:45:12
================================================================================

📝 MODIFIED OPIFs (3):

  OPIF-325602: Tagging and Affinity Graph
    - status: 'yellow' → 'green'
    - status_label: 'Yellow — At Risk' → 'Green — On Track'
    - target_date: 'Q1 2026' → 'Q2 2026'

  OPIF-336019: AP Tool Phase 2 Enhancements
    - target_date: 'Jul 31 2026' → 'Aug 15 2026'

  OPIF-325373: Unified Planner Experience
    - status: 'roadmap' → 'yellow'
    - status_label: 'Roadmap' → 'Yellow — In Progress'

================================================================================

✅ Export processing complete!
   Database: confluence-history.db
   Latest export: confluence-exports/latest.json
```

---

## Database Structure

### **confluence_exports** table
Raw table data from each export (for debugging)

### **opif_tracking** table
Historical snapshot of each OPIF state over time

```sql
SELECT opif_id, program_name, status, target_date, last_updated
FROM opif_tracking
WHERE opif_id = 'OPIF-325602'
ORDER BY last_updated DESC;
```

### **change_log** table
Every detected change with old → new values

```sql
SELECT timestamp, opif_id, field_changed, old_value, new_value
FROM change_log
WHERE opif_id = 'OPIF-325602'
ORDER BY timestamp DESC;
```

---

## Querying Historical Data

### **View all changes for an OPIF**

```bash
sqlite3 confluence-history.db "SELECT timestamp, field_changed, old_value, new_value FROM change_log WHERE opif_id = 'OPIF-325602' ORDER BY timestamp DESC;"
```

### **See when a program status changed**

```bash
sqlite3 confluence-history.db "SELECT timestamp, field_changed, old_value, new_value FROM change_log WHERE opif_id LIKE 'OPIF-%' AND field_changed = 'status' ORDER BY timestamp DESC;"
```

### **Get current state of all OPIFs**

```bash
python3 << 'EOF'
import sqlite3
conn = sqlite3.connect('confluence-history.db')
c = conn.cursor()

c.execute('''
    SELECT opif_id, program_name, status, target_date, owner
    FROM opif_tracking
    WHERE last_updated IN (
        SELECT MAX(last_updated)
        FROM opif_tracking
        GROUP BY opif_id
    )
    ORDER BY opif_id
''')

for row in c.fetchall():
    print(f"{row[0]}: {row[1]} | {row[2]} | {row[3]} | {row[4]}")

conn.close()
EOF
```

---

## Troubleshooting

### **"No tables found" error**

**Cause:** Page didn't finish loading before extraction

**Fix:** Increase sleep time in `confluence-auto-export.sh`:
```bash
# Change this line:
sleep 10
# To:
sleep 20
```

### **"No Confluence tab found" error**

**Cause:** Chrome didn't open the URL or you closed the tab too quickly

**Fix:** 
- Make sure Chrome is your default browser
- Don't close the Chrome tab during extraction
- Wait for the full process to complete

### **"No OPIF data extracted" warning**

**Cause:** Table structure on Confluence changed

**Fix:** 
1. Check the exported JSON: `cat confluence-exports/latest.json | python3 -m json.tool`
2. Look at the raw table data to see what was extracted
3. Update column detection logic in `process-confluence-export.py` if needed

### **Permission denied when running script**

```bash
chmod +x confluence-auto-export.sh
```

### **AppleScript permission error**

**macOS Security:** You may need to grant Terminal/iTerm2 permission to control Chrome:

1. System Preferences → Privacy & Security → Automation
2. Find Terminal (or iTerm2)
3. Enable "Google Chrome"

---

## Daily Automation

To run this automatically every day at 9 AM:

```bash
# Create launchd plist
cat > ~/Library/LaunchAgents/com.walmart.confluence-export.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.walmart.confluence-export</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/e0c0lzr/Downloads/fashion-portal/confluence-auto-export.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/e0c0lzr/Downloads/fashion-portal/confluence-export.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/e0c0lzr/Downloads/fashion-portal/confluence-export-error.log</string>
</dict>
</plist>
EOF

# Load the job
launchctl load ~/Library/LaunchAgents/com.walmart.confluence-export.plist
```

---

## Next Steps

Once you have the OPIF data extracted and changes detected, you can:

1. **Manual review** - Review the change summary and decide what to update
2. **Auto-update portal** - Add logic to automatically update `data-*.js` files
3. **Rebuild portal** - Run `python3 build-inlined.py`
4. **Publish** - Run share-puppy agent to deploy

---

## Summary

**Before:** Manual copy/paste from Confluence, prone to errors, no history

**After:** 
- ✅ One command: `./confluence-auto-export.sh`
- ✅ Automatic change detection
- ✅ Complete historical tracking
- ✅ Works consistently every day
- ✅ No API access needed
- ✅ No manual intervention required

**You asked for a consistent, automated way to export without explaining every time - this is it!** 🐶
