// gantt.js — Gantt Chart view for E2E Fashion Portal
// Walmart FY27: Q1=Feb-Apr, Q2=May-Jul, Q3=Aug-Oct, Q4=Nov-Jan

// ── FY27 Timeline Constants ──────────────────────────────────────────────────
const GANTT_FY = {
  start: new Date(2026, 1, 1),   // Feb 1 2026
  end:   new Date(2027, 1, 1),   // Feb 1 2027 (exclusive)
  quarters: [
    { label: 'Q1 FY27', short: 'Q1', start: new Date(2026,  1, 1), end: new Date(2026,  4, 1), color: '#e0eaff' },
    { label: 'Q2 FY27', short: 'Q2', start: new Date(2026,  4, 1), end: new Date(2026,  7, 1), color: '#f0f9ff' },
    { label: 'Q3 FY27', short: 'Q3', start: new Date(2026,  7, 1), end: new Date(2026, 10, 1), color: '#e0eaff' },
    { label: 'Q4 FY27', short: 'Q4', start: new Date(2026, 10, 1), end: new Date(2027,  1, 1), color: '#f0f9ff' },
  ],
};

const GANTT_TOTAL_MS = GANTT_FY.end - GANTT_FY.start;

const GANTT_WS_CONFIG = {
  all:        { label: 'All Workstreams', color: '#6366f1' },
  strategy:   { label: 'Strategy',        color: '#6366f1' },
  design:     { label: 'Design',          color: '#0053e2' },
  buying:     { label: 'Buying',          color: '#f59e0b' },
  allocation: { label: 'Allocation',      color: '#2a8703' },
};

const GANTT_STATUS_COLOR = {
  completed: '#2a8703',
  green:     '#2a8703',
  yellow:    '#f59e0b',
  red:       '#ea1100',
  roadmap:   '#9ca3af',
};

// Active workstream filter — supports multi-select
let ganttActiveWS = new Set(['all']);

// ── Quarter start → Date mapping ────────────────────────────────────────────
function ganttQuarterStart(q) {
  if (!q || q === 'completed') return new Date(2026, 1, 1);
  const n = String(q).replace(/\D/g, '')[0];
  const map = { '1': new Date(2026,1,1), '2': new Date(2026,4,1), '3': new Date(2026,7,1), '4': new Date(2026,10,1) };
  return map[n] || new Date(2026, 1, 1);
}

// ── Parse a targetDate string → JS Date ─────────────────────────────────────
function ganttParseDate(str) {
  if (!str || str === 'TBD') return null;
  // Handle quarter shorthand like "Q1", "Q2 FY27"
  const qMatch = str.match(/Q([1-4])/);
  if (qMatch) {
    const ends = { '1': new Date(2026,3,30), '2': new Date(2026,6,31), '3': new Date(2026,9,31), '4': new Date(2027,0,31) };
    return ends[qMatch[1]] || null;
  }
  // Range like "Feb–Apr 2026" → take end
  const rangeMatch = str.match(/([A-Za-z]+)[–\-]([A-Za-z]+)\s+(\d{4})/);
  if (rangeMatch) {
    const d = new Date(`${rangeMatch[2]} 1, ${rangeMatch[3]}`);
    if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth() + 1, 0); // last day of month
  }
  const d = new Date(str);
  return isNaN(d) ? null : d;
}

// ── Percentage position helpers ─────────────────────────────────────────────
function ganttPct(date) {
  const clamped = Math.max(GANTT_FY.start, Math.min(GANTT_FY.end, date));
  return ((clamped - GANTT_FY.start) / GANTT_TOTAL_MS) * 100;
}

function ganttBarGeom(card) {
  const start = ganttQuarterStart(card.quarter);
  const end   = ganttParseDate(card.targetDate);
  if (!end) return null;
  const clampedEnd = end < GANTT_FY.start ? GANTT_FY.start : end > GANTT_FY.end ? GANTT_FY.end : end;
  const left  = ganttPct(start);
  const right = ganttPct(clampedEnd);
  const width = Math.max(1, right - left); // min 1% so it's visible
  return { left, width };
}

// ── Filter cards for Gantt ───────────────────────────────────────────────────
function ganttFilteredCards() {
  const all = window.allCards || [];
  const showAll = ganttActiveWS.has('all');
  return all
    .filter(card => {
      if (card.status === 'completed') return true; // always show completed
      if (showAll) return true;
      return (card.workstreams || []).some(ws => ganttActiveWS.has(ws));
    })
    .sort((a, b) => {
      // Sort: completed last, then by quarter start
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (b.status === 'completed' && a.status !== 'completed') return -1;
      return ganttQuarterStart(a.quarter) - ganttQuarterStart(b.quarter);
    });
}

// ── Toggle workstream filter ─────────────────────────────────────────────────
window.ganttToggleWS = function(ws) {
  if (ws === 'all') {
    ganttActiveWS = new Set(['all']);
  } else {
    ganttActiveWS.delete('all');
    if (ganttActiveWS.has(ws)) {
      ganttActiveWS.delete(ws);
      if (ganttActiveWS.size === 0) ganttActiveWS = new Set(['all']);
    } else {
      ganttActiveWS.add(ws);
    }
  }

  // Refresh button active states
  document.querySelectorAll('.gantt-ws-btn').forEach(btn => {
    const id = btn.classList[1]?.replace('ws-', '');
    btn.classList.toggle('active', !!id && ganttActiveWS.has(id));
  });

  renderGanttChart();
};

// ── Main render ──────────────────────────────────────────────────────────────
window.renderGanttChart = function() {
  const wrap = document.getElementById('gantt-body');
  if (!wrap) return;

  const cards = ganttFilteredCards();
  const totalDays = GANTT_TOTAL_MS / 86400000;

  // Quarter header columns
  const qHeaders = GANTT_FY.quarters.map(q => {
    const w = ((q.end - q.start) / GANTT_TOTAL_MS * 100).toFixed(2);
    return `<div class="gantt-qcol" style="width:${w}%">${q.label}<span class="gantt-qsub">Feb–Apr / May–Jul / Aug–Oct / Nov–Jan</span></div>`;
  }).join('');

  // Quarter stripe backgrounds
  const stripes = GANTT_FY.quarters.map(q => {
    const l = ganttPct(q.start).toFixed(2);
    const w = ((q.end - q.start) / GANTT_TOTAL_MS * 100).toFixed(2);
    return `<div class="gantt-stripe" style="left:${l}%;width:${w}%;background:${q.color}"></div>`;
  }).join('');

  // Today marker
  const today = new Date();
  const todayPct = ganttPct(today).toFixed(2);
  const todayMarker = today >= GANTT_FY.start && today <= GANTT_FY.end
    ? `<div class="gantt-today" style="left:${todayPct}%"><span class="gantt-today-label">Today</span></div>`
    : '';

  // Quarter dividers
  const dividers = GANTT_FY.quarters.slice(1).map(q => {
    const l = ganttPct(q.start).toFixed(2);
    return `<div class="gantt-divider" style="left:${l}%"></div>`;
  }).join('');

  // Rows
  const rows = cards.map(card => {
    const geom = ganttBarGeom(card);
    const wsColor = (card.workstreams || []).length
      ? (GANTT_WS_CONFIG[card.workstreams[0]] || GANTT_WS_CONFIG.all).color
      : '#9ca3af';
    const statusColor = GANTT_STATUS_COLOR[card.status] || '#9ca3af';
    const isCritical = (card.tag || '').includes('Critical');
    const barColor = card.status === 'completed' ? '#2a8703' : wsColor;

    const bar = geom
      ? `<div class="gantt-bar" style="left:${geom.left.toFixed(2)}%;width:${geom.width.toFixed(2)}%;background:${barColor}" title="${card.title}: ${card.targetDate || 'TBD'}">
           <span class="gantt-bar-label">${card.targetDate || ''}</span>
         </div>`
      : `<div class="gantt-bar gantt-bar-tbd">TBD</div>`;

    const statusDot = `<span class="gantt-dot" style="background:${statusColor}"></span>`;
    const criticalStar = isCritical ? '<span class="gantt-star">⭐</span>' : '';

    return `
      <div class="gantt-row">
        <div class="gantt-label">
          <div class="gantt-label-inner">
            ${statusDot}
            <span class="gantt-label-text">${card.icon || ''} ${card.title}</span>
            ${criticalStar}
          </div>
          <div class="gantt-label-ws">${(card.workstreams || []).join(', ')}</div>
        </div>
        <div class="gantt-track">
          ${stripes}
          ${dividers}
          ${todayMarker}
          ${bar}
        </div>
      </div>`;
  }).join('');

  wrap.innerHTML = rows || '<div class="gantt-empty">No programs match the selected filters.</div>';
};

// ── PPTX Download ────────────────────────────────────────────────────────────
window.downloadGanttPPTX = function() {
  const btn = document.getElementById('gantt-dl-btn');
  if (btn) { btn.textContent = '⏳ Generating...'; btn.disabled = true; }

  function doExport(pptxgen) {
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"

    const slide = pres.addSlide();
    slide.background = { color: 'FFFFFF' };

    // Title
    slide.addText('E2E Fashion Portal — Gantt Chart', {
      x: 0.3, y: 0.15, w: 12.5, h: 0.5,
      fontSize: 20, bold: true, color: '0053e2',
    });
    slide.addText(`FY27 Roadmap  •  Generated ${new Date().toLocaleDateString()}`, {
      x: 0.3, y: 0.6, w: 12.5, h: 0.3,
      fontSize: 11, color: '6b7280',
    });

    // Quarter headers
    const trackX = 3.2, trackW = 9.8, rowH = 0.28, startY = 1.1;
    const qColors = ['dbeafe','f0f9ff','dbeafe','f0f9ff'];
    GANTT_FY.quarters.forEach((q, i) => {
      const pct = (q.end - q.start) / GANTT_TOTAL_MS;
      const x = trackX + (ganttPct(q.start) / 100) * trackW;
      const w = pct * trackW;
      slide.addShape(pres.ShapeType.rect, { x, y: startY - 0.32, w, h: 0.28, fill: { color: qColors[i] }, line: { color: 'e5e7eb', pt: 0.5 } });
      slide.addText(q.label, { x, y: startY - 0.32, w, h: 0.28, fontSize: 8, bold: true, color: '374151', align: 'center', valign: 'middle' });
    });

    // Rows
    const cards = ganttFilteredCards();
    cards.forEach((card, idx) => {
      const y = startY + idx * rowH;
      const rowBg = idx % 2 === 0 ? 'f9fafb' : 'ffffff';

      // Row background
      slide.addShape(pres.ShapeType.rect, { x: 0.2, y, w: 12.9, h: rowH, fill: { color: rowBg }, line: { color: 'f3f4f6', pt: 0.3 } });

      // Label
      const labelText = `${card.icon || ''} ${card.title}`;
      slide.addText(labelText, { x: 0.25, y: y + 0.02, w: 2.9, h: rowH - 0.04, fontSize: 7, color: '1f2937', valign: 'middle' });

      // Bar
      const geom = ganttBarGeom(card);
      if (geom) {
        const wsColor = (card.workstreams || []).length
          ? (GANTT_WS_CONFIG[card.workstreams[0]] || GANTT_WS_CONFIG.all).color.replace('#', '')
          : '9ca3af';
        const barColor = card.status === 'completed' ? '2a8703' : wsColor;
        const bx = trackX + (geom.left / 100) * trackW;
        const bw = Math.max(0.1, (geom.width / 100) * trackW);
        slide.addShape(pres.ShapeType.rect, { x: bx, y: y + 0.04, w: bw, h: rowH - 0.08, fill: { color: barColor }, line: { color: barColor, pt: 0 }, rectRadius: 0.05 });
        if (bw > 0.5) {
          slide.addText(card.targetDate || '', { x: bx + 0.05, y: y + 0.04, w: bw - 0.05, h: rowH - 0.08, fontSize: 5.5, color: 'FFFFFF', valign: 'middle' });
        }
      }
    });

    // Legend
    const legendY = startY + cards.length * rowH + 0.15;
    const wsEntries = Object.entries(GANTT_WS_CONFIG).filter(([k]) => k !== 'all');
    wsEntries.forEach(([key, cfg], i) => {
      const lx = 0.3 + i * 2.2;
      slide.addShape(pres.ShapeType.rect, { x: lx, y: legendY, w: 0.18, h: 0.13, fill: { color: cfg.color.replace('#','') } });
      slide.addText(cfg.label, { x: lx + 0.22, y: legendY, w: 1.8, h: 0.13, fontSize: 7, color: '374151', valign: 'middle' });
    });

    pres.writeFile({ fileName: `E2E-Fashion-Gantt-FY27-${Date.now()}.pptx` });
    if (btn) { btn.textContent = '📥 Download PPTX'; btn.disabled = false; }
  }

  // Lazy-load PptxGenJS from CDN
  if (window.PptxGenJS) {
    doExport(window.PptxGenJS);
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
  script.onload = () => doExport(window.PptxGenJS);
  script.onerror = () => {
    alert('⚠️ Could not load PPTX library. Check your network connection and try again.');
    if (btn) { btn.textContent = '📥 Download PPTX'; btn.disabled = false; }
  };
  document.head.appendChild(script);
};