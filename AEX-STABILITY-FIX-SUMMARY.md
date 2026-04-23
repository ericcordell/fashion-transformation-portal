# E2E Fashion Portal - AEX Stability Fix Summary

## ✅ What Was Fixed

The AEX Stability Q1 and Q2 cards now show the correct project breakdowns as reported by your team member.

### Before → After

**Q1 AEX Stability:**
- ❌ Before: "12 Stability-workstream OPIFs — 🟢 10 On Track · 🟡 1 At Risk · 🔴 1 Delayed"
- ✅ After: "18 total projects — ✅ 10 Delivered to Production · 🧪 8 In QE Testing/UAT (still in progress)"

**Q2 AEX Stability:**
- ❌ Before: "84 OPIFs planned — 🟢 10 Active · 🟡 74 In Planning"
- ✅ After: "18 total projects — 🟢 13 Sized & Committed for Delivery · 🟡 2 Pending Sizing · 🔵 2 In Product Discovery · 🔴 1 Cannot Be Committed"

---

## 🔗 Published URLs

✅ **PROD (Live):** https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-prod
- Published: v67
- Access: Public

✅ **TEST (Staging):** https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-test
- Published: v183
- Access: Business only

💡 **Tip:** If you don't see the changes, do a hard-refresh: `⌘+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

---

## 🛠️ What We Built

### 1. **quick-manual-update.py** (Immediate Fix)
Quick Python script to manually update the portal with exact numbers when you know them.

**Usage:**
```bash
cd ~/Downloads/fashion-portal
python3 quick-manual-update.py
```

This is what we just used to fix the portal. Edit the numbers at the top of the file if they change.

---

### 2. **enhanced-jira-sync.py** (Automated Sync)
Advanced JIRA sync script that pulls data from the Confluence dashboard filters and groups by OPIF Commit Status.

**Usage:**
```bash
# Sync Q1
python3 enhanced-jira-sync.py --quarter Q1

# Sync Q2
python3 enhanced-jira-sync.py --quarter Q2

# Dry-run (preview only)
python3 enhanced-jira-sync.py --quarter Q1 --dry-run
```

**Requirements:**
- JIRA Personal Access Token
- Generate one: `python3 generate-jira-pat.py`
- Save it: `echo 'JIRA_TOKEN=<your_token>' >> .env`

**How it works:**
1. Queries JIRA using the same filters as Confluence dashboards:
   - `FY27-Q1-Assortment` (for Q1)
   - `FY27-Q2-Assortment` (for Q2)
2. Filters by Workstream = "Stability"
3. Groups OPIFs by their "OPIF Commit Status" field
4. Maps to user-friendly categories:
   - Q1: "Delivered to Production" vs "In QE Testing/UAT"
   - Q2: "Sized & Committed" vs "Pending Sizing" vs "Product Discovery" vs "Cannot Commit"
5. Updates the portal cards automatically

---

## 📋 Understanding the Data Sources

The Confluence dashboards you mentioned are **dynamic** — they use JIRA macros to pull live data:

**Q1 Planning & Execution Dashboard:**
- URL: https://confluence.walmart.com/pages/viewpage.action?pageId=3344546530
- JIRA Filter: `FY27-Q1-Assortment`
- Workstream Label: `Assortment-Stability`

**Q2 Planning & Execution Dashboard:**
- URL: https://confluence.walmart.com/pages/viewpage.action?pageId=3396380774
- JIRA Filter: `FY27-Q2-Assortment`
- Workstream Label: `Assortment-Stability`

The key field we need from JIRA is **"OPIF Commit Status"** or **"Activity Type (OPIF Commit Status)"**, which has values like:
- Committed
- Pending Sizing
- Product Discovery
- Cannot Commit
- Sizing Complete
- Ready for Walkthrough
- Initial Requirements

---

## 🔄 How to Keep the Portal Updated

### Option 1: Quick Manual Update (Fastest)
When you get new numbers from your team:

1. Edit `quick-manual-update.py` - update the numbers at the top:
   ```python
   Q1_DATA = {
       "total": 18,
       "delivered_to_production": 10,
       "in_qe_testing": 8,
   }
   
   Q2_DATA = {
       "total": 18,
       "sized_and_committed": 13,
       "pending_sizing": 2,
       "product_discovery": 2,
       "cannot_commit": 1,
   }
   ```

2. Run the script:
   ```bash
   python3 quick-manual-update.py
   ```

3. Rebuild and publish:
   ```bash
   python3 build-inlined.py
   python3 publish-portal.py --test    # verify first
   python3 publish-portal.py --prod    # then go live
   ```

4. Commit to git:
   ```bash
   git add -A
   git commit -m "Update AEX Stability numbers for [date]"
   git push
   ```

---

### Option 2: Automated JIRA Sync (Most Accurate)
Set up a JIRA token once, then sync automatically:

1. **One-time setup:**
   ```bash
   python3 generate-jira-pat.py
   # Follow the prompts to generate and save your token
   ```

2. **Run syncs:**
   ```bash
   # Sync both quarters
   python3 enhanced-jira-sync.py --quarter Q1
   python3 enhanced-jira-sync.py --quarter Q2
   
   # Rebuild and publish
   python3 build-inlined.py
   python3 publish-portal.py --test
   python3 publish-portal.py --prod
   ```

3. **Optional: Schedule it**
   Add to your daily sync script or cron job to run automatically.

---

## 🎯 Why This Matters

The portal now reflects the **actual delivery pipeline** for AEX Stability work:

**Q1** shows **delivery status** → what's live vs what's still being tested
**Q2** shows **planning status** → what's committed vs what's still being scoped

This gives stakeholders a much clearer picture of:
- What's actually shipped and in production
- What's in the quality assurance pipeline
- What's committed for next quarter vs still in discovery

---

## 🐶 Files Changed

```
~/Downloads/fashion-portal/
├── data-buying.js                    # Updated Q1/Q2 card descriptions
├── portal-final.html                 # Rebuilt (published to PROD v67)
├── portal-inlined.html               # Rebuilt (506 KB)
├── enhanced-jira-sync.py             # New: automated JIRA sync
├── quick-manual-update.py            # New: quick manual fix script
└── [commit c67b27b]                  # Git committed
```

---

## ✅ Verification Checklist

- [x] Q1 card shows 18 total (10 delivered + 8 in testing)
- [x] Q2 card shows 18 total (13 committed + 2 pending + 2 discovery + 1 cannot)
- [x] Portal rebuilt successfully
- [x] Published to TEST (v183)
- [x] Published to PROD (v67)
- [x] Validation gate passed (all critical cards OK)
- [x] Changes committed to git
- [x] Created reusable sync scripts for future updates

---

## 📞 Questions or Issues?

If the numbers don't match what you see in Confluence/JIRA:

1. **Check the JIRA filters:** Make sure you're looking at the same filters the sync uses
2. **Check the workstream label:** Confirm OPIFs are tagged with `Assortment-Stability`
3. **Check the commit status field:** The categorization depends on this JIRA field
4. **Run enhanced sync with --dry-run:** See what the script would pull before applying

**Need help?** Ping Code Puppy with:
```
/e2e update --help
```

---

**Generated:** 2026-04-23
**Portal Version:** PROD v67, TEST v183
**Commit:** c67b27b
