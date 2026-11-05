const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../auth');
const { requireAuth, publicUser } = require('../middleware');
const {
  normalizeEmail, normalizePhone, cleanText, isValidEmail, clientIp, rateLimit,
} = require('../security');

const router = express.Router();

// Brute-force protection for every credential endpoint.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Too many login attempts. Please wait 15 minutes and try again.',
});

// A valid bcrypt hash used when the e-mail does not exist, so an unknown
// address costs the same time as a wrong password (no account enumeration).
const DUMMY_HASH = bcrypt.hashSync('devamart-not-a-real-password', 10);

function logLogin({ email, role = 'user', portal = 'user', success, req }) {
  try {
    const ip = clientIp(req);
    db.prepare(`INSERT INTO login_logs (email, role, ip, user_agent, success, portal) VALUES (?,?,?,?,?,?)`)
      .run(normalizeEmail(email), role, ip, String(req.headers['user-agent'] || '').slice(0, 240), success ? 1 : 0, portal);
  } catch (e) { /* logging must never break auth */ }
}

function markLogin(user, req) {
  try {
    db.prepare(`UPDATE users SET last_login_at=datetime('now'), last_login_ip=?, login_count=COALESCE(login_count,0)+1 WHERE id=?`)
      .run(clientIp(req), user.id);
  } catch (e) { /* non-critical */ }
}

// POST /api/auth/signup
router.post('/signup', authLimiter, (req, res) => {
  const body = req.body || {};
  const name = cleanText(body.name, 80);
  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  const city = cleanText(body.city, 60);
  const password = String(body.password || '');

  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address (Gmail works too)' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (password.length > 72) return res.status(400).json({ error: 'Password must be 72 characters or fewer' });
  if (phone && (phone.length < 10 || phone.length > 15)) return res.status(400).json({ error: 'Please enter a valid mobile number' });

  const existing = db.prepare('SELECT id FROM users WHERE lower(email)=lower(?)').get(email);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists. Please login instead.' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`INSERT INTO users
    (name, phone, email, password_hash, role, city, last_login_at, last_login_ip, login_count)
    VALUES (?,?,?,?, 'user', ?, datetime('now'), ?, 1)`)
    .run(name, phone || null, email, hash, city || null, clientIp(req));

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);
  logLogin({ email: user.email, role: 'user', portal: 'user', success: true, req });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', authLimiter, (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE lower(email)=lower(?)').get(email);
  const matches = bcrypt.compareSync(password, user ? user.password_hash : DUMMY_HASH);

  if (!user || !matches) {
    logLogin({ email, role: 'user', portal: 'user', success: false, req });
    return res.status(401).json({ error: 'Invalid email or password. Please check both and try again.' });
  }
  if (user.role !== 'user') {
    logLogin({ email: user.email, role: user.role, portal: 'user', success: false, req });
    return res.status(403).json({ error: 'Please use the admin login portal' });
  }

  markLogin(user, req);
  logLogin({ email: user.email, role: 'user', portal: 'user', success: true, req });
  const fresh = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
  res.json({ token: signToken(fresh), user: publicUser(fresh) });
});

// POST /api/auth/admin-login
router.post('/admin-login', authLimiter, (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE lower(email)=lower(?)').get(email);
  const matches = bcrypt.compareSync(password, user ? user.password_hash : DUMMY_HASH);

  if (!user || !matches) {
    logLogin({ email, role: 'admin', portal: 'admin', success: false, req });
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.role !== 'admin') {
    logLogin({ email: user.email, role: user.role, portal: 'admin', success: false, req });
    return res.status(403).json({ error: 'Access denied - admin only' });
  }

  markLogin(user, req);
  logLogin({ email: user.email, role: 'admin', portal: 'admin', success: true, req });
  const fresh = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
  res.json({ token: signToken(fresh), user: publicUser(fresh) });
});

// GET /api/auth/me
router.get('/me', requireAuth(), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

// PATCH /api/auth/me — profile preferences such as the delivery city.
router.patch('/me', requireAuth(), (req, res) => {
  const city = cleanText((req.body || {}).city, 60);
  if (!city) return res.status(400).json({ error: 'Please choose a valid city' });

  db.prepare('UPDATE users SET city=? WHERE id=?').run(city, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

module.exports = router;
