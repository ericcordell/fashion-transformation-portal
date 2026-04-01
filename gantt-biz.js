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
const BIZ_LABEL_W   = 280;  // px

// ── View-mode state ──────────────────────────────────────────────────
let bizGanttView = 'biz-impact'; // default to Business Impact

window.ganttGetView = function() { return bizGanttView; };

window.ganttSetView = function(view) {
  bizGanttView = view;

  const btnProgram = document.getElementById('gantt-view-btn-program');
  const btnBiz     = document.getElementById('gantt-view-btn-biz');
  const wsFilters  = document.getElementById('gantt-ws-filters');

  if (btnProgram) btnProgram.classList.toggle('active', view === 'program');
  if (btnBiz)     btnBiz.classList.toggle('active',     view === 'biz-impact');

  // Workstream filters only relevant in program view
  if (wsFilters) wsFilters.style.opacity      = view === 'program' ? '1' : '0.35';
  if (wsFilters) wsFilters.style.pointerEvents = view === 'program' ? '' : 'none';

  // Narrower timeline for biz view
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

// ── Header builder ──────────────────────────────────────────────────
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

  el.innerHTML = `
    <div class="gantt-header-stub" style="width:${BIZ_LABEL_W}px"></div>
    <div class="gantt-header-timeline">
      <div class="gantt-header-qrow">${qRow}</div>
      <div class="gantt-header-mrow">${mRow}</div>
    </div>
  `;
}

// ── Popout modal ────────────────────────────────────────────────────
// Lazily inject the modal container once and reuse it.
function _getBizModal() {
  let m = document.getElementById('biz-cap-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'biz-cap-modal';
    m.innerHTML = `
      <div class="biz-modal-backdrop" onclick="bizCloseModal()"></div>
      <div class="biz-modal-card" role="dialog" aria-modal="true" aria-labelledby="biz-modal-title">
        <button class="biz-modal-close" onclick="bizCloseModal()" aria-label="Close">&times;</button>
        <div id="biz-modal-body"></div>
      </div>`;
    document.body.appendChild(m);
  }
  return m;
}

window.bizCloseModal = function() {
  const m = document.getElementById('biz-cap-modal');
  if (m) m.classList.remove('open');
  document.removeEventListener('keydown', _bizEscHandler);
};

function _bizEscHandler(e) {
  if (e.key === 'Escape') window.bizCloseModal();
}

// Open modal for a merged quarter-group.
// goalId: goal.id string, quarter: 'Q1' | 'Q2'
window.bizOpenGroup = function(goalId, quarter) {
  const goals   = window.BIZ_IMPACT_GOALS  || [];
  const progCfg = window.BIZ_PROGRAM_CONFIG || {};
  const goal    = goals.find(g => g.id === goalId);
  if (!goal) return;

  const caps = goal.capabilities.filter(c => c.quarter === quarter);
  const qObj = BIZ_FY.quarters.find(q => q.label.startsWith(quarter)) || BIZ_FY.quarters[0];

  const autoCount = caps.filter(c => c.type === 'automation').length;
  const capCount  = caps.filter(c => c.type === 'capability').length;

  const itemsHtml = caps.map(cap => {
    const prog     = progCfg[cap.programId] || { label: cap.program, color: '#6b7280', textColor: '#fff' };
    const badgeCls = cap.type === 'automation' ? 'biz-badge-automation' : 'biz-badge-capability';
    const badgeTxt = cap.type === 'automation' ? '✕ Work Removed' : '+ New Capability';
    return `
      <div class="biz-modal-item">
        <div class="biz-modal-item-header">
          <span class="biz-badge ${badgeCls}">${badgeTxt}</span>
          <span class="biz-prog-pill" style="background:${prog.color};color:${prog.textColor}">${prog.label}</span>
          <span class="biz-modal-target">📅 ${cap.target}</span>
        </div>
        <p class="biz-modal-item-text">${cap.label}</p>
      </div>`;
  }).join('');

  const modal = _getBizModal();
  document.getElementById('biz-modal-body').innerHTML = `
    <div class="biz-modal-goal-header" style="border-left:4px solid ${goal.color}">
      <span class="biz-modal-goal-icon">${goal.icon}</span>
      <div>
        <div class="biz-modal-goal-label" style="color:${goal.color}">${goal.label}</div>
        <div class="biz-modal-goal-desc">${goal.description}</div>
      </div>
    </div>
    <div class="biz-modal-qbar" style="background:${qObj.color}20;border:1px solid ${qObj.color}40">
      <span style="color:${qObj.color};font-weight:800;font-size:13px">${qObj.label}</span>
      <span class="biz-modal-counts">
        ${autoCount > 0 ? `<span class="biz-badge biz-badge-automation">${autoCount} Work Removed</span>` : ''}
        ${capCount  > 0 ? `<span class="biz-badge biz-badge-capability">${capCount} New Capability</span>` : ''}
      </span>
    </div>
    <div class="biz-modal-items">${itemsHtml}</div>
  `;

  modal.classList.add('open');
  document.addEventListener('keydown', _bizEscHandler);
};

// ── Main render ────────────────────────────────────────────────────────
window.renderBizImpactChart = function() {
  const body = document.getElementById('gantt-body');
  if (!body) return;

  buildBizImpactHeader();

  const goals   = window.BIZ_IMPACT_GOALS  || [];
  const progCfg = window.BIZ_PROGRAM_CONFIG || {};
  const deco    = bizDeco();
  let html = '';

  // Preamble banner
  html += `
    <div class="biz-preamble">
      <span class="biz-preamble-icon">🎯</span>
      <div>
        <div class="biz-preamble-title">Business Impact View &mdash; Q1 &amp; Q2 FY27</div>
        <div class="biz-preamble-sub">What changes for your team, not how we&rsquo;re building it.
          Scope: Automated Item Setup &bull; AEX Stability &bull; Centric Visual Board MVP.
          <strong>Click any row to read the full impact statement.</strong></div>
      </div>
      <div class="biz-legend">
        <span class="biz-badge biz-badge-automation">✕ Work Removed</span> task automated away
        &nbsp;&nbsp;
        <span class="biz-badge biz-badge-capability">+ New Capability</span> something you can now do
      </div>
    </div>`;

  goals.forEach(goal => {
    // Group capabilities by quarter
    const groups = BIZ_FY.quarters.map(q => ({
      qKey:  q.label.substring(0, 2),   // 'Q1' | 'Q2'
      qObj:  q,
      caps:  goal.capabilities.filter(c => c.quarter === q.label.substring(0, 2)),
    })).filter(g => g.caps.length > 0);

    const totalCaps = goal.capabilities.length;

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
            const l     = bizPct(q.start).toFixed(2);
            const w     = ((q.end - q.start) / BIZ_TOTAL_MS * 100).toFixed(2);
            const count = goal.capabilities.filter(c => c.quarter === q.label.substring(0, 2)).length;
            return count > 0
              ? `<div class="biz-goal-band" style="left:${l}%;width:${w}%;border-bottom:3px solid ${goal.color}40">
                   <span style="color:${goal.color};font-size:10px;font-weight:700">${count} impact${count !== 1 ? 's' : ''}</span>
                 </div>`
              : `<div class="biz-goal-band biz-goal-band-empty" style="left:${l}%;width:${w}%"></div>`;
          }).join('')}
        </div>
      </div>`;

    // One merged row per quarter group
    groups.forEach((grp, grpIdx) => {
      const { qKey, qObj, caps } = grp;
      const autoCount = caps.filter(c => c.type === 'automation').length;
      const capCount  = caps.filter(c => c.type === 'capability').length;
      const isEven    = grpIdx % 2 === 0;

      // Collect unique programs in this group
      const progLabels = [...new Set(caps.map(c => {
        const p = progCfg[c.programId];
        return p ? p.label : c.program;
      }))];

      // Build compact label bullets (show first 2, then +N)
      const MAX_SHOWN = 2;
      const shownCaps = caps.slice(0, MAX_SHOWN);
      const remaining = caps.length - MAX_SHOWN;

      const bulletItems = shownCaps.map(c => {
        const badgeCls = c.type === 'automation' ? 'biz-badge-automation' : 'biz-badge-capability';
        const badgeTxt = c.type === 'automation' ? '✕' : '+';
        return `<div class="biz-merged-bullet">
          <span class="biz-badge ${badgeCls}" style="padding:1px 4px;font-size:8px">${badgeTxt}</span>
          <span class="biz-merged-bullet-text">${c.label}</span>
        </div>`;
      }).join('');

      const moreChip = remaining > 0
        ? `<div class="biz-merged-more">+${remaining} more impact${remaining !== 1 ? 's' : ''} &mdash; click to expand</div>`
        : `<div class="biz-merged-more" style="color:#0053e2">Click to read full statements</div>`;

      // Bar spans the whole quarter
      const barL = bizPct(qObj.start).toFixed(2);
      const barW = ((qObj.end - qObj.start) / BIZ_TOTAL_MS * 100).toFixed(2);

      html += `
        <div class="gantt-row biz-merged-row${isEven ? '' : ' biz-cap-row-alt'}"
             onclick="bizOpenGroup('${goal.id}','${qKey}')"
             title="Click to read all ${caps.length} impact statements">
          <div class="gantt-label biz-merged-label" style="width:${BIZ_LABEL_W}px">
            <div class="biz-merged-header">
              <span class="biz-merged-qtag" style="background:${qObj.color}18;color:${qObj.color};border:1px solid ${qObj.color}40">${qKey} FY27</span>
              <span class="biz-merged-count">${caps.length} impact${caps.length !== 1 ? 's' : ''}</span>
              ${autoCount > 0 ? `<span class="biz-badge biz-badge-automation" style="font-size:8px">${autoCount} Removed</span>` : ''}
              ${capCount  > 0 ? `<span class="biz-badge biz-badge-capability" style="font-size:8px">${capCount} Gained</span>`  : ''}
            </div>
            ${bulletItems}
            ${moreChip}
          </div>
          <div class="gantt-track biz-merged-track">
            ${deco}
            <div class="biz-merged-bar" style="left:${barL}%;width:${barW}%;background:${goal.color}">
              <span class="biz-cap-bar-label">${caps.length} impacts · ${qKey} FY27</span>
              <span class="biz-merged-bar-hint">click to read all</span>
            </div>
          </div>
        </div>`;
    });
  });

  body.innerHTML = html || '<div class="gantt-empty">No business impact data defined.</div>';
};