# WPR Owner Audit & Fix Summary

**Date:** April 23, 2026  
**Action:** Synced Weekly Program Review owners with JIRA primary OPIF assignments  
**Portal Versions:** PROD v69 | TEST v187  

---

## 🎯 What Was Done

Audited all portal card owners against their primary OPIF assignments in JIRA and corrected **19 mismatches** where the portal showed incorrect product owners.

---

## 📊 Summary

**Total Cards Audited:** 56  
**Mismatches Found:** 19 (34% of cards)  
**Corrections Applied:** 19 (100% fixed)  

**Files Updated:**
- `data-strategy.js` — 3 owner corrections
- `data-design.js` — 3 owner corrections  
- `data-buying.js` — 8 owner corrections
- `data-allocation.js` — 5 owner corrections

---

## 🔧 All Owner Corrections

### Strategy Workstream (3 fixes)

| Card | Old Owner | → | New Owner (JIRA) |
|------|-----------|---|------------------|
| Strategy Hub | Eric Cordell | → | **Charitha Katupitiya** |
| Forecast as Enterprise Service | Brett Reid | → | **Abhishek Jannawar** |
| Shared Merch Strategy | Bill Chiodetti | → | **Christopher Chiodo** |

---

### Design Workstream (3 fixes)

| Card | Old Owner | → | New Owner (JIRA) |
|------|-----------|---|------------------|
| Design Hub (Centric PLM) | Tammy Hawkins | → | **Christopher Chiodo** |
| Shared Event Layer | Tammy Hawkins | → | **Christopher Chiodo** |
| Centric Visual Board MVP | Tammy Hawkins | → | **Christopher Chiodo** |

---

### Buying Workstream (8 fixes)

| Card | Old Owner | → | New Owner (JIRA) |
|------|-----------|---|------------------|
| Automated Item Setup | Brett Reid | → | **Yahnea Owens** |
| Fashion Fixture Allocation (Visual) | Brett Reid | → | **Dhaarna Singh** |
| AI Item Repository Launch | Brett Reid | → | **Ryan Henderson** |
| Automated Size/Pack BQ | Brett Reid | → | **Abhishek Jannawar** |
| AP Tool Line Plan Integration | Brett Reid | → | **Ashwin Chidambaram** |
| BAM / Collab Intent Integration | Brett Reid | → | **Abhishek Jannawar** |
| BQ as Enterprise Service | Brett Reid | → | **Abhishek Jannawar** |
| Shared Item Repository | Brett Reid | → | **Christopher Chiodo** |

---

### Allocation Workstream (5 fixes)

| Card | Old Owner | → | New Owner (JIRA) |
|------|-----------|---|------------------|
| Tagging & Affinity Graph Pilot | Brett Reid | → | **Aravind Chiruvelli** |
| Tag-Based Recommendations | Brett Reid | → | **Abhishek Jannawar** |
| AP Phase 2 Enhancements | Ken Brockland | → | **Arun Santhiagu** |
| Enterprise Wave Planning | Veena Swaminathan | → | **Dhaarna Singh** |
| Fashion Fixture Tagging | Brett Reid | → | **Dhaarna Singh** |

---

## 🔍 Root Cause Analysis

### Pattern 1: Outdated Generic Owners
**12 of 19 fixes** were "Brett Reid" placeholders that needed to be updated to actual JIRA assignees.

**Impact:** Brett Reid appeared as owner on 12 different programs across Buying and Allocation workstreams, masking the actual responsible parties.

### Pattern 2: Organizational Changes
**3 fixes** in Design workstream: Tammy Hawkins → Christopher Chiodo  
**Likely cause:** Design Hub ownership transferred to Christopher Chiodo

### Pattern 3: New Programs
**4 fixes** for newer programs where initial owner assignments changed:
- Strategy Hub: Eric Cordell → Charitha Katupitiya
- Forecast Service: Brett Reid → Abhishek Jannawar
- Shared Merch Strategy: Bill Chiodetti → Christopher Chiodo
- AP Phase 2: Ken Brockland → Arun Santhiagu

---

## ✅ Verification

All owners now match JIRA OPIF assignments as of April 23, 2026:

```bash
# Run audit again to verify
python3 audit-and-fix-wpr-owners.py

# Output:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Total cards audited: 56
# Mismatches found: 0
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ All owners match JIRA! No issues found.
```

---

## 📋 How the Audit Works

### Data Source
Owners are pulled from the **confluence-history.db** database, which tracks all OPIF assignments from Confluence dashboards.

### Audit Process
1. Load latest OPIF owner assignments from database (51 OPIFs tracked)
2. Parse all portal data files (`data-*.js`)
3. Extract primary OPIF for each card (first JIRA link in resources)
4. Compare portal owner vs JIRA owner
5. Flag mismatches where last names don't match

### Auto-Fix Process
1. Locate card block in data file by card ID
2. Find `owners: pptOwners('NAME', ...)` pattern
3. Replace first argument (Product Owner) with JIRA owner
4. Preserve other owner roles (Tech Lead, Software Lead, etc.)

---

## 🔄 Ongoing Maintenance

### Weekly Owner Sync (Recommended)
```bash
cd ~/Downloads/fashion-portal

# Run Confluence sync to get latest OPIF data
./update-portal-data.sh

# Audit and fix any owner mismatches
python3 audit-and-fix-wpr-owners.py
# Type 'y' when prompted to apply fixes

# Rebuild and publish
python3 build-inlined.py
python3 publish-portal.py --prod

# Commit changes
git add -A
git commit -m "Weekly owner sync [date]"
git push
```

### Manual Owner Updates
If you need to update an owner manually:

1. Find the card in the appropriate data file (`data-strategy.js`, `data-design.js`, etc.)
2. Locate the `owners: pptOwners(...)` line
3. Update the first argument (Product Owner)
4. Rebuild and publish

**Example:**
```javascript
// Before
owners: pptOwners('Brett Reid', 'Chris Graves', 'Abhishek Jannawar', 'Robbie Dutta', 'Mike Dunn'),

// After
owners: pptOwners('Yahnea Owens', 'Chris Graves', 'Abhishek Jannawar', 'Robbie Dutta', 'Mike Dunn'),
```

---

## 📁 New Tools Created

### `audit-and-fix-wpr-owners.py`
Primary audit and fix script. Interactive mode allows review before applying changes.

**Usage:**
```bash
python3 audit-and-fix-wpr-owners.py
```

**Features:**
- Loads OPIF owners from database
- Audits all 56 portal cards
- Shows detailed mismatch report
- Prompts for confirmation before fixing
- Auto-applies corrections
- Preserves other owner roles (Tech Lead, etc.)

### `audit-wpr-owners.py`
Audit-only script (no fixes). Useful for reporting.

**Usage:**
```bash
python3 audit-wpr-owners.py
```

### `owner-mismatches.json`
Output file with all detected mismatches in JSON format.

**Use case:** Programmatic processing, reporting, or custom fix scripts.

---

## 🔗 Published URLs

**PRODUCTION (Live):**  
https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-prod (v69)

**TEST (Staging):**  
https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-test (v187)

💡 **Hard-refresh:** `⌘+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

---

## 📊 Owner Distribution After Fix

**Christopher Chiodo:** 5 programs (Design Hub, Centric integrations, Shared Merch Strategy)  
**Abhishek Jannawar:** 5 programs (Forecast, BQ, Size/Pack, BAM, Tag-Based Recs)  
**Dhaarna Singh:** 3 programs (Fixture Allocation, Wave Planning)  
**Ashwin Chidambaram:** 1 program (AP Tool Line Plan)  
**Yahnea Owens:** 1 program (Automated Item Setup)  
**Ryan Henderson:** 1 program (AI Item Repository)  
**Aravind Chiruvelli:** 1 program (Tagging Pilot)  
**Charitha Katupitiya:** 1 program (Strategy Hub)  
**Arun Santhiagu:** 1 program (AP Phase 2)  

---

## ✅ Summary

All Weekly Program Review owners are now accurate and synced with JIRA OPIF assignments. The portal correctly reflects who is responsible for each program.

**Next audit recommended:** Weekly (every Monday with Confluence sync)

---

**Generated:** 2026-04-23  
**Commit:** a800532  
**Portal:** PROD v69 | TEST v187  
**Total Corrections:** 19 across 4 workstreams  
