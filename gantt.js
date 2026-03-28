// gantt.js — Gantt Chart: Phase → Goal → Cards
// Walmart FY27: Q1=Feb-Apr, Q2=May-Jul, Q3=Aug-Oct, Q4=Nov-Jan

// ── FY27 Timeline ────────────────────────────────────────────────────────────
const GANTT_FY = {
  start: new Date(2026, 1, 1),   // Feb 1 2026
  end:   new Date(2027, 1, 1),   // Feb 1 2027
  quarters: [
    { label: 'Q1 FY27', start: new Date(2026,  1, 1), end: new Date(2026,  4, 1), stripe: '#eef4ff' },
    { label: 'Q2 FY27', start: new Date(2026,  4, 1), end: new Date(2026,  7, 1), stripe: '#f8faff' },
    { label: 'Q3 FY27', start: new Date(2026,  7, 1), end: new Date(2026, 10, 1), stripe: '#eef4ff' },
    { label: 'Q4 FY27', start: new Date(2026, 10, 1), end: new Date(2027,  1, 1), stripe: '#f8faff' },
  ],
};
const GANTT_TOTAL_MS = GANTT_FY.end - GANTT_FY.start;
const GANTT_LABEL_W  = 220; // px — must match .gantt-label width in CSS

const GANTT_WS_CONFIG = {
  all:        { label: 'All Workstreams', color: '#6366f1' },
  strategy:   { label: 'Strategy',        color: '#6366f1' },
  design:     { label: 'Design',          color: '#0053e2' },
  buying:     { label: 'Buying',          color: '#f59e0b' },
  allocation: { label: 'Allocation',      color: '#2a8703' },
};

let ganttActiveWS      = new Set(['all']);
let ganttExpandedGoals = new Set();

// ── Date helpers ─────────────────────────────────────────────────────────────
function ganttPct(date) {
  const clamped = Math.max(+GANTT_FY.start, Math.min(+GANTT_FY.end, +date));
  return ((clamped - GANTT_FY.start) / GANTT_TOTAL_MS) * 100;
}

// Quarter start date from a quarter string like 'Q2' or 'Q3'
function ganttQStart(q) {
  if (!q || q === 'completed') return GANTT_FY.start;
  const n = String(q).replace(/\D/g, '')[0];
  return ({ '1': new Date(2026,1,1), '2': new Date(2026,4,1), '3': new Date(2026,7,1), '4': new Date(2026,10,1) })[n] || GANTT_FY.start;
}

// Parse a targetDate string into { start, end, isRange }
// start = earliest possible delivery; end = guaranteed-by date
function ganttParseRange(str) {
  if (!str || str === 'TBD' || str === 'completed') return null;

  // Cross-year range: "Nov 2026–Jan 2027"
  let m = str.match(/([A-Za-z]+)\s+(\d{4})[\u2013\-]+([A-Za-z]+)\s+(\d{4})/);
  if (m) {
    const s = new Date(`${m[1]} 1 ${m[2]}`);
    const e = new Date(`${m[3]} 1 ${m[4]}`);
    if (!isNaN(s) && !isNaN(e))
      return { start: s, end: new Date(e.getFullYear(), e.getMonth() + 1, 0), isRange: true };
  }

  // Same-year range: "Aug–Oct 2026" or "May–Oct 2026"
  m = str.match(/([A-Za-z]+)[\u2013\-]+([A-Za-z]+)\s+(\d{4})/);
  if (m) {
    const s = new Date(`${m[1]} 1 ${m[3]}`);
    const e = new Date(`${m[2]} 1 ${m[3]}`);
    if (!isNaN(s) && !isNaN(e))
      return { start: s, end: new Date(e.getFullYear(), e.getMonth() + 1, 0), isRange: true };
  }

  // Quarter range: "Q1–Q2 FY27"
  m = str.match(/Q([1-4])[\u2013\-]+Q([1-4])/);
  if (m) {
    const qs = { '1': new Date(2026,1,1),  '2': new Date(2026,4,1),  '3': new Date(2026,7,1),  '4': new Date(2026,10,1) };
    const qe = { '1': new Date(2026,3,30), '2': new Date(2026,6,31), '3': new Date(2026,9,31), '4': new Date(2027,0,31) };
    return { start: qs[m[1]], end: qe[m[2]], isRange: true };
  }

  // Single quarter: "Q1 FY27"
  m = str.match(/Q([1-4])/);
  if (m) {
    const qe = { '1': new Date(2026,3,30), '2': new Date(2026,6,31), '3': new Date(2026,9,31), '4': new Date(2027,0,31) };
    const d = qe[m[1]];
    return d ? { start: d, end: d, isRange: false } : null;
  }

  // Specific date: "April 30, 2026" / "Jul 31, 2026"
  const d = new Date(str.replace(/,/, ''));
  if (!isNaN(d)) return { start: d, end: d, isRange: false };

  return null;
}

// ── Three-zone bar rendering ─────────────────────────────────────────────────
// Zone 1 (solid):   qStart  →  deliveryWindow.start  — "work in progress"
// Zone 2 (dashed):  window.start  →  window.end      — "could land here" (range only)
// Zone 3 (thin):    window.end  →  chart end          — "deployed & live"
function ganttBars(card) {
  const range  = ganttParseRange(card.targetDate);
  const wsKey  = (card.workstreams || [])[0] || 'all';
  const color  = card.status === 'completed'
    ? '#2a8703'
    : (GANTT_WS_CONFIG[wsKey] || GANTT_WS_CONFIG.all).color;

  if (!range) {
    return `<div class="gantt-bar gantt-bar-tbd" style="left:0%;width:100%">TBD</div>`;
  }

  const qStart  = ganttQStart(card.quarter);
  // Anchor: earliest of qStart and deliveryWindow start
  const anchor  = new Date(Math.min(+qStart, +range.start));
  const winEnd  = range.end;
  let html = '';

  // Zone 1: solid in-flight bar (anchor → range.start)
  // Skip if anchor == range.start (work starts exactly at delivery window)
  if (+range.start > +anchor) {
    const l = ganttPct(anchor).toFixed(2);
    const w = (ganttPct(range.start) - ganttPct(anchor)).toFixed(2);
    if (parseFloat(w) > 0.3) {
      html += `<div class="gantt-bar gantt-bar-inflight" style="left:${l}%;width:${w}%;background:${color}">
        <span class="gantt-bar-label">${range.isRange ? '' : card.targetDate}</span>
      </div>`;
    }
  }

  // Zone 2: delivery window (range.start → range.end), lighter + dashed if isRange
  if (range.isRange) {
    const l = ganttPct(range.start).toFixed(2);
    const w = Math.max(1.5, ganttPct(range.end) - ganttPct(range.start)).toFixed(2);
    html += `<div class="gantt-bar gantt-bar-window" style="left:${l}%;width:${w}%;background:${color}28;border:1.5px dashed ${color}">
      <span class="gantt-bar-label" style="color:${color}80">${card.targetDate}</span>
    </div>`;
  } else {
    // Point delivery: show a vertical tick at the target date
    const l = ganttPct(range.end).toFixed(2);
    html += `<div class="gantt-bar-tick" style="left:${l}%;border-color:${color}"></div>`;
  }

  // Zone 3: deployed line (range.end → chart end)
  const deployPct = ganttPct(winEnd);
  if (deployPct < 99.5) {
    const l = deployPct.toFixed(2);
    const w = Math.max(0.5, 100 - deployPct).toFixed(2);
    html += `<div class="gantt-bar-deployed" style="left:${l}%;width:${w}%;background:${color}"></div>`;
  }

  // Fallback if nothing rendered (anchor == range.end and already at chart end)
  if (!html) {
    const l = Math.max(0, ganttPct(anchor) - 1).toFixed(2);
    html = `<div class="gantt-bar gantt-bar-inflight" style="left:${l}%;width:2%;background:${color}"></div>`;
  }

  return html;
}

// ── Row track decorations (stripes + dividers only — NO today line) ───────────
function ganttDeco() {
  const stripes = GANTT_FY.quarters.map(q => {
    const l = ganttPct(q.start).toFixed(2);
    const w = ((q.end - q.start) / GANTT_TOTAL_MS * 100).toFixed(2);
    return `<div class="gantt-stripe" style="left:${l}%;width:${w}%;background:${q.stripe}"></div>`;
  }).join('');
  const divs = GANTT_FY.quarters.slice(1).map(q =>
    `<div class="gantt-divider" style="left:${ganttPct(q.start).toFixed(2)}%"></div>`
  ).join('');
  return stripes + divs;
}

// Today overlay — single full-height line injected ONCE into gantt-body after render
function ganttInjectToday() {
  document.querySelectorAll('.gantt-today-overlay').forEach(el => el.remove());
  const body = document.getElementById('gantt-body');
  if (!body) return;
  const now = new Date();
  if (now < GANTT_FY.start || now > GANTT_FY.end) return;
  const pct = (now - GANTT_FY.start) / GANTT_TOTAL_MS;
  // Within gantt-body the label col is GANTT_LABEL_W px wide, track is the rest.
  // left = label_w + pct * (100% - label_w)
  //      = label_w * (1 - pct) + pct * 100%
  const overlay = document.createElement('div');
  overlay.className = 'gantt-today-overlay';
  overlay.style.left = `calc(${(GANTT_LABEL_W * (1 - pct)).toFixed(1)}px + ${(pct * 100).toFixed(3)}%)`;
  overlay.innerHTML = '<span class="gantt-today-label">Today</span>';
  body.appendChild(overlay);
}

// ── Card lookups ─────────────────────────────────────────────────────────────
function ganttCardIndex() {
  const cards = window.PILLARS ? window.PILLARS.flatMap(p => p.cards || []) : [];
  return Object.fromEntries(cards.map(c => [c.id, c]));
}

function ganttGoalCards(goalId) {
  const ids     = (window.GOAL_CARD_MAP || {})[String(goalId)] || [];
  const index   = ganttCardIndex();
  const showAll = ganttActiveWS.has('all');
  return ids
    .map(id => index[id])
    .filter(c => c && (showAll || (c.workstreams || []).some(ws => ganttActiveWS.has(ws))))
    .sort((a, b) => {
      const ra = ganttParseRange(a.targetDate), rb = ganttParseRange(b.targetDate);
      const da = ra && ra.end, db = rb && rb.end;
      if (!da && !db) return 0; if (!da) return 1; if (!db) return -1;
      return da - db;
    });
}

function ganttPhaseCardCount(phaseNum) {
  const phases = typeof PHASE_DEFS !== 'undefined' ? PHASE_DEFS : [];
  const phase  = phases.find(p => p.num === phaseNum);
  if (!phase) return 0;
  const seen = new Set();
  (phase.goals || []).forEach(g => {
    ganttGoalCards(String(g.id).replace('#', '')).forEach(c => seen.add(c.id));
  });
  return seen.size;
}

// ── Toggle handlers ───────────────────────────────────────────────────────────
window.ganttToggleGoal = function(key) {
  ganttExpandedGoals.has(key) ? ganttExpandedGoals.delete(key) : ganttExpandedGoals.add(key);
  renderGanttChart();
};

window.ganttToggleWS = function(ws) {
  if (ws === 'all') {
    ganttActiveWS = new Set(['all']);
  } else {
    ganttActiveWS.delete('all');
    ganttActiveWS.has(ws) ? ganttActiveWS.delete(ws) : ganttActiveWS.add(ws);
    if (ganttActiveWS.size === 0) ganttActiveWS = new Set(['all']);
  }
  document.querySelectorAll('.gantt-ws-btn').forEach(btn => {
    btn.classList.toggle('active', ganttActiveWS.has(btn.dataset.ws));
  });
  renderGanttChart();
};

// ── Main render ───────────────────────────────────────────────────────────────
window.renderGanttChart = function() {
  const wrap = document.getElementById('gantt-body');
  if (!wrap) return;

  const phases = typeof PHASE_DEFS !== 'undefined' ? PHASE_DEFS : [];
  const deco   = ganttDeco();
  let html = '';

  phases.forEach(phase => {
    const ps      = new Date(phase.start);
    const pe      = new Date(phase.end);
    const phL     = ganttPct(ps).toFixed(2);
    const phW     = Math.max(1, ganttPct(pe) - ganttPct(ps)).toFixed(2);
    const phCount = ganttPhaseCardCount(phase.num);

    // ── Phase header ──
    html += `
      <div class="gantt-phase-header" style="border-left:4px solid ${phase.color}">
        <div class="gantt-label gantt-phase-label-cell">
          <span class="gantt-phase-emoji">${phase.emoji}</span>
          <div>
            <div class="gantt-phase-name">Phase ${phase.num}: ${phase.label}</div>
            <div class="gantt-phase-win">${phase.window} &nbsp;&middot;&nbsp; ${phCount} program${phCount !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="gantt-track">
          ${deco}
          <div class="gantt-phase-bar" style="left:${phL}%;width:${phW}%;border:1.5px solid ${phase.color}40;background:${phase.color}14">
            <span style="color:${phase.color};font-weight:700;font-size:11px">${phase.label}</span>
          </div>
        </div>
      </div>`;

    // ── Goal rows ──
    (phase.goals || []).forEach(goal => {
      const goalId = String(goal.id).replace('#', '');
      const key    = `${phase.num}-${goalId}`;
      const open   = ganttExpandedGoals.has(key);
      const gCards = ganttGoalCards(goalId);

      html += `
        <div class="gantt-goal-row${open ? ' gantt-goal-open' : ''}" onclick="ganttToggleGoal('${key}')">
          <div class="gantt-label">
            <div class="gantt-label-inner">
              <span class="gantt-expand-icon">${open ? '\u25be' : '\u25b8'}</span>
              <span class="gantt-goal-badge" style="background:${phase.color}20;color:${phase.color}">${goal.id}</span>
              <span class="gantt-label-text">${goal.label}</span>
            </div>
            <div class="gantt-label-ws">${gCards.length} program${gCards.length !== 1 ? 's' : ''} &bull; click to ${open ? 'collapse' : 'expand'}</div>
          </div>
          <div class="gantt-track">
            ${deco}
            <div class="gantt-bar gantt-goal-bar" style="left:${phL}%;width:${phW}%;background:${phase.color}">
              <span class="gantt-bar-label">${goal.label}</span>
            </div>
          </div>
        </div>`;

      // ── Expanded card rows ──
      if (open) {
        if (gCards.length === 0) {
          html += `<div class="gantt-card-empty">No programs match the active workstream filter.</div>`;
        } else {
          gCards.forEach(card => {
            const wsKey      = (card.workstreams || [])[0] || 'all';
            const dotColor   = { completed:'#2a8703', green:'#2a8703', yellow:'#f59e0b', red:'#ea1100', roadmap:'#9ca3af' }[card.status] || '#9ca3af';
            const isCritical = card.critical || (card.tag || '').toLowerCase().includes('critical');

            html += `
              <div class="gantt-row gantt-card-row">
                <div class="gantt-label gantt-card-label">
                  <div class="gantt-label-inner">
                    <span class="gantt-dot" style="background:${dotColor}"></span>
                    <span class="gantt-label-text">${card.icon || ''} ${card.title}</span>
                    ${isCritical ? '<span class="gantt-star">\u2b50</span>' : ''}
                  </div>
                  <div class="gantt-label-ws">${(card.workstreams || []).join(', ')} &middot; ${card.targetDate || 'TBD'}</div>
                </div>
                <div class="gantt-track">
                  ${deco}
                  ${ganttBars(card)}
                </div>
              </div>`;
          });
        }
      }
    });
  });

  wrap.innerHTML = html || '<div class="gantt-empty">No phases defined.</div>';
  // Inject the single full-height today line after DOM update
  ganttInjectToday();
};

// ── PPTX download ─────────────────────────────────────────────────────────────
window.downloadGanttPPTX = function() {
  const btn = document.getElementById('gantt-dl-btn');
  if (btn) { btn.textContent = '\u23f3 Generating...'; btn.disabled = true; }

  function doExport(pptxgen) {
    const pres  = new pptxgen();
    pres.layout  = 'LAYOUT_WIDE';
    const slide  = pres.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addText('E2E Fashion Portal \u2014 Gantt Chart FY27', { x:0.3, y:0.15, w:12.5, h:0.45, fontSize:20, bold:true, color:'0053e2' });
    slide.addText(`Generated ${new Date().toLocaleDateString()}`, { x:0.3, y:0.58, w:12.5, h:0.25, fontSize:10, color:'6b7280' });

    const trackX=3.1, trackW=10, rowH=0.28, startY=1.05;
    GANTT_FY.quarters.forEach((q,i) => {
      const l = trackX + (ganttPct(q.start)/100)*trackW;
      const w = ((q.end-q.start)/GANTT_TOTAL_MS)*trackW;
      slide.addShape(pres.ShapeType.rect,{x:l,y:startY-0.3,w,h:0.26,fill:{color:i%2?'f0f9ff':'dbeafe'},line:{color:'e5e7eb',pt:0.5}});
      slide.addText(q.label,{x:l,y:startY-0.3,w,h:0.26,fontSize:8,bold:true,color:'374151',align:'center',valign:'middle'});
    });

    const phases = typeof PHASE_DEFS !== 'undefined' ? PHASE_DEFS : [];
    let row = 0;
    phases.forEach(phase => {
      const ps=new Date(phase.start), pe=new Date(phase.end);
      const phL=trackX+(ganttPct(ps)/100)*trackW;
      const phW=Math.max(0.1,(ganttPct(pe)-ganttPct(ps))/100*trackW);
      const y=startY+row*rowH; row++;
      slide.addShape(pres.ShapeType.rect,{x:0.2,y,w:12.9,h:rowH,fill:{color:phase.color.replace('#','')+'18'},line:{color:phase.color.replace('#','')+'40',pt:0.5}});
      slide.addText(`Phase ${phase.num}: ${phase.label}`,{x:0.25,y:y+0.02,w:2.8,h:rowH-0.04,fontSize:8,bold:true,color:phase.color.replace('#',''),valign:'middle'});
      slide.addShape(pres.ShapeType.rect,{x:phL,y:y+0.05,w:phW,h:rowH-0.1,fill:{color:phase.color.replace('#','')+'30'},line:{color:phase.color.replace('#',''),pt:0.5}});

      (phase.goals||[]).forEach(goal => {
        const gy=startY+row*rowH; row++;
        slide.addShape(pres.ShapeType.rect,{x:0.2,y:gy,w:12.9,h:rowH,fill:{color:'f9fafb'},line:{color:'f3f4f6',pt:0.3}});
        slide.addText(`  ${goal.id} ${goal.label}`,{x:0.25,y:gy+0.02,w:2.8,h:rowH-0.04,fontSize:7,color:'374151',valign:'middle'});
        slide.addShape(pres.ShapeType.rect,{x:phL,y:gy+0.06,w:phW,h:rowH-0.12,fill:{color:phase.color.replace('#','')},line:{color:phase.color.replace('#',''),pt:0}});
        if(phW>0.6) slide.addText(goal.label,{x:phL+0.05,y:gy+0.06,w:phW,h:rowH-0.12,fontSize:6,color:'FFFFFF',valign:'middle'});
      });
    });

    pres.writeFile({ fileName: `E2E-Fashion-Gantt-FY27-${Date.now()}.pptx` });
    if (btn) { btn.textContent = '\ud83d\udce5 Download PPTX'; btn.disabled = false; }
  }

  if (window.PptxGenJS) { doExport(window.PptxGenJS); return; }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
  s.onload = () => doExport(window.PptxGenJS);
  s.onerror = () => { alert('\u26a0\ufe0f Could not load PPTX library.'); if(btn){btn.textContent='\ud83d\udce5 Download PPTX';btn.disabled=false;} };
  document.head.appendChild(s);
};