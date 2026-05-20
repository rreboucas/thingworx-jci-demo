const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { ASSETS, RECIPIENTS, SITE } = require('./data/assets');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const state = {
  assets: ASSETS.map(a => ({ ...a, predictedFailures: 0 })),
  recipients: RECIPIENTS,
  vibrationHistory: {}
};

// Seed 5-bar rolling vibration window per asset.
for (const a of state.assets) {
  state.vibrationHistory[a.id] = Array.from({ length: 5 }, () =>
    +(a.baseline.vibration + (Math.random() - 0.5) * 0.4).toFixed(2)
  );
}

const FAILING_ID = 'RTU-03_Choice';

function jitter(value, spread) {
  return +(value + (Math.random() - 0.5) * spread).toFixed(2);
}

function buildTelemetry(asset) {
  const isFailing = asset.predictedFailures > 0;
  const b = asset.baseline;
  return {
    id: asset.id,
    current: jitter(b.current, 0.15),
    voltage: jitter(b.voltage, 0.4),
    temperature: jitter(isFailing ? b.temperature + 12 : b.temperature, 0.6),
    vibration: state.vibrationHistory[asset.id]
  };
}

function tickVibration() {
  for (const asset of state.assets) {
    const isFailing = asset.predictedFailures > 0;
    const series = state.vibrationHistory[asset.id];
    series.shift();
    const target = isFailing ? asset.baseline.vibration + 0.9 : asset.baseline.vibration;
    series.push(jitter(target, 0.3));
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/assets', (_req, res) => {
  res.json({
    assets: state.assets.map(({ baseline, ...rest }) => rest),
    recipients: state.recipients,
    site: SITE
  });
});

app.get('/api/asset/:id', (req, res) => {
  const asset = state.assets.find(a => a.id === req.params.id);
  if (!asset) return res.status(404).json({ error: 'not found' });
  const { baseline, ...rest } = asset;
  res.json({ ...rest, telemetry: buildTelemetry(asset) });
});

// Hidden trigger: toggles the predicted-failure state on the CNC Mill.
app.post('/api/trigger-failure', (_req, res) => {
  const asset = state.assets.find(a => a.id === FAILING_ID);
  asset.predictedFailures = asset.predictedFailures > 0 ? 0 : 1;
  broadcastState();
  res.json({ id: asset.id, predictedFailures: asset.predictedFailures });
});

function broadcastState() {
  io.emit('state:update', {
    assets: state.assets.map(({ baseline, ...rest }) => rest)
  });
}

io.on('connection', socket => {
  socket.emit('state:update', {
    assets: state.assets.map(({ baseline, ...rest }) => rest)
  });
});

setInterval(() => {
  tickVibration();
  for (const asset of state.assets) {
    io.emit('telemetry:tick', buildTelemetry(asset));
  }
}, 2000);

server.listen(PORT, () => {
  console.log(`ThingWorx demo running at http://localhost:${PORT}`);
});
