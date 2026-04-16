// roadmap-window.js — in-page roadmap popout modal
// Two independent filter axes:
//   _timeFilter  : 'all' | 'Q1'...'Q4' | 'ph1' | 'ph2' | 'ph3'
//   _statusFilter: 'all' | 'critical' | 'ry' | 'completed'
// Globals: PILLARS, QUARTER_META, QUARTER_ORDER, PILLAR_GRADIENTS,
//          BADGE_CLASS, CARD_PHASE_MAP, PHASE_DEFS, openModal

(function () {

  var _pillar       = null;
  var _timeFilter   = 'all';   // quarter or phase
  var _statusFilter = 'all';   // card attribute

  // ── TIME FILTER DEFS (quarter + phase rows) ───────────
  function _timeDefs() {
    var qDefs = [
      { q: 'all', label: 'All' },
      { q: 'Q1',  label: (QUARTER_META.Q1 && QUARTER_META.Q1.label) || 'Q1' },
      { q: 'Q2',  label: (QUARTER_META.Q2 && QUARTER_META.Q2.label) || 'Q2' },
      { q: 'Q3',  label: (QUARTER_META.Q3 && QUARTER_META.Q3.label) || 'Q3' },
      { q: 'Q4',  label: (QUARTER_META.Q4 && QUARTER_META.Q4.label) || 'Q4' },
    ];
    var phDefs = PHASE_DEFS.map(function (ph) {
      return { q: 'ph' + ph.num, label: ph.emoji + ' ' + ph.shortLabel };
    });
    return { quarters: qDefs, phases: phDefs };
  }

  var STATUS_DEFS = [
    { k: 'all',       label: '📋 All' },
    { k: 'critical',  label: '⭐ Critical' },
    { k: 'ry',        label: '🚨 R/Y' },
    { k: 'completed', label: '✅ Done' },
  ];

  // ── PUBLIC: open modal ──────────────────────────────────
  window.openRoadmapWindow = function (pillarId) {
    _pillar       = PILLARS.find(function (x) { return x.id === pillarId; });
    if (!_pillar) return;
    _timeFilter   = 'all';
    _statusFilter = 'all';

    var gradient = PILLAR_GRADIENTS[_pillar.headerClass] || PILLAR_GRADIENTS['pillar-dark'];
    document.getElementById('rm-header').style.background = gradient;
    document.getElementById('rm-title').textContent    = _pillar.title + ' \u2014 Full Roadmap';
    document.getElementById('rm-subtitle').textContent = _pillar.subtitle + ' \u00b7 ' + _pillar.tool;

    _renderFilters();
    _renderCards();
    document.getElementById('rm-overlay').classList.add('open');
  };

  // ── PUBLIC: close ───────────────────────────────────────
  window.closeRoadmapModal = function () {
    document.getElementById('rm-overlay').classList.remove('open');
  };

  // ── FILTER ROWS ─────────────────────────────────────────
  function _renderFilters() {
    var defs = _timeDefs();

    // Row 1: Status filters
    var statusRow = STATUS_DEFS.map(function (s) {
      var active = _statusFilter === s.k ? ' active' : '';
      return '<button class="rm-filter-btn' + active + '"' +
        ' onclick="_rmSetStatus(\'' + s.k + '\')">' + s.label + '</button>';
    }).join('');

    // Row 2: Quarter filters
    var quarterRow = defs.quarters.map(function (f) {
      var active = _timeFilter === f.q ? ' active' : '';
      return '<button class="rm-filter-btn' + active + '"' +
        ' onclick="_rmSetTime(\'' + f.q + '\')">' + f.label + '</button>';
    }).join('');

    // Row 3: Phase filters
    var phaseRow = defs.phases.map(function (f) {
      var active = _timeFilter === f.q ? ' active rm-filter-phase' : ' rm-filter-phase';
      return '<button class="rm-filter-btn' + active + '"' +
        ' onclick="_rmSetTime(\'' + f.q + '\')">' + f.label + '</button>';
    }).join('');

    document.getElementById('rm-filters').innerHTML = [
      '<div class="rm-filter-row">',
        '<span class="rm-filter-row-label">Filters:</span>',
        statusRow,
      '</div>',
      '<div class="rm-filter-row" style="margin-top:6px;">',
        '<span class="rm-filter-row-label">Quarter:</span>',
        quarterRow,
        '<span class="rm-filter-row-sep">|</span>',
        '<span class="rm-filter-row-label">Phase:</span>',
        phaseRow,
      '</div>',
    ].join('');
  }

  // ── CARD GRID ───────────────────────────────────────────
  function _renderCards() {
    if (!_pillar) return;
    var allCards = _pillar.cards;

    // Apply status filter
    var statusFiltered = allCards.filter(function (c) {
      if (_statusFilter === 'all')       return true;
      if (_statusFilter === 'critical')  return (c.tag || '').indexOf('Critical') > -1;
      if (_statusFilter === 'ry')        return c.status === 'red' || c.status === 'yellow';
      if (_statusFilter === 'completed') return c.status === 'completed';
      return true;
    });

    // Apply time filter — build quarter list or phase list
    var isPhaseFilter = _timeFilter.indexOf('ph') === 0;
    var qs;

    if (_timeFilter === 'all') {
      // Group by quarter (existing behaviour)
      qs = QUARTER_ORDER.filter(function (q) {
        return statusFiltered.some(function (c) { return c.quarter === q; });
      });
      document.getElementById('rm-body').innerHTML = qs.map(function (q) {
        return _qSection(q, statusFiltered.filter(function (c) { return c.quarter === q; }));
      }).join('') + _sourceFooter();

    } else if (isPhaseFilter) {
      // Group by phase — show all quarters but only cards in that phase
      var phNum = parseInt(_timeFilter.replace('ph', ''), 10);
      var phCards = statusFiltered.filter(function (c) {
        return (CARD_PHASE_MAP[c.id] || 1) === phNum;
      });
      // Sort by quarter then render in quarter groups
      qs = QUARTER_ORDER.filter(function (q) {
        return phCards.some(function (c) { return c.quarter === q; });
      });
      var phDef = PHASE_DEFS[phNum - 1];
      var phBanner = phDef
        ? '<div class="rm-phase-banner" style="border-color:' + phDef.border + ';color:' + phDef.color + ';background:' + phDef.bg + ';">' +
            phDef.emoji + ' <strong>Phase ' + phNum + ': ' + phDef.label + '</strong> \u2014 ' + phDef.window +
          '</div>'
        : '';
      document.getElementById('rm-body').innerHTML = phBanner + (qs.length
        ? qs.map(function (q) {
            return _qSection(q, phCards.filter(function (c) { return c.quarter === q; }));
          }).join('')
        : '<div class="rm-empty">No programs match this filter combination.</div>') + _sourceFooter();

    } else {
      // Single quarter filter
      var qCards = statusFiltered.filter(function (c) { return c.quarter === _timeFilter; });
      document.getElementById('rm-body').innerHTML = (qCards.length
        ? _qSection(_timeFilter, qCards)
        : '<div class="rm-empty">No programs match this filter combination.</div>') + _sourceFooter();
    }
  }

  function _sourceFooter() {
    return '<p class="rm-source">&#128196; Source: ' +
      '<a href="https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard"' +
      ' target="_blank" rel="noopener">APREC &mdash; LLTT Work Management Dashboard</a>' +
      ' &bull; <a href="https://opif.wal-mart.com" target="_blank" rel="noopener">OPIF Program Tracking</a>' +
      '</p>';
  }

  function _qSection(q, cards) {
    if (!cards.length) return '';
    var m = QUARTER_META[q] || QUARTER_META['Future'] || { label: q, color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
    return '<div class="rm-q-section" style="border-left-color:' + m.border + ';">' +
      '<div class="rm-q-label" style="color:' + m.color + ';background:' + m.bg + ';border-color:' + m.border + ';">' +
        '<span style="width:9px;height:9px;border-radius:50%;background:' + m.color + ';flex-shrink:0;display:inline-block;"></span>' +
        m.label +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;">' +
        cards.map(_cardHTML).join('') +
      '</div>' +
    '</div>';
  }

  function _ragChips(d) {
    function _ch(bg, col, brd, txt) {
      return '<span style="font-size:0.6rem;font-weight:800;padding:2px 7px;border-radius:99px;' +
        'background:' + bg + ';color:' + col + ';border:1px solid ' + brd + ';white-space:nowrap;">' + txt + '</span>';
    }
    return _ch('#dcfce7','#166534','#86efac','\uD83D\uDFE2\u202f' + d.green) +
           _ch('#fef3c7','#92400e','#fcd34d','\uD83D\uDFE1\u202f' + d.yellow) +
           _ch('#fee2e2','#991b1b','#fca5a5','\uD83D\uDD34\u202f' + d.red) +
           (d.planning ? _ch('#f1f5f9','#64748b','#cbd5e1','\u25a1\u202f' + d.planning + '\u00a0planning') : '');
  }

  function _cardHTML(c) {
    var badgeCls = BADGE_CLASS[c.status] || 'badge-roadmap';
    var tagHTML  = c.tag
      ? '<span class="tag' + (c.tag.indexOf('Win') > -1 ? ' tag-win' : '') + '">' + c.tag + '</span>'
      : '';
    var statusHTML = c.ragDist
      ? _ragChips(c.ragDist)
      : '<span class="badge ' + badgeCls + '">' + c.statusLabel + '</span>';
    return '<div class="rm-card" data-card-id="' + c.id + '">' +
      '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">' +
        '<span style="font-size:1.25rem;flex-shrink:0;">' + c.icon + '</span>' +
        '<span style="font-weight:600;font-size:0.87rem;line-height:1.3;color:#1e293b;flex:1;">' + c.title + '</span>' +
        tagHTML +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
        statusHTML +
        (c.targetDate ? '<span style="font-size:0.72rem;color:#94a3b8;">&#128197; ' + c.targetDate + '</span>' : '') +
      '</div>' +
    '</div>';
  }

  // ── FILTER SETTERS (window-exposed for inline onclick) ──
  window._rmSetTime = function (q) {
    _timeFilter = q;
    _renderFilters();
    _renderCards();
  };

  window._rmSetStatus = function (k) {
    _statusFilter = k;
    _renderFilters();
    _renderCards();
  };

  // ── EVENT DELEGATION: card click ────────────────────────
  document.getElementById('rm-body').addEventListener('click', function (e) {
    var el = e.target.closest('[data-card-id]');
    if (!el || !_pillar) return;
    openModal(el.dataset.cardId, _pillar.title, _pillar.tool);
  });

  // ── CLOSE ON BACKDROP ───────────────────────────────────
  document.getElementById('rm-overlay').addEventListener('click', function (e) {
    if (e.target === document.getElementById('rm-overlay')) closeRoadmapModal();
  });

}());