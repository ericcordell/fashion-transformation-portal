# OPIF Audit Summary

## ✅ Fixed Issue: OPIF-325568

**Card:** AEX Line Plan Migration to AP Tool (appears in both Design and Buying workstreams)

**Changes Applied:**
- **Status:** Green → **Yellow** (Work in Progress)
- **Target Date:** Oct 30, 2026 → **July 31, 2026**
- **Quarter:** Q1 / Q3 → **Q3** (consistent now)
- **Priority:** Added **P3**
- **Tech Rank:** Added **5**

**Both occurrences updated:**
1. `data-design.js` - `aex-lineplan-migration`
2. `data-buying.js` - `ap-tool-lineplan`

---

## 📋 Audit Files Created

### 1. `opif-audit.csv`
Contains all 20 OPIF-mapped cards with:
- Current portal data (status, dates, priority)
- Empty columns for Jira data (to be filled manually)
- Columns: `jira_status_color`, `jira_target_quarter`, `jira_activity_type`, `jira_due_date`, `jira_priority`, `jira_tech_rank`

### 2. `OPIF-AUDIT-INSTRUCTIONS.md`
Detailed instructions on:
- Which Jira fields to extract
- How to fill the CSV
- Status label mapping rules
- Sorting/ranking rules

---

## 🔄 Recommended Workflow for Full Audit

### Option 1: Manual Updates (Safest)
1. Open `opif-audit.csv`
2. For each OPIF, visit the Jira page and fill in the 6 Jira columns
3. Save the CSV
4. Provide it to me and I'll manually update the portal files
5. Review changes with `git diff`
6. Rebuild and deploy

### Option 2: Semi-Automated
1. Fill the CSV as above
2. I can create a simple script to apply the updates
3. We'll test on a single file first
4. Then apply to all files

### Option 3: One-by-One Fixes
- As issues are discovered, provide me the OPIF number and correct values
- I'll fix them individually (like I did with OPIF-325568)
- This is slower but very safe

---

## 📊 Cards Requiring Audit

Found **20 OPIF-mapped cards** across 4 workstreams:

### Strategy (2 cards)
- OPIF-325221 - Forecast as Enterprise Service
- OPIF-325206 - Shared Merch Strategy & Scenario Planning

### Design (4 cards)
- OPIF-347498 - Launch Design Hub (Centric PLM)
- OPIF-325568 - AEX Line Plan Migration to AP Tool ✅ **FIXED**
- OPIF-325188 - Shared Event Layer
- OPIF-347498 - Centric Visual Board MVP

### Buying (10 cards)
- OPIF-344926 - AEX Stability & Quality of Life
- OPIF-344926 - Automated Item Setup
- OPIF-325598 - Fashion Fixture Allocation
- OPIF-337970 - AI Item Repository Launch
- OPIF-325374 - Automated Size/Pack BQ
- OPIF-325568 - AP Tool Line Plan Integration ✅ **FIXED**
- OPIF-325569 - BAM / Collab Intent Integration
- OPIF-325218 - BQ as Enterprise Service
- OPIF-325203 - Shared Item Repository (OneItem)

### Allocation (4 cards)
- OPIF-325602 - Tagging & Affinity Graph Pilot
- OPIF-325373 - Tag-Based Recommendations
- OPIF-336019 - Assort Product Phase 2
- OPIF-325599 - Enterprise Wave Planning

---

## 🎯 Key Fields to Extract from Jira

For each OPIF, get these 6 fields:

1. **Status Color** (red/yellow/green) → Portal `status`
2. **Target Quarter** (Q1/Q2/Q3/Q4) → Portal `quarter`
3. **Activity Type** (e.g., "Pending Sizing", "Work in Progress") → Used in status label
4. **Due Date** (e.g., "July 31, 2026") → Portal `targetDate`
5. **Priority** (P1/P2/P3) → Portal `priority` (for sorting)
6. **Tech Rank** (1, 2, 3...) → Portal `techRank` (for sorting within priority)

### ⚠️ Important: Tech Rank
- If Tech Rank is **empty/null** in Jira → Card becomes **backlog**
- Backlog cards sort to the bottom of their workstream
- This helps identify uncommitted vs committed work

---

## 🚀 Next Steps

**Immediate:**
- ✅ OPIF-325568 is now fixed and deployed
- Portal updated at: https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal

**Short Term:**
- Review the updated portal to confirm OPIF-325568 looks correct
- Decide which audit approach you prefer (Options 1, 2, or 3 above)
- Begin filling `opif-audit.csv` or flag other incorrect OPIFs

**Long Term:**
- Establish a regular sync process (weekly/monthly)
- Consider automating with Jira API if authentication can be set up
- Add Tech Rank field to all existing cards (currently missing from most)

---

## 📁 Files in Downloads/fashion-portal/

- `opif-audit.csv` - Audit spreadsheet (open with Excel)
- `OPIF-AUDIT-INSTRUCTIONS.md` - Detailed field extraction guide
- `data-*.js` files - Source data (updated with OPIF-325568 fix)
- `portal-inlined.html` - Latest built portal

---

**Questions? Next OPIF to fix?** Let me know which approach works best for you!
