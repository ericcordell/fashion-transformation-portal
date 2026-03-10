// card-links.js — Per-card Links tab (READ-ONLY)
// Exposes: window.buildLinksTab(cardId, resources, workstreams)
// No editing, no localStorage — all links come directly from data files.
// Source of truth: https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard

(function () {

  var WS_CFG = {
    strategy:   { label: 'Strategy',   emoji: '\uD83C\uDFDB\uFE0F', color: '#37474f', bg: '#eceff1', border: '#90a4ae' },
    design:     { label: 'Design',     emoji: '\uD83C\uDFA8', color: '#0053e2', bg: '#eef2ff', border: '#93c5fd' },
    buying:     { label: 'Buying',     emoji: '\uD83D\uDED2', color: '#b86000', bg: '#fff8ed', border: '#fcd34d' },
    allocation: { label: 'Allocation', emoji: '\uD83D\uDCE6', color: '#1a1a6e', bg: '#eef0ff', border: '#a5b4fc' },
  };

  var LINK_DEFS = [
    { field: 'opif',   icon: '\uD83D\uDCCB', label: 'OPIF',    sublabel: 'Opportunity / Initiative Framework (Jira)' },
    { field: 'brd',    icon: '\uD83D\uDCDD', label: 'BRD',     sublabel: 'Business Requirements Document'           },
    { field: 'prd',    icon: '\uD83D\uDCE6', label: 'PRD',     sublabel: 'Product Requirements Document'             },
    { field: 'uxDemo', icon: '\uD83C\uDFA8', label: 'UX Demo', sublabel: 'Design & UX walkthrough / prototype'      },
  ];

  var DASHBOARD_URL = 'https://confluence.walmart.com/display/APREC/' +
    'Long+Lead+Time+Transformation+Work+Management+Dashboard';

  // ── Public entry ───────────────────────────────────────
  window.buildLinksTab = function (cardId, resources, workstreams) {
    var panel = document.getElementById('tab-links');
    if (!panel) return;
    panel.innerHTML = '';

    var wrap = _el('div', 'padding:20px 24px;display:flex;flex-direction:column;gap:14px;');

    // ── Source of truth banner ──
    var banner = _el('a',
      'display:flex;align-items:center;gap:10px;padding:9px 14px;' +
      'background:#eef2ff;border:1.5px solid #c7d2fe;border-radius:10px;' +
      'text-decoration:none;transition:background .15s;');
    banner.href   = DASHBOARD_URL;
    banner.target = '_blank';
    banner.rel    = 'noopener';
    var bIcon = _el('span', 'font-size:1.1rem;flex-shrink:0;');
    bIcon.textContent = '\uD83D\uDCC4';
    var bText = _el('div', 'flex:1;min-width:0;');
    var bTop  = _el('p', 'margin:0;font-size:0.74rem;font-weight:700;color:#0053e2;');
    bTop.textContent  = 'Source of Truth: LLTT Work Management Dashboard';
    var bSub  = _el('p', 'margin:2px 0 0;font-size:0.65rem;color:#4f46e5;');
    bSub.textContent  = 'confluence.walmart.com — APREC Space';
    bText.appendChild(bTop); bText.appendChild(bSub);
    var bArr = _el('span', 'font-size:0.75rem;color:#0053e2;flex-shrink:0;');
    bArr.textContent = '\u2192';
    banner.appendChild(bIcon); banner.appendChild(bText); banner.appendChild(bArr);
    wrap.appendChild(banner);

    // ── Workstream chips ──
    var ws = Array.isArray(workstreams) && workstreams.length ? workstreams : [];
    if (ws.length) {
      var wsWrap = _el('div', 'display:flex;flex-direction:column;gap:6px;');
      var wsLabel = _el('p',
        'margin:0;font-size:0.64rem;font-weight:800;text-transform:uppercase;' +
        'letter-spacing:.07em;color:#94a3b8;');
      wsLabel.textContent = 'Workstream(s)';
      var chips = _el('div', 'display:flex;flex-wrap:wrap;gap:6px;');
      ws.forEach(function (key) {
        var cfg = WS_CFG[key];
        if (!cfg) return;
        var chip = _el('span',
          'display:inline-flex;align-items:center;gap:5px;font-size:0.7rem;font-weight:700;' +
          'padding:4px 10px;border-radius:99px;border:1.5px solid ' + cfg.border + ';' +
          'background:' + cfg.bg + ';color:' + cfg.color + ';');
        chip.textContent = cfg.emoji + ' ' + cfg.label;
        chips.appendChild(chip);
      });
      wsWrap.appendChild(wsLabel); wsWrap.appendChild(chips);
      wrap.appendChild(wsWrap);
    }

    // ── Divider ──
    var div = _el('div', 'border-top:1px solid #f1f5f9;');
    wrap.appendChild(div);

    // ── Standard link rows ──
    var hasAnyLink = false;
    var res = resources || {};
    LINK_DEFS.forEach(function (def) {
      var url = _resolve(res[def.field]);
      if (!url) return;
      hasAnyLink = true;
      wrap.appendChild(_linkRow(def.icon, def.label, def.sublabel, url));
    });

    // ── Other / companion links ──
    var others = Array.isArray(res.other) ? res.other : [];
    if (others.length) {
      if (hasAnyLink) wrap.appendChild(_el('div', 'border-top:1px solid #f1f5f9;margin:2px 0;'));
      var othLabel = _el('p',
        'margin:0 0 6px;font-size:0.64rem;font-weight:800;text-transform:uppercase;' +
        'letter-spacing:.07em;color:#94a3b8;');
      othLabel.textContent = 'Related Resources';
      wrap.appendChild(othLabel);
      others.forEach(function (o) {
        if (!o || !o.url) return;
        wrap.appendChild(_linkRow('\uD83D\uDD17', o.label || 'Resource', '', o.url));
      });
      hasAnyLink = true;
    }

    // ── Empty state ──
    if (!hasAnyLink) {
      var empty = _el('div',
        'padding:28px;text-align:center;color:#94a3b8;font-size:0.8rem;' +
        'border:1.5px dashed #e2e8f0;border-radius:12px;');
      empty.innerHTML = '\uD83D\uDD17 No specific links yet for this deliverable.<br>' +
        '<span style="font-size:0.7rem;">See the LLTT Dashboard above for live OPIF status.</span>';
      wrap.appendChild(empty);
    }

    panel.appendChild(wrap);
  };

  // ── Build one read-only link row ───────────────────────
  function _linkRow(icon, label, sublabel, url) {
    var outer = _el('a',
      'display:flex;align-items:center;gap:12px;padding:11px 14px;' +
      'border:1.5px solid #e2e8f0;border-radius:12px;text-decoration:none;' +
      'transition:border-color .15s,background .15s;cursor:pointer;');
    outer.href   = url;
    outer.target = '_blank';
    outer.rel    = 'noopener';
    outer.addEventListener('mouseenter', function () {
      outer.style.borderColor = '#0053e2'; outer.style.background = '#f0f4ff';
    });
    outer.addEventListener('mouseleave', function () {
      outer.style.borderColor = '#e2e8f0'; outer.style.background = '';
    });

    var iconEl = _el('span', 'font-size:1.25rem;flex-shrink:0;');
    iconEl.textContent = icon;

    var info = _el('div', 'flex:1;min-width:0;');
    var lbl  = _el('p', 'margin:0;font-size:0.82rem;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;');
    lbl.textContent = label;
    info.appendChild(lbl);

    if (sublabel) {
      var sub = _el('p', 'margin:2px 0 0;font-size:0.68rem;color:#94a3b8;');
      sub.textContent = sublabel;
      info.appendChild(sub);
    }

    // Show short domain for context
    try {
      var host = new URL(url).hostname.replace('www.','');
      var domain = _el('p', 'margin:2px 0 0;font-size:0.64rem;color:#c7d2fe;font-family:monospace;');
      domain.textContent = host;
      info.appendChild(domain);
    } catch (e) {}

    var arr = _el('span', 'font-size:0.78rem;color:#0053e2;flex-shrink:0;font-weight:700;');
    arr.textContent = '\u2192';

    outer.appendChild(iconEl); outer.appendChild(info); outer.appendChild(arr);
    return outer;
  }

  // ── Resolve placeholder URLs to null ──────────────────
  function _resolve(url) {
    if (!url || url === '#' || url.trim() === '') return null;
    return url.trim();
  }

  // ── Mini DOM helper ───────────────────────────────────
  function _el(tag, css) {
    var el = document.createElement(tag);
    if (css) el.style.cssText = css;
    return el;
  }

}());