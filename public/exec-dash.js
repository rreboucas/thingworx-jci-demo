/* Executive Dashboard — animated Tableau-style overlay
   Storyline: Agentforce assists JCI field service reps closing Save One cases
   and work orders faster. KPIs ramp up; AVG time falls live; an Agentforce
   activity ticker shows AI actions in flight. */
(function () {
  const dash = document.getElementById('exec-dash');
  const trigger = document.getElementById('customer-label');
  const closeBtn = document.getElementById('exec-dash-close');
  if (!dash || !trigger) return;

  const state = {
    open: false,
    intervals: [],
    sparks: {},
    counters: {},
    ticker: null,
    avgCaseSec: 5 * 86400 + 14 * 3600, // 5d 14h "before" baseline
    targetAfterSec: 1 * 86400 + 8 * 3600,   // ~1d 8h "with Agentforce"
    truckRolls: 0,
    autoResolved: 0,
    closureRate: 0,
    casesActive: 60,
    woActive: 142,
    srActive: 1258,
    hoursSaved: 0,
    repeatSaved: 0
  };

  function open(opts) {
    if (state.open) return;
    state.open = true;
    dash.classList.add('is-open');
    dash.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (!opts || !opts.silent) {
      try { history.pushState({ execDash: true }, '', '/dashboard'); } catch (_) {}
    }
    boot();
  }

  function close(opts) {
    if (!state.open) return;
    state.open = false;
    dash.classList.remove('is-open');
    dash.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.intervals.forEach(clearInterval);
    state.intervals = [];
    Object.values(state.sparks).forEach(c => c && c.destroy && c.destroy());
    state.sparks = {};
    if (!opts || !opts.silent) {
      try { history.pushState({}, '', '/'); } catch (_) {}
    }
  }

  trigger.addEventListener('click', open);
  trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  closeBtn.addEventListener('click', () => close());
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.open) close(); });

  // Open directly from URL: /dashboard, ?view=dashboard, or #dashboard
  function shouldAutoOpen() {
    const p = (location.pathname || '').toLowerCase();
    const h = (location.hash || '').toLowerCase();
    const q = new URLSearchParams(location.search);
    return p === '/dashboard' || p.startsWith('/dashboard/') ||
           h === '#dashboard' || q.get('view') === 'dashboard';
  }
  if (shouldAutoOpen()) {
    // Defer one frame so the underlying app finishes its initial render first.
    requestAnimationFrame(() => open({ silent: true }));
  }
  window.addEventListener('popstate', () => {
    if (shouldAutoOpen()) open({ silent: true });
    else close({ silent: true });
  });

  // ---------- Helpers ----------
  function fmtNumber(n) { return Math.round(n).toLocaleString(); }
  function fmtMoney(n) {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return '$' + Math.round(n);
  }
  function fmtDuration(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m`;
  }

  function animateCounter(el, target, durationMs, formatter) {
    const start = performance.now();
    const from = 0;
    formatter = formatter || fmtNumber;
    function frame(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatter(from + (target - from) * eased);
      if (t < 1) requestAnimationFrame(frame); else el.classList.add('is-bumping');
    }
    requestAnimationFrame(frame);
  }

  function bumpCounter(el, newValue, formatter) {
    el.classList.remove('is-bumping');
    void el.offsetWidth;
    el.textContent = (formatter || fmtNumber)(newValue);
    el.classList.add('is-bumping');
  }

  // ---------- Sparkline (current vs prior year) ----------
  function makeSpark(canvasId, baseSeries2017, baseSeries2016, opts) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const labels = ['J','F','M','A','M','J','J','A','S','O','N','D'];
    const cur = baseSeries2017.slice();
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '2025',
            data: cur,
            borderColor: opts.color2017,
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.35
          },
          {
            label: '2024',
            data: baseSeries2016,
            borderColor: '#C5C7CA',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1100, easing: 'easeOutCubic' },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 9 }, color: '#888' },
            grid: { color: '#f0f0f0', drawBorder: false }
          },
          x: {
            ticks: { font: { size: 9 }, color: '#888' },
            grid: { display: false }
          }
        }
      }
    });
    return chart;
  }

  // Trends — 2025 (with Agentforce) ramps higher closure throughput than 2024
  const seriesCases2025 = [42, 48, 55, 62, 70, 78, 88, 102, 122, 140, 158, 175];
  const seriesCases2024 = [50, 52, 53, 50, 49, 50, 52, 51, 50, 52, 53, 52];
  const seriesWO2025    = [55, 58, 62, 70, 75, 65, 60, 58, 56, 55, 54, 53];
  const seriesWO2024    = [62, 64, 65, 64, 65, 64, 63, 62, 62, 63, 62, 62];
  const seriesSR2025    = [950, 980, 1020, 1060, 1110, 1180, 1240, 1320, 1380, 1450, 1500, 1560];
  const seriesSR2024    = [1000, 1010, 1020, 1010, 1015, 1010, 1015, 1020, 1010, 1020, 1010, 1015];

  // ---------- Category bars (Save One cases) ----------
  const caseCategories = [
    { label: 'HVAC Failure',     value: 168, yoy: +69.7, good: true },
    { label: 'Refrigerant Leak', value: 134, yoy: +57.6, good: true },
    { label: 'Sensor Drift',     value: 116, yoy: -22.1, good: false },
    { label: 'Compressor',       value: 112, yoy: -45.5, good: false },
    { label: 'Controls Fault',   value:  73, yoy:  -6.4, good: false },
    { label: 'Power / Wiring',   value:  69, yoy: +16.9, good: true },
    { label: 'Filter / Airflow', value:  46, yoy: +49.5, good: true },
    { label: 'Inquiry',          value:  12, yoy:   0.0, good: true }
  ];

  function renderBars(containerId, items, max) {
    const c = document.getElementById(containerId);
    if (!c) return;
    c.innerHTML = '';
    items.forEach((it, i) => {
      const row = document.createElement('div');
      row.className = 'exec-bar-row';
      row.innerHTML = `
        <div class="exec-bar-row__label">${it.label}</div>
        <div class="exec-bar-row__bar"><span></span></div>
        <div class="exec-bar-row__val">${it.value}</div>
        <div class="exec-bar-row__yoy ${it.good ? 'exec-bar-row__yoy--good' : 'exec-bar-row__yoy--bad'}">${it.yoy > 0 ? '+' : ''}${it.yoy.toFixed(1)}%</div>
      `;
      c.appendChild(row);
      const bar = row.querySelector('.exec-bar-row__bar > span');
      setTimeout(() => { bar.style.width = ((it.value / max) * 100) + '%'; }, 100 + i * 80);
    });
  }

  // ---------- Treemap (Age of Active Work Orders) ----------
  function renderTreemap() {
    const c = document.getElementById('exec-treemap');
    if (!c) return;
    c.innerHTML = `
      <div class="exec-treemap__cell exec-treemap__cell--big">
        <span class="exec-treemap__legend">&lt; 24h</span>
        118
      </div>
      <div class="exec-treemap__cell exec-treemap__cell--med">
        <span class="exec-treemap__legend">1-3d</span>
        18
      </div>
      <div class="exec-treemap__cell exec-treemap__cell--med">
        <span class="exec-treemap__legend">3-7d</span>
        4
      </div>
      <div class="exec-treemap__cell exec-treemap__cell--sm">+ than 7d&nbsp;&nbsp;2</div>
    `;
  }

  // ---------- Top categories list ----------
  const topItems = [
    { label: 'Auto-Diagnostic',        value: 1429, yoy: +42.3, good: true },
    { label: 'Self-Service Resolve',   value: 1228, yoy: +38.1, good: true },
    { label: 'Knowledge Article Sent', value: 1126, yoy: +28.4, good: true },
    { label: 'Tech Dispatch (Smart)',  value:  925, yoy: -13.7, good: false },
    { label: 'Parts Pre-Pulled',       value:  824, yoy: +22.1, good: true },
    { label: 'Remote Calibration',     value:  721, yoy: +18.0, good: true },
    { label: 'Schedule Optimized',     value:  616, yoy: +12.0, good: true },
    { label: 'Supervisor Escalation',  value:  524, yoy: -23.6, good: false },
    { label: 'Customer Update Sent',   value:  416, yoy: +35.0, good: true },
    { label: 'Manual Triage',          value:  214, yoy: -41.9, good: false }
  ];

  function renderTopList() {
    const c = document.getElementById('exec-toplist');
    if (!c) return;
    c.innerHTML = '';
    const max = Math.max(...topItems.map(t => t.value));
    topItems.forEach((it, i) => {
      const row = document.createElement('div');
      row.className = 'exec-toplist__row';
      row.innerHTML = `
        <div class="exec-toplist__label">${it.label}</div>
        <div class="exec-toplist__bar"><span></span></div>
        <div class="exec-toplist__val">${it.value}</div>
        <div class="exec-toplist__yoy ${it.good ? 'exec-toplist__yoy--good' : 'exec-toplist__yoy--bad'}">${it.yoy > 0 ? '+' : ''}${it.yoy.toFixed(2)}%</div>
      `;
      c.appendChild(row);
      const bar = row.querySelector('.exec-toplist__bar > span');
      setTimeout(() => { bar.style.width = ((it.value / max) * 100) + '%'; }, 200 + i * 60);
    });
  }

  // ---------- Activity ticker (Agentforce storyline) ----------
  const tickerScript = [
    { tag: 'Agentforce', cls: '', msg: 'Save One case <b>SO-44712</b> auto-triaged: refrigerant leak, severity high.' },
    { tag: 'Agent → Tech', cls: '', msg: 'Recommended part list pre-pulled for <b>Tech Mike R.</b> at JCI Glendale.' },
    { tag: 'Resolved', cls: 'close', msg: 'Case <b>SO-44708</b> closed in <b>1h 12m</b> — 73% faster than baseline.' },
    { tag: 'Agentforce', cls: '', msg: 'Knowledge article auto-sent to customer for <b>RTU-04</b> sensor recalibration.' },
    { tag: 'Work Order', cls: '', msg: 'WO <b>WO-90218</b> rescheduled — route optimized to save <b>34 mi</b>.' },
    { tag: 'Resolved', cls: 'close', msg: 'WO <b>WO-90211</b> closed first-time-fix. Truck roll avoided.' },
    { tag: 'Agentforce', cls: '', msg: 'Predicted failure on <b>Cooling Control Unit 7A</b> — Save One case opened proactively.' },
    { tag: 'Escalation', cls: 'escalate', msg: 'Case <b>SO-44700</b> escalated to Sr. Engineer w/ full context summary.' },
    { tag: 'Resolved', cls: 'close', msg: 'Case <b>SO-44699</b> closed remotely — no dispatch needed.' },
    { tag: 'Agent → Tech', cls: '', msg: 'Drafted on-site checklist for <b>Tech Sarah L.</b> based on similar past closures.' },
    { tag: 'Agentforce', cls: '', msg: 'Customer status update auto-generated and sent for 14 open cases.' },
    { tag: 'Resolved', cls: 'close', msg: 'WO <b>WO-90205</b> closed in <b>52m</b>. NPS feedback: 9/10.' }
  ];

  function pushTicker() {
    const c = document.getElementById('exec-ticker');
    if (!c) return;
    const idx = (state.ticker = (state.ticker == null ? 0 : (state.ticker + 1) % tickerScript.length));
    const item = tickerScript[idx];
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const row = document.createElement('div');
    row.className = 'exec-ticker__row' + (item.cls ? ' exec-ticker__row--' + item.cls : '');
    row.innerHTML = `
      <span class="exec-ticker__time">${time}</span>
      <span class="exec-ticker__msg">${item.msg}</span>
      <span class="exec-ticker__tag">${item.tag}</span>
    `;
    c.insertBefore(row, c.firstChild);
    while (c.children.length > 6) c.removeChild(c.lastChild);

    // Each ticker event nudges the live KPIs to make the room feel alive.
    if (item.cls === 'close') {
      state.casesActive = Math.max(20, state.casesActive - 1);
      state.truckRolls += 1;
      state.hoursSaved += 3.4;
      bumpCounter(document.getElementById('exec-active-cases'), state.casesActive);
      bumpCounter(document.getElementById('exec-truck-rolls'), state.truckRolls);
      bumpCounter(document.getElementById('exec-hours-saved'), state.hoursSaved, v => Math.round(v).toLocaleString() + ' h');
    }
    if (item.tag === 'Agentforce') {
      state.autoResolved += 1;
      state.repeatSaved += 1;
      bumpCounter(document.getElementById('exec-auto-resolved'), state.autoResolved, v => v + ' today');
      bumpCounter(document.getElementById('exec-repeat-saved'), state.repeatSaved);
    }
  }

  // ---------- AVG case time live decline ----------
  function tickAvgTime() {
    if (state.avgCaseSec <= state.targetAfterSec) return;
    const step = Math.max(180, Math.floor((state.avgCaseSec - state.targetAfterSec) * 0.07));
    state.avgCaseSec -= step;
    if (state.avgCaseSec < state.targetAfterSec) state.avgCaseSec = state.targetAfterSec;
    const el = document.getElementById('exec-avg-case-time');
    if (el) el.textContent = fmtDuration(state.avgCaseSec);

    const afterPct = Math.max(8, Math.round((state.avgCaseSec / (5 * 86400 + 14 * 3600)) * 100));
    const bar = document.getElementById('exec-after-bar');
    const val = document.getElementById('exec-after-val');
    const delta = document.getElementById('exec-compare-delta');
    if (bar) bar.style.width = afterPct + '%';
    if (val) val.textContent = fmtDuration(state.avgCaseSec);
    if (delta) {
      const pctDown = Math.round((1 - state.avgCaseSec / (5 * 86400 + 14 * 3600)) * 100);
      delta.textContent = '▼ ' + pctDown + '% faster with Agentforce';
    }
  }

  // ---------- Closure rate ramp ----------
  function tickClosureRate() {
    if (state.closureRate < 87) {
      state.closureRate += 1 + Math.random() * 0.5;
      if (state.closureRate > 87) state.closureRate = 87;
      const el = document.getElementById('exec-closure-rate');
      if (el) el.textContent = state.closureRate.toFixed(1) + '%';
      const fill = document.getElementById('exec-cases-progress');
      if (fill) fill.style.width = state.closureRate + '%';
    }
  }

  function tickAutoProgress() {
    const fill = document.getElementById('exec-auto-progress');
    if (!fill) return;
    const pct = Math.min(72, 12 + state.autoResolved * 4);
    fill.style.width = pct + '%';
  }

  function tickOverdue() {
    const fill = document.getElementById('exec-overdue-progress');
    if (fill) fill.style.width = '3%';
  }

  // ---------- Boot ----------
  function boot() {
    // Counters
    animateCounter(document.querySelector('[data-counter="cases"]'), 730, 1400);
    animateCounter(document.querySelector('[data-counter="wo"]'), 2480, 1500);
    animateCounter(document.querySelector('[data-counter="sr"]'), 8995, 1600);
    animateCounter(document.querySelector('[data-counter="savings"]'), 4280000, 1800, fmtMoney);

    // Sparks
    state.sparks.cases = makeSpark('spark-cases', seriesCases2025, seriesCases2024, { color2017: '#4A8AC2' });
    state.sparks.wo    = makeSpark('spark-wo',    seriesWO2025,    seriesWO2024,    { color2017: '#5C6770' });
    state.sparks.sr    = makeSpark('spark-sr',    seriesSR2025,    seriesSR2024,    { color2017: '#4FA89E' });

    // Static visualizations
    renderBars('exec-bars-cases', caseCategories, Math.max(...caseCategories.map(c => c.value)));
    renderTreemap();
    renderTopList();
    tickOverdue();

    // Initial readouts
    document.getElementById('exec-avg-case-time').textContent = fmtDuration(state.avgCaseSec);
    document.getElementById('exec-after-val').textContent = fmtDuration(state.avgCaseSec);
    document.getElementById('exec-truck-rolls').textContent = '0';
    document.getElementById('exec-auto-resolved').textContent = '0 today';
    document.getElementById('exec-hours-saved').textContent = '0 h';
    document.getElementById('exec-repeat-saved').textContent = '0';
    document.getElementById('exec-closure-rate').textContent = '—';

    // Live loops
    state.intervals.push(setInterval(pushTicker, 2200));
    state.intervals.push(setInterval(tickAvgTime, 900));
    state.intervals.push(setInterval(tickClosureRate, 700));
    state.intervals.push(setInterval(tickAutoProgress, 1800));
    // Push the first ticker entry shortly after open
    setTimeout(pushTicker, 350);
    setTimeout(pushTicker, 1100);
  }
})();
