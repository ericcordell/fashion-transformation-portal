// roadmap-window.js — in-page roadmap popout modal
// Replaces the blob/new-window approach with a same-page modal at z-index:98.
// Card clicks inside the roadmap open the existing card-detail modal (z-index:100) on top.
// Globals required from data.js: PILLARS, QUARTER_META, QUARTER_ORDER, PILLAR_GRADIENTS, BADGE_CLASS
// Globals required from index.html: openModal (called when a roadmap card is clicked)

(function () {
  let _pillar = null;
  let _filter = 'all';

  // Filter labels read dynamically from QUARTER_META so FY year is always correct
  const FILTER_DEFS = [
    { q: 'all',       label: 'All' },
    { q: 'completed', label: '\u2713 Completed' },
    { q: 'Q1',        label: (QUARTER_META.Q1 && QUARTER_META.Q1.label) || 'Q1' },
    { q: 'Q2',        label: (QUARTER_META.Q2 && QUARTER_META.Q2.label) || 'Q2' },
    { q: 'Q3',        label: (QUARTER_META.Q3 && QUARTER_META.Q3.label) || 'Q3' },
    { q: 'Q4',        label: (QUARTER_META.Q4 && QUARTER_META.Q4.label) || 'Q4' },
  ];

  // ---- PUBLIC: open the popout for a given pillar ----
  window.openRoadmapWindow = function (pillarId) {
    _pillar = PILLARS.find(function (x) { return x.id === pillarId; });
    if (!_pillar) return;
    _filter = 'all';

    const gradient = PILLAR_GRADIENTS[_pillar.headerClass] || PILLAR_GRADIENTS['pillar-dark'];
    document.getElementById('rm-header').style.background = gradient;
    document.getElementById('rm-title').textContent    = _pillar.title + ' \u2014 Full Roadmap';
    document.getElementById('rm-subtitle').textContent = _pillar.subtitle + ' \u00b7 ' + _pillar.tool;

    _renderFilters();
    _renderCards();
    document.getElementById('rm-overlay').classList.add('open');
  };

  // ---- PUBLIC: close ----
  window.closeRoadmapModal = function () {
    document.getElementById('rm-overlay').classList.remove('open');
  };

  // ---- INTERNAL: filter pill bar ----
  function _renderFilters() {
    document.getElementById('rm-filters').innerHTML =
      '<span style="color:rgba(255,255,255,0.55);font-size:0.68rem;font-weight:700;' +
      'text-transform:uppercase;letter-spacing:0.05em;margin-right:2px;">Quarter:</span>' +
      FILTER_DEFS.map(function (f) {
        const active = _filter === f.q ? ' active' : '';
        return '<button class="rm-filter-btn' + active + '" onclick="_rmSetFilter(\'' + f.q + '\')">' + f.label + '</button>';
      }).join('');
  }

  // ---- INTERNAL: card grid grouped by quarter ----
  function _renderCards() {
    if (!_pillar) return;
    const cards = _pillar.cards;
    const qs = _filter === 'all'
      ? QUARTER_ORDER.filter(function (q) { return cards.some(function (c) { return c.quarter === q; }); })
      : [_filter];

    document.getElementById('rm-body').innerHTML = qs.map(function (q) {
      const qCards = cards.filter(function (c) { return c.quarter === q; });
      if (!qCards.length) return '';
      const m = QUARTER_META[q] || QUARTER_META['Future'];
      return '<div class="rm-q-section" style="border-left-color:' + m.border + ';">' +
        '<div class="rm-q-label" style="color:' + m.color + ';background:' + m.bg + ';border-color:' + m.border + ';">' +
        '<span style="width:9px;height:9px;border-radius:50%;background:' + m.color + ';flex-shrink:0;display:inline-block;"></span>' +
        m.label + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;">' +
        qCards.map(_cardHTML).join('') +
        '</div></div>';
    }).join('');
  }

  function _cardHTML(c) {
    const badgeCls = BADGE_CLASS[c.status] || 'badge-roadmap';
    const tagHTML  = c.tag
      ? '<span class="tag' + (c.tag.indexOf('Win') > -1 ? ' tag-win' : '') + '">' + c.tag + '</span>'
      : '';
    return '<div class="rm-card" data-card-id="' + c.id + '">'
      + '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">'
      + '<span style="font-size:1.25rem;flex-shrink:0;">' + c.icon + '</span>'
      + '<span style="font-weight:600;font-size:0.87rem;line-height:1.3;color:#1e293b;flex:1;">' + c.title + '</span>'
      + tagHTML
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
      + '<span class="badge ' + badgeCls + '">' + c.statusLabel + '</span>'
      + (c.targetDate ? '<span style="font-size:0.72rem;color:#94a3b8;">\uD83D\uDCC5 ' + c.targetDate + '</span>' : '')
      + '</div></div>';
  }

  // ---- INTERNAL: filter setter (exposed globally for inline onclick) ----
  window._rmSetFilter = function (q) {
    _filter = q;
    _renderFilters();
    _renderCards();
  };

  // ---- Event delegation: card click → open card-detail modal on top ----
  document.getElementById('rm-body').addEventListener('click', function (e) {
    var el = e.target.closest('[data-card-id]');
    if (!el || !_pillar) return;
    openModal(el.dataset.cardId, _pillar.title, _pillar.tool);
  });

  // ---- Close on backdrop click ----
  document.getElementById('rm-overlay').addEventListener('click', function (e) {
    if (e.target === document.getElementById('rm-overlay')) closeRoadmapModal();
  });

}());