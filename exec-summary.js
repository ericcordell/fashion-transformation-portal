// exec-summary.js — Unified Status + Filter Bar & 3-Section Executive Modal
// Bar left side : status chips (overall + workstreams + phases) — click to drill-in
// Bar right side: card-filter pills (Critical / R–Y / Done) + phase expand toggles
// Modal sections : Scorecard | Narrative | At-Risk + Path-to-Green | All Programs
// Depends on: data.js, data-*.js, exec-narratives.js, phase-view.js
// Must init AFTER initPhaseView() so pmGetState() is available.
(function () {
  'use strict';

  // ── Status config ─────────────────────────────────────────────────────
  var PRIORITY = { roadmap: 0, completed: 1, green: 2, yellow: 3, red: 4 };
  var S = {
    red:       { dot: '#ea1100', label: 'At Risk',   cls: 'badge-red'       },
    yellow:    { dot: '#FFC220', label: 'Watch',     cls: 'badge-yellow'    },
    green:     { dot: '#2a8703', label: 'On Track',  cls: 'badge-green'     },
    completed: { dot: '#0053e2', label: 'Completed', cls: 'badge-completed' },
    backlog:   { dot: '#0053e2', label: 'Backlog',   cls: 'badge-backlog'   },
    roadmap:   { dot: '#94a3b8', label: 'Roadmap',   cls: 'badge-roadmap'   },
  };
  var HDR = {
    red:       'linear-gradient(135deg,#b71c1c,#ea1100)',
    yellow:    'linear-gradient(135deg,#b86000,#d98c00)',
    green:     'linear-gradient(135deg,#1b5e20,#2a8703)',
    completed: 'linear-gradient(135deg,#0053e2,#1a6fff)',
    roadmap:   'linear-gradient(135deg,#37474f,#546e7a)',
  };

  // ── Scope definitions ───────────────────────────────────────────────────
  var SCOPES = [
    { key: 'overall',    type: 'overall',    label: 'E2E Overview',         icon: '🗺️' },
    { key: 'strategy',   type: 'workstream', label: 'Strategy',             icon: '🧭' },
    { key: 'design',     type: 'workstream', label: 'Design',               icon: '🎨' },
    { key: 'buying',     type: 'workstream', label: 'Buying',               icon: '🛒' },
    { key: 'allocation', type: 'workstream', label: 'Allocation',           icon: '📦' },
    { key: 'phase1', type: 'phase', phaseNum: 1, label: 'Phase 1 · Setup',     icon: '🔧' },
    { key: 'phase2', type: 'phase', phaseNum: 2, label: 'Phase 2 · Recommend', icon: '🎯' },
    { key: 'phase3', type: 'phase', phaseNum: 3, label: 'Phase 3 · Automate',  icon: '🤖' },
  ];

  // ── Data helpers ────────────────────────────────────────────────────────
  // Use typeof guard — const globals are not on window in ES2015+
  function _cards() { return (typeof allCards !== 'undefined' ? allCards : []); }
  function _phaseMap() { return (typeof CARD_PHASE_MAP !== 'undefined' ? CARD_PHASE_MAP : {}); }
  function _qm() { return (typeof QUARTER_META !== 'undefined' ? QUARTER_META : {}); }

  function cardsForScope(scope) {
    var all = _cards();
    if (scope.type === 'overall')    return all;
    if (scope.type === 'workstream') return all.filter(function (c) {
      return (c.workstream || '').toLowerCase() === scope.key;
    });
    if (scope.type === 'phase') {
      var pm = _phaseMap();
      return all.filter(function (c) { return pm[c.id] === scope.phaseNum; });
    }
    return [];
  }

  function rollup(cards) {
    var counts = { red: 0, yellow: 0, green: 0, completed: 0, roadmap: 0 };
    var worst = 'roadmap';
    cards.forEach(function (c) {
      var s = c.status || 'roadmap';
      if (counts[s] !== undefined) counts[s]++;
      if ((PRIORITY[s] || 0) > (PRIORITY[worst] || 0)) worst = s;
    });
    return Object.assign({}, counts, { total: cards.length, worst: worst });
  }

  // ── Status chip (left side of bar) ───────────────────────────────────
  function chipHTML(scope, stats) {
    var m = S[stats.worst] || S.roadmap;
    var cls = 'es-chip' + (scope.type === 'overall' ? ' es-chip--overall' : '');
    return '<button class="' + cls + '"' +
      ' onclick="window._esOpenModal(\'' + scope.key + '\')"' +
      ' title="' + scope.label + ' status breakdown"' +
      ' aria-label="' + scope.label + ': ' + m.label + '">' +
      '<span class="es-dot" style="background:' + m.dot + ';"></span>' +
      '<span class="es-chip-label">' + scope.icon + ' ' + scope.label + '</span>' +
      '<span class="es-chip-badge" style="background:' + m.dot + '20;color:' + m.dot + ';border-color:' + m.dot + '40;">' + m.label + '</span>' +
      '</button>';
  }

  // ── Filter pills (right side of bar) ──────────────────────────────
  var CARD_FILTERS = [
    { key: 'all',      label: '📋 All',      color: '#0053e2' },
    { key: 'critical', label: '⭐ Critical', color: '#ffc220' },
    { key: 'ry',       label: '🚨 R/Y',     color: '#ea1100' },
    { key: 'done',     label: '✅ Done',     color: '#2a8703' },
  ];

  function filterSectionHTML() {
    var state     = (typeof pmGetState === 'function') ? pmGetState() : null;
    var cf        = state ? state.cardFilters    : new Set();
    var ep        = state ? state.expandedPhases : new Set([1]);
    var phaseDefs = (typeof PHASE_DEFS !== 'undefined') ? PHASE_DEFS : [];
    
    // Determine active filter (mutually exclusive)
    var activeFilter = 'all';
    if (cf.has('critical')) activeFilter = 'critical';
    else if (cf.has('ry')) activeFilter = 'ry';
    else if (cf.has('completed')) activeFilter = 'done';

    var cardPills = CARD_FILTERS.map(function (f) {
      var isActive = activeFilter === f.key;
      var style = isActive ? ' style="background:' + f.color + ';color:white;border-color:' + f.color + ';"' : '';
      return '<button class="es-filter-pill' + (isActive ? ' es-filter-active' : '') + '"' +
        style +
        ' onclick="selectFilter(\'' + f.key + '\')">' + f.label + '</button>';
    }).join('');

    var phasePills = phaseDefs.filter(function (ph) { return ph.num !== 1; }).map(function (ph) {
      var on = ep.has(ph.num);
      return '<button class="es-phase-pill' + (on ? ' es-phase-on' : '') + '"' +
        ' style="--phc:' + ph.color + ';"' +
        ' onclick="pmTogglePhase(' + ph.num + ')"' +
        ' title="' + (on ? 'Collapse' : 'Expand') + ' ' + ph.label + '">' +
        ph.emoji + ' Ph' + ph.num + ' ' + (on ? '&#9650;' : '&#9660;') +
        '</button>';
    }).join('');

    return '<div class="es-filter-group">' +
      '<span class="es-group-label">Filters:</span>' +
      cardPills +
      '<div class="es-sep">|</div>' +
      '<span class="es-group-label">Phases:</span>' +
      phasePills +
      '</div>';
  }

  // ── Bar render ────────────────────────────────────────────────────────────
  function renderBar() {
    var el = document.getElementById('exec-bar');
    if (!el) return;
    var ws = SCOPES.filter(function (s) { return s.type === 'workstream'; });
    var ph = SCOPES.filter(function (s) { return s.type === 'phase'; });
    var ov = SCOPES[0];
    el.innerHTML =
      '<div class="es-bar">' +
        '<span class="es-bar-label">Status</span>' +
        '<div class="es-divider"></div>' +
        chipHTML(ov, rollup(cardsForScope(ov))) +
        '<div class="es-sep">|</div>' +
        '<span class="es-group-label">Workstream</span>' +
        ws.map(function (s) { return chipHTML(s, rollup(cardsForScope(s))); }).join('') +
        '<div class="es-sep">|</div>' +
        '<span class="es-group-label">Phase</span>' +
        ph.map(function (s) { return chipHTML(s, rollup(cardsForScope(s))); }).join('') +
        '<div class="es-spacer"></div>' +
        filterSectionHTML() +
      '</div>';
  }

  // ── Modal section 1: Status Scorecard ───────────────────────────────
  function scorecardHTML(stats) {
    var ORDER  = ['red','yellow','green','completed','roadmap'];
    var active = ORDER.filter(function (s) { return stats[s] > 0; });

    var bar = active.map(function (s) {
      return '<div style="flex:' + stats[s] + ';background:' + S[s].dot + ';height:100%;min-width:4px;" title="' + stats[s] + ' ' + S[s].label + '"></div>';
    }).join('');

    var pills = active.map(function (s) {
      return '<div style="display:flex;align-items:center;gap:5px;">' +
        '<span style="width:9px;height:9px;border-radius:50%;background:' + S[s].dot + ';flex-shrink:0;display:inline-block;"></span>' +
        '<span style="font-size:0.78rem;font-weight:800;color:#1e293b;">' + stats[s] + '</span>' +
        '<span style="font-size:0.72rem;color:#64748b;">' + S[s].label + '</span>' +
        '</div>';
    }).join('');

    return '<div class="es-section">' +
      '<p class="es-section-label">📊 Program Snapshot — ' + stats.total + ' total deliverable' + (stats.total !== 1 ? 's' : '') + '</p>' +
      '<div style="display:flex;height:8px;border-radius:99px;overflow:hidden;gap:2px;margin-bottom:12px;">' + bar + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:14px;">' + pills + '</div>' +
      '</div>';
  }

  // ── Modal section 2: Narrative ──────────────────────────────────────
  function narrativeHTML(scopeKey) {
    var paras = (typeof EXEC_NARRATIVES !== 'undefined' && EXEC_NARRATIVES[scopeKey]) ? EXEC_NARRATIVES[scopeKey] : [];
    if (!paras.length) return '';
    var body = paras.map(function (p) {
      return '<p style="margin:0 0 10px;font-size:0.83rem;line-height:1.65;color:#374151;">' + p + '</p>';
    }).join('');
    return '<div class="es-section es-section--alt">' +
      '<p class="es-section-label">📝 What We’re Working On</p>' +
      body + '</div>';
  }

  // ── Modal section 3: At-Risk Programs ──────────────────────────────
  function atRiskHTML(cards) {
    var atRisk = cards.filter(function (c) { return c.status === 'red' || c.status === 'yellow'; });
    if (!atRisk.length) {
      return '<div class="es-section">' +
        '<p class="es-section-label">🟢 At-Risk Programs</p>' +
        '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;background:#f0fdf4;border:1px solid #86efac;">' +
        '<span style="font-size:1rem;">✅</span>' +
        '<span style="font-size:0.82rem;color:#166534;font-weight:600;">No at-risk programs in this scope.</span>' +
        '</div></div>';
    }

    var sorted = atRisk.slice().sort(function (a, b) {
      return (PRIORITY[b.status] || 0) - (PRIORITY[a.status] || 0);
    });

    var rows = sorted.map(function (c) {
      var m   = S[c.status];
      var ptg = c.pathToGreen || c.statusNote || null;
      return '<div style="border:1.5px solid ' + m.dot + '30;border-radius:12px;overflow:hidden;margin-bottom:10px;">' +
        '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:' + m.dot + '0d;border-bottom:1px solid ' + m.dot + '20;">' +
          '<span style="font-size:1rem;flex-shrink:0;">' + (c.icon || '📋') + '</span>' +
          '<span style="font-size:0.85rem;font-weight:700;color:#1e293b;flex:1;">' + c.title + '</span>' +
          '<span class="badge ' + m.cls + '" style="flex-shrink:0;">' + c.statusLabel + '</span>' +
        '</div>' +
        '<div style="padding:10px 14px;">' +
          (ptg
            ? '<p style="margin:0 0 4px;font-size:0.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:' + m.dot + ';">Path to Green</p>' +
              '<p style="margin:0;font-size:0.8rem;line-height:1.55;color:#374151;">' + ptg + '</p>'
            : '<p style="margin:0;font-size:0.78rem;color:#94a3b8;font-style:italic;">Path to green not yet documented.</p>'
          ) +
          '<button onclick="window._esClose();openModal(\'' + c.id + '\',\'' + c.workstream + '\',\'' + c.tool + '\');"' +
            ' style="margin-top:8px;font-size:0.72rem;font-weight:700;color:#0053e2;background:none;border:none;cursor:pointer;padding:0;text-decoration:underline;">' +
            '→ View full program details</button>' +
        '</div></div>';
    }).join('');

    return '<div class="es-section"><p class="es-section-label">🟡 At-Risk Programs — Path to Green</p>' + rows + '</div>';
  }

  // ── Modal section 4: All Programs (collapsible) ────────────────────
  function programListHTML(cards) {
    var ORDER  = ['red','yellow','green','completed','roadmap'];
    var groups = ORDER.map(function (s) {
      return { status: s, items: cards.filter(function (c) { return c.status === s; }) };
    }).filter(function (g) { return g.items.length > 0; });

    var groupsHTML = groups.map(function (g) {
      var m = S[g.status];
      var rows = g.items.map(function (c) {
        var qm   = _qm()[c.quarter] || {};
        var qChip = qm.label
          ? '<span style="font-size:0.58rem;font-weight:700;padding:1px 5px;border-radius:99px;background:' + (qm.bg||'#f1f5f9') + ';color:' + (qm.color||'#64748b') + ';border:1px solid ' + (qm.border||'#e2e8f0') + ';white-space:nowrap;flex-shrink:0;">' + qm.label + '</span>'
          : '';
        return '<div class="es-card-row" onclick="window._esClose();openModal(\'' + c.id + '\',\'' + c.workstream + '\',\'' + c.tool + '\');">' +
          '<span style="font-size:0.95rem;flex-shrink:0;">' + (c.icon || '📋') + '</span>' +
          '<span class="es-card-title">' + c.title + '</span>' +
          '<span style="font-size:0.62rem;color:#94a3b8;white-space:nowrap;">' + c.workstream + '</span>' +
          qChip + '</div>';
      }).join('');

      return '<div style="margin-bottom:6px;">' +
        '<div class="es-group-header" style="color:' + m.dot + ';border-left:3px solid ' + m.dot + ';">' +
          '<span class="es-dot" style="background:' + m.dot + ';"></span>' + m.label +
          '<span style="margin-left:auto;font-size:0.62rem;font-weight:600;opacity:.7;">' + g.items.length + ' item' + (g.items.length !== 1 ? 's' : '') + '</span>' +
        '</div>' + rows + '</div>';
    }).join('');

    return '<div class="es-section" style="padding-bottom:4px;">' +
      '<details><summary class="es-section-label" style="cursor:pointer;user-select:none;list-style:none;display:flex;align-items:center;gap:6px;">' +
        '<span>📋 All Programs</span>' +
        '<span style="font-size:0.65rem;font-weight:600;color:#94a3b8;font-style:italic;margin-left:auto;">(click to expand)</span>' +
      '</summary>' +
      '<div style="margin-top:10px;">' + groupsHTML + '</div></details></div>';
  }

  // ── Modal shell (built once) ──────────────────────────────────────────
  function buildModal() {
    if (document.getElementById('es-overlay')) return;
    var div = document.createElement('div');
    div.innerHTML =
      '<div id="es-overlay" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="es-title">' +
        '<div id="es-box">' +
          '<div id="es-header">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
              '<div>' +
                '<p style="margin:0 0 3px;font-size:0.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,0.5);">Executive Status Snapshot</p>' +
                '<h2 id="es-title" style="color:white;font-weight:800;font-size:1.1rem;margin:0;"></h2>' +
              '</div>' +
              '<button onclick="window._esClose()" style="color:white;opacity:.6;font-size:1.9rem;line-height:1;cursor:pointer;background:none;border:none;padding:0;margin-left:16px;" aria-label="Close">&times;</button>' +
            '</div>' +
          '</div>' +
          '<div id="es-body"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(div.firstElementChild);
    document.getElementById('es-overlay').addEventListener('click', function (e) {
      if (e.target === document.getElementById('es-overlay')) window._esClose();
    });
  }

  // ── Open modal ─────────────────────────────────────────────────────────────
  function openModal(scopeKey) {
    var scope = SCOPES.filter(function (s) { return s.key === scopeKey; })[0];
    if (!scope) return;
    var cards = cardsForScope(scope);
    var stats = rollup(cards);

    document.getElementById('es-header').style.background = HDR[stats.worst] || HDR.roadmap;
    document.getElementById('es-title').textContent = scope.icon + ' ' + scope.label;
    document.getElementById('es-body').innerHTML =
      scorecardHTML(stats) + narrativeHTML(scope.key) + atRiskHTML(cards) + programListHTML(cards);

    document.getElementById('es-overlay').classList.add('open');
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  window._esOpenModal  = openModal;
  window._esClose      = function () {
    var el = document.getElementById('es-overlay');
    if (el) el.classList.remove('open');
  };
  // Exposed so phase-view.js can re-render bar after filter state changes
  window._esRenderBar  = renderBar;
  window.initExecBar   = function () { buildModal(); renderBar(); };
}());
