// summary-modal.js — workstream header summary popout
// Opens when user clicks a pillar header.
// Globals from data.js: PILLARS, QUARTER_META, QUARTER_ORDER, PILLAR_GRADIENTS, BADGE_CLASS

(function () {

  // ---- Status visual config ----
  const SCFG = {
    completed: { color: '#0053e2', bg: '#eef2ff', label: 'Completed' },
    green:     { color: '#2a8703', bg: '#f0faf0', label: 'Active'    },
    yellow:    { color: '#d97706', bg: '#fffbeb', label: 'At Risk'   },
    red:       { color: '#ea1100', bg: '#fff0f0', label: 'Blocked'   },
    roadmap:   { color: '#64748b', bg: '#f1f5f9', label: 'Planned'   },
  };

  const STATUS_ORDER = ['completed', 'green', 'yellow', 'red', 'roadmap'];

  // ---- PUBLIC ----
  window.openSummaryModal = function (pillarId) {
    const p = PILLARS.find(function (x) { return x.id === pillarId; });
    if (!p) return;

    const gradient = PILLAR_GRADIENTS[p.headerClass] || PILLAR_GRADIENTS['pillar-dark'];
    document.getElementById('sm-header').style.background = gradient;
    document.getElementById('sm-title').textContent    = p.title + ' — Status Summary';
    document.getElementById('sm-subtitle').textContent = p.subtitle + ' \u00b7 ' + p.tool;
    document.getElementById('sm-body').innerHTML       = _buildBody(p);
    document.getElementById('sm-overlay').classList.add('open');
  };

  window.closeSummaryModal = function () {
    document.getElementById('sm-overlay').classList.remove('open');
  };

  // ---- BODY BUILDER ----
  function _buildBody(p) {
    const cards = p.cards;
    const total = cards.length;

    // Count by status
    const counts = {};
    STATUS_ORDER.forEach(function (s) { counts[s] = 0; });
    cards.forEach(function (c) {
      if (counts[c.status] !== undefined) counts[c.status]++;
      else counts['roadmap']++;
    });

    // Overall health signal
    const health = counts.red   > 0 ? { icon: '\uD83D\uDD34', label: 'Attention Needed', color: '#ea1100', bg: '#fff0f0', border: '#fca5a5' }
                 : counts.yellow > 0 ? { icon: '\uD83D\uDFE1', label: 'Mostly On Track',  color: '#d97706', bg: '#fffbeb', border: '#fcd34d' }
                 :                     { icon: '\uD83D\uDFE2', label: 'On Track',          color: '#2a8703', bg: '#f0faf0', border: '#86efac' };

    return [
      _sectionHealth(health, counts, total),
      _sectionStatusBar(counts, total),
      _sectionByQuarter(p),
    ].join('');
  }

  // ---- SECTION: overall health pill + stat chips ---- 
  function _sectionHealth(health, counts, total) {
    const chips = STATUS_ORDER.map(function (s) {
      if (!counts[s]) return '';
      const sc = SCFG[s];
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 16px;'
        + 'border-radius:12px;background:' + sc.bg + ';border:1px solid ' + sc.color + '20;">'
        + '<span style="font-size:1.35rem;font-weight:800;color:' + sc.color + ';">' + counts[s] + '</span>'
        + '<span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:' + sc.color + ';white-space:nowrap;">' + sc.label + '</span>'
        + '</div>';
    }).join('');

    return '<div style="padding:18px 22px 14px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">'
      + '<p style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin:0;">Overall Health</p>'
      + '<span style="font-size:0.72rem;font-weight:600;color:#64748b;">' + total + ' total deliverables</span>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;'
      + 'background:' + health.bg + ';border:1.5px solid ' + health.border + ';margin-bottom:14px;">'
      + '<span style="font-size:1.3rem;">' + health.icon + '</span>'
      + '<span style="font-weight:700;font-size:0.92rem;color:' + health.color + ';">' + health.label + '</span>'
      + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + chips + '</div>'
      + '</div>';
  }

  // ---- SECTION: stacked status bar ----
  function _sectionStatusBar(counts, total) {
    const segments = STATUS_ORDER.map(function (s) {
      if (!counts[s]) return '';
      const pct = Math.round((counts[s] / total) * 100);
      return '<div title="' + SCFG[s].label + ': ' + counts[s] + '" style="flex:' + counts[s] + ';min-width:4px;'
        + 'background:' + SCFG[s].color + ';height:100%;transition:flex .3s;"></div>';
    }).join('');

    const legend = STATUS_ORDER.map(function (s) {
      if (!counts[s]) return '';
      return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.68rem;font-weight:600;color:#64748b;">'
        + '<span style="width:8px;height:8px;border-radius:2px;background:' + SCFG[s].color + ';display:inline-block;"></span>'
        + counts[s] + ' ' + SCFG[s].label + '</span>';
    }).join('');

    return '<div style="padding:0 22px 16px;border-bottom:1px solid #f1f5f9;">'
      + '<div style="height:10px;border-radius:99px;overflow:hidden;display:flex;gap:2px;margin-bottom:8px;">'
      + segments + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:10px;">' + legend + '</div>'
      + '</div>';
  }

  // ---- SECTION: by-quarter breakdown ----
  function _sectionByQuarter(p) {
    const cards = p.cards;
    const activeQs = QUARTER_ORDER.filter(function (q) {
      return cards.some(function (c) { return c.quarter === q; });
    });

    const sections = activeQs.map(function (q) {
      const qCards = cards.filter(function (c) { return c.quarter === q; });
      const m      = QUARTER_META[q] || QUARTER_META['Future'];

      // Mini status tally for this quarter
      const qCounts = {};
      STATUS_ORDER.forEach(function (s) { qCounts[s] = 0; });
      qCards.forEach(function (c) {
        if (qCounts[c.status] !== undefined) qCounts[c.status]++;
      });

      // One-line summary sentence
      const parts = [];
      if (qCounts.completed) parts.push(qCounts.completed + ' completed');
      if (qCounts.green)     parts.push(qCounts.green + ' active');
      if (qCounts.yellow)    parts.push(qCounts.yellow + ' at risk');
      if (qCounts.red)       parts.push(qCounts.red + ' blocked');
      if (qCounts.roadmap)   parts.push(qCounts.roadmap + ' planned');
      const summary = parts.join(', ');

      const rows = qCards.map(function (c) {
        const sc = SCFG[c.status] || SCFG.roadmap;
        return '<div class="sm-card-row">'
          + '<span style="font-size:1.1rem;flex-shrink:0;">' + c.icon + '</span>'
          + '<span style="font-size:0.82rem;font-weight:600;color:#1e293b;flex:1;line-height:1.3;">' + c.title + '</span>'
          + '<span class="badge badge-' + (c.status === 'green' ? 'green' : c.status === 'completed' ? 'completed' : c.status === 'yellow' ? 'yellow' : c.status === 'red' ? 'red' : 'roadmap') + '" style="flex-shrink:0;">'
          + c.statusLabel + '</span>'
          + '</div>';
      }).join('');

      return '<div style="padding:16px 22px;border-bottom:1px solid #f1f5f9;">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">'
        + '<span style="display:inline-flex;align-items:center;gap:5px;font-size:0.7rem;font-weight:800;'
        + 'text-transform:uppercase;letter-spacing:.06em;padding:3px 10px;border-radius:99px;'
        + 'background:' + m.bg + ';color:' + m.color + ';border:1.5px solid ' + m.border + ';">' + m.label + '</span>'
        + '<span style="font-size:0.72rem;color:#94a3b8;">' + summary + '</span>'
        + '</div>'
        + '<div>' + rows + '</div>'
        + '</div>';
    }).join('');

    return '<div>'
      + '<div style="padding:14px 22px 6px;">'
      + '<p style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin:0;">By Quarter</p>'
      + '</div>'
      + sections
      + '<div style="padding:14px 22px;">' // bottom breathing room
      + '</div></div>';
  }

  // ---- Backdrop click ----
  document.getElementById('sm-overlay').addEventListener('click', function (e) {
    if (e.target === document.getElementById('sm-overlay')) closeSummaryModal();
  });

}());