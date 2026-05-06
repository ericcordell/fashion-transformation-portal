// data-strategy.js — Strategy pillar card definitions
// Source: Confluence LLTT Work Management Dashboard (APREC space)
// Live Jira data: https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard
// Depends on: data.js (own, res, TBD_OWNERS, pptOwners)

const CARDS_STRATEGY = [
  {
    id: 'strategy-hub', title: 'Strategy Hub: Create and Centralize Business Strategy', icon: '\uD83C\uDFDB\uFE0F',
    status: 'green', statusLabel: 'Green \u2014 Initial Requirements',
    jiraStatus: 'Discovery in Progress',
    quarter: 'Q2', targetDate: 'May 31, 2026',
    description: 'Walmart struggles to operationalize strategy at scale because strategic intent is fragmented across PPTs, spreadsheets, and heuristic-driven processes. Strategy Hub (TTP) solves this by creating a connected, data-driven central repository where business strategy is captured once and operationalized downstream.',
    businessBenefit: 'Operationalizes business strategy in downstream systems and increases strategy creation, management, and distribution efficiency. Eliminates redundant strategy sessions and conflicting priorities across workstreams. Single source of truth for seasonal financial targets and category priorities cascaded to all fashion tools.',
    techIntegration: 'Primary OPIF: OPIF-368304 (Strategy Hub: Create and centralize business strategy, Initial Requirements). Owned by Charitha Katupitiya (TTP). Discovery underway — Apr 8 onward: DMM interviews, collecting strategy documents, connecting with data partners, formulating MLP scope, estimating engineering resources. Strategy Hub serves as the upstream data source for AEX, Centric, and BPE/DBP; decisions recorded here propagate downstream without manual re-entry. Data input requirements tracked separately in companion card: OPIF-374141.',
    successMetrics: 'Business strategy captured in a connected system rather than fragmented across PPTs and spreadsheets. All workstreams (Design, Buying, Allocation) reference Strategy Hub as primary source. Zero conflicting financial targets across workstreams in any given season. MLP scope and engineering estimates completed by end of discovery phase.',
    recentUpdate: 'Apr 16, 2026 – Companion OPIF-374141 (Strategy Hub Data Inputs) filed and now tracked on its own card.  |  Apr 8, 2026 – Discovery underway: DMM interviews, collecting strategy documents, connecting with data partners, formulating MLP scope and experience, estimating engineering resources.',
    problemStatement: 'Walmart struggles to operationalize strategy at scale because strategic intent is fragmented across PPTs, spreadsheets, and heuristic-driven processes rather than captured in a connected, data-driven system. Strategy inputs are hard to find and synthesize, and decisions are not robustly or measurably documented. As a result, strategic intent does not reliably drive downstream execution across assortment, space, and allocation, preventing automation and requiring ongoing manual intervention.',
    businessImpact: 'Business Value: Operationalize business strategy in downstream systems/increase strategy creation, management and distribution efficiency\n\n',
    owners: pptOwners('Charitha Katupitiya', 'Ramesh Simhambhatla', 'Charitha Katupitiya', 'Leon Hovanesian', ''),
    resources: res(
      'https://jira.walmart.com/browse/OPIF-368304',
      '#', '#', '#',
      [
        { label: 'OPIF-368304 — Strategy Hub: Create and centralize business strategy (Primary)', url: 'https://jira.walmart.com/browse/OPIF-368304' },
        { label: 'Strategy Hub PRD (Confluence — WIP)', url: 'https://confluence.walmart.com/display/TTPAI/Strategy+Hub+DMM+Minimum+Loveable+Product+PRD' },
        { label: 'LLTT Dashboard (Confluence)', url: 'https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard' },
      ]
    ),
    relatedOpifs: [
      { key: 'OPIF-368304', label: 'Strategy Hub: Create and Centralize Business Strategy', type: 'committed',  quarter: 'FY27Q4', pts: null, status: 'Initial Requirements' },
      { key: 'OPIF-374141', label: 'Strategy Hub Internal and External Data Inputs',         type: 'relates-to', quarter: 'FY27Q4', pts: null, status: 'Backlog' },
    ],
    workstreams: ['strategy'],
  },
  {
    id: 'strategy-hub-data-inputs', title: 'Strategy Hub: Internal & External Data Inputs', icon: '🔌',
    status: 'roadmap', statusLabel: 'Roadmap — Backlog',
    jiraStatus: 'Backlog',
    quarter: 'Q4', targetDate: 'Oct 31, 2026', tag: 'New',
    description: 'Defines and delivers the data pipelines that feed the Strategy Hub — both internal sources (AEX actuals, Centric line plans, BPE/DBP inventory signals, financial targets) and external sources (market trend data, supplier inputs, competitive signals). Without reliable data inputs, strategic decisions in the Hub cannot be grounded in real performance or market context.',
    businessBenefit: 'Merchants and leaders make strategy decisions anchored to live internal performance and external market signals — not stale spreadsheets. Automated data inputs eliminate manual data gathering before each strategy session. Consistent, governed data contracts between upstream systems and Strategy Hub prevent conflicting numbers across teams.',
    techIntegration: 'Primary OPIF: OPIF-374141 (Strategy Hub Internal and External Data Inputs, Backlog). Reporter: Charitha Katupitiya. Companion to OPIF-368304 (Strategy Hub core). Data input scope includes: AEX assortment actuals, Centric design/line plan outputs, BPE inventory signals, financial targets from TTP, and external market/trend data feeds. Sizing and assignee TBD — newly filed Apr 16, 2026.',
    successMetrics: 'All identified internal data sources flowing into Strategy Hub without manual intervention. At least one external data feed (market trend or competitive signal) integrated at MLP launch. Data contracts defined and versioned for each input source. Zero manual data-gathering steps required before a strategy session.',
    recentUpdate: 'Apr 16, 2026 – OPIF-374141 filed by Charitha Katupitiya. Backlog status. Sizing and engineering assignment pending. Companion to Strategy Hub core OPIF-368304 which is in active discovery.',
    problemStatement: 'The Strategy Hub cannot fulfil its role as a single source of strategic truth without reliable, automated data inputs. Today, strategy sessions depend on manually assembled data from AEX, Centric, BPE, and external sources — a time-consuming process prone to inconsistency. This OPIF defines and delivers the governed data pipelines that make the Strategy Hub self-sustaining.',
    owners: pptOwners('Eric Cordell', 'Ramesh Simhambhatla', 'Charitha Katupitiya', 'Leon Hovanesian', ''),
    resources: res(
      'https://jira.walmart.com/browse/OPIF-374141',
      '#', '#', '#',
      [
        { label: 'OPIF-374141 — Strategy Hub Internal and External Data Inputs (Primary)', url: 'https://jira.walmart.com/browse/OPIF-374141' },
        { label: 'OPIF-368304 — Strategy Hub Core (Related)', url: 'https://jira.walmart.com/browse/OPIF-368304' },
        { label: 'Strategy Hub PRD (Confluence — WIP)', url: 'https://confluence.walmart.com/display/TTPAI/Strategy+Hub+DMM+Minimum+Loveable+Product+PRD' },
        { label: 'LLTT Dashboard (Confluence)', url: 'https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard' },
      ]
    ),
    relatedOpifs: [
      { key: 'OPIF-374141', label: 'Strategy Hub Internal and External Data Inputs', type: 'committed',  quarter: 'FY27Q4', pts: null, status: 'Backlog' },
      { key: 'OPIF-368304', label: 'Strategy Hub: Create and Centralize Business Strategy (Related)', type: 'relates-to', quarter: 'FY27Q4', pts: null, status: 'Initial Requirements' },
    ],
    workstreams: ['strategy'],
  },
  {
    id: 'trend-api-longlead', title: 'Trend API — Long Lead & In-Season', icon: '\uD83D\uDCC8',
    status: 'green', statusLabel: 'Active', quarter: 'Q1', targetDate: 'Q1 FY27',
    description: 'Trend API providing macro-level insights to enable faster planning and product development for both long-lead and in-season use cases across Fashion. Tracked via OPIF-294460.',
    businessBenefit: 'Merchants and designers get automated trend signals fed directly into planning tools, eliminating manual trend research and accelerating line plan decisions.',
    techIntegration: 'Primary OPIF: OPIF-294460 (Trend API). API integrates with Centric (design intent), AEX (assortment weighting), and the Strategy Hub for trend-to-plan alignment.',
    successMetrics: 'Trend API serving all targeted long-lead categories. Measurable reduction in time from trend identification to plan integration.',
    owners: pptOwners('Bill Chiodetti', 'Ramesh Simhambhatla', '', 'Leon Hovanesian', ''), 
    resources: res(
      'https://jira.walmart.com/browse/OPIF-294460',
      '#', '#', '#',
      [
        { label: 'OPIF-294460 — Trend API (Primary)', url: 'https://jira.walmart.com/browse/OPIF-294460' },
      ]
    ), 
    workstreams: ['strategy'],
  },
  {
    id: 'trend-packaging-redesign', title: 'V1 Trend-to-Packaging Redesign', icon: '\uD83C\uDFA8',
    status: 'green', statusLabel: 'Green — Work in Progress', quarter: 'Q2', targetDate: 'Jul 31, 2026',
    description: 'First version of the Trend-to-Packaging redesign workflow — enabling design and product teams to take trend signals through to packaging decisions in an integrated flow. Part of the Brand Creation Experience initiative coordinating UI launch, UX evolution, core brand modules, and Trends integration. Tracked via OPIF-378798.',
    businessBenefit: 'Reduces cycle time from trend identification to packaging specification, with traceability of why packaging decisions were made. Moves from rigid linear workflows to modular, flexible brand creation patterns.',
    techIntegration: 'Primary OPIF: OPIF-378798 (Brand Creation: Experience — Launch, Brand Modules, and Trends). Trend API output feeds into Centric PLM for product and packaging spec creation. Integrated event layer connects trend source to design execution. Includes brand modules (DNA, name, logo, packaging) and orchestration layers.',
    successMetrics: 'V1 UI-based brand creation system launched to production. Packaging iteration cycle time measurably reduced. Target design categories actively using modular brand creation workflows.',
    owners: pptOwners('Bill Chiodetti', 'Ramesh Simhambhatla', 'Christopher Chiodo', 'Leon Hovanesian', 'Maeva Recchia'), 
    resources: res(
      'https://jira.walmart.com/browse/OPIF-378798',
      '#', '#', '#',
      [
        { label: 'OPIF-378798 — Brand Creation: Experience (Primary)', url: 'https://jira.walmart.com/browse/OPIF-378798' },
      ]
    ), 
    workstreams: ['strategy', 'design'],
  },
  {
    id: 'synthetic-panel', title: 'V1 Synthetic Panel (WMT Data Ventures)', icon: '\uD83E\uDD16',
    status: 'roadmap', statusLabel: 'Roadmap — Ready to Start', quarter: 'Q2', targetDate: 'Jul 31, 2026',
    description: 'Synthetic Data Digital Twins Platform enabling concept testing and consumer research at scale. Phase 1 delivers Internal Innovation Agents with synthetic personas modeled from Spark demographics and Walmart behavioral patterns. Enables rapid iteration for UX flows, packaging, claims, and copywriting evaluation. Tracked via OPIF-323040.',
    businessBenefit: 'Addresses long research lead times, high external research costs, and Spark panel fatigue. Reduces risk of product misses by simulating customer reactions to designs before commitment. Creates AI-native research infrastructure for rapid concept testing without waiting for traditional research cycles.',
    techIntegration: 'Primary OPIF: OPIF-323040 (Synthetic Data – Digital Twins Platform). Phase 1 includes synthetic personas, concept testing simulations, Semantic Similarity Rating (SSR) engine for Likert scoring. Integrates with Centric for design feedback loops and supports Scintilla product evaluation. Phase 2 (Q3-Q4) will build Digital Twins for 5,000-10,000 Spark panelists grounded in real Walmart transactional history.',
    successMetrics: 'Phase 1 synthetic personas deployed and validating concept tests. Reduction in research cycle time from weeks to days. Fashion and Scintilla teams actively consuming synthetic panel outputs for packaging and product decisions.',
    owners: pptOwners('Bill Chiodetti', 'Ramesh Simhambhatla', 'Christopher Chiodo', 'Leon Hovanesian', 'Ashwini Chandrashekharaiah'), 
    resources: res(
      'https://jira.walmart.com/browse/OPIF-323040',
      '#', '#', '#',
      [
        { label: 'OPIF-323040 — Synthetic Data – Digital Twins Platform (Primary)', url: 'https://jira.walmart.com/browse/OPIF-323040' },
      ]
    ), 
    workstreams: ['strategy'],
  },
  {
    id: 'forecast-enterprise-service', title: 'Forecast as Enterprise Service', icon: '\uD83E\uDDE0',
    status: 'green', statusLabel: 'Green — In Progress',
    quarter: 'Q3', targetDate: 'Oct 31, 2026',
    description: 'National forecasting capability delivered as a shared enterprise service — providing channel-level (eComm vs. store) and placement-split forecast outputs consumed by Buying, Allocation, and Planning teams. Enables AEX to consume forecasts aligned with AP service-based forecasting architecture. Includes model explainability and automated training pipelines. OPIF-325221 Status: Discovery in Progress. Assignee: Abhishek Jannawar. Reporter: Abhishek Jannawar. Component: US Omni Tech – MerchTools – AEX Buy Quantification. Related: OPIF-325218 (BQ as a Service), OPIF-325373 (Unified Planner Experience).',
    businessBenefit: 'Single, trusted forecast signal across all Fashion workstreams eliminates conflicting demand signals between Buying and Allocation. Forecast as a service reduces duplicative DS investment and accelerates new-department onboarding. Channel and placement splits give eComm and store teams differentiated, actionable signals without separate model builds.',
    techIntegration: 'Primary OPIF: OPIF-325221 (Forecast as a Service with Channel and Placement Split). Related: OPIF-325218 (Buy Quantification and Flow as a Service), OPIF-325373 (Unified Planner Experience). DS microservice architecture with batch inference pipeline. Forecast consumed by AEX (BQ), BPE (allocation planning), and DBP (distribution). Channel and placement split enables eComm vs. store differentiation in every forecast output. PRD: Confluence APREC space.',
    successMetrics: 'Forecast service adopted by all target Buying and Allocation workstreams. Conflicting forecast signals between workstreams eliminated. DS model training fully automated with no manual intervention required. Channel-level and placement-level splits live and consumed by AEX and BPE.',
    owners: pptOwners('Abhishek Jannawar', 'Chris Graves', 'Vivek Mishra', 'Robbie Dutta', 'Mike Dunn'),
    resources: res(
      'https://jira.walmart.com/browse/OPIF-325221',
      'https://confluence.walmart.com/display/APREC/Forecast+as+a+service+with+Channel+and+placement+split',
      'https://confluence.walmart.com/display/APREC/Forecast+as+a+service+with+Channel+and+placement+split',
      '#',
      [
        { label: 'OPIF-325221 — Forecast as a Service with Channel & Placement Split (Primary)', url: 'https://jira.walmart.com/browse/OPIF-325221' },
        { label: 'OPIF-325218 — Buy Quantification and Flow as a Service (Related)', url: 'https://jira.walmart.com/browse/OPIF-325218' },
        { label: 'OPIF-325373 — Unified Planner Experience (Related)', url: 'https://jira.walmart.com/browse/OPIF-325373' },
        { label: 'PRD: Forecast as a Service (Confluence)', url: 'https://confluence.walmart.com/display/APREC/Forecast+as+a+service+with+Channel+and+placement+split' },
        { label: 'LLTT Dashboard (Confluence)', url: 'https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard' },
      ]
    ),
    workstreams: ['strategy', 'buying', 'allocation'],
  },
  {
    id: 'growth-budget-signals', title: 'Growth & Budget IBG Signal Integration', icon: '\uD83D\uDCB9',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q2', targetDate: 'May\u2013Jul 2026',
    description: 'Integration of Growth and Budget IBG (Item-level Business Goals) signals into the Trend API and planning workflows, ensuring trend insights are anchored to financial intent.',
    businessBenefit: 'Trend decisions are automatically filtered through financial guardrails — preventing investment in trends that conflict with budget priorities.',
    techIntegration: 'IBG signals from TTP flow into the Trend API and Centric to weight trend recommendations by financial viability and growth priorities.',
    successMetrics: 'Growth and budget signals actively shaping trend API output. Planning teams no longer manually reconciling trend vs. budget in separate steps.',
    owners: pptOwners('Bill Chiodetti', 'Ramesh Simhambhatla', 'Christopher Chiodo', 'Leon Hovanesian', ''), resources: res(), workstreams: ['strategy'],
  },
  {
    id: 'trend-api-100pct', title: 'Trend API — 100% Long-Lead Categories', icon: '\uD83D\uDE80',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q2', targetDate: 'May\u2013Jul 2026',
    description: 'Expansion of the Trend API to serve 100% of long-lead Fashion categories, beyond the initial pilot set, providing enterprise-scale trend coverage.',
    businessBenefit: 'Every long-lead merchant receives automated trend signals — leveling up the quality of assortment decisions across all departments, not just pilot categories.',
    techIntegration: 'Trend API extended to all long-lead category configurations in AEX and Centric. Automated onboarding pipeline for new category additions.',
    successMetrics: 'Trend API serving 100% of long-lead categories as confirmed by category coverage report. Zero long-lead categories relying solely on manual trend research.',
    owners: pptOwners('Bill Chiodetti', 'Ramesh Simhambhatla', 'Christopher Chiodo', 'Leon Hovanesian', ''), resources: res(), workstreams: ['strategy'],
  },
  {
    id: 'category-priorities', title: 'Category Priority Framework', icon: '\uD83C\uDFAF',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q2', targetDate: 'May\u2013Jul 2026',
    description: 'Formalized category priority framework connecting top-down strategic decisions to department-level assortment, buying, and inventory plans.',
    businessBenefit: 'Investment decisions flow automatically into buying and allocation — not re-interpreted at each level.',
    techIntegration: 'Category priority data flows from TTP into AEX for assortment weighting and into BPE for inventory investment guardrails.',
    successMetrics: 'Category targets reflected in assortment plans within one planning cycle. Zero buying against a deprioritized category without approval.',
    owners: TBD_OWNERS(), resources: res(), workstreams: ['strategy'],
  },
  {
    id: 'strategy-fy27-kickoff', title: 'FY27 Strategic Planning Kickoff', icon: '\uD83D\uDCCA',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q3', targetDate: 'Aug\u2013Oct 2026',
    description: 'Formal kickoff of FY27 strategic planning cycle within TTP, incorporating learnings from FY26 transformation execution.',
    businessBenefit: 'FY27 strategy built on a proven, tool-supported foundation rather than starting from scratch each cycle.',
    techIntegration: 'TTP FY27 plan builds on FY26 platform with enhanced data feeds from AEX actuals, BPE performance, and Centric line plan completion rates.',
    successMetrics: 'FY27 strategic plan completed in TTP by end of Q3. All workstream leads aligned before Q4 FY26 planning begins.',
    owners: TBD_OWNERS(), resources: res(), workstreams: ['strategy'],
  },
  {
    id: 'strategy-transformation-review', title: 'Transformation Review & FY28 Framework', icon: '\uD83D\uDD2D',
    status: 'roadmap', statusLabel: 'Roadmap', quarter: 'Q4', targetDate: 'Nov 2026\u2013Jan 2027',
    description: 'Comprehensive review of Fashion E2E Transformation outcomes and initial FY28 strategic priorities framework.',
    businessBenefit: 'Leadership receives full-cycle ROI view and a clear foundation for the next phase of Fashion technology investment.',
    techIntegration: 'Leverages data from all systems (AEX, Centric, BPE/DBP, TTP) for a unified performance dashboard.',
    successMetrics: 'Transformation scorecard presented to senior leadership. FY28 framework drafted before end of Q4.',
    owners: TBD_OWNERS(), resources: res(), workstreams: ['strategy'],
  },
];
