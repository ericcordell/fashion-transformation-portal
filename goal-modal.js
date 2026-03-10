// goal-modal.js — Goal detail popout modal
// Reads from: data-goals.js (GOALS), data-phases.js (PHASE_DEFS)
// Exposed globals: openGoalModal(goalId), closeGoalModal()

(function () {

  // Gradient per phase (matches phase sidebar colours)
  var PHASE_GRAD = {
    1: 'linear-gradient(135deg,#0053e2,#1a6fff)',
    2: 'linear-gradient(135deg,#1b5e20,#2a8703)',
    3: 'linear-gradient(135deg,#1a1a6e,#3b3ba3)',
  };

  var STATUS_CFG = {
    'in-progress': { label: '\uD83D\uDFE1 In Progress',  cls: 'gm-status-ip'   },
    'planned':     { label: '\uD83D\uDD2E Planned',       cls: 'gm-status-plan' },
    'completed':   { label: '\u2705 Completed',          cls: 'gm-status-done' },
  };

  // ── PUBLIC ──────────────────────────────────────────────
  window.openGoalModal = function (goalId) {
    var goal = GOALS[String(goalId)];
    if (!goal) return;
    _render(goal);
    document.getElementById('gm-overlay').classList.add('open');
  };

  window.closeGoalModal = function () {
    document.getElementById('gm-overlay').classList.remove('open');
  };

  // ── RENDER ──────────────────────────────────────────────
  function _render(goal) {
    // Derive header gradient from first phase
    var grad    = PHASE_GRAD[goal.phases[0]] || PHASE_GRAD[1];
    var statCfg = STATUS_CFG[goal.status] || STATUS_CFG['planned'];

    // Header
    var header = document.getElementById('gm-header');
    header.style.background = grad;
    document.getElementById('gm-icon').textContent  = goal.icon;
    document.getElementById('gm-num').textContent   = 'Goal #' + goal.id;
    document.getElementById('gm-title').textContent = goal.label;

    // Status + phase chips in sub-bar
    var phasePills = goal.phases.map(function (n) {
      var ph = PHASE_DEFS[n - 1];
      return '<span class="gm-phase-pill" style="background:' + ph.bg +
        ';color:' + ph.color + ';border-color:' + ph.border + ';">' +
        ph.emoji + ' Phase ' + n + ' &mdash; ' + ph.label + '</span>';
    }).join('');

    document.getElementById('gm-subbar').innerHTML =
      '<span class="gm-status-badge ' + statCfg.cls + '">' + statCfg.label + '</span>' +
      phasePills;

    // Body
    document.getElementById('gm-body').innerHTML = _bodyHTML(goal);
  }

  function _bodyHTML(goal) {
    return [
      _section('\uD83D\uDCCB Description', '<p class="gm-desc">' + _esc(goal.description) + '</p>'),

      _row(
        _section('\uD83C\uDFAF Target KPI',
          '<div class="gm-kpi-box">' + _esc(goal.target) + '</div>'),
        _section('\uD83D\uDCCA Current Baseline',
          '<div class="gm-baseline-box">' + _esc(goal.baseline) + '</div>')
      ),

      _section('\uD83D\uDD17 Key Programs &amp; Initiatives',
        '<ul class="gm-programs">' +
        goal.keyPrograms.map(function (p) {
          var parts = p.split(' \u2014 ');
          return '<li><strong>' + _esc(parts[0]) + '</strong>' +
            (parts[1] ? ' &mdash; <span class="gm-prog-note">' + _esc(parts[1]) + '</span>' : '') +
            '</li>';
        }).join('') +
        '</ul>'),

      _section('\uD83C\uDFD7\uFE0F Workstreams Affected',
        '<div class="gm-ws-chips">' +
        goal.workstreams.map(function (ws) {
          return '<span class="gm-ws-chip">' + _esc(ws) + '</span>';
        }).join('') +
        '</div>'),

      '<p class="gm-source">&#128196; Source: <a href="https://confluence.walmart.com/display/APREC/Long+Lead+Time+Transformation+Work+Management+Dashboard"' +
        ' target="_blank" rel="noopener">APREC — LLTT Work Management Dashboard</a></p>',
    ].join('');
  }

  function _section(heading, contentHTML) {
    return '<div class="gm-section"><div class="gm-section-title">' +
      heading + '</div>' + contentHTML + '</div>';
  }

  function _row(a, b) {
    return '<div class="gm-two-col">' + a + b + '</div>';
  }

  function _esc(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── CLOSE HANDLERS ──────────────────────────────────────
  document.getElementById('gm-overlay').addEventListener('click', function (e) {
    if (e.target === document.getElementById('gm-overlay')) closeGoalModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeGoalModal();
  });

}());