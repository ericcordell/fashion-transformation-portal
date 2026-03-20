# OPIF Audit Instructions

## Overview
This document explains how to audit all OPIF-mapped projects in the portal and sync them with actual Jira data.

## Step 1: Fill in the CSV

Open `opif-audit.csv` and for each row, visit the Primary OPIF in Jira and fill in these columns:

### Jira Fields to Extract:

1. **jira_status_color** - Look for the "Status Color" field
   - Possible values: `red`, `yellow`, `green`
   - Maps to portal `status` field

2. **jira_target_quarter** - Look for the "Target Quarter" field
   - Example: `Q2`, `Q3`, `Q4`
   - Maps to portal `quarter` field

3. **jira_activity_type** - Look for the "Activity Type" field
   - Example: `Feature`, `Milestone`, `Enhancement`

4. **jira_due_date** - Look for the "Due" field
   - Use the exact date shown (e.g., `Jul 31, 2026`)
   - Maps to portal `targetDate` field

5. **jira_priority** - Look for the "Priority" field
   - Possible values: `P1`, `P2`, `P3`, etc.
   - P1 is highest priority
   - Maps to portal `priority` field

6. **jira_tech_rank** - Look for the "Tech Rank" field
   - Numeric value (e.g., `1`, `2`, `3`)
   - Used as tiebreaker when Priority is the same
   - **If Tech Rank is empty/null:** Leave blank (card will be treated as backlog)

### Status Label Mapping:

Based on the Status Color, the status label will be auto-generated:
- `red` → "Red — At Risk"
- `yellow` → "Yellow — [Activity Type]" (e.g., "Yellow — Pending Sizing")
- `green` → "Green — On Track"
- `backlog` → "Backlog" (for items without Tech Rank)

## Step 2: Save the CSV

After filling in all Jira columns, save the CSV file.

## Step 3: Run the Update Script

Run this command to automatically update all portal data files:

```bash
python3 update-from-audit.py
```

The script will:
1. Read the filled CSV
2. Update all data files (data-strategy.js, data-design.js, data-buying.js, data-allocation.js)
3. Add `techRank` field to all cards
4. Re-sort cards within each workstream by Priority (P1 first) then Tech Rank
5. Update status, dates, and other fields to match Jira
6. Rebuild the inlined portal HTML

## Step 4: Verify Changes

Open the portal locally to verify all changes:

```bash
open portal-inlined.html
```

## Example: Filling a Row

For OPIF-325568 (AEX Line Plan Migration to AP Tool):

1. Visit: https://jira.walmart.com/browse/OPIF-325568
2. Find these fields:
   - Status Color: `yellow`
   - Target Quarter: `Q3`
   - Activity Type: `Work in Progress`
   - Due: `Jul 31, 2026`
   - Priority: `P3`
   - Tech Rank: `5` (or blank if not set)
3. Fill in the corresponding columns in the CSV

## Cards Without Tech Rank

If a card has no Tech Rank value in Jira:
- Leave `jira_tech_rank` blank in CSV
- The card will automatically be:
  - Set to `status: 'backlog'`
  - Ranked at the bottom of its workstream
  - Sorted alphabetically among other backlog items

## Sorting Rules

Cards within each workstream will be sorted by:
1. **Priority** (P1 → P2 → P3 → Backlog)
2. **Tech Rank** (1 → 2 → 3... within same priority)
3. **Alphabetical** (for backlog items without Tech Rank)

---

**Need Help?** Check the OPIF page in Jira - all required fields should be visible in the Details section.
