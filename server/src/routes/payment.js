const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const gatewayMode = () => (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET ? 'razorpay' : 'demo');

function loadClient() {
  try { return require('razorpay'); } catch (e) { return null; }
}
function razorClient() {
  const R = loadClient();
  if (!R) return null;
  return new R({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

// GET /api/payment/gateway  -> which gateway is active
router.get('/gateway', (req, res) => {
  res.json({ mode: gatewayMode(), key_id: RAZORPAY_KEY_ID });
});

function markPaid(order, gateway, tx, io) {
  const done = db.transaction(() => {
    db.prepare(`UPDATE payments SET status='paid', gateway=?, tx_ref=?, paid_at=datetime('now') WHERE order_id=?`)
      .run(gateway, tx, order.id);
    db.prepare(`UPDATE orders SET payment_status='paid', updated_at=datetime('now') WHERE id=?`).run(order.id);
  });
  done();
  const updated = db.prepare('SELECT * FROM orders WHERE id=?').get(order.id);
  if (io) {
    io.emit('order:updated', { id: updated.id, order_no: updated.order_no, status: updated.status, payment_status: 'paid' });
    io.emit('payment:confirmed', { order_no: updated.order_no, amount: updated.total, gateway, tx_ref: tx });
  }
  return updated;
}

// POST /api/payment/init  { orderId }
// Prepares a payment session against an online order belonging to the user.
// - Razorpay mode: creates a real Razorpay order on the gateway.
// - Demo mode: simulates the UPI session (for local/testing without keys).
router.post('/init', requireAuth('user'), async (req, res) => {
  try {
    const { orderId } = req.body || {};
    const order = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(orderId, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.payment_method !== 'online') return res.status(400).json({ error: 'This order is Cash on Delivery' });
    if (order.payment_status === 'paid') return res.status(400).json({ error: 'Order already paid' });

    // Reuse any existing pending payment row for this order
    let payment = db.prepare(`SELECT * FROM payments WHERE order_id=? AND status='pending'`).get(order.id);
    if (!payment) {
      const info = db.prepare(`
        INSERT INTO payments (order_id, amount, method, gateway, tx_ref, status)
        VALUES (?,?,?,?,?, 'pending')
      `).run(order.id, order.total, 'upi', gatewayMode(), `DM${order.order_no}T${Date.now()}`);
      payment = db.prepare('SELECT * FROM payments WHERE id=?').get(info.lastInsertRowid);
    }

    const base = {
      status: 'initiated',
      mode: gatewayMode(),
      payment_id: payment.id,
      order_no: order.order_no,
      amount: order.total,
      available_gateways: [
        { key: 'gpay', label: 'Google Pay' },
        { key: 'phonepe', label: 'PhonePe' },
        { key: 'paytm', label: 'Paytm UPI' },
        { key: 'upi', label: 'Other UPI App' },
      ],
    };

    // Real Razorpay flow
    if (gatewayMode() === 'razorpay') {
      const client = razorClient();
      if (!client) return res.status(500).json({ error: 'Payment gateway not configured' });
      const rzp = await client.orders.create({
        amount: Math.round(order.total * 100),
        currency: 'INR',
        receipt: `rcpt_${order.order_no}`,
        notes: { order_id: String(order.id), order_no: order.order_no },
      });
      return res.json({ ...base, mode: 'razorpay', rzp_order_id: rzp.id, key_id: RAZORPAY_KEY_ID });
    }

    // Demo UPI flow
    res.json({ ...base, upi_id: process.env.UPI_ID || 'devamart@upi' });
  } catch (e) {
    console.error('payment/init error', e);
    res.status(500).json({ error: 'Could not initialise payment. Please try again.' });
  }
});

// POST /api/payment/:orderId/complete  { gateway }
// Demo mode: simulates the user completing payment on the chosen UPI app.
router.post('/:orderId/complete', requireAuth('user'), (req, res) => {
  const { gateway = 'upi' } = req.body || {};
  const order = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(req.params.orderId, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.payment_method !== 'online') return res.status(400).json({ error: 'This order is Cash on Delivery' });
  if (order.payment_status === 'paid') return res.status(400).json({ error: 'Order already paid' });

  const tx = `TXN${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
  const updated = markPaid(order, gateway, tx, req.app.get('io'));

  res.json({ ok: true, status: 'paid', tx_ref: tx, gateway, order_no: updated.order_no });
});

// POST /api/payment/razorpay/verify  { orderId, rzp_order_id, rzp_payment_id, rzp_signature }
// Real Razorpay flow: verifies the gateway signature and marks the order paid.
router.post('/razorpay/verify', requireAuth('user'), async (req, res) => {
  try {
    const { orderId, rzp_order_id, rzp_payment_id, rzp_signature } = req.body || {};
    if (!orderId || !rzp_order_id || !rzp_payment_id || !rzp_signature) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }
    const order = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(orderId, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.payment_method !== 'online') return res.status(400).json({ error: 'This order is Cash on Delivery' });
    if (order.payment_status === 'paid') return res.status(400).json({ error: 'Order already paid' });

    const R = loadClient();
    if (!R) return res.status(500).json({ error: 'Payment gateway not configured' });
    const rzp = razorClient();
    const body = `${rzp_order_id}|${rzp_payment_id}`;
    const crypto = require('crypto');
    const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex');
    if (expected !== rzp_signature) return res.status(400).json({ error: 'Payment signature verification failed' });

    // Fetch payment details from Razorpay to cross-check amount
    let verified = false;
    try {
      const pay = await rzp.payments.fetch(rzp_payment_id);
      verified = pay && pay.order_id === rzp_order_id && pay.status === 'captured';
    } catch (e) { verified = false; }
    if (!verified) {
      // Signature is valid but payment not captured yet — mark captured if possible
      try { await rzp.payments.capture(rzp_payment_id, Math.round(order.total * 100), 'INR'); verified = true; } catch (e) { verified = false; }
    }
    if (!verified) return res.status(400).json({ error: 'Payment not captured on gateway' });

    const updated = markPaid(order, 'razorpay', rzp_payment_id, req.app.get('io'));
    res.json({ ok: true, status: 'paid', tx_ref: rzp_payment_id, gateway: 'razorpay', order_no: updated.order_no });
  } catch (e) {
    console.error('razorpay verify error', e);
    res.status(500).json({ error: 'Could not verify payment. Please contact support.' });
  }
});

module.exports = router;