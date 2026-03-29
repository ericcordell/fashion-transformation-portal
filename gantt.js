// gantt.js — Gantt Chart: Phase → Goal → Cards
// Walmart FY27: Q1=Feb-Apr, Q2=May-Jul, Q3=Aug-Oct, Q4=Nov-Jan

// ── Timeline constants — FY27 + FY28 (Feb 2026 → Nov 2027) ──────────────────
// Covers Phase 1 (Q1-Q3 FY27), Phase 2 (Q3 FY27-Q1 FY28), Phase 3 (Q1-Q3 FY28)
const GANTT_FY = {
  start: new Date(2026,  1,  1),  // Feb  1 2026
  end:   new Date(2027, 10,  1),  // Nov  1 2027 (end of Q3 FY28)
  quarters: [
    // ── FY27 ──
    { label: 'Q1 FY27', start: new Date(2026,  1, 1), end: new Date(2026,  4, 1), stripe: '#eef4ff' },
    { label: 'Q2 FY27', start: new Date(2026,  4, 1), end: new Date(2026,  7, 1), stripe: '#f8faff' },
    { label: 'Q3 FY27', start: new Date(2026,  7, 1), end: new Date(2026, 10, 1), stripe: '#eef4ff' },
    { label: 'Q4 FY27', start: new Date(2026, 10, 1), end: new Date(2027,  1, 1), stripe: '#f8faff' },
    // ── FY28 ──
    { label: 'Q1 FY28', start: new Date(2027,  1, 1), end: new Date(2027,  4, 1), stripe: '#f0f8ee' },
    { label: 'Q2 FY28', start: new Date(2027,  4, 1), end: new Date(2027,  7, 1), stripe: '#fafffe' },
    { label: 'Q3 FY28', start: new Date(2027,  7, 1), end: new Date(2027, 10, 1), stripe: '#f0f8ee' },
  ],
};
const GANTT_TOTAL_MS = GANTT_FY.end - GANTT_FY.start;  // ~21 months
const GANTT_LABEL_W  = 220; // px — must match .gantt-label width in CSS

// All 21 months: Feb 2026 → Oct 2027
const GANTT_MONTHS = [
  // FY27
  { label: 'Feb', start: new Date(2026,  1, 1), end: new Date(2026,  2, 1) },
  { label: 'Mar', start: new Date(2026,  2, 1), end: new Date(2026,  3, 1) },
  { label: 'Apr', start: new Date(2026,  3, 1), end: new Date(2026,  4, 1) },
  { label: 'May', start: new Date(2026,  4, 1), end: new Date(2026,  5, 1) },
  { label: 'Jun', start: new Date(2026,  5, 1), end: new Date(2026,  6, 1) },
  { label: 'Jul', start: new Date(2026,  6, 1), end: new Date(2026,  7, 1) },
  { label: 'Aug', start: new Date(2026,  7, 1), end: new Date(2026,  8, 1) },
  { label: 'Sep', start: new Date(2026,  8, 1), end: new Date(2026,  9, 1) },
  { label: 'Oct', start: new Date(2026,  9, 1), end: new Date(2026, 10, 1) },
  { label: 'Nov', start: new Date(2026, 10, 1), end: new Date(2026, 11, 1) },
  { label: 'Dec', start: new Date(2026, 11, 1), end: new Date(2027,  0, 1) },
  { label: 'Jan', start: new Date(2027,  0, 1), end: new Date(2027,  1, 1) },
  // FY28
  { label: 'Feb', start: new Date(2027,  1, 1), end: new Date(2027,  2, 1) },
  { label: 'Mar', start: new Date(2027,  2, 1), end: new Date(2027,  3, 1) },
  { label: 'Apr', start: new Date(2027,  3, 1), end: new Date(2027,  4, 1) },
  { label: 'May', start: new Date(2027,  4, 1), end: new Date(2027,  5, 1) },
  { label: 'Jun', start: new Date(2027,  5, 1), end: new Date(2027,  6, 1) },
  { label: 'Jul', start: new Date(2027,  6, 1), end: new Date(2027,  7, 1) },
  { label: 'Aug', start: new Date(2027,  7, 1), end: new Date(2027,  8, 1) },
  { label: 'Sep', start: new Date(2027,  8, 1), end: new Date(2027,  9, 1) },
  { label: 'Oct', start: new Date(2027,  9, 1), end: new Date(2027, 10, 1) },
];

const GANTT_WS_CONFIG = {
  all:        { label: 'All Workstreams', color: '#6366f1' },
  strategy:   { label: 'Strategy',        color: '#6366f1' },
  design:     { label: 'Design',          color: '#0053e2' },
  buying:     { label: 'Buying',          color: '#f59e0b' },
  allocation: { label: 'Allocation',      color: '#2a8703' },
};

let ganttActiveWS      = new Set(['all']);
let ganttExpandedGoals = new Set();

// ── Date helpers ──────────────────────────────────────────────────────────────
function ganttPct(date) {
  const clamped = Math.max(+GANTT_FY.start, Math.min(+GANTT_FY.end, +date));
  return ((clamped - GANTT_FY.start) / GANTT_TOTAL_MS) * 100;
}

function ganttQStart(q) {
  if (!q || q === 'completed') return GANTT_FY.start;
  const s    = String(q);
  const n    = s.match(/([1-4])/)?.[1];
  const fy28 = /FY28/i.test(s);
  const map27 = { '1':new Date(2026,1,1), '2':new Date(2026,4,1), '3':new Date(2026,7,1), '4':new Date(2026,10,1) };
  const map28 = { '1':new Date(2027,1,1), '2':new Date(2027,4,1), '3':new Date(2027,7,1), '4':new Date(2027,10,1) };
  return (fy28 ? map28 : map27)[n] || GANTT_FY.start;
}

// First full month a feature is AVAILABLE TO USERS after a delivery date.
// If the date is already the 1st, that month counts. Otherwise round up.
function ganttFirstAvailableMonth(date) {
  const d = new Date(date);
  if (d.getDate() === 1) return new Date(d.getFullYear(), d.getMonth(), 1);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

// Parse targetDate string → { start, end, isRange }
// start = earliest possible delivery; end = guaranteed-by / latest delivery
function ganttParseRange(str) {
  if (!str || str === 'TBD' || str === 'completed') return null;

  // Cross-year range: "Nov 2026–Jan 2027"
  let m = str.match(/([A-Za-z]+)\s+(\d{4})[\u2013\-]+([A-Za-z]+)\s+(\d{4})/);
  if (m) {
    const s = new Date(`${m[1]} 1 ${m[2]}`), e = new Date(`${m[3]} 1 ${m[4]}`);
    if (!isNaN(s) && !isNaN(e))
      return { start: s, end: new Date(e.getFullYear(), e.getMonth() + 1, 0), isRange: true };
  }

  // Same-year range: "Aug–Oct 2026"
  m = str.match(/([A-Za-z]+)[\u2013\-]+([A-Za-z]+)\s+(\d{4})/);
  if (m) {
    const s = new Date(`${m[1]} 1 ${m[3]}`), e = new Date(`${m[2]} 1 ${m[3]}`);
    if (!isNaN(s) && !isNaN(e))
      return { start: s, end: new Date(e.getFullYear(), e.getMonth() + 1, 0), isRange: true };
  }

  // Quarter range: "Q1–Q2 FY27" or "Q3 FY27–Q1 FY28" (cross-FY)
  m = str.match(/Q([1-4])(?:\s*(FY2[78]))?[\u2013\-]+Q([1-4])(?:\s*(FY2[78]))?/);
  if (m) {
    const qStarts = {
      FY27: { '1':new Date(2026,1,1),  '2':new Date(2026,4,1),  '3':new Date(2026,7,1),  '4':new Date(2026,10,1) },
      FY28: { '1':new Date(2027,1,1),  '2':new Date(2027,4,1),  '3':new Date(2027,7,1),  '4':new Date(2027,10,1) },
    };
    const qEnds = {
      FY27: { '1':new Date(2026,3,30), '2':new Date(2026,6,31), '3':new Date(2026,9,31), '4':new Date(2027,0,31) },
      FY28: { '1':new Date(2027,3,30), '2':new Date(2027,6,31), '3':new Date(2027,9,31), '4':new Date(2028,0,31) },
    };
    const fy1 = m[2] || 'FY27', fy2 = m[4] || fy1;
    return { start: qStarts[fy1][m[1]], end: qEnds[fy2][m[3]], isRange: true };
  }

  // Single quarter: "Q2 FY27" or "Q1 FY28"
  m = str.match(/Q([1-4])(?:\s*(FY2[78]))?/);
  if (m) {
    const fy = m[2] || 'FY27';
    const qEnds = {
      FY27: { '1':new Date(2026,3,30), '2':new Date(2026,6,31), '3':new Date(2026,9,31), '4':new Date(2027,0,31) },
      FY28: { '1':new Date(2027,3,30), '2':new Date(2027,6,31), '3':new Date(2027,9,31), '4':new Date(2028,0,31) },
    };
    const d = qEnds[fy]?.[m[1]];
    return d ? { start: d, end: d, isRange: false } : null;
  }

  // Specific date: "April 30, 2026" / "Jul 31, 2026"
  const d = new Date(str.replace(/,/, ''));
  if (!isNaN(d)) return { start: d, end: d, isRange: false };

  return null;
}

// Bar rendering — answers "when can users USE this?"
//
// Point date (e.g. 'Jul 31, 2026'):
//   [============ available from Aug 1 onwards =============]
//
// Range date (e.g. 'Aug\u2013Oct 2026'):
//   [\u2012 \u2012 delivery window Aug-Oct \u2012 \u2012][=== available from Nov 1 ===]
//
// No in-flight zone — bars only show when the feature is live for users.
function ganttBars(card) {
  const range = ganttParseRange(card.targetDate);
  const wsKey = (card.workstreams || [])[0] || 'all';
  const color = card.status === 'completed'
    ? '#2a8703'
    : (GANTT_WS_CONFIG[wsKey] || GANTT_WS_CONFIG.all).color;

  if (!range) {
    return `<div class="gantt-bar-tbd" style="left:2%;width:8%">TBD</div>`;
  }

  // The first full month users have access = first available month after delivery end
  const availableFrom = ganttFirstAvailableMonth(range.end);
  let html = '';

  // Range window: dashed bar from window.start \u2192 window.end
  // Shows the uncertainty window before hard availability date
  if (range.isRange) {
    const winStart = ganttFirstAvailableMonth(range.start);
    const l = ganttPct(winStart).toFixed(2);
    const w = Math.max(1, ganttPct(availableFrom) - ganttPct(winStart)).toFixed(2);
    if (parseFloat(w) > 0.3) {
      html += `<div class="gantt-bar-window" style="left:${l}%;width:${w}%;background:${color}">
        <span class="gantt-bar-label" style="color:white">${card.targetDate}</span>
      </div>`;
    }
  }

  // Solid available bar: availableFrom \u2192 chart end
  const deployPct = ganttPct(availableFrom);
  if (deployPct < 99.5) {
    const w = Math.max(0.5, 100 - deployPct).toFixed(2);
    html += `<div class="gantt-bar-available" style="left:${deployPct.toFixed(2)}%;width:${w}%;background:${color}"></div>`;
  }

  return html || `<div class="gantt-bar-tbd" style="left:${Math.max(0,ganttPct(range.end)-2).toFixed(2)}%;width:3%">\u2714</div>`;
}

// ── Row track decoration: stripes + month dividers (NO today line here) ───────
function ganttDeco() {
  // Quarter stripes
  const stripes = GANTT_FY.quarters.map(q => {
    const l = ganttPct(q.start).toFixed(2);
    const w = ((q.end - q.start) / GANTT_TOTAL_MS * 100).toFixed(2);
    return `<div class="gantt-stripe" style="left:${l}%;width:${w}%;background:${q.stripe}"></div>`;
  }).join('');

  // Month dividers — subtle for inner months, stronger for quarter boundaries
  const divs = GANTT_MONTHS.map((mo, i) => {
    if (i === 0) return ''; // no divider before the first month
    const isQBoundary = i % 3 === 0;
    return `<div class="${isQBoundary ? 'gantt-divider' : 'gantt-month-divider'}" style="left:${ganttPct(mo.start).toFixed(2)}%"></div>`;
  }).join('');

  return stripes + divs;
}

// Two-row header: [Q1 FY27 … Q4 FY27 | Q1 FY28 … Q3 FY28] / [Feb|Mar…|Oct]
// A subtle FY divider line separates the two fiscal years.
function buildGanttHeader() {
  const el = document.getElementById('gantt-qheader');
  if (!el) return;

  // Quarter row — FY28 columns get a slightly different bg tint
  const qRow = GANTT_FY.quarters.map(q => {
    const w    = ((q.end - q.start) / GANTT_TOTAL_MS * 100).toFixed(2);
    const isFY28 = q.label.includes('FY28');
    return `<div class="gantt-qcol${isFY28 ? ' gantt-qcol-fy28' : ''}" style="width:${w}%">${q.label}</div>`;
  }).join('');

  // Month row — quarter-start months get a stronger border;
  // the first FY28 month (index 12) gets the year-boundary class
  const mRow = GANTT_MONTHS.map((mo, i) => {
    const isQBoundary  = i % 3 === 0;
    const isFY28Start  = i === 12; // Feb 2027 = first FY28 month
    const cls = [
      'gantt-mcol',
      isQBoundary  ? 'gantt-mcol-qstart'  : '',
      isFY28Start  ? 'gantt-mcol-fy28start' : '',
    ].filter(Boolean).join(' ');
    const w = ((mo.end - mo.start) / GANTT_TOTAL_MS * 100).toFixed(2);
    return `<div class="${cls}" style="width:${w}%">${mo.label}</div>`;
  }).join('');

  el.innerHTML = `
    <div class="gantt-header-qrow">${qRow}</div>
    <div class="gantt-header-mrow">${mRow}</div>
  `;
}

// ── Single full-height Today line injected once into #gantt-body ─────────────
function ganttInjectToday() {
  document.querySelectorAll('.gantt-today-overlay').forEach(el => el.remove());
  const body = document.getElementById('gantt-body');
  if (!body) return;
  const now = new Date();
  if (now < GANTT_FY.start || now > GANTT_FY.end) return;
  const pct = (now - GANTT_FY.start) / GANTT_TOTAL_MS;
  const overlay = document.createElement('div');
  overlay.className = 'gantt-today-overlay';
  overlay.style.left = `calc(${(GANTT_LABEL_W * (1 - pct)).toFixed(1)}px + ${(pct * 100).toFixed(3)}%)`;
  overlay.innerHTML = '<span class="gantt-today-label">Today</span>';
  body.appendChild(overlay);
}

// ── Card click → same modal as the main portal ──────────────────────────────
// Resolves pillar title + tool from window.PILLARS so the modal header
// shows the correct workstream context, then delegates to openModal().
window.ganttOpenCard = function(cardId) {
  const pillar = (window.PILLARS || []).find(p =>
    (p.cards || []).some(c => c.id === cardId)
  );
  const ws   = pillar ? (pillar.title || '') : '';
  const tool = pillar ? (pillar.tool  || '') : '';
  if (typeof openModal === 'function') openModal(cardId, ws, tool);
};

// ── Card data helpers ─────────────────────────────────────────────────────────
function ganttCardIndex() {
  const cards = window.PILLARS ? window.PILLARS.flatMap(p => p.cards || []) : [];
  return Object.fromEntries(cards.map(c => [c.id, c]));
}

function ganttGoalCards(goalId) {
  const ids     = (window.GOAL_CARD_MAP || {})[String(goalId)] || [];
  const index   = ganttCardIndex();
  const showAll = ganttActiveWS.has('all');
  return ids
    .map(id => index[id])
    .filter(c => c && (showAll || (c.workstreams || []).some(ws => ganttActiveWS.has(ws))))
    .sort((a, b) => {
      const ra = ganttParseRange(a.targetDate), rb = ganttParseRange(b.targetDate);
      const da = ra && ra.end, db = rb && rb.end;
      if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
      return da - db;
    });
}

function ganttPhaseCardCount(phaseNum) {
  const phases = typeof PHASE_DEFS !== 'undefined' ? PHASE_DEFS : [];
  const phase  = phases.find(p => p.num === phaseNum);
  if (!phase) return 0;
  const seen = new Set();
  (phase.goals || []).forEach(g =>
    ganttGoalCards(String(g.id).replace('#', '')).forEach(c => seen.add(c.id))
  );
  return seen.size;
}

// ── Toggle handlers ───────────────────────────────────────────────────────────
window.ganttToggleGoal = function(key) {
  ganttExpandedGoals.has(key) ? ganttExpandedGoals.delete(key) : ganttExpandedGoals.add(key);
  renderGanttChart();
};

window.ganttToggleWS = function(ws) {
  if (ws === 'all') {
    ganttActiveWS = new Set(['all']);
  } else {
    ganttActiveWS.delete('all');
    ganttActiveWS.has(ws) ? ganttActiveWS.delete(ws) : ganttActiveWS.add(ws);
    if (ganttActiveWS.size === 0) ganttActiveWS = new Set(['all']);
  }
  document.querySelectorAll('.gantt-ws-btn').forEach(btn =>
    btn.classList.toggle('active', ganttActiveWS.has(btn.dataset.ws))
  );
  renderGanttChart();
};

// ── Main render ───────────────────────────────────────────────────────────────
window.renderGanttChart = function() {
  const body = document.getElementById('gantt-body');
  if (!body) return;

  buildGanttHeader();

  const phases = typeof PHASE_DEFS !== 'undefined' ? PHASE_DEFS : [];
  const deco   = ganttDeco();
  let html = '';

  phases.forEach(phase => {
    const ps      = new Date(phase.start);
    const pe      = new Date(phase.end);
    const phL     = ganttPct(ps).toFixed(2);
    const phW     = Math.max(1, ganttPct(pe) - ganttPct(ps)).toFixed(2);
    const phCount = ganttPhaseCardCount(phase.num);

    html += `
      <div class="gantt-phase-header" style="border-left:4px solid ${phase.color}">
        <div class="gantt-label gantt-phase-label-cell">
          <span class="gantt-phase-emoji">${phase.emoji}</span>
          <div>
            <div class="gantt-phase-name">Phase ${phase.num}: ${phase.label}</div>
            <div class="gantt-phase-win">${phase.window} &middot; ${phCount} program${phCount !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="gantt-track">
          ${deco}
          <div class="gantt-phase-bar" style="left:${phL}%;width:${phW}%;border:1.5px solid ${phase.color}40;background:${phase.color}14">
            <span style="color:${phase.color};font-weight:700;font-size:11px">${phase.label}</span>
          </div>
        </div>
      </div>`;

    (phase.goals || []).forEach(goal => {
      const goalId = String(goal.id).replace('#', '');
      const key    = `${phase.num}-${goalId}`;
      const open   = ganttExpandedGoals.has(key);
      const gCards = ganttGoalCards(goalId);

      html += `
        <div class="gantt-goal-row${open ? ' gantt-goal-open' : ''}" onclick="ganttToggleGoal('${key}')">
          <div class="gantt-label">
            <div class="gantt-label-inner">
              <span class="gantt-expand-icon">${open ? '▾' : '▸'}</span>
              <span class="gantt-goal-badge" style="background:${phase.color}20;color:${phase.color}">${goal.id}</span>
              <span class="gantt-label-text">${goal.label}</span>
            </div>
            <div class="gantt-label-ws">${gCards.length} program${gCards.length !== 1 ? 's' : ''} &bull; click to ${open ? 'collapse' : 'expand'}</div>
          </div>
          <div class="gantt-track">
            ${deco}
            <div class="gantt-bar gantt-goal-bar" style="left:${phL}%;width:${phW}%;background:${phase.color}">
              <span class="gantt-bar-label">${goal.label}</span>
            </div>
          </div>
        </div>`;

      if (open) {
        if (gCards.length === 0) {
          html += `<div class="gantt-card-empty">No programs match the active workstream filter.</div>`;
        } else {
          gCards.forEach(card => {
            const dotColor   = ({ completed:'#2a8703', green:'#2a8703', yellow:'#f59e0b', red:'#ea1100', roadmap:'#9ca3af' })[card.status] || '#9ca3af';
            const isCritical = card.critical || (card.tag || '').toLowerCase().includes('critical');
            html += `
              <div class="gantt-row gantt-card-row" onclick="ganttOpenCard('${card.id}')" title="Click to view details" style="cursor:pointer">
                <div class="gantt-label gantt-card-label">
                  <div class="gantt-label-inner">
                    <span class="gantt-dot" style="background:${dotColor}"></span>
                    <span class="gantt-label-text">${card.icon || ''} ${card.title}</span>
                    ${isCritical ? '<span class="gantt-star">⭐</span>' : ''}
                  </div>
                  <div class="gantt-label-ws">${(card.workstreams || []).join(', ')} &middot; ${card.targetDate || 'TBD'}</div>
                </div>
                <div class="gantt-track">${deco}${ganttBars(card)}</div>
              </div>`;
          });
        }
      }
    });
  });

  body.innerHTML = html || '<div class="gantt-empty">No phases defined.</div>';
  ganttInjectToday();
};
