// gantt-biz.js — Business Impact Timeline renderer
// Scope: Q1 + Q2 FY27 (Feb–Jul 2026) | 3 programs only
// Toggle between this and renderGanttChart() via ganttSetView()

// ── Timeline constants (Q1+Q2 FY27 only) ─────────────────────────
const BIZ_FY = {
  start: new Date(2026, 1, 1),  // Feb 1 2026
  end:   new Date(2026, 7, 1),  // Aug 1 2026 (end of Q2)
  quarters: [
    { label: 'Q1 FY27 — Feb – Apr', start: new Date(2026, 1, 1), end: new Date(2026, 4, 1), stripe: '#eef4ff', color: '#0053e2' },
    { label: 'Q2 FY27 — May – Jul', start: new Date(2026, 4, 1), end: new Date(2026, 7, 1), stripe: '#f8faff', color: '#2a8703' },
  ],
  months: [
    { label: 'Feb', start: new Date(2026, 1, 1), end: new Date(2026, 2, 1) },
    { label: 'Mar', start: new Date(2026, 2, 1), end: new Date(2026, 3, 1) },
    { label: 'Apr', start: new Date(2026, 3, 1), end: new Date(2026, 4, 1) },
    { label: 'May', start: new Date(2026, 4, 1), end: new Date(2026, 5, 1) },
    { label: 'Jun', start: new Date(2026, 5, 1), end: new Date(2026, 6, 1) },
    { label: 'Jul', start: new Date(2026, 6, 1), end: new Date(2026, 7, 1) },
  ],
};
const BIZ_TOTAL_MS  = BIZ_FY.end - BIZ_FY.start;
const BIZ_LABEL_W   = 260;  // px — wider than program view to fit capability text

// ── View-mode state ──────────────────────────────────────────────────
let bizGanttView = 'program'; // 'program' | 'biz-impact'

window.ganttGetView = function() { return bizGanttView; };

window.ganttSetView = function(view) {
  bizGanttView = view;

  const btnProgram = document.getElementById('gantt-view-btn-program');
  const btnBiz     = document.getElementById('gantt-view-btn-biz');
  const wsFilters  = document.getElementById('gantt-ws-filters');

  if (btnProgram) btnProgram.classList.toggle('active', view === 'program');
  if (btnBiz)     btnBiz.classList.toggle('active',     view === 'biz-impact');

  // Workstream filters only relevant in program view
  if (wsFilters) wsFilters.style.opacity = view === 'program' ? '1' : '0.35';
  if (wsFilters) wsFilters.style.pointerEvents = view === 'program' ? '' : 'none';

  // Swap chart min-width for the narrower biz timeline
  const chart = document.querySelector('.gantt-chart');
  if (chart) chart.style.minWidth = view === 'biz-impact' ? '900px' : '';

  if (view === 'program') {
    renderGanttChart();
  } else {
    renderBizImpactChart();
  }
};

// ── Helpers ────────────────────────────────────────────────────────
function bizPct(date) {
  const clamped = Math.max(+BIZ_FY.start, Math.min(+BIZ_FY.end, +date));
  return ((clamped - BIZ_FY.start) / BIZ_TOTAL_MS) * 100;
}

function bizQtrBounds(qLabel) {
  const q = BIZ_FY.quarters.find(q => q.label.startsWith(qLabel.substring(0,2)));
  return q || BIZ_FY.quarters[0];
}

// Track background decoration (stripes + month dividers + today tick)
function bizDeco() {
  const stripes = BIZ_FY.quarters.map(q => {
    const l = bizPct(q.start).toFixed(2);
    const w = ((q.end - q.start) / BIZ_TOTAL_MS * 100).toFixed(2);
    return `<div class="gantt-stripe" style="left:${l}%;width:${w}%;background:${q.stripe}"></div>`;
  }).join('');

  const divs = BIZ_FY.months.map((mo, i) => {
    if (i === 0) return '';
    const isQBoundary = i % 3 === 0;
    return `<div class="${isQBoundary ? 'gantt-divider' : 'gantt-month-divider'}" style="left:${bizPct(mo.start).toFixed(2)}%"></div>`;
  }).join('');

  let todayTick = '';
  const now = new Date();
  if (now >= BIZ_FY.start && now <= BIZ_FY.end) {
    todayTick = `<div class="gantt-today-track" style="left:${bizPct(now).toFixed(2)}%"></div>`;
  }
  return stripes + divs + todayTick;
}

// ── Header builder for biz-impact view ──────────────────────────────
function buildBizImpactHeader() {
  const el = document.getElementById('gantt-qheader');
  if (!el) return;

  const qRow = BIZ_FY.quarters.map(q => {
    const w = ((q.end - q.start) / BIZ_TOTAL_MS * 100).toFixed(2);
    return `<div class="gantt-qcol" style="width:${w}%;color:${q.color};border-bottom:3px solid ${q.color}40">${q.label}</div>`;
  }).join('');

  const mRow = BIZ_FY.months.map((mo, i) => {
    const cls = ['gantt-mcol', i % 3 === 0 ? 'gantt-mcol-qstart' : ''].filter(Boolean).join(' ');
    const w   = ((mo.end - mo.start) / BIZ_TOTAL_MS * 100).toFixed(2);
    return `<div class="${cls}" style="width:${w}%">${mo.label}</div>`;
  }).join('');

  // Wider stub to match BIZ_LABEL_W
  el.innerHTML = `
    <div class="gantt-header-stub" style="width:${BIZ_LABEL_W}px"></div>
    <div class="gantt-header-timeline">
      <div class="gantt-header-qrow">${qRow}</div>
      <div class="gantt-header-mrow">${mRow}</div>
    </div>
  `;
}

// ── Main render ────────────────────────────────────────────────────────
window.renderBizImpactChart = function() {
  const body = document.getElementById('gantt-body');
  if (!body) return;

  buildBizImpactHeader();

  const goals  = window.BIZ_IMPACT_GOALS  || [];
  const progCfg = window.BIZ_PROGRAM_CONFIG || {};
  const deco   = bizDeco();
  let html = '';

  // Preamble banner
  html += `
    <div class="biz-preamble">
      <span class="biz-preamble-icon">🎯</span>
      <div>
        <div class="biz-preamble-title">Business Impact View &mdash; Q1 &amp; Q2 FY27</div>
        <div class="biz-preamble-sub">What changes for your team, not how we&rsquo;re building it. Scope: Automated Item Setup &bull; AEX Stability &bull; Centric Visual Board MVP.</div>
      </div>
      <div class="biz-legend">
        <span class="biz-badge biz-badge-automation">Work Removed</span> task automated away
        &nbsp;&nbsp;
        <span class="biz-badge biz-badge-capability">New Capability</span> something you can now do
      </div>
    </div>`;

  goals.forEach(goal => {
    const q1Caps = goal.capabilities.filter(c => c.quarter === 'Q1');
    const q2Caps = goal.capabilities.filter(c => c.quarter === 'Q2');
    const all    = [...q1Caps, ...q2Caps];

    // Goal header row
    html += `
      <div class="gantt-phase-header biz-goal-header">
        <div class="gantt-label gantt-phase-label-cell" style="width:${BIZ_LABEL_W}px;border-left:4px solid ${goal.color};background:#f8faff">
          <span class="gantt-phase-emoji">${goal.icon}</span>
          <div>
            <div class="gantt-phase-name" style="color:${goal.color}">${goal.label}</div>
            <div class="gantt-phase-win">${goal.description}</div>
          </div>
        </div>
        <div class="gantt-track" style="height:48px">
          ${deco}
          ${BIZ_FY.quarters.map(q => {
            const l = bizPct(q.start).toFixed(2);
            const w = ((q.end - q.start) / BIZ_TOTAL_MS * 100).toFixed(2);
            const count = goal.capabilities.filter(c => c.quarter === q.label.substring(0,2)).length;
            return count > 0
              ? `<div class="biz-goal-band" style="left:${l}%;width:${w}%;border-bottom:3px solid ${goal.color}40">
                   <span style="color:${goal.color};font-size:10px;font-weight:700">${count} impact${count !== 1 ? 's' : ''}</span>
                 </div>`
              : `<div class="biz-goal-band biz-goal-band-empty" style="left:${l}%;width:${w}%"></div>`;
          }).join('')}
        </div>
      </div>`;

    // Capability rows
    all.forEach((cap, idx) => {
      const prog   = progCfg[cap.programId] || { label: cap.program, color: '#6b7280', textColor: '#fff' };
      const qBound = BIZ_FY.quarters.find(q => q.label.startsWith(cap.quarter)) || BIZ_FY.quarters[0];
      const barL   = bizPct(qBound.start).toFixed(2);
      const barW   = ((qBound.end - qBound.start) / BIZ_TOTAL_MS * 100).toFixed(2);
      const isEven = idx % 2 === 0;

      html += `
        <div class="gantt-row biz-cap-row${isEven ? '' : ' biz-cap-row-alt'}">
          <div class="gantt-label biz-cap-label" style="width:${BIZ_LABEL_W}px">
            <div class="biz-cap-inner">
              <span class="biz-badge ${cap.type === 'automation' ? 'biz-badge-automation' : 'biz-badge-capability'}">
                ${cap.type === 'automation' ? '✕ Removed' : '+ Gained'}
              </span>
              <span class="biz-cap-text">${cap.label}</span>
            </div>
            <div class="biz-cap-meta">
              <span class="biz-prog-pill" style="background:${prog.color};color:${prog.textColor}">${prog.label}</span>
              <span style="color:#9ca3af">${cap.target}</span>
            </div>
          </div>
          <div class="gantt-track biz-cap-track">
            ${deco}
            <div class="biz-cap-bar" style="left:${barL}%;width:${barW}%;background:${goal.color}">
              <span class="biz-cap-bar-label">${cap.quarter} FY27</span>
            </div>
          </div>
        </div>`;
    });
  });

  body.innerHTML = html || '<div class="gantt-empty">No business impact data defined.</div>';
};
