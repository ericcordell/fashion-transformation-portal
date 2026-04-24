# Big Rocks → Goals Mapping — UPDATED

Based on your feedback:
1. ✅ Combined Goals #1 and #3 (duplicates)
2. ✅ Goal #8 → Big Rock 1 (Trend Anticipation)
3. ✅ Goals #5, #7 → Big Rock 2 (Inventory Allocation)
4. ✅ Goals #2, #1+#3 → Big Rock 3 (Systems Connected)
5. ✅ Goal #6 → Big Rock 2 (Inventory Allocation)

---

## 🏔️ Big Rock 1: WE CANNOT ANTICIPATE OR REACT TO TRENDS

### Goals:
- **Goal #4** - Reduce Merchant Hours ⏱️
  - Phase 1: Remove manual planning burden
  - Phase 3: Shift to strategy encoding
  
- **Goal #8** - Increase Sell-Through Rate 📈
  - Phase 2: Better trend prediction → less markdowns
  - Phase 3: Automated trend-to-buy cycle

### Why these goals?
Trend anticipation directly impacts merchant efficiency (#4) and sell-through (#8) by reducing reactive firefighting and markdown exposure.

---

## 🏔️ Big Rock 2: WE CANNOT PROACTIVELY ALLOCATE INVENTORY

### Goals:
- **Goal #5** - Reduce Trapped Inventory 📦
  - Phase 2: In-season redistribution capabilities
  - Phase 3: Dynamic placement automation
  
- **Goal #6** - 85% Shop In-Stock Rate 🛒
  - Phase 2: Better forecasting + BQ enterprise service
  - Phase 3: Tag-based dynamic placement
  
- **Goal #7** - 90% PO Redistribution Coverage 🔄
  - Phase 2: Systematic PO redistribution tool capability

### Why these goals?
Proactive allocation means getting inventory to the right place (#5), keeping items in stock (#6), and having the tools to redistribute dynamically (#7).

---

## 🏔️ Big Rock 3: WE CANNOT CONNECT SYSTEMS END-TO-END

### Goals:
- **Goal #1** - 90% of Buys on Happy Path (combines old #1 + #3) 🛳️✅
  - Phase 1: Complete AEX workflow without exceptions or execution failures
  - Measures both: (a) process flow adherence AND (b) execution success
  - **Combined from:** "90% Happy Path" + "Happy Path Buying Execution"
  
- **Goal #2** - Zero Rekeys Across E2E Workflow ⌧
  - Phase 1: No manual data re-entry between systems

### Why these goals?
Connected systems eliminate manual workarounds (#1) and duplicate data entry (#2).

---

## 📊 Summary Table

| Goal | Big Rock | Phase 1 | Phase 2 | Phase 3 |
|------|----------|---------|---------|---------|
| #1 (Happy Path - combined) | Big Rock 3 | ✅ | | |
| #2 (Zero Rekeys) | Big Rock 3 | ✅ | | |
| #4 (Reduce Merchant Hours) | Big Rock 1 | ✅ | | ✅ |
| #5 (Reduce Trapped Inventory) | Big Rock 2 | | ✅ | ✅ |
| #6 (85% In-Stock Rate) | Big Rock 2 | | ✅ | ✅ |
| #7 (90% PO Redistribution) | Big Rock 2 | | ✅ | |
| #8 (Increase Sell-Through) | Big Rock 1 | | ✅ | ✅ |

**Removed:** Old Goal #3 (merged into #1)

---

## 🔧 Code Changes Needed

### 1. Update `data-goals.js`:
- Combine Goals #1 and #3 into single Goal #1
- Remove Goal #3 entirely

### 2. Update `business-reviews.js` - `renderBigRockMetrics()`:

**Big Rock 1 (Trend):**
```javascript
rock1: {
  title: 'Trend Anticipation Goals — Phase Progression',
  goals: [
    { id: '4', phase: 1, label: 'Reduce Merchant Hours', icon: '⏱️' },
    { id: '8', phase: 2, label: 'Increase Sell-Through Rate', icon: '📈' },
    { id: '4', phase: 3, label: 'Reduce Merchant Hours', icon: '⏱️' },
    { id: '8', phase: 3, label: 'Increase Sell-Through Rate', icon: '📈' },
  ]
}
```

**Big Rock 2 (Allocation):**
```javascript
rock2: {
  title: 'Proactive Allocation Goals — Phase Progression',
  goals: [
    { id: '5', phase: 2, label: 'Reduce Trapped Inventory', icon: '📦' },
    { id: '6', phase: 2, label: '85% Shop In-Stock Rate', icon: '🛒' },
    { id: '7', phase: 2, label: '90% PO Redistribution Coverage', icon: '🔄' },
    { id: '5', phase: 3, label: 'Reduce Trapped Inventory', icon: '📦' },
    { id: '6', phase: 3, label: '85% Shop In-Stock Rate', icon: '🛒' },
  ]
}
```

**Big Rock 3 (Systems):**
```javascript
rock3: {
  title: 'Connected Systems Goals — Phase Progression',
  goals: [
    { id: '1', phase: 1, label: '90% of Buys on Happy Path', icon: '🛳️' },
    { id: '2', phase: 1, label: 'Zero Rekeys Across E2E Workflow', icon: '⌧' },
  ]
}
```

---

## ✅ Does this look correct?

Review and let me know if I should:
- **Apply these changes** to the code now
- **Adjust anything** in the mapping
- **Add/remove** any goals

Just say "apply it" and I'll make all the code changes! 🐶
