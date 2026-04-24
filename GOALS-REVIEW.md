# E2E Portal Goals — Current State Review

**Purpose:** Review all goals for duplication/clarity before mapping to Big Rocks

---

## Current Goals in `data-goals.js`

### Goal #1: 90% of Buys on Happy Path 🛳️
- **Target:** 90% of fashion apparel buys complete the full AEX workflow end-to-end without exceptions, manual workarounds, or out-of-tool steps.
- **Baseline:** Significantly below 90% today. Gap is evidenced by siloed modules, manual reallocations, broken event tracking between modules, and frequent tool exits.
- **Phases:** Phase 1
- **Workstreams:** Line Planning, Assortment Product, Buy Quantification, Commitment Report, Execution, Size & Pack Optimization

---

### Goal #2: Zero Rekeys Across E2E Workflow ⌧
- **Target:** 0 manual rekey touchpoints across the entire E2E fashion workflow — Line Plan through Item Creation through PO Creation.
- **Baseline:** Multiple documented rekey points today: (1) Users download AEX extract → upload into AIMS for FC POs, (2) Merchants re-enter Size & Pack inputs manually, (3) Supplier item details entered separately in email AND the planning tool, (4) Commitment Report data not flowing systematically to markdown/replenishment systems.
- **Phases:** Phase 1
- **Workstreams:** Line Planning, Commitment Report, Execution, eComm End-to-End, System Enhancements

---

### Goal #3: Happy Path Buying Execution ✅
- **Target:** Buying execution steps (bridge → item creation → PO creation) complete successfully on the happy path without manual engineering intervention.
- **Baseline:** Known failure modes: finelines stuck in 'Initiation Successful' state (PRB0088065), CR-to-ADS bridge failures, 9-digit supplier ID issues (PRB0084392), Commitment Reports missing Initial Set Units (PRB0083944), and item attribute mismatches breaking PO creation.
- **Phases:** Phase 1
- **Workstreams:** Commitment Report, Execution, System Enhancements, eComm End-to-End
- **Note:** This is the execution-layer companion to Goal #1. While #1 measures whether buys flow through the happy path, #3 measures whether the execution steps complete successfully.

---

### Goal #4: Reduce Merchant Hours ⏱️
- **Target:** Directional reduction in total time merchants spend on low-value, manual, repetitive planning tasks. Phase 3 shifts the merchant role from manual planner to strategy encoder.
- **Baseline:** Significant unquantified manual burden: multiple tool toggles, manual Size & Pack runs, no in-tool analytics, Excel-based planning, season-by-season manual rebuilds.
- **Phases:** Phase 1, Phase 3
- **Workstreams:** Line Planning, Buy Quantification, Assortment Product, Financial Review, Usability, Admin Screens

---

### Goal #5: Reduce Trapped Inventory 📦
- **Target:** Directional reduction in fashion inventory that ends up in the wrong location after commit — enabled by in-season redistribution and dynamic placement capabilities.
- **Baseline:** Effectively 0% systematic redistribution capability today. 100% of the buy is locked at commit time with no in-tool recovery mechanism. All redistribution is manual, ad hoc, and rare.
- **Phases:** Phase 2, Phase 3
- **Workstreams:** Buy Quantification, Execution, eComm End-to-End, Mod Execution, Chase Buys, System Enhancements

---

### Goal #6: 85% Shop In-Stock Rate 🛒
- **Target:** 85% of shopping trips result in the customer finding the fashion item they are looking for in stock, in their size and color.
- **Baseline:** Below 85% today. Contributing causes: poor forecasting (no national forecast in line planning), manual BQ leading to inaccurate quantities, no replenishment automation linked to BQ flag, and wrong product in wrong stores.
- **Phases:** Phase 2, Phase 3
- **Workstreams:** Buy Quantification, Line Planning, Execution, Mod Execution, eComm End-to-End, System Enhancements

---

### Goal #7: 90% PO Redistribution Coverage 🔄
- **Target:** 90% of eligible Purchase Orders are covered by the dynamic PO redistribution capability — either automated or system-recommended.
- **Baseline:** Effectively 0% systematic coverage today. Redistribution is fully manual, ad hoc, and rare. No in-tool capability exists in the current AEX workflow.
- **Phases:** Phase 2
- **Workstreams:** Execution, Buy Quantification, System Enhancements, eComm End-to-End

---

### Goal #8: Increase Sell-Through Rate 📈
- **Target:** Directional increase in the percentage of ordered inventory that sells at full or near-full price before markdown/clearance. Named initiative: Fresh Waste (Markdown/Loss) Reduction.
- **Baseline:** Fashion apparel struggles with sell-through due to long lead times creating demand forecast uncertainty. Significant markdown/clearance activity currently eating into margins.
- **Phases:** Phase 2, Phase 3
- **Workstreams:** Buy Quantification, Line Planning, Execution, Mod Execution, eComm End-to-End, Chase Buys, System Enhancements
- **Note:** This is the ultimate financial outcome metric for LLTT — if Goals #5 (trapped inventory), #6 (in-stock), and #7 (PO redistribution) all improve, sell-through increases as a result.

---

## 🔍 Analysis: Potential Duplication/Overlap

### Goal #1 vs Goal #3
- **Goal #1:** Measures if buys flow through the happy path (process flow)
- **Goal #3:** Measures if execution steps complete successfully (execution reliability)
- **Verdict:** These seem complementary, not duplicative. #1 = process adherence, #3 = execution success.

### Goal #5, #6, #7, #8 (All Phase 2/3 allocation/inventory goals)
- **Goal #5:** Reduce trapped inventory (wrong location)
- **Goal #6:** In-stock rate (customer finds item)
- **Goal #7:** PO redistribution coverage (tool capability)
- **Goal #8:** Sell-through rate (financial outcome)
- **Verdict:** These build on each other. #7 enables #5, which improves #6, which drives #8. Not duplicative but hierarchical.

---

## 📝 Your Review

**Instructions:** Mark any goals that you think are:
1. **Duplicates** (should be combined)
2. **Missing** (should add new goals)
3. **Wrongly defined** (need clarification/change)

```
DUPLICATES TO COMBINE:


MISSING GOALS TO ADD:


GOALS NEEDING CLARIFICATION:


```

---

Once we clean this up, THEN we can map them to Big Rocks properly! 🐶
