# OPIF Updates System for Weekly Program Review

## Overview

The **Update** column in the Weekly Program Review (WPR) displays a summary of recent work completed on each program over the last 14 days (with focus on last 7 days).

## Current Status

✅ **UI Complete**: Update column added to WPR table  
🚧 **Data Fetching**: In progress (manual updates for now)

---

## How It Works

### 1. **Manual Updates** (Current)

Add a `recentUpdate` property to any card in the data files:

```javascript
{
  id: 'auto-item-setup',
  title: 'Automated Item Setup',
  // ... other properties ...
  recentUpdate: 'Walkthroughs completed with stakeholders. Engineering team ready for sizing (Mar 20)...',
}
```

The Update column will display this text.

### 2. **OPIF Detection** (Automatic)

If a card has no `recentUpdate` but has an OPIF mapped in its `resources` array:
- Shows: *"Updates pending..."* (gray italic text)
- Indicates an OPIF exists but hasn't been fetched yet

### 3. **No OPIF Mapped** (Automatic)

If a card has no OPIF in resources:
- Shows: *"No OPIF mapped"* (gray italic text)
- Indicates this program doesn't have Jira tracking

---

## Automated OPIF Fetching (Future)

### Script: `fetch-opif-updates.py`

**What it does:**
1. Parses all `data-*.js` files to extract card IDs and their OPIF IDs
2. Fetches Jira issue history/comments for each OPIF from last 14 days
3. Uses LLM to generate executive summaries of recent work
4. Outputs `opif-updates.json` with updates for each card

**Current Status:**
- ✅ Card/OPIF extraction working (found 19 cards with OPIFs)
- 🚧 Jira API integration in progress
- 🚧 LLM summarization pending

**To run (when complete):**
```bash
python3 fetch-opif-updates.py
```

Outputs: `opif-updates.json`

---

## Loading Automated Updates

When `opif-updates.json` exists, the portal will automatically load it:

```javascript
// In portal initialization
if (window.OPIF_UPDATES) {
  // Updates loaded from opif-updates.json
  // getCardUpdate() will use them automatically
}
```

**JSON Format:**
```json
{
  "auto-item-setup": {
    "opif_id": "OPIF-344926",
    "summary": "Walkthroughs completed. Engineering sizing underway...",
    "last_updated": "2026-03-26T18:37:00Z"
  },
  "design-hub-centric": {
    "opif_id": "OPIF-325206",
    "summary": "Contract finalization in progress. 12-week onboarding timeline confirmed...",
    "last_updated": "2026-03-26T18:37:00Z"
  }
}
```

---

## Next Steps

### Option 1: Manual Updates (Quick)
- Add `recentUpdate` property to critical program cards
- Update weekly before WPR meetings
- Simple, no automation needed

### Option 2: Automated OPIF Fetching (Advanced)
- Complete Jira API integration in `fetch-opif-updates.py`
- Add LLM summarization (using Pydantic AI or similar)
- Run script weekly to generate `opif-updates.json`
- Load JSON file into portal

### Option 3: Hybrid
- Use automated fetching for cards with OPIFs
- Fallback to manual updates for cards without OPIFs
- Best of both worlds

---

## Files

```
fashion-portal/
├── business-reviews.js       # WPR rendering + getCardUpdate()
├── reviews.css               # Update column styles (.wpr-update-cell)
├── data-buying.js            # Card data (includes recentUpdate examples)
├── fetch-opif-updates.py     # OPIF fetching script (in progress)
└── opif-updates.json         # Generated updates (future)
```

---

## Example: Adding Manual Update

**Before:**
```javascript
{
  id: 'visual-boards',
  title: 'Centric Visual Board MVP',
  status: 'green',
  targetDate: 'July 30, 2026',
  tag: 'Critical Program',
  // ...
}
```

**After:**
```javascript
{
  id: 'visual-boards',
  title: 'Centric Visual Board MVP',
  status: 'green',
  targetDate: 'July 30, 2026',
  tag: 'Critical Program',
  recentUpdate: 'Design reviews complete. Prototype built showing fit management workflow. Stakeholder demo scheduled for April 3. On track for July 30 launch.',
  // ...
}
```

---

## Summary

✅ **Update column added to WPR**  
✅ **Manual updates working** (`recentUpdate` property)  
✅ **OPIF detection working** (shows "Updates pending..." or "No OPIF mapped")  
🚧 **Automated OPIF fetching** (script skeleton complete, needs Jira API + LLM)  

**Recommendation for tonight:**
- Test the Update column in the WPR
- Try adding `recentUpdate` to 2-3 critical programs
- Decide if manual updates are sufficient or if you want full automation

**Future work:**
- Complete Jira API integration
- Add LLM summarization
- Schedule weekly `fetch-opif-updates.py` runs
