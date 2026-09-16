const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../auth');
const { requireAuth, publicUser } = require('../middleware');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function logLogin({ email, role = 'user', portal = 'user', success, req }) {
  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
    db.prepare(`INSERT INTO login_logs (email, role, ip, user_agent, success, portal) VALUES (?,?,?,?,?,?)`)
      .run(String(email || '').toLowerCase(), role, ip, String(req.headers['user-agent'] || '').slice(0, 240), success ? 1 : 0, portal);
  } catch (e) { /* logging must never break auth */ }
}

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email address' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (name, phone, email, password_hash, role) VALUES (?,?,?,?,?)')
    .run(name.trim(), phone || null, email.toLowerCase(), hash, 'user');

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);
  logLogin({ email: user.email, role: 'user', portal: 'user', success: true, req });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    logLogin({ email, role: 'user', portal: 'user', success: false, req });
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.role !== 'user') {
    logLogin({ email: user.email, role: user.role, portal: 'user', success: false, req });
    return res.status(403).json({ error: 'Please use the admin login portal' });
  }
  logLogin({ email: user.email, role: 'user', portal: 'user', success: true, req });
  res.json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/admin-login
router.post('/admin-login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    logLogin({ email, role: 'admin', portal: 'admin', success: false, req });
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.role !== 'admin') {
    logLogin({ email: user.email, role: user.role, portal: 'admin', success: false, req });
    return res.status(403).json({ error: 'Access denied - admin only' });
  }
  logLogin({ email: user.email, role: 'admin', portal: 'admin', success: true, req });
  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth(), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

module.exports = router;