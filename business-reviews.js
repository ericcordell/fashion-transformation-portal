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
    
    // Critical Programs Section
    if (criticalCards.length > 0) {
      html += renderWPRSection('⭐ Critical Programs', criticalCards, '⭐');
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

// Render WPR section as a table
function renderWPRSection(title, cards, icon) {
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
      <tr onclick="openCardModal('${card.id}')">
        <td class="wpr-program-cell">
          <div class="wpr-program-name">
            <span class="wpr-program-icon">${card.icon || '📌'}</span>
            <span>${card.title}</span>
            ${((card.tag || '').indexOf('Critical') > -1) ? '<span class="wpr-critical-badge">⭐ CRITICAL</span>' : ''}
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
        <thead>
          <tr>
            <th>Program</th>
            <th>Status</th>
            <th>Owner</th>
            <th>Target Date</th>
            <th style="width: 30%;">Update (Last 14 Days)</th>
            <th>Workstreams</th>
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
