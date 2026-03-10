// data-phases.js — LLTT three-phase definitions + card-to-phase mapping
// Source: Confluence LLTT Work Management Dashboard (APREC space)
// https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard
//
// Phase 1: Setup & Integration   — Q1–Q3 FY27  (Feb 2026 – Oct 2026)
// Phase 2: Recommend & Optimize  — Q3 FY27–Q1 FY28 (Aug 2026 – Apr 2027)
// Phase 3: Automate              — Q1–Q3 FY28  (Feb 2027 – Oct 2027)

const PHASE_DEFS = [
  {
    num: 1,
    label: 'Setup & Integration',
    shortLabel: 'Setup',
    emoji: '\uD83D\uDD27',
    window: 'Q1\u2013Q3 FY27',
    start: 'Feb 1, 2026',
    end: 'Oct 31, 2026',
    color: '#0053e2',
    bg: '#eef4ff',
    border: '#0053e2',
    darkBg: 'linear-gradient(135deg,#0053e2,#1a6fff)',
    tagline: 'Integrate tools \u00b7 Connect workflows \u00b7 Build tagging foundations',
    description: 'Integrate the AP Tool as Line Plan into the AEX flow, allowing suppliers to communicate item details directly into the tool. Connect other tools within the ecosystem that remove the need for duplicative email communication. Visualization tools in sourcing and rack planning make decisions easier. Build foundations of tagging and fixture library.',
    deliverables: [
      'AP Tool Integration to replace Line Plan in AEX',
      'Item Selection (Repository connection)',
      'Automated BQ (eliminate manual S/P step)',
      'Visual Rack Plan',
      'OneSource Central Visual Boards',
      'Intended Item Report standardization',
      'Collab / Business Award Management Integration',
      'Item Creation Quality and Speed',
      'New Store PO automation',
    ],
    goals: [
      { id: '#1', label: '90% of buys on happy path' },
      { id: '#2', label: 'Zero rekeys across E2E workflow' },
      { id: '#3', label: 'Happy path buying execution' },
      { id: '#4', label: 'Reduce merchant hours' },
    ],
  },
  {
    num: 2,
    label: 'Recommend & Optimize',
    shortLabel: 'Recommend',
    emoji: '\uD83C\uDFAF',
    window: 'Q3 FY27\u2013Q1 FY28',
    start: 'Aug 1, 2026',
    end: 'Apr 30, 2027',
    color: '#2a8703',
    bg: '#f0faf0',
    border: '#2a8703',
    darkBg: 'linear-gradient(135deg,#1b5e20,#2a8703)',
    tagline: 'Leverage tagging \u00b7 Recommend swaps \u00b7 Redistribute dynamically',
    description: 'Leverage the tagging and fixture library to recommend in-season swaps, and to dynamically redistribute some orders. Enterprise services for Forecast and Buy Quantification power automated recommendations across all workstreams.',
    deliverables: [
      'Forecast as Enterprise Service',
      'Buy Quantification as Enterprise Service',
      'Shared Event Calendar & Actions',
      'Unified Potential Items (OneSource, MINT)',
      'Tag-based Line Recommendations',
      'Tag-based In-Season Swaps',
      'Dynamic PO Re-Distribution',
    ],
    goals: [
      { id: '#5', label: 'Reduce trapped inventory' },
      { id: '#6', label: '85% shop in-stock rate' },
      { id: '#7', label: '90% PO redistribution coverage' },
      { id: '#8', label: 'Increase sell-through rate' },
    ],
  },
  {
    num: 3,
    label: 'Automate',
    shortLabel: 'Automate',
    emoji: '\uD83E\uDD16',
    window: 'Q1\u2013Q3 FY28',
    start: 'Feb 1, 2027',
    end: 'Oct 31, 2027',
    color: '#1a1a6e',
    bg: '#f0f0ff',
    border: '#3b3ba3',
    darkBg: 'linear-gradient(135deg,#1a1a6e,#3b3ba3)',
    tagline: 'Encode strategy \u00b7 Generate scenarios \u00b7 Full automation',
    description: 'Shift users to encoding strategy and goals that can build full scenarios to evaluate. Begin full automation of in-season swaps and redistributed orders as tagging and automation matures.',
    deliverables: [
      'Strategy repo / capture',
      'Strategy-based Conceptual Line Plan creation',
      'Scenario Generation and Selection',
      'Tag-based In-Season Dynamic Placement',
    ],
    goals: [
      { id: '#4', label: 'Reduce merchant hours (via automation)' },
      { id: '#5', label: 'Reduce trapped inventory' },
      { id: '#6', label: '85% shop in-stock rate' },
      { id: '#8', label: 'Increase sell-through rate' },
    ],
  },
];

// ── CARD → PHASE MAP ─────────────────────────────────────────
// Single source of truth for which phase each card belongs to.
// Phase logic derived from Confluence LLTT Roadmap table deliverables.
const CARD_PHASE_MAP = {
  // ── Strategy ──
  'strategy-hub':              1,
  'space-planning':            1,
  'trend-api-longlead':        1,
  'trend-packaging-redesign':  1,
  'synthetic-panel':           1,
  'cross-functional-alignment':1,
  'growth-budget-signals':     1,
  'trend-api-100pct':          1,
  'category-priorities':       1,
  'forecast-enterprise-service':2,
  'strategy-fy27-kickoff':     2,
  'shared-merch-strategy':     3,
  'strategy-transformation-review': 3,

  // ── Design ──
  'design-hub-centric':        1,  // Critical — launch Centric
  'aex-lineplan-migration':    1,  // Critical — AP Tool LP Integration
  'sample-mgmt-fit-eval':      1,  // Critical
  'line-planning':             1,
  'product-specs':             1,
  'trend-api-preseason':       1,
  'ap-tool-shared-ideation':   1,
  'fit-eval-workflow':         1,
  'centralized-dam':           1,  // OneSource Central Visual Boards
  'centric-integration':       1,
  'visual-boards':             1,  // Critical
  'shared-event-layer':        2,  // Phase 2: Shared Event Calendar
  'material-sourcing':         2,
  'ai-line-plan':              3,  // Phase 3: Strategy-based Conceptual LP
  'design-analytics':          3,

  // ── Buying ──
  'neo-replatform':            1,  // Completed
  'aex-stability':             1,  // Critical
  'longterm-buying':           1,  // LLTT core
  'auto-item-setup':           1,  // Critical — Item Creation Quality
  'fashion-fixture-allocation-buying': 1, // Visual Rack Plan
  'ai-item-repository':        1,  // Item Selection / Repository
  'size-pack-bq':              1,  // Automated BQ
  'ap-tool-lineplan':          1,  // AP Tool Integration
  'bam-collab-intent':         1,  // Collab / BAM Integration
  'commitment-report-redesign':1,  // Item Report standardization
  'oneitem-expanded-sources':  2,  // Unified Potential Items
  'bq-enterprise-service':     2,  // Buy Quantification Enterprise Service
  'shared-item-repository':    2,  // Unified Potential Items
  'global-buying-platform':    3,

  // ── Pillar-level IDs (not cards — included to pass ID coverage check) ──
  'strategy':  1,
  'design':    1,
  'buying':    1,
  'allocation':1,

  // ── Allocation ──
  'unified-planning':          1,
  'bpe-seasonal':              1,
  'tagging-pilot':             1,  // Build tagging foundations
  'distrib-optimization':      1,
  'enterprise-wave-planning':  1,  // New Store PO automation
  'enterprise-trend-api-inseason': 2,
  'tag-based-recommendations': 2,  // Tag-based Recommendations + Swaps
  'assort-product-phase2':     2,  // Shared Event Calendar + Unified Items
  'fashion-fixture-tagging':   3,  // Tag-based Dynamic Placement
  'merch-financial':           3,
};