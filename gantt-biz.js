// gantt-biz.js — Business Impact Timeline renderer
// Layout: one row per goal, goal info sticky-left, capability chips inside the timeline.
// Scope: Q1 + Q2 FY27 (Feb–Jul 2026)

// ── Timeline constants ────────────────────────────────────────────
const BIZ_FY = {
  start: new Date(2026, 1, 1),
  end:   new Date(2026, 7, 1),
  quarters: [
    { label: 'Q1 FY27 — Feb – Apr', short: 'Q1', start: new Date(2026, 1, 1), end: new Date(2026, 4, 1), stripe: '#eef4ff', color: '#0053e2' },
    { label: 'Q2 FY27 — May – Jul', short: 'Q2', start: new Date(2026, 4, 1), end: new Date(2026, 7, 1), stripe: '#f8faff', color: '#2a8703' },
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
const BIZ_TOTAL_MS = BIZ_FY.end - BIZ_FY.start;
const BIZ_LABEL_W  = 240;   // px — left goal panel

// Chip geometry
const CHIP_H   = 54;   // px per capability chip
const CHIP_GAP = 6;    // px gap between stacked chips
const CHIP_PAD = 10;   // px top/bottom padding inside the track

// ── View-mode state ──────────────────────────────────────────────────
let bizGanttView = 'biz-impact';

window.ganttGetView = function() { return bizGanttView; };

window.ganttSetView = function(view) {
  bizGanttView = view;
  const btnProgram = document.getElementById('gantt-view-btn-program');
  const btnBiz     = document.getElementById('gantt-view-btn-biz');
  const wsFilters  = document.getElementById('gantt-ws-filters');
  if (btnProgram) btnProgram.classList.toggle('active', view === 'program');
  if (btnBiz)     btnBiz.classList.toggle('active',     view === 'biz-impact');
  if (wsFilters) wsFilters.style.opacity      = view === 'program' ? '1' : '0.35';
  if (wsFilters) wsFilters.style.pointerEvents = view === 'program' ? '' : 'none';
  const chart = document.querySelector('.gantt-chart');
  if (chart) chart.style.minWidth = view === 'biz-impact' ? '860px' : '';
  view === 'program' ? renderGanttChart() : renderBizImpactChart();
};

// ── Helpers ──────────────────────────────────────────────────────────
function bizPct(date) {
  const clamped = Math.max(+BIZ_FY.start, Math.min(+BIZ_FY.end, +date));
  return ((clamped - BIZ_FY.start) / BIZ_TOTAL_MS) * 100;
}

// How tall a goal row needs to be to fit all its chips.
function bizGoalRowH(goal) {
  const maxStack = Math.max(
    ...BIZ_FY.quarters.map(q =>
      goal.capabilities.filter(c => c.quarter === q.short).length
    ), 1
  );
  return maxStack * (CHIP_H + CHIP_GAP) - CHIP_GAP + CHIP_PAD * 2;
}

// Background stripes + month dividers + today tick.
function bizDeco(rowH) {
  const stripes = BIZ_FY.quarters.map(q => {
    const l = bizPct(q.start).toFixed(2);
    const w = ((q.end - q.start) / BIZ_TOTAL_MS * 100).toFixed(2);
    return `<div class="gantt-stripe" style="left:${l}%;width:${w}%;height:100%;background:${q.stripe}"></div>`;
  }).join('');

  const divs = BIZ_FY.months.map((mo, i) => {
    if (i === 0) return '';
    const cls = i % 3 === 0 ? 'gantt-divider' : 'gantt-month-divider';
    return `<div class="${cls}" style="left:${bizPct(mo.start).toFixed(2)}%;height:100%"></div>`;
  }).join('');

  let today = '';
  const now = new Date();
  if (now >= BIZ_FY.start && now <= BIZ_FY.end)
    today = `<div class="gantt-today-track" style="left:${bizPct(now).toFixed(2)}%;height:100%"></div>`;

  return stripes + divs + today;
}

// ── Header builder ────────────────────────────────────────────────────
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
    </div>`;
}

// ── Modal (single capability detail) ────────────────────────────────
function _getBizModal() {
  let m = document.getElementById('biz-cap-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'biz-cap-modal';
    m.innerHTML = `
      <div class="biz-modal-backdrop" onclick="bizCloseModal()"></div>
      <div class="biz-modal-card" role="dialog" aria-modal="true">
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

function _bizEscHandler(e) { if (e.key === 'Escape') window.bizCloseModal(); }

// Open detail modal for a single capability chip.
window.bizOpenCap = function(goalId, capIdx) {
  const goals   = window.BIZ_IMPACT_GOALS  || [];
  const progCfg = window.BIZ_PROGRAM_CONFIG || {};
  const goal    = goals.find(g => g.id === goalId);
  if (!goal) return;
  const cap  = goal.capabilities[capIdx];
  if (!cap)  return;
  const prog = progCfg[cap.programId] || { label: cap.program, color: '#6b7280', textColor: '#fff' };
  const qObj = BIZ_FY.quarters.find(q => q.short === cap.quarter) || BIZ_FY.quarters[0];
  const badgeCls = cap.type === 'automation' ? 'biz-badge-automation' : 'biz-badge-capability';
  const badgeTxt = cap.type === 'automation' ? '✕ Work Removed' : '+ New Capability';

  const modal = _getBizModal();
  document.getElementById('biz-modal-body').innerHTML = `
    <div class="biz-modal-goal-header" style="border-left:4px solid ${goal.color}">
      <span class="biz-modal-goal-icon">${goal.icon}</span>
      <div>
        <div class="biz-modal-goal-label" style="color:${goal.color}">${goal.label}</div>
        <div class="biz-modal-goal-desc">${goal.description}</div>
      </div>
    </div>
    <div class="biz-modal-qbar" style="background:${qObj.color}15;border:1px solid ${qObj.color}40">
      <span style="color:${qObj.color};font-weight:800;font-size:13px">${qObj.label}</span>
      <span class="biz-badge ${badgeCls}" style="margin-left:auto">${badgeTxt}</span>
      <span class="biz-prog-pill" style="background:${prog.color};color:${prog.textColor}">${prog.label}</span>
    </div>
    <div class="biz-modal-item" style="border:none;background:white;padding:0 4px">
      <p class="biz-modal-item-text" style="font-size:15px;line-height:1.7">${cap.label}</p>
      <div class="biz-modal-target" style="margin-top:10px;font-size:11px;color:#6b7280">📅 Target: ${cap.target}</div>
    </div>`;

  modal.classList.add('open');
  document.addEventListener('keydown', _bizEscHandler);
};

// ── Main render ──────────────────────────────────────────────────────
window.renderBizImpactChart = function() {
  const body = document.getElementById('gantt-body');
  if (!body) return;

  buildBizImpactHeader();

  const goals   = window.BIZ_IMPACT_GOALS  || [];
  const progCfg = window.BIZ_PROGRAM_CONFIG || {};
  let html = '';

  // Preamble
  html += `
    <div class="biz-preamble">
      <span class="biz-preamble-icon">🎯</span>
      <div>
        <div class="biz-preamble-title">Business Impact &mdash; Q1 &amp; Q2 FY27</div>
        <div class="biz-preamble-sub">What changes for your team across Q1 &amp; Q2.
          Programs: Automated Item Setup &bull; AEX Stability &bull; Centric Visual Board MVP.
          <strong>Click any impact chip to read the full statement.</strong>
        </div>
      </div>
      <div class="biz-legend">
        <span class="biz-badge biz-badge-automation">✕ Work Removed</span>
        <span class="biz-badge biz-badge-capability">+ New Capability</span>
      </div>
    </div>`;

  goals.forEach((goal, goalIdx) => {
    const rowH = bizGoalRowH(goal);
    const deco = bizDeco(rowH);

    // Build capability chips, grouped per quarter column
    let chipsHtml = '';
    BIZ_FY.quarters.forEach(q => {
      const qCaps = goal.capabilities
        .map((c, i) => ({ cap: c, idx: i }))
        .filter(({ cap }) => cap.quarter === q.short);

      const barL    = bizPct(q.start).toFixed(2);
      const barWPct = ((q.end - q.start) / BIZ_TOTAL_MS * 100).toFixed(2);

      qCaps.forEach(({ cap, idx }, stackIdx) => {
        const prog     = progCfg[cap.programId] || { label: cap.program, color: '#6b7280', textColor: '#fff' };
        const badgeCls = cap.type === 'automation' ? 'biz-badge-automation' : 'biz-badge-capability';
        const badgeTxt = cap.type === 'automation' ? '✕ Work Removed' : '+ New Capability';
        const chipTop  = CHIP_PAD + stackIdx * (CHIP_H + CHIP_GAP);

        chipsHtml += `
          <div class="biz-chip"
               style="left:calc(${barL}% + 8px);width:calc(${barWPct}% - 16px);top:${chipTop}px;height:${CHIP_H}px;border-left:3px solid ${goal.color};background:${goal.color}0e;"
               onclick="event.stopPropagation();bizOpenCap('${goal.id}',${idx})"
               title="Click to read full statement">
            <div class="biz-chip-header">
              <span class="biz-badge ${badgeCls}">${badgeTxt}</span>
              <span class="biz-prog-pill" style="background:${prog.color};color:${prog.textColor};font-size:8px;padding:1px 5px">${prog.label}</span>
            </div>
            <div class="biz-chip-text">${cap.label}</div>
          </div>`;
      });
    });

    // Quarter impact summary for left panel
    const qSummary = BIZ_FY.quarters.map(q => {
      const n = goal.capabilities.filter(c => c.quarter === q.short).length;
      return n > 0 ? `<span style="color:${q.color};font-weight:700">${q.short}:</span> ${n}` : '';
    }).filter(Boolean).join(' &bull; ');

    const altBg = goalIdx % 2 === 0 ? '#fafcff' : '#f7fbf7';

    html += `
      <div class="biz-goal-row" style="min-height:${rowH}px;background:${altBg};border-top:2px solid ${goal.color}20">
        <div class="gantt-label biz-goal-label-panel" style="width:${BIZ_LABEL_W}px;height:${rowH}px;border-left:4px solid ${goal.color}">
          <div class="biz-goal-panel-icon">${goal.icon}</div>
          <div class="biz-goal-panel-name" style="color:${goal.color}">${goal.label}</div>
          <div class="biz-goal-panel-desc">${goal.description}</div>
          <div class="biz-goal-panel-summary">${qSummary} impacts</div>
        </div>
        <div class="biz-goal-track" style="height:${rowH}px">
          ${deco}
          ${chipsHtml}
        </div>
      </div>`;
  });

  body.innerHTML = html || '<div class="gantt-empty">No business impact data defined.</div>';
};