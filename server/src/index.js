require('dotenv').config();
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const db = require('./db');
const { svgPlaceholder } = require('./images');
const { verifyToken } = require('./auth');

// On serverless (Vercel) the SQLite file is in ephemeral storage — seed it fresh when empty.
try { require('./seed').autoSeedIfEmpty(); } catch (e) { console.error('auto-seed check failed', e); }

const app = express();
const server = http.createServer(app);

const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

const io = new Server(server, {
  cors: { origin: CORS_ORIGINS.length ? CORS_ORIGINS : true, methods: ['GET', 'POST'] },
});

app.set('io', io);
app.use(cors({ origin: CORS_ORIGINS.length ? CORS_ORIGINS : true }));
app.use(express.json({ limit: '2mb' }));

// ---------- Generated placeholder images (works offline, zero external calls) ----------
app.get('/images/placeholder/:id.svg', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const p = db.prepare(`
    SELECT p.*, c.slug AS category_slug, c.icon AS category_icon
    FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=?
  `).get(id);
  const product = p || { id: id || 0, name: 'DevaMart', sku: 'DM' };
  const category = p ? { slug: p.category_slug, icon: p.category_icon } : {};
  res.set('Content-Type', 'image/svg+xml');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(svgPlaceholder(product, category));
});

// ---------- REST API ----------
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'DevaMart API', time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/content', require('./routes/content'));
app.use('/api/admin', require('./routes/admin'));

// ---------- Optional: serve built frontends in production ----------
const USER_DIST = path.join(__dirname, '..', '..', 'client-user', 'dist');
const ADMIN_DIST = path.join(__dirname, '..', '..', 'client-admin', 'dist');
if (fs.existsSync(ADMIN_DIST)) {
  app.use('/admin', express.static(ADMIN_DIST));
  app.get('/admin/*', (req, res) => res.sendFile(path.join(ADMIN_DIST, 'index.html')));
}
if (fs.existsSync(USER_DIST)) {
  app.use(express.static(USER_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/images') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(USER_DIST, 'index.html'));
  });
}

// ---------- Socket.io ----------
io.on('connection', (socket) => {
  socket.on('join-admin', (token) => {
    try {
      const payload = verifyToken(token);
      if (payload.role === 'admin') {
        socket.join('admins');
        socket.emit('admin:joined', { ok: true });
      }
    } catch (e) { /* ignore */ }
  });
  socket.on('join-user', (token) => {
    try {
      const payload = verifyToken(token);
      if (payload.role === 'user') socket.join(`user:${payload.id}`);
    } catch (e) { /* ignore */ }
  });
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

const PORT = process.env.PORT || 4000;

// Local development / self-hosted: start listening directly.
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n🪔  DevaMart API running at http://localhost:${PORT}`);
    console.log(`    Health check:            http://localhost:${PORT}/api/health`);
    console.log(`    User frontend (dev):     http://localhost:5173`);
    console.log(`    Admin frontend (dev):    http://localhost:5174\n`);
  });
}

// Vercel (serverless Node): export the http server so the runtime proxies into it,
// keeping REST + socket.io (WebSocket/polling) working in one function.
module.exports = server;
module.exports.app = app;
module.exports.io = io;