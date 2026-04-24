// Business Reviews Module
// Provides 5 different weekly review views for E2E Fashion Portal
//
// ========================================
// CRITICAL RULES FOR WPR (Weekly Program Review):
// ========================================
// 1. "Critical Programs" = cards where (tag || '').indexOf('Critical') > -1
//    Example: tag: 'Critical Program'
//    - This MUST match the main portal roadmap filter logic
//    - DO NOT use card.critical flag - use tag check only
//
// 2. Time Range = Programs landing in NEXT 90 DAYS (targetDate <= 90 days from today)
//    - Do NOT include long-term initiatives (e.g., Q1'27 programs)
//    - Filter: daysUntilTarget(card.targetDate) >= 0 && <= 90
//
// 3. WPR displays: (Critical Programs) OR (Next 90 Days) - union of both sets
//
// 4. When updating data files (data-*.js):
//    - ONLY set critical: true if card also has tag: 'Critical Program'
//    - Otherwise REMOVE the critical: true flag to avoid mismatch
// ========================================

const BUSINESS_REVIEWS = {
  bigrocks: {
    id: 'bigrocks',
    title: 'Big Rocks: Strategic Narrative',
    subtitle: 'Executive leadership view of the three critical transformation priorities driving E2E Fashion',
    icon: '🏔️',
    description: 'Strategic narrative for executive leadership',
  },
  wpr: {
    id: 'wpr',
    title: 'Weekly Program Review',
    subtitle: 'Critical programs across all workstreams and phases — highest-impact initiatives driving E2E Fashion transformation',
    icon: '🎯',
    description: 'All Critical programs',
  },
  mbr: {
    id: 'mbr',
    title: 'Monthly Business Review',
    subtitle: 'Coming Soon - Monthly executive review of E2E Fashion progress',
    icon: '📅',
    description: 'Coming Soon',
  },
  gantt: {
    id: 'gantt',
    title: 'E2E Fashion & Long Lead Timelines',
    subtitle: 'Full E2E Fashion program timeline by workstream — filter by workstream, click any program to view details',
    icon: '📊',
    description: 'FY27 · All Workstreams',
  },
  strategy: {
    id: 'strategy',
    title: 'Weekly Strategy Review',
    subtitle: 'Strategy workstream programs landing in the next 90 days — TTP, forecasting, and cross-workstream alignment',
    icon: '🏛️',
    description: 'Strategy · Next 90 Days',
  },
  design: {
    id: 'design',
    title: 'Weekly Design Review',
    subtitle: 'Design workstream programs landing in the next 90 days — PLM, line planning, and creative collaboration',
    icon: '🎨',
    description: 'Design · Next 90 Days',
  },
  buying: {
    id: 'buying',
    title: 'Weekly Buying Review',
    subtitle: 'Buying workstream programs landing in the next 90 days — assortment, forecasting, and buy quantity',
    icon: '🛒',
    description: 'Buying · Next 90 Days',
  },
  allocation: {
    id: 'allocation',
    title: 'Weekly Allocation Review',
    subtitle: 'Allocation workstream programs landing in the next 90 days — distribution, wave planning, and inventory optimization',
    icon: '📦',
    description: 'Allocation · Next 90 Days',
  },
};

let currentReviewMode = null;

// Calculate days until target date
function daysUntilTarget(targetDate) {
  if (!targetDate || targetDate === 'TBD') return 999;
  
  // Handle quarter-based dates with fiscal year support
  // Walmart fiscal year: FY26 = Feb 2025 - Jan 2026, FY27 = Feb 2026 - Jan 2027, etc.
  const quarterMapFY26 = {
    'Q1': new Date('2026-04-30'),  // End of Q1 FY26
    'Q2': new Date('2026-07-31'),  // End of Q2 FY26
    'Q3': new Date('2026-10-31'),  // End of Q3 FY26
    'Q4': new Date('2027-01-31'),  // End of Q4 FY26
  };
  
  const quarterMapFY27 = {
    'Q1': new Date('2027-04-30'),  // End of Q1 FY27
    'Q2': new Date('2027-07-31'),  // End of Q2 FY27
    'Q3': new Date('2027-10-31'),  // End of Q3 FY27
    'Q4': new Date('2028-01-31'),  // End of Q4 FY27
  };
  
  // Check for fiscal year indicator
  const isFY27 = targetDate.includes('FY27') || targetDate.includes('FY 27');
  const quarterMap = isFY27 ? quarterMapFY27 : quarterMapFY26;
  
  // Check if it's a quarter reference (Q1, Q2, Q3, Q4)
  const quarterMatch = targetDate.match(/\b(Q[1-4])\b/);
  if (quarterMatch) {
    const quarter = quarterMatch[1];
    const date = quarterMap[quarter];
    if (date) {
      const diff = date - new Date();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
  }
  
  // Try parsing as actual date
  try {
    const target = new Date(targetDate);
    if (!isNaN(target)) {
      const diff = target - new Date();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
  } catch(e) {}
  
  return 999;
}

// Filter cards for business reviews
function getReviewCards(reviewType) {
  if (!window.PILLARS) return [];
  
  const allCards = window.PILLARS.flatMap(pillar => pillar.cards || []);
  
  switch(reviewType) {
    case 'wpr':
      // WPR: Critical Programs (tag contains 'Critical') + All programs landing in next 90 days
      // MUST match main portal roadmap logic: tag.indexOf('Critical') > -1
      return allCards.filter(card => {
        const isCritical = (card.tag || '').indexOf('Critical') > -1;
        const days = daysUntilTarget(card.targetDate);
        const isNext90Days = days >= 0 && days <= 90;
        return isCritical || isNext90Days;
      });
    
    case 'mbr':
      // MBR: Placeholder - coming soon
      return [];
    
    case 'strategy':
      // Strategy workstream, next 90 days
      return allCards.filter(card => {
        const hasStrategy = card.workstreams && card.workstreams.includes('strategy');
        const days = daysUntilTarget(card.targetDate);
        return hasStrategy && days >= 0 && days <= 90;
      });
    
    case 'design':
      // Design workstream, next 90 days
      return allCards.filter(card => {
        const hasDesign = card.workstreams && card.workstreams.includes('design');
        const days = daysUntilTarget(card.targetDate);
        return hasDesign && days >= 0 && days <= 90;
      });
    
    case 'buying':
      // Buying workstream, next 90 days
      return allCards.filter(card => {
        const hasBuying = card.workstreams && card.workstreams.includes('buying');
        const days = daysUntilTarget(card.targetDate);
        return hasBuying && days >= 0 && days <= 90;
      });
    
    case 'allocation':
      // Allocation workstream, next 90 days
      return allCards.filter(card => {
        const hasAllocation = card.workstreams && card.workstreams.includes('allocation');
        const days = daysUntilTarget(card.targetDate);
        return hasAllocation && days >= 0 && days <= 90;
      });
    
    default:
      return [];
  }
}

// Calculate review statistics
function getReviewStats(cards) {
  const stats = {
    total: cards.length,
    green: 0,
    yellow: 0,
    red: 0,
    completed: 0,
  };
  
  cards.forEach(card => {
    if (card.status === 'green') stats.green++;
    else if (card.status === 'yellow') stats.yellow++;
    else if (card.status === 'red') stats.red++;
    else if (card.status === 'completed') stats.completed++;
  });
  
  return stats;
}

// Show specific review
function showReview(reviewType) {
  currentReviewMode = reviewType;
  
  // Hide main portal content
  const phaseGrid = document.getElementById('phase-grid-wrap');
  const execBar = document.getElementById('exec-bar');
  const phaseBar = document.getElementById('phase-bar')?.parentElement;
  const strategyUmbrella = document.querySelector('.strategy-umbrella');
  
  if (phaseGrid) phaseGrid.style.display = 'none';
  if (execBar) execBar.style.display = 'none';
  if (phaseBar) phaseBar.style.display = 'none';
  if (strategyUmbrella) strategyUmbrella.style.display = 'none';
  
  // Show review content
  const reviewsWrap = document.getElementById('business-reviews-wrap');
  if (reviewsWrap) reviewsWrap.style.display = 'block';
  
  // Show only this review's content
  Object.keys(BUSINESS_REVIEWS).forEach(key => {
    const contentDiv = document.getElementById(`review-content-${key}`);
    if (contentDiv) {
      contentDiv.classList.toggle('active', key === reviewType);
    }
  });
  
  // Render the selected review
  renderReviewContent(reviewType);
}

// Exit review mode back to normal portal
function exitReviewMode() {
  currentReviewMode = null;
  
  // Hide review content
  const reviewsWrap = document.getElementById('business-reviews-wrap');
  if (reviewsWrap) reviewsWrap.style.display = 'none';
  
  // Show main portal content
  const phaseGrid = document.getElementById('phase-grid-wrap');
  const execBar = document.getElementById('exec-bar');
  const phaseBar = document.getElementById('phase-bar')?.parentElement;
  const strategyUmbrella = document.querySelector('.strategy-umbrella');
  
  if (phaseGrid) phaseGrid.style.display = 'block';
  if (execBar) execBar.style.display = 'none'; // keep exec-bar hidden, control panel replaces it
  if (phaseBar) phaseBar.style.display = 'block';
  if (strategyUmbrella) strategyUmbrella.style.display = 'block';
}

// Render review content
function renderReviewContent(reviewType) {
  const review = BUSINESS_REVIEWS[reviewType];
  if (!review) return;

  const contentDiv = document.getElementById(`review-content-${reviewType}`);
  if (!contentDiv) return;

  // ── Gantt has its own layout, bypass the standard card/stats rendering ──
  if (reviewType === 'gantt') {
    const wsButtons = ['all','strategy','design','buying','allocation'].map(ws => {
      const cfg = GANTT_WS_CONFIG[ws];
      return `<button class="gantt-ws-btn ws-${ws} ${ws === 'all' ? 'active' : ''}" data-ws="${ws}" onclick="ganttToggleWS('${ws}')">${cfg.label}</button>`;
    }).join('');

    const legendItems = Object.entries(GANTT_WS_CONFIG).filter(([k]) => k !== 'all').map(([, cfg]) =>
      `<div class="gantt-legend-item"><div class="gantt-legend-dot" style="background:${cfg.color}"></div>${cfg.label}</div>`
    ).join('');

    contentDiv.innerHTML = `
      <div class="review-back-bar">
        <button class="review-back-button" onclick="clearBusinessReview()">← Back</button>
      </div>
      <div class="review-header">
        <div class="review-header-title">
          <span class="review-header-icon">${review.icon}</span>
          ${review.title}
        </div>
        <div class="review-header-subtitle">${review.subtitle}</div>
      </div>
      <div class="gantt-toolbar">
        <div id="gantt-ws-filters" class="gantt-ws-filters">
          <span class="gantt-ws-label">Workstream:</span>
          ${wsButtons}
        </div>
        <div class="gantt-view-toggle" style="margin-left:auto">
          <button id="gantt-view-btn-program" class="gantt-view-btn"
            onclick="ganttSetView('program')">
            📋 Program Timeline
          </button>
          <button id="gantt-view-btn-biz" class="gantt-view-btn active"
            onclick="ganttSetView('biz-impact')">
            🎯 Business Impact
          </button>
        </div>
      </div>
      <div class="gantt-wrap">
        <div class="gantt-chart">
          <div class="gantt-header" id="gantt-qheader"></div>
          <div id="gantt-body"></div>
        </div>
      </div>
      <div class="gantt-legend">
        <span class="gantt-legend-title">Workstream:</span>
        ${legendItems}
        <div style="margin-left:12px;display:flex;align-items:center;gap:16px">
          <div class="gantt-legend-item"><div style="width:14px;height:14px;border-radius:3px;background:#ea1100"></div>Today</div>
          <div class="gantt-legend-item"><div style="width:28px;height:12px;border-radius:3px;background:#6366f1;opacity:0.85"></div>Available to users</div>
          <div class="gantt-legend-item"><div style="width:28px;height:12px;border-radius:3px;background:#6366f1;opacity:0.35"></div>Delivery window</div>
        </div>
      </div>
    `;

    // Default to Business Impact view
    ganttSetView('biz-impact');
    return;
  }

  // ── Big Rocks has custom narrative layout, bypass standard card rendering ──
  if (reviewType === 'bigrocks') {
    contentDiv.innerHTML = renderBigRocksNarrative();
    return;
  }

  const cards = getReviewCards(reviewType);
  const stats = getReviewStats(cards);
  
  let html = `
    <div class="review-back-bar">
      <button class="review-back-button" onclick="clearBusinessReview()">
        ← Back
      </button>
    </div>
    <div class="review-header">
      <div class="review-header-title">
        <span class="review-header-icon">${review.icon}</span>
        ${review.title}
      </div>
      <div class="review-header-subtitle">${review.subtitle}</div>
      <div class="review-stats">
        <div class="review-stat total">
          <div class="review-stat-value">${stats.total}</div>
          <div class="review-stat-label">Total Programs</div>
        </div>
        ${stats.green > 0 ? `
          <div class="review-stat green">
            <div class="review-stat-value">${stats.green}</div>
            <div class="review-stat-label">✅ On Track</div>
          </div>
        ` : ''}
        ${stats.yellow > 0 ? `
          <div class="review-stat yellow">
            <div class="review-stat-value">${stats.yellow}</div>
            <div class="review-stat-label">⚠️ At Risk</div>
          </div>
        ` : ''}
        ${stats.red > 0 ? `
          <div class="review-stat red">
            <div class="review-stat-value">${stats.red}</div>
            <div class="review-stat-label">🔴 Blocked</div>
          </div>
        ` : ''}
        ${stats.completed > 0 ? `
          <div class="review-stat">
            <div class="review-stat-value">${stats.completed}</div>
            <div class="review-stat-label">✅ Completed</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  if (cards.length === 0) {
    // Special handling for MBR (Coming Soon)
    if (reviewType === 'mbr') {
      html += `
        <div class="review-coming-soon">
          <div class="review-coming-soon-icon">🚧</div>
          <div class="review-coming-soon-title">Coming Soon!</div>
          <div class="review-coming-soon-desc">
            The Monthly Business Review (MBR) is currently in development. This comprehensive executive review will provide monthly insights into E2E Fashion transformation progress, including:
            <ul class="review-coming-soon-list">
              <li>📊 Monthly performance metrics across all workstreams</li>
              <li>🎯 Strategic initiative progress tracking</li>
              <li>💡 Key insights and recommendations</li>
              <li>🚀 Upcoming priorities and focus areas</li>
            </ul>
            Check back soon for updates!
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="review-empty">
          <div class="review-empty-icon">📋</div>
          <div class="review-empty-title">No programs found</div>
          <div class="review-empty-desc">
            No programs match the criteria for this review.
          </div>
        </div>
      `;
    }
  } else if (reviewType === 'wpr') {
    // WPR: Table-based layout organized by sections
    // Critical = tag contains 'Critical' (matches main portal roadmap logic)
    const isCriticalCard = c => (c.tag || '').indexOf('Critical') > -1;
    
    const criticalCards = cards.filter(isCriticalCard);
    const strategyCards = cards.filter(c => !isCriticalCard(c) && c.workstreams?.includes('strategy'));
    const designCards = cards.filter(c => !isCriticalCard(c) && c.workstreams?.includes('design'));
    const buyingCards = cards.filter(c => !isCriticalCard(c) && c.workstreams?.includes('buying'));
    const allocationCards = cards.filter(c => !isCriticalCard(c) && c.workstreams?.includes('allocation'));

    // Housekeeping / Program Updates — always first
    html += renderWPRHousekeeping();

    // Critical Programs Section
    if (criticalCards.length > 0) {
      html += renderWPRSection('\u2B50 Critical Programs', criticalCards, '\u2B50');
    }
    
    // Strategy Workstream Section
    if (strategyCards.length > 0) {
      html += renderWPRSection('Strategy Workstream', strategyCards, '🧭');
    }
    
    // Design Workstream Section
    if (designCards.length > 0) {
      html += renderWPRSection('Design Workstream', designCards, '🎨');
    }
    
    // Buying Workstream Section
    if (buyingCards.length > 0) {
      html += renderWPRSection('Buying Workstream', buyingCards, '🛒');
    }
    
    // Allocation Workstream Section
    if (allocationCards.length > 0) {
      html += renderWPRSection('Allocation Workstream', allocationCards, '📦');
    }
  } else {
    // Other reviews: Simple card grid
    html += '<div class="review-cards-grid">';
    html += cards.map(card => renderReviewCard(card)).join('');
    html += '</div>';
  }
  
  contentDiv.innerHTML = html;
}

// Extract all OPIF links from a card's resources
function getCardOPIFs(card) {
  const opifs = [];
  const otherLinks = [];

  if (!card.resources) return { opifs, otherLinks };

  // Primary OPIF from resources.opif
  if (card.resources.opif && card.resources.opif !== '#' && card.resources.opif.includes('OPIF-')) {
    const match = card.resources.opif.match(/OPIF-\d+/);
    if (match) {
      opifs.push({
        id: match[0],
        url: card.resources.opif,
        isPrimary: true
      });
    }
  }

  // Additional items from resources.other array
  if (card.resources.other && Array.isArray(card.resources.other)) {
    card.resources.other.forEach(item => {
      if (!item.url) return;
      if (item.url.includes('OPIF-')) {
        const match = item.url.match(/OPIF-\d+/);
        if (match && !opifs.some(o => o.id === match[0])) {
          opifs.push({
            id: match[0],
            url: item.url,
            label: item.label || match[0],
            isPrimary: false
          });
        }
      } else {
        // Non-OPIF links (e.g. Confluence dashboard) — show as fallback
        otherLinks.push({ label: item.label || 'Reference', url: item.url });
      }
    });
  }

  return { opifs, otherLinks };
}

// ── Team Updates & Business Initiatives Module ────────────
// Renders a card-grid panel at the top of every WPR.
// Content lives in data-wpr-housekeeping.js — edit that file.
function renderWPRHousekeeping() {
  const hk = (typeof WPR_HOUSEKEEPING !== 'undefined') ? WPR_HOUSEKEEPING : null;
  if (!hk || !hk.items || hk.items.length === 0) return '';

  const cards = hk.items.map((item, i) => {
    const isComplete  = item.status === 'complete';
    const cardClass   = isComplete ? 'wpr-tu-card wpr-tu-card--complete' : 'wpr-tu-card';
    const numContent  = isComplete
      ? '<span class="wpr-tu-card-done-icon">&#x2713;</span>'
      : i + 1;
    const completeBadge = isComplete
      ? '<span class="wpr-tu-complete-badge">&#x2713; Complete</span>'
      : '';
    return `
    <div class="${cardClass}">
      <div class="wpr-tu-card-num">${numContent}</div>
      ${completeBadge}
      <div class="wpr-tu-card-title">${item.title}</div>
      <div class="wpr-tu-card-body">${item.body}</div>
      <div class="wpr-tu-meta">
        <span class="wpr-tu-chip owner">&#x1F464; ${item.owner}</span>
        <span class="wpr-tu-chip eta">&#x1F4C5; ${item.eta}</span>
      </div>
    </div>`;
  }).join('');

  return `
    <div class="wpr-team-updates">
      <div class="wpr-tu-header">
        <div class="wpr-tu-title">
          <span class="wpr-tu-title-icon">&#x1F4CB;</span>
          Team Updates &amp; Business Initiatives
        </div>
        <div class="wpr-tu-badges">
          <span class="wpr-tu-count">${hk.items.length} items</span>
          <span class="wpr-tu-date">Updated ${hk.lastUpdated}</span>
        </div>
      </div>
      <div class="wpr-tu-grid">
        ${cards}
      </div>
    </div>`;
}

// Toggle WPR row expansion to show OPIFs
function toggleWPRRow(cardId) {
  const mainRow = document.querySelector(`tr[data-card-id="${cardId}"]`);
  if (!mainRow) return;

  const existingExpandRow = mainRow.nextElementSibling;
  const isAlreadyOpen = existingExpandRow && existingExpandRow.classList.contains('wpr-expand-row');

  // Collapse any currently open expand row
  document.querySelectorAll('.wpr-expand-row').forEach(row => row.remove());
  document.querySelectorAll('.wpr-row-expanded').forEach(row => row.classList.remove('wpr-row-expanded'));

  // If this row was already open, just close it (toggle off)
  if (isAlreadyOpen) return;
  
  // Find the card data
  const card = window.PILLARS.flatMap(p => p.cards || []).find(c => c.id === cardId);
  if (!card) return;
  
  // Get all OPIFs
  const { opifs, otherLinks } = getCardOPIFs(card);
  
  // Create expand row
  const colspan = mainRow.cells.length;
  const expandRow = document.createElement('tr');
  expandRow.className = 'wpr-expand-row';
  
  let expandContent = '';
  
  if (opifs.length === 0 && otherLinks.length === 0) {
    expandContent = '<div class="wpr-expand-content"><div class="wpr-no-opifs">📋 No OPIFs directly mapped to this program</div></div>';
  } else {
    let allLinksHTML = '';

    if (opifs.length > 0) {
      allLinksHTML += opifs.map(opif => {
        const badge = opif.isPrimary ? '<span class="wpr-opif-primary-badge">Primary</span>' : '';
        return `<a href="${opif.url}" target="_blank" class="wpr-opif-link" onclick="event.stopPropagation()">
            <span class="wpr-opif-icon">🔗</span>
            <span class="wpr-opif-id">${opif.id}</span>
            ${badge}
          </a>`;
      }).join('');
    }

    if (otherLinks.length > 0) {
      allLinksHTML += otherLinks.map(link => 
        `<a href="${link.url}" target="_blank" class="wpr-opif-link wpr-dashboard-link" onclick="event.stopPropagation()">
            <span class="wpr-opif-icon">📊</span>
            <span>${link.label}</span>
          </a>`
      ).join('');
    }

    const sectionLabel = opifs.length > 0
      ? `📋 Related OPIFs (${opifs.length})`
      : `📋 References`;

    expandContent = `
      <div class="wpr-expand-content">
        <div class="wpr-expand-header">${sectionLabel}</div>
        <div class="wpr-opif-links">${allLinksHTML}</div>
      </div>
    `;
  }
  
  expandRow.innerHTML = `<td colspan="${colspan}">${expandContent}</td>`;
  
  // Insert after main row
  mainRow.parentNode.insertBefore(expandRow, mainRow.nextSibling);
  mainRow.classList.add('wpr-row-expanded');
}

// Get recent update summary for a card (from OPIF history)
function getCardUpdate(card) {
  // Check if we have OPIF updates loaded
  if (window.OPIF_UPDATES && window.OPIF_UPDATES[card.id]) {
    return window.OPIF_UPDATES[card.id].summary;
  }
  
  // Check if card has recentUpdate property (manual updates)
  if (card.recentUpdate) {
    return card.recentUpdate;
  }
  
  // Check if card has any OPIF mapped
  // resources is an object: { opif, brd, prd, uxDemo, other }
  const hasOpif = card.resources && (
    (card.resources.opif && card.resources.opif !== '#') ||
    (card.resources.other && card.resources.other.some(r => r.url && r.url.includes('OPIF-')))
  );
  
  if (!hasOpif) {
    return '<span style="color:#9ca3af;font-size:12px;font-style:italic;">No OPIF mapped</span>';
  }
  
  // OPIF exists but no updates fetched yet
  return '<span style="color:#9ca3af;font-size:12px;font-style:italic;">Updates pending...</span>';
}

// ── Doc badge helper ─────────────────────────────────────────
// Returns BRD + PRD badges for a card. Linked = clickable; missing = muted.
function getDocBadges(card) {
  const r = card.resources || {};
  const other = r.other || [];

  // PRD: positional arg OR any other[] entry labelled 'PRD: ...'
  const prdUrl  = (r.prd  && r.prd  !== '#') ? r.prd  : null;
  const prdOther = other.find(o => o.label && /^PRD[: ]/i.test(o.label));
  const prdHref = prdUrl || prdOther?.url || null;

  // BRD: positional arg OR any other[] entry labelled 'BRD: ...'
  const brdUrl  = (r.brd  && r.brd  !== '#') ? r.brd  : null;
  const brdOther = other.find(o => o.label && /^BRD[: ]/i.test(o.label));
  const brdHref = brdUrl || brdOther?.url || null;

  const prdBadge = prdHref
    ? `<a href="${prdHref}" target="_blank" onclick="event.stopPropagation()"
          class="wpr-doc-badge prd-linked" title="Open PRD">&#x1F4C4; PRD &#x2197;</a>`
    : `<span class="wpr-doc-badge prd-missing">PRD &mdash;</span>`;

  const brdBadge = brdHref
    ? `<a href="${brdHref}" target="_blank" onclick="event.stopPropagation()"
          class="wpr-doc-badge brd-linked" title="Open BRD">&#x1F4C4; BRD &#x2197;</a>`
    : `<span class="wpr-doc-badge brd-missing">BRD &mdash;</span>`;

  return `<div class="wpr-doc-badges">${prdBadge}${brdBadge}</div>`;
}

// Render WPR section as a table
function renderWPRSection(title, cards, icon) {
  // Sort cards by target date ascending — earliest date on top
  const sorted = [...cards].sort((a, b) => {
    const dA = daysUntilTarget(a.targetDate);
    const dB = daysUntilTarget(b.targetDate);
    return dA - dB;
  });
  cards = sorted;

  if (cards.length === 0) {
    return `
      <div class="wpr-section">
        <div class="wpr-section-header">
          <div class="wpr-section-title">
            <span class="wpr-section-icon">${icon}</span>
            ${title}
          </div>
          <span class="wpr-section-count">${cards.length} programs</span>
        </div>
        <div class="wpr-empty">No programs in this section</div>
      </div>
    `;
  }
  
  const rows = cards.map(card => {
    const owner = card.owners?.productLead?.name || card.owners?.transformationLead?.name || 'TBD';
    const wsLabels = (card.workstreams || []).map(ws => 
      `<span class="wpr-ws-badge ${ws}">${ws}</span>`
    ).join('');
    
    let statusClass = card.status || 'roadmap';
    let statusLabel = card.statusLabel || card.status || 'Roadmap';
    
    // Get recent update summary (from OPIF history)
    const updateText = getCardUpdate(card);
    
    return `
      <tr class="wpr-row" data-card-id="${card.id}" onclick="toggleWPRRow('${card.id}')">
        <td class="wpr-program-cell">
          <div class="wpr-program-name">
            <span class="wpr-program-icon">${card.icon || '📌'}</span>
            <span>${card.title}</span>
            ${((card.tag || '').indexOf('Critical') > -1) ? '<span class="wpr-critical-badge">⭐</span>' : ''}
          </div>
        </td>
        <td>
          <span class="wpr-status-badge ${statusClass}">${statusLabel}</span>
        </td>
        <td class="wpr-owner-cell">${owner}</td>
        <td class="wpr-date-cell">${card.targetDate || 'TBD'}</td>
        <td class="wpr-update-cell">${updateText}</td>
        <td>
          <div class="wpr-workstreams">${wsLabels || '<span style="color:#9ca3af;font-size:12px;">—</span>'}</div>
        </td>
        <td>${getDocBadges(card)}</td>
      </tr>
    `;
  }).join('');
  
  return `
    <div class="wpr-section">
      <div class="wpr-section-header">
        <div class="wpr-section-title">
          <span class="wpr-section-icon">${icon}</span>
          ${title}
        </div>
        <span class="wpr-section-count">${cards.length} program${cards.length === 1 ? '' : 's'}</span>
      </div>
      <table class="wpr-table">
        <colgroup>
          <col style="width: 23%">
          <col style="width: 13%">
          <col style="width: 11%">
          <col style="width: 10%">
          <col style="width: 23%">
          <col style="width: 9%">
          <col style="width: 11%">
        </colgroup>
        <thead>
          <tr>
            <th>Program</th>
            <th>Status</th>
            <th>Owner</th>
            <th>Target Date</th>
            <th>Update (Last 14 Days)</th>
            <th>Workstreams</th>
            <th>Docs</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// Render a single review card
function renderReviewCard(card) {
  const owner = card.owners?.productLead?.name || card.owners?.transformationLead?.name || 'TBD';
  const wsLabels = (card.workstreams || []).map(ws => 
    `<span class="review-ws-badge ${ws}">${ws}</span>`
  ).join('');
  
  return `
    <div class="review-card" onclick="openCardModal('${card.id}')">
      <div class="review-card-header">
        <div class="review-card-title-wrap">
          <div class="review-card-title">
            <span class="review-card-icon">${card.icon || '📌'}</span>
            ${card.title}
            ${((card.tag || '').indexOf('Critical') > -1) ? '<span class="review-critical-badge">⭐ Critical</span>' : ''}
          </div>
          <div class="review-card-meta">
            <span class="review-card-status ${card.status}">${card.statusLabel || card.status}</span>
            <span>📅 ${card.targetDate || 'TBD'}</span>
            ${card.quarter ? `<span>Q: ${card.quarter}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="review-card-desc">${card.description || ''}</div>
      ${wsLabels ? `<div class="review-card-workstreams">${wsLabels}</div>` : ''}
      <div class="review-card-owner">
        <strong>Owner:</strong> ${owner}
      </div>
    </div>
  `;
}

// ┌────────────────────────────────────────────────────────────────────────┐
// │ BIG ROCKS STRATEGIC NARRATIVE                                          │
// │ Executive leadership view - Three critical transformation priorities   │
// └────────────────────────────────────────────────────────────────────────┘

// Program mapping to Big Rocks by quarter
// Using actual card IDs from portal data
const BIG_ROCK_PROGRAM_MAP = {
  rock1: { // Trend Anticipation
    q1: ['auto-item-setup'],  // Automated Item Setup (Apr 30)
    q2: ['design-hub-centric', 'shared-merch-strategy', 'visual-boards'],  // Design Hub (May 31), Shared Merch Strategy (Jul 31), Visual Boards (Jul 31)
    q3: ['strategy-hub', 'forecast-enterprise-service', 'ap-tool-lineplan'],  // Strategy Hub (Oct 31), Forecast Service (Oct 31), AP Tool (Aug 1)
    q4: ['strategy-hub-data-inputs'],  // Strategy Hub Data Inputs (Oct 31 but late rollout)
  },
  rock2: { // Proactive Allocation  
    q1: ['auto-item-setup'],  // Automated Item Setup (Apr 30)
    q2: ['tagging-pilot', 'assort-product-phase2'],  // Tagging Pilot (Jul 31), Assort Product Phase 2 (Jul 31)
    q3: ['enterprise-wave-planning', 'fashion-fixture-allocation-buying', 'tag-based-recommendations', 'bq-enterprise-service'],  // Wave Planning (Aug 1), Fashion Fixture (Oct 31), Tag Recommendations (Oct 31), BQ Enterprise (Oct 31)
    q4: ['oneitem-expanded-sources'],  // OneItem Expanded Sources (Jan 30, 2027)
  },
  rock3: { // Connected Systems
    q1: ['auto-item-setup'],  // Automated Item Setup (Apr 30)
    q2: ['shared-item-repository', 'shared-event-layer', 'commitment-report-redesign'],  // Shared Item Repo (May 1), Shared Event Layer (May 1), CR Redesign (Jul 31)
    q3: ['ai-item-repository', 'size-pack-bq', 'bam-collab-intent', 'bq-enterprise-service'],  // AI Item Repo (Aug 1), Size/Pack BQ (Oct 31), BAM Collab (Oct 31), BQ Enterprise (Oct 31)
    q4: ['oneitem-expanded-sources'],  // OneItem Expanded Sources (Jan 30, 2027)
  },
};

// Print Big Rocks to PDF
function printBigRocks() {
  window.print();
}

// Toggle quarterly view for a Big Rock

// Get initiatives for a specific rock + quarter
function getBigRockInitiatives(rockId, quarter) {
  const cardIds = BIG_ROCK_PROGRAM_MAP[rockId]?.[`q${quarter}`] || [];
  const allCards = window.PILLARS ? window.PILLARS.flatMap(p => p.cards || []) : [];
  
  return cardIds.map(cardId => {
    const card = allCards.find(c => c.id === cardId);
    if (!card) return null;
    
    const statusDot = {
      'green': '✅',
      'yellow': '🟡',
      'red': '🔴',
      'completed': '✔️',
      'roadmap': '📅',
    }[card.status || 'roadmap'] || '📅';
    
    return {
      title: card.title,
      status: card.status || 'roadmap',
      statusDot,
      id: card.id,
      targetDate: card.targetDate || 'TBD',
    };
  }).filter(Boolean);
}

// Business problem summaries for each quarter of each Big Rock
const BIG_ROCK_QUARTER_SUMMARIES = {
  rock1: {
    q1: 'Automate item setup to reduce manual work and enable faster product launches',
    q2: 'Launch design tools and shared strategy planning for trend-driven assortments',
    q3: 'Deploy Strategy Hub and forecast services to enable real-time trend signals',
    q4: 'Complete data inputs for strategy hub to power automated decision-making',
  },
  rock2: {
    q1: 'Automate item setup to accelerate inventory placement workflows',
    q2: 'Build tagging and assortment foundations for dynamic allocation',
    q3: 'Enable wave planning, fixture allocation, and tag-based recommendations',
    q4: 'Expand item sources and complete unified planning capabilities',
  },
  rock3: {
    q1: 'Automate item setup to eliminate manual PO creation steps',
    q2: 'Connect shared repositories and commitment reports across systems',
    q3: 'Deploy enterprise services for BQ, AI item repo, and supplier collaboration',
    q4: 'Complete end-to-end item pipeline with expanded data sources',
  },
};

// Render quarterly initiatives for a Big Rock
function renderBigRockQuarter(rockId, quarter, quarterLabel) {
  const initiatives = getBigRockInitiatives(rockId, quarter);
  const summary = BIG_ROCK_QUARTER_SUMMARIES[rockId]?.[`q${quarter}`] || '';
  
  if (initiatives.length === 0) return '';
  
  const initiativesList = initiatives.map(init => `
    <div class="bigrock-initiative" onclick="openCardModal('${init.id}')">
      <span class="bigrock-init-dot">${init.statusDot}</span>
      <span class="bigrock-init-title">${init.title}</span>
      <span class="bigrock-init-date">${init.targetDate}</span>
    </div>
  `).join('');
  
  return `
    <div class="bigrock-quarter-section">
      <div class="bigrock-quarter-header">
        <div class="bigrock-quarter-label">Q${quarter} — ${quarterLabel}</div>
        <div class="bigrock-quarter-summary">${summary}</div>
      </div>
      <div class="bigrock-quarter-content">
        ${initiativesList}
      </div>
    </div>
  `;
}

// Render metrics box for a Big Rock
function renderBigRockMetrics(rockId) {
  // Simplified goals display - not hyper-specific to phases
  // Phase details are shown in the goal modal when clicked
  const metrics = {
    rock1: {
      title: 'Trend Anticipation Goals',
      goals: [
        { id: '5', label: 'Reduce Trapped Inventory', icon: '📦' },
        { id: '8', label: 'Increase Sell-Through Rate', icon: '📈' },
      ]
    },
    rock2: {
      title: 'Proactive Allocation Goals',
      goals: [
        { id: '5', label: 'Reduce Trapped Inventory', icon: '📦' },
        { id: '6', label: '85% Shop In-Stock Rate', icon: '🛒' },
        { id: '7', label: '90% PO Redistribution Coverage', icon: '🔄' },
      ]
    },
    rock3: {
      title: 'Connected Systems Goals',
      goals: [
        { id: '1', label: '90% of Buys on Happy Path', icon: '🛳️' },
        { id: '2', label: 'Zero Rekeys Across E2E Workflow', icon: '⌧' },
        { id: '4', label: 'Reduce Merchant Hours', icon: '⏱️' },
      ]
    },
  };
  
  const metricData = metrics[rockId];
  if (!metricData) {
    console.warn('Big Rocks: No metric data found for', rockId);
    return '';
  }
  
  // Access actual goals from GOALS (loaded from data-goals.js)
  const goalsData = (typeof GOALS !== 'undefined') ? GOALS : {};
  
  return `
    <div class="bigrock-metrics-box">
      <h3 class="bigrock-metrics-title">🎯 ${metricData.title}</h3>
      <div class="bigrock-metrics-grid">
        ${metricData.goals.map(goalRef => {
          const goal = goalsData[goalRef.id];
          if (!goal) return '';
          
          return `
            <div class="bigrock-metric-card" onclick="openGoalModal('${goal.id}')" style="cursor: pointer;">
              <div class="bigrock-metric-header">
                <span class="bigrock-metric-icon">${goalRef.icon}</span>
                <span class="bigrock-metric-label">${goal.label}</span>
              </div>
              <div class="bigrock-metric-summary">
                ${goal.target}
              </div>
              <div class="bigrock-metric-footer">
                Click for details →
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="bigrock-metrics-footer">
        Click any goal to see full details, phases, and key programs
      </div>
    </div>
  `;
}

// Render timeline visualization for a Big Rock
function renderBigRockTimeline(rockId) {
  const timelines = {
    rock1: {
      title: 'Trend Anticipation Delivery Timeline',
      quarters: [
        { q: 'Q1', label: 'Foundation', items: ['Strategy Hub Launch', 'Forecast Service Kickoff'] },
        { q: 'Q2', label: 'Design Acceleration', items: ['Design Hub Phase 1', 'Event Layer Integration'] },
        { q: 'Q3', label: 'Trend Intelligence', items: ['Shared Merch Strategy', 'Visual Board MVP'] },
        { q: 'Q4', label: 'Full Integration', items: ['Design Hub Complete', 'AP Tool Quarterly Refresh'] },
      ]
    },
    rock2: {
      title: 'Proactive Allocation Delivery Timeline',
      quarters: [
        { q: 'Q1', label: 'Foundation', items: ['AEX Stability Phase 1', 'Item Setup Automation Starts'] },
        { q: 'Q2', label: 'Automation', items: ['Automated Setup Live', 'Visual Fixture Allocation'] },
        { q: 'Q3', label: 'Intelligence', items: ['Enterprise Wave Planning', 'Tag-Based Pilot'] },
        { q: 'Q4', label: 'Advanced Capabilities', items: ['Affinity Models', 'Dynamic Allocation'] },
      ]
    },
    rock3: {
      title: 'Connected Systems Delivery Timeline',
      quarters: [
        { q: 'Q1', label: 'Stability', items: ['AEX Foundations', 'Shared Repository'] },
        { q: 'Q2', label: 'Automation', items: ['AI Item Repository', 'BQ Enterprise Service'] },
        { q: 'Q3', label: 'Integration', items: ['BAM/Collab Connect', 'Automated Size/Pack'] },
        { q: 'Q4', label: 'Convergence', items: ['Full API Integration', 'Single Data Flow'] },
      ]
    },
  };
  
  const timelineData = timelines[rockId];
  if (!timelineData) return '';
  
  return `
    <div class="bigrock-timeline-box">
      <h3 class="bigrock-timeline-title">📅 ${timelineData.title}</h3>
      <div class="bigrock-timeline-grid">
        ${timelineData.quarters.map((q, idx) => `
          <div class="bigrock-timeline-quarter">
            <div class="bigrock-timeline-q-header">
              <div class="bigrock-timeline-q-num">${q.q}</div>
              <div class="bigrock-timeline-q-label">${q.label}</div>
            </div>
            <div class="bigrock-timeline-items">
              ${q.items.map(item => `
                <div class="bigrock-timeline-item">• ${item}</div>
              `).join('')}
            </div>
            ${idx < timelineData.quarters.length - 1 ? '<div class="bigrock-timeline-connector">→</div>' : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Render full Big Rocks narrative
function renderBigRocksNarrative() {
  return `
    <div class="review-back-bar">
      <button class="review-back-button" onclick="clearBusinessReview()">
        ← Back
      </button>
      <button class="bigrock-print-btn" onclick="printBigRocks()">
        🖨️ Print to PDF
      </button>
    </div>
    
    <div class="review-header">
      <div class="review-header-title">
        <span class="review-header-icon">🏔️</span>
        Big Rocks: E2E Fashion Strategic Narrative
      </div>
      <div class="review-header-subtitle">
        Executive leadership view of the three critical transformation priorities
      </div>
    </div>
    
    <div class="bigrock-narrative">
      
      <!-- BIG ROCK 1: TREND ANTICIPATION -->
      <div class="bigrock-section">
        <div class="bigrock-header">
          <span class="bigrock-number">1</span>
          <span class="bigrock-title">WE CANNOT ANTICIPATE OR REACT TO TRENDS</span>
        </div>
        
        <div class="bigrock-subsection">
          <h3 class="bigrock-subsection-title">THE PROBLEM</h3>
          <p class="bigrock-text">
            Fashion trends emerge and evolve at the speed of social media—a viral TikTok moment can shift customer demand overnight. 
            Yet our planning processes remain anchored to annual cycles built around last year's sales data. Merchants rely on historical 
            performance and gut instinct to make buying decisions 12+ months in advance, with no real-time visibility into emerging trends 
            or shifting customer preferences. By the time we identify a trend, design product, negotiate with suppliers, and get inventory 
            to stores, the moment has often passed. We're constantly chasing yesterday's hot item instead of anticipating tomorrow's.
          </p>
        </div>
        
        <div class="bigrock-subsection">
          <h3 class="bigrock-subsection-title">THE IMPACT</h3>
          <p class="bigrock-text">
            This trend blindness creates a cascade of business pain. We miss revenue opportunities when competitors react faster to viral 
            moments and seasonal shifts. When we do chase trends late, we carry markdown risk because we're buying into the tail end of 
            a trend cycle. Merchants spend countless hours in reactive mode—firefighting to secure hot items that are already selling out 
            industry-wide—instead of proactively shaping assortments based on forward-looking signals. The result: we're positioning ourselves 
            as a follower in fast fashion rather than a leader, and our customers notice.
          </p>
        </div>
        
        ${renderBigRockMetrics('rock1')}
        ${renderBigRockTimeline('rock1')}
        
        <div class="bigrock-subsection">
          <h3 class="bigrock-subsection-title">WHAT WE'RE BUILDING</h3>
          <p class="bigrock-text">
            We're investing in a suite of capabilities that shift Fashion from reactive to predictive. The Strategy Hub will aggregate 
            real-time trend signals from social media, search data, and competitive intelligence, giving merchants forward-looking insights 
            6-9 months earlier than today's historical analytics. The Design Hub (Centric PLM) compresses our design-to-sample cycle from 
            8 weeks to 2 weeks, enabling rapid prototyping when we spot emerging trends. AP Tool integration moves line planning from rigid 
            annual commitments to quarterly refresh cycles, giving merchants the flexibility to pivot assortments mid-season. Together, these 
            tools create a continuous feedback loop: identify trends early, design quickly, and adjust buys before commitments lock us in.
          </p>
          
          <div class="bigrock-quarterly-wrap">
            <div class="bigrock-quarterly-label">Quarterly Roadmap</div>
            <div class="bigrock-quarters">
              ${renderBigRockQuarter('rock1', 1, 'Q1 Feb–Apr')}
              ${renderBigRockQuarter('rock1', 2, 'Q2 May–Jul')}
              ${renderBigRockQuarter('rock1', 3, 'Q3 Aug–Oct')}
              ${renderBigRockQuarter('rock1', 4, 'Q4 Nov–Jan')}
            </div>
          </div>
        </div>
        
        <div class="bigrock-subsection">
          <h3 class="bigrock-subsection-title">EXPECTED OUTCOME</h3>
          <p class="bigrock-text">
            By the end of FY27, merchants will make buying decisions based on what customers want tomorrow, not what they bought last year. 
            We'll compress the trend-to-shelf cycle from 12 months to 6 months for agile categories, giving us the speed to compete with 
            fast-fashion disruptors. Merchants shift from reactive firefighting to proactive trend curation—spending time shaping assortments 
            instead of chasing stockouts. The business outcome: higher full-price sell-through, lower markdowns, and a reputation as a 
            destination for on-trend product instead of last season's leftovers.
          </p>
        </div>
      </div>
      
      <!-- BIG ROCK 2: PROACTIVE ALLOCATION -->
      <div class="bigrock-section">
        <div class="bigrock-header">
          <span class="bigrock-number">2</span>
          <span class="bigrock-title">WE CANNOT PROACTIVELY ALLOCATE INVENTORY</span>
        </div>
        
        <div class="bigrock-subsection">
          <h3 class="bigrock-subsection-title">THE PROBLEM</h3>
          <p class="bigrock-text">
            We place purchase orders 12+ months in advance based on static line plans and historical sales patterns. Once committed, we're 
            locked in—unable to pivot when customer preferences shift, regional demand changes, or unexpected trends emerge. Our mod structures 
            are rigid and inflexible, constraining how we allocate inventory to stores. Legacy allocation processes force planners into manual 
            workarounds, spreadsheet gymnastics, and endless negotiations with DC operations just to get the right product to the right place. 
            By the time we recognize a demand signal (a style selling out in Texas but sitting stagnant in Pennsylvania), it's too late to 
            react. We're constrained by capacity decisions made a year ago, with no agility to adjust to today's customer needs.
          </p>
        </div>
        
        <div class="bigrock-subsection">
          <h3 class="bigrock-subsection-title">THE IMPACT</h3>
          <p class="bigrock-text">
            This rigidity creates massive inefficiency. We miss sales when hot items sell out in high-demand stores while excess inventory 
            sits untouched elsewhere. Planners spend hours manually reallocating inventory in spreadsheets, only to face downstream execution 
            failures when systems can't support their intent. Markdown risk increases because we can't adjust buys mid-season—we're stuck 
            with yesterday's plan even when today's data screams for a pivot. The result: lost revenue, excess inventory, and planner 
            frustration as they fight legacy tools instead of optimizing for customer demand.
          </p>
        </div>
        
        ${renderBigRockMetrics('rock2')}
        ${renderBigRockTimeline('rock2')}
        
        <div class="bigrock-subsection">
          <h3 class="bigrock-subsection-title">WHAT WE'RE BUILDING</h3>
          <p class="bigrock-text">
            We're building capabilities that shift allocation from static to dynamic. AEX Stability eliminates the manual workarounds and 
            system fragility that force planners into reactive firefighting mode. Automated Item Setup removes the 5+ hour variant group 
            setup nightmare, freeing planners to focus on strategy instead of data entry. Fashion Fixture Allocation (Visual) gives planners 
            real-world mod capacity constraints upfront, eliminating downstream allocation failures. Enterprise Wave Planning enables 
            intelligent, demand-driven allocation across stores based on real-time signals instead of last year's one-size-fits-all approach. 
            Tag-based allocation and affinity models let us group products intelligently and allocate based on customer behavior, not just 
            historical averages. Together, these capabilities enable planners to react to demand shifts in weeks, not months.
          </p>
          
          <div class="bigrock-quarterly-wrap">
            <div class="bigrock-quarterly-label">Quarterly Roadmap (Click to Expand)</div>
            <div class="bigrock-quarters">
              ${renderBigRockQuarter('rock2', 1, 'Q1 Feb–Apr')}
              ${renderBigRockQuarter('rock2', 2, 'Q2 May–Jul')}
              ${renderBigRockQuarter('rock2', 3, 'Q3 Aug–Oct')}
              ${renderBigRockQuarter('rock2', 4, 'Q4 Nov–Jan')}
            </div>
          </div>
        </div>
        
        <div class="bigrock-subsection">
          <h3 class="bigrock-subsection-title">EXPECTED OUTCOME</h3>
          <p class="bigrock-text">
            By FY27, planners will allocate inventory based on real-time demand signals, not last year's averages. Mod flexibility and 
            intelligent wave planning enable us to pivot allocations mid-season when demand shifts. Automated setup processes free planners 
            from manual data entry, giving them time to analyze customer behavior and optimize assortments proactively. The business outcome: 
            higher in-stock rates for high-demand items, lower markdowns from regional misallocations, and planner capacity redirected from 
            firefighting to strategic optimization. We shift from "allocation by habit" to "allocation by intelligence."
          </p>
        </div>
      </div>
      
      <!-- BIG ROCK 3: CONNECTED SYSTEMS -->
      <div class="bigrock-section">
        <div class="bigrock-header">
          <span class="bigrock-number">3</span>
          <span class="bigrock-title">OUR SYSTEMS ARE NOT CONNECTED</span>
        </div>
        
        <div class="bigrock-subsection">
          <h3 class="bigrock-subsection-title">THE PROBLEM</h3>
          <p class="bigrock-text">
            Our teams operate across a fragmented landscape of disconnected systems. Merchants plan in one tool, designers work in another, 
            buyers enter data into a third, and allocators use a fourth. None of these systems talk to each other. Data entered in the 
            Strategy Hub doesn't flow to Design Hub. Design specs don't auto-populate into Buying tools. Buy quantities don't automatically 
            feed Allocation systems. The result: endless re-keying of the same data across multiple platforms, with errors compounding at 
            every handoff. Teams spend more time on data entry and validation than on strategic decision-making. A simple change (update a 
            color option) requires manual updates in 4+ systems, creating a nightmare of version control and downstream misalignment.
          </p>
        </div>
        
        <div class="bigrock-subsection">
          <h3 class="bigrock-subsection-title">THE IMPACT</h3>
          <p class="bigrock-text">
            System fragmentation creates massive waste. Teams spend 40-60% of their time on manual data entry instead of strategic work. 
            Errors multiply at every handoff—a typo in the design tool cascades into allocation failures weeks later. Cross-functional 
            collaboration is nearly impossible because teams can't see each other's work in real time. By the time a merchant realizes a 
            design won't fit the mod capacity, it's too late to course-correct. We're stuck in reactive mode, fixing errors instead of 
            preventing them. The result: longer time-to-market, higher error rates, frustrated teams, and massive opportunity cost as our 
            best people spend their days re-entering data instead of solving business problems.
          </p>
        </div>
        
        ${renderBigRockMetrics('rock3')}
        ${renderBigRockTimeline('rock3')}
        
        <div class="bigrock-subsection">
          <h3 class="bigrock-subsection-title">WHAT WE'RE BUILDING</h3>
          <p class="bigrock-text">
            We're building an integrated system architecture where data flows automatically across the E2E Fashion process. AEX Stability 
            creates a reliable foundation for buy quantification and allocation, eliminating the workarounds that force manual re-entry. 
            Automated Item Setup removes the 43,000+ hours of manual data entry currently required for size and width runs. The Shared Item 
            Repository and AI Item Repository enable suppliers to submit data once, auto-populating attributes across all downstream systems. 
            Buy Quantification as an Enterprise Service creates a single source of truth for quantities, eliminating the need to recalculate 
            in 3+ separate tools. BAM/Collab integration connects design intent to buying execution seamlessly. Intent-to-Setup pipelines 
            ensure merchant plans automatically trigger supplier workflows. Together, these integrations create a connected ecosystem where 
            data is entered once and flows intelligently across the entire E2E process.
          </p>
          
          <div class="bigrock-quarterly-wrap">
            <div class="bigrock-quarterly-label">Quarterly Roadmap (Click to Expand)</div>
            <div class="bigrock-quarters">
              ${renderBigRockQuarter('rock3', 1, 'Q1 Feb–Apr')}
              ${renderBigRockQuarter('rock3', 2, 'Q2 May–Jul')}
              ${renderBigRockQuarter('rock3', 3, 'Q3 Aug–Oct')}
              ${renderBigRockQuarter('rock3', 4, 'Q4 Nov–Jan')}
            </div>
          </div>
        </div>
        
        <div class="bigrock-subsection">
          <h3 class="bigrock-subsection-title">EXPECTED OUTCOME</h3>
          <p class="bigrock-text">
            By FY27, teams will operate in a connected ecosystem where data flows automatically across tools. Merchants, designers, buyers, 
            and allocators will see real-time updates from each other's work, enabling proactive collaboration instead of reactive firefighting. 
            Manual data entry time drops by 50-70%, freeing teams to focus on strategic decision-making instead of system maintenance. Errors 
            decrease dramatically because data is entered once and validated at the source. The business outcome: faster time-to-market, 
            higher data accuracy, improved cross-functional collaboration, and teams empowered to solve business problems instead of fighting 
            disconnected systems. We shift from "data entry as a job" to "intelligence as a job."
          </p>
        </div>
      </div>
      
    </div>
  `;
}

// Initialize business reviews when DOM is ready
function initBusinessReviews() {
  console.log('🐶 Initializing Business Reviews...', {
    hasPillars: !!window.PILLARS,
    pillarCount: window.PILLARS ? window.PILLARS.length : 0,
    totalCards: window.PILLARS ? window.PILLARS.flatMap(p => p.cards || []).length : 0
  });
  
  // Render all review content divs
  Object.keys(BUSINESS_REVIEWS).forEach(reviewType => {
    renderReviewContent(reviewType);
  });
  
  console.log('✅ Business Reviews initialized!');
}

// Auto-init when PILLARS is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for PILLARS to be defined
    const checkPillars = setInterval(() => {
      if (window.PILLARS) {
        clearInterval(checkPillars);
        initBusinessReviews();
      }
    }, 100);
  });
} else {
  const checkPillars = setInterval(() => {
    if (window.PILLARS) {
      clearInterval(checkPillars);
      initBusinessReviews();
    }
  }, 100);
}
