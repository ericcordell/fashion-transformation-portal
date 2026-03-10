// tab-data.js — Full-column Programs Spreadsheet
// Every data field from every card gets its own column.
// Sticky first 2 cols (Workstream + Title). Horizontal scroll for the rest.
// Depends on: PILLARS, CARD_PHASE_MAP, QUARTER_META, openCardModal
(function () {

  var CONF_BASE = 'https://confluence.walmart.com/display/APREC/' +
    'Long+Lead+Time+Transformation+Work+Management+Dashboard';

  var WS_CFG = {
    strategy:   { label:'Strategy',   emoji:'\uD83C\uDFDB\uFE0F', color:'#0053e2', bg:'#eef2ff', anchor:'#Strategy' },
    design:     { label:'Design',     emoji:'\uD83C\uDFA8',       color:'#7c3aed', bg:'#f5f3ff', anchor:'#Design'   },
    buying:     { label:'Buying',     emoji:'\uD83D\uDED2',       color:'#0891b2', bg:'#ecfeff', anchor:'#Buying'   },
    allocation: { label:'Allocation', emoji:'\uD83D\uDCE6',       color:'#2a8703', bg:'#f0faf0', anchor:'#Allocation'},
  };

  var ST_CFG = {
    green:     { label:'On Track',  cls:'tds-green'  },
    yellow:    { label:'At Risk',   cls:'tds-yellow' },
    red:       { label:'Off Track', cls:'tds-red'    },
    completed: { label:'Completed', cls:'tds-done'   },
    roadmap:   { label:'Roadmap',   cls:'tds-road'   },
  };

  var QORDER = { completed:0, Q1:1, Q2:2, Q3:3, Q4:4, Future:5 };

  // ── Column definitions ───────────────────────────────────
  // render(row) → inner HTML string for the <td>
  var COLS = [
    // ── Fixed / ──
    { id:'workstream', label:'Workstream', w:105, sticky:true,
      render: function(r) {
        var w = WS_CFG[r.workstream] || WS_CFG.strategy;
        return '<span class="tds-ws" style="background:'+w.bg+';color:'+w.color+'">'+
          w.emoji+' '+w.label+'</span>'; } },
    { id:'title', label:'Program', w:190, sticky:true,
      render: function(r) {
        return '<span class="tds-title" title="'+_esc(r.title)+'">'+
          r.icon+' '+_esc(r.title)+'</span>';
      } },
    // ── Status / timeline ──
    { id:'status', label:'Status', w:88,
      render: function(r) {
        var s = ST_CFG[r.status] || ST_CFG.roadmap;
        return '<span class="tds-badge '+s.cls+'">'+s.label+'</span>';
      } },
    { id:'phase', label:'Phase', w:52, center:true,
      render: function(r) {
        return '<span class="tds-phase">P'+r.phase+'</span>';
      } },
    { id:'quarter', label:'Quarter', w:78,
      render: function(r) {
        var labels = {completed:'\u2705 Done',Q1:'Q1 FY27',Q2:'Q2 FY27',
                      Q3:'Q3 FY27',Q4:'Q4 FY27',Future:'Future'};
        return '<span class="tds-q">'+( labels[r.quarter]||r.quarter)+'</span>';
      } },
    { id:'targetDate', label:'Target Date', w:100,
      render: function(r) { return _cell(r.targetDate); } },
    { id:'tag', label:'Tag', w:90,
      render: function(r) {
        return r.tag ? '<span class="tds-tag">'+_esc(r.tag)+'</span>' : '<span class="tds-nd">\u2014</span>';
      } },
    // ── Rich text fields ──
    { id:'description', label:'Description', w:220,
      render: function(r) { return _long(r.description); } },
    { id:'businessBenefit', label:'Business Benefit', w:220,
      render: function(r) { return _long(r.businessBenefit); } },
    { id:'techIntegration', label:'Tech Integration', w:220,
      render: function(r) { return _long(r.techIntegration); } },
    { id:'successMetrics', label:'Success Metrics', w:200,
      render: function(r) { return _long(r.successMetrics); } },
    // ── Owners (one column each) ──
    { id:'bp', label:'Business Partner', w:140,
      render: function(r) { return _owner(r.bp, r.bpEmail); } },
    { id:'tl', label:'Transformation Lead', w:140,
      render: function(r) { return _owner(r.tl, r.tlEmail); } },
    { id:'pl', label:'Product Lead', w:140,
      render: function(r) { return _owner(r.pl, r.plEmail); } },
    { id:'ux', label:'UX Lead', w:140,
      render: function(r) { return _owner(r.ux, r.uxEmail); } },
    { id:'sw', label:'Software Lead', w:140,
      render: function(r) { return _owner(r.sw, r.swEmail); } },
    // ── Resource links (one column each) ──
    { id:'opif', label:'OPIF', w:80, center:true,
      render: function(r) { return _link(r.opifUrl, 'OPIF', 'tds-ln-opif'); } },
    { id:'brd', label:'BRD', w:75, center:true,
      render: function(r) { return _link(r.brdUrl, 'BRD', 'tds-ln-brd'); } },
    { id:'prd', label:'PRD', w:75, center:true,
      render: function(r) { return _link(r.prdUrl, 'PRD', 'tds-ln-prd'); } },
    { id:'uxDemo', label:'UX Demo', w:80, center:true,
      render: function(r) { return _link(r.uxDemoUrl, 'Demo', 'tds-ln-demo'); } },
    { id:'confluence', label:'Confluence \u2714️', w:105, center:true,
      render: function(r) { return _link(r.confUrl, 'Source', 'tds-ln-conf'); } },
  ];

  // ── State ────────────────────────────────────────────────
  var _rows = [], _search = '', _wsF = 'all', _stF = 'all', _qF = 'all';
  var _sortId = 'quarter', _sortDir = 'asc', _inited = false;

  // ── Public ───────────────────────────────────────────────
  window.initDataTab = function () {
    if (_inited) { _refresh(); return; }
    _inited = true;
    _rows = _flatten();
    document.getElementById('tab-data').innerHTML = _shell();
    _bind();
    _refresh();
  };

  // ── Flatten PILLARS → row objects ────────────────────────
  function _flatten() {
    var out = [];
    (PILLARS || []).forEach(function (pillar) {
      var ws = pillar.id;
      (pillar.cards || []).forEach(function (c) {
        var o  = c.owners    || {};
        var r  = c.resources || {};
        var bp = o.businessPartner    || {};
        var tl = o.transformationLead || {};
        var pl = o.productLead        || {};
        var ux = o.uxLead             || {};
        var sw = o.softwareLead       || {};
        var ph = (typeof CARD_PHASE_MAP !== 'undefined' && CARD_PHASE_MAP[c.id]) || 1;
        var cf = CONF_BASE + ((WS_CFG[ws] || {}).anchor || '');
        out.push({
          id: c.id, workstream: ws, phase: ph,
          icon: c.icon || '\uD83D\uDCCC',
          title:          c.title         || '',
          status:         c.status        || 'roadmap',
          quarter:        c.quarter       || 'Future',
          targetDate:     c.targetDate    || '',
          tag:            c.tag           || '',
          description:    c.description   || '',
          businessBenefit:c.businessBenefit  || '',
          techIntegration:c.techIntegration  || '',
          successMetrics: c.successMetrics   || '',
          bp: bp.name||'', bpEmail: bp.email||'',
          tl: tl.name||'', tlEmail: tl.email||'',
          pl: pl.name||'', plEmail: pl.email||'',
          ux: ux.name||'', uxEmail: ux.email||'',
          sw: sw.name||'', swEmail: sw.email||'',
          opifUrl:  _url(r.opif),
          brdUrl:   _url(r.brd),
          prdUrl:   _url(r.prd),
          uxDemoUrl:_url(r.uxDemo),
          confUrl:  cf,
        });
      });
    });
    return out;
  }

  function _url(v) { return (v && v !== '#') ? v : null; }

  // ── Shell HTML ───────────────────────────────────────────
  function _shell() {
    return '<div class="tds-wrap">'+
      '<div class="tds-bar">'+
        '<div class="tds-bar-l">'+
          '<span class="tds-bar-title">&#128202; Programs &amp; Deliverables</span>'+
          '<span id="tds-count" class="tds-count"></span>'+
        '</div>'+
        '<div class="tds-bar-r">'+
          '<input id="tds-search" class="tds-search" type="search" placeholder="&#128269; Search...">'+
          '<select id="tds-ws"  class="tds-sel"><option value="all">All Workstreams</option>'+
            '<option value="strategy">Strategy</option><option value="design">Design</option>'+
            '<option value="buying">Buying</option><option value="allocation">Allocation</option></select>'+
          '<select id="tds-st"  class="tds-sel"><option value="all">All Statuses</option>'+
            '<option value="green">On Track</option><option value="yellow">At Risk</option>'+
            '<option value="red">Off Track</option><option value="completed">Completed</option>'+
            '<option value="roadmap">Roadmap</option></select>'+
          '<select id="tds-q"   class="tds-sel"><option value="all">All Quarters</option>'+
            '<option value="completed">Completed</option>'+
            '<option value="Q1">Q1 FY27</option><option value="Q2">Q2 FY27</option>'+
            '<option value="Q3">Q3 FY27</option><option value="Q4">Q4 FY27</option>'+
            '<option value="Future">Future</option></select>'+
          '<button id="tds-csv" class="tds-csv">&#8595; CSV</button>'+
        '</div>'+
      '</div>'+
      '<div class="tds-scroll">'+
        '<table class="tds-tbl" id="tds-tbl">'+
          '<thead><tr id="tds-head"></tr></thead>'+
          '<tbody id="tds-body"></tbody>'+
        '</table>'+
      '</div>'+
      '<p class="tds-foot">&#128196; Source: '+
        '<a href="'+CONF_BASE+'" target="_blank" rel="noopener">APREC &mdash; LLTT Work Management Dashboard</a>'+
        ' &bull; Hover any cell for full text &bull; Click a row to open detail modal'+
      '</p>'+
    '</div>';
  }

  // ── Event binding ────────────────────────────────────────
  function _bind() {
    document.getElementById('tds-search').addEventListener('input',  function(e){ _search = e.target.value.toLowerCase(); _refresh(); });
    document.getElementById('tds-ws'    ).addEventListener('change', function(e){ _wsF = e.target.value; _refresh(); });
    document.getElementById('tds-st'    ).addEventListener('change', function(e){ _stF = e.target.value; _refresh(); });
    document.getElementById('tds-q'     ).addEventListener('change', function(e){ _qF  = e.target.value; _refresh(); });
    document.getElementById('tds-csv'   ).addEventListener('click',  _csv);
    document.getElementById('tds-head'  ).addEventListener('click', function(e){
      var th = e.target.closest('th[data-col]'); if (!th) return;
      var id = th.dataset.col;
      _sortDir = (_sortId === id && _sortDir === 'asc') ? 'desc' : 'asc';
      _sortId = id;
      _refresh();
    });
    document.getElementById('tds-body').addEventListener('click', function(e){
      if (e.target.closest('a')) return;
      var tr = e.target.closest('tr[data-id]');
      if (tr && typeof openCardModal === 'function') openCardModal(tr.dataset.id);
    });
  }

  // ── Refresh ──────────────────────────────────────────────
  function _refresh() {
    var vis = _filtered();
    vis = _sorted(vis);
    _head();
    _body(vis);
    document.getElementById('tds-count').textContent =
      vis.length + ' / ' + _rows.length + ' programs';
  }

  function _filtered() {
    return _rows.filter(function(r){
      if (_wsF !== 'all' && r.workstream !== _wsF) return false;
      if (_stF !== 'all' && r.status     !== _stF) return false;
      if (_qF  !== 'all' && r.quarter    !== _qF)  return false;
      if (_search) {
        var hay = [r.title,r.description,r.bp,r.tl,r.pl,r.ux,r.sw].join(' ').toLowerCase();
        if (hay.indexOf(_search) === -1) return false;
      }
      return true;
    });
  }

  function _sorted(rows) {
    var id = _sortId, dir = _sortDir === 'asc' ? 1 : -1;
    return rows.slice().sort(function(a,b){
      var av = id === 'quarter' ? (QORDER[a.quarter]||9) : (a[id]||'').toString().toLowerCase();
      var bv = id === 'quarter' ? (QORDER[b.quarter]||9) : (b[id]||'').toString().toLowerCase();
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }

  // ── Table head ───────────────────────────────────────────
  function _head() {
    var left = 0;
    document.getElementById('tds-head').innerHTML = COLS.map(function(c){
      var arrow = _sortId === c.id
        ? (_sortDir==='asc'?'&#9650;':'&#9660;')
        : '<span class="tds-sh">&#8597;</span>';
      var st = c.sticky
        ? 'position:sticky;left:'+left+'px;z-index:3;background:#1e293b;'
        : '';
      if (c.sticky) left += c.w;
      var ctr = c.center ? 'text-align:center;' : '';
      return '<th data-col="'+c.id+'" class="tds-sortable" style="'+st+ctr+
        'min-width:'+c.w+'px;width:'+c.w+'px">'+c.label+' '+arrow+'</th>';
    }).join('');
  }

  // ── Table body ───────────────────────────────────────────
  function _body(rows) {
    if (!rows.length) {
      document.getElementById('tds-body').innerHTML =
        '<tr><td colspan="'+COLS.length+'" class="tds-empty">No programs match the filters.</td></tr>';
      return;
    }
    document.getElementById('tds-body').innerHTML = rows.map(_row).join('');
  }

  function _row(r) {
    var left = 0;
    var cells = COLS.map(function(c){
      var st = c.sticky
        ? 'position:sticky;left:'+left+'px;z-index:1;background:inherit;'
        : '';
      if (c.sticky) left += c.w;
      var ctr = c.center ? 'text-align:center;' : '';
      var shadow = (c.sticky && left === 295) ? 'box-shadow:2px 0 6px rgba(0,0,0,0.10);' : '';
      return '<td style="'+st+ctr+shadow+'">'+c.render(r)+'</td>';
    }).join('');
    return '<tr data-id="'+r.id+'" class="tds-row">'+cells+'</tr>';
  }

  // ── Cell helpers ─────────────────────────────────────────
  function _esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function _cell(s) {
    var v = (s || '').trim();
    return v ? '<span title="'+_esc(v)+'">'+_esc(v)+'</span>'
             : '<span class="tds-nd">\u2014</span>';
  }

  function _long(s) {
    var v = (s || '').trim();
    if (!v) return '<span class="tds-nd">\u2014</span>';
    return '<span class="tds-text" title="'+_esc(v)+'">'+_esc(v)+'</span>';
  }

  function _owner(name, email) {
    if (!name || name === 'TBD') return '<span class="tds-nd">TBD</span>';
    var n = '<span class="tds-own-name">'+_esc(name)+'</span>';
    var e = email ? '<a class="tds-own-email" href="mailto:'+_esc(email)+'">'+_esc(email)+'</a>' : '';
    return n + (e ? '<br>'+e : '');
  }

  function _link(url, label, cls) {
    if (!url) return '<span class="tds-nd">\u2014</span>';
    return '<a href="'+url+'" target="_blank" rel="noopener" class="tds-ln '+cls+'">'+label+' \u2192</a>';
  }

  // ── CSV export ───────────────────────────────────────────
  // Bug fix: detached <a> elements don't trigger downloads in modern
  // browsers — must append to DOM first, then remove. Also falls back
  // to data: URI if Blob/createObjectURL is blocked by CSP/sandbox.
  function _csv() {
    var vis = _sorted(_filtered());
    var headers = ['Workstream','Program','Status','Phase','Quarter','Target Date',
      'Tag','Description','Business Benefit','Tech Integration','Success Metrics',
      'Business Partner','BP Email','Transformation Lead','TL Email',
      'Product Lead','PL Email','UX Lead','UX Email','Software Lead','SW Email',
      'OPIF Link','BRD Link','PRD Link','UX Demo Link','Confluence Source'];
    var q = function(v){
      v = String(v || '');
      return (v.indexOf(',') > -1 || v.indexOf('"') > -1 || v.indexOf('\n') > -1)
        ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    var lines = [headers.join(',')].concat(vis.map(function(r){
      return [r.workstream, r.title, r.status, 'P'+r.phase, r.quarter, r.targetDate,
        r.tag, r.description, r.businessBenefit, r.techIntegration, r.successMetrics,
        r.bp, r.bpEmail, r.tl, r.tlEmail, r.pl, r.plEmail, r.ux, r.uxEmail, r.sw, r.swEmail,
        r.opifUrl||'', r.brdUrl||'', r.prdUrl||'', r.uxDemoUrl||'', r.confUrl
      ].map(q).join(',');
    }));
    var csv = lines.join('\n');
    var filename = 'fashion-programs.csv';

    // Attempt 1: Blob + createObjectURL (best quality)
    try {
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var blobUrl = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      a.target = '_self'; // never open a new tab
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 2000);
      return;
    } catch (e) { /* fall through to data: URI */ }

    // Attempt 2: data: URI fallback (works in sandboxed iframes)
    try {
      var dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      var a2 = document.createElement('a');
      a2.style.display = 'none';
      a2.href = dataUri;
      a2.download = filename;
      a2.target = '_self';
      document.body.appendChild(a2);
      a2.click();
      document.body.removeChild(a2);
      return;
    } catch (e2) { /* fall through to copy modal */ }

    // Attempt 3: copy-to-clipboard modal (last resort)
    _csvModal(csv);
  }

  // Fallback: show CSV in a textarea so users can copy manually
  function _csvModal(csv) {
    var existing = document.getElementById('tds-csv-modal');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'tds-csv-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);'
      + 'display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
    overlay.innerHTML =
      '<div style="background:white;border-radius:16px;padding:24px;max-width:680px;'
      + 'width:100%;max-height:80vh;display:flex;flex-direction:column;gap:12px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;">'
      + '<strong style="font-size:0.9rem;">&#128196; Copy CSV data</strong>'
      + '<button onclick="document.getElementById("tds-csv-modal").remove()" '
      + 'style="background:none;border:none;font-size:1.4rem;cursor:pointer;">&times;</button></div>'
      + '<p style="font-size:0.75rem;color:#64748b;margin:0;">'
      + 'Download was blocked — select all and copy this text into a .csv file.</p>'
      + '<textarea style="flex:1;min-height:300px;font-size:0.68rem;font-family:monospace;'
      + 'border:1px solid #e2e8f0;border-radius:8px;padding:10px;resize:vertical;">'
      + csv.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</textarea>'
      + '<button onclick="navigator.clipboard&&navigator.clipboard.writeText('
      + 'document.querySelector("#tds-csv-modal textarea").value)" '
      + 'style="padding:8px 18px;background:#0053e2;color:white;border:none;'
      + 'border-radius:8px;font-weight:700;cursor:pointer;font-size:0.8rem;">'
      + '&#128203; Copy to clipboard</button></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e){
      if (e.target === overlay) overlay.remove();
    });
    // Auto-select the textarea
    setTimeout(function(){
      var ta = overlay.querySelector('textarea');
      if (ta) { ta.focus(); ta.select(); }
    }, 50);
  }

}());