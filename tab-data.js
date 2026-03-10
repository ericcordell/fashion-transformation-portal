// tab-data.js — Programs Spreadsheet + Live Link Editor
// 21 explicit columns. ✏️ per link cell saves to localStorage.
// 📋 Full View modal. 📤 Export Fixes dumps corrections as JSON.
// ZERO inline onclick handlers — all buttons wired via addEventListener.
(function () {

  // ── Config ───────────────────────────────────────────────
  var CONF_BASE = 'https://confluence.walmart.com/display/APREC/' +
    'Long+Lead+Time+Transformation+Work+Management+Dashboard';
  var WS_CFG = {
    strategy:   { label:'Strategy',   emoji:'🏛️', color:'#0053e2', bg:'#eef2ff', anchor:'#Strategy'   },
    design:     { label:'Design',     emoji:'🎨', color:'#7c3aed', bg:'#f5f3ff', anchor:'#Design'     },
    buying:     { label:'Buying',     emoji:'🛒', color:'#0891b2', bg:'#ecfeff', anchor:'#Buying'     },
    allocation: { label:'Allocation', emoji:'📦', color:'#2a8703', bg:'#f0faf0', anchor:'#Allocation' },
  };
  var ST_CFG = {
    green:     { label:'On Track',  cls:'tds-green'  },
    yellow:    { label:'At Risk',   cls:'tds-yellow' },
    red:       { label:'Off Track', cls:'tds-red'    },
    completed: { label:'Completed', cls:'tds-done'   },
    roadmap:   { label:'Roadmap',   cls:'tds-road'   },
  };
  var QORDER      = { completed:0, Q1:1, Q2:2, Q3:3, Q4:4, Future:5 };
  var LS_KEY      = 'tds_link_overrides_v1';
  var EDIT_LABELS = { opifUrl:'OPIF', brdUrl:'BRD', prdUrl:'PRD', uxDemoUrl:'UX Demo' };

  // ── Column definitions ───────────────────────────────────
  var COLS = [
    { id:'workstream', label:'Workstream', w:108, sticky:true, render: function(r) {
        var w = WS_CFG[r.workstream] || WS_CFG.strategy;
        return '<span class="tds-ws" style="background:'+w.bg+';color:'+w.color+'">'+w.emoji+' '+w.label+'</span>';
    }},
    { id:'title', label:'Program', w:195, sticky:true, render: function(r) {
        return '<span class="tds-title" title="'+_esc(r.title)+'">'+r.icon+' '+_esc(r.title)+'</span>';
    }},
    { id:'status', label:'Status', w:88, render: function(r) {
        var s = ST_CFG[r.status] || ST_CFG.roadmap;
        return '<span class="tds-badge '+s.cls+'">'+s.label+'</span>';
    }},
    { id:'phase', label:'Ph', w:46, center:true, render: function(r) {
        return '<span class="tds-phase">P'+r.phase+'</span>';
    }},
    { id:'quarter', label:'Quarter', w:82, render: function(r) {
        var m={completed:'✅ Done',Q1:'Q1 FY27',Q2:'Q2 FY27',Q3:'Q3 FY27',Q4:'Q4 FY27',Future:'Future'};
        return '<span class="tds-q">'+(m[r.quarter]||r.quarter)+'</span>';
    }},
    { id:'targetDate', label:'Target Date', w:100, render: function(r) { return _cell(r.targetDate); }},
    { id:'tag', label:'Tag', w:90, render: function(r) {
        return r.tag ? '<span class="tds-tag">'+_esc(r.tag)+'</span>' : '<span class="tds-nd">—</span>';
    }},
    { id:'description',      label:'Description',      w:220, render: function(r) { return _long(r.description);      }},
    { id:'businessBenefit',  label:'Business Benefit',  w:220, render: function(r) { return _long(r.businessBenefit);  }},
    { id:'techIntegration',  label:'Tech Integration',  w:220, render: function(r) { return _long(r.techIntegration);  }},
    { id:'successMetrics',   label:'Success Metrics',   w:200, render: function(r) { return _long(r.successMetrics);   }},
    { id:'bp', label:'Business Partner',    w:140, render: function(r) { return _owner(r.bp, r.bpEmail); }},
    { id:'tl', label:'Transformation Lead', w:140, render: function(r) { return _owner(r.tl, r.tlEmail); }},
    { id:'pl', label:'Product Lead',        w:140, render: function(r) { return _owner(r.pl, r.plEmail); }},
    { id:'ux', label:'UX Lead',             w:140, render: function(r) { return _owner(r.ux, r.uxEmail); }},
    { id:'sw', label:'Software Lead',       w:140, render: function(r) { return _owner(r.sw, r.swEmail); }},
    { id:'opif',      label:'OPIF',       w:110, center:true, render: function(r) { return _editLink(r,'opifUrl',  'OPIF',  'tds-ln-opif'); }},
    { id:'brd',       label:'BRD',        w:100, center:true, render: function(r) { return _editLink(r,'brdUrl',   'BRD',   'tds-ln-brd');  }},
    { id:'prd',       label:'PRD',        w:100, center:true, render: function(r) { return _editLink(r,'prdUrl',   'PRD',   'tds-ln-prd');  }},
    { id:'uxDemo',    label:'UX Demo',    w:100, center:true, render: function(r) { return _editLink(r,'uxDemoUrl','Demo',  'tds-ln-demo'); }},
    { id:'confluence',label:'Confluence', w:110, center:true, render: function(r) { return _editLink(r,'confUrl',  'Source','tds-ln-conf'); }},
  ];

  // ── LocalStorage helpers ─────────────────────────────────
  function _loadOv() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch(e) { return {}; }
  }
  function _saveOv(id, field, url) {
    var d = _loadOv();
    if (!d[id]) d[id] = {};
    if (url) d[id][field] = url; else delete d[id][field];
    if (!Object.keys(d[id]).length) delete d[id];
    try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch(e) {}
  }
  function _getUrl(id, field, raw) {
    var ov = _loadOv(); return (ov[id] && ov[id][field]) || raw || null;
  }

  // ── State ────────────────────────────────────────────────
  var _rows=[], _search='', _wsF='all', _stF='all', _qF='all';
  var _sortId='quarter', _sortDir='asc', _inited=false;

  // ── Public entry ─────────────────────────────────────────
  window.initDataTab = function () {
    if (_inited) { _refresh(); return; }
    _inited = true;
    _rows = _flatten();
    document.getElementById('tab-data').innerHTML = _shell();
    _bind();
    _refresh();
  };

  // ── Flatten PILLARS ──────────────────────────────────────
  function _flatten() {
    var out = [];
    (window.PILLARS || []).forEach(function(pillar) {
      var ws = pillar.id;
      (pillar.cards || []).forEach(function(c) {
        var o = c.owners || {}, res = c.resources || {};
        var bp = o.businessPartner    || {}, tl = o.transformationLead || {};
        var pl = o.productLead        || {}, ux = o.uxLead             || {};
        var sw = o.softwareLead       || {};
        var ph = (typeof CARD_PHASE_MAP !== 'undefined' && CARD_PHASE_MAP[c.id]) || 1;
        var anchor = (WS_CFG[ws] || {}).anchor || '';
        function raw(v) { return (v && v !== '#') ? v : null; }
        out.push({
          id:c.id, workstream:ws, phase:ph, icon:c.icon||'📌',
          title:c.title||'', status:c.status||'roadmap',
          quarter:c.quarter||'Future', targetDate:c.targetDate||'', tag:c.tag||'',
          description:c.description||'', businessBenefit:c.businessBenefit||'',
          techIntegration:c.techIntegration||'', successMetrics:c.successMetrics||'',
          bp:bp.name||'', bpEmail:bp.email||'', tl:tl.name||'', tlEmail:tl.email||'',
          pl:pl.name||'', plEmail:pl.email||'', ux:ux.name||'', uxEmail:ux.email||'',
          sw:sw.name||'', swEmail:sw.email||'',
          opifUrl:raw(res.opif), brdUrl:raw(res.brd), prdUrl:raw(res.prd),
          uxDemoUrl:raw(res.uxDemo), confUrl:CONF_BASE+anchor,
        });
      });
    });
    return out;
  }

  // ── Shell HTML ───────────────────────────────────────────
  function _shell() {
    return '<div class="tds-wrap">'+
      '<div class="tds-bar">'+
        '<div class="tds-bar-l">'+
          '<span class="tds-bar-title">📊 Programs &amp; Deliverables</span>'+
          '<span id="tds-count" class="tds-count"></span>'+
        '</div>'+
        '<div class="tds-bar-r">'+
          '<input id="tds-search" class="tds-search" type="search" placeholder="🔍 Search...">'+
          '<select id="tds-ws" class="tds-sel">'+
            '<option value="all">All Workstreams</option>'+
            '<option value="strategy">Strategy</option><option value="design">Design</option>'+
            '<option value="buying">Buying</option><option value="allocation">Allocation</option>'+
          '</select>'+
          '<select id="tds-st" class="tds-sel">'+
            '<option value="all">All Statuses</option><option value="green">On Track</option>'+
            '<option value="yellow">At Risk</option><option value="red">Off Track</option>'+
            '<option value="completed">Completed</option><option value="roadmap">Roadmap</option>'+
          '</select>'+
          '<select id="tds-q" class="tds-sel">'+
            '<option value="all">All Quarters</option><option value="completed">Completed</option>'+
            '<option value="Q1">Q1 FY27</option><option value="Q2">Q2 FY27</option>'+
            '<option value="Q3">Q3 FY27</option><option value="Q4">Q4 FY27</option>'+
            '<option value="Future">Future</option>'+
          '</select>'+
          '<button id="tds-viewall" class="tds-viewall-btn">📋 Full View</button>'+
        '</div>'+
      '</div>'+
      '<p class="tds-hint">✏️ Click the pencil on any OPIF / BRD / PRD cell to set or correct the link. Saves to your browser.</p>'+
      '<div class="tds-scroll">'+
        '<table class="tds-tbl"><thead><tr id="tds-head"></tr></thead><tbody id="tds-body"></tbody></table>'+
      '</div>'+
      '<p class="tds-foot">📄 <a href="'+CONF_BASE+'" target="_blank" rel="noopener">APREC — LLTT Dashboard</a>'+
        ' · Hover any cell for full text · Click a row to open the detail card</p>'+
    '</div>';
  }

  // ── Event binding ────────────────────────────────────────
  function _bind() {
    function $(id) { return document.getElementById(id); }
    $('tds-search').addEventListener('input',  function(e){ _search=e.target.value.toLowerCase(); _refresh(); });
    $('tds-ws'    ).addEventListener('change', function(e){ _wsF=e.target.value; _refresh(); });
    $('tds-st'    ).addEventListener('change', function(e){ _stF=e.target.value; _refresh(); });
    $('tds-q'     ).addEventListener('change', function(e){ _qF=e.target.value;  _refresh(); });
    $('tds-viewall').addEventListener('click', _openModal);
    $('tds-head'  ).addEventListener('click', function(e) {
      var th = e.target.closest('th[data-col]'); if (!th) return;
      _sortDir = (_sortId===th.dataset.col && _sortDir==='asc') ? 'desc' : 'asc';
      _sortId  = th.dataset.col; _refresh();
    });
    $('tds-body').addEventListener('click', function(e) {
      var eb = e.target.closest('.tds-edit-btn');
      if (eb) { e.stopPropagation(); _openPopover(eb); return; }
      if (e.target.closest('a')) return;
      var tr = e.target.closest('tr[data-id]');
      if (tr && typeof openCardModal==='function') openCardModal(tr.dataset.id);
    });
    // Close popover when clicking elsewhere
    document.addEventListener('click', function(e) {
      var pop = document.getElementById('tds-popover');
      if (pop && !pop.contains(e.target) && !e.target.closest('.tds-edit-btn')) pop.remove();
    });
  }

  // ── Filter / sort / refresh ──────────────────────────────
  function _refresh() {
    var vis = _sorted(_filtered());
    _head(); _body(vis);
    var el = document.getElementById('tds-count');
    if (el) el.textContent = vis.length+' / '+_rows.length+' programs';
  }
  function _filtered() {
    return _rows.filter(function(r) {
      if (_wsF!=='all' && r.workstream!==_wsF) return false;
      if (_stF!=='all' && r.status!==_stF)     return false;
      if (_qF !=='all' && r.quarter!==_qF)     return false;
      if (_search) {
        var hay=[r.title,r.description,r.bp,r.tl,r.pl,r.ux,r.sw].join(' ').toLowerCase();
        if (hay.indexOf(_search)===-1) return false;
      }
      return true;
    });
  }
  function _sorted(rows) {
    var id=_sortId, dir=_sortDir==='asc'?1:-1;
    return rows.slice().sort(function(a,b) {
      var av=id==='quarter'?(QORDER[a.quarter]||9):(a[id]||'').toString().toLowerCase();
      var bv=id==='quarter'?(QORDER[b.quarter]||9):(b[id]||'').toString().toLowerCase();
      return av<bv?-dir:av>bv?dir:0;
    });
  }

  // ── Table rendering ──────────────────────────────────────
  function _head() {
    var left=0;
    document.getElementById('tds-head').innerHTML = COLS.map(function(c) {
      var arrow=_sortId===c.id?(_sortDir==='asc'?'▲':'▼'):'<span class="tds-sh">↕</span>';
      var st=c.sticky?'position:sticky;left:'+left+'px;z-index:3;background:#1e293b;':'';
      if (c.sticky) left+=c.w;
      return '<th data-col="'+c.id+'" style="'+st+(c.center?'text-align:center;':'')+
        'min-width:'+c.w+'px;width:'+c.w+'px">'+c.label+' '+arrow+'</th>';
    }).join('');
  }
  function _body(rows) {
    if (!rows.length) {
      document.getElementById('tds-body').innerHTML=
        '<tr><td colspan="'+COLS.length+'" class="tds-empty">No programs match the filters.</td></tr>';
      return;
    }
    document.getElementById('tds-body').innerHTML=rows.map(_row).join('');
  }
  function _row(r) {
    var left=0;
    var cells=COLS.map(function(c) {
      var isShadow=c.sticky&&(left+c.w)===303;
      var st=c.sticky?'position:sticky;left:'+left+'px;z-index:1;background:inherit;':'';
      if (c.sticky) left+=c.w;
      return '<td style="'+st+(c.center?'text-align:center;':'')+(isShadow?'box-shadow:3px 0 8px rgba(0,0,0,0.09);':'')+'">'+c.render(r)+'</td>';
    }).join('');
    return '<tr data-id="'+r.id+'" class="tds-row">'+cells+'</tr>';
  }

  // ── Cell helpers ─────────────────────────────────────────
  function _esc(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function _cell(s) {
    var v=(s||'').trim();
    return v?'<span title="'+_esc(v)+'">'+_esc(v)+'</span>':'<span class="tds-nd">—</span>';
  }
  function _long(s) {
    var v=(s||'').trim();
    return v?'<span class="tds-text" title="'+_esc(v)+'">'+_esc(v)+'</span>':'<span class="tds-nd">—</span>';
  }
  function _owner(name, email) {
    if (!name||name==='TBD') return '<span class="tds-nd">TBD</span>';
    var e=email?'<br><a class="tds-own-email" href="mailto:'+_esc(email)+'">'+_esc(email)+'</a>':'';
    return '<span class="tds-own-name">'+_esc(name)+'</span>'+e;
  }
  function _editLink(r, field, label, cls) {
    var url=_getUrl(r.id, field, r[field]);
    var eb='<button class="tds-edit-btn" data-id="'+_esc(r.id)+'" data-field="'+_esc(field)+'" title="Edit '+_esc(label)+' link">✏️</button>';
    if (url) return '<a href="'+_esc(url)+'" target="_blank" rel="noopener" class="tds-ln '+cls+'">'+label+' →</a>'+eb;
    return eb+'<span class="tds-set-label">Set '+label+'</span>';
  }

  // ── Edit URL popover (all DOM, no inline onclick) ────────
  function _openPopover(btn) {
    var existing = document.getElementById('tds-popover');
    if (existing) {
      var same = existing.dataset.btnId===btn.dataset.id+btn.dataset.field;
      existing.remove();
      if (same) return;
    }
    var cardId=btn.dataset.id, field=btn.dataset.field;
    var label=EDIT_LABELS[field]||field;
    var current=_getUrl(cardId, field, '');
    var rect=btn.getBoundingClientRect();

    var pop=document.createElement('div');
    pop.id='tds-popover';
    pop.dataset.btnId=cardId+field;
    pop.className='tds-popover';
    pop.style.cssText='position:fixed;top:'+(rect.bottom+8)+'px;left:'+
      Math.min(Math.max(8,rect.left-80),window.innerWidth-360)+'px;z-index:10001;';

    // Title
    var title=document.createElement('div'); title.className='tds-pop-title';
    title.textContent='✏️ Edit '+label+' Link';

    // Input
    var inp=document.createElement('input'); inp.type='url'; inp.className='tds-pop-input';
    inp.placeholder='https://...'; inp.value=current||'';

    // Hint
    var hint=document.createElement('div'); hint.className='tds-pop-hint';
    hint.textContent='Paste the correct URL. Saves to your browser automatically.';

    // Buttons
    var row=document.createElement('div'); row.className='tds-pop-btns';
    var saveBtn=document.createElement('button'); saveBtn.textContent='Save';         saveBtn.className='tds-pop-save';
    var clrBtn =document.createElement('button'); clrBtn.textContent='Clear';         clrBtn.className='tds-pop-clr';
    var canBtn =document.createElement('button'); canBtn.textContent='Cancel';        canBtn.className='tds-pop-can';
    row.appendChild(saveBtn); row.appendChild(clrBtn); row.appendChild(canBtn);

    pop.appendChild(title); pop.appendChild(inp); pop.appendChild(hint); pop.appendChild(row);
    document.body.appendChild(pop);
    inp.focus(); inp.select();

    function doSave() { _saveOv(cardId,field,inp.value.trim()); pop.remove(); _refresh(); }
    function doClear(){ _saveOv(cardId,field,'');                pop.remove(); _refresh(); }
    saveBtn.addEventListener('click', doSave);
    clrBtn.addEventListener ('click', doClear);
    canBtn.addEventListener ('click', function(){ pop.remove(); });
    inp.addEventListener    ('keydown', function(e){ if(e.key==='Enter') doSave(); if(e.key==='Escape') pop.remove(); });
  }

  // ── Full View modal (all DOM, no inline onclick) ─────────
  function _openModal() {
    if (document.getElementById('tds-modal-overlay')) {
      document.getElementById('tds-modal-overlay').remove(); return;
    }
    var vis=_sorted(_filtered());

    var overlay=document.createElement('div');
    overlay.id='tds-modal-overlay'; overlay.className='tds-overlay';

    var box=document.createElement('div'); box.className='tds-modal-box';

    // Header
    var hdr=document.createElement('div'); hdr.className='tds-modal-header';
    var htitle=document.createElement('span'); htitle.className='tds-modal-title';
    htitle.textContent='📋 All Programs & Deliverables — '+vis.length+' shown';
    var hbtns=document.createElement('div'); hbtns.style.cssText='display:flex;gap:8px;align-items:center;';
    var exportBtn=document.createElement('button'); exportBtn.textContent='📤 Export Link Fixes'; exportBtn.className='tds-export-btn';
    var closeBtn=document.createElement('button');  closeBtn.textContent='✕ Close';               closeBtn.className='tds-modal-close';
    hbtns.appendChild(exportBtn); hbtns.appendChild(closeBtn);
    hdr.appendChild(htitle); hdr.appendChild(hbtns);

    // Hint bar
    var hint=document.createElement('p'); hint.className='tds-modal-hint';
    hint.textContent='Click ✏️ to correct any OPIF / BRD / PRD link. Full text visible — no truncation.';

    // Scrollable table
    var scroll=document.createElement('div'); scroll.className='tds-modal-scroll';
    var headCells=COLS.map(function(c){
      return '<th style="min-width:'+c.w+'px;'+(c.center?'text-align:center;':'')+'">'+c.label+'</th>';
    }).join('');
    var bodyRows=vis.map(function(r){
      var cells=COLS.map(function(c){
        return '<td style="'+(c.center?'text-align:center;':'')+' vertical-align:top;">'+c.render(r)+'</td>';
      }).join('');
      return '<tr class="tds-row tds-modal-row" data-id="'+r.id+'">'+cells+'</tr>';
    }).join('');
    scroll.innerHTML='<table class="tds-tbl tds-modal-tbl"><thead><tr>'+headCells+'</tr></thead><tbody>'+bodyRows+'</tbody></table>';

    box.appendChild(hdr); box.appendChild(hint); box.appendChild(scroll);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Wire events — no inline handlers
    closeBtn.addEventListener('click', function(){ overlay.remove(); });
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
    exportBtn.addEventListener('click', _exportFixes);
    scroll.addEventListener('click', function(e){
      var eb=e.target.closest('.tds-edit-btn');
      if (eb) { e.stopPropagation(); _openPopover(eb); }
    });
  }

  // ── Export link fixes (pure DOM, no innerHTML for buttons) ─
  function _exportFixes() {
    var existing=document.getElementById('tds-fixes-modal');
    if (existing) { existing.remove(); return; }
    var ov=_loadOv(), keys=Object.keys(ov);

    var overlay=document.createElement('div');
    overlay.id='tds-fixes-modal';
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10002;'+
      'display:flex;align-items:center;justify-content:center;padding:20px;';

    var box=document.createElement('div');
    box.style.cssText='background:white;border-radius:16px;padding:24px;max-width:640px;width:100%;'+
      'max-height:80vh;overflow-y:auto;display:flex;flex-direction:column;gap:12px;';

    // Header row
    var hdr=document.createElement('div'); hdr.style.cssText='display:flex;justify-content:space-between;align-items:center;';
    var htitle=document.createElement('strong'); htitle.style.fontSize='0.9rem'; htitle.textContent='📤 Export Link Fixes';
    var xBtn=document.createElement('button'); xBtn.textContent='✕';
    xBtn.style.cssText='background:none;border:none;font-size:1.3rem;cursor:pointer;line-height:1;';
    hdr.appendChild(htitle); hdr.appendChild(xBtn);
    box.appendChild(hdr);

    if (!keys.length) {
      var msg=document.createElement('p');
      msg.style.cssText='color:#64748b;font-size:0.82rem;margin:0;';
      msg.textContent='No link overrides saved yet. Use the ✏️ buttons on any OPIF / BRD / PRD cell to start correcting links.';
      box.appendChild(msg);
    } else {
      var desc=document.createElement('p');
      desc.style.cssText='font-size:0.75rem;color:#475569;margin:0;';
      desc.textContent=keys.length+' program(s) with saved link corrections. Copy and apply to the matching res() call in data-*.js, then redeploy.';
      box.appendChild(desc);

      var lines=['// Paste these corrections into the matching res() call in each data-*.js file',''];
      keys.forEach(function(id){
        var row=_rows.find(function(r){ return r.id===id; });
        lines.push('// '+(row?row.title:id));
        Object.keys(ov[id]).forEach(function(f){ lines.push('   '+f+': "'+ov[id][f]+'"'); });
        lines.push('');
      });

      var ta=document.createElement('textarea');
      ta.style.cssText='width:100%;box-sizing:border-box;height:220px;font-size:0.72rem;'+
        'font-family:monospace;border:1px solid #e2e8f0;border-radius:8px;padding:10px;resize:vertical;';
      ta.value=lines.join('\n');
      box.appendChild(ta);

      var btnRow=document.createElement('div'); btnRow.style.cssText='display:flex;gap:8px;flex-wrap:wrap;';

      var copyBtn=document.createElement('button'); copyBtn.textContent='📋 Copy to Clipboard';
      copyBtn.style.cssText='padding:7px 16px;background:#0053e2;color:white;border:none;border-radius:8px;font-weight:700;font-size:0.76rem;cursor:pointer;';
      copyBtn.addEventListener('click', function(){
        ta.select();
        try { navigator.clipboard.writeText(ta.value).catch(function(){ document.execCommand('copy'); }); }
        catch(e) { document.execCommand('copy'); }
        copyBtn.textContent='✅ Copied!';
        setTimeout(function(){ copyBtn.textContent='📋 Copy to Clipboard'; },2000);
      });

      var clrBtn=document.createElement('button'); clrBtn.textContent='🗑 Clear All Overrides';
      clrBtn.style.cssText='padding:7px 16px;background:#fee2e2;color:#991b1b;border:none;border-radius:8px;font-weight:700;font-size:0.76rem;cursor:pointer;';
      clrBtn.addEventListener('click', function(){
        if (!confirm('Clear all saved link overrides? This cannot be undone.')) return;
        try { localStorage.removeItem(LS_KEY); } catch(e) {}
        overlay.remove(); _refresh();
      });

      btnRow.appendChild(copyBtn); btnRow.appendChild(clrBtn);
      box.appendChild(btnRow);
      setTimeout(function(){ ta.focus(); ta.select(); },50);
    }

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    xBtn.addEventListener('click', function(){ overlay.remove(); });
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
  }

}());