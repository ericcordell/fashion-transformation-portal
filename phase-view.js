// phase-view.js — Workstream-first Phase Matrix + Filter Bar
// Phase 1 = always expanded (full cards)  |  Phase 2 & 3 = collapsed by default
// Filter bar: card-attribute filters (Critical / Red-Yellow / Completed)
//             + phase-expand toggles (Setup / Recommend / Automate)
//
// Depends on: data-phases.js (PHASE_DEFS, CARD_PHASE_MAP)
//             data-allocation.js (PILLARS)
//             data.js (BADGE_CLASS)
//             index.html: openModal(), openSummaryModal(), openRoadmapWindow()

(function () {

  var STATUS_PRIO = { completed:0, red:1, yellow:2, green:3, roadmap:4 };

  // ── STATE ──────────────────────────────────────────────
  var _cardFilters    = new Set();  // 'critical' | 'ry' | 'completed'
  var _expandedPhases = new Set([1]); // Phase 1 always expanded

  // Split-circle SVG: left-half red, right-half yellow
  var RY_ICON = '<svg width="12" height="12" viewBox="0 0 10 10"' +
    ' style="vertical-align:-1px;margin-right:3px;flex-shrink:0;">'+
    '<path d="M5,0 A5,5 0 0,0 5,10 Z" fill="#ea1100"/>'+
    '<path d="M5,0 A5,5 0 0,1 5,10 Z" fill="#ffc220"/>'+
    '</svg>';

  var CARD_FILTER_DEFS = [
    { key:'critical',  label:'&#11088; Critical',       test: function(c){ return _isCrit(c); } },
    { key:'ry',        label: RY_ICON + 'Red / Yellow', test: function(c){ return c.status==='red'||c.status==='yellow'; } },
    { key:'completed', label:'&#9989; Completed',       test: function(c){ return c.status==='completed'; } },
  ];

  // ── PUBLIC API ─────────────────────────────────────────
  window.initPhaseView = function () { _render(); };

  window.pmToggleCardFilter = function (key) {
    if (_cardFilters.has(key)) _cardFilters.delete(key);
    else _cardFilters.add(key);
    _render();
  };

  window.pmTogglePhase = function (num) {
    if (num === 1) return; // Phase 1 is always visible
    if (_expandedPhases.has(num)) _expandedPhases.delete(num);
    else _expandedPhases.add(num);
    _render();
  };

  window.pmClearFilters = function () {
    _cardFilters.clear();
    _render();
  };

  // ── TOP-LEVEL RENDER ───────────────────────────────────
  function _render() {
    var wrap = document.getElementById('phase-grid-wrap');
    if (!wrap) return;
    wrap.innerHTML = _filterBarHTML() + _matrixHTML();
  }

  // ── FILTER BAR ─────────────────────────────────────────
  function _filterBarHTML() {
    var cardPills = CARD_FILTER_DEFS.map(function (f) {
      var active = _cardFilters.has(f.key) ? ' pmf-active' : '';
      return '<button class="pmf-pill' + active + '"' +
        ' onclick="pmToggleCardFilter(\'' + f.key + '\')">' + f.label + '</button>';
    }).join('');

    var clearBtn = _cardFilters.size
      ? '<button class="pmf-clear" onclick="pmClearFilters()">&#10005; Clear</button>'
      : '';

    var phasePills = PHASE_DEFS.map(function (ph) {
      var on = _expandedPhases.has(ph.num);
      return '<button class="pmf-phase-pill' + (on ? ' pmf-phase-on' : '') + '"' +
        ' style="--phc:' + ph.color + ';"' +
        ' onclick="pmTogglePhase(' + ph.num + ')">' +
        (on ? '&#9660;' : '&#9654;') + ' ' + ph.shortLabel +
        '</button>';
    }).join('');

    return [
      '<div class="pmf-bar">',
        '<div class="pmf-group">',
          '<span class="pmf-label">Show:</span>',
          cardPills, clearBtn,
        '</div>',
        '<div class="pmf-group">',
          '<span class="pmf-label">Phase:</span>',
          phasePills,
        '</div>',
      '</div>',
    ].join('');
  }

  // ── MATRIX ─────────────────────────────────────────────
  function _matrixHTML() {
    return [
      '<div class="phase-matrix" role="region" aria-label="Workstream Phase Matrix">',
        _headerRow(),
        PHASE_DEFS.map(_phaseRow).join(''),
      '</div>',
    ].join('');
  }

  // ── HEADER ROW (workstream column titles) ──────────────
  function _headerRow() {
    var wsHeaders = PILLARS.map(function (p) {
      return [
        '<div class="pm-ws-header ' + p.headerClass + '"',
        ' onclick="openSummaryModal(\'' + p.id + '\')"',
        ' title="Click for ' + p.title + ' status summary">',
          '<span class="pm-ws-title">' + p.title + '</span>',
          '<span class="pm-ws-tool">&#128736; ' + p.tool + '</span>',
        '</div>',
      ].join('');
    }).join('');

    return [
      '<div class="pm-header-row">',
        '<div class="pm-corner">',
          '<span class="pm-corner-label">Workstream</span>',
          '<span class="pm-corner-sub">&#8595; Phase</span>',
        '</div>',
        '<div class="pm-ws-col-group">' + wsHeaders + '</div>',
      '</div>',
    ].join('');
  }

  // ── PHASE ROW ──────────────────────────────────────────
  function _phaseRow(ph) {
    var expanded = _expandedPhases.has(ph.num);
    var cells = PILLARS.map(function (p) {
      return expanded ? _expandedCell(ph, p) : _collapsedCell(ph, p);
    }).join('');
    var rowCls = 'pm-phase-row pm-phase-' + ph.num +
      (expanded ? ' pm-phase-expanded' : ' pm-phase-collapsed');

    return [
      '<div class="' + rowCls + '">',
        _sidebar(ph, expanded),
        '<div class="pm-ws-col-group">' + cells + '</div>',
      '</div>',
    ].join('');
  }

  // ── SIDEBAR ────────────────────────────────────────────
  // Collapsed (Phase 2 & 3 default): name + window + expand button only
  // Expanded / Phase 1: full detail — tagline, goals, collapse button
  function _sidebar(ph, expanded) {
    var isActive = ph.num === 1;
    var needsToggle = ph.num !== 1;
    var toggleBtn = needsToggle
      ? '<button class="pm-expand-btn" onclick="pmTogglePhase(' + ph.num + ')">' +
          (expanded ? '&#9650; Collapse' : '&#9660; Expand Programs') +
        '</button>'
      : '';

    if (!expanded && needsToggle) {
      // ── COLLAPSED: minimal — just identity + toggle ──
      return [
        '<div class="pm-sidebar pm-sidebar-collapsed" style="background:' + ph.darkBg + ';">',
          '<div class="pm-phase-num">Phase ' + ph.num + '</div>',
          '<div class="pm-phase-name">' + ph.emoji + ' ' + ph.label + '</div>',
          '<div class="pm-phase-window">&#128197; ' + ph.window + '</div>',
          toggleBtn,
        '</div>',
      ].join('');
    }

    // ── EXPANDED (or always-on Phase 1): full detail ──
    var goalsHTML = ph.goals.map(function (g) {
      var num = g.id.replace('#', '');
      return '<div class="pm-goal-chip pm-goal-chip-btn"' +
        ' onclick="openGoalModal(\'' + num + '\')"' +
        ' role="button" tabindex="0"' +
        ' title="Click for full goal details">'+
        '<span class="pm-goal-id">' + g.id + '</span>' +
        '<span class="pm-goal-label">' + g.label + '</span>' +
        '<span class="pm-goal-arrow">&#8594;</span>' +
        '</div>';
    }).join('');

    return [
      '<div class="pm-sidebar" style="background:' + ph.darkBg + ';">',
        isActive ? '<div class="pm-active-pill">&#128994; Active Now</div>' : '',
        '<div class="pm-phase-num">Phase ' + ph.num + '</div>',
        '<div class="pm-phase-name">' + ph.emoji + ' ' + ph.label + '</div>',
        '<div class="pm-phase-window">&#128197; ' + ph.window + '</div>',
        '<div class="pm-phase-tagline">' + ph.tagline + '</div>',
        '<div class="pm-sidebar-divider"></div>',
        '<div class="pm-goals-label">Goals</div>',
        '<div class="pm-goals-wrap">' + goalsHTML + '</div>',
        toggleBtn,
      '</div>',
    ].join('');
  }

  // ── EXPANDED CELL (cards for Ph1, chips for Ph2/3) ─────
  function _expandedCell(ph, pillar) {
    var allCards = _getCards(ph.num, pillar);
    var shown    = _cardFilters.size ? allCards.filter(_passesFilter) : allCards;
    var banner   = _valueBanner(ph, pillar);
    var empty    = _cardFilters.size ? 'No matching programs' : (ph.num === 1 ? 'No Phase 1 programs' : 'Roadmap \u2014 TBD');

    if (ph.num === 1) {
      // Full program cards — critical first, max 5 shown
      var crit   = shown.filter(_isCrit);
      var rest   = shown.filter(function(c){ return !_isCrit(c); });
      var sliced = _dedupe(crit.concat(rest)).slice(0, 5);
      var overflow = shown.length - sliced.length;

      var cardsHTML = sliced.length
        ? sliced.map(function (c) { return _cardHTML(c, pillar); }).join('')
        : '<div class="pm-empty">' + empty + '</div>';

      var label = overflow > 0
        ? '&#128203; +' + overflow + ' more \u2014 Full Roadmap'
        : '&#128203; Full Roadmap';
      var btn = '<button class="roadmap-btn" style="margin-top:4px;"' +
        ' onclick="openRoadmapWindow(\'' + pillar.id + '\')">' + label + '</button>';

      return '<div class="pm-cell pm-cell-p1">' + banner + cardsHTML + btn + '</div>';
    }

    // Capability chips for Phase 2 & 3
    var chipsHTML = shown.length
      ? shown.map(function (c) { return _capChip(c, pillar); }).join('')
      : '<div class="pm-empty">' + empty + '</div>';

    return '<div class="pm-cell pm-cell-future">' + banner + chipsHTML + '</div>';
  }

  // ── COLLAPSED CELL (Phase 2 & 3 default) ───────────────
  function _collapsedCell(ph, pillar) {
    var allCards = _getCards(ph.num, pillar);
    var matched  = _cardFilters.size ? allCards.filter(_passesFilter) : allCards;
    var banner   = _valueBanner(ph, pillar);

    var countTxt = _cardFilters.size && matched.length !== allCards.length
      ? matched.length + ' of ' + allCards.length + ' programs match filter'
      : allCards.length + ' program' + (allCards.length === 1 ? '' : 's');

    var countPill = '<div class="pm-count-pill">' +
      '<span class="pm-count-num">' + (matched.length || allCards.length) + '</span>' +
      '<span class="pm-count-lbl">' + (matched.length < allCards.length ? ' match filter' : ' program' + (allCards.length === 1 ? '' : 's')) + '</span>' +
      '</div>';

    return '<div class="pm-cell pm-cell-collapsed">' + banner + countPill + '</div>';
  }

  // ── VALUE BANNER (all phases) ──────────────────────────
  function _valueBanner(ph, pillar) {
    var label = ph.wsValue ? ph.wsValue[pillar.id] : '';
    if (!label) return '';
    return '<div class="pm-value-banner"' +
      ' style="border-color:' + ph.border + ';color:' + ph.color + ';background:' + ph.bg + ';">' +
      '&#10024; ' + label + '</div>';
  }

  // ── FULL CARD (Phase 1) ────────────────────────────────
  function _cardHTML(card, pillar) {
    var badgeCls  = BADGE_CLASS[card.status] || 'badge-roadmap';
    var critStyle = _isCrit(card) ? 'border-left:3px solid #ffc220;' : '';
    var tagHTML   = card.tag
      ? '<span class="tag' + (_isWin(card) ? ' tag-win' : '') + '">' + card.tag + '</span>'
      : '';
    var safeWS = _safe(pillar.title), safeTool = _safe(pillar.tool);
    return [
      '<div class="card p-3" style="' + critStyle + '"',
      ' onclick="openModal(\'' + card.id + '\',\'' + safeWS + '\',\'' + safeTool + '\')"',
      ' role="button" tabindex="0">',
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:6px;">',
          '<div style="display:flex;align-items:flex-start;gap:6px;min-width:0;">',
            '<span style="font-size:1.05rem;flex-shrink:0;">' + card.icon + '</span>',
            '<span style="font-weight:600;font-size:0.81rem;line-height:1.35;color:#1e293b;">' + card.title + '</span>',
          '</div>',
          tagHTML,
        '</div>',
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">',
          '<span class="badge ' + badgeCls + '">' + card.statusLabel + '</span>',
          card.targetDate ? '<span style="font-size:0.66rem;color:#94a3b8;">&#128197; ' + card.targetDate + '</span>' : '',
        '</div>',
      '</div>',
    ].join('');
  }

  // ── CAPABILITY CHIP (Phase 2 & 3) ─────────────────────
  function _capChip(card, pillar) {
    var badgeCls = BADGE_CLASS[card.status] || 'badge-roadmap';
    var safeWS = _safe(pillar.title), safeTool = _safe(pillar.tool);
    var critCls = _isCrit(card) ? ' pm-cap-crit' : '';
    return [
      '<div class="pm-cap-chip' + critCls + '"',
      ' onclick="openModal(\'' + card.id + '\',\'' + safeWS + '\',\'' + safeTool + '\')"',
      ' role="button" tabindex="0">',
        '<span class="pm-cap-icon">' + card.icon + '</span>',
        '<div class="pm-cap-body">',
          '<span class="pm-cap-title">' + card.title + '</span>',
          '<span class="badge ' + badgeCls + ' pm-cap-badge">' + card.statusLabel + '</span>',
        '</div>',
      '</div>',
    ].join('');
  }

  // ── HELPERS ────────────────────────────────────────────
  function _getCards(phaseNum, pillar) {
    return pillar.cards
      .filter(function (c) { return (CARD_PHASE_MAP[c.id] || 1) === phaseNum; })
      .slice().sort(function (a, b) {
        var ac = _isCrit(a) ? 0 : 1, bc = _isCrit(b) ? 0 : 1;
        if (ac !== bc) return ac - bc;
        return (STATUS_PRIO[a.status] || 4) - (STATUS_PRIO[b.status] || 4);
      });
  }

  function _passesFilter(card) {
    if (_cardFilters.has('critical')  && _isCrit(card)) return true;
    if (_cardFilters.has('ry')        && (card.status === 'red' || card.status === 'yellow')) return true;
    if (_cardFilters.has('completed') && card.status === 'completed') return true;
    return false;
  }

  function _dedupe(arr) {
    var seen = {};
    return arr.filter(function (c) {
      if (seen[c.id]) return false; seen[c.id] = true; return true;
    });
  }

  function _isCrit(card) { return (card.tag || '').indexOf('Critical') > -1; }
  function _isWin(card)  { return (card.tag || '').indexOf('Win')      > -1; }
  function _safe(s)      { return (s || '').replace(/'/g, '\u0027'); }

}());