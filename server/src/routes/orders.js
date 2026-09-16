const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');
const { productToView, resolveImage } = require('../images');

const router = express.Router();

const STATUS_FLOW = ['placed', 'packed', 'shipped', 'on_the_way', 'delivered'];
const STATUS_LABEL = {
  placed: 'Order Placed', packed: 'Packed', shipped: 'Shipped',
  on_the_way: 'On The Way', delivered: 'Delivered', cancelled: 'Cancelled',
};

function makeOrderNo() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `DM${y}${m}${dd}${String(Math.floor(100000 + Math.random() * 900000))}`;
}

function orderView(o) {
  let items = [];
  try { items = JSON.parse(o.items); } catch (e) {}
  let address = {};
  try { address = JSON.parse(o.address); } catch (e) {}
  return {
    id: o.id, order_no: o.order_no, user_id: o.user_id,
    items, subtotal: o.subtotal, shipping: o.shipping, total: o.total,
    address, payment_method: o.payment_method, payment_status: o.payment_status,
    status: o.status, status_label: STATUS_LABEL[o.status] || o.status,
    placed_at: o.placed_at, updated_at: o.updated_at,
    customer_name: o.customer_name,
    customer_email: o.customer_email,
    customer_phone: o.customer_phone,
  };
}

function emit(io, event, payload) {
  if (io) io.emit(event, payload);
}

// POST /api/orders  -> create order from user's cart
router.post('/', requireAuth('user'), (req, res) => {
  const { address, paymentMethod } = req.body || {};
  if (!address || !address.name || !address.phone || !address.line || !address.city || !address.state || !address.pincode) {
    return res.status(400).json({ error: 'Complete delivery address is required' });
  }
  if (!['cod', 'online'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Choose Cash on Delivery or Online payment' });
  }

  const cartRows = db.prepare(`
    SELECT ci.id AS cart_id, ci.qty, p.*, c.name AS category_name
    FROM cart_items ci JOIN products p ON p.id=ci.product_id AND p.active=1
    JOIN categories c ON c.id=p.category_id
    WHERE ci.user_id=?
  `).all(req.user.id);

  if (!cartRows.length) return res.status(400).json({ error: 'Your cart is empty' });

  const items = cartRows.map(r => ({
    product_id: r.id, name: r.name, price: r.price, qty: r.qty,
    image: resolveImage(r), category: r.category_name,
  }));
  const subtotal = +items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
  const shipping = subtotal >= 499 ? 0 : 49;
  const total = +(subtotal + shipping).toFixed(2);

  const orderNo = makeOrderNo();
  const insert = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO orders (order_no, user_id, items, subtotal, shipping, total, address, payment_method, payment_status, status)
      VALUES (?,?,?,?,?,?,?,?,?, 'placed')
    `).run(orderNo, req.user.id, JSON.stringify(items), subtotal, shipping, total,
      JSON.stringify(address), paymentMethod, paymentMethod === 'cod' ? 'pending' : 'pending');

    const dec = db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id=?');
    for (const r of cartRows) dec.run(r.qty, r.id);
    db.prepare('DELETE FROM cart_items WHERE user_id=?').run(req.user.id);

    if (paymentMethod === 'online') {
      db.prepare('INSERT INTO payments (order_id, amount, method, gateway, status) VALUES (?,?,?,?,?)')
        .run(info.lastInsertRowid, total, 'upi', 'devaMart', 'pending');
    }
    return info.lastInsertRowid;
  });

  const orderId = insert();
  const order = orderView(db.prepare('SELECT * FROM orders WHERE id=?').get(orderId));

  const io = req.app.get('io');
  emit(io, 'order:new', order);  // live to admin dashboard

  res.status(201).json({ order: { ...order, payment_url: paymentMethod === 'online' ? `/payment/${orderId}` : null } });
});

// GET /api/orders - my orders
router.get('/', requireAuth('user'), (req, res) => {
  const rows = db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC').all(req.user.id);
  res.json(rows.map(orderView));
});

// GET /api/orders/:id - one order of the logged in user
router.get('/:id', requireAuth('user'), (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  res.json(orderView(o));
});

// GET /api/track/:orderNo - public order tracking
router.get('/track/:orderNo', (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE order_no=?').get(req.params.orderNo);
  if (!o) return res.status(404).json({ error: 'Order not found. Check the order number and try again.' });

  const current = o.status;
  const progress = o.status === 'cancelled'
    ? []
    : STATUS_FLOW.map(s => ({ status: s, label: STATUS_LABEL[s], reached: STATUS_FLOW.indexOf(s) <= STATUS_FLOW.indexOf(current) }));
  res.json({
    order_no: o.order_no,
    status: o.status,
    status_label: STATUS_LABEL[o.status] || o.status,
    current_step: Math.max(0, STATUS_FLOW.indexOf(o.status)),
    total_steps: STATUS_FLOW.length - 1,
    progress,
    placed_at: o.placed_at,
    updated_at: o.updated_at,
    payment_method: o.payment_method,
    payment_status: o.payment_status,
    total: o.total,
    items_count: (() => { try { return JSON.parse(o.items).length; } catch (e) { return 0; } })(),
  });
});

module.exports = router;
module.exports.STATUS_FLOW = STATUS_FLOW;
module.exports.STATUS_LABEL = STATUS_LABEL;
module.exports.orderView = orderView;