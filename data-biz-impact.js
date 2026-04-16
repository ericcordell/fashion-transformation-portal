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
        label: 'As a merchant, I no longer need to re-enter assortment decisions — AEX auto-flows directly into item setup the moment I finalize in AEX',
        narrative: 'Once a merchant finalizes decisions in AEX, item setup kicks off automatically. The same intent captured in AEX becomes the item record — no download, no re-upload, no separate form to fill. This eliminates the most documented rekey point in the Fashion workflow.',
        cardId: 'auto-item-setup', workstream: 'buying',
        opifLabel: 'OPIF-349684', opifUrl: 'https://jira.walmart.com/browse/OPIF-349684',
        program: 'Automated Item Setup', programId: 'auto-item-setup',
        type: 'automation', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a merchant, I no longer need to manually fill in missing item attributes — AI completes them before submission so I\u2019m not the quality backstop for item data',
        narrative: 'Gen AI enrichment fills missing item attribute fields before submission — merchants are no longer the quality backstop for item data. AI completes the work that previously required manual lookup, supplier clarification, and re-entry across multiple systems.',
        cardId: 'auto-item-setup', workstream: 'buying',
        opifLabel: 'OPIF-349684', opifUrl: 'https://jira.walmart.com/browse/OPIF-349684',
        program: 'Automated Item Setup', programId: 'auto-item-setup',
        type: 'automation', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a merchant, I no longer need to reconcile conflicting size sequences across AEX Size & Pack and downstream tools — data entered once is consistent everywhere',
        narrative: 'Size discrepancies between AEX Size & Pack and other tools have historically forced merchants to manually reconcile conflicting size sequences. This Q1 fix unifies size ordering so data entered once is consistent everywhere — no more reconciliation loop.',
        cardId: 'aex-stability', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AEX Stability & Quality of Life', programId: 'aex-stability',
        type: 'automation', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a designer, I no longer need to manually distribute spec packages to vendors — specs authored in Centric propagate automatically to Supplier One and item setup',
        narrative: 'With Centric as the system of record for design specifications, specs are authored once and propagate automatically to Supplier One and item setup systems. Vendors receive spec packages without manual email distribution — breaking a long-standing multi-step rekey loop.',
        cardId: 'product-specs', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Product Specifications', programId: 'product-specs',
        type: 'automation', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a designer, I no longer need to maintain design data across Bamboo Rose and disconnected tools — everything lives in Centric with live product data, not static snapshots',
        narrative: 'Centric Visual Board MVP replaces Bamboo Rose entirely. Design decisions are captured once in Centric with live product data — no more re-entering the same information across disconnected whiteboard and PLM tools. 5,000+ Miro boards also move into a managed Centric workflow.',
        cardId: 'visual-boards', workstream: 'design',
        opifLabel: 'OPIF-325208', opifUrl: 'https://jira.walmart.com/browse/OPIF-325208',
        program: 'Centric Visual Board MVP', programId: 'visual-boards',
        type: 'automation', quarter: 'Q2FY27', target: 'July 30, 2026',
      },
      {
        label: 'As a designer, I no longer need to maintain separate spreadsheets or email threads for sample tracking — fit feedback and milestones live directly in the Centric product record',
        narrative: 'Fit evaluation outcomes and sample milestone tracking now live directly inside the Centric product record. Teams no longer maintain parallel spreadsheets or email threads to track sample status — everything is timestamped and linked to the actual item in PLM.',
        cardId: 'sample-mgmt-fit-eval', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Sample Management & Fit Evaluation', programId: 'sample-mgmt-fit-eval',
        type: 'automation', quarter: 'Q2FY27', target: 'July 30, 2026',
      },
      {
        label: 'As a designer, I no longer need to manually sync updates across AP Tool, Centric, and OneSource — when data changes in one system it propagates in real time across all three',
        narrative: 'The Shared Event Layer connects AP Tool, Centric, and OneSource through a real-time event bus. When data changes in one system it propagates automatically — eliminating the manual sync, reconciliation, and batch delay that currently force teams to re-enter the same updates across tools.',
        cardId: 'shared-event-layer', workstream: 'design',
        opifLabel: 'OPIF-325188', opifUrl: 'https://jira.walmart.com/browse/OPIF-325188',
        program: 'Shared Event Layer', programId: 'shared-event-layer',
        type: 'automation', quarter: 'Q2FY27', target: 'July 30, 2026',
      },
      {
        label: 'As a leader, I no longer need to manually export and re-upload buy reports — committed AEX data flows automatically to markdown and replenishment systems the moment commitments lock',
        narrative: 'The Commitment Report Redesign connects committed buy data directly to downstream markdown and replenishment systems. Planners stop manually exporting, transforming, and re-uploading buy reports — the data moves automatically the moment commitments are locked in AEX.',
        cardId: 'commitment-report-redesign', workstream: 'strategy',
        opifLabel: 'OPIF-325204', opifUrl: 'https://jira.walmart.com/browse/OPIF-325204',
        program: 'Commitment Report Redesign', programId: 'commitment-report-redesign',
        type: 'automation', quarter: 'Q3FY27', target: 'October 31, 2026',
      },
      {
        label: 'As a merchant, I no longer need to search separate catalogs for ROM, 3P, and Circana items — OneItem surfaces all sources automatically and the line plan auto-populates before I start',
        narrative: 'OneItem expanded to all sources means the line plan auto-populates with item candidates from every source — ROM, third-party, and Circana syndicated data — without merchants manually searching separate catalogs and re-entering items. One search, all sources, no rekey.',
        cardId: 'oneitem-expanded-sources', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'OneItem Expanded Sources', programId: 'oneitem-expanded-sources',
        type: 'automation', quarter: 'Q4FY27', target: 'January 31, 2027',
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
        label: 'As a merchant, I now have a stable AEX foundation under me — 700+ automated tests and 50% fewer support tickets mean every Q1 capability builds on solid ground',
        narrative: 'The Neo replatform migrated all AEX Fashion departments to a modern architecture — 700+ automated test cases, 360+ issues resolved, and 50% fewer support tickets YoY. Every Q1 capability delivery builds on this new foundation. This is the inflection point that makes the rest of the happy path possible.',
        cardId: 'neo-replatform', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AEX Replatform — Neo', programId: 'neo-replatform',
        type: 'capability', quarter: 'Q1FY27', target: 'March 2, 2026 ✅',
      },
      {
        label: 'As a merchant, I no longer need to manually trigger item and PO creation — once I finalize in AEX, item creation, PO generation, and supplier notification all execute automatically',
        narrative: 'Once assortment decisions are finalized in AEX, the buying workflow completes automatically — item creation, PO generation, and supplier notification all execute without merchant intervention. IDC owns exceptions through a managed queue, keeping merchants out of the execution loop entirely.',
        cardId: 'auto-item-setup', workstream: 'buying',
        opifLabel: 'OPIF-349684', opifUrl: 'https://jira.walmart.com/browse/OPIF-349684',
        program: 'Automated Item Setup', programId: 'auto-item-setup',
        type: 'capability', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a merchant, I no longer need to worry about accidental fineline deletions silently breaking downstream workflows — a confirmation dialog now blocks the mistake before it happens',
        narrative: 'A confirmation dialog now blocks accidental fineline and style deletions that previously broke downstream workflows silently. This safeguard directly addresses one of the top-cited causes of AEX workflow failures — protecting in-flight buys from inadvertent state corruption.',
        cardId: 'aex-stability', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AEX Stability & Quality of Life', programId: 'aex-stability',
        type: 'capability', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a merchant, I no longer need to manually create new store POs by hand — when new stores are added to my assortment, POs generate automatically from AEX data',
        narrative: 'When new stores are added to the assortment, POs are now generated automatically from AEX data — buyers no longer create new store orders by hand. This removes one of the most time-consuming manual execution steps from the buying workflow.',
        cardId: 'aex-stability', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AEX Stability & Quality of Life', programId: 'aex-stability',
        type: 'automation', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a merchant, I no longer need to run manual size calculations — pack size curves and buy quantities are pre-generated for all 3 AEX-recommended like-finelines so I review outputs, not build them',
        narrative: 'The Automated Size/Pack BQ program moves size curve selection and pack configuration into an automated engine — pre-generating Distribution Service results for the 3 like-finelines recommended by AEX, with configurable minimum initial set quantity for core sizes. Merchants stop running manual size calculations entirely.',
        cardId: 'size-pack-bq', workstream: 'buying',
        opifLabel: 'OPIF-325374', opifUrl: 'https://jira.walmart.com/browse/OPIF-325374',
        program: 'Automated Size/Pack BQ', programId: 'size-pack-bq',
        type: 'automation', quarter: 'Q2FY27', target: 'July 31, 2026',
      },
      {
        label: 'As a merchant, I no longer need to manually search the Supplier Catalog — AI surfaces the closest matching existing items directly in my AP Tool workflow before I start building',
        narrative: 'The AI Item Repository uses ML similarity scoring to surface the closest matching existing items from the Supplier Catalog directly in the AP Tool line plan workflow. Merchants reuse, modify, or replace — rather than rebuild from scratch. The line plan auto-populates with potential items before merchants even start.',
        cardId: 'ai-item-repository', workstream: 'buying',
        opifLabel: 'OPIF-337970', opifUrl: 'https://jira.walmart.com/browse/OPIF-337970',
        program: 'AI Item Repository', programId: 'ai-item-repository',
        type: 'capability', quarter: 'Q2FY27', target: 'July 31, 2026',
      },
      {
        label: 'As a merchant, I no longer need to exit AP Tool to complete my line plan — every assortment decision flows from a single entry point without switching to AEX or downstream systems',
        narrative: 'The AP Tool Line Plan integration completes the buying workflow so merchants plan and execute entirely within the AP Tool. Buyers no longer switch between the AP Tool, AEX, and downstream systems to complete a line plan — every assortment decision flows from one entry point without tool exits or manual handoffs.',
        cardId: 'ap-tool-lineplan', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AP Tool Line Plan', programId: 'ap-tool-lineplan',
        type: 'capability', quarter: 'Q3FY27', target: 'October 31, 2026',
      },
      {
        label: 'As a merchant, I no longer need to run my own manual size curve and pack calculations — BQ runs as an enterprise service and delivers consistent automated recommendations for my whole team',
        narrative: 'Buy Quantification as an Enterprise Service delivers automated size curve and pack recommendations as a shared service consumed by all buying teams. The individualized, team-by-team manual runs that currently require expert institutional knowledge are replaced by a consistent, automated output — standardizing quality across the org.',
        cardId: 'bq-enterprise-service', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'BQ Enterprise Service', programId: 'bq-enterprise-service',
        type: 'automation', quarter: 'Q3FY27', target: 'October 31, 2026',
      },
      {
        label: 'As a merchant, I no longer need to switch between market-specific legacy tools to manage international lines — domestic and international assortment planning live in the same AP Tool and AEX workflow',
        narrative: 'The Global Buying Platform brings international market assortment planning into the same AP Tool and AEX workflow — buyers manage domestic and international lines without switching to market-specific legacy tools. A unified buying experience that eliminates the duplication of decisions across separate global systems.',
        cardId: 'global-buying-platform', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Global Buying Platform', programId: 'global-buying-platform',
        type: 'capability', quarter: 'Q4FY27', target: 'January 31, 2027',
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
        label: 'As a merchant, I no longer need to touch item setup at all — I\u2019m fully removed from item creation and PO execution, with hundreds of hours per season returned to actual buying decisions',
        narrative: 'Automated Item Setup eliminates fashion merchants from the item creation and PO execution workflow completely. The IDC team owns all exceptions through a managed queue. Estimated impact: hundreds of hours per season returned to the merchant org — time previously spent on data entry, supplier follow-up, and manual setup troubleshooting.',
        cardId: 'auto-item-setup', workstream: 'buying',
        opifLabel: 'OPIF-349684', opifUrl: 'https://jira.walmart.com/browse/OPIF-349684',
        program: 'Automated Item Setup', programId: 'auto-item-setup',
        type: 'automation', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a planner, I no longer need to re-enter the same forecast override across multiple tools — I work in one unified environment and it propagates automatically everywhere else',
        narrative: 'Unified Planning Workflow consolidates fragmented BPE, DBP, and manual reconciliation tools into a single environment. Forecast overrides entered once propagate automatically — planners stop duplicating the same decision across multiple tools and stop maintaining off-system workarounds.',
        cardId: 'unified-planning', workstream: 'allocation',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Unified Planning Workflow', programId: 'unified-planning',
        type: 'automation', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a planner, I no longer need to maintain manual season-by-season Excel rebuilds — seasonal demand and buy quantity decisions now happen inside BPE with historical data and OTB already surfaced',
        narrative: 'BPE Seasonal Planning moves seasonal demand and buy quantity decisions out of Excel and into an integrated planning environment covering approximately 5 fashion departments. Historical data, open-to-buy, and seasonal performance are all surfaced in one view — merchants stop maintaining manual season-by-season spreadsheet rebuilds.',
        cardId: 'bpe-seasonal', workstream: 'allocation',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'BPE Seasonal Planning', programId: 'bpe-seasonal',
        type: 'automation', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a merchant, I no longer need to spend buying hours on bug escalations and manual workarounds — a 50% YoY reduction in support tickets means my time shifts to actual buying decisions',
        narrative: 'The Neo-era AEX Stability program delivers measurable support ticket reduction (50% YoY from Neo baseline) and platform reliability improvements. Merchants spend less time initiating bug escalations, building manual workarounds, and waiting for engineering intervention — buying hours shift toward actual buying decisions.',
        cardId: 'aex-stability', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AEX Stability & Quality of Life', programId: 'aex-stability',
        type: 'capability', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a designer, I no longer need to manually maintain and update 5,000+ Miro boards — all visual assortment planning moves into Centric with live product data, not static snapshots',
        narrative: 'Centric Visual Board MVP migrates all design team visual assortment planning from Miro into Centric — with live product data, not static snapshots. 5,000+ boards that required ongoing manual maintenance and update cycles across multiple tools are replaced with a single managed workspace directly connected to the product record.',
        cardId: 'visual-boards', workstream: 'design',
        opifLabel: 'OPIF-325208', opifUrl: 'https://jira.walmart.com/browse/OPIF-325208',
        program: 'Centric Visual Board MVP', programId: 'visual-boards',
        type: 'automation', quarter: 'Q2FY27', target: 'July 30, 2026',
      },
      {
        label: 'As a merchant, I no longer need to run pack size calculations manually — DS results are pre-generated for all 3 AEX-recommended like-finelines so I review outputs instead of building them',
        narrative: 'Pre-generated DS results for all 3 AEX-recommended like-finelines eliminate the manual sizing step that currently requires merchant expertise and time. Pack simplification further reduces AEX BQ execution complexity — merchants move from running calculations to reviewing outputs.',
        cardId: 'size-pack-bq', workstream: 'buying',
        opifLabel: 'OPIF-325374', opifUrl: 'https://jira.walmart.com/browse/OPIF-325374',
        program: 'Automated Size/Pack BQ', programId: 'size-pack-bq',
        type: 'automation', quarter: 'Q2FY27', target: 'July 31, 2026',
      },
      {
        label: 'As a merchant, I no longer need to build every line plan item from scratch — AI indexes the Supplier Catalog and surfaces the best matching existing items before I even start',
        narrative: 'The AI Item Repository indexes the Supplier Catalog and historical AEX items, using ML similarity scoring to surface the best matches before merchants start a line plan. Instead of building each item from scratch, merchants review AI-curated suggestions — significantly reducing time spent on new-item creation for carryover and near-duplicate styles.',
        cardId: 'ai-item-repository', workstream: 'buying',
        opifLabel: 'OPIF-337970', opifUrl: 'https://jira.walmart.com/browse/OPIF-337970',
        program: 'AI Item Repository', programId: 'ai-item-repository',
        type: 'capability', quarter: 'Q2FY27', target: 'July 31, 2026',
      },
      {
        label: 'As a merchant, I no longer need to manage fixture plans in complex spreadsheets — I work in a visual AI-assisted canvas that recommends assortments per fixture based on tagging data',
        narrative: 'Fashion Fixture Allocation provides an AI-assisted visual interface for product-to-fixture planning — replacing complex spreadsheets with a visual canvas surfacing AI recommendations based on tagging and affinity graph data. Merchants see recommended assortments per fixture rather than building fixture plans manually from scratch.',
        cardId: 'fashion-fixture-allocation-buying', workstream: 'buying',
        opifLabel: 'OPIF-325598', opifUrl: 'https://jira.walmart.com/browse/OPIF-325598',
        program: 'Fashion Fixture Allocation', programId: 'fashion-fixture-allocation-buying',
        type: 'capability', quarter: 'Q2FY27', target: 'July 31, 2026',
      },
      {
        label: 'As a leader, I no longer need to wait for manually assembled buy report exports — style-level commitment views are navigable and shareable in seconds, not rebuilt for every stakeholder request',
        narrative: 'The redesigned Commitment Report surfaces style-level buy commitments in a structured, navigable format instead of a manually assembled export. Planners generate and share buy views in seconds rather than rebuilding the report for every stakeholder request — reclaiming hours previously spent on formatting and data reconciliation.',
        cardId: 'commitment-report-redesign', workstream: 'strategy',
        opifLabel: 'OPIF-325204', opifUrl: 'https://jira.walmart.com/browse/OPIF-325204',
        program: 'Commitment Report Redesign', programId: 'commitment-report-redesign',
        type: 'automation', quarter: 'Q3FY27', target: 'October 31, 2026',
      },
      {
        label: 'As a sourcing associate, I no longer need to chase sample status and revision approvals over email — vendors access milestones, spec packages, and fit feedback directly in Supplier One',
        narrative: 'Supplier One integration into the design workflow gives vendors structured access to sample milestones, spec packages, and fit feedback directly in the platform. The multi-step email loop for sample status updates, revision requests, and approval confirmations is replaced by a connected vendor workflow.',
        cardId: 'supplier-one-collab', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Supplier One Collaboration', programId: 'supplier-one-collab',
        type: 'automation', quarter: 'Q3FY27', target: 'October 31, 2026',
      },
      {
        label: 'As a merchant, I no longer need to run team-level size curve and pack calculations manually — the BQ enterprise service delivers automated recommendations consistently across all fashion departments',
        narrative: 'With Buy Quantification running as an enterprise service, individual teams stop running their own manual size curve and pack calculations. The service delivers consistent, automated recommendations across all fashion departments — reclaiming hours that currently go toward individualized BQ execution and quality-checking the outputs.',
        cardId: 'bq-enterprise-service', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'BQ Enterprise Service', programId: 'bq-enterprise-service',
        type: 'automation', quarter: 'Q4FY27', target: 'January 31, 2027',
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
        label: 'As a leader, I no longer need to wait for trend reports to arrive — macro trend signals surface directly in Centric and AEX so my teams make trend-informed decisions earlier in the season',
        narrative: 'The Trend API delivers macro trend signals directly into Centric and AEX workflows — merchants and designers see consolidated trend context without running separate research, manually triangulating sources, or waiting for trend report delivery. Trend-informed decisions happen earlier in the season.',
        cardId: 'trend-api-longlead', workstream: 'strategy',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Trend API — Long Lead & In-Season', programId: 'trend-api-longlead',
        type: 'capability', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a leader, I no longer need to wait for in-market sell-through signals to validate line plan choices — simulated customer response data is available before the line plan locks, reducing costly misses',
        narrative: 'The V1 Synthetic Consumer Panel (built with Walmart Data Ventures) provides simulated customer response data before designs go to production — giving teams a signal on what customers are likely to buy before the line plan locks. This reduces the risk of costly new product misses and markdown-prone assortment choices.',
        cardId: 'synthetic-panel', workstream: 'strategy',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Synthetic Panel (WMT Data Ventures)', programId: 'synthetic-panel',
        type: 'capability', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a leader, I no longer need to reconcile conflicting financial targets across workstreams — Strategy Hub is the single upstream source for all seasonal targets and they cascade downstream automatically',
        narrative: 'Strategy Hub (TTP) is now the upstream source of record for all seasonal financial targets across Design, Buying, and Allocation. Targets cascade downstream automatically — teams stop receiving conflicting priority directives from different sources. Decisions across workstreams are aligned to the same financial guardrails from day one.',
        cardId: 'strategy-hub', workstream: 'strategy',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Strategy Hub (TTP)', programId: 'strategy-hub',
        type: 'capability', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a planner, I no longer need to rely solely on intuition to spot assortment blind spots — AI detects coverage gaps proactively before in-season sell-out signals arrive so I have time to act',
        narrative: 'The Tagging & Affinity Graph pilot uses product taxonomy and ML-powered affinity models to identify assortment coverage gaps that merchant intuition alone typically misses. Gaps are surfaced proactively — before in-season sell-out signals arrive — giving allocation teams time to act rather than react.',
        cardId: 'tagging-pilot', workstream: 'allocation',
        opifLabel: 'OPIF-325602', opifUrl: 'https://jira.walmart.com/browse/OPIF-325602',
        program: 'Tagging & Affinity Graph Pilot', programId: 'tagging-pilot',
        type: 'capability', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a designer, I no longer need to manually triangulate between individual trend reports — 5+ integrated sources give me a consolidated multi-signal trend consensus directly in Centric before line plan locks',
        narrative: 'Trend API Pre-Season launches with 5+ integrated trend data providers — giving designers and merchants a consolidated multi-source trend consensus before the line plan locks for the season. Teams stop manually triangulating between individual trend reports and instead see an aggregated signal surfaced directly in Centric and AEX.',
        cardId: 'trend-api-preseason', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Trend API — 5+ Sources Pre-Season', programId: 'trend-api-preseason',
        type: 'capability', quarter: 'Q2FY27', target: 'July 31, 2026',
      },
      {
        label: 'As a leader, I no longer need to manage conflicting demand signals between Buying and Allocation — one shared forecast with model explainability means both teams make decisions from the same data',
        narrative: 'Forecast as an Enterprise Service delivers one channel-level (eComm vs. store) and placement-split forecast consumed by both Buying (AEX BQ) and Allocation (BPE/DBP). Conflicting demand signals between workstreams are eliminated — teams make buy and distribution decisions from the same data, with model explainability and automated training pipelines.',
        cardId: 'forecast-enterprise-service', workstream: 'strategy',
        opifLabel: 'OPIF-325221', opifUrl: 'https://jira.walmart.com/browse/OPIF-325221',
        program: 'Forecast as Enterprise Service', programId: 'forecast-enterprise-service',
        type: 'capability', quarter: 'Q2FY27', target: 'July 31, 2026',
      },
      {
        label: 'As a planner, I no longer need to manually reconcile store inventory positions, committed buys, and demand signals across tools — the optimization engine combines them in real time and drives allocation automatically',
        narrative: 'Distribution Planning Optimization improves store-level allocation accuracy in DBP by consuming real-time store inventory positions, AEX committed buy data, and BPE demand signals together. More product lands at the right store at the right time — reducing both over-allocation markdowns and under-allocation lost sales.',
        cardId: 'distrib-optimization', workstream: 'allocation',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Distribution Planning Optimization', programId: 'distrib-optimization',
        type: 'capability', quarter: 'Q2FY27', target: 'July 31, 2026',
      },
      {
        label: 'As a planner, I no longer need to manually hunt for complementary items or coverage gaps — AI-generated assortment recommendations surface inline inside my AP Tool line plan as I work',
        narrative: 'With the Tagging & Affinity Graph live in production, ML-generated recommendations surface directly in the AP Tool line plan — surfacing complementary items, flagging coverage gaps, and suggesting affinity-matched alternatives. Teams act on AI insight at the exact moment they are making assortment decisions, not after the fact.',
        cardId: 'tagging-pilot', workstream: 'allocation',
        opifLabel: 'OPIF-325602', opifUrl: 'https://jira.walmart.com/browse/OPIF-325602',
        program: 'Tagging & Affinity Graph Pilot', programId: 'tagging-pilot',
        type: 'capability', quarter: 'Q3FY27', target: 'October 31, 2026',
      },
      {
        label: 'As a planner, I no longer need to manually monitor sell-through performance to trigger swaps — AI detects degradation in real time and generates replacement item recommendations before markdowns are the only option',
        narrative: 'In-Season AI Swap Recommendations monitor sell-through signals in real time and automatically generate swap suggestions when performance degrades. Merchants receive targeted recommendations for replacement items before markdowns are the only option — enabling proactive assortment management instead of reactive clearance.',
        cardId: 'in-season-swaps', workstream: 'allocation',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'In-Season Swap Recommendations', programId: 'in-season-swaps',
        type: 'capability', quarter: 'Q3FY27', target: 'October 31, 2026',
      },
      {
        label: 'As a leader, I no longer need to manually build clearance plans — AI analyzes sell-through trajectory and inventory position to recommend optimal markdown depth and timing for my review and approval',
        narrative: 'AI-generated markdown recommendations analyze sell-through trajectory, inventory position, and season-end targets to recommend optimal markdown depth and timing. Merchants shift from manually building clearance plans to reviewing and approving AI-generated recommendations — reducing decision time and improving markdown efficiency.',
        cardId: 'markdown-ai', workstream: 'strategy',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AI Markdown Recommendations', programId: 'markdown-ai',
        type: 'capability', quarter: 'Q4FY27', target: 'January 31, 2027',
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
        label: 'As a designer, I no longer need to wait days for design decisions to reach Buying and vendors — my work in Centric is immediately visible to buying and automatically available through Supplier One',
        narrative: 'Design Hub launch makes Centric PLM the single system of record shared across Design, Buying, and Sourcing. Design decisions made in Centric are immediately visible to buying and automatically available to vendors through Supplier One — the handoff delay between design intent and downstream execution collapses from days to minutes.',
        cardId: 'design-hub-centric', workstream: 'design',
        opifLabel: 'OPIF-325208', opifUrl: 'https://jira.walmart.com/browse/OPIF-325208',
        program: 'Launch Design Hub (Centric PLM)', programId: 'design-hub-centric',
        type: 'capability', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a designer, I no longer need to manually distribute calendar updates — buying teams see my design milestones and planning deadlines in Centric in real time as they happen',
        narrative: 'Line Planning & Calendar Management in Centric gives all workstreams visibility into the same design milestones and planning calendar. Buying teams see exactly when line plans are finalized and buying readiness targets are set — without waiting for design to distribute calendar updates manually.',
        cardId: 'line-planning', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Line Planning & Calendar Management', programId: 'line-planning',
        type: 'capability', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a leader, I no longer need to reforecast mid-buy when teams discover conflicting guardrails — pre-approved space and financial targets are distributed to all workstreams before each season begins',
        narrative: 'Space & Financial Planning capabilities distribute pre-approved space and financial targets to all workstreams before each seasonal planning cycle begins. Design, Buying, and Allocation start aligned — reducing the mid-season financial reforecasting that occurs when teams discover conflicting guardrails mid-buy.',
        cardId: 'space-planning', workstream: 'strategy',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Space & Financial Planning', programId: 'space-planning',
        type: 'capability', quarter: 'Q1FY27', target: 'April 30, 2026',
      },
      {
        label: 'As a designer, I no longer need to deliver a finished document weeks later — buying teams see my evolving design intent during ideation, which cuts the late-stage line plan rework that currently hits both of us',
        narrative: 'AP Tool Shared Ideation integration connects Centric design ideation events to the AP Tool assortment view in real time. Buying teams see evolving design intent during ideation — not a finished document handed off weeks later. Early signal reduces the late-stage line plan changes that currently create rework across both workstreams.',
        cardId: 'ap-tool-shared-ideation', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'AP Tool Shared Ideation', programId: 'ap-tool-shared-ideation',
        type: 'capability', quarter: 'Q2FY27', target: 'July 31, 2026',
      },
      {
        label: 'As a designer, I no longer need to email asset files or chase version confirmations — current imagery and CADs are always linked to the live product record and instantly accessible to vendors and teams',
        narrative: 'Centralized DAM Launch provides a single location for all product imagery, CAD files, and design assets integrated with Centric. Product imagery is always current and linked to the live product record — vendors receive assets through Supplier One without manual email distribution, and internal teams stop spending time locating the right version of the right file.',
        cardId: 'centralized-dam', workstream: 'design',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'Centralized DAM Launch', programId: 'centralized-dam',
        type: 'capability', quarter: 'Q2FY27', target: 'July 31, 2026',
      },
      {
        label: 'As a merchant, I no longer need to run multiple email rounds to capture supplier intent — vendors enter it directly in AEX as structured data and it stays in sync with buying automatically',
        narrative: 'BAM / Collab Intent Integration captures supplier intent directly inside AEX as structured data — replacing the current email-based BAM communication cycle. Supplier clarification rounds that currently require multiple emails, follow-ups, and manual data entry are replaced by a connected workflow that keeps buying and supplier data in sync automatically.',
        cardId: 'bam-collab-intent', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'BAM / Collab Intent Integration', programId: 'bam-collab-intent',
        type: 'automation', quarter: 'Q2FY27', target: 'October 30, 2026',
      },
      {
        label: 'As a merchant, I no longer need to maintain a separate item definition from Design or Allocation — when design updates a spec I see it immediately, and when I commit a buy Allocation works from the same record',
        narrative: 'OneItem as a Shared Repository creates a single item record visible and writable by Design, Buying, and Allocation simultaneously. Teams stop maintaining parallel item definitions across separate tools — when design updates a spec, buying sees it immediately; when buying commits a buy, allocation sees the exact same item. One item, one truth, across every workstream.',
        cardId: 'shared-item-repository', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'OneItem Shared Repository', programId: 'shared-item-repository',
        type: 'capability', quarter: 'Q3FY27', target: 'October 31, 2026',
      },
      {
        label: 'As a merchant, I no longer need to switch between market-specific tools for international sourcing — global, domestic, and 3P items share one item definition and I manage them all from one place',
        narrative: 'OneItem Extended Markets brings international sourcing data into the same item repository used for domestic fashion buying. Global, domestic, and 3P items share one definition — buyers manage a unified assortment without switching between market-specific tools or reconciling conflicting item records across markets.',
        cardId: 'oneitem-extended-markets', workstream: 'buying',
        opifLabel: 'LLTT Dashboard', opifUrl: LLTT,
        program: 'OneItem Extended Markets', programId: 'oneitem-extended-markets',
        type: 'capability', quarter: 'Q4FY27', target: 'January 31, 2027',
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
  'ap-tool-lineplan':              { label: 'AP Line Plan',        color: '#92400e', textColor: '#ffffff' },
  'bq-enterprise-service':         { label: 'BQ Enterprise',       color: '#1e3a8a', textColor: '#ffffff' },
  'global-buying-platform':        { label: 'Global Buying',       color: '#065f46', textColor: '#ffffff' },
  'supplier-one-collab':           { label: 'Supplier One',        color: '#9f1239', textColor: '#ffffff' },
  'oneitem-expanded-sources':      { label: 'OneItem Sources',     color: '#b45309', textColor: '#ffffff' },
  'in-season-swaps':               { label: 'In-Season Swaps',     color: '#0f766e', textColor: '#ffffff' },
  'markdown-ai':                   { label: 'Markdown AI',         color: '#6b21a8', textColor: '#ffffff' },
  'shared-item-repository':        { label: 'OneItem Repo',        color: '#0369a1', textColor: '#ffffff' },
  'oneitem-extended-markets':      { label: 'OneItem Markets',     color: '#047857', textColor: '#ffffff' },
};

window.BIZ_IMPACT_GOALS   = BIZ_IMPACT_GOALS;
window.BIZ_PROGRAM_CONFIG = BIZ_PROGRAM_CONFIG;