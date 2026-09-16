const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { productToView } = require('../images');

const router = express.Router();
router.use(requireAuth('user'));

// GET /api/cart - returns cart items with product details and total
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT ci.id, ci.qty, p.id AS product_id, p.name, p.price, p.mrp, p.image, c.slug AS category_slug
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    JOIN categories c ON c.id = p.category_id
    WHERE ci.user_id = ? AND p.active = 1
  `).all(req.user.id);

  const items = rows.map(r => ({ ...r, product: productToView(r), line_total: +(r.price * r.qty).toFixed(2) }));
  const total = +items.reduce((s, i) => s + i.line_total, 0).toFixed(2);
  res.json({ items, count: items.reduce((s, i) => s + i.qty, 0), total });
});

// POST /api/cart { productId, qty }
router.post('/', (req, res) => {
  const { productId, qty = 1 } = req.body || {};
  const product = db.prepare('SELECT * FROM products WHERE id=? AND active=1').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const add = Math.max(1, parseInt(qty, 10) || 1);

  const existing = db.prepare('SELECT * FROM cart_items WHERE user_id=? AND product_id=?').get(req.user.id, productId);
  if (existing) {
    db.prepare('UPDATE cart_items SET qty = ? WHERE id=?').run(existing.qty + add, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, qty) VALUES (?,?,?)').run(req.user.id, productId, add);
  }
  const row = db.prepare(`
    SELECT COUNT(*) AS count, COALESCE(SUM(qty),0) AS total_qty
    FROM cart_items WHERE user_id=?
  `).get(req.user.id);
  res.json({ ok: true, count: row.count, total_qty: row.total_qty });
});

// PATCH /api/cart/:itemId { qty }
router.patch('/:itemId', (req, res) => {
  const item = db.prepare('SELECT * FROM cart_items WHERE id=? AND user_id=?').get(req.params.itemId, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });
  const qty = Math.max(1, parseInt((req.body || {}).qty, 10) || 1);
  db.prepare('UPDATE cart_items SET qty=? WHERE id=?').run(qty, item.id);
  res.json({ ok: true });
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE id=? AND user_id=?').run(req.params.itemId, req.user.id);
  res.json({ ok: true });
});

// DELETE /api/cart
router.delete('/', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id=?').run(req.user.id);
  res.json({ ok: true });
});

module.exports = router;