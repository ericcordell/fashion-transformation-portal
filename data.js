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

// ---- Corporate directory — verified via Walmart directory (Mar 2026) ----
// Primary owner source:  OPIF (Assignee = TPM/TL · Reporter = Product Manager)
// Fallback owner source: confluence.walmart.com/display/APREC/Who%27s+Who+Among+the+Long+Lead+Time+Transformation
const PEOPLE = {
  // ---- Business Transformation Leads (Confluence) ----
  'Brett Reid':          { email: 'Brett.Reid@walmart.com',         title: 'Director, Business Transformation (AEX & Space/Draw)' },
  'Bill Chiodetti':      { email: 'William.Chiodetti@walmart.com',   title: 'Sr. Director, Product Management (Strategy)' },
  'William Chiodetti':   { email: 'William.Chiodetti@walmart.com',   title: 'Sr. Director, Product Management (Strategy)' },
  'Tammy Hawkins':       { email: 'Tammy.Hawkins@walmart.com',       title: 'Sr. Director, Business Transformation (OneSource / GMF PLM)' },
  'Veena Swaminathan':   { email: 'Veena.Swaminathan@walmart.com',   title: 'Director, Product Management (Replenishment)' },
  'Ken Brockland':       { email: 'Ken.Brockland@walmart.com',       title: 'Sr. Director, Product Management (AP Tool / Modulars)' },
  // ---- Product Leads / Managers (OPIF Reporter or Confluence) ----
  'Michael Allen':       { email: 'Michael.B.Allen@walmart.com',     title: 'Sr. Director, Product Management (AEX)' },
  'Abhishek Jannawar':   { email: 'Abhishek.Jannawar@walmart.com',   title: 'Staff Product Manager (BQ, S&P, Intent Report)' },
  'Ryan Henderson':      { email: 'Ryan.Henderson@walmart.com',      title: 'Senior Product Manager (Stability & Replatforming)' },
  'Dhaarna Singh':       { email: 'Dhaarna.Singh@walmart.com',       title: 'Senior Product Manager (Fashion Space & Wave Planning)' },
  'Taylor Watson':       { email: 'Taylor.Hunt@walmart.com',         title: 'Principal Product Manager (AP Tool / Line Planning)' },
  'Amy Caley':           { email: 'Amy.Caley@walmart.com',           title: 'Principal Product Manager (AEX Configuration & Line Planning)' },
  'Amy Holder Caley':    { email: 'Amy.Caley@walmart.com',           title: 'Principal Product Manager (AEX Configuration & Line Planning)' },
  'Christopher Chiodo':  { email: 'Christopher.Chiodo@walmart.com', title: 'Senior Manager, Product Management (Design Hub / OneSource)' },
  'Chris Chiodo':        { email: 'Christopher.Chiodo@walmart.com', title: 'Senior Manager, Product Management (Design Hub / OneSource)' },
  'Vivek Mishra':        { email: 'Vivek.Mishra@walmart.com',        title: 'Sr. Director, Platform PM (Forecasting & BQ)' },
  'David Nelms':         { email: 'David.Nelms@walmart.com',         title: 'Sr. Director, Product Management (Assortment Repository)' },
  // ---- Technical Program Managers (OPIF Assignee or Confluence) ----
  'Chris Graves':        { email: 'christopher.graves@walmart.com', title: 'Principal TPM (AEX)' },
  'Ramesh Simhambhatla': { email: 'Ramesh.Simhambhatla@walmart.com', title: 'Staff TPM (Strategy / OneSource)' },
  'Sakshi Datta':        { email: 'Sakshi.Datta@walmart.com',        title: 'Staff TPM (Space & Draw)' },
  'Prasanth Chalikandi': { email: 'Prasanth.Chalikandi@walmart.com', title: 'Principal TPM' },
  'Ashwin Chidambaram':  { email: 'Ashwin.Chidambaram@walmart.com', title: 'Eng. Manager / TPM (AP Tool / Assortment Planning)' },
  // ---- UX Leads (Confluence) ----
  'Robbie Dutta':        { email: 'Robbie.Dutta@walmart.com',        title: 'Sr. Director, UX Design (AEX)' },
  'CJ Weatherford':      { email: 'CJ.Weatherford@walmart.com',      title: 'Principal UX Designer (AEX / AP Tool)' },
  'Stephen Wolf':        { email: 'Stephen.Wolf@walmart.com',        title: 'Director, UX Design (OneSource / Strategy)' },
  'Leon Hovanesian':     { email: 'Leon.Hovanesian@walmart.com',     title: 'Senior Manager, Design (Strategy / OneSource)' },
  'Minwoo Kim':          { email: 'Minwoo.Kim@walmart.com',          title: 'Senior UX Designer (Space & Draw)' },
  // ---- Engineering / Software Leads (Confluence) ----
  'Mike Dunn':           { email: 'mike.dunn@walmart.com',           title: 'Director, Software Engineering (AEX)' },
  'Arun Santhiagu':      { email: 'Arun.Santhiagu@walmart.com',      title: 'Sr. Manager, Software Engineering (AP Tool)' },
  'Oscar Cantu':         { email: 'Oscar.Cantu@walmart.com',         title: 'Sr. Manager, Software Engineering (Assortment Planning)' },
};

// Look up a person by name — returns { name, email, title }
const person = (name) => {
  if (!name || name === 'TBD' || name === '') return own();
  const p = PEOPLE[name];
  return p ? { name, email: p.email, title: p.title } : own(name);
};

const TBD_OWNERS = () => ({
  businessPartner:    [],   // array — can hold multiple Business & Transformation Leads
  transformationLead: own(),
  productLead:        own(),
  uxLead:             own(),
  softwareLead:       own(),
});

// Convenience: full owner set — auto-resolves emails from PEOPLE directory
// bp = Business & Transformation Lead(s) — string OR array of strings (multiple allowed)
// tl = Technical Program Manager (TPM) / OPIF Assignee
// pl = Product Manager / OPIF Reporter
// ux = UX Lead (Confluence fallback)
// sw = Engineering Lead (Confluence fallback)
const pptOwners = (bp, tl, pl, ux = '', sw = '') => ({
  // businessPartner is always an array so the UI can render 0..N people
  businessPartner:    (Array.isArray(bp) ? bp : [bp]).map(person).filter(p => p.name && p.name !== 'TBD'),
  transformationLead: person(tl),   // TPM / OPIF Assignee
  productLead:        person(pl),
  uxLead:             person(ux),
  softwareLead:       person(sw),
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