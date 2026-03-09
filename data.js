// E2E Fashion Transformation Portal — Core Constants & Helpers
// Walmart FY starts February:
//   Q1 = Feb–Apr  |  Q2 = May–Jul  |  Q3 = Aug–Oct  |  Q4 = Nov–Jan
// Pillar card arrays live in: data-strategy.js, data-design.js,
//   data-buying.js, data-allocation.js
// PILLARS is assembled at end of data-allocation.js (last file loaded).

// ---- E2E Phase flow bar ----
const PHASES = [
  { id: 'strategy',   label: 'Strategy',     workstream: 'strategy'   },
  { id: 'design',     label: 'Design',        workstream: 'design'     },
  { id: 'repository', label: 'Repository',    workstream: 'strategy'   },
  { id: 'space',      label: 'Space',         workstream: 'design'     },
  { id: 'lineplan',   label: 'Line Plan',     workstream: 'design'     },
  { id: 'forecast',   label: 'Forecast',      workstream: 'buying'     },
  { id: 'assort',     label: 'Assortment',    workstream: 'buying'     },
  { id: 'buyqty',     label: 'Buy Qty (BQ)',  workstream: 'buying'     },
  { id: 'waveplan',   label: 'Wave Plan',     workstream: 'allocation' },
  { id: 'commit',     label: 'Commit',        workstream: 'buying'     },
  { id: 'itemsetup',  label: 'Item Setup',    workstream: 'buying'     },
  { id: 'distrib',    label: 'Distribution',  workstream: 'allocation' },
  { id: 'exits',      label: 'Exits',         workstream: 'allocation' },
];

// ---- Strategy umbrella banner ----
const STRATEGY_UMBRELLA = {
  title:    'Strategy',
  subtitle: 'Strategy Hub (TTP) — The guiding framework across Design, Buying & Allocation',
};

// ---- Shared helpers (used in all pillar data files) ----
const own = (name = 'TBD', email = '') => ({ name, email });

const res = (opif = '#', brd = '#', prd = '#', uxDemo = '#', other = []) =>
  ({ opif, brd, prd, uxDemo, other });

const TBD_OWNERS = () => ({
  businessPartner:    own(),
  transformationLead: own(),
  productLead:        own(),
  uxLead:             own(),
  softwareLead:       own(),
});

// Convenience: partial owner set from PPT
const pptOwners = (bp, tl, pl) => ({
  businessPartner:    own(bp),
  transformationLead: own(tl),
  productLead:        own(pl),
  uxLead:             own(),
  softwareLead:       own(),
});

// ---- Shared lookup tables (used by main page, roadmap & summary modals) ----
const QUARTER_ORDER = ['completed', 'Q1', 'Q2', 'Q3', 'Q4', 'Future'];

const QUARTER_META = {
  completed: { label: '\u2705 Completed',              color: '#0053e2', bg: '#eef2ff', border: '#0053e2' },
  Q1:        { label: 'Q1 FY27 \u00b7 Feb\u2013Apr',  color: '#2a8703', bg: '#f0faf0', border: '#2a8703' },
  Q2:        { label: 'Q2 FY27 \u00b7 May\u2013Jul',  color: '#8a5000', bg: '#fffbf0', border: '#d97706' },
  Q3:        { label: 'Q3 FY27 \u00b7 Aug\u2013Oct',  color: '#37474f', bg: '#f8fafc', border: '#90a4ae' },
  Q4:        { label: 'Q4 FY27 \u00b7 Nov\u2013Jan',  color: '#546e7a', bg: '#f8fafc', border: '#b0bec5' },
  Future:    { label: '\uD83D\uDD2E Future Roadmap',   color: '#9e9e9e', bg: '#fafafa', border: '#e0e0e0' },
};

const BADGE_CLASS = {
  completed: 'badge-completed',
  green:     'badge-green',
  yellow:    'badge-yellow',
  roadmap:   'badge-roadmap',
  red:       'badge-red',
};

const PILLAR_GRADIENTS = {
  'pillar-dark': 'linear-gradient(135deg,#212121,#37474f)',
  'pillar-blue': 'linear-gradient(135deg,#0053e2,#1a6fff)',
  'pillar-gold': 'linear-gradient(135deg,#b86000,#d98c00)',
  'pillar-navy': 'linear-gradient(135deg,#1a1a6e,#3b3ba3)',
};

const INTEGRATION_ROW = [
  'ERP', 'PIM', 'DAM', 'CAD / 2D / 3D',
  'Supplier One', 'ISAM', 'Item Setup Systems',
  'Store Systems', 'E-Commerce', 'Compliance & Traceability',
];