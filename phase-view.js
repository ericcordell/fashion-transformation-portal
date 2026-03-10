// phase-view.js — Workstream-first Phase Matrix
// Layout: left sidebar = phase rail (context)
//         right columns = workstreams (hero)
// Phase 1 → full program cards  |  Phase 2 & 3 → capability chips
// Depends on: data-phases.js (PHASE_DEFS, CARD_PHASE_MAP)
//             data-allocation.js (PILLARS)
//             data.js (BADGE_CLASS)
//             index.html exposes: openModal(), openSummaryModal(), openRoadmapWindow()

(function () {

  const STATUS_PRIO = { completed:0, red:1, yellow:2, green:3, roadmap:4 };

  // ── PUBLIC API ────────────────────────────────────────────
  window.initPhaseView = function () {
    _renderMatrix();
  };

  // ── MATRIX SHELL ─────────────────────────────────────────
  function _renderMatrix() {
    var wrap = document.getElementById('phase-grid-wrap');
    if (!wrap) return;

    var html = [
      '<div class="phase-matrix" role="region" aria-label="Workstream Phase Matrix">',
        _headerRow(),
        PHASE_DEFS.map(_phaseRow).join(''),
      '</div>',
    ].join('');

    wrap.innerHTML = html;
  }

  // ── HEADER ROW ───────────────────────────────────────────
  // Corner cell (empty) + one header per workstream
  function _headerRow() {
    var wsHeaders = PILLARS.map(function (p) {
      return [
        '<div class="pm-ws-header ' + p.headerClass + '"',
        ' onclick="openSummaryModal(\'' + p.id + '\')"',
        ' title="Click for status summary">',
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

  // ── PHASE ROW ─────────────────────────────────────────────
  function _phaseRow(ph) {
    var isP1   = ph.num === 1;
    var cells  = PILLARS.map(function (p) {
      return isP1 ? _p1Cell(ph, p) : _capCell(ph, p);
    }).join('');

    return [
      '<div class="pm-phase-row pm-phase-' + ph.num + '">',
        _sidebar(ph),
        '<div class="pm-ws-col-group">' + cells + '</div>',
      '</div>',
    ].join('');
  }

  // ── LEFT SIDEBAR ─────────────────────────────────────────
  function _sidebar(ph) {
    var isActive = ph.num === 1; // March 2026 — we are live in Phase 1

    var goalsHTML = ph.goals.map(function (g) {
      return [
        '<div class="pm-goal-chip">',
          '<span class="pm-goal-id">' + g.id + '</span>',
          '<span class="pm-goal-label">' + g.label + '</span>',
        '</div>',
      ].join('');
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
      '</div>',
    ].join('');
  }

  // ── PHASE 1 CELL — full program cards ────────────────────
  function _p1Cell(ph, pillar) {
    var cards    = _getCards(1, pillar);
    var critical = cards.filter(function (c) { return _isCrit(c); });
    var rest     = cards.filter(function (c) { return !_isCrit(c); });
    var shown    = _dedupe(critical.concat(rest)).slice(0, 5);
    var overflow = cards.length - shown.length;

    var cardsHTML = shown.length
      ? shown.map(function (c) { return _cardHTML(c, pillar); }).join('')
      : '<div class="pm-empty">No Phase 1 programs</div>';

    var btnLabel = overflow > 0
      ? '&#128203; +' + overflow + ' more — Full Roadmap'
      : '&#128203; Full Roadmap';
    var btn = '<button class="roadmap-btn" style="margin-top:4px;"' +
      ' onclick="openRoadmapWindow(\'' + pillar.id + '\')">'
      + btnLabel + '</button>';

    return '<div class="pm-cell pm-cell-p1">' + cardsHTML + btn + '</div>';
  }

  // ── PHASE 2 & 3 CELL — capability chips ──────────────────
  function _capCell(ph, pillar) {
    var cards      = _getCards(ph.num, pillar);
    var valueLabel = ph.wsValue ? ph.wsValue[pillar.id] : '';

    var banner = valueLabel
      ? '<div class="pm-value-banner" style="border-color:' + ph.border + ';color:' + ph.color + ';background:' + ph.bg + ';">'
          + '&#10024; ' + valueLabel
          + '</div>'
      : '';

    var chipsHTML = cards.length
      ? cards.map(function (c) { return _capChip(c, pillar); }).join('')
      : '<div class="pm-empty">Roadmap — TBD</div>';

    return [
      '<div class="pm-cell pm-cell-future">',
        banner,
        chipsHTML,
      '</div>',
    ].join('');
  }

  // ── CARD HTML (Phase 1 full card) ─────────────────────────
  function _cardHTML(card, pillar) {
    var badgeCls  = BADGE_CLASS[card.status] || 'badge-roadmap';
    var critStyle = _isCrit(card) ? 'border-left:3px solid #ffc220;' : '';
    var tagHTML   = card.tag
      ? '<span class="tag' + (_isWin(card) ? ' tag-win' : '') + '">' + card.tag + '</span>'
      : '';
    var safeWS   = _safe(pillar.title);
    var safeTool = _safe(pillar.tool);

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
          card.targetDate
            ? '<span style="font-size:0.66rem;color:#94a3b8;">&#128197; ' + card.targetDate + '</span>'
            : '',
        '</div>',
      '</div>',
    ].join('');
  }

  // ── CAPABILITY CHIP (Phase 2 & 3) ─────────────────────────
  function _capChip(card, pillar) {
    var badgeCls = BADGE_CLASS[card.status] || 'badge-roadmap';
    var safeWS   = _safe(pillar.title);
    var safeTool = _safe(pillar.tool);
    var critCls  = _isCrit(card) ? ' pm-cap-crit' : '';

    return [
      '<div class="pm-cap-chip' + critCls + '"',
      ' onclick="openModal(\'' + card.id + '\',\'' + safeWS + '\',\'' + safeTool + '\')"',
      ' role="button" tabindex="0" title="' + card.title + '">',
        '<span class="pm-cap-icon">' + card.icon + '</span>',
        '<div class="pm-cap-body">',
          '<span class="pm-cap-title">' + card.title + '</span>',
          '<span class="badge ' + badgeCls + ' pm-cap-badge">' + card.statusLabel + '</span>',
        '</div>',
      '</div>',
    ].join('');
  }

  // ── HELPERS ───────────────────────────────────────────────
  function _getCards(phaseNum, pillar) {
    return pillar.cards
      .filter(function (c) { return (CARD_PHASE_MAP[c.id] || 1) === phaseNum; })
      .slice()
      .sort(function (a, b) {
        var ac = _isCrit(a) ? 0 : 1, bc = _isCrit(b) ? 0 : 1;
        if (ac !== bc) return ac - bc;
        return (STATUS_PRIO[a.status] || 4) - (STATUS_PRIO[b.status] || 4);
      });
  }

  function _dedupe(arr) {
    var seen = {};
    return arr.filter(function (c) {
      if (seen[c.id]) return false;
      seen[c.id] = true;
      return true;
    });
  }

  function _isCrit(card) { return (card.tag || '').indexOf('Critical') > -1; }
  function _isWin(card)  { return (card.tag || '').indexOf('Win')      > -1; }
  function _safe(s)      { return (s || '').replace(/'/g, '\u0027'); }

}());