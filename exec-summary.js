// exec-summary.js — Executive Status Bar & 3-Section Drill-Down Modal
// Sections: 1) Status Scorecard  2) Narrative  3) At-Risk Programs  4) All Programs
// Depends on: data.js, data-*.js, exec-narratives.js
// Initialise AFTER buildCardIndex() has run (allCards must be populated).
(function () {
  'use strict';

  // ── Status config ───────────────────────────────────────────────────────────
  const PRIORITY  = { roadmap: 0, completed: 1, green: 2, yellow: 3, red: 4 };
  const S = {
    red:       { dot: '#ea1100', label: 'At Risk',   cls: 'badge-red'       },
    yellow:    { dot: '#FFC220', label: 'Watch',     cls: 'badge-yellow'    },
    green:     { dot: '#2a8703', label: 'On Track',  cls: 'badge-green'     },
    completed: { dot: '#0053e2', label: 'Completed', cls: 'badge-completed' },
    roadmap:   { dot: '#94a3b8', label: 'Roadmap',   cls: 'badge-roadmap'   },
  };
  const HDR_GRAD = {
    red:       'linear-gradient(135deg,#b71c1c,#ea1100)',
    yellow:    'linear-gradient(135deg,#b86000,#d98c00)',
    green:     'linear-gradient(135deg,#1b5e20,#2a8703)',
    completed: 'linear-gradient(135deg,#0053e2,#1a6fff)',
    roadmap:   'linear-gradient(135deg,#37474f,#546e7a)',
  };

  // ── Scope definitions ─────────────────────────────────────────────────────────
  const SCOPES = [
    { key: 'overall',    type: 'overall',    label: 'E2E Overview',         icon: '🗺️' },
    { key: 'strategy',   type: 'workstream', label: 'Strategy',             icon: '🧭' },
    { key: 'design',     type: 'workstream', label: 'Design',               icon: '🎨' },
    { key: 'buying',     type: 'workstream', label: 'Buying',               icon: '🛒' },
    { key: 'allocation', type: 'workstream', label: 'Allocation',           icon: '📦' },
    { key: 'phase1', type: 'phase', phaseNum: 1, label: 'Phase 1 · Setup',     icon: '🔧' },
    { key: 'phase2', type: 'phase', phaseNum: 2, label: 'Phase 2 · Recommend', icon: '🎯' },
    { key: 'phase3', type: 'phase', phaseNum: 3, label: 'Phase 3 · Automate',  icon: '🤖' },
  ];

  // ── Data helpers ──────────────────────────────────────────────────────────
  function cardsForScope(scope) {
    /* allCards is a const declared in index.html — accessible as a global
       but NOT via window.allCards (const != window property). */
    // eslint-disable-next-line no-undef
    const all = (typeof allCards !== 'undefined' ? allCards : []);
    if (scope.type === 'overall')    return all;
    if (scope.type === 'workstream') return all.filter(c => (c.workstream || '').toLowerCase() === scope.key);
    // eslint-disable-next-line no-undef
    const phaseMap = (typeof CARD_PHASE_MAP !== 'undefined' ? CARD_PHASE_MAP : {});
    if (scope.type === 'phase')      return all.filter(c => phaseMap[c.id] === scope.phaseNum);
    return [];
  }

  function rollup(cards) {
    const counts = { red: 0, yellow: 0, green: 0, completed: 0, roadmap: 0 };
    let worst = 'roadmap';
    cards.forEach(c => {
      const s = c.status || 'roadmap';
      if (counts[s] !== undefined) counts[s]++;
      if ((PRIORITY[s] || 0) > (PRIORITY[worst] || 0)) worst = s;
    });
    return { ...counts, total: cards.length, worst };
  }

  // ── Chip bar ─────────────────────────────────────────────────────────────────
  function chipHTML(scope, stats) {
    const m = S[stats.worst] || S.roadmap;
    const isOverall = scope.type === 'overall';
    return `<button class="es-chip${isOverall ? ' es-chip--overall' : ''}"
      onclick="window._esOpenModal('${scope.key}')"
      title="Click for ${scope.label} status breakdown"
      aria-label="${scope.label}: ${m.label}">
      <span class="es-dot" style="background:${m.dot};"></span>
      <span class="es-chip-label">${scope.icon} ${scope.label}</span>
      <span class="es-chip-badge" style="background:${m.dot}20;color:${m.dot};border-color:${m.dot}40;">${m.label}</span>
    </button>`;
  }

  function renderBar() {
    const el = document.getElementById('exec-bar');
    if (!el) return;
    const ws = SCOPES.filter(s => s.type === 'workstream');
    const ph = SCOPES.filter(s => s.type === 'phase');
    const ov = SCOPES[0];
    el.innerHTML = `<div class="es-bar">
      <span class="es-bar-label">Executive Status</span>
      <div class="es-divider"></div>
      ${chipHTML(ov, rollup(cardsForScope(ov)))}
      <div class="es-sep">|</div>
      <span class="es-group-label">By Workstream</span>
      ${ws.map(s => chipHTML(s, rollup(cardsForScope(s)))).join('')}
      <div class="es-sep">|</div>
      <span class="es-group-label">By Phase</span>
      ${ph.map(s => chipHTML(s, rollup(cardsForScope(s)))).join('')}
    </div>`;
  }

  // ── Section 1: Status Scorecard ─────────────────────────────────────────────
  function scorecardHTML(stats) {
    const ORDER = ['red','yellow','green','completed','roadmap'];
    const active = ORDER.filter(s => stats[s] > 0);
    const total  = stats.total || 1;

    // Proportional bar
    const bar = active.map(s =>
      `<div style="flex:${stats[s]};background:${S[s].dot};height:100%;min-width:4px;
        transition:flex 0.3s;" title="${stats[s]} ${S[s].label}"></div>`
    ).join('');

    // Count pills row
    const pills = active.map(s => `
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="width:9px;height:9px;border-radius:50%;background:${S[s].dot};
          flex-shrink:0;display:inline-block;"></span>
        <span style="font-size:0.78rem;font-weight:800;color:#1e293b;">${stats[s]}</span>
        <span style="font-size:0.72rem;color:#64748b;">${S[s].label}</span>
      </div>`).join('');

    return `
      <div class="es-section">
        <p class="es-section-label">📊 Program Snapshot — ${stats.total} total deliverable${stats.total !== 1 ? 's' : ''}</p>
        <div style="display:flex;height:8px;border-radius:99px;overflow:hidden;gap:2px;margin-bottom:12px;">${bar}</div>
        <div style="display:flex;flex-wrap:wrap;gap:14px;">${pills}</div>
      </div>`;
  }

  // ── Section 2: Narrative ─────────────────────────────────────────────────────────
  function narrativeHTML(scopeKey) {
    // eslint-disable-next-line no-undef
    const paras = (typeof EXEC_NARRATIVES !== 'undefined' ? EXEC_NARRATIVES[scopeKey] : null) || [];
    if (!paras.length) return '';
    const body = paras
      .map(p => `<p style="margin:0 0 10px;font-size:0.83rem;line-height:1.65;color:#374151;">${p}</p>`)
      .join('');
    return `
      <div class="es-section es-section--alt">
        <p class="es-section-label">📝 What We're Working On</p>
        ${body}
      </div>`;
  }

  // ── Section 3: At-Risk Programs (Yellow + Red only) ─────────────────
  // eslint-disable-next-line no-undef
  const _QM = () => (typeof QUARTER_META !== 'undefined' ? QUARTER_META : {});

  function atRiskHTML(cards) {
    const atRisk = cards.filter(c => c.status === 'red' || c.status === 'yellow');
    if (!atRisk.length) {
      return `
        <div class="es-section">
          <p class="es-section-label">🟢 At-Risk Programs</p>
          <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;
            background:#f0fdf4;border:1px solid #86efac;">
            <span style="font-size:1rem;">✅</span>
            <span style="font-size:0.82rem;color:#166534;font-weight:600;">No at-risk programs in this scope. All active items are Green or completed.</span>
          </div>
        </div>`;
    }

    // Sort: red first, then yellow
    const sorted = [...atRisk].sort((a, b) => (PRIORITY[b.status] || 0) - (PRIORITY[a.status] || 0));

    const cards_html = sorted.map(c => {
      const m = S[c.status];
      const ptg = c.pathToGreen || c.statusNote || null;
      const qMeta = _QM()[c.quarter] || {};
        return `
          <div style="border:1.5px solid ${m.dot}30;border-radius:12px;overflow:hidden;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;
            background:${m.dot}0d;border-bottom:1px solid ${m.dot}20;">
            <span style="font-size:1rem;flex-shrink:0;">${c.icon || '📋'}</span>
            <span style="font-size:0.85rem;font-weight:700;color:#1e293b;flex:1;">${c.title}</span>
            <span class="badge ${m.cls}" style="flex-shrink:0;">${c.statusLabel}</span>
          </div>
          <div style="padding:10px 14px;">
            ${ptg ? `
              <p style="margin:0 0 4px;font-size:0.62rem;font-weight:800;text-transform:uppercase;
                letter-spacing:.07em;color:${m.dot};">Path to Green</p>
              <p style="margin:0;font-size:0.8rem;line-height:1.55;color:#374151;">${ptg}</p>` :
              `<p style="margin:0;font-size:0.78rem;color:#94a3b8;font-style:italic;">Path to green not yet documented. Contact the owner for details.</p>`}
            <button onclick="window._esClose();openModal('${c.id}','${c.workstream}','${c.tool}');"
              style="margin-top:8px;font-size:0.72rem;font-weight:700;color:#0053e2;background:none;
              border:none;cursor:pointer;padding:0;text-decoration:underline;">
              → View full program details
            </button>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="es-section">
        <p class="es-section-label">🟡 At-Risk Programs — Path to Green</p>
        ${cards_html}
      </div>`;
  }

  // ── Section 4: Full Program List ───────────────────────────────────────────
  function programListHTML(cards) {
    const ORDER = ['red','yellow','green','completed','roadmap'];
    const groups = ORDER
      .map(s => ({ status: s, items: cards.filter(c => c.status === s) }))
      .filter(g => g.items.length);

    const groupsHTML = groups.map(g => {
      const m = S[g.status];
      const rows = g.items.map(c => {
        const qMeta = _QM()[c.quarter] || {};
        const qChip = qMeta.label
          ? `<span style="font-size:0.58rem;font-weight:700;padding:1px 5px;border-radius:99px;
              background:${qMeta.bg||'#f1f5f9'};color:${qMeta.color||'#64748b'};
              border:1px solid ${qMeta.border||'#e2e8f0'};white-space:nowrap;flex-shrink:0;">${qMeta.label}</span>`
          : '';
        return `<div class="es-card-row"
          onclick="window._esClose();openModal('${c.id}','${c.workstream}','${c.tool}');">
          <span style="font-size:0.95rem;flex-shrink:0;">${c.icon || '📋'}</span>
          <span class="es-card-title">${c.title}</span>
          <span style="font-size:0.62rem;color:#94a3b8;white-space:nowrap;">${c.workstream}</span>
          ${qChip}
        </div>`;
      }).join('');

      return `<div style="margin-bottom:6px;">
        <div class="es-group-header" style="color:${m.dot};border-left:3px solid ${m.dot};">
          <span class="es-dot" style="background:${m.dot};"></span>${m.label}
          <span style="margin-left:auto;font-size:0.62rem;font-weight:600;opacity:.7;">
            ${g.items.length} item${g.items.length !== 1 ? 's' : ''}
          </span>
        </div>
        ${rows}
      </div>`;
    }).join('');

    return `
      <div class="es-section" style="padding-bottom:4px;">
        <details>
          <summary class="es-section-label" style="cursor:pointer;user-select:none;
            list-style:none;display:flex;align-items:center;gap:6px;">
            <span>📋 All Programs</span>
            <span style="font-size:0.65rem;font-weight:600;color:#94a3b8;font-style:italic;
              margin-left:auto;">(click to expand)</span>
          </summary>
          <div style="margin-top:10px;">${groupsHTML}</div>
        </details>
      </div>`;
  }

  // ── Modal shell ─────────────────────────────────────────────────────────────────
  function buildModal() {
    if (document.getElementById('es-overlay')) return;
    const div = document.createElement('div');
    div.innerHTML = `
      <div id="es-overlay" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="es-title">
        <div id="es-box">
          <div id="es-header">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <p style="margin:0 0 3px;font-size:0.62rem;font-weight:800;text-transform:uppercase;
                  letter-spacing:.08em;color:rgba(255,255,255,0.5);">Executive Status Snapshot</p>
                <h2 id="es-title" style="color:white;font-weight:800;font-size:1.1rem;margin:0;"></h2>
              </div>
              <button onclick="window._esClose()"
                style="color:white;opacity:.6;font-size:1.9rem;line-height:1;cursor:pointer;
                  background:none;border:none;padding:0;margin-left:16px;" aria-label="Close">&times;</button>
            </div>
          </div>
          <div id="es-body"></div>
        </div>
      </div>`;
    document.body.appendChild(div.firstElementChild);
    document.getElementById('es-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('es-overlay')) window._esClose();
    });
  }

  // ── Open modal ─────────────────────────────────────────────────────────────────
  function openModal(scopeKey) {
    const scope = SCOPES.find(s => s.key === scopeKey);
    if (!scope) return;
    const cards = cardsForScope(scope);
    const stats = rollup(cards);

    document.getElementById('es-header').style.background = HDR_GRAD[stats.worst] || HDR_GRAD.roadmap;
    document.getElementById('es-title').textContent = `${scope.icon} ${scope.label}`;

    document.getElementById('es-body').innerHTML =
      scorecardHTML(stats) +
      narrativeHTML(scope.key) +
      atRiskHTML(cards) +
      programListHTML(cards);

    document.getElementById('es-overlay').classList.add('open');
  }

  // ── Public API ─────────────────────────────────────────────────────────────────
  window._esOpenModal = openModal;
  window._esClose = function () {
    const el = document.getElementById('es-overlay');
    if (el) el.classList.remove('open');
  };
  window.initExecBar = function () { buildModal(); renderBar(); };
}());
