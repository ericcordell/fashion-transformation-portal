// Control Panel - Unified Business Reviews + Status + Filters
// Combines business review selector, status overview, and filtering controls

const CONTROL_PANEL = {
  currentReview: null,
  dropdownOpen: false,
  activeFilter: 'all', // all, critical, ry, done
};

// Business review definitions
const REVIEW_OPTIONS = [
  {
    id: 'wpr',
    icon: '🎯',
    name: 'Weekly Program Review (WPR)',
    desc: 'Critical programs + next 90 days',
    enabled: true,
  },
  {
    id: 'mbr',
    icon: '📅',
    name: 'Monthly Business Review (MBR)',
    desc: 'Coming Soon',
    enabled: false,
  },
  {
    id: 'gantt',
    icon: '📊',
    name: 'Gantt Chart',
    desc: 'FY27 roadmap by quarter',
    enabled: true,
  },
];

// Status scopes (from exec-summary.js)
const STATUS_SCOPES = [
  { key: 'overall',    type: 'overall',    label: 'E2E Overview',         icon: '🗺️' },
  { key: 'strategy',   type: 'workstream', label: 'Strategy',             icon: '🧭' },
  { key: 'design',     type: 'workstream', label: 'Design',               icon: '🎨' },
  { key: 'buying',     type: 'workstream', label: 'Buying',               icon: '🛒' },
  { key: 'allocation', type: 'workstream', label: 'Allocation',           icon: '📦' },
];

// Card filter definitions (mutually exclusive - only one active at a time)
const CARD_FILTERS_DEF = [
  { key: 'all',      label: '📋 All',      color: '#0053e2' },
  { key: 'critical', label: '⭐ Critical', color: '#ffc220' },
  { key: 'ry',       label: '🚨 R/Y',     color: '#ea1100' },
  { key: 'done',     label: '✅ Done',     color: '#2a8703' },
];

// Get filter state from phase-view.js
function getFilterState() {
  if (typeof pmGetState === 'function') {
    return pmGetState();
  }
  return { cardFilters: new Set(), expandedPhases: new Set([1]) };
}

// Calculate status for a scope
function calculateStatus(scope) {
  const allCards = window.PILLARS ? window.PILLARS.flatMap(p => p.cards || []) : [];
  let cards = allCards;
  
  if (scope.type === 'workstream') {
    cards = allCards.filter(c => (c.workstreams || []).includes(scope.key));
  } else if (scope.type === 'phase') {
    const phaseMap = window.CARD_PHASE_MAP || {};
    cards = allCards.filter(c => phaseMap[c.id] === scope.phaseNum);
  }
  
  const counts = { red: 0, yellow: 0, green: 0, completed: 0, roadmap: 0, total: cards.length };
  const priority = { roadmap: 0, completed: 1, green: 2, yellow: 3, red: 4 };
  let worst = 'roadmap';
  
  cards.forEach(c => {
    const status = c.status || 'roadmap';
    if (counts[status] !== undefined) counts[status]++;
    if ((priority[status] || 0) > (priority[worst] || 0)) worst = status;
  });
  
  return { ...counts, worst };
}

// Render control panel
function renderControlPanel() {
  const wrap = document.getElementById('control-panel-banner');
  if (!wrap) return;
  
  const state = getFilterState();
  const expandedPhases = state.expandedPhases || new Set([1]);
  const phaseDefs = window.PHASE_DEFS || [];
  const activeFilter = CONTROL_PANEL.activeFilter || 'all';
  
  const currentReviewObj = REVIEW_OPTIONS.find(r => r.id === CONTROL_PANEL.currentReview);
  
  let html = `
    <div class="control-panel-wrap">
    <div class="control-panel-sections">
      <!-- Section 1: Business Reviews -->
      <div class="cp-section">
        <div class="cp-review-select">
          <button class="cp-review-btn ${CONTROL_PANEL.currentReview ? 'active' : ''}" 
                  onclick="toggleReviewDropdown()">
            ${currentReviewObj ? currentReviewObj.icon : '📋'} Reviews ${CONTROL_PANEL.currentReview ? '✓' : '▼'}
          </button>
          <div class="cp-review-dropdown ${CONTROL_PANEL.dropdownOpen ? 'show' : ''}" id="review-dropdown">
            ${REVIEW_OPTIONS.map(review => `
              <div class="cp-review-option ${review.id === CONTROL_PANEL.currentReview ? 'active' : ''} ${!review.enabled ? 'disabled' : ''}" 
                   onclick="selectBusinessReview('${review.id}')">
                <span class="cp-review-icon">${review.icon}</span>
                <div class="cp-review-text">
                  <div class="cp-review-name">${review.name}</div>
                  <div class="cp-review-desc">${review.desc}</div>
                </div>
                ${!review.enabled ? '<span class="cp-review-badge">Soon</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <span class="cp-sep"></span>
      
      <!-- Section 2: Quick Status -->
      <div class="cp-section">
        <div class="cp-section-label">Quick Status:</div>
        <div class="cp-status-chips">
          ${STATUS_SCOPES.map(scope => {
            const stats = calculateStatus(scope);
            const statusColors = {
              red: '#ea1100',
              yellow: '#ffc220',
              green: '#2a8703',
              completed: '#0053e2',
              roadmap: '#94a3b8',
            };
            const statusLabels = {
              red: 'At Risk',
              yellow: 'Watch',
              green: 'On Track',
              completed: 'Done',
              roadmap: 'Roadmap',
            };
            const dotColor = statusColors[stats.worst] || '#94a3b8';
            const statusLabel = statusLabels[stats.worst] || 'Roadmap';
            
            return `
              <button class="cp-status-chip ${scope.type}" 
                      onclick="openStatusModal('${scope.key}')">
                <span class="cp-status-dot" style="background:${dotColor};"></span>
                ${scope.icon} ${scope.label}
                <span class="cp-status-badge" 
                      style="background:${dotColor}20;color:${dotColor};border:1px solid ${dotColor}40;">
                  ${statusLabel}
                </span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
      
      <span class="cp-sep"></span>
      
      <!-- Section 3: Filters -->
      <div class="cp-section cp-filters">
        <div class="cp-section-label">Filters:</div>
        <div class="cp-filter-row">
          ${CARD_FILTERS_DEF.map(f => `
            <button class="cp-filter-pill ${activeFilter === f.key ? 'active' : ''}" 
                    style="${activeFilter === f.key ? `background: ${f.color}; color: white; border-color: ${f.color};` : ''}" 
                    onclick="selectFilter('${f.key}')">
              ${f.label}
            </button>
          `).join('')}
          <span class="cp-sep"></span>
          ${phaseDefs.filter(ph => ph.num !== 1).map(ph => `
            <button class="cp-phase-pill ${expandedPhases.has(ph.num) ? 'active' : ''}" 
                    style="--phc:${ph.color};" 
                    onclick="typeof pmTogglePhase === 'function' && pmTogglePhase(${ph.num})">
              ${ph.emoji} Ph${ph.num} ${expandedPhases.has(ph.num) ? '▲' : '▼'}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
    </div>
  `;
  
  wrap.innerHTML = html;
}

// Toggle review dropdown
function toggleReviewDropdown() {
  CONTROL_PANEL.dropdownOpen = !CONTROL_PANEL.dropdownOpen;
  renderControlPanel();
  
  // Close dropdown when clicking outside
  if (CONTROL_PANEL.dropdownOpen) {
    setTimeout(() => {
      document.addEventListener('click', closeDropdownOnClickOutside);
    }, 0);
  }
}

function closeDropdownOnClickOutside(e) {
  const dropdown = document.getElementById('review-dropdown');
  if (dropdown && !dropdown.contains(e.target) && !e.target.closest('.cp-review-btn')) {
    CONTROL_PANEL.dropdownOpen = false;
    renderControlPanel();
    document.removeEventListener('click', closeDropdownOnClickOutside);
  }
}

// Select a business review
function selectBusinessReview(reviewId) {
  const review = REVIEW_OPTIONS.find(r => r.id === reviewId);
  
  // Show coming soon for disabled reviews
  if (!review || !review.enabled) {
    alert('🕒 Coming Soon!\n\nThe Monthly Business Review (MBR) is currently in development. Check back soon!');
    CONTROL_PANEL.dropdownOpen = false;
    renderControlPanel();
    return;
  }
  
  // Toggle behavior: if clicking the same review, exit
  if (CONTROL_PANEL.currentReview === reviewId) {
    clearBusinessReview();
    return;
  }
  
  CONTROL_PANEL.currentReview = reviewId;
  CONTROL_PANEL.dropdownOpen = false;
  
  // Show the review content using the existing business-reviews.js logic
  if (typeof showReview === 'function') {
    showReview(reviewId === 'wpr' ? 'wpr' : reviewId);
  }
  
  renderControlPanel();
}

// Clear business review (back to portal)
window.clearBusinessReview = function() {
  CONTROL_PANEL.currentReview = null;
  CONTROL_PANEL.dropdownOpen = false;
  
  if (typeof exitReviewMode === 'function') {
    exitReviewMode();
  }
  
  renderControlPanel();
}

// Open status modal (wrapper to prevent highlighting issues)
function openStatusModal(scopeKey) {
  if (window._esOpenModal) {
    window._esOpenModal(scopeKey);
  }
}

// Select a filter (mutually exclusive)
window.selectFilter = function(filterKey) {
  CONTROL_PANEL.activeFilter = filterKey;
  
  // Clear all existing filters first
  if (typeof pmClearFilters === 'function') {
    pmClearFilters();
  }
  
  // Apply the new filter (if not 'all')
  if (filterKey !== 'all' && typeof pmToggleCardFilter === 'function') {
    // Map our filter keys to phase-view filter keys
    const filterMap = {
      'critical': 'critical',
      'ry': 'ry',
      'done': 'completed'
    };
    
    const phaseViewKey = filterMap[filterKey];
    if (phaseViewKey) {
      pmToggleCardFilter(phaseViewKey);
    }
  }
  
  renderControlPanel();
}

// Initialize control panel
function initControlPanel() {
  console.log('🐶 Initializing Control Panel...');
  
  // Wait for PILLARS and phase-view to be ready
  const checkReady = setInterval(() => {
    if (window.PILLARS && typeof pmGetState === 'function') {
      clearInterval(checkReady);
      
      // Set default filter to 'all'
      CONTROL_PANEL.activeFilter = 'all';
      
      renderControlPanel();
      console.log('✅ Control Panel initialized!');
    }
  }, 100);
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initControlPanel);
} else {
  initControlPanel();
}
