const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { cleanText, normalizePhone } = require('../security');

const router = express.Router();
router.use(requireAuth('user'));

const MAX_ADDRESSES = 8;

function addressView(a) {
  return {
    id: a.id,
    label: a.label || 'Home',
    name: a.name,
    phone: a.phone,
    line: a.line,
    line2: a.line2 || '',
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    created_at: a.created_at,
  };
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM addresses WHERE user_id=? ORDER BY id DESC').all(req.user.id);
  res.json(rows.map(addressView));
});

router.post('/', (req, res) => {
  const b = req.body || {};
  const address = {
    label: cleanText(b.label || 'Home', 24) || 'Home',
    name: cleanText(b.name, 80),
    phone: normalizePhone(b.phone),
    line: cleanText(b.line, 180),
    line2: cleanText(b.line2, 180),
    city: cleanText(b.city, 60),
    state: cleanText(b.state, 60),
    pincode: String(b.pincode || '').replace(/\D/g, '').slice(0, 6),
  };

  if (!address.name || address.phone.length < 10 || !address.line || !address.city || !address.state || !/^\d{6}$/.test(address.pincode)) {
    return res.status(400).json({ error: 'Please fill name, 10-digit mobile, address, city, state and 6-digit PIN code' });
  }

  const count = db.prepare('SELECT COUNT(*) c FROM addresses WHERE user_id=?').get(req.user.id).c;
  if (count >= MAX_ADDRESSES) {
    return res.status(400).json({ error: `You can save up to ${MAX_ADDRESSES} addresses. Remove one first.` });
  }

  // Avoid duplicate cards for the exact same address.
  const dup = db.prepare(`SELECT * FROM addresses WHERE user_id=? AND lower(line)=lower(?)
    AND lower(city)=lower(?) AND pincode=?`).get(req.user.id, address.line, address.city, address.pincode);
  if (dup) return res.status(200).json({ ok: true, address: addressView(dup), duplicate: true });

  const info = db.prepare(`INSERT INTO addresses
    (user_id, label, name, phone, line, line2, city, state, pincode) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(req.user.id, address.label, address.name, address.phone, address.line, address.line2,
      address.city, address.state, address.pincode);

  // Keep the customer's default city in sync for future logins/checkouts.
  db.prepare('UPDATE users SET city=? WHERE id=?').run(address.city, req.user.id);

  const row = db.prepare('SELECT * FROM addresses WHERE id=?').get(info.lastInsertRowid);
  res.status(201).json({ ok: true, address: addressView(row) });
});

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM addresses WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Address not found' });
  db.prepare('DELETE FROM addresses WHERE id=?').run(row.id);
  res.json({ ok: true });
});

module.exports = router;
