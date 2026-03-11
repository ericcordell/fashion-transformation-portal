// exec-summary.js — Executive Status Bar & Drill-Down Modal
// Renders a compact strip of clickable status chips (Overall + Workstream + Phase).
// Each chip opens a scoped RYG breakdown modal without leaving the page.
// Depends on: data.js, data-*.js (PILLARS, CARD_PHASE_MAP, BADGE_CLASS, QUARTER_META)
// Must be initialised AFTER buildCardIndex() has populated window.allCards.
(function () {
  'use strict';

  // ── Status priority (higher index = worse / more urgent) ────────────────
  const STATUS_PRIORITY = { roadmap: 0, completed: 1, green: 2, yellow: 3, red: 4 };

  const STATUS_META = {
    red:       { dot: '#ea1100', label: 'At Risk',    badgeCls: 'badge-red'       },
    yellow:    { dot: '#FFC220', label: 'Watch',      badgeCls: 'badge-yellow'    },
    green:     { dot: '#2a8703', label: 'On Track',   badgeCls: 'badge-green'     },
    completed: { dot: '#0053e2', label: 'Completed',  badgeCls: 'badge-completed' },
    roadmap:   { dot: '#94a3b8', label: 'Roadmap',    badgeCls: 'badge-roadmap'   },
  };

  // ── Scope definitions ───────────────────────────────────────────────────
  // type 'overall'    → all cards
  // type 'workstream' → filter by pillar key (lowercased title)
  // type 'phase'      → filter via CARD_PHASE_MAP phase number
  const SCOPES = [
    { key: 'overall',    type: 'overall',    label: 'E2E Overview',  icon: '🗺️'  },
    // workstreams
    { key: 'strategy',   type: 'workstream', label: 'Strategy',      icon: '🧭'  },
    { key: 'design',     type: 'workstream', label: 'Design',        icon: '🎨'  },
    { key: 'buying',     type: 'workstream', label: 'Buying',        icon: '🛒'  },
    { key: 'allocation', type: 'workstream', label: 'Allocation',    icon: '📦'  },
    // phases
    { key: 'phase1',     type: 'phase', phaseNum: 1, label: 'Phase 1 · Setup',      icon: '🔧' },
    { key: 'phase2',     type: 'phase', phaseNum: 2, label: 'Phase 2 · Recommend',  icon: '🎯' },
    { key: 'phase3',     type: 'phase', phaseNum: 3, label: 'Phase 3 · Automate',   icon: '🤖' },
  ];

  // ── Helpers ─────────────────────────────────────────────────────────────

  function cardsForScope(scope) {
    const cards = window.allCards || [];
    if (scope.type === 'overall') return cards;
    if (scope.type === 'workstream') {
      return cards.filter(c => (c.workstream || '').toLowerCase() === scope.key);
    }
    if (scope.type === 'phase') {
      return cards.filter(c => (window.CARD_PHASE_MAP || {})[c.id] === scope.phaseNum);
    }
    return [];
  }

  // Returns { red, yellow, green, completed, roadmap, worst }
  function rollup(cards) {
    const counts = { red: 0, yellow: 0, green: 0, completed: 0, roadmap: 0 };
    let worst = 'roadmap';
    cards.forEach(c => {
      const s = c.status || 'roadmap';
      if (counts[s] !== undefined) counts[s]++;
      if ((STATUS_PRIORITY[s] || 0) > (STATUS_PRIORITY[worst] || 0)) worst = s;
    });
    return { ...counts, total: cards.length, worst };
  }

  // ── Chip renderer ───────────────────────────────────────────────────────

  function chipHTML(scope, stats) {
    const meta = STATUS_META[stats.worst] || STATUS_META.roadmap;
    const isOverall = scope.type === 'overall';
    return `
      <button
        class="es-chip${isOverall ? ' es-chip--overall' : ''}"
        onclick="window._esOpenModal('${scope.key}')"
        title="Click for ${scope.label} status breakdown"
        aria-label="${scope.label} status: ${meta.label}"
      >
        <span class="es-dot" style="background:${meta.dot};"></span>
        <span class="es-chip-label">${scope.icon} ${scope.label}</span>
        <span class="es-chip-badge" style="background:${meta.dot}20;color:${meta.dot};border-color:${meta.dot}40;">${meta.label}</span>
      </button>`;
  }

  // ── Bar render ──────────────────────────────────────────────────────────

  function renderBar() {
    const el = document.getElementById('exec-bar');
    if (!el) return;

    const overallScope = SCOPES[0];
    const overallStats = rollup(cardsForScope(overallScope));
    const wsScopes    = SCOPES.filter(s => s.type === 'workstream');
    const phScopes    = SCOPES.filter(s => s.type === 'phase');

    el.innerHTML = `
      <div class="es-bar">
        <span class="es-bar-label">Executive Status</span>
        <div class="es-divider"></div>
        ${chipHTML(overallScope, overallStats)}
        <div class="es-sep">|</div>
        <span class="es-group-label">By Workstream</span>
        ${wsScopes.map(s => chipHTML(s, rollup(cardsForScope(s)))).join('')}
        <div class="es-sep">|</div>
        <span class="es-group-label">By Phase</span>
        ${phScopes.map(s => chipHTML(s, rollup(cardsForScope(s)))).join('')}
      </div>`;
  }

  // ── Drill-down modal ────────────────────────────────────────────────────

  function buildModal() {
    if (document.getElementById('es-overlay')) return;
    const div = document.createElement('div');
    div.innerHTML = `
      <div id="es-overlay" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="es-title">
        <div id="es-box">
          <div id="es-header">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <p id="es-eyebrow" style="margin:0 0 3px;font-size:0.65rem;font-weight:800;text-transform:uppercase;
                   letter-spacing:.07em;color:rgba(255,255,255,0.55);">Executive Status Snapshot</p>
                <h2 id="es-title" style="color:white;font-weight:800;font-size:1.05rem;margin:0;"></h2>
              </div>
              <button onclick="window._esClose()"
                style="color:white;opacity:0.6;font-size:1.9rem;line-height:1;cursor:pointer;
                       background:none;border:none;padding:0;margin-left:16px;"
                aria-label="Close">&times;</button>
            </div>
            <div id="es-counts" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;"></div>
          </div>
          <div id="es-body"></div>
        </div>
      </div>`;
    document.body.appendChild(div.firstElementChild);
    document.getElementById('es-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('es-overlay')) window._esClose();
    });
  }

  function openModal(scopeKey) {
    const scope = SCOPES.find(s => s.key === scopeKey);
    if (!scope) return;
    const cards = cardsForScope(scope);
    const stats = rollup(cards);

    // Header color based on worst status
    const headerColors = {
      red:       'linear-gradient(135deg,#ea1100,#c41000)',
      yellow:    'linear-gradient(135deg,#b86000,#d98c00)',
      green:     'linear-gradient(135deg,#1b5e20,#2a8703)',
      completed: 'linear-gradient(135deg,#0053e2,#1a6fff)',
      roadmap:   'linear-gradient(135deg,#37474f,#546e7a)',
    };
    document.getElementById('es-header').style.background =
      headerColors[stats.worst] || headerColors.roadmap;
    document.getElementById('es-title').textContent = `${scope.icon} ${scope.label}`;

    // Count pills
    const countPills = ['red','yellow','green','completed','roadmap']
      .filter(s => stats[s] > 0)
      .map(s => {
        const m = STATUS_META[s];
        return `<span style="font-size:0.7rem;font-weight:700;padding:3px 9px;border-radius:99px;
          background:${m.dot}18;color:${m.dot};border:1px solid ${m.dot}40;">
          ${stats[s]} ${m.label}
        </span>`;
      }).join('');
    document.getElementById('es-counts').innerHTML =
      countPills || '<span style="font-size:0.75rem;color:rgba(255,255,255,0.5);">No deliverables in scope</span>';

    // Card rows grouped by priority (worst first)
    const grouped = ['red','yellow','green','completed','roadmap']
      .map(s => ({ status: s, cards: cards.filter(c => c.status === s) }))
      .filter(g => g.cards.length > 0);

    const groupHTML = grouped.map(g => {
      const m = STATUS_META[g.status];
      const rows = g.cards.map(c => {
        const qMeta = (window.QUARTER_META || {})[c.quarter] || {};
        const qChip = qMeta.label
          ? `<span style="font-size:0.6rem;font-weight:700;padding:1px 6px;border-radius:99px;
              background:${qMeta.bg||'#f1f5f9'};color:${qMeta.color||'#475569'};
              border:1px solid ${qMeta.border||'#e2e8f0'};white-space:nowrap;">${qMeta.label}</span>`
          : '';
        return `
          <div class="es-card-row" onclick="openModal('${c.id}','${c.workstream}','${c.tool}');
              document.getElementById('es-overlay').classList.remove('open');">
            <span style="font-size:1rem;flex-shrink:0;">${c.icon || '📋'}</span>
            <span class="es-card-title">${c.title}</span>
            <span style="font-size:0.65rem;color:#94a3b8;white-space:nowrap;margin-left:auto;padding-left:8px;">${c.workstream}</span>
            ${qChip}
          </div>`;
      }).join('');

      return `
        <div class="es-group">
          <div class="es-group-header" style="color:${m.dot};border-left:3px solid ${m.dot};">
            <span class="es-dot" style="background:${m.dot};"></span>${m.label}
            <span style="margin-left:auto;font-size:0.65rem;font-weight:600;
              opacity:0.7;">${g.cards.length} item${g.cards.length !== 1 ? 's' : ''}</span>
          </div>
          ${rows}
        </div>`;
    }).join('');

    document.getElementById('es-body').innerHTML =
      groupHTML || '<p style="padding:24px;color:#94a3b8;font-size:0.85rem;text-align:center;">No deliverables found for this scope.</p>';

    document.getElementById('es-overlay').classList.add('open');
  }

  // ── Public API ──────────────────────────────────────────────────────────
  window._esOpenModal = openModal;
  window._esClose = function () {
    const el = document.getElementById('es-overlay');
    if (el) el.classList.remove('open');
  };

  window.initExecBar = function () {
    buildModal();
    renderBar();
  };
}());
