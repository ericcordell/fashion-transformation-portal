// data-biz-impact.js — Business Impact Timeline data
// Scope: Q1 + Q2 FY27 (Feb–Jul 2026) | All LLTT Programs
//
// Each capability has:
//   label     — SHORT (fits ~1 line in a chip)
//   narrative — RICH paragraph shown in the modal click-through
//   cardId    — Program Card ID in the portal (used to open modal)
//   workstream — buying | design | strategy | allocation
//   opifLabel  — OPIF-XXXXXX (or 'LLTT Dashboard')
//   opifUrl    — Jira or Confluence link
//   type       — 'automation' (work removed) | 'capability' (new ability)
//   quarter    — 'Q1' | 'Q2'
//   target     — target date string

const LLTT = 'https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard';
const BIZ_IMPACT_GOALS = [
  // ──────────────────────────────────────────────────────────────
  // GOAL 1: ZERO REKEYS
  // ──────────────────────────────────────────────────────────────
  {
    id: 'zero-rekeys',
    label: 'Zero Rekeys',
    icon: '✏️',
    color: '#0053e2',
    description: 'Every decision captured once — data flows everywhere automatically, no copy-paste, no re-entry.',
    capabilities: [
      {
        label: 'AEX assortment decisions auto-flow into item setup — no merchant re-entry',
        narrative: 'Once a merchant finalizes decisions in AEX, item setup kicks off automatically. The same intent captured in AEX becomes the item record — no download, no re-upload, no separate form to fill. This eliminates the most documented rekey point in the Fashion workflow.',
        cardId: 'auto-item-setup', workstream: 'buying',
        opifLabel: 'OPIF-344926', opifUrl: 'https://jira.walmart.com/browse/OPIF-344926',
        program: 'Automated Item Setup', programId: 'auto-item-setup',
        type: 'automation', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'AI auto-completes item attributes — merchants stop filling data gaps',
        narrative: 'Gen AI enrichment fills missing item attribute fields before submission — merchants are no longer the quality backstop for item data. AI completes the work that previously required manual lookup, supplier clarification, and re-entry across multiple systems.',
        cardId: 'auto-item-setup', workstream: 'buying',
        opifLabel: 'OPIF-344926', opifUrl: 'https://jira.walmart.com/browse/OPIF-344926',
        program: 'Automated Item Setup', programId: 'auto-item-setup',
        type: 'automation', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'Size ordering unified across Size & Pack — cross-tool reconciliation gone',
        narrative: 'Size discrepancies between AEX Size & Pack and other tools have historically forced merchants to manually reconcile conflicting size sequences. This Q1 fix unifies size ordering so data entered once is consistent everywhere — no more reconciliation loop.',
        cardId: 'aex-stability', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AEX Stability & Quality of Life', programId: 'aex-stability',
        type: 'automation', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'Product specs enter Centric once and distribute to sourcing automatically',
        narrative: 'With Centric as the system of record for design specifications, specs are authored once and propagate automatically to Supplier One and item setup systems. Vendors receive spec packages without manual email distribution — breaking a long-standing multi-step rekey loop.',
        cardId: 'product-specs', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Product Specifications', programId: 'product-specs',
        type: 'automation', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'Bamboo Rose retired — design data lives in Centric, not scattered tools',
        narrative: 'Centric Visual Board MVP replaces Bamboo Rose entirely. Design decisions are captured once in Centric with live product data — no more re-entering the same information across disconnected whiteboard and PLM tools. 5,000+ Miro boards also move into a managed Centric workflow.',
        cardId: 'visual-boards', workstream: 'design',
        opifLabel: 'OPIF-325208', opifUrl: 'https://jira.walmart.com/browse/OPIF-325208',
        program: 'Centric Visual Board MVP', programId: 'visual-boards',
        type: 'automation', quarter: 'Q2', target: 'July 30, 2026',
      },
      {
        label: 'Sample status and fit feedback live in the product record — spreadsheets retired',
        narrative: 'Fit evaluation outcomes and sample milestone tracking now live directly inside the Centric product record. Teams no longer maintain parallel spreadsheets or email threads to track sample status — everything is timestamped and linked to the actual item in PLM.',
        cardId: 'sample-mgmt-fit-eval', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Sample Management & Fit Evaluation', programId: 'sample-mgmt-fit-eval',
        type: 'automation', quarter: 'Q2', target: 'July 30, 2026',
      },
      {
        label: 'AP Tool, Centric, and OneSource share live events — no batch sync gaps',
        narrative: 'The Shared Event Layer connects AP Tool, Centric, and OneSource through a real-time event bus. When data changes in one system it propagates automatically — eliminating the manual sync, reconciliation, and batch delay that currently force teams to re-enter the same updates across tools.',
        cardId: 'shared-event-layer', workstream: 'design',
        opifLabel: 'OPIF-325188', opifUrl: 'https://jira.walmart.com/browse/OPIF-325188',
        program: 'Shared Event Layer', programId: 'shared-event-layer',
        type: 'automation', quarter: 'Q2', target: 'July 30, 2026',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // GOAL 2: HAPPY PATH BUYING
  // ──────────────────────────────────────────────────────────────
  {
    id: 'happy-path',
    label: 'Happy Path Buying',
    icon: '🛤️',
    color: '#059669',
    description: 'AEX decisions execute end-to-end without manual workarounds, system exits, or engineering calls.',
    capabilities: [
      {
        label: 'Neo platform complete — resilient AEX foundation for all Q1 capabilities',
        narrative: 'The Neo replatform migrated all AEX Fashion departments to a modern architecture — 700+ automated test cases, 360+ issues resolved, and 50% fewer support tickets YoY. Every Q1 capability delivery builds on this new foundation. This is the inflection point that makes the rest of the happy path possible.',
        cardId: 'neo-replatform', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AEX Replatform — Neo', programId: 'neo-replatform',
        type: 'capability', quarter: 'Q1', target: 'March 2, 2026 ✅',
      },
      {
        label: 'AEX decisions auto-trigger item and PO creation end-to-end',
        narrative: 'Once assortment decisions are finalized in AEX, the buying workflow completes automatically — item creation, PO generation, and supplier notification all execute without merchant intervention. IDC owns exceptions through a managed queue, keeping merchants out of the execution loop entirely.',
        cardId: 'auto-item-setup', workstream: 'buying',
        opifLabel: 'OPIF-344926', opifUrl: 'https://jira.walmart.com/browse/OPIF-344926',
        program: 'Automated Item Setup', programId: 'auto-item-setup',
        type: 'capability', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'Confirmation required before fineline deletions — accidents prevented',
        narrative: 'A confirmation dialog now blocks accidental fineline and style deletions that previously broke downstream workflows silently. This safeguard directly addresses one of the top-cited causes of AEX workflow failures — protecting in-flight buys from inadvertent state corruption.',
        cardId: 'aex-stability', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AEX Stability & Quality of Life', programId: 'aex-stability',
        type: 'capability', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'New store POs generated automatically — manual buyer creation eliminated',
        narrative: 'When new stores are added to the assortment, POs are now generated automatically from AEX data — buyers no longer create new store orders by hand. This removes one of the most time-consuming manual execution steps from the buying workflow.',
        cardId: 'aex-stability', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AEX Stability & Quality of Life', programId: 'aex-stability',
        type: 'automation', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'Size and pack buy quantities calculated automatically — manual BQ step eliminated',
        narrative: 'The Automated Size/Pack BQ program moves size curve selection and pack configuration into an automated engine — pre-generating Distribution Service results for the 3 like-finelines recommended by AEX, with configurable minimum initial set quantity for core sizes. Merchants stop running manual size calculations entirely.',
        cardId: 'size-pack-bq', workstream: 'buying',
        opifLabel: 'OPIF-325374', opifUrl: 'https://jira.walmart.com/browse/OPIF-325374',
        program: 'Automated Size/Pack BQ', programId: 'size-pack-bq',
        type: 'automation', quarter: 'Q2', target: 'July 31, 2026',
      },
      {
        label: 'Items surface from Supplier Catalog automatically — no manual search',
        narrative: 'The AI Item Repository uses ML similarity scoring to surface the closest matching existing items from the Supplier Catalog directly in the AP Tool line plan workflow. Merchants reuse, modify, or replace — rather than rebuild from scratch. The line plan auto-populates with potential items before merchants even start.',
        cardId: 'ai-item-repository', workstream: 'buying',
        opifLabel: 'OPIF-337970', opifUrl: 'https://jira.walmart.com/browse/OPIF-337970',
        program: 'AI Item Repository', programId: 'ai-item-repository',
        type: 'capability', quarter: 'Q2', target: 'July 31, 2026',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // GOAL 3: REDUCE MERCHANT HOURS
  // ──────────────────────────────────────────────────────────────
  {
    id: 'reduce-hours',
    label: 'Reduce Merchant Hours',
    icon: '⏱️',
    color: '#b86000',
    description: 'Automate the repetitive, manual work so the team can focus on strategy and buying decisions.',
    capabilities: [
      {
        label: 'Merchants removed from item setup entirely — hundreds of hours per season saved',
        narrative: 'Automated Item Setup eliminates fashion merchants from the item creation and PO execution workflow completely. The IDC team owns all exceptions through a managed queue. Estimated impact: hundreds of hours per season returned to the merchant org — time previously spent on data entry, supplier follow-up, and manual setup troubleshooting.',
        cardId: 'auto-item-setup', workstream: 'buying',
        opifLabel: 'OPIF-344926', opifUrl: 'https://jira.walmart.com/browse/OPIF-344926',
        program: 'Automated Item Setup', programId: 'auto-item-setup',
        type: 'automation', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'Planners work in one tool — competing systems and re-entries eliminated',
        narrative: 'Unified Planning Workflow consolidates fragmented BPE, DBP, and manual reconciliation tools into a single environment. Forecast overrides entered once propagate automatically — planners stop duplicating the same decision across multiple tools and stop maintaining off-system workarounds.',
        cardId: 'unified-planning', workstream: 'allocation',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Unified Planning Workflow', programId: 'unified-planning',
        type: 'automation', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'Seasonal plan built in BPE — Excel rebuilds replaced with integrated planning',
        narrative: 'BPE Seasonal Planning moves seasonal demand and buy quantity decisions out of Excel and into an integrated planning environment covering approximately 5 fashion departments. Historical data, open-to-buy, and seasonal performance are all surfaced in one view — merchants stop maintaining manual season-by-season spreadsheet rebuilds.',
        cardId: 'bpe-seasonal', workstream: 'allocation',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'BPE Seasonal Planning', programId: 'bpe-seasonal',
        type: 'automation', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'AEX platform more stable — less time spent escalating bugs and workarounds',
        narrative: 'The Neo-era AEX Stability program delivers measurable support ticket reduction (50% YoY from Neo baseline) and platform reliability improvements. Merchants spend less time initiating bug escalations, building manual workarounds, and waiting for engineering intervention — buying hours shift toward actual buying decisions.',
        cardId: 'aex-stability', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AEX Stability & Quality of Life', programId: 'aex-stability',
        type: 'capability', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: '5,000+ Miro boards consolidated into Centric — manual visual management gone',
        narrative: 'Centric Visual Board MVP migrates all design team visual assortment planning from Miro into Centric — with live product data, not static snapshots. 5,000+ boards that required ongoing manual maintenance and update cycles across multiple tools are replaced with a single managed workspace directly connected to the product record.',
        cardId: 'visual-boards', workstream: 'design',
        opifLabel: 'OPIF-325208', opifUrl: 'https://jira.walmart.com/browse/OPIF-325208',
        program: 'Centric Visual Board MVP', programId: 'visual-boards',
        type: 'automation', quarter: 'Q2', target: 'July 30, 2026',
      },
      {
        label: 'Pack size curves automated — merchants stop running manual BQ calculations',
        narrative: 'Pre-generated DS results for all 3 AEX-recommended like-finelines eliminate the manual sizing step that currently requires merchant expertise and time. Pack simplification further reduces AEX BQ execution complexity — merchants move from running calculations to reviewing outputs.',
        cardId: 'size-pack-bq', workstream: 'buying',
        opifLabel: 'OPIF-325374', opifUrl: 'https://jira.walmart.com/browse/OPIF-325374',
        program: 'Automated Size/Pack BQ', programId: 'size-pack-bq',
        type: 'automation', quarter: 'Q2', target: 'July 31, 2026',
      },
      {
        label: 'AI surfaces reusable items — merchants build less line plan from scratch',
        narrative: 'The AI Item Repository indexes the Supplier Catalog and historical AEX items, using ML similarity scoring to surface the best matches before merchants start a line plan. Instead of building each item from scratch, merchants review AI-curated suggestions — significantly reducing time spent on new-item creation for carryover and near-duplicate styles.',
        cardId: 'ai-item-repository', workstream: 'buying',
        opifLabel: 'OPIF-337970', opifUrl: 'https://jira.walmart.com/browse/OPIF-337970',
        program: 'AI Item Repository', programId: 'ai-item-repository',
        type: 'capability', quarter: 'Q2', target: 'July 31, 2026',
      },
      {
        label: 'Fixture planning goes visual and AI-assisted — spreadsheets eliminated',
        narrative: 'Fashion Fixture Allocation provides an AI-assisted visual interface for product-to-fixture planning — replacing complex spreadsheets with a visual canvas surfacing AI recommendations based on tagging and affinity graph data. Merchants see recommended assortments per fixture rather than building fixture plans manually from scratch.',
        cardId: 'fashion-fixture-allocation-buying', workstream: 'buying',
        opifLabel: 'OPIF-325598', opifUrl: 'https://jira.walmart.com/browse/OPIF-325598',
        program: 'Fashion Fixture Allocation', programId: 'fashion-fixture-allocation-buying',
        type: 'capability', quarter: 'Q2', target: 'July 31, 2026',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // GOAL 4: SMARTER DECISIONS
  // ──────────────────────────────────────────────────────────────
  {
    id: 'smarter-decisions',
    label: 'Smarter Decisions',
    icon: '🧠',
    color: '#7c3aed',
    description: 'AI and data signals replace manual research — teams make confident decisions faster.',
    capabilities: [
      {
        label: 'Trend signals fed directly into planning tools — manual trend research eliminated',
        narrative: 'The Trend API delivers macro trend signals directly into Centric and AEX workflows — merchants and designers see consolidated trend context without running separate research, manually triangulating sources, or waiting for trend report delivery. Trend-informed decisions happen earlier in the season.',
        cardId: 'trend-api-longlead', workstream: 'strategy',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Trend API — Long Lead & In-Season', programId: 'trend-api-longlead',
        type: 'capability', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'Consumer reactions simulated pre-production — risky line plan decisions reduced',
        narrative: 'The V1 Synthetic Consumer Panel (built with Walmart Data Ventures) provides simulated customer response data before designs go to production — giving teams a signal on what customers are likely to buy before the line plan locks. This reduces the risk of costly new product misses and markdown-prone assortment choices.',
        cardId: 'synthetic-panel', workstream: 'strategy',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Synthetic Panel (WMT Data Ventures)', programId: 'synthetic-panel',
        type: 'capability', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'Single financial target source for all workstreams — conflicting signals gone',
        narrative: 'Strategy Hub (TTP) is now the upstream source of record for all seasonal financial targets across Design, Buying, and Allocation. Targets cascade downstream automatically — teams stop receiving conflicting priority directives from different sources. Decisions across workstreams are aligned to the same financial guardrails from day one.',
        cardId: 'strategy-hub', workstream: 'strategy',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Strategy Hub (TTP)', programId: 'strategy-hub',
        type: 'capability', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'AI detects assortment coverage gaps — blind spots surfaced before sell-out',
        narrative: 'The Tagging & Affinity Graph pilot uses product taxonomy and ML-powered affinity models to identify assortment coverage gaps that merchant intuition alone typically misses. Gaps are surfaced proactively — before in-season sell-out signals arrive — giving allocation teams time to act rather than react.',
        cardId: 'tagging-pilot', workstream: 'allocation',
        opifLabel: 'OPIF-325602', opifUrl: 'https://jira.walmart.com/browse/OPIF-325602',
        program: 'Tagging & Affinity Graph Pilot', programId: 'tagging-pilot',
        type: 'capability', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: '5+ trend sources available before line plan locks — multi-signal consensus',
        narrative: 'Trend API Pre-Season launches with 5+ integrated trend data providers — giving designers and merchants a consolidated multi-source trend consensus before the line plan locks for the season. Teams stop manually triangulating between individual trend reports and instead see an aggregated signal surfaced directly in Centric and AEX.',
        cardId: 'trend-api-preseason', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Trend API — 5+ Sources Pre-Season', programId: 'trend-api-preseason',
        type: 'capability', quarter: 'Q2', target: 'July 31, 2026',
      },
      {
        label: 'Single trusted forecast shared across Buying and Allocation — aligned demand signal',
        narrative: 'Forecast as an Enterprise Service delivers one channel-level (eComm vs. store) and placement-split forecast consumed by both Buying (AEX BQ) and Allocation (BPE/DBP). Conflicting demand signals between workstreams are eliminated — teams make buy and distribution decisions from the same data, with model explainability and automated training pipelines.',
        cardId: 'forecast-enterprise-service', workstream: 'strategy',
        opifLabel: 'OPIF-325221', opifUrl: 'https://jira.walmart.com/browse/OPIF-325221',
        program: 'Forecast as Enterprise Service', programId: 'forecast-enterprise-service',
        type: 'capability', quarter: 'Q2', target: 'July 31, 2026',
      },
      {
        label: 'Store allocation driven by demand signals — fewer over and under stocks',
        narrative: 'Distribution Planning Optimization improves store-level allocation accuracy in DBP by consuming real-time store inventory positions, AEX committed buy data, and BPE demand signals together. More product lands at the right store at the right time — reducing both over-allocation markdowns and under-allocation lost sales.',
        cardId: 'distrib-optimization', workstream: 'allocation',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Distribution Planning Optimization', programId: 'distrib-optimization',
        type: 'capability', quarter: 'Q2', target: 'July 31, 2026',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // GOAL 5: CONNECTED TEAMS
  // ──────────────────────────────────────────────────────────────
  {
    id: 'connected-teams',
    label: 'Connected Teams',
    icon: '🔗',
    color: '#0891b2',
    description: 'Design, Buying, Strategy, and Allocation work from the same data in real time — no handoff lag.',
    capabilities: [
      {
        label: 'Design, Buying, and Sourcing aligned in one Centric system — silos broken',
        narrative: 'Design Hub launch makes Centric PLM the single system of record shared across Design, Buying, and Sourcing. Design decisions made in Centric are immediately visible to buying and automatically available to vendors through Supplier One — the handoff delay between design intent and downstream execution collapses from days to minutes.',
        cardId: 'design-hub-centric', workstream: 'design',
        opifLabel: 'OPIF-325208', opifUrl: 'https://jira.walmart.com/browse/OPIF-325208',
        program: 'Launch Design Hub (Centric PLM)', programId: 'design-hub-centric',
        type: 'capability', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'Shared calendar connects design milestones to buying readiness in real time',
        narrative: 'Line Planning & Calendar Management in Centric gives all workstreams visibility into the same design milestones and planning calendar. Buying teams see exactly when line plans are finalized and buying readiness targets are set — without waiting for design to distribute calendar updates manually.',
        cardId: 'line-planning', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Line Planning & Calendar Management', programId: 'line-planning',
        type: 'capability', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'Financial guardrails shared before assortment decisions begin — aligned from day one',
        narrative: 'Space & Financial Planning capabilities distribute pre-approved space and financial targets to all workstreams before each seasonal planning cycle begins. Design, Buying, and Allocation start aligned — reducing the mid-season financial reforecasting that occurs when teams discover conflicting guardrails mid-buy.',
        cardId: 'space-planning', workstream: 'strategy',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Space & Financial Planning', programId: 'space-planning',
        type: 'capability', quarter: 'Q1', target: 'April 30, 2026',
      },
      {
        label: 'Design intent visible to Buying in real time — fewer late-stage line plan changes',
        narrative: 'AP Tool Shared Ideation integration connects Centric design ideation events to the AP Tool assortment view in real time. Buying teams see evolving design intent during ideation — not a finished document handed off weeks later. Early signal reduces the late-stage line plan changes that currently create rework across both workstreams.',
        cardId: 'ap-tool-shared-ideation', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AP Tool Shared Ideation', programId: 'ap-tool-shared-ideation',
        type: 'capability', quarter: 'Q2', target: 'July 31, 2026',
      },
      {
        label: 'Product assets centralized — teams stop chasing file versions via email',
        narrative: 'Centralized DAM Launch provides a single location for all product imagery, CAD files, and design assets integrated with Centric. Product imagery is always current and linked to the live product record — vendors receive assets through Supplier One without manual email distribution, and internal teams stop spending time locating the right version of the right file.',
        cardId: 'centralized-dam', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Centralized DAM Launch', programId: 'centralized-dam',
        type: 'capability', quarter: 'Q2', target: 'July 31, 2026',
      },
      {
        label: 'Supplier intent structured in AEX — email rounds with vendors eliminated',
        narrative: 'BAM / Collab Intent Integration captures supplier intent directly inside AEX as structured data — replacing the current email-based BAM communication cycle. Supplier clarification rounds that currently require multiple emails, follow-ups, and manual data entry are replaced by a connected workflow that keeps buying and supplier data in sync automatically.',
        cardId: 'bam-collab-intent', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'BAM / Collab Intent Integration', programId: 'bam-collab-intent',
        type: 'automation', quarter: 'Q2', target: 'October 30, 2026',
      },
    ],
  },
];

// Program → display config (color, short label)
const BIZ_PROGRAM_CONFIG = {
  'auto-item-setup':               { label: 'Item Setup',         color: '#f59e0b', textColor: '#1f2937' },
  'aex-stability':                 { label: 'AEX Stability',      color: '#0053e2', textColor: '#ffffff' },
  'visual-boards':                 { label: 'Centric Viz',        color: '#6366f1', textColor: '#ffffff' },
  'neo-replatform':                { label: 'Neo Replatform',     color: '#16a34a', textColor: '#ffffff' },
  'size-pack-bq':                  { label: 'Size/Pack BQ',       color: '#d97706', textColor: '#ffffff' },
  'ai-item-repository':            { label: 'AI Repository',      color: '#0891b2', textColor: '#ffffff' },
  'fashion-fixture-allocation-buying': { label: 'Fixture Alloc',  color: '#7c3aed', textColor: '#ffffff' },
  'product-specs':                 { label: 'Product Specs',      color: '#64748b', textColor: '#ffffff' },
  'sample-mgmt-fit-eval':          { label: 'Sample Mgmt',        color: '#db2777', textColor: '#ffffff' },
  'shared-event-layer':            { label: 'Event Layer',        color: '#059669', textColor: '#ffffff' },
  'unified-planning':              { label: 'Unified Planning',   color: '#b86000', textColor: '#ffffff' },
  'bpe-seasonal':                  { label: 'BPE Seasonal',       color: '#854d0e', textColor: '#ffffff' },
  'trend-api-longlead':            { label: 'Trend API',          color: '#7c3aed', textColor: '#ffffff' },
  'synthetic-panel':               { label: 'Synth Panel',        color: '#831843', textColor: '#ffffff' },
  'strategy-hub':                  { label: 'Strategy Hub',       color: '#374151', textColor: '#ffffff' },
  'tagging-pilot':                 { label: 'Tagging/AI',         color: '#0f766e', textColor: '#ffffff' },
  'trend-api-preseason':           { label: 'Trend Pre-Season',   color: '#6d28d9', textColor: '#ffffff' },
  'forecast-enterprise-service':   { label: 'Forecast Svc',       color: '#1d4ed8', textColor: '#ffffff' },
  'distrib-optimization':          { label: 'Distrib Optim',      color: '#9a3412', textColor: '#ffffff' },
  'design-hub-centric':            { label: 'Design Hub',         color: '#0053e2', textColor: '#ffffff' },
  'line-planning':                 { label: 'Line Planning',      color: '#047857', textColor: '#ffffff' },
  'space-planning':                { label: 'Space & Finance',    color: '#1e40af', textColor: '#ffffff' },
  'ap-tool-shared-ideation':       { label: 'AP Ideation',        color: '#b45309', textColor: '#ffffff' },
  'centralized-dam':               { label: 'Centralized DAM',    color: '#0e7490', textColor: '#ffffff' },
  'bam-collab-intent':             { label: 'BAM / Collab',       color: '#4f46e5', textColor: '#ffffff' },
  'commitment-report-redesign':    { label: 'Commit Report',      color: '#15803d', textColor: '#ffffff' },
};

window.BIZ_IMPACT_GOALS   = BIZ_IMPACT_GOALS;
window.BIZ_PROGRAM_CONFIG = BIZ_PROGRAM_CONFIG;