(function () {
  const socket = io();
  const state = {
    assets: [],
    selectedId: null,
    chart: null,
    latestTelemetry: {}
  };

  const els = {
    assetList: document.getElementById('asset-list'),
    triggerLogo: document.getElementById('trigger-logo'),
    siteFilterLabel: document.getElementById('site-filter-label'),
    detailPhoto: document.getElementById('detail-photo'),
    detailModel: document.getElementById('detail-model'),
    detailSerial: document.getElementById('detail-serial'),
    detailLocation: document.getElementById('detail-location'),
    detailLines: document.getElementById('detail-lines'),
    detailSite: document.getElementById('detail-site'),
    recipientsBody: document.getElementById('recipients-body'),
    alertsBody: document.getElementById('alerts-body'),
    analyticsBody: document.getElementById('analytics-body')
  };

  const GAUGE_RANGES = {
    current: { min: 0, max: 3 },
    voltage: { min: 0, max: 30 },
    temperature: { min: 0, max: 70 }
  };

  function getGaugeClass(metric, value) {
    if (metric === 'temperature') {
      if (value > 60) return 'crit';
      if (value > 50) return 'warn';
    }
    if (metric === 'current' && value > 2.5) return 'warn';
    return '';
  }

  function el(tag, opts) {
    const node = document.createElement(tag);
    if (!opts) return node;
    if (opts.className) node.className = opts.className;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.title) node.title = opts.title;
    if (opts.style) Object.assign(node.style, opts.style);
    if (opts.attrs) {
      for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
    }
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function renderAssetList() {
    clear(els.assetList);
    for (const asset of state.assets) {
      const card = el('div', {
        className: 'asset-card' + (asset.id === state.selectedId ? ' selected' : '')
      });
      card.dataset.id = asset.id;

      const thumb = el('div', { className: 'asset-card__thumb' });
      thumb.style.backgroundImage = `url('${encodeURI(asset.image)}')`;
      card.appendChild(thumb);

      const body = el('div', { className: 'asset-card__body' });
      body.appendChild(el('div', { className: 'asset-card__name', text: asset.name }));

      const row1 = el('div', { className: 'asset-status' });
      row1.appendChild(el('span', { className: 'status-icon ok' }));
      row1.appendChild(el('span', { text: 'Status: Running' }));
      body.appendChild(row1);

      const failing = asset.predictedFailures > 0;
      const row2 = el('div', { className: 'asset-status' });
      row2.appendChild(el('span', { className: 'status-icon ' + (failing ? 'warn' : 'ok') }));
      row2.appendChild(el('span', { text: failing ? '1 Predicted Failures' : 'No Predicted Failures' }));
      body.appendChild(row2);

      card.appendChild(body);
      card.addEventListener('click', () => selectAsset(asset.id));
      els.assetList.appendChild(card);
    }
  }

  function selectAsset(id) {
    state.selectedId = id;
    renderAssetList();
    renderDetail();
    renderAlerts();
    renderAnalytics();
  }

  function selected() {
    return state.assets.find(a => a.id === state.selectedId);
  }

  function renderDetail() {
    const asset = selected();
    if (!asset) return;
    els.detailPhoto.style.backgroundImage = `url('${encodeURI(asset.image)}')`;
    els.detailModel.textContent = asset.modelNumber;
    els.detailSerial.textContent = asset.serialNumber;
    els.detailLocation.textContent = asset.location;
    els.detailLines.textContent = asset.relatedLines;
    els.detailSite.textContent = asset.relatedSite;
  }

  function renderRecipients(recipients) {
    clear(els.recipientsBody);
    for (const r of recipients) {
      const tr = el('tr');
      tr.appendChild(el('td', { text: r.username }));
      tr.appendChild(el('td', { text: r.role }));
      els.recipientsBody.appendChild(tr);
    }
  }

  function renderTelemetry(t) {
    state.latestTelemetry[t.id] = t;
    if (t.id !== state.selectedId) return;
    updateGauge('current', t.current);
    updateGauge('voltage', t.voltage);
    updateGauge('temperature', t.temperature);
    if (state.chart) {
      const newData = t.vibration.slice();
      const failing = (selected() || {}).predictedFailures > 0;
      state.chart.data.datasets[0].data = newData;
      state.chart.data.datasets[0].backgroundColor = newData.map((_, i) =>
        i === newData.length - 1
          ? (failing ? '#F4A623' : '#7CB342')
          : (failing ? '#F4A623' : '#A1C76B')
      );
      state.chart.update('none');
    }
  }

  function updateGauge(metric, value) {
    const gauge = document.querySelector(`.gauge[data-metric="${metric}"]`);
    if (!gauge) return;
    const range = GAUGE_RANGES[metric];
    const pct = Math.max(4, Math.min(100, ((value - range.min) / (range.max - range.min)) * 100));
    const fill = gauge.querySelector('.gauge__fill');
    const valEl = gauge.querySelector('.gauge__value');
    fill.style.height = pct + '%';
    fill.classList.remove('warn', 'crit');
    const cls = getGaugeClass(metric, value);
    if (cls) fill.classList.add(cls);
    valEl.textContent = value.toFixed(1);
  }

  function renderAlerts() {
    const asset = selected();
    clear(els.alertsBody);
    if (!asset || asset.predictedFailures === 0) {
      els.alertsBody.appendChild(el('div', { className: 'alerts-empty', text: 'No active alerts' }));
      return;
    }
    const row = el('div', { className: 'alert-row' });
    row.appendChild(el('div', { className: 'alert-row__icon' }));

    const center = el('div');
    center.appendChild(el('div', { className: 'alert-row__title', text: 'Predicted Failure' }));
    const meta = el('div', { className: 'alert-row__meta' });
    meta.appendChild(document.createTextNode('Alert Date: '));
    meta.appendChild(el('b', { text: 'Last 7 Days' }));
    meta.appendChild(document.createTextNode('   Alert Status: '));
    meta.appendChild(el('i', { text: 'Active' }));
    center.appendChild(meta);
    row.appendChild(center);

    const action = el('div', { className: 'alert-row__action', title: 'Configure' });
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('fill', '#4A4A4A');
    p.setAttribute('d', 'm22 19.6-6.6-6.6 1.4-1.4-3-3-1.4 1.4-2.7-2.7a4 4 0 0 0-5.4-5.4l3.4 3.4-1.4 1.4-2-.6-1.4 1.4 4.2 4.2 1.4-1.4-.6-2 1.4-1.4 2.7 2.7-1.4 1.4 3 3 1.4-1.4 6.6 6.6 2-2z');
    svg.appendChild(p);
    action.appendChild(svg);
    row.appendChild(action);

    els.alertsBody.appendChild(row);
  }

  function makeStatRow(label, value) {
    const r = el('div', { className: 'row-line' });
    r.appendChild(el('span', { text: label }));
    r.appendChild(el('span', { className: 'v', text: value }));
    return r;
  }

  function renderAnalytics() {
    const asset = selected();
    clear(els.analyticsBody);
    if (!asset || asset.predictedFailures === 0) {
      els.analyticsBody.appendChild(el('div', { className: 'analytics-empty', text: 'Select an asset with predicted failures to view analytics' }));
      state.chart = null;
      return;
    }

    const chartCol = el('div', { className: 'analytics-chart' });
    chartCol.appendChild(el('div', { className: 'analytics-chart__title', text: 'Avg Vibration Peak' }));
    const wrap = el('div', { className: 'analytics-chart__canvas-wrap' });
    const canvas = el('canvas', { attrs: { id: 'vibration-chart' } });
    wrap.appendChild(canvas);
    chartCol.appendChild(wrap);
    els.analyticsBody.appendChild(chartCol);

    const accCol = el('div', { className: 'analytics-stat' });
    accCol.appendChild(el('div', { className: 'analytics-stat__title', text: 'Failure Type: Drawbar' }));
    accCol.appendChild(el('div', { className: 'analytics-stat__sub', text: 'Estimated Model Accuracy' }));
    accCol.appendChild(el('div', { className: 'analytics-stat__big', text: '98.3%' }));
    const accRows = el('div', { className: 'analytics-stat__rows' });
    accRows.appendChild(makeStatRow('RMSE', '0.13'));
    accRows.appendChild(makeStatRow('Pearson Correlation', '0.50'));
    accRows.appendChild(makeStatRow('Validation Records', '10,348'));
    accCol.appendChild(accRows);
    els.analyticsBody.appendChild(accCol);

    const riskCol = el('div', { className: 'analytics-stat' });
    riskCol.appendChild(el('div', { className: 'analytics-stat__title', text: 'Failure Type: Vibration' }));
    riskCol.appendChild(el('div', { className: 'analytics-stat__sub', text: 'Contributing Risk Factors' }));
    const riskBig = el('div', { className: 'analytics-stat__risk' });
    riskBig.appendChild(el('span', { className: 'analytics-stat__risk-icon' }));
    riskBig.appendChild(document.createTextNode(' VERY HIGH RISK'));
    riskCol.appendChild(riskBig);
    const riskRows = el('div', { className: 'analytics-stat__rows' });
    riskRows.appendChild(makeStatRow('Avg Maintenance Time 3 Months Ago', '0.66'));
    riskRows.appendChild(makeStatRow('Mechanical Alert Codes Prior Month', '3.00'));
    riskRows.appendChild(makeStatRow('Avg Vibration Peak From Last Month', '2.25'));
    riskCol.appendChild(riskRows);
    els.analyticsBody.appendChild(riskCol);

    const ctx = canvas.getContext('2d');
    const seed = (state.latestTelemetry[asset.id] || {}).vibration || [1.6, 2.4, 1.8, 2.6, 2.1];
    state.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: seed.map((_, i) => ['4w', '3w', '2w', '1w', 'now'][i] || ''),
        datasets: [{
          data: seed.slice(),
          backgroundColor: seed.map((_, i) => i === seed.length - 1 ? '#7CB342' : '#F4A623'),
          borderWidth: 0,
          borderRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
          y: {
            beginAtZero: true,
            max: 3.0,
            ticks: { stepSize: 0.6, font: { size: 10 }, color: '#777' },
            grid: { color: '#eee' },
            title: { display: true, text: 'Average Vib Peak', font: { size: 11 }, color: '#777' }
          },
          x: {
            ticks: { font: { size: 10 }, color: '#777' },
            grid: { display: false }
          }
        }
      }
    });
  }

  socket.on('state:update', payload => {
    state.assets = payload.assets;
    if (!state.selectedId) state.selectedId = state.assets[0].id;
    renderAssetList();
    renderDetail();
    renderAlerts();
    renderAnalytics();
  });

  socket.on('telemetry:tick', renderTelemetry);

  fetch('/api/assets')
    .then(r => r.json())
    .then(data => {
      renderRecipients(data.recipients);
      if (data.site && els.siteFilterLabel) {
        els.siteFilterLabel.textContent = data.site.filterSite;
      }
      if (!state.assets.length) {
        state.assets = data.assets;
        state.selectedId = state.assets[0].id;
        renderAssetList();
        renderDetail();
        renderAlerts();
        renderAnalytics();
      }
    });

  els.triggerLogo.addEventListener('click', () => {
    fetch('/api/trigger-failure', { method: 'POST' });
  });
})();
