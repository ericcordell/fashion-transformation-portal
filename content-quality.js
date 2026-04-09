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
    tips.push('Ground this in a real customer experience by naming the specific person this affects — e.g. "Today, Fashion Merchants spend X hours…" or "Buying Associates manually track…" It makes the problem immediately relatable to reviewers.');
  }

  // 2. Current-state pain language (0–2)
  const painHits = (t.match(new RegExp(_RX_PAIN.source, 'gi')) || []).length;
  if (painHits >= 3)      { score += 2; }
  else if (painHits >= 1) {
    score += 1;
    tips.push('Adding a sense of scale here can sharpen the urgency — how often does this friction happen, how many people feel it, or what breaks downstream when it does? Even a rough estimate makes the problem much more vivid.');
  } else {
    tips.push('Help the reader feel the current-state friction — paint a picture of what this person actually does today, where it slows them down, or where errors creep in. The more concrete, the stronger the case for why this matters.');
  }

  // 3. Does NOT open with the solution (0–1)
  if (!/^(we (will|are|have|plan)|the (solution|goal|system|tool|platform|initiative)|build|this\s+(tool|feature|project|initiative)\s+will)/i.test(t.slice(0, 80))) {
    score += 1;
  } else {
    tips.push('Consider opening with the person\'s experience before introducing the solution — the more vivid the current-state picture, the stronger the "why now" for this initiative.');
  }

  // 4. Length / specificity (0–1)
  if (t.length >= 250) { score += 1; }
  else { tips.push('A bit more context here can really sharpen the narrative — giving readers enough to understand who is affected and why, without needing to ask follow-up questions, makes a big difference when this goes to leadership.'); }

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
    tips.push('Help readers picture what\'s actually being built — a sentence on how this works (e.g. "AEX will surface a unified workflow that automatically…") makes the scope and ambition much clearer.');
  } else {
    tips.push('Walk the reader through how this solves the problem — what does the system or experience actually do? Active verbs like "enables", "automates", "integrates", or "surfaces" help paint that picture clearly.');
  }

  // 2. Specific product / tech noun (0–2)
  if (_RX_TECH.test(t)) { score += 2; }
  else { tips.push('Naming the specific system or capability being built (e.g. "an AEX-native workflow", "a BigQuery service", "a Centric integration") helps reviewers understand the scope and feasibility at a glance.'); }

  // 3. Persona benefit tie-in — who benefits (0–1)
  if (_RX_PERSONA.test(t)) { score += 1; }
  else { tips.push('Tying the solution back to who benefits — e.g. "so Merchants can focus on strategy instead of data entry" or "giving Planners a single source of truth" — makes this much more compelling to business reviewers.'); }

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
    tips.push('Adding a number here — even a directional estimate — makes the story much more compelling for leadership. Something like "$50MM incremental GMV", "2,000 hours saved annually", or "15% fewer item setup errors" gives reviewers a concrete anchor to rally around.');
  if (!hasQual)
    tips.push('Pairing a metric with the "why it matters" narrative is what makes a business case stick — help readers understand the mechanism: how does solving this problem actually create that value?');
  if (hasQuant && hasQual && score < 5)
    tips.push('If there\'s a second angle on the value — e.g. both a revenue impact and a time savings, or a quality improvement alongside capacity freed — adding it can significantly strengthen the case for prioritization.');
  if (t.length < 80)
    tips.push('A bit more context here goes a long way — the most persuasive business impacts explain both what value is created and the story of how this initiative delivers it.');

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

// ── Right-side tips panel ─────────────────────────────────────────────────────
// Click-triggered slide-in drawer; one per page, shared across all badges.

(function _initPanel() {
  if (document.getElementById('cq-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'cq-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Writing tips');
  Object.assign(panel.style, {
    position: 'fixed', top: '0', right: '0', height: '100%',
    width: '310px', maxWidth: '90vw',
    background: '#1e293b', color: '#f1f5f9',
    boxShadow: '-6px 0 28px rgba(0,0,0,0.32)',
    zIndex: '100000',
    transform: 'translateX(100%)',
    transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
    display: 'flex', flexDirection: 'column',
    fontFamily: 'inherit',
  });

  // Header row — label + close button
  const hdr = document.createElement('div');
  Object.assign(hdr.style, {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px 12px', flexShrink: '0',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  });
  hdr.innerHTML =
    '<span style="font-size:0.68rem;font-weight:700;text-transform:uppercase;' +
    'letter-spacing:0.09em;color:#475569;">Writing Tips</span>' +
    '<button onclick="_cqClose()" aria-label="Close tips" ' +
    'style="color:#94a3b8;font-size:1.45rem;line-height:1;background:none;' +
    'border:none;cursor:pointer;padding:2px 4px;opacity:0.75;">&times;</button>';

  // Scrollable body
  const body = document.createElement('div');
  body.id = 'cq-panel-body';
  Object.assign(body.style, {
    flex: '1', overflowY: 'auto', padding: '16px',
    fontSize: '0.75rem', lineHeight: '1.55',
  });

  panel.appendChild(hdr);
  panel.appendChild(body);
  document.body.appendChild(panel);

  // Dismiss on outside click
  document.addEventListener('click', function(e) {
    const p = document.getElementById('cq-panel');
    if (!p || p.style.transform === 'translateX(100%)') return;
    if (!p.contains(e.target) && !e.target.closest('.cq-badge')) _cqClose();
  }, true);

  // Dismiss on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') _cqClose();
  });
})();

// Registry — avoids HTML-escaping complex content in inline event attributes
window._cqReg      = {};
window._cqActiveId = null;

function _cqToggle(evt, id) {
  evt.stopPropagation();
  const panel = document.getElementById('cq-panel');
  const body  = document.getElementById('cq-panel-body');
  if (!panel || !body || !window._cqReg[id]) return;

  // Same badge clicked again → toggle off
  if (window._cqActiveId === id && panel.style.transform !== 'translateX(100%)') {
    _cqClose(); return;
  }

  body.innerHTML     = window._cqReg[id];
  window._cqActiveId = id;
  panel.style.transform = 'translateX(0)';
}

function _cqClose() {
  const panel = document.getElementById('cq-panel');
  if (panel) panel.style.transform = 'translateX(100%)';
  window._cqActiveId = null;
}

// ── Badge builder ─────────────────────────────────────────────────────────────

const _CQ_TYPE_LABELS = {
  problemStatement: 'Problem Statement',
  description:      'Description',
  businessImpact:   'Business Impact',
};

const _CQ_SECTION_CONTEXT = {
  problemStatement: 'A strong problem statement grounds the work in a real customer experience — naming the person, the friction, and the stakes.',
  description:      "A clear description helps reviewers picture what's being built and how it solves the problem at a product level.",
  businessImpact:   'The most persuasive business impacts pair a concrete value metric with the story of how this initiative creates it.',
};

/**
 * cqBadge(text, type) → HTML string
 * Returns a subtle ⓘ icon when there are suggestions to offer, empty string when content is strong.
 * No grades, no scores, no pass/fail — just a quiet pointer to where the story can grow.
 */
function cqBadge(text, type) {
  const { tips } = scoreContent(text, type);

  // Nothing to say — stay out of the way
  if (!tips.length) return '';

  const typeLabel   = _CQ_TYPE_LABELS[type]  || type;
  const sectionNote = _CQ_SECTION_CONTEXT[type] || '';

  // Tooltip: framed as "ways to strengthen the story", never as failure
  let ttHtml =
    `<div style="font-weight:700;font-size:0.78rem;color:#93c5fd;margin-bottom:4px;">
       💡 Ways to strengthen the ${typeLabel}</div>`;

  if (sectionNote) {
    ttHtml += `<div style="color:#94a3b8;font-size:0.7rem;line-height:1.45;margin-bottom:9px;">${sectionNote}</div>`;
  }

  ttHtml += tips.map(tip =>
    `<div style="display:flex;gap:7px;margin-bottom:6px;align-items:flex-start;">
       <span style="color:#60a5fa;flex-shrink:0;margin-top:1px;font-size:0.72rem;">›</span>
       <span style="color:#e2e8f0;font-size:0.72rem;line-height:1.5;">${tip}</span>
     </div>`
  ).join('');

  // Store in registry — avoids HTML-escaping in inline event attributes
  const id = 'cq-' + Math.random().toString(36).slice(2, 9);
  window._cqReg[id] = ttHtml;

  return `<span
    class="cq-badge" data-cq-id="${id}"
    role="button" tabindex="0" aria-label="Open writing tips for ${typeLabel}"
    title="Click for writing tips"
    style="display:inline-flex;align-items:center;justify-content:center;
           width:15px;height:15px;border-radius:50%;flex-shrink:0;
           background:#f1f5f9;color:#64748b;font-size:0.62rem;font-weight:700;
           cursor:pointer;border:1px solid #cbd5e1;
           vertical-align:middle;margin-left:7px;position:relative;top:-1px;
           font-style:italic;transition:background 0.12s,border-color 0.12s;"
    onmouseenter="this.style.background='#e2e8f0';this.style.borderColor='#94a3b8';"
    onmouseleave="this.style.background='#f1f5f9';this.style.borderColor='#cbd5e1';"
    onclick="_cqToggle(event,this.dataset.cqId)"
    onkeydown="if(event.key==='Enter'||event.key===' ')_cqToggle(event,this.dataset.cqId)"
  >i</span>`;
}
