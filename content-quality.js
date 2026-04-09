/**
 * content-quality.js — PM Content Quality Scorer
 *
 * Scores Problem Statement, Description, and Business Impact text against
 * PM best-practice rubrics and renders a hoverable quality badge next to
 * each section label in the Overview tab.
 *
 * Grade scale:  'good' | 'fair' | 'needs-work'
 * Entry points: scoreContent(text, type), cqBadge(text, type)
 */

// ── Persona detection (who is affected / who benefits) ────────────────────────
const _RX_PERSONA = /\b(merchant|planner|buyer|designer|leader|leadership|associate|supplier|brand[\s-]?team|buying[\s-]?team|planning[\s-]?team|fashion[\s-]?team|design[\s-]?team|category[\s-]?manager|vendor|partner|executive|vp|director)\b/i;

// Current-state pain signals (Problem Statement)
const _RX_PAIN = /\b(today|currently|manual(ly)?|friction|inefficien|fragmented|discon(nect|joined)|relying on|relies on|require[sd]|lack[s ]|challenge|error[- ]prone|delay[sed]?|rework|re.ent(er|ry)|duplicate|back.and.forth|multiple system|various system|outside of|email|spreadsheet|no\s+(single|unified|system|visibility)|spend[s]?\s+\w+\s+time)\b/i;

// Solution HOW verbs (Description)
const _RX_HOW = /\b(will\s|enable[sd]?|allow[s]?|build[s]?|creat(e[sd]?|ing)|automat|integrat|surfac|provid|leverag|consolidat|centraliz|streamlin|replac(e[sd]?|ing)|eliminat|empower|simplif|introduc|deploy[s]?)\b/i;

// Specific tech / product nouns (Description)
const _RX_TECH = /\b(AEX|OPIF|OneSource|Centric|JDA|BQ|BigQuery|ML|AI|machine learning|service|API|workflow|dashboard|report|alert|platform|integration|model|tool|system|portal|interface|feed|pipeline|automation|data[\s-]?layer)\b/i;

// Quantitative value signals (Business Impact)
const _RX_CURRENCY   = /(\$[\d,.]+|\d[\d,.]*\s*(?:M|MM|B|K|billion|million|thousand)\b|incremental\s+(revenue|sales|GMV|NMV)|\bGMV\b|\bNMV\b)/i;
const _RX_TIME_SAVES = /\b(\d[\d,.]*\s*(hour|hr|minute|min|day|week|month|year)s?\b|hours?\s+saved|days?\s+saved|time\s+saved|annually|per\s+year|per\s+week|\d+x\s+faster|faster\s+than)/i;
const _RX_UNITS      = /\b(\d[\d,.]*\s*(%|percent|basis\s*point|bp|item|unit|FTE|associate|store|supplier|order|sku|style)s?\b|\d+x\b|X\s*(faster|more|items|hours)|(reduction|increase|improvement|decrease)\s+(in|of)\s+\d)/i;
const _RX_QUAL       = /\b(enable[sd]?|allow[s]?|improve[sd]?|reduc[esd]+|increas[esd]+|sav(e[sd]?|ing)|faster|better|more\s+efficient|streamlin|simplif|eliminat|empower|accelerat|unlock[s]?|deliver[s]?|free[sd]?\s+up|driv[esd]+)\b/ig;

// ── Rubric scorers ────────────────────────────────────────────────────────────

function _scoreProblemStatement(t) {
  const tips = [];
  let score  = 0;

  // 1. Specific persona (0–2)
  if (_RX_PERSONA.test(t)) {
    score += 2;
  } else {
    tips.push('Name a specific persona — who experiences this pain? e.g. "Today, Fashion Merchants spend X hours…" or "Buying Associates manually track…"');
  }

  // 2. Current-state pain language (0–2)
  const painHits = (t.match(new RegExp(_RX_PAIN.source, 'gi')) || []).length;
  if (painHits >= 3)      { score += 2; }
  else if (painHits >= 1) {
    score += 1;
    tips.push('Deepen the pain — quantify frequency, volume, or downstream impact (e.g. how often this happens, how many people are affected, what breaks downstream).');
  } else {
    tips.push('Describe the current-state pain — what does the person do today that is slow, error-prone, or frustrating?');
  }

  // 3. Does NOT open with the solution (0–1)
  if (!/^(we (will|are|have|plan)|the (solution|goal|system|tool|platform|initiative)|build|this\s+(tool|feature|project|initiative)\s+will)/i.test(t.slice(0, 80))) {
    score += 1;
  } else {
    tips.push('Lead with the pain, not the solution — a Problem Statement should describe who is hurting and why before proposing an answer.');
  }

  // 4. Length / specificity (0–1)
  if (t.length >= 250) { score += 1; }
  else { tips.push('Add more context — 250+ characters typically needed to cover who, what, and why it matters to the business.'); }

  return { grade: score >= 5 ? 'good' : score >= 3 ? 'fair' : 'needs-work', score, maxScore: 6, tips };
}

function _scoreDescription(t) {
  const tips = [];
  let score  = 0;

  // 1. Solution HOW verbs (0–2)
  const howHits = (t.match(new RegExp(_RX_HOW.source, 'gi')) || []).length;
  if (howHits >= 3)      { score += 2; }
  else if (howHits >= 1) {
    score += 1;
    tips.push('Strengthen the "how" — describe the solution mechanism more explicitly (e.g. "AEX will surface a unified workflow that automatically…").');
  } else {
    tips.push('Describe HOW this solves the problem — use active verbs: "will enable", "automates", "integrates", "surfaces". Avoid restating the problem.');
  }

  // 2. Specific product / tech noun (0–2)
  if (_RX_TECH.test(t)) { score += 2; }
  else { tips.push('Name the specific system, tool, or capability being built — make the scope concrete and reviewable (e.g. "an AEX-native workflow", "a BigQuery service", "a Centric integration").'); }

  // 3. Persona benefit tie-in — who benefits (0–1)
  if (_RX_PERSONA.test(t)) { score += 1; }
  else { tips.push('Connect the solution to who benefits — e.g. "…so Merchants can focus on strategy instead of data entry" or "…giving Planners a single source of truth".'); }

  return { grade: score >= 4 ? 'good' : score >= 2 ? 'fair' : 'needs-work', score, maxScore: 5, tips };
}

function _scoreBusinessImpact(t) {
  const tips = [];
  let score  = 0;
  let hasQuant = false;
  let hasQual  = false;

  // 1. Quantitative signals (each independently adds points, cap at 4)
  if (_RX_CURRENCY.test(t))   { score += 2; hasQuant = true; }
  if (_RX_TIME_SAVES.test(t)) { score += Math.min(2, 4 - score); hasQuant = true; }
  if (_RX_UNITS.test(t))      { score += 1; hasQuant = true; }

  // 2. Qualitative narrative (0–2)
  const qualHits = (t.match(_RX_QUAL) || []).length;
  if (qualHits >= 2)      { score += 2; hasQual = true; }
  else if (qualHits >= 1) { score += 1; hasQual = true; }

  // 3. Bonus: both quant AND qual present (1)
  if (hasQuant && hasQual) score += 1;

  // Tips
  if (!hasQuant)
    tips.push('Add a quantitative value — e.g. "$50MM incremental GMV", "2,000 hours saved annually", "15% reduction in item setup errors", or "X FTE equivalent capacity freed". Leadership needs a number.');
  if (!hasQual)
    tips.push('Add a qualitative narrative — explain the mechanism: how does this generate that value? A number alone isn\'t enough; explain the cause-and-effect.');
  if (hasQuant && hasQual && score < 5)
    tips.push('Consider a second value dimension — e.g. revenue impact ($) AND time savings (hours/year) or quality improvement (% error rate reduction).');
  if (t.length < 80)
    tips.push('Expand this section — Business Impact should explain both the value delivered and how it\'s achieved, not just a one-liner.');

  return { grade: score >= 5 ? 'good' : score >= 3 ? 'fair' : 'needs-work', score, maxScore: 8, tips };
}

// ── Public scorer ─────────────────────────────────────────────────────────────

/**
 * scoreContent(text, type) → { grade, score, maxScore, tips }
 * type: 'problemStatement' | 'description' | 'businessImpact'
 */
function scoreContent(text, type) {
  const t = (text || '').trim();
  if (!t || t === '—' || t.length < 15)
    return { grade: 'needs-work', score: 0, maxScore: 0,
             tips: ['No content found. This section should be filled in before sharing with leadership.'] };

  if (type === 'problemStatement') return _scoreProblemStatement(t);
  if (type === 'description')      return _scoreDescription(t);
  if (type === 'businessImpact')   return _scoreBusinessImpact(t);
  return { grade: 'good', score: 1, maxScore: 1, tips: [] };
}

// ── Tooltip DOM — single floating div, positioned by JS ──────────────────────

(function _initTooltip() {
  if (document.getElementById('cq-tip')) return;
  const el = Object.assign(document.createElement('div'), { id: 'cq-tip', role: 'tooltip' });
  Object.assign(el.style, {
    position: 'fixed', zIndex: '99999', maxWidth: '340px',
    background: '#1e293b', color: '#f1f5f9', borderRadius: '10px',
    padding: '12px 15px', fontSize: '0.75rem', lineHeight: '1.55',
    boxShadow: '0 8px 32px rgba(0,0,0,0.38)', pointerEvents: 'none',
    opacity: '0', transition: 'opacity 0.14s ease', whiteSpace: 'normal',
  });
  document.body.appendChild(el);
})();

// Registry: avoids escaping complex HTML inside inline event attributes
window._cqReg = {};

function _cqShow(evt, id) {
  const tip = document.getElementById('cq-tip');
  if (!tip || !window._cqReg[id]) return;
  tip.innerHTML = window._cqReg[id];
  tip.style.opacity = '1';
  _cqMove(evt);
}
function _cqMove(evt) {
  const tip = document.getElementById('cq-tip');
  if (!tip || tip.style.opacity === '0') return;
  const w = tip.offsetWidth || 340;
  const x = evt.clientX + 16;
  tip.style.left = (x + w > window.innerWidth - 8 ? evt.clientX - w - 12 : x) + 'px';
  tip.style.top  = Math.max(8, evt.clientY - 12) + 'px';
}
function _cqHide() {
  const tip = document.getElementById('cq-tip');
  if (tip) tip.style.opacity = '0';
}

// ── Badge builder ─────────────────────────────────────────────────────────────

const _CQ_CFG = {
  'good':       { bg: '#2a8703', ring: '#86efac', icon: '✓', label: 'Meets PM standards'       },
  'fair':       { bg: '#b86000', ring: '#fcd34d', icon: '~', label: 'Partially meets standards' },
  'needs-work': { bg: '#ea1100', ring: '#fca5a5', icon: '!', label: 'Needs improvement'         },
};

const _CQ_TYPE_LABELS = {
  problemStatement: 'Problem Statement',
  description:      'Description',
  businessImpact:   'Business Impact',
};

/**
 * cqBadge(text, type) → HTML string
 * Renders a small colored circle with a hover tooltip describing quality gaps.
 */
function cqBadge(text, type) {
  const { grade, score, maxScore, tips } = scoreContent(text, type);
  const cfg       = _CQ_CFG[grade] || _CQ_CFG['needs-work'];
  const typeLabel = _CQ_TYPE_LABELS[type] || type;

  // Build tooltip HTML
  let ttHtml = `<div style="font-weight:700;font-size:0.79rem;color:${cfg.ring};margin-bottom:5px;">
    ${cfg.icon} ${typeLabel} — ${cfg.label}</div>
    <div style="color:#94a3b8;font-size:0.68rem;margin-bottom:${tips.length ? '9px' : '0'};">Score: ${score} / ${maxScore}</div>`;

  if (tips.length) {
    ttHtml += `<div style="font-weight:700;font-size:0.68rem;color:#cbd5e1;text-transform:uppercase;
                           letter-spacing:0.06em;margin-bottom:6px;">Improvement tips:</div>`;
    ttHtml += tips.map(tip =>
      `<div style="display:flex;gap:6px;margin-bottom:5px;align-items:flex-start;">
         <span style="color:#fbbf24;flex-shrink:0;margin-top:1px;">→</span>
         <span style="color:#e2e8f0;">${tip}</span>
       </div>`
    ).join('');
  } else {
    ttHtml += `<div style="color:#86efac;font-size:0.72rem;">
      ✓ Meets PM best-practice standards for persona, specificity, and value clarity.</div>`;
  }

  // Store in registry — avoids any HTML-escaping in attribute values
  const id = 'cq-' + Math.random().toString(36).slice(2, 9);
  window._cqReg[id] = ttHtml;

  return `<span
    class="cq-badge" data-cq-grade="${grade}" data-cq-id="${id}"
    role="img" aria-label="${typeLabel} quality: ${cfg.label}"
    title="${cfg.label}"
    style="display:inline-flex;align-items:center;justify-content:center;
           width:17px;height:17px;border-radius:50%;flex-shrink:0;
           background:${cfg.bg};color:white;font-size:0.6rem;font-weight:900;
           cursor:help;box-shadow:0 1px 5px rgba(0,0,0,0.22);
           border:1.5px solid ${cfg.ring};vertical-align:middle;
           margin-left:8px;position:relative;top:-1px;"
    onmouseenter="_cqShow(event,this.dataset.cqId)"
    onmousemove="_cqMove(event)"
    onmouseleave="_cqHide()"
  >${cfg.icon}</span>`;
}
