import 'dotenv/config';
import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import selfsigned from 'selfsigned';
import { MouseController } from './mouseController.js';
import { GestureHandler } from './gestureHandler.js';
import { setupWebRTCSignaling } from './webrtcSignaling.js';
import type { GestureEvent, ClientState } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getLocalIP(): string {
  const nets = os.networkInterfaces();
  for (const ifaces of Object.values(nets)) {
    for (const iface of ifaces ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

const PORT       = Number(process.env.PORT) || 3001;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3443;

// ── Self-signed TLS cert (generated once per process) ────────────────────────
const localIP = getLocalIP();
const pems = selfsigned.generate(
  [{ name: 'commonName', value: 'airmouse.local' }],
  {
    days: 365,
    algorithm: 'sha256',
    extensions: [
      { name: 'subjectAltName', altNames: [
        { type: 7, ip: '127.0.0.1' },
        { type: 7, ip: localIP },
        { type: 2, value: 'localhost' },
      ]},
    ],
  },
);

const app = express();
const httpServer  = createHttpServer(app);
const httpsServer = createHttpsServer({ cert: pems.cert, key: pems.private }, app);

// Single socket.io instance handles both HTTP (laptop dev) and HTTPS (mobile)
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 5e6,
});
io.attach(httpsServer);  // Mobile connects here over WSS

app.use(cors());
app.use(express.json());

// Serve standalone mobile page
app.use(express.static(path.join(__dirname, '..', 'public')));

// Root
app.get('/', (_req, res) => {
  res.json({ name: 'AirMouse AI Backend', status: 'running', clients: io.engine.clientsCount });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', clients: io.engine.clientsCount });
});

// Server IP info (used by frontend to build mobile URL)
app.get('/api/server-info', (_req, res) => {
  res.json({ ip: localIP, port: PORT, httpsPort: HTTPS_PORT });
});

// ── Mouse controller ──────────────────────────────────────────────────────────
const mouseController = new MouseController();
const gestureHandler  = new GestureHandler(mouseController);

mouseController.init().then(() => {
  console.log('[Server] Mouse controller ready');
}).catch(err => {
  console.error('[Server] Mouse controller FAILED:', err.message);
  console.error('[Server] Install pyautogui: pip install pyautogui');
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const clients = new Map<string, ClientState>();

io.on('connection', (socket) => {
  const role  = (socket.handshake.query.role as string) || 'laptop';
  const state: ClientState = { id: socket.id, mode: 'laptop', isTracking: false, role: role as 'laptop' | 'mobile' };
  clients.set(socket.id, state);
  console.log(`[Socket] Connected: ${socket.id} (${role}) | Total: ${clients.size}`);
  io.emit('server-status', { clients: clients.size });

  socket.on('gesture', async (event: GestureEvent) => {
    const result = await gestureHandler.handle(event);
    socket.emit('gesture-ack', { result, timestamp: Date.now() });
  });

  socket.on('set-mode', ({ mode }: { mode: string }) => {
    const st = clients.get(socket.id);
    if (st) st.mode = mode as ClientState['mode'];
  });

  socket.on('start-tracking', () => {
    const st = clients.get(socket.id);
    if (st) st.isTracking = true;
  });

  socket.on('stop-tracking', () => {
    const st = clients.get(socket.id);
    if (st) st.isTracking = false;
  });

  // Laptop asks all mobile clients to start their camera
  socket.on('trigger-mobile-camera', () => {
    console.log(`[Socket] ${socket.id} triggered mobile camera start`);
    for (const [socketId, st] of clients) {
      if (st.role === 'mobile') {
        io.to(socketId).emit('mobile-camera-start');
      }
    }
  });

  socket.on('ping', (ts: number) => socket.emit('pong', ts));

  socket.on('disconnect', (reason) => {
    clients.delete(socket.id);
    console.log(`[Socket] Disconnected: ${socket.id} (${reason}) | Total: ${clients.size}`);
    io.emit('server-status', { clients: clients.size });
  });
});

setupWebRTCSignaling(io);

// ── Start servers ─────────────────────────────────────────────────────────────
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n[Server] HTTP  → http://localhost:${PORT}`);
  console.log(`[Server] HTTP  → http://${localIP}:${PORT}`);
});

httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`[Server] HTTPS → https://${localIP}:${HTTPS_PORT}/mobile  ← open this on your phone\n`);
});

process.on('SIGTERM', () => {
  mouseController.destroy();
  process.exit(0);
});
