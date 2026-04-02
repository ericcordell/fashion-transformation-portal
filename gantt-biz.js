// gantt-biz.js — Business Impact Timeline renderer
// Sliding 2-quarter window | Quarter-only header | Text-dominant chips

// ── Full quarter calendar (Q1 FY27 – Q1 FY28) ───────────────────────
const BIZ_QUARTERS = [
  { key: 'Q1FY27', label: 'Q1 FY27', sub: 'Feb – Apr 2026',
    start: new Date(2026, 1, 1), end: new Date(2026, 4, 1),
    stripe: '#eef4ff', color: '#0053e2' },
  { key: 'Q2FY27', label: 'Q2 FY27', sub: 'May – Jul 2026',
    start: new Date(2026, 4, 1), end: new Date(2026, 7, 1),
    stripe: '#edfcf2', color: '#2a8703' },
  { key: 'Q3FY27', label: 'Q3 FY27', sub: 'Aug – Oct 2026',
    start: new Date(2026, 7, 1), end: new Date(2026, 10, 1),
    stripe: '#fff9f0', color: '#b86000' },
  { key: 'Q4FY27', label: 'Q4 FY27', sub: 'Nov 2026 – Jan 2027',
    start: new Date(2026, 10, 1), end: new Date(2027, 1, 1),
    stripe: '#f5f0ff', color: '#6d28d9' },
  { key: 'Q1FY28', label: 'Q1 FY28', sub: 'Feb – Apr 2027',
    start: new Date(2027, 1, 1), end: new Date(2027, 4, 1),
    stripe: '#eef4ff', color: '#0053e2' },
];

// Legacy alias — modal code references BIZ_FY.quarters
const BIZ_FY = { quarters: BIZ_QUARTERS };

const BIZ_LABEL_W = 240; // px — sticky goal panel

// Chip: 2-line impact text + small meta footer
const CHIP_H   = 60;  // px — 2 lines text + meta + padding
const CHIP_GAP = 6;   // px between stacked chips
const CHIP_PAD = 10;  // px top/bottom padding in track

// ── Sliding window state ─────────────────────────────────────────────
let bizWinStart = 0;

function bizVisibleQs() {
  return BIZ_QUARTERS.slice(bizWinStart, bizWinStart + 2);
}

// ── View state ───────────────────────────────────────────────────────
let bizGanttView = 'biz-impact';

window.ganttGetView = function() { return bizGanttView; };

window.ganttSetView = function(view) {
  bizGanttView = view;
  const btnP = document.getElementById('gantt-view-btn-program');
  const btnB = document.getElementById('gantt-view-btn-biz');
  const wsF  = document.getElementById('gantt-ws-filters');
  if (btnP) btnP.classList.toggle('active', view === 'program');
  if (btnB) btnB.classList.toggle('active', view === 'biz-impact');
  if (wsF) {
    wsF.style.opacity      = view === 'program' ? '1' : '0.35';
    wsF.style.pointerEvents = view === 'program' ? '' : 'none';
  }
  const chart = document.querySelector('.gantt-chart');
  if (chart) chart.style.minWidth = view === 'biz-impact' ? '820px' : '';
  view === 'program' ? renderGanttChart() : renderBizImpactChart();
};

window.bizNavPrev = function() {
  if (bizWinStart > 0) { bizWinStart--; renderBizImpactChart(); }
};

window.bizNavNext = function() {
  if (bizWinStart < BIZ_QUARTERS.length - 2) { bizWinStart++; renderBizImpactChart(); }
};

// ── Expand / collapse per goal (persists across quarter navigation) ────
const bizExpandedGoals = new Set();

window.bizToggleExpand = function(goalId) {
  if (bizExpandedGoals.has(goalId)) {
    bizExpandedGoals.delete(goalId);
  } else {
    bizExpandedGoals.add(goalId);
  }
  renderBizImpactChart();
};

// ── Row height: variable per goal, based on visible quarters only ─────
function bizGoalRowH(goal, visibleQs) {
  const maxStack = Math.max(
    ...visibleQs.map(q => goal.capabilities.filter(c => c.quarter === q.key).length),
    1
  );
  return Math.max(maxStack * (CHIP_H + CHIP_GAP) - CHIP_GAP + CHIP_PAD * 2, 72);
}

// ── Background: 50/50 stripes + center divider (no today line in biz view) ──
function bizDeco(visibleQs) {
  const [q0, q1] = visibleQs;
  const stripes = [
    `<div class="gantt-stripe" style="left:0;width:50%;height:100%;background:${q0.stripe}"></div>`,
    `<div class="gantt-stripe" style="left:50%;width:50%;height:100%;background:${q1.stripe}"></div>`,
  ].join('');
  const divider = `<div class="gantt-divider" style="left:50%;height:100%"></div>`;
  return stripes + divider;
}

// ── Header: quarter cols only, nav arrows in stub ────────────────────
function buildBizImpactHeader(visibleQs) {
  const el = document.getElementById('gantt-qheader');
  if (!el) return;

  const canPrev  = bizWinStart > 0;
  const canNext  = bizWinStart < BIZ_QUARTERS.length - 2;
  const prevQ    = canPrev ? BIZ_QUARTERS[bizWinStart - 1] : null;
  const nextQ    = canNext ? BIZ_QUARTERS[bizWinStart + 2] : null;
  const prevTip  = canPrev ? `← ${prevQ.label}` : '';
  const nextTip  = canNext ? `${nextQ.label} →` : '';

  const qCols = visibleQs.map(q => `
    <div class="biz-qcol" style="color:${q.color};border-bottom:3px solid ${q.color}60">
      <span class="biz-qcol-label">${q.label}</span>
      <span class="biz-qcol-sub">${q.sub}</span>
    </div>`).join('');

  el.innerHTML = `
    <div class="gantt-header-stub" style="width:${BIZ_LABEL_W}px">
      <div class="biz-win-nav">
        <button class="biz-nav-btn" onclick="bizNavPrev()"
                ${canPrev ? '' : 'disabled'} title="${prevTip}">&#8249;</button>
        <span class="biz-nav-label">Quarter view</span>
        <button class="biz-nav-btn" onclick="bizNavNext()"
                ${canNext ? '' : 'disabled'} title="${nextTip}">&#8250;</button>
      </div>
    </div>
    <div class="gantt-header-timeline" style="display:flex">
      ${qCols}
    </div>`;
}

// ── Modal ────────────────────────────────────────────────────────────
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

// Open detail modal for a capability chip.
window.bizOpenCap = function(goalId, capIdx) {
  const goals   = window.BIZ_IMPACT_GOALS  || [];
  const progCfg = window.BIZ_PROGRAM_CONFIG || {};
  const goal    = goals.find(g => g.id === goalId);
  if (!goal) return;
  const cap  = goal.capabilities[capIdx];
  if (!cap)  return;

  const prog     = progCfg[cap.programId] || { label: cap.program, color: '#6b7280', textColor: '#fff' };
  const qObj     = BIZ_QUARTERS.find(q => q.key === cap.quarter) || BIZ_QUARTERS[0];
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
      <span style="color:${qObj.color};font-weight:800;font-size:13px">
        ${qObj.label}
        <span style="font-weight:400;font-size:11px;opacity:0.75"> &mdash; ${qObj.sub}</span>
      </span>
      <span class="biz-badge ${badgeCls}" style="margin-left:auto">${badgeTxt}</span>
      <span class="biz-prog-pill" style="background:${prog.color};color:${prog.textColor}">${prog.label}</span>
      <span class="biz-modal-target">📅 ${cap.target}</span>
    </div>
    <div class="biz-modal-impact-statement">
      <div class="biz-modal-impact-headline">${cap.label}</div>
      <p class="biz-modal-impact-narrative">${cap.narrative}</p>
    </div>
    <div class="biz-modal-links">
      <div class="biz-modal-link-label">Jump to:</div>
      <button id="biz-open-card-btn" class="biz-modal-link-btn biz-modal-link-card"
              data-cid="${cap.cardId}" data-ws="${cap.workstream}">
        📋 Program Card &mdash; ${cap.program}
      </button>
      <a class="biz-modal-link-btn biz-modal-link-opif"
         href="${cap.opifUrl}" target="_blank" rel="noopener">
        🎫 ${cap.opifLabel}
        <span class="biz-modal-link-ext">↗</span>
      </a>
    </div>`;

  const cardBtn = document.getElementById('biz-open-card-btn');
  if (cardBtn) {
    cardBtn.addEventListener('click', function() {
      window.bizCloseModal();
      if (typeof openModal === 'function') openModal(this.dataset.cid, this.dataset.ws, null);
    });
  }

  modal.classList.add('open');
  document.addEventListener('keydown', _bizEscHandler);
};

// ── Main render ──────────────────────────────────────────────────────
window.renderBizImpactChart = function() {
  const body = document.getElementById('gantt-body');
  if (!body) return;

  const visibleQs = bizVisibleQs();
  buildBizImpactHeader(visibleQs);

  const goals   = window.BIZ_IMPACT_GOALS  || [];
  const progCfg = window.BIZ_PROGRAM_CONFIG || {};
  const [q0, q1] = visibleQs;

  // Dynamic preamble title based on visible window
  const winLabel = q0.label === q1.label ? q0.label : `${q0.label} + ${q1.label}`;

  let html = `
    <div class="biz-preamble">
      <span class="biz-preamble-icon">🎯</span>
      <div>
        <div class="biz-preamble-title">Business Impact &mdash; ${winLabel}</div>
        <div class="biz-preamble-sub">What changes for your team this window.
          <strong>Click any impact to read the full statement.</strong>
        </div>
      </div>
      <div class="biz-legend">
        <span class="biz-chip-type biz-chip-type-auto" style="font-size:10px;padding:3px 8px">✕ Work Removed</span>
        <span class="biz-chip-type biz-chip-type-cap" style="font-size:10px;padding:3px 8px">+ New Capability</span>
      </div>
    </div>`;

  goals.forEach((goal, goalIdx) => {
    const isExpanded = bizExpandedGoals.has(goal.id);
    const totalCount = goal.capabilities.length;
    const altBg      = goalIdx % 2 === 0 ? '#fafcff' : '#f7fbf7';

    // ── EXPANDED: flowing vertical list, all quarters ──────────────
    if (isExpanded) {
      const qOrder = BIZ_QUARTERS.reduce((m, q, i) => { m[q.key] = i; return m; }, {});
      const sorted = goal.capabilities
        .map((c, i) => ({ cap: c, idx: i }))
        .sort((a, b) => (qOrder[a.cap.quarter] || 0) - (qOrder[b.cap.quarter] || 0));

      const groups = {};
      sorted.forEach(({ cap, idx }) => {
        if (!groups[cap.quarter]) groups[cap.quarter] = [];
        groups[cap.quarter].push({ cap, idx });
      });

      let groupsHtml = '';
      BIZ_QUARTERS.forEach(q => {
        if (!groups[q.key] || groups[q.key].length === 0) return;
        const chips = groups[q.key].map(({ cap, idx }) => {
          const prog      = progCfg[cap.programId] || { label: cap.program };
          const typeClass = cap.type === 'automation' ? 'biz-chip-type-auto' : 'biz-chip-type-cap';
          const typeTxt   = cap.type === 'automation' ? '✕ Removed' : '＋ Added';
          return `
            <div class="biz-expand-chip"
                 style="border-left:3px solid ${goal.color};background:${goal.color}0a"
                 onclick="event.stopPropagation();bizOpenCap('${goal.id}',${idx})">
              <div class="biz-chip-text" style="-webkit-line-clamp:unset;display:block">${cap.label}</div>
              <div class="biz-chip-meta">
                <span class="biz-chip-type ${typeClass}">${typeTxt}</span>
                <span class="biz-chip-sep">&middot;</span>
                <span class="biz-chip-prog">${prog.label}</span>
              </div>
            </div>`;
        }).join('');
        groupsHtml += `
          <div class="biz-expand-group">
            <div class="biz-expand-q-label" style="color:${q.color};border-bottom:2px solid ${q.color}35">
              ${q.label}
              <span class="biz-expand-q-sub">&mdash; ${q.sub}</span>
            </div>
            ${chips}
          </div>`;
      });

      html += `
        <div class="biz-goal-row biz-goal-row-expanded" style="background:${altBg};border-top:2px solid ${goal.color}20">
          <div class="biz-goal-label-panel biz-goal-label-panel-expanded"
               style="width:${BIZ_LABEL_W}px;border-left:4px solid ${goal.color}">
            <div class="biz-goal-panel-icon">${goal.icon}</div>
            <div class="biz-goal-panel-name" style="color:${goal.color}">${goal.label}</div>
            <div class="biz-goal-panel-desc">${goal.description}</div>
            <div class="biz-goal-panel-summary">${totalCount} total impacts</div>
            <button class="biz-expand-btn biz-expand-btn-open"
                    onclick="bizToggleExpand('${goal.id}')">&#9650; Collapse</button>
          </div>
          <div class="biz-goal-track-expanded">${groupsHtml}</div>
        </div>`;
      return;
    }

    // ── COLLAPSED: windowed 50/50 chip grid ────────────────────────
    const rowH = bizGoalRowH(goal, visibleQs);
    const deco = bizDeco(visibleQs);

    let chipsHtml = '';
    visibleQs.forEach((q, qColIdx) => {
      const qCaps = goal.capabilities
        .map((c, i) => ({ cap: c, idx: i }))
        .filter(({ cap }) => cap.quarter === q.key);

      const chipLeft  = qColIdx === 0 ? '8px' : 'calc(50% + 8px)';
      const chipWidth = 'calc(50% - 16px)';

      qCaps.forEach(({ cap, idx }, stackIdx) => {
        const prog      = progCfg[cap.programId] || { label: cap.program, color: '#6b7280', textColor: '#fff' };
        const chipTop   = CHIP_PAD + stackIdx * (CHIP_H + CHIP_GAP);
        const typeClass = cap.type === 'automation' ? 'biz-chip-type-auto' : 'biz-chip-type-cap';
        const typeTxt   = cap.type === 'automation' ? '✕ Removed' : '＋ Added';

        chipsHtml += `
          <div class="biz-chip"
               style="left:${chipLeft};width:${chipWidth};top:${chipTop}px;height:${CHIP_H}px;
                      border-left:3px solid ${goal.color};background:${goal.color}0e;"
               onclick="event.stopPropagation();bizOpenCap('${goal.id}',${idx})"
               title="${cap.label.replace(/"/g, '&quot;')}">
            <div class="biz-chip-text">${cap.label}</div>
            <div class="biz-chip-meta">
              <span class="biz-chip-type ${typeClass}">${typeTxt}</span>
              <span class="biz-chip-sep">&middot;</span>
              <span class="biz-chip-prog">${prog.label}</span>
            </div>
          </div>`;
      });

      if (qCaps.length === 0) {
        chipsHtml += `
          <div class="biz-chip-empty"
               style="left:${chipLeft};width:${chipWidth};top:${CHIP_PAD}px">
            No impacts this quarter
          </div>`;
      }
    });

    const visibleCount = visibleQs.reduce(
      (n, q) => n + goal.capabilities.filter(c => c.quarter === q.key).length, 0
    );
    const hiddenCount  = totalCount - visibleCount;
    const summaryTxt   = hiddenCount > 0
      ? `${visibleCount} in view &bull; ${totalCount} total`
      : `${visibleCount} in view`;

    html += `
      <div class="biz-goal-row" style="background:${altBg};border-top:2px solid ${goal.color}20">
        <div class="biz-goal-label-panel" style="width:${BIZ_LABEL_W}px;min-height:${rowH}px;border-left:4px solid ${goal.color}">
          <div class="biz-goal-panel-icon">${goal.icon}</div>
          <div class="biz-goal-panel-name" style="color:${goal.color}">${goal.label}</div>
          <div class="biz-goal-panel-desc">${goal.description}</div>
          <div class="biz-goal-panel-summary">${summaryTxt}</div>
          ${hiddenCount > 0 ? `
          <button class="biz-expand-btn biz-expand-btn-closed"
                  onclick="bizToggleExpand('${goal.id}')">&#9660; See all ${totalCount}</button>` : ''}
        </div>
        <div class="biz-goal-track" style="min-height:${rowH}px">
          ${deco}
          ${chipsHtml}
        </div>
      </div>`;
  });

  body.innerHTML = html;
};