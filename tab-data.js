// tab-data.js — Programs Data Spreadsheet tab
// Renders a searchable, filterable, sortable table of ALL programs
// across all workstreams. Each row has direct Confluence + OPIF links
// so editors can jump straight to the source and update.
// Depends on: PILLARS (data-allocation.js), QUARTER_META, BADGE_CLASS,
//             CARD_PHASE_MAP (data-phases.js), openCardModal (index.html)

(function () {

  // ── Confluence source anchors per workstream ──────────────
  var CONF_BASE = 'https://confluence.walmart.com/display/APREC/' +
    'Long+Lead+Time+Transformation+Work+Management+Dashboard';

  var WS_CFG = {
    strategy:   { label: 'Strategy',   emoji: '\uD83C\uDFDB\uFE0F',
      color: '#0053e2', bg: '#eef2ff', anchor: '#Strategy-TrendToProduct(TTP)' },
    design:     { label: 'Design',     emoji: '\uD83C\uDFA8',
      color: '#7c3aed', bg: '#f5f3ff', anchor: '#Design-CentricPLM' },
    buying:     { label: 'Buying',     emoji: '\uD83D\uDED2',
      color: '#0891b2', bg: '#ecfeff', anchor: '#Buying-AEXAssortmentPlanning' },
    allocation: { label: 'Allocation', emoji: '\uD83D\uDCE6',
      color: '#2a8703', bg: '#f0faf0', anchor: '#Allocation-BPEDBPUnifiedPlanning' },
  };

  var STATUS_CFG = {
    green:     { label: 'On Track',    cls: 'td-s-green'  },
    yellow:    { label: 'At Risk',     cls: 'td-s-yellow' },
    red:       { label: 'Off Track',   cls: 'td-s-red'    },
    completed: { label: 'Completed',   cls: 'td-s-done'   },
    roadmap:   { label: 'Roadmap',     cls: 'td-s-road'   },
  };

  var QUARTER_LABELS = {
    completed: '\u2705 Done',
    Q1: 'Q1 FY27', Q2: 'Q2 FY27', Q3: 'Q3 FY27', Q4: 'Q4 FY27',
    Future: 'Future',
  };

  // State
  var _rows    = [];
  var _search  = '';
  var _wsFilter  = 'all';
  var _stFilter  = 'all';
  var _qFilter   = 'all';
  var _sortCol   = 'quarter';
  var _sortDir   = 'asc';
  var _expanded  = {}; // rowId → bool (desc expanded)
  var _inited    = false;

  // ── Public init ─────────────────────────────────────────
  window.initDataTab = function () {
    if (_inited) { _refresh(); return; }
    _inited = true;
    _rows = _flatCards();
    var panel = document.getElementById('tab-data');
    panel.innerHTML = _shellHTML();
    _bindEvents();
    _refresh();
  };

  // ── Flatten all PILLARS cards into rows ──────────────────
  function _flatCards() {
    var out = [];
    (PILLARS || []).forEach(function (pillar) {
      var ws = pillar.id; // 'strategy' | 'design' | 'buying' | 'allocation'
      (pillar.cards || []).forEach(function (c) {
        var owners  = c.owners  || {};
        var rsrcs   = c.resources || {};
        var phaseNo = (typeof CARD_PHASE_MAP !== 'undefined' && CARD_PHASE_MAP[c.id]) || 1;
        var confUrl = CONF_BASE + ((WS_CFG[ws] || {}).anchor || '');
        var opifUrl = (rsrcs.opif && rsrcs.opif !== '#') ? rsrcs.opif : null;
        var brdUrl  = (rsrcs.brd  && rsrcs.brd  !== '#') ? rsrcs.brd  : null;
        var prdUrl  = (rsrcs.prd  && rsrcs.prd  !== '#') ? rsrcs.prd  : null;
        out.push({
          id:          c.id,
          workstream:  ws,
          phase:       phaseNo,
          icon:        c.icon || '\uD83D\uDCCC',
          title:       c.title,
          status:      c.status || 'roadmap',
          statusLabel: c.statusLabel || '',
          quarter:     c.quarter || 'Future',
          targetDate:  c.targetDate || '\u2014',
          tag:         c.tag || '',
          description: c.description || '',
          bizBenefit:  c.businessBenefit || '',
          bp:   ((owners.businessPartner    || {}).name) || '',
          tl:   ((owners.transformationLead || {}).name) || '',
          pl:   ((owners.productLead        || {}).name) || '',
          ux:   ((owners.uxLead             || {}).name) || '',
          sw:   ((owners.softwareLead       || {}).name) || '',
          confUrl: confUrl,
          opifUrl: opifUrl,
          brdUrl:  brdUrl,
          prdUrl:  prdUrl,
        });
      });
    });
    return out;
  }

  // ── Shell HTML (search bar + table wrapper) ──────────────
  function _shellHTML() {
    return [
      '<div class="td-wrap">',
      '  <div class="td-toolbar">',
      '    <div class="td-toolbar-left">',
      '      <span class="td-toolbar-title">&#128202; Programs &amp; Deliverables</span>',
      '      <span id="td-count" class="td-count"></span>',
      '    </div>',
      '    <div class="td-toolbar-right">',
      '      <input id="td-search" class="td-search" type="search" placeholder="&#128269; Search programs...">',
      '      <select id="td-ws"  class="td-filter-sel"><option value="all">All Workstreams</option>',
      '        <option value="strategy">Strategy</option><option value="design">Design</option>',
      '        <option value="buying">Buying</option><option value="allocation">Allocation</option>',
      '      </select>',
      '      <select id="td-st"  class="td-filter-sel"><option value="all">All Statuses</option>',
      '        <option value="green">On Track</option><option value="yellow">At Risk</option>',
      '        <option value="red">Off Track</option><option value="completed">Completed</option>',
      '        <option value="roadmap">Roadmap</option>',
      '      </select>',
      '      <select id="td-q"   class="td-filter-sel"><option value="all">All Quarters</option>',
      '        <option value="completed">Completed</option>',
      '        <option value="Q1">Q1 FY27</option><option value="Q2">Q2 FY27</option>',
      '        <option value="Q3">Q3 FY27</option><option value="Q4">Q4 FY27</option>',
      '        <option value="Future">Future</option>',
      '      </select>',
      '      <button id="td-csv" class="td-csv-btn" title="Export visible rows to CSV">&#8595; CSV</button>',
      '    </div>',
      '  </div>',
      '  <div class="td-table-scroll">',
      '    <table class="td-table" id="td-table">',
      '      <thead><tr id="td-thead"></tr></thead>',
      '      <tbody id="td-tbody"></tbody>',
      '    </table>',
      '  </div>',
      '  <p class="td-footer-note">&#128196; Source: ',
      '    <a href="' + CONF_BASE + '" target="_blank" rel="noopener">',
      '      APREC &mdash; LLTT Work Management Dashboard</a>',
      '    &bull; Click any &#9997;&#65039; link in the Sources column to open the program',
      '    directly in Confluence or OPIF and update the data at its source.',
      '  </p>',
      '</div>',
    ].join('\n');
  }

  // ── Bind all events ──────────────────────────────────────
  function _bindEvents() {
    document.getElementById('td-search').addEventListener('input', function (e) {
      _search = e.target.value.toLowerCase();
      _refresh();
    });
    document.getElementById('td-ws').addEventListener('change', function (e) {
      _wsFilter = e.target.value; _refresh();
    });
    document.getElementById('td-st').addEventListener('change', function (e) {
      _stFilter = e.target.value; _refresh();
    });
    document.getElementById('td-q').addEventListener('change', function (e) {
      _qFilter  = e.target.value; _refresh();
    });
    document.getElementById('td-csv').addEventListener('click', _exportCSV);

    // Header sort — delegated
    document.getElementById('td-thead').addEventListener('click', function (e) {
      var th = e.target.closest('th[data-sort]');
      if (!th) return;
      var col = th.dataset.sort;
      _sortDir = (_sortCol === col && _sortDir === 'asc') ? 'desc' : 'asc';
      _sortCol = col;
      _refresh();
    });

    // Expand description — delegated on tbody
    document.getElementById('td-tbody').addEventListener('click', function (e) {
      var btn = e.target.closest('.td-expand-btn');
      if (btn) { _expanded[btn.dataset.id] = !_expanded[btn.dataset.id]; _refresh(); return; }
      var row = e.target.closest('tr[data-id]');
      if (row && !e.target.closest('a')) {
        openCardModal && openCardModal(row.dataset.id);
      }
    });
  }

  // ── Main refresh ─────────────────────────────────────────
  function _refresh() {
    var visible = _filter(_rows);
    visible = _sort(visible);
    _renderHead();
    _renderBody(visible);
    document.getElementById('td-count').textContent =
      visible.length + ' of ' + _rows.length + ' programs';
  }

  function _filter(rows) {
    return rows.filter(function (r) {
      if (_wsFilter !== 'all' && r.workstream !== _wsFilter) return false;
      if (_stFilter !== 'all' && r.status     !== _stFilter) return false;
      if (_qFilter  !== 'all' && r.quarter    !== _qFilter)  return false;
      if (_search) {
        var hay = (r.title + ' ' + r.description + ' ' + r.bp + ' ' + r.pl).toLowerCase();
        if (hay.indexOf(_search) === -1) return false;
      }
      return true;
    });
  }

  var QORDER = { completed: 0, Q1: 1, Q2: 2, Q3: 3, Q4: 4, Future: 5 };

  function _sort(rows) {
    var col = _sortCol, dir = _sortDir === 'asc' ? 1 : -1;
    return rows.slice().sort(function (a, b) {
      var av = col === 'quarter' ? (QORDER[a.quarter] || 9) : (a[col] || '').toString().toLowerCase();
      var bv = col === 'quarter' ? (QORDER[b.quarter] || 9) : (b[col] || '').toString().toLowerCase();
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }

  // ── Render table head ────────────────────────────────────
  var COLS = [
    { key: 'workstream', label: 'Workstream',  sort: 'workstream', w: '100px'  },
    { key: 'status',     label: 'Status',       sort: 'status',     w: '90px'   },
    { key: 'phase',      label: 'Ph',           sort: 'phase',      w: '36px'   },
    { key: 'title',      label: 'Program',      sort: 'title',      w: '200px'  },
    { key: 'quarter',    label: 'Quarter',      sort: 'quarter',    w: '90px'   },
    { key: 'targetDate', label: 'Target Date',  sort: 'targetDate', w: '110px'  },
    { key: 'owners',     label: 'Owners',       sort: 'bp',         w: '140px'  },
    { key: 'desc',       label: 'Overview',     sort: null,         w: 'auto'   },
    { key: 'sources',    label: 'Sources ✏️',   sort: null,         w: '110px'  },
  ];

  function _renderHead() {
    document.getElementById('td-thead').innerHTML = COLS.map(function (c) {
      var arrow = '';
      if (c.sort) {
        arrow = _sortCol === c.sort
          ? (_sortDir === 'asc' ? ' &#9650;' : ' &#9660;')
          : ' <span class="td-sort-hint">&#8597;</span>';
      }
      return '<th ' + (c.sort ? 'data-sort="' + c.sort + '" class="td-sortable"' : '') +
        ' style="width:' + c.w + ';min-width:' + c.w + '">' + c.label + arrow + '</th>';
    }).join('');
  }

  // ── Render table body ────────────────────────────────────
  function _renderBody(rows) {
    if (!rows.length) {
      document.getElementById('td-tbody').innerHTML =
        '<tr><td colspan="9" class="td-empty">No programs match the current filters.</td></tr>';
      return;
    }
    document.getElementById('td-tbody').innerHTML = rows.map(_rowHTML).join('');
  }

  function _rowHTML(r) {
    var ws = WS_CFG[r.workstream] || WS_CFG.strategy;
    var st = STATUS_CFG[r.status] || STATUS_CFG.roadmap;
    var desc  = r.description || '\u2014';
    var short = desc.length > 110 ? desc.slice(0, 110) + '\u2026' : desc;
    var isExp = !!_expanded[r.id];
    var descHTML = isExp
      ? _esc(desc) + ' <button class="td-expand-btn" data-id="' + r.id + '">less \u25b2</button>'
      : _esc(short) + (desc.length > 110
          ? ' <button class="td-expand-btn" data-id="' + r.id + '">more \u25bc</button>' : '');

    var ownHTML = [
      r.bp ? '<span class="td-own-role">BP</span> ' + _esc(r.bp) : '',
      r.pl ? '<span class="td-own-role">PL</span> ' + _esc(r.pl) : '',
      r.tl ? '<span class="td-own-role">TL</span> ' + _esc(r.tl) : '',
    ].filter(Boolean).join('<br>');
    if (!ownHTML) ownHTML = '<span class="td-tbd">TBD</span>';

    var srcHTML = [
      '<a href="' + r.confUrl + '" target="_blank" rel="noopener" class="td-src-link td-src-conf"' +
        ' title="Open in Confluence APREC (LLTT Dashboard)">&#128196; Confluence</a>',
      r.opifUrl
        ? '<a href="' + r.opifUrl + '" target="_blank" rel="noopener" class="td-src-link td-src-opif"' +
          ' title="Open OPIF ticket">&#127381; OPIF</a>'
        : '<span class="td-src-link td-src-pending" title="OPIF link not yet added">&#127381; OPIF?</span>',
      r.brdUrl
        ? '<a href="' + r.brdUrl + '" target="_blank" rel="noopener" class="td-src-link td-src-brd"' +
          ' title="Open BRD">&#128196; BRD</a>'
        : '',
    ].filter(Boolean).join('');

    var tagBadge = r.tag
      ? '<span class="td-tag">' + _esc(r.tag) + '</span>'
      : '';

    return '<tr data-id="' + r.id + '" class="td-row">' +
      '<td><span class="td-ws-chip" style="background:' + ws.bg +
        ';color:' + ws.color + ';">' + ws.emoji + ' ' + ws.label + '</span></td>' +
      '<td><span class="td-status-badge ' + st.cls + '">' + st.label + '</span></td>' +
      '<td class="td-phase-cell"><span class="td-phase-pill">P' + r.phase + '</span></td>' +
      '<td class="td-title-cell">' + r.icon + ' ' + _esc(r.title) + tagBadge + '</td>' +
      '<td><span class="td-q-chip">' + (QUARTER_LABELS[r.quarter] || r.quarter) + '</span></td>' +
      '<td class="td-date">' + _esc(r.targetDate) + '</td>' +
      '<td class="td-owners">' + ownHTML + '</td>' +
      '<td class="td-desc">' + descHTML + '</td>' +
      '<td class="td-sources">' + srcHTML + '</td>' +
      '</tr>';
  }

  function _esc(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── CSV export ───────────────────────────────────────────
  function _exportCSV() {
    var visible = _sort(_filter(_rows));
    var headers = ['Workstream','Status','Phase','Program','Quarter',
                   'Target Date','Business Partner','Product Lead',
                   'Transformation Lead','Overview','Confluence Link','OPIF Link'];
    var csvRows = [headers.join(',')];
    visible.forEach(function (r) {
      csvRows.push([
        r.workstream, r.status, 'P' + r.phase, r.title,
        r.quarter, r.targetDate, r.bp, r.pl, r.tl,
        '"' + (r.description || '').replace(/"/g, '""') + '"',
        r.confUrl, r.opifUrl || 'pending',
      ].map(function (v) {
        return typeof v === 'string' && (v.indexOf(',') > -1 || v.indexOf('"') > -1)
          ? '"' + v.replace(/"/g,'""') + '"' : (v || '');
      }).join(','));
    });
    var blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fashion-portal-programs.csv';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

}());