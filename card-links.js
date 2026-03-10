// card-links.js — Per-card link editor tab
// Exposes: window.buildLinksTab(cardId, resources)
// Saves edits to localStorage (portal_links_v1)
// ZERO inline onclick / no globals polluted beyond the one public function

(function () {

  var LS_KEY = 'portal_links_v1';

  var LINK_DEFS = [
    { field: 'opif',   icon: '\uD83D\uDCCB', label: 'OPIF',            sublabel: 'Opportunity / Initiative Framework' },
    { field: 'brd',    icon: '\uD83D\uDCDD', label: 'BRD',             sublabel: 'Business Requirements Document'     },
    { field: 'prd',    icon: '\uD83D\uDCE6', label: 'PRD',             sublabel: 'Product Requirements Document'       },
    { field: 'uxDemo', icon: '\uD83C\uDFA8', label: 'UX Demo',         sublabel: 'Design & UX walkthrough / prototype' },
  ];

  // ── localStorage helpers ───────────────────────────────
  function _load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { return {}; }
  }
  function _save(cardId, field, url) {
    var d = _load();
    if (!d[cardId]) d[cardId] = {};
    if (url) {
      d[cardId][field] = url;
    } else {
      delete d[cardId][field];
      if (!Object.keys(d[cardId]).length) delete d[cardId];
    }
    try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch (e) {}
  }
  function _getUrl(cardId, field, dataUrl) {
    var d = _load();
    return (d[cardId] && d[cardId][field]) || dataUrl || null;
  }

  // ── Public entry ───────────────────────────────────────
  // Call this from openModal() after switching to the links tab.
  // It builds the tab content and wires all interactions.
  window.buildLinksTab = function (cardId, resources) {
    var panel = document.getElementById('tab-links');
    if (!panel) return;

    // Clear and rebuild
    panel.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'padding:20px 24px;display:flex;flex-direction:column;gap:10px;';

    // Hint bar
    var hint = document.createElement('p');
    hint.style.cssText = 'margin:0 0 6px;font-size:0.72rem;color:#64748b;' +
      'background:#fffbf0;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;';
    hint.innerHTML = '\u270F\uFE0F Click <strong>Edit</strong> on any row to set or correct the link. ' +
      'Changes are saved to your browser.';
    wrap.appendChild(hint);

    // One row per link type
    LINK_DEFS.forEach(function (def) {
      var row = _buildRow(cardId, def, (resources || {})[def.field] || null);
      wrap.appendChild(row);
    });

    // Extra "other" links from data (read-only, no edit needed)
    var others = (resources && resources.other) ? resources.other : [];
    if (others.length) {
      var sep = document.createElement('div');
      sep.style.cssText = 'font-size:0.66rem;font-weight:800;text-transform:uppercase;' +
        'letter-spacing:.06em;color:#94a3b8;padding:4px 0 2px;';
      sep.textContent = 'Additional Resources';
      wrap.appendChild(sep);
      others.forEach(function (o) {
        wrap.appendChild(_buildStaticRow('\uD83D\uDD17', o.label, 'Additional resource', o.url));
      });
    }

    panel.appendChild(wrap);
  };

  // ── Build one editable link row ────────────────────────
  function _buildRow(cardId, def, dataUrl) {
    var outer = document.createElement('div');
    outer.style.cssText = 'border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;' +
      'transition:border-color .15s;';

    // ── Display mode ──
    var display = document.createElement('div');
    display.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px 14px;';

    var iconEl = document.createElement('span');
    iconEl.style.cssText = 'font-size:1.3rem;flex-shrink:0;';
    iconEl.textContent = def.icon;

    var info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0;';
    var labelEl = document.createElement('p');
    labelEl.style.cssText = 'margin:0;font-size:0.82rem;font-weight:700;color:#1e293b;';
    labelEl.textContent = def.label;
    var sublabelEl = document.createElement('p');
    sublabelEl.style.cssText = 'margin:2px 0 0;font-size:0.7rem;color:#94a3b8;';
    sublabelEl.textContent = def.sublabel;
    info.appendChild(labelEl);
    info.appendChild(sublabelEl);

    var linkArea = document.createElement('div');
    linkArea.style.cssText = 'display:flex;align-items:center;gap:8px;flex-shrink:0;';

    var linkEl = document.createElement('a');
    linkEl.style.cssText = 'font-size:0.72rem;font-weight:600;padding:4px 10px;' +
      'border-radius:7px;text-decoration:none;transition:opacity .15s;white-space:nowrap;';

    var editBtn = document.createElement('button');
    editBtn.textContent = '\u270F\uFE0F Edit';
    editBtn.style.cssText = 'font-size:0.7rem;font-weight:600;padding:4px 10px;' +
      'border:1.5px solid #e2e8f0;border-radius:7px;background:white;color:#64748b;' +
      'cursor:pointer;transition:border-color .15s,color .15s;white-space:nowrap;';
    editBtn.addEventListener('mouseenter', function () {
      editBtn.style.borderColor = '#0053e2'; editBtn.style.color = '#0053e2';
    });
    editBtn.addEventListener('mouseleave', function () {
      editBtn.style.borderColor = '#e2e8f0'; editBtn.style.color = '#64748b';
    });

    linkArea.appendChild(linkEl);
    linkArea.appendChild(editBtn);

    display.appendChild(iconEl);
    display.appendChild(info);
    display.appendChild(linkArea);

    // ── Edit mode ──
    var editRow = document.createElement('div');
    editRow.style.cssText = 'display:none;padding:10px 14px 12px;' +
      'border-top:1.5px solid #e2e8f0;background:#f8fafc;';

    var inp = document.createElement('input');
    inp.type = 'url';
    inp.placeholder = 'https://jira.walmart.com/browse/OPIF-...';
    inp.style.cssText = 'width:100%;box-sizing:border-box;height:34px;padding:0 10px;' +
      'border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.78rem;outline:none;' +
      'margin-bottom:8px;';
    inp.addEventListener('focus', function () { inp.style.borderColor = '#0053e2'; });
    inp.addEventListener('blur',  function () { inp.style.borderColor = '#e2e8f0'; });

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;';

    var saveBtn  = _btn('Save',   '#0053e2', 'white');
    var clearBtn = _btn('Clear',  '#fee2e2', '#991b1b');
    var cancelBtn= _btn('Cancel', '#f1f5f9', '#475569');
    btnRow.appendChild(saveBtn);
    btnRow.appendChild(clearBtn);
    btnRow.appendChild(cancelBtn);

    var savedNotice = document.createElement('span');
    savedNotice.style.cssText = 'font-size:0.7rem;color:#2a8703;margin-left:6px;' +
      'opacity:0;transition:opacity .3s;';
    savedNotice.textContent = '\u2713 Saved';
    btnRow.appendChild(savedNotice);

    editRow.appendChild(inp);
    editRow.appendChild(btnRow);

    outer.appendChild(display);
    outer.appendChild(editRow);

    // ── Internal refresh ──
    // Re-reads localStorage and updates the display link element
    function _syncDisplay() {
      var url = _getUrl(cardId, def.field, dataUrl);
      if (url) {
        linkEl.href        = url;
        linkEl.target      = '_blank';
        linkEl.rel         = 'noopener';
        linkEl.textContent = def.label + ' \u2192';
        linkEl.style.background   = '#eef2ff';
        linkEl.style.color        = '#0053e2';
        linkEl.style.pointerEvents = 'auto';
        outer.style.borderColor   = '#c7d2fe';
      } else {
        linkEl.removeAttribute('href');
        linkEl.removeAttribute('target');
        linkEl.textContent = '\u2014 Not set';
        linkEl.style.background   = 'transparent';
        linkEl.style.color        = '#94a3b8';
        linkEl.style.pointerEvents = 'none';
        outer.style.borderColor   = '#e2e8f0';
      }
    }

    function _openEdit() {
      inp.value = _getUrl(cardId, def.field, dataUrl) || '';
      editRow.style.display = '';
      outer.style.borderColor = '#0053e2';
      editBtn.style.display = 'none';
      inp.focus();
      inp.select();
    }

    function _closeEdit() {
      editRow.style.display = 'none';
      editBtn.style.display = '';
      _syncDisplay();
    }

    function _doSave() {
      var url = inp.value.trim();
      _save(cardId, def.field, url);
      // Flash the saved notice
      savedNotice.style.opacity = '1';
      setTimeout(function () { savedNotice.style.opacity = '0'; }, 1800);
      _closeEdit();
    }

    function _doClear() {
      if (!confirm('Remove the saved link for ' + def.label + '?')) return;
      _save(cardId, def.field, '');
      _closeEdit();
    }

    editBtn.addEventListener  ('click',   _openEdit);
    saveBtn.addEventListener  ('click',   _doSave);
    clearBtn.addEventListener ('click',   _doClear);
    cancelBtn.addEventListener('click',   _closeEdit);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter')  _doSave();
      if (e.key === 'Escape') _closeEdit();
    });

    _syncDisplay(); // initial render
    return outer;
  }

  // ── Static read-only row (for res.other links) ─────────
  function _buildStaticRow(icon, label, sublabel, url) {
    var outer = document.createElement('div');
    outer.style.cssText = 'display:flex;align-items:center;gap:12px;padding:11px 14px;' +
      'border:1.5px solid #e2e8f0;border-radius:12px;';

    var iconEl = document.createElement('span');
    iconEl.style.fontSize = '1.2rem'; iconEl.textContent = icon;

    var info = document.createElement('div'); info.style.flex = '1';
    var l = document.createElement('p');
    l.style.cssText = 'margin:0;font-size:0.8rem;font-weight:600;color:#1e293b;';
    l.textContent = label;
    var s = document.createElement('p');
    s.style.cssText = 'margin:2px 0 0;font-size:0.69rem;color:#94a3b8;';
    s.textContent = sublabel;
    info.appendChild(l); info.appendChild(s);

    var link = document.createElement('a');
    link.href = url; link.target = '_blank'; link.rel = 'noopener';
    link.textContent = 'Open \u2192';
    link.style.cssText = 'font-size:0.72rem;font-weight:600;color:#0053e2;' +
      'padding:4px 10px;border-radius:7px;background:#eef2ff;text-decoration:none;white-space:nowrap;';

    outer.appendChild(iconEl); outer.appendChild(info); outer.appendChild(link);
    return outer;
  }

  // ── Small button factory ───────────────────────────────
  function _btn(text, bg, color) {
    var b = document.createElement('button');
    b.textContent = text;
    b.style.cssText = 'padding:5px 14px;border:none;border-radius:7px;font-size:0.73rem;' +
      'font-weight:700;cursor:pointer;background:' + bg + ';color:' + color + ';';
    return b;
  }

}());