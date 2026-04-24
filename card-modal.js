// card-modal.js — Program card detail modal
// Reads from: data-strategy.js, data-design.js, data-buying.js, data-allocation.js
// Exposed globals: openCardModal(cardId), closeCardModal()

(function () {

  // Status color config
  var STATUS_CFG = {
    'completed': { bg: '#eef2ff', color: '#0053e2', border: '#0053e2', label: '✅ Completed' },
    'green':     { bg: '#f0faf0', color: '#2a8703', border: '#2a8703', label: '🟢 On Track' },
    'yellow':    { bg: '#fffbeb', color: '#d97706', border: '#d97706', label: '🟡 At Risk' },
    'red':       { bg: '#fff0f0', color: '#ea1100', border: '#ea1100', label: '🔴 Blocked' },
    'roadmap':   { bg: '#f1f5f9', color: '#64748b', border: '#64748b', label: '🔮 Planned' },
  };

  // ── PUBLIC ──────────────────────────────────────────────
  window.openCardModal = function (cardId) {
    var card = _findCard(cardId);
    if (!card) {
      console.warn('Card not found:', cardId);
      return;
    }
    _render(card);
    document.getElementById('cm-overlay').classList.add('open');
  };

  window.closeCardModal = function () {
    document.getElementById('cm-overlay').classList.remove('open');
  };

  // ── FIND CARD ───────────────────────────────────────────
  function _findCard(cardId) {
    var allCards = [].concat(
      typeof CARDS_STRATEGY !== 'undefined' ? CARDS_STRATEGY : [],
      typeof CARDS_DESIGN !== 'undefined' ? CARDS_DESIGN : [],
      typeof CARDS_BUYING !== 'undefined' ? CARDS_BUYING : [],
      typeof CARDS_ALLOCATION !== 'undefined' ? CARDS_ALLOCATION : []
    );
    return allCards.find(function (c) { return c.id === cardId; });
  }

  // ── RENDER ──────────────────────────────────────────────
  function _render(card) {
    var statCfg = STATUS_CFG[card.status] || STATUS_CFG['roadmap'];

    // Header
    document.getElementById('cm-icon').textContent  = card.icon || '📦';
    document.getElementById('cm-title').textContent = card.title;

    // Status + metadata bar
    var metaHTML = '<span class="cm-status-badge" style="background:' + statCfg.bg + ';color:' + statCfg.color + ';border-color:' + statCfg.border + ';">' + statCfg.label + '</span>';
    
    if (card.tag) {
      metaHTML += '<span class="cm-tag">' + _esc(card.tag) + '</span>';
    }
    
    metaHTML += '<span class="cm-quarter">📅 ' + _esc(card.quarter) + ' — ' + _esc(card.targetDate) + '</span>';
    
    if (card.jiraStatus) {
      metaHTML += '<span class="cm-jira-status">Jira: ' + _esc(card.jiraStatus) + '</span>';
    }

    document.getElementById('cm-metadata').innerHTML = metaHTML;

    // Body
    document.getElementById('cm-body').innerHTML = _bodyHTML(card);
  }

  function _bodyHTML(card) {
    var sections = [];

    if (card.description) {
      sections.push(_section('📋 Description', '<p class="cm-text">' + _esc(card.description) + '</p>'));
    }

    if (card.problemStatement) {
      sections.push(_section('❗ Problem Statement', '<p class="cm-text">' + _esc(card.problemStatement) + '</p>'));
    }

    if (card.businessBenefit || card.businessImpact) {
      var text = card.businessBenefit || card.businessImpact;
      sections.push(_section('💰 Business Value', '<p class="cm-text">' + _nl2br(_esc(text)) + '</p>'));
    }

    if (card.techIntegration) {
      sections.push(_section('⚙️ Technical Integration', '<p class="cm-text">' + _esc(card.techIntegration) + '</p>'));
    }

    if (card.successMetrics) {
      sections.push(_section('🎯 Success Metrics', '<p class="cm-text">' + _esc(card.successMetrics) + '</p>'));
    }

    if (card.recentUpdate) {
      var updates = card.recentUpdate.split(' | ').map(function (u) {
        return '<li>' + _esc(u.trim()) + '</li>';
      }).join('');
      sections.push(_section('🔔 Recent Updates', '<ul class="cm-updates">' + updates + '</ul>'));
    }

    if (card.owners) {
      sections.push(_section('👥 Ownership', _ownersHTML(card.owners)));
    }

    if (card.relatedOpifs && card.relatedOpifs.length > 0) {
      sections.push(_section('🔗 Related OPIFs', _opifHTML(card.relatedOpifs)));
    }

    if (card.resources && card.resources.links && card.resources.links.length > 0) {
      sections.push(_section('📚 Resources', _resourcesHTML(card.resources.links)));
    }

    if (card.workstreams && card.workstreams.length > 0) {
      sections.push(_section('🏭 Workstreams', _workstreamsHTML(card.workstreams)));
    }

    return sections.join('');
  }

  function _section(heading, contentHTML) {
    return '<div class="cm-section"><div class="cm-section-title">' +
      heading + '</div>' + contentHTML + '</div>';
  }

  function _ownersHTML(owners) {
    if (!owners) return '';
    var html = '<div class="cm-owners-grid">';
    if (owners.ppt)      html += '<div><strong>PPT:</strong> ' + _esc(owners.ppt) + '</div>';
    if (owners.eng)      html += '<div><strong>Engineering:</strong> ' + _esc(owners.eng) + '</div>';
    if (owners.product)  html += '<div><strong>Product:</strong> ' + _esc(owners.product) + '</div>';
    if (owners.design)   html += '<div><strong>Design:</strong> ' + _esc(owners.design) + '</div>';
    if (owners.merchant) html += '<div><strong>Merchant:</strong> ' + _esc(owners.merchant) + '</div>';
    html += '</div>';
    return html;
  }

  function _opifHTML(opifs) {
    return '<div class="cm-opifs">' + opifs.map(function (o) {
      return '<div class="cm-opif-item">' +
        '<a href="https://jira.walmart.com/browse/' + _esc(o.key) + '" target="_blank" rel="noopener">' +
        '<strong>' + _esc(o.key) + '</strong></a> — ' + _esc(o.label) +
        (o.quarter ? ' <span class="cm-opif-meta">(' + _esc(o.quarter) + ')</span>' : '') +
        '</div>';
    }).join('') + '</div>';
  }

  function _resourcesHTML(links) {
    return '<ul class="cm-resources">' + links.map(function (r) {
      return '<li><a href="' + _esc(r.url) + '" target="_blank" rel="noopener">' + _esc(r.label) + '</a></li>';
    }).join('') + '</ul>';
  }

  function _workstreamsHTML(ws) {
    return '<div class="cm-workstreams">' + ws.map(function (w) {
      return '<span class="cm-ws-chip">' + _esc(w) + '</span>';
    }).join('') + '</div>';
  }

  function _esc(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function _nl2br(str) {
    return str.replace(/\\n/g, '<br>');
  }

})();
