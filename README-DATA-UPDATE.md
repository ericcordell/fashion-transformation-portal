# 🐶 E2E Fashion Portal - Data Update System

## TL;DR - How to Update Portal Data

```bash
cd /Users/e0c0lzr/Downloads/fashion-portal
./update-portal-data.sh
```

**That's it!** One command that:
- ✅ Opens Confluence in Chrome
- ✅ Extracts all OPIF data automatically
- ✅ Compares with previous export
- ✅ Shows you exactly what changed
- ✅ Provides a status summary

**No explaining how to export. No manual steps. Just run it.**

---

## What You Asked For

> "I want you to export the data from Confluence like you did in the past, build a source table that houses all of this information each time we do it and be able to provide a summary of what has changed since the last time you exported the information. I do NOT want to have to explain HOW you should export this data every time we execute the update for the portal."

**✅ Built exactly that:**

1. **Consistent Export** - Uses Chrome + AppleScript to render JavaScript and extract table data
2. **Source Table** - SQLite database (`confluence-history.db`) stores ALL historical data
3. **Change Detection** - Automatically compares with previous export and shows what changed
4. **One Command** - Never explain the process again, just run `./update-portal-data.sh`
5. **No API Access Needed** - Works purely with browser automation

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  update-portal-data.sh  (ONE COMMAND TO RULE THEM ALL)         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  confluence-auto-export.sh  (Browser Automation)                │
│  • Opens Confluence in Chrome                                   │
│  • Waits for JavaScript to render (15 seconds)                  │
│  • Executes AppleScript to extract table data                   │
│  • Saves JSON export with timestamp                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  process-confluence-export.py  (Change Detection)               │
│  • Parses extracted JSON table data                             │
│  • Maps Confluence columns to OPIF fields                       │
│  • Compares with previous database state                        │
│  • Logs all detected changes                                    │
│  • Updates confluence-history.db                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  confluence-history.db  (SQLite Database)                       │
│  • opif_tracking: Historical snapshots of each OPIF             │
│  • change_log: Every field change with old→new values           │
│  • confluence_exports: Raw table data for debugging             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Created

| File | Purpose |
|------|--------|
| `update-portal-data.sh` | **Main script** - Run this to update portal data |
| `confluence-auto-export.sh` | Browser automation for data extraction |
| `process-confluence-export.py` | Change detection and database management |
| `confluence-history.db` | SQLite database with ALL historical OPIF data |
| `confluence-exports/` | JSON exports (latest.json + timestamped archives) |
| `CONFLUENCE-EXPORT-SYSTEM.md` | Detailed technical documentation |
| `README-DATA-UPDATE.md` | This file - quick start guide |

---

## Example Output

When you run `./update-portal-data.sh`, you'll see:

### First Time (Baseline)
```
🐶 E2E Fashion Portal - Data Update
======================================================================

[1/5] Opening Confluence dashboard in Chrome...
[2/5] Waiting for page to fully load...
[3/5] Extracting table data from rendered page...
[4/5] Saving extracted data...
[5/5] Extraction complete!
  Tables found: 17
  Rows extracted: 108

======================================================================
Running change detection...
======================================================================

================================================================================
CHANGE SUMMARY - 2026-03-25 18:48:42
================================================================================

🆕 NEW OPIFs (25):
  • OPIF-325602: Tagging and Affinity Graph MVP
  • OPIF-336019: AP Tool Phase 2 Enhancements
  • OPIF-325373: Unified Planner Experience
  ... (22 more)

================================================================================

📊 Current OPIF Status Summary
================================================================================

✅ GREEN (In Progress) (9 OPIFs)
  OPIF-325602: Tagging and Affinity Graph MVP
    Target: Apr 30, 2026 | Owner: Aravind Chiruvelli
  OPIF-325373: Unified Planner Experience
    Target: Oct 31, 2026 | Owner: Abhishek Jannawar
  ...

⚠️  YELLOW (At Risk) (3 OPIFs)
  OPIF-344926: AEX - Automated Item Set Up
    Target: Apr 30, 2026 | Owner: Abhishek Jannawar
  ...

🗺️  ROADMAP (13 OPIFs)
  OPIF-325206: Shared Merch Strategy
    Target: Jul 31, 2026 | Owner: Christopher Chiodo
  ...

================================================================================
Total: 25 OPIFs tracked
================================================================================

✅ Update complete!
```

### Second Run (With Changes)
```
================================================================================
CHANGE SUMMARY - 2026-03-26 09:00:00
================================================================================

📝 MODIFIED OPIFs (3):

  OPIF-325602: Tagging and Affinity Graph MVP
    - status: 'yellow' → 'green'
    - status_label: 'Yellow — At Risk' → 'Green — In Progress'
    - target_date: 'Q1 2026' → 'Apr 30, 2026'

  OPIF-336019: AP Tool Phase 2 Enhancements
    - target_date: 'Jul 31 2026' → 'Aug 15 2026'

  OPIF-325373: Unified Planner Experience
    - status: 'roadmap' → 'green'
    - status_label: 'Roadmap' → 'Green — Initial Requirements'

================================================================================
```

---

## Daily Usage

### Morning Routine (Every Day)

```bash
cd /Users/e0c0lzr/Downloads/fashion-portal
./update-portal-data.sh
```

**Review the change summary** to see:
- What OPIFs changed status (Green ↔ Yellow ↔ Red)
- Which target dates moved
- New OPIFs added to tracking

**That's it!** The system handles everything else.

---

## Querying Historical Data

### See all changes for a specific OPIF

```bash
sqlite3 confluence-history.db "
SELECT timestamp, field_changed, old_value, new_value 
FROM change_log 
WHERE opif_id = 'OPIF-325602' 
ORDER BY timestamp DESC;
"
```

### Find OPIFs that moved to Red status

```bash
sqlite3 confluence-history.db "
SELECT opif_id, program_name, old_value, new_value, timestamp
FROM change_log 
WHERE field_changed = 'status' AND new_value = 'red'
ORDER BY timestamp DESC;
"
```

### Get current state of all OPIFs

```bash
python3 << 'EOF'
import sqlite3
conn = sqlite3.connect('confluence-history.db')
c = conn.cursor()

c.execute('''
    SELECT opif_id, program_name, status, target_date, owner
    FROM opif_tracking
    WHERE last_updated IN (
        SELECT MAX(last_updated) FROM opif_tracking GROUP BY opif_id
    )
    ORDER BY status, opif_id
''')

for row in c.fetchall():
    print(f"{row[0]}: {row[1][:40]:40s} | {row[2]:8s} | {row[3]:15s} | {row[4]}")

conn.close()
EOF
```

---

## Automation (Optional)

To run this automatically every weekday at 9 AM:

```bash
# Create launchd job
cat > ~/Library/LaunchAgents/com.walmart.fashion-portal-update.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.walmart.fashion-portal-update</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/e0c0lzr/Downloads/fashion-portal/update-portal-data.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>1</integer><!-- Monday -->
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/e0c0lzr/Downloads/fashion-portal/auto-update.log</string>
</dict>
</plist>
EOF

# Load the job
launchctl load ~/Library/LaunchAgents/com.walmart.fashion-portal-update.plist
```

---

## Troubleshooting

### "No tables found"

**Fix:** Increase wait time for page loading

```bash
# Edit confluence-auto-export.sh
# Change: sleep 10
# To:     sleep 20
```

### "Permission denied"

```bash
chmod +x update-portal-data.sh confluence-auto-export.sh
```

### "No Confluence tab found"

**Cause:** Chrome didn't open the URL or tab was closed too early

**Fix:** Keep Chrome tab open during the 15-second extraction process

### "AppleScript permission error"

**macOS requires permission for Terminal to control Chrome:**

1. System Preferences → Privacy & Security → Automation
2. Find Terminal (or iTerm2)
3. Enable "Google Chrome"

---

## What This Solves

**Before:**
- ❌ Manual copy/paste from Confluence every time
- ❌ Explaining the export process repeatedly
- ❌ No historical tracking
- ❌ No change detection
- ❌ Prone to human error

**After:**
- ✅ One command: `./update-portal-data.sh`
- ✅ Fully automated browser extraction
- ✅ Complete historical database
- ✅ Automatic change detection with old→new comparison
- ✅ Works consistently every day
- ✅ No API access required
- ✅ No manual intervention needed

---

## Summary

You asked for a system that:
1. ✅ Exports data from Confluence consistently
2. ✅ Stores it in a source table (SQLite database)
3. ✅ Shows what changed since last export
4. ✅ Doesn't require explaining the process every time
5. ✅ Works without API access

**You got exactly that. Just run:**

```bash
./update-portal-data.sh
```

🐶 **Woof! No more explaining the export process. Ever.** 🐶
