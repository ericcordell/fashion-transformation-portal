// data-allocation.js — Allocation pillar card definitions + PILLARS assembly
// Source: Confluence LLTT Work Management Dashboard (APREC space)
// Live Jira: https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard
// Depends on: data.js, data-strategy.js, data-design.js, data-buying.js

const CARDS_ALLOCATION = [
  {
    id: 'unified-planning', title: 'Unified Planning Workflow', icon: '\uD83D\uDD17',
    status: 'green', statusLabel: 'Active', quarter: 'Q1', targetDate: 'Feb\u2013Apr 2026',
    description: 'Consolidates competing planning tools into a single vertically-owned workflow. Decisions recorded once in BPE, surfaced everywhere — forecast overrides propagate without re-entry.',
    businessBenefit: 'Planners work in one environment instead of reconciling multiple competing tools. Forecast changes propagate automatically across BPE, DBP, and downstream systems.',
    techIntegration: 'BPE is unified planning system of record. Integration with AEX ensures buy quantities reflect the latest demand signal. DBP consumes BPE outputs for distribution planning.',
    successMetrics: 'All planning decisions recorded in BPE as single source of truth. Off-system workarounds eliminated. Forecast override propagation reduced from days to hours.',
    owners: TBD_OWNERS(), resources: res(),
  },
  {
    id: 'bpe-seasonal', title: 'BPE Seasonal Planning', icon: '\uD83D\uDCC8',
    status: 'green', statusLabel: 'Active', quarter: 'Q1', targetDate: 'Feb\u2013Apr 2026',
    description: 'BPE supports seasonal planning for approximately 5 fashion departments, enabling demand and buy quantity decisions in an integrated planning environment.',
    businessBenefit: 'Inventory planners get an integrated seasonal view connecting demand signal, open-to-buy, and historical performance — smarter buy quantity decisions earlier in the season.',
    techIntegration: 'BPE seasonal outputs feed into AEX for buy quantity guardrails and DBP for pre-season distribution planning. Integration with TTP for seasonal financial target alignment.',
    successMetrics: 'Seasonal plan completed in BPE for all 5 in-scope departments by planning deadline. Buy quantities in AEX align to BPE demand signal within defined tolerance.',
    owners: TBD_OWNERS(), resources: res(),
  },
  {
    id: 'tagging-pilot', title: 'Tagging & Affinity Graph — Assortment Gaps Pilot', icon: '\uD83C\uDFF7\uFE0F',
    status: 'green', statusLabel: 'Green \u2014 In Discovery',
    quarter: 'Q2', targetDate: 'Jul 31, 2026',
    description: 'Pilot program using product tagging and affinity graphs to identify assortment gaps in Fashion. Builds the tagging taxonomy and affinity model that powers all downstream tag-based capabilities (fixture allocation, line recommendations, in-season swaps). Pilot DS model expected ready by March 13. Foundation of the LLTT Recommend & Optimize phase.',
    businessBenefit: 'Allocation teams proactively identify assortment coverage gaps before in-season sell-out signals surface. Tagging foundation enables automated recommendations and dynamic allocation across all future phases.',
    techIntegration: 'Jira: OPIF-325602 (Tagging & Affinity Graph). DS model built on BigQuery. Tagging taxonomy integrates with AEX assortment data and Centric product records. CSA and DS sizing in progress. Affinity graph powers downstream recommendation engine.',
    successMetrics: 'Tagging pilot DS model live by Mar 13. Assortment gap identification validated with merchant team. Tagging taxonomy covers all target Fashion categories. Affinity graph accuracy confirmed.',
    owners: pptOwners('Michael Allen', '', ''),
    resources: res('https://jira.walmart.com/browse/OPIF-325602'),
  },
  {
    id: 'distrib-optimization', title: 'Distribution Planning Optimization', icon: '\uD83D\uDCE6',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q2', targetDate: 'May\u2013Jul 2026',
    description: 'Optimization of distribution planning logic in DBP — improving store-level allocation accuracy based on demand signals, sell-through rates, and inventory positions.',
    businessBenefit: 'More product lands in the right store at the right time — reducing markdowns from over-allocation and lost sales from under-allocation.',
    techIntegration: 'DBP optimization layer consumes real-time store inventory, AEX committed buy data, and BPE demand signals for improved allocation recommendations.',
    successMetrics: 'Store-level in-stock rate improves vs. prior season. Over-allocation markdown rate decreases. Allocation accuracy score tracked weekly.',
    owners: TBD_OWNERS(), resources: res(),
  },
  {
    id: 'enterprise-trend-api-inseason', title: 'Enterprise Trend API \u2014 In-Season / Cont. Merch', icon: '\uD83D\uDCF6',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q2', targetDate: 'May\u2013Jul 2026',
    description: 'Enterprise-scale Trend API configured for in-season and continuous merchandising use cases in Allocation — enabling real-time trend signals to inform replenishment and allocation decisions.',
    businessBenefit: 'Allocation teams react to in-season trend shifts with data-driven replenishment recommendations rather than relying solely on historical velocity signals.',
    techIntegration: 'Enterprise Trend API serves Fashion in-season via integration with BPE replenishment and DBP allocation workflows. Shares same API layer as Strategy and Design trend workstreams.',
    successMetrics: 'Trend API live for in-season Allocation workflows. Replenishment recommendations incorporating trend signal adopted by target allocation teams.',
    owners: pptOwners('Bill Chiodetti', '', ''), resources: res(),
  },
  {
    id: 'tag-based-recommendations', title: 'Tag-Based Line & In-Season Recommendations', icon: '\uD83E\uDD16',
    status: 'roadmap', statusLabel: 'Roadmap \u2014 Recommend & Optimize Phase',
    quarter: 'Q3', targetDate: 'Aug\u2013Oct 2026',
    description: 'Leverage the tagging taxonomy and affinity graph from the Q2 pilot to power automated in-season assortment recommendations and dynamic store-level swaps. Replaces manual in-season allocation decisions with system-generated tag-based recommendations. Includes dynamic PO re-distribution as part of the LLTT Recommend & Optimize phase.',
    businessBenefit: 'Allocation teams receive proactive, data-driven swap recommendations instead of reacting to sell-out events. Dynamic PO re-distribution reduces trapped inventory and improves in-stock rates across the season.',
    techIntegration: 'Jira: OPIF-325373 (Tag-based In-Season Swaps), OPIF-325374 (Dynamic PO Re-Distribution). Builds on Tagging Pilot (OPIF-325602). Recommendation engine consumes affinity graph, in-season velocity, and inventory position from DBP and AEX.',
    successMetrics: 'Tag-based swap recommendations adopted by target allocation teams. Dynamic PO re-distribution covering >90% of eligible POs by end of Q3. Trapped inventory rate measurably reduced vs. prior season.',
    owners: pptOwners('Michael Allen', 'TBD', 'TBD'),
    resources: res('https://jira.walmart.com/browse/OPIF-325373'),
  },
  {
    id: 'assort-product-phase2', title: 'Assort Product (AP) Phase 2 Enhancements', icon: '\uD83D\uDCCB',
    status: 'roadmap', statusLabel: 'Roadmap \u2014 Recommend & Optimize Phase',
    quarter: 'Q3', targetDate: 'Aug\u2013Oct 2026',
    description: 'Phase 2 of AP Tool enhancements — including modular volume groups (MVG), on-demand store volume groups and size curves, assortment optimization engine, and fixture preference workflow improvements. Enables shared event calendar and unified potential items view (OneSource + MINT integration). Connects AP Tool to the enterprise forecast service.',
    businessBenefit: 'AP Tool transitions from allocation execution tool to a connected recommendation engine — surfacing AI-driven suggestions for fixture allocation, CC rules, and store clustering based on tagging and demand signals.',
    techIntegration: 'Jira: OPIF-325216, OPIF-325217 (AP Phase 2). MVG and on-demand volume groups built into AP Tool. Assortment optimization engine consumes tagging, affinity graph, and BQ forecast service. Shared event calendar connects AP, Centric, and OneSource.',
    successMetrics: 'AP Phase 2 features adopted by target merchant groups. CC rule automation live. Assortment optimization engine surfacing recommendations for >80% of assortment decisions. Shared event calendar live across AP, Centric, OneSource.',
    owners: pptOwners('Michael Allen', 'TBD', 'TBD'),
    resources: res('https://jira.walmart.com/browse/OPIF-325216'),
  },
  {
    id: 'enterprise-wave-planning', title: 'Enterprise Wave Planning & Allocation', icon: '\uD83C\uDFEA',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q3', targetDate: 'Aug\u2013Oct 2026',
    description: 'Enterprise-grade wave planning and distribution execution capabilities — from committed buy through to store distribution and exits. Part of the LLTT Setup phase goal: automate new store PO process and enable dynamic redistribution of confirmed POs as in-season demand signals emerge.',
    businessBenefit: 'Allocation teams get an automated wave planning tool connected to assortment and buy decisions in AEX and BPE — closing the E2E loop from commit to shelf.',
    techIntegration: 'Jira: OPIF-325598, OPIF-325599 (Wave Planning). DBP consumes finalized buy and assortment data from AEX and BPE to generate wave plans. Integration with store systems and supply chain for automated distribution execution. New Store PO automation included.',
    successMetrics: 'Wave plans generated automatically from committed buy data. Distribution executed without manual re-entry into store systems. In-stock rate improvement measurable within first season.',
    owners: pptOwners('Veena Swaminathan', '', ''),
    resources: res('https://jira.walmart.com/browse/OPIF-325598'),
  },
  {
    id: 'fashion-fixture-tagging', title: 'Fashion Fixture Allocation: Tagging-Based Assortment', icon: '\uD83C\uDFF7\uFE0F',
    status: 'green', statusLabel: 'Green \u2014 In Discovery',
    quarter: 'Q4', targetDate: 'Jan 30, 2027',
    description: 'Advanced fixture allocation using tagging and affinity data to drive assortment recommendations — dependent on the Q2 Tagging Pilot results. Product Discovery in progress.',
    businessBenefit: 'Fixture assortment driven by data-informed tagging rather than manual merchant judgment — improving product placement relevance and reducing slow-sellers in key fixtures.',
    techIntegration: 'Builds on the Q2 Tagging Pilot infrastructure. Affinity graph and tagging model output integrated into fixture allocation planning workflow.',
    successMetrics: 'Tagging-based fixture assortment recommendations live for target categories. Fixture-level sell-through rate improving vs. manually-planned fixtures.',
    owners: pptOwners('Michael Allen', '', ''), resources: res(),
  },
  {
    id: 'merch-financial', title: 'Merchandise Financial Planning', icon: '\uD83D\uDCB0',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q4', targetDate: 'Nov 2026\u2013Jan 2027',
    description: 'Future-state integrated merchandise financial planning supporting all fashion departments within a unified toolset — replacing fragmented MFP across spreadsheets and legacy tools.',
    businessBenefit: 'Gives leadership real-time visibility into financial performance against plan. All Fashion departments plan in one MFP tool.',
    techIntegration: 'MFP integrates with TTP (top-down targets), AEX (buy actuals), and BPE (demand plan) to produce a closed-loop financial view from strategy to execution.',
    successMetrics: 'Financial plan vs. actuals reconciliation time reduced. Leadership has real-time MFP dashboard access. All Fashion departments in unified MFP by end of Q4.',
    owners: TBD_OWNERS(), resources: res(),
  },
];

// ============================================================
// PILLARS ASSEMBLY — all four pillar arrays must be loaded first
// ============================================================
const PILLARS = [
  {
    id: 'strategy', title: 'Strategy', subtitle: 'Strategy Hub (TTP)',
    tool: 'Strategy Hub (TTP)', toolNote: 'Cross-functional \u00b7 All teams',
    headerClass: 'pillar-dark',
    phases: ['Strategy', 'Design', 'Repository', 'Space', 'Line Plan'],
    cards: CARDS_STRATEGY,
  },
  {
    id: 'design', title: 'Design', subtitle: 'Product Design & Creation',
    tool: 'Centric PLM', toolNote: 'All product design',
    headerClass: 'pillar-blue',
    phases: ['Space', 'Design', 'Repository', 'Line Plan'],
    cards: CARDS_DESIGN,
  },
  {
    id: 'buying', title: 'Buying', subtitle: 'Assortment, Commit & Item Setup',
    tool: 'AEX + AP Tools', toolNote: 'AEX (Apparel ~8 depts) \u00b7 BPE / DBP',
    headerClass: 'pillar-gold',
    phases: ['Forecast', 'Assortment', 'Buy Qty (BQ)', 'Wave Plan', 'Commit', 'Item Setup'],
    cards: CARDS_BUYING,
  },
  {
    id: 'allocation', title: 'Allocation', subtitle: 'Inventory Management & Distribution',
    tool: 'BPE / DBP / AP Tool', toolNote: 'All depts \u2014 all segments',
    headerClass: 'pillar-navy',
    phases: ['Wave Plan', 'Distribution', 'Exits'],
    cards: CARDS_ALLOCATION,
  },
];