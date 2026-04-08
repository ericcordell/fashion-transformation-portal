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
    problemStatement: 'There is currently nothing in place to efficiently provide recommendations across store, shop, and item.',
    owners: pptOwners('Brett Reid', 'Chris Graves', 'Abhishek Jannawar', 'Robbie Dutta', 'Mike Dunn'), resources: res(), workstreams: ['allocation'],
  },
  {
    id: 'bpe-seasonal', title: 'BPE Seasonal Planning', icon: '\uD83D\uDCC8',
    status: 'green', statusLabel: 'Active', quarter: 'Q1', targetDate: 'Feb\u2013Apr 2026',
    description: 'BPE supports seasonal planning for approximately 5 fashion departments, enabling demand and buy quantity decisions in an integrated planning environment.',
    businessBenefit: 'Inventory planners get an integrated seasonal view connecting demand signal, open-to-buy, and historical performance — smarter buy quantity decisions earlier in the season.',
    techIntegration: 'BPE seasonal outputs feed into AEX for buy quantity guardrails and DBP for pre-season distribution planning. Integration with TTP for seasonal financial target alignment.',
    successMetrics: 'Seasonal plan completed in BPE for all 5 in-scope departments by planning deadline. Buy quantities in AEX align to BPE demand signal within defined tolerance.',
    owners: TBD_OWNERS(), resources: res(), workstreams: ['allocation'],
  },
  {
    id: 'tagging-pilot', title: 'Tagging & Affinity Graph — Assortment Gaps Pilot', icon: '\uD83C\uDFF7\uFE0F',
    status: 'green', statusLabel: 'Green \u2014 In Discovery',
    quarter: 'Q2', targetDate: 'Jul 31, 2026',
    description: 'Pilot program using product tagging and affinity graphs to identify assortment gaps in Fashion. Builds the tagging taxonomy and affinity model that powers all downstream tag-based capabilities (fixture allocation, line recommendations, in-season swaps). Foundation of the LLTT Recommend & Optimize phase. Jira update (Mar 10, 2026): 10-Mar-2026 - Walkthrough completed on 2-Mar Risk: Delays in PRD finalization and walkthrough completed on 2-Mar.  Currently working on sizing​ Path to Green: Working with CSA and BQ for sizing. AP and DS have now provided sizing.​ Owner : Chris Gr Path to Green: Ryan has confirmed that this is anticipated to be worked on in Q1. Working with Oscar to identify Technical Lead. Current status: Pending Sizing. Assignee: Mike Dunn (TPM). Reporter: Ryan Henderson.',
    businessBenefit: 'Allocation teams proactively identify assortment coverage gaps before in-season sell-out signals surface. Tagging foundation enables automated recommendations and dynamic allocation across all future phases. Affinity graph surfaces product relationships that merchant intuition alone misses.',
    techIntegration: 'Primary OPIF: OPIF-325602 (Tagging and Affinity Graph — Ready for sizing, Ryan Henderson). Path to Green: Ryan confirmed Q1 scope, working with Oscar to identify Technical Lead. PRD: Tagging PRD (Confluence APREC space — DRAFT). DS model built on BigQuery. Tagging taxonomy integrates with AEX assortment data and Centric product records. CSA and DS sizing in progress. Affinity graph powers downstream recommendation engine.',
    successMetrics: 'Tagging pilot DS model live by Mar 13. Assortment gap identification validated with merchant team. Tagging taxonomy covers all target Fashion categories. Affinity graph accuracy confirmed. Technical Lead identified.',
    owners: pptOwners('Brett Reid', 'Chris Graves', 'Ryan Henderson', 'Robbie Dutta', 'Oscar Cantu'),
    resources: res(
      'https://jira.walmart.com/browse/OPIF-325602',
      '#',
      'https://confluence.walmart.com/display/APREC/Tagging+PRD+-+DRAFT',
      '#',
      [
        { label: 'OPIF-325602 — Tagging and Affinity Graph (Primary)', url: 'https://jira.walmart.com/browse/OPIF-325602' },
        { label: 'PRD: Tagging PRD — DRAFT (Confluence APREC)', url: 'https://confluence.walmart.com/display/APREC/Tagging+PRD+-+DRAFT' },
        { label: 'OPIF-325373 — Unified Planner Experience / Tag-based Swaps (downstream)', url: 'https://jira.walmart.com/browse/OPIF-325373' },
        { label: 'OPIF-325374 — Simplification of Pack / Dynamic PO Re-Distribution (downstream)', url: 'https://jira.walmart.com/browse/OPIF-325374' },
        { label: 'OPIF-325598 — Assisted Fixture Allocation (downstream)', url: 'https://jira.walmart.com/browse/OPIF-325598' },
        { label: 'LLTT Dashboard', url: 'https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard' },
      ]
    ),
    workstreams: ['allocation', 'buying'],
  },
  {
    id: 'distrib-optimization', title: 'Distribution Planning Optimization', icon: '\uD83D\uDCE6',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q2', targetDate: 'May\u2013Jul 2026',
    description: 'Optimization of distribution planning logic in DBP — improving store-level allocation accuracy based on demand signals, sell-through rates, and inventory positions.',
    businessBenefit: 'More product lands in the right store at the right time — reducing markdowns from over-allocation and lost sales from under-allocation.',
    techIntegration: 'DBP optimization layer consumes real-time store inventory, AEX committed buy data, and BPE demand signals for improved allocation recommendations.',
    successMetrics: 'Store-level in-stock rate improves vs. prior season. Over-allocation markdown rate decreases. Allocation accuracy score tracked weekly.',
    problemStatement: 'Provide merchants and planners with a single, unified planning experience that brings together outputs from the Forecast service and Buy Quantification / Flow services, allowing users to review, understand, and commit plans without navigating multiple disconnected steps.\n\nMerchants and planners lack a single view of the full unit plan.\nDecisions made in one step are difficult to reconcile in another.\nIteration is slow when forecasts or assumptions change.\nTranslating plans into supplier intent and purchase orders is cumbersome.\nHigh cognitive load increases execution risk.\nAs a result, planners spend more time navigating tools than making informed decisions.',
    owners: pptOwners('Veena Swaminathan', 'Sakshi Datta', 'Vivek Mishra', '', ''), resources: res(), workstreams: ['allocation'],
  },
  {
    id: 'enterprise-trend-api-inseason', title: 'Enterprise Trend API \u2014 In-Season / Cont. Merch', icon: '\uD83D\uDCF6',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q2', targetDate: 'May\u2013Jul 2026',
    description: 'Enterprise-scale Trend API configured for in-season and continuous merchandising use cases in Allocation — enabling real-time trend signals to inform replenishment and allocation decisions.',
    businessBenefit: 'Allocation teams react to in-season trend shifts with data-driven replenishment recommendations rather than relying solely on historical velocity signals.',
    techIntegration: 'Enterprise Trend API serves Fashion in-season via integration with BPE replenishment and DBP allocation workflows. Shares same API layer as Strategy and Design trend workstreams.',
    successMetrics: 'Trend API live for in-season Allocation workflows. Replenishment recommendations incorporating trend signal adopted by target allocation teams.',
    owners: pptOwners('Bill Chiodetti', 'Ramesh Simhambhatla', 'Christopher Chiodo', 'Leon Hovanesian', ''), resources: res(), workstreams: ['allocation', 'strategy'],
  },
  {
    id: 'tag-based-recommendations', title: 'Tag-Based Line & In-Season Recommendations', icon: '\uD83E\uDD16',
    status: 'roadmap', statusLabel: 'Roadmap \u2014 Recommend & Optimize Phase',
    quarter: 'Q3', targetDate: 'Aug\u2013Oct 2026',
    description: 'Leverage the tagging taxonomy and affinity graph from the Q2 pilot to power automated in-season assortment recommendations and dynamic store-level swaps. Replaces manual in-season allocation decisions with system-generated tag-based recommendations. Includes dynamic PO re-distribution and unified planner experience as part of the LLTT Recommend & Optimize phase. Requirements gathering underway.',
    businessBenefit: 'Allocation teams receive proactive, data-driven swap recommendations instead of reacting to sell-out events. Dynamic PO re-distribution reduces trapped inventory and improves in-stock rates across the season. Unified planner experience surfaces tag-based recommendations without toggling between systems.',
    techIntegration: 'Primary OPIF: OPIF-325373 (Unified Planner Experience — Requirements gathering). Related: OPIF-325374 (Simplification of Pack / Dynamic PO Re-Distribution — Requirements gathering), OPIF-325602 (Tagging and Affinity Graph — Ready for sizing, foundation), OPIF-325218 (BQ and Flow as a Service). Builds on Tagging Pilot (OPIF-325602). Recommendation engine consumes affinity graph, in-season velocity, and inventory position from DBP and AEX. PRD: Unified Planner Experience and Simplification of Pack (Confluence APREC).',
    successMetrics: 'Tag-based swap recommendations adopted by target allocation teams. Dynamic PO re-distribution covering >90% of eligible POs by end of Q3. Trapped inventory rate measurably reduced vs. prior season. Unified planner experience live and adopted.',
    owners: pptOwners('Brett Reid', 'Chris Graves', 'Ryan Henderson', 'Robbie Dutta', 'Mike Dunn'),
    resources: res(
      'https://jira.walmart.com/browse/OPIF-325373',
      'https://confluence.walmart.com/display/APREC/Unified+Planner+Experience',
      'https://confluence.walmart.com/display/APREC/Unified+Planner+Experience',
      '#',
      [
        { label: 'OPIF-325373 — Unified Planner Experience (Primary)', url: 'https://jira.walmart.com/browse/OPIF-325373' },
        { label: 'OPIF-325374 — Simplification of Pack / Dynamic PO Re-Distribution (Related)', url: 'https://jira.walmart.com/browse/OPIF-325374' },
        { label: 'OPIF-325602 — Tagging and Affinity Graph (Foundation)', url: 'https://jira.walmart.com/browse/OPIF-325602' },
        { label: 'OPIF-325218 — BQ and Flow as a Service (Related)', url: 'https://jira.walmart.com/browse/OPIF-325218' },
        { label: 'PRD: Unified Planner Experience (Confluence APREC)', url: 'https://confluence.walmart.com/display/APREC/Unified+Planner+Experience' },
        { label: 'PRD: Simplification of Pack (Confluence APREC)', url: 'https://confluence.walmart.com/display/APREC/Simplification+of+Pack' },
        { label: 'LLTT Dashboard', url: 'https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard' },
      ]
    ),
    workstreams: ['allocation', 'buying'],
  },
  {
    id: 'assort-product-phase2', title: 'Assort Product (AP) Phase 2 Enhancements', icon: '\uD83D\uDCCB',
    status: 'yellow', statusLabel: 'Yellow — At Risk',
    quarter: 'Q2', targetDate: 'Jul 31, 2026',
    jiraStatus: 'Work in Progress',
    description: 'Phase 2 of AP Tool enhancements — including modular volume groups (MVG), on-demand store volume groups and size curves, assortment optimization engine, and fixture preference workflow improvements. Enables shared event calendar and unified potential items view (OneSource + MINT integration). Connects AP Tool to the enterprise forecast service. Jira update (Feb 10, 2026): 02-10-2026 : Working with Arun on overall timeline. Dev Complete : TBD  Integration Testing : TBD  E2E Testing : TBD Current status: Work in Progress. Assignee: Arun Santhiagu (TPM). Reporter: Taylor Watson. Target completion: 2026-07-31.',
    businessBenefit: 'AP Tool transitions from allocation execution tool to a connected recommendation engine — surfacing AI-driven suggestions for fixture allocation, CC rules, and store clustering based on tagging and demand signals. Shared event calendar eliminates planning milestone re-entry across AP, Centric, and OneSource.',
    techIntegration: 'Primary OPIF: OPIF-336019 (AP Tool Phase 2 Enhancements — Dev underway, target Jul 31 2026, Ashwin Chidambaram). PRD: Phase 2 Enhancements (Confluence OLR space). Related: OPIF-325188 (Shared Project Tracking & Event Calendar — Initial Requirements, Christopher Chiodo), OPIF-325568 (Move Fashion LP to AP Tool — WIP, Ashwin Chidambaram), OPIF-325602 (Tagging and Affinity Graph — foundation). MVG and on-demand volume groups built into AP Tool. Assortment optimization engine consumes tagging, affinity graph, and BQ forecast service. Shared event calendar connects AP, Centric, and OneSource.',
    successMetrics: 'AP Phase 2 features adopted by target merchant groups. CC rule automation live. Assortment optimization engine surfacing recommendations for >80% of assortment decisions. Shared event calendar live across AP, Centric, OneSource. Jul 31 delivery met.',
    problemStatement: 'The Assortment Planning (AP) Tool was built to manage fixture allocation decisions, but today it operates without the intelligence layer needed to recommend. Merchants manually define CC rules, fixture preferences, and store clusters without AI-driven signals. Modular volume groups (MVGs) are static, size curves require manual on-demand generation, and the assortment optimization engine that should surface data-driven recommendations doesn\'t yet exist. The result: merchants spend significant time on decisions that should be automated, while the tool remains disconnected from tagging, demand signal, and shared event calendar data that would make those decisions smarter and faster.',
    _aiGenerated: ['problemStatement'],
    owners: pptOwners('Ken Brockland', 'Ashwin Chidambaram', 'Taylor Watson', 'CJ Weatherford', 'Arun Santhiagu'),
    resources: res(
      'https://jira.walmart.com/browse/OPIF-336019',
      'https://confluence.walmart.com/display/OLR/Feature+Requirements%3A+Phase+2+Enhancements',
      'https://confluence.walmart.com/display/OLR/Feature+Requirements%3A+Phase+2+Enhancements',
      '#',
      [
        { label: 'OPIF-336019 — AP Tool Phase 2 Enhancements (Primary — Dev underway)', url: 'https://jira.walmart.com/browse/OPIF-336019' },
        { label: 'OPIF-325188 — Shared Project Tracking & Event Calendar (Related)', url: 'https://jira.walmart.com/browse/OPIF-325188' },
        { label: 'OPIF-325568 — Move Fashion LP to AP Tool Assortment List (Related)', url: 'https://jira.walmart.com/browse/OPIF-325568' },
        { label: 'OPIF-325602 — Tagging and Affinity Graph (Foundation)', url: 'https://jira.walmart.com/browse/OPIF-325602' },
        { label: 'PRD: AP Tool Phase 2 Enhancements (Confluence OLR)', url: 'https://confluence.walmart.com/display/OLR/Feature+Requirements%3A+Phase+2+Enhancements' },
        { label: 'LLTT Dashboard', url: 'https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard' },
      ]
    ),
    workstreams: ['allocation', 'buying'],
  },
  {
    id: 'enterprise-wave-planning', title: 'Enterprise Wave Planning & Allocation', icon: '\uD83C\uDFEA',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q3', targetDate: 'Aug\u2013Oct 2026',
    jiraStatus: 'Initial Requirements',
    description: 'Enterprise-grade wave planning and distribution execution capabilities — from committed buy through to store distribution and exits. Part of the LLTT Setup phase goal: automate new store PO process and enable dynamic redistribution of confirmed POs as in-season demand signals emerge. Includes Category Space Planning & Dynamic In-season Execution (OPIF-325599). OPIF-325599: Status Backlog, Assignee Dhaarna Singh. OPIF-325598: Status PRD In Progress. Scope note: Corresponding with Dhaarna to determine if this OPIF is anticipated to be worked on in Q1. It\'s a maybe, but will move it to Q2 for now and if capacity allows for it, we can plan .',
    businessBenefit: 'Allocation teams get an automated wave planning tool connected to assortment and buy decisions in AEX and BPE — closing the E2E loop from commit to shelf. Category Space Planning and dynamic in-season execution enable allocation teams to react to real-time signals without manual redistribution.',
    techIntegration: 'Primary OPIF: OPIF-325599 (Category Space Planning & Dynamic In-season Execution — Requirements gathering, Dhaarna Singh). Related: OPIF-325598 (Assisted Fixture Allocation and Recommendations — Requirements gathering, Dhaarna Singh), OPIF-325373 (Unified Planner Experience), OPIF-325218 (BQ and Flow as a Service). DBP consumes finalized buy and assortment data from AEX and BPE to generate wave plans. Integration with store systems and supply chain for automated distribution execution. New Store PO automation included. PRD: Category Space Planning (Confluence APREC).',
    successMetrics: 'Wave plans generated automatically from committed buy data. Distribution executed without manual re-entry into store systems. In-stock rate improvement measurable within first season. Category space planning recommendations live and adopted by target allocation teams.',
    problemStatement: 'Current tools and processes do not support dynamic space adjustments, making it difficult to respond to inventory shifts, trend changes, or fixture adjustments with timing requiring multiple manual updates across the existing system workflows.\nSpreadsheet-driven, rigid planning weeks by season , relying on fixed modular specs and reset timelines that do not reflect real-time store demand.',
    owners: pptOwners('Veena Swaminathan', 'Sakshi Datta', 'Dhaarna Singh', 'Minwoo Kim', ''),
    resources: res(
      'https://jira.walmart.com/browse/OPIF-325599',
      'https://confluence.walmart.com/pages/viewpage.action?pageId=3261567072',
      'https://confluence.walmart.com/pages/viewpage.action?pageId=3261567072',
      '#',
      [
        { label: 'OPIF-325599 — Category Space Planning & Dynamic In-season Execution (Primary)', url: 'https://jira.walmart.com/browse/OPIF-325599' },
        { label: 'OPIF-325598 — Assisted Fixture Allocation and Recommendations (Related)', url: 'https://jira.walmart.com/browse/OPIF-325598' },
        { label: 'OPIF-325373 — Unified Planner Experience (Related)', url: 'https://jira.walmart.com/browse/OPIF-325373' },
        { label: 'OPIF-325218 — BQ and Flow as a Service (Related)', url: 'https://jira.walmart.com/browse/OPIF-325218' },
        { label: 'PRD: Category Space Planning (Confluence APREC)', url: 'https://confluence.walmart.com/pages/viewpage.action?pageId=3261567072' },
        { label: 'PRD: Assisted Fixture Allocation (Confluence APREC)', url: 'https://confluence.walmart.com/pages/viewpage.action?pageId=3261566926' },
        { label: 'LLTT Dashboard', url: 'https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard' },
      ]
    ),
    workstreams: ['allocation', 'buying'],
  },
  {
    id: 'fashion-fixture-tagging', title: 'Fashion Fixture Allocation: Tagging-Based Assortment', icon: '\uD83C\uDFF7\uFE0F',
    status: 'green', statusLabel: 'Green \u2014 In Discovery',
    quarter: 'Q4', targetDate: 'Jan 30, 2027',
    description: 'Advanced fixture allocation using tagging and affinity data to drive assortment recommendations — dependent on the Q2 Tagging Pilot (OPIF-325602) results. Product Discovery in progress. Builds on Assisted Fixture Allocation (OPIF-325598) and Category Space Planning (OPIF-325599) for a full tagging-driven fixture assortment capability. Target: Jan 30, 2027.',
    businessBenefit: 'Fixture assortment driven by data-informed tagging rather than manual merchant judgment — improving product placement relevance and reducing slow-sellers in key fixtures. Affinity graph ensures complementary products are placed together for maximum basket affinity.',
    techIntegration: 'Builds on Q2 Tagging Pilot infrastructure (OPIF-325602 — Tagging and Affinity Graph). Related: OPIF-325598 (Assisted Fixture Allocation and Recommendations — Primary fixture capability), OPIF-325599 (Category Space Planning & Dynamic In-season Execution). Affinity graph and tagging model output integrated into fixture allocation planning workflow in DBP and AP Tool. PRD: Assisted Fixture Allocation (Confluence APREC).',
    successMetrics: 'Tagging-based fixture assortment recommendations live for target categories. Fixture-level sell-through rate improving vs. manually-planned fixtures. Affinity-based product placement co-location tracked and validated.',
    problemStatement: 'Merchants spend disproportionate time manipulating data instead of curating strategy. Goal is to build system which must actively assist merchants in forming decisions.\n\nCurrent fashion planning systems primarily record merchant decisions after they are made, requiring manual effort, fragmented tools, and significant complex . Merchants spend disproportionate time manipulating data instead of curating strategy. Goal is to build system which must actively assist merchants in forming decisions.',
    owners: pptOwners('Brett Reid', 'Sakshi Datta', 'Dhaarna Singh', 'Minwoo Kim', ''),
    resources: res(
      'https://jira.walmart.com/browse/OPIF-325598',
      'https://confluence.walmart.com/pages/viewpage.action?pageId=3261566926',
      'https://confluence.walmart.com/pages/viewpage.action?pageId=3261566926',
      '#',
      [
        { label: 'OPIF-325598 — Assisted Fixture Allocation (Related primary)', url: 'https://jira.walmart.com/browse/OPIF-325598' },
        { label: 'OPIF-325599 — Category Space Planning & In-season Execution (Related)', url: 'https://jira.walmart.com/browse/OPIF-325599' },
        { label: 'OPIF-325602 — Tagging and Affinity Graph (Foundation)', url: 'https://jira.walmart.com/browse/OPIF-325602' },
        { label: 'PRD: Assisted Fixture Allocation (Confluence APREC)', url: 'https://confluence.walmart.com/pages/viewpage.action?pageId=3261566926' },
        { label: 'LLTT Dashboard', url: 'https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard' },
      ]
    ),
    workstreams: ['allocation'],
  },
  {
    id: 'merch-financial', title: 'Merchandise Financial Planning', icon: '\uD83D\uDCB0',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q4', targetDate: 'Nov 2026\u2013Jan 2027',
    description: 'Future-state integrated merchandise financial planning supporting all fashion departments within a unified toolset — replacing fragmented MFP across spreadsheets and legacy tools.',
    businessBenefit: 'Gives leadership real-time visibility into financial performance against plan. All Fashion departments plan in one MFP tool.',
    techIntegration: 'MFP integrates with TTP (top-down targets), AEX (buy actuals), and BPE (demand plan) to produce a closed-loop financial view from strategy to execution.',
    successMetrics: 'Financial plan vs. actuals reconciliation time reduced. Leadership has real-time MFP dashboard access. All Fashion departments in unified MFP by end of Q4.',
    owners: TBD_OWNERS(), resources: res(), workstreams: ['allocation'],
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
    tool: 'BPE / DBP / AP Tool', toolNote: 'All depts — all segments',
    headerClass: 'pillar-navy',
    phases: ['Wave Plan', 'Distribution', 'Exits'],
    cards: CARDS_ALLOCATION,
  },
];

// Make PILLARS globally accessible for business reviews module
window.PILLARS = PILLARS;