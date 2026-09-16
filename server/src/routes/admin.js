const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { productToView } = require('../images');

const router = express.Router();
router.use((req, res, next) => {
  requireAuth('admin')(req, res, next);
});

const { orderView } = require('./orders');

// ---------- Dashboard ----------
router.get('/stats', (req, res) => {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const revenueToday = db.prepare(`
    SELECT COALESCE(SUM(total),0) AS v FROM orders
    WHERE date(updated_at) = date('now') AND status != 'cancelled' AND payment_status='paid'
  `).get().v;

  const codToday = db.prepare(`
    SELECT COALESCE(SUM(total),0) AS v FROM orders
    WHERE date(updated_at) = date('now') AND status != 'cancelled' AND payment_method='cod'
  `).get().v;

  const totalSales = db.prepare(`
    SELECT COALESCE(SUM(total),0) AS v FROM orders WHERE status != 'cancelled' AND payment_status='paid'
  `).get().v;
  const codOutstanding = db.prepare(`
    SELECT COALESCE(SUM(total),0) AS v FROM orders WHERE status != 'cancelled' AND payment_method='cod' AND payment_status='pending'
  `).get().v;
  const totalOrders = db.prepare(`SELECT COUNT(*) c FROM orders`).get().c;
  const todayOrders = db.prepare(`SELECT COUNT(*) c FROM orders WHERE date(placed_at)=date('now')`).get().c;
  const pendingOrders = db.prepare(`SELECT COUNT(*) c FROM orders WHERE status NOT IN ('delivered','cancelled')`).get().c;
  const deliveredOrders = db.prepare(`SELECT COUNT(*) c FROM orders WHERE status='delivered'`).get().c;
  const totalUsers = db.prepare(`SELECT COUNT(*) c FROM users WHERE role='user'`).get().c;
  const totalProducts = db.prepare(`SELECT COUNT(*) c FROM products`).get().c;
  const codOrders = db.prepare(`SELECT COUNT(*) c FROM orders WHERE payment_method='cod'`).get().c;
  const onlineOrders = db.prepare(`SELECT COUNT(*) c FROM orders WHERE payment_method='online'`).get().c;

  const trend = db.prepare(`
    SELECT date(placed_at) AS day, COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
    FROM orders WHERE placed_at >= datetime('now','-6 days','start of day')
    GROUP BY date(placed_at) ORDER BY day
  `).all();

  const byCategory = db.prepare(`
    SELECT c.name AS category, c.slug AS slug, COUNT(p.id) AS products
    FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id
  `).all();

  const byStatus = {};
  for (const s of ['placed', 'packed', 'shipped', 'on_the_way', 'delivered', 'cancelled']) {
    byStatus[s] = db.prepare(`SELECT COUNT(*) c FROM orders WHERE status=?`).get(s).c;
  }

  res.json({
    revenue_today: revenueToday,
    cod_today: codToday,
    total_sales: totalSales,
    cod_outstanding: codOutstanding,
    total_orders: totalOrders,
    today_orders: todayOrders,
    pending_orders: pendingOrders,
    delivered_orders: deliveredOrders,
    total_users: totalUsers,
    total_products: totalProducts,
    cod_orders: codOrders,
    online_orders: onlineOrders,
    trend, by_category: byCategory, by_status: byStatus,
  });
});

// ---------- Orders ----------
router.get('/orders', (req, res) => {
  const { status, payment } = req.query;
  const where = [];
  const params = [];
  if (status) { where.push('o.status=?'); params.push(status); }
  if (payment) { where.push('o.payment_method=?'); params.push(payment); }
  const wsql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const rows = db.prepare(`
    SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
    FROM orders o JOIN users u ON u.id=o.user_id ${wsql} ORDER BY o.id DESC LIMIT 300
  `).all(...params);
  res.json(rows.map(orderView));
});

router.patch('/orders/:id/status', (req, res) => {
  const { status } = req.body || {};
  const valid = ['placed', 'packed', 'shipped', 'on_the_way', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare(`UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?`).run(status, order.id);
  const updated = orderView(db.prepare('SELECT * FROM orders WHERE id=?').get(order.id));
  const io = req.app.get('io');
  if (io) io.emit('order:updated', updated);
  res.json({ ok: true, order: updated });
});

router.patch('/orders/:id/payment', (req, res) => {
  const { paymentStatus, amountReceived } = req.body || {};
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.payment_method === 'online') return res.status(400).json({ error: 'Online orders update automatically after payment' });

  const status = paymentStatus === 'paid' ? 'paid' : 'pending';
  db.prepare(`UPDATE orders SET payment_status=?, updated_at=datetime('now') WHERE id=?`).run(status, order.id);
  if (status === 'paid') {
    db.prepare(`INSERT INTO payments (order_id, amount, method, gateway, status, paid_at) VALUES (?,?,?,?,?,datetime('now'))`)
      .run(order.id, amountReceived || order.total, 'cod', 'cash', 'paid');
  }
  const updated = orderView(db.prepare('SELECT * FROM orders WHERE id=?').get(order.id));
  const io = req.app.get('io');
  if (io) io.emit('order:updated', updated);
  res.json({ ok: true, order: updated });
});

// ---------- Products ----------
router.get('/products', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, c.slug AS category_slug, c.name AS category_name
    FROM products p JOIN categories c ON c.id=p.category_id
    ORDER BY p.id ASC
  `).all();
  res.json(rows.map(productToView));
});

router.post('/products', (req, res) => {
  const p = req.body || {};
  if (!p.name || !p.price || !p.category_id) return res.status(400).json({ error: 'Name, price and category are required' });
  const info = db.prepare(`
    INSERT INTO products (sku, name, category_id, description, price, mrp, image, stock, active, featured)
    VALUES (?,?,?,?,?,?,?,?,1,?)
  `).run(p.sku || '', p.name, p.category_id, p.description || '', +p.price, p.mrp || +p.price, p.image || '', p.stock ?? 100, p.featured ? 1 : 0);

  const product = productToView(db.prepare(`SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE p.id=?`).get(info.lastInsertRowid));
  const io = req.app.get('io');
  if (io) io.emit('product:changed', { action: 'created', product });
  res.status(201).json({ ok: true, product });
});

router.patch('/products/:id', (req, res) => {
  const p = req.body || {};
  const existing = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  db.prepare(`
    UPDATE products SET
      sku=?, name=?, category_id=?, description=?, price=?, mrp=?, image=?, stock=?, active=?, featured=?, checklist=?, instructions=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    p.sku ?? existing.sku, p.name ?? existing.name, p.category_id ?? existing.category_id,
    p.description ?? existing.description, +(p.price ?? existing.price), +(p.mrp ?? existing.mrp ?? existing.price),
    p.image ?? existing.image, +(p.stock ?? existing.stock), p.active === undefined ? existing.active : (p.active ? 1 : 0),
    p.featured ? 1 : 0,
    p.checklist !== undefined ? JSON.stringify(p.checklist) : existing.checklist,
    p.instructions !== undefined ? JSON.stringify(p.instructions) : existing.instructions,
    existing.id
  );

  const product = productToView(db.prepare(`SELECT p.*, c.name AS category_name, c.slug AS category_slug FROM products p JOIN categories c ON c.id=p.category_id WHERE p.id=?`).get(existing.id));
  const io = req.app.get('io');
  if (io) io.emit('product:changed', { action: 'updated', product });
  res.json({ ok: true, product });
});

router.delete('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  db.prepare(`UPDATE products SET active=0, updated_at=datetime('now') WHERE id=?`).run(existing.id);
  const io = req.app.get('io');
  if (io) io.emit('product:changed', { action: 'deleted', id: existing.id });
  res.json({ ok: true });
});

// ---------- Categories ----------
router.get('/categories', (req, res) => {
  res.json(db.prepare(`SELECT c.*, COUNT(p.id) AS products FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id ORDER BY c.id`).all());
});

router.post('/categories', (req, res) => {
  const { name, icon, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  const info = db.prepare('INSERT INTO categories (slug,name,icon,description) VALUES (?,?,?,?)')
    .run(slug, name, icon || '🪔', description || '');
  res.status(201).json({ ok: true, category: db.prepare('SELECT * FROM categories WHERE id=?').get(info.lastInsertRowid) });
});

router.patch('/categories/:id', (req, res) => {
  const { name, icon, description, active } = req.body || {};
  const existing = db.prepare('SELECT * FROM categories WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Category not found' });
  db.prepare('UPDATE categories SET name=?, icon=?, description=?, active=? WHERE id=?')
    .run(name ?? existing.name, icon ?? existing.icon, description ?? existing.description,
      active === undefined ? existing.active : (active ? 1 : 0), existing.id);
  const io = req.app.get('io');
  if (io) io.emit('categories:changed');
  res.json({ ok: true });
});

// ---------- Customers ----------
router.get('/customers', (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.created_at,
      (SELECT COUNT(*) FROM orders o WHERE o.user_id=u.id) AS orders_count,
      (SELECT COALESCE(SUM(o.total),0) FROM orders o WHERE o.user_id=u.id AND o.status!='cancelled' AND o.payment_status='paid') AS spent
    FROM users u WHERE u.role='user' ORDER BY u.id DESC
  `).all();
  res.json(rows);
});

// ---------- Banners / Carousel ----------
router.get('/banners', (req, res) => {
  res.json(db.prepare('SELECT * FROM banners ORDER BY sort ASC, id ASC').all());
});

router.post('/banners', (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.image_url) return res.status(400).json({ error: 'Title and image URL are required' });
  const info = db.prepare(`
    INSERT INTO banners (title, subtitle, image_url, pos, link, active, sort)
    VALUES (?,?,?,?,?,?,?)
  `).run(b.title, b.subtitle || '', b.image_url, b.pos || 'center', b.link || '/shop', b.active === undefined ? 1 : (b.active ? 1 : 0), b.sort ?? 99);
  const banner = db.prepare('SELECT * FROM banners WHERE id=?').get(info.lastInsertRowid);
  const io = req.app.get('io');
  if (io) io.emit('banners:changed');
  res.status(201).json({ ok: true, banner });
});

router.patch('/banners/:id', (req, res) => {
  const b = req.body || {};
  const existing = db.prepare('SELECT * FROM banners WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Banner not found' });
  db.prepare(`
    UPDATE banners SET title=?, subtitle=?, image_url=?, pos=?, link=?, active=?, sort=?, updated_at=datetime('now') WHERE id=?
  `).run(
    b.title ?? existing.title, b.subtitle ?? existing.subtitle, b.image_url ?? existing.image_url,
    b.pos ?? existing.pos, b.link ?? existing.link,
    b.active === undefined ? existing.active : (b.active ? 1 : 0),
    b.sort ?? existing.sort, existing.id
  );
  const io = req.app.get('io');
  if (io) io.emit('banners:changed');
  res.json({ ok: true, banner: db.prepare('SELECT * FROM banners WHERE id=?').get(existing.id) });
});

router.delete('/banners/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM banners WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Banner not found' });
  db.prepare('DELETE FROM banners WHERE id=?').run(existing.id);
  const io = req.app.get('io');
  if (io) io.emit('banners:changed');
  res.json({ ok: true });
});

// ---------- Login Logs ----------
router.get('/login-logs', (req, res) => {
  const { limit = 200 } = req.query;
  const rows = db.prepare('SELECT * FROM login_logs ORDER BY id DESC LIMIT ?').all(Math.min(+limit || 200, 1000));
  res.json(rows);
});

module.exports = router;