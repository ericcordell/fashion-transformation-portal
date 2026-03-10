// phase-view.js — LLTT Phase Timeline Selector + Phase Grid
// Depends on: data.js, data-phases.js, data-allocation.js (PILLARS)
// index.html must expose: openModal(cardId, workstream, tool)

(function () {

  let _activePhase = 1;  // default Phase 1

  // Status priority for sorting (lower = higher priority)
  const STATUS_PRIO = { completed:0, red:1, yellow:2, green:3, roadmap:4 };

  // ── PUBLIC INIT ───────────────────────────────────────────
  window.initPhaseView = function () {
    _renderTimeline();
    _renderGrid();
  };

  window.setActivePhase = function (num) {
    _activePhase = num;
    _renderTimeline();
    _renderGrid();
    const grid = document.getElementById('phase-grid-wrap');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── PHASE TIMELINE BAR ────────────────────────────────────
  function _renderTimeline() {
    const bar = document.getElementById('phase-timeline');
    if (!bar) return;

    // Three phase tiles
    const tiles = PHASE_DEFS.map(function (ph) {
      const isActive = ph.num === _activePhase;
      return [
        '<button class="phase-tile' + (isActive ? ' active' : '') + '"',
        ' style="--ph-color:' + ph.color + ';--ph-border:' + ph.border + ';"',
        ' onclick="setActivePhase(' + ph.num + ')"',
        ' aria-pressed="' + isActive + '"',
        ' title="Click to explore Phase ' + ph.num + '"',
        '>',
        '<div class="phase-tile-num">Phase ' + ph.num + '</div>',
        '<div class="phase-tile-name">' + ph.emoji + ' ' + ph.label + '</div>',
        '<div class="phase-tile-window">' + ph.window + '</div>',
        '<div class="phase-tile-tagline">' + ph.tagline + '</div>',
        '</button>',
      ].join('');
    });

    // Connector arrows between tiles
    const joined = [];
    tiles.forEach(function (t, i) {
      joined.push(t);
      if (i < tiles.length - 1) {
        joined.push('<div class="phase-arrow" aria-hidden="true">\u25B6</div>');
      }
    });

    // Detail panel — shown below the tile row
    const ph = PHASE_DEFS[_activePhase - 1];
    const deliverableCols = _splitArray(ph.deliverables, Math.ceil(ph.deliverables.length / 2));
    const deliverableHTML = deliverableCols.map(function (col) {
      return '<ul class="phase-deliverable-list">' +
        col.map(function (d) { return '<li>' + d + '</li>'; }).join('') +
        '</ul>';
    }).join('');

    const goalsHTML = ph.goals.map(function (g) {
      return '<div class="phase-goal-chip" style="border-color:' + ph.border + ';color:' + ph.color + ';background:' + ph.bg + ';">' +
        '<span class="phase-goal-id">' + g.id + '</span>' +
        '<span class="phase-goal-label">' + g.label + '</span>' +
        '</div>';
    }).join('');

    bar.innerHTML = [
      '<div class="phase-tile-row">' + joined.join('') + '</div>',
      '<div class="phase-detail-panel" style="border-color:' + ph.border + ';background:' + ph.bg + ';" id="phase-detail-panel">',
        '<div class="phase-detail-header">',
          '<div>',
            '<span class="phase-detail-badge" style="background:' + ph.darkBg + ';">',
              ph.emoji + ' Phase ' + ph.num + ': ' + ph.label,
            '</span>',
            '<span class="phase-detail-window">&#128197; ' + ph.start + ' \u2013 ' + ph.end + '</span>',
          '</div>',
          '<p class="phase-detail-desc">' + ph.description + '</p>',
        '</div>',
        '<div class="phase-detail-body">',
          '<div class="phase-detail-col">',
            '<p class="phase-detail-col-header">&#128203; Key Deliverables</p>',
            '<div style="display:flex;gap:16px;flex-wrap:wrap;">' + deliverableHTML + '</div>',
          '</div>',
          '<div class="phase-detail-col phase-detail-goals-col">',
            '<p class="phase-detail-col-header">&#127919; Goal Alignment</p>',
            '<div class="phase-goals-wrap">' + goalsHTML + '</div>',
          '</div>',
        '</div>',
      '</div>',
    ].join('');
  }

  // ── PHASE GRID ────────────────────────────────────────────
  // Layout: phases = rows (all 3 visible, Phase 1 expanded)
  //         workstreams = columns (Strategy, Design, Buying, Allocation)
  function _renderGrid() {
    const wrap = document.getElementById('phase-grid-wrap');
    if (!wrap) return;

    const rowsHTML = PHASE_DEFS.map(function (ph) {
      const isActive = ph.num === _activePhase;
      const colsHTML = PILLARS.map(function (pillar) {
        return _renderPhaseColumn(ph, pillar, isActive);
      }).join('');

      return [
        '<div class="phase-row' + (isActive ? ' phase-row-active' : '') + '" id="phase-row-' + ph.num + '">',
          '<div class="phase-row-header" style="background:' + ph.darkBg + ';" onclick="setActivePhase(' + ph.num + ')" title="Click to focus Phase ' + ph.num + '">',
            '<div class="phase-row-header-left">',
              '<span class="phase-row-num">PHASE ' + ph.num + '</span>',
              '<span class="phase-row-name">' + ph.emoji + ' ' + ph.label + '</span>',
              '<span class="phase-row-window">&#128197; ' + ph.window + '</span>',
            '</div>',
            '<div class="phase-row-header-right">',
              isActive ? '<span class="phase-row-pill-active">&#9654; Currently Viewing</span>' : '<span class="phase-row-pill">Click to explore</span>',
            '</div>',
          '</div>',
          '<div class="phase-row-grid' + (isActive ? ' open' : '') + '">',
            colsHTML,
          '</div>',
        '</div>',
      ].join('');
    }).join('');

    wrap.innerHTML = rowsHTML;
  }

  function _renderPhaseColumn(ph, pillar, isActive) {
    const phaseCards = pillar.cards.filter(function (c) {
      return (CARD_PHASE_MAP[c.id] || 1) === ph.num;
    });

    // Sort: critical first, then by status priority
    const sorted = phaseCards.slice().sort(function (a, b) {
      const aCrit = (a.tag || '').indexOf('Critical') > -1 ? 0 : 1;
      const bCrit = (b.tag || '').indexOf('Critical') > -1 ? 0 : 1;
      if (aCrit !== bCrit) return aCrit - bCrit;
      return (STATUS_PRIO[a.status] || 4) - (STATUS_PRIO[b.status] || 4);
    });

    // Show top 5; always include Critical cards even if beyond limit
    const critical = sorted.filter(function (c) { return (c.tag || '').indexOf('Critical') > -1; });
    const rest     = sorted.filter(function (c) { return (c.tag || '').indexOf('Critical') === -1; });
    const shown    = _dedupe(critical.concat(rest)).slice(0, 5);
    const overflow = phaseCards.length - shown.length;

    const cardsHTML = shown.length
      ? shown.map(function (c) { return _phaseCardHTML(c, pillar); }).join('')
      : '<div class="phase-col-empty">No programs in this phase</div>';

    const overflowBtn = overflow > 0
      ? '<button class="roadmap-btn" onclick="openRoadmapWindow(\'' + pillar.id + '\')" style="margin-top:6px;">&#128203; +' + overflow + ' more &mdash; Full Roadmap</button>'
      : '<button class="roadmap-btn" onclick="openRoadmapWindow(\'' + pillar.id + '\')" style="margin-top:6px;">&#128203; Full Roadmap</button>';

    return [
      '<div class="phase-col">',
        '<div class="phase-col-header ' + pillar.headerClass + '" onclick="openSummaryModal(\'' + pillar.id + '\')" title="Click for status summary">',
          '<span class="phase-col-title">' + pillar.title + '</span>',
          '<span class="phase-col-tool">' + pillar.tool + '</span>',
        '</div>',
        '<div class="phase-col-body">',
          cardsHTML,
          overflowBtn,
        '</div>',
      '</div>',
    ].join('');
  }

  function _phaseCardHTML(card, pillar) {
    const badgeCls  = BADGE_CLASS[card.status] || 'badge-roadmap';
    const isCrit    = (card.tag || '').indexOf('Critical') > -1;
    const isWin     = (card.tag || '').indexOf('Win') > -1;
    const tagHTML   = card.tag
      ? '<span class="tag' + (isWin ? ' tag-win' : '') + '">' + card.tag + '</span>'
      : '';
    const critBorder = isCrit ? 'border-left:3px solid #ffc220;' : '';
    const safeWS     = _safeStr(pillar.title);
    const safeTool   = _safeStr(pillar.tool);

    return [
      '<div class="card p-3" style="' + critBorder + '" onclick="openModal(\'' + card.id + '\',\'' + safeWS + '\',\'' + safeTool + '\')" role="button" tabindex="0">',
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:6px;">',
          '<div style="display:flex;align-items:flex-start;gap:6px;min-width:0;">',
            '<span style="font-size:1.1rem;flex-shrink:0;">' + card.icon + '</span>',
            '<span style="font-weight:600;font-size:0.82rem;line-height:1.35;color:#1e293b;">' + card.title + '</span>',
          '</div>',
          tagHTML,
        '</div>',
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">',
          '<span class="badge ' + badgeCls + '">' + card.statusLabel + '</span>',
          card.targetDate ? '<span style="font-size:0.67rem;color:#94a3b8;">&#128197; ' + card.targetDate + '</span>' : '',
        '</div>',
      '</div>',
    ].join('');
  }

  // ── HELPERS ───────────────────────────────────────────────
  function _splitArray(arr, chunkSize) {
    var out = [];
    for (var i = 0; i < arr.length; i += chunkSize) out.push(arr.slice(i, i + chunkSize));
    return out;
  }

  function _dedupe(arr) {
    var seen = {};
    return arr.filter(function (c) {
      if (seen[c.id]) return false;
      seen[c.id] = true;
      return true;
    });
  }

  // Strips single quotes from strings used in inline onclick attrs
  function _safeStr(s) { return (s || '').replace(/'/g, '\u0027'); }

}());