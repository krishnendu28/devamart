#!/usr/bin/env node
/**
 * DevaMart Beta Test - end-to-end journey against a running deployment.
 * Covers: catalog, auth, cart, checkout (COD + note), online payment (UPI app),
 * order tracking (incl. Ready for Dispatch), admin dashboard/stats/orders,
 * status updates, contact-message inbox and authz boundaries.
 *
 * Usage:
 *   node beta-test.js [BASE_URL]   (default https://devamart-api.vercel.app)
 */
const BASE = process.argv[2] || process.env.BETA_BASE_URL || 'https://devamart-api.vercel.app';
const ADMIN = process.env.BETA_ADMIN_EMAIL || 'admin@devamart.in';
const ADMPW = process.env.BETA_ADMIN_PASS || 'Admin@1234';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
let failed = 0;
function check(name, cond, extra = '') {
  results.push({ name, ok: !!cond, extra });
  if (cond) console.log(`  PASS  ${name}`);
  else { failed++; console.log(`  FAIL  ${name}${extra ? '  -- ' + extra : ''}`); }
}
async function req(path, { method = 'GET', token = '', body, status = 200 } = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: {
      'User-Agent': 'DevaMart-BetaTest/1.0',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await r.json(); } catch (e) { /* non-json */ }
  return { status: r.status, json };
}

(async () => {
  const stamp = Date.now().toString().slice(-8);
  const userEmail = `beta${stamp}@test.devamart.in`;
  let userTok = '', adminTok = '', orderNo = '', orderId = '';

  console.log(`\n=== DevaMart Beta Test ===\nbase: ${BASE}\nnew user: ${userEmail}\n`);

  // --- Health & catalog ---------------------------------------------------
  console.log('Health & catalog');
  let r = await req('/api/health');
  check('health ok', r.status === 200 && r.json?.ok === true);
  r = await req('/api/categories');
  check('5 categories', r.status === 200 && r.json.length === 5, `got ${r.json?.length}`);
  r = await req('/api/products');
  const products = r.json || [];
  check('70 products', products.length === 70, `got ${products.length}`);
  check('every product has image+price+name', products.every(p => p.image && p.price > 0 && p.name));
  check('price <= mrp', products.every(p => p.price <= p.mrp));
  const amethyst = products.find(p => p.sku === 'DM-083');
  check('DM-083 image is amethyst', /amethyst/i.test((amethyst?.image || '')), amethyst?.image);
  const kra = products.find(p => p.sku === 'DM-052');
  check('DM-052 image is Lakshmi', /lakshmi/i.test((kra?.image || '')), kra?.image);
  r = await req('/api/products?category=healing-crystals');
  check('category filter', r.status === 200 && r.json.length === 10, `got ${r.json?.length}`);
  r = await req('/api/products?search=rudraksha');
  check('search "rudraksha"', r.status === 200 && r.json.length >= 10, `got ${r.json?.length}`);
  r = await req('/api/products?sort=price_desc');
  check('price desc sort', r.status === 200 && r.json[0].price >= r.json[1].price);

  // --- Authz boundaries ---------------------------------------------------
  console.log('Authz boundaries');
  r = await req('/api/cart');
  check('cart without token -> 401', r.status === 401);
  r = await req('/api/admin/stats');
  check('admin stats without token -> 401', r.status === 401);
  r = await req('/api/products/999999');
  check('unknown product -> 404', r.status === 404);

  // --- User journey --------------------------------------------------------
  console.log('User: signup -> login -> me');
  r = await req('/api/auth/signup', { method: 'POST', body: { name: 'Beta Tester', email: userEmail, password: 'Beta@1234' } });
  check('signup', (r.status === 200 || r.status === 201) && !!r.json?.token, `status ${r.status} ${JSON.stringify(r.json || {}).slice(0, 60)}`);
  userTok = r.json?.token || '';
  r = await req('/api/auth/login', { method: 'POST', body: { email: userEmail, password: 'Beta@1234' } });
  check('login', r.status === 200 && !!r.json?.token);
  userTok = r.json?.token || userTok;
  r = await req('/api/auth/me', { token: userTok });
  check('me (role=user)', r.status === 200 && r.json?.user?.role === 'user');
  r = await req('/api/auth/admin-login', { method: 'POST', body: { email: userEmail, password: 'Beta@1234' } });
  check('user cannot admin-login -> 403', r.status === 403);
  r = await req('/api/admin/stats', { token: userTok });
  check('user token on admin API -> 403', r.status === 403);

  // --- Cart ----------------------------------------------------------------
  console.log('Cart');
  const it1 = products.find(p => p.sku === 'DM-081');
  const it2 = products.find(p => p.sku === 'DM-070');
  r = await req('/api/cart', { method: 'POST', token: userTok, body: { productId: it1.id, qty: 2 } });
  check('add DM-081 x2', r.status === 200);
  await req('/api/cart', { method: 'POST', token: userTok, body: { productId: it2.id, qty: 1 } });
  r = await req('/api/cart', { token: userTok });
  const cart = r.json || {};
  check('cart has 2 lines', (cart.items || []).length === 2, JSON.stringify(cart).slice(0, 80));
  check('cart totals computed', cart.total === (cart.items || []).reduce((s, i) => s + i.line_total, 0) && cart.total > 0, `total=${cart.total}`);
  const lineId = cart.items?.[0]?.id;
  r = await req(`/api/cart/${lineId}`, { method: 'PATCH', token: userTok, body: { qty: 3 } });
  check('update qty to 3', r.status === 200 && r.json?.ok === true, JSON.stringify(r.json).slice(0, 70));
  r = await req('/api/cart', { token: userTok });
  check('cart reflects qty 3', (r.json?.items || []).find(i => i.id === lineId)?.qty === 3);
  r = await req('/api/cart', { method: 'POST', token: userTok, body: { productId: 999999, qty: 1 } });
  check('add unknown product -> 404', r.status === 404);

  // --- COD order with note -------------------------------------------------
  console.log('Order: COD + note');
  r = await req('/api/orders', {
    method: 'POST', token: userTok,
    body: { address: { name: 'Beta Tester', phone: '9038150556', line: '1 Shivaji Nagar', city: 'Kolkata', state: 'WB', pincode: '700001' }, paymentMethod: 'cod', note: 'Beta test note – please pack carefully.' },
  });
  check('place COD order', (r.status === 200 || r.status === 201) && !!r.json?.order?.order_no, `${r.status} ${JSON.stringify(r.json || {}).slice(0, 80)}`);
  orderNo = r.json?.order?.order_no || '';
  orderId = r.json?.order?.id;
  check('COD payment pending', r.json?.order?.payment_status === 'pending');
  check('customer note saved', r.json?.order?.note === 'Beta test note – please pack carefully.', r.json?.order?.note);
  r = await req(`/api/orders/${orderId}`, { token: userTok });
  check('fetch my order', r.status === 200 && r.json?.order_no === orderNo);
  r = await req(`/api/orders/track/${orderNo}`);
  check('public track endpoint', r.status === 200 && r.json?.status === 'placed', `${r.status} ${JSON.stringify(r.json || {}).slice(0, 60)}`);
  const labels = (r.json?.progress || []).map(p => p.label || p.status).join(' ');
  check('track progress shows ready step', (r.json?.progress || []).length === 6, `len=${(r.json?.progress || []).length}`);
  check('track labels include Ready for Dispatch', labels.toLowerCase().includes('ready for dispatch'));
  r = await req('/api/orders', { token: userTok });
  check('my orders list has 1 order', (r.json || []).length === 1);

  // --- Online order + UPI app ----------------------------------------------
  console.log('Order: online + UPI app');
  await req('/api/cart', { method: 'DELETE', token: userTok });
  await req('/api/cart', { method: 'POST', token: userTok, body: { productId: it2.id, qty: 1 } });
  r = await req('/api/orders', {
    method: 'POST', token: userTok,
    body: { address: { name: 'Beta Tester', phone: '9038150556', line: '1 Shivaji Nagar', city: 'Kolkata', state: 'WB', pincode: '700001' }, paymentMethod: 'online', upiApp: 'gpay', note: '' },
  });
  const onlineOrder = r.json?.order;
  check('place online order', (r.status === 200 || r.status === 201) && !!onlineOrder, `${r.status} ${JSON.stringify(r.json || {}).slice(0, 60)}`);
  r = await req(`/api/payment/init`, { method: 'POST', token: userTok, body: { orderId: onlineOrder.id } });
  check('payment init', r.status === 200 && !!r.json?.payment_id && (r.json?.available_gateways || []).some(g => g.key === 'gpay'), `${r.status} ${JSON.stringify(r.json || {}).slice(0, 70)}`);
  r = await req(`/api/payment/${onlineOrder.id}/complete`, { method: 'POST', token: userTok, body: { gateway: 'gpay' } });
  check('complete payment (UPI app gateway)', r.status === 200 && r.json?.status === 'paid' && r.json?.gateway === 'gpay', `${r.status} ${JSON.stringify(r.json || {}).slice(0, 70)}`);
  r = await req(`/api/payment/${onlineOrder.id}/complete`, { method: 'POST', token: userTok, body: { gateway: 'gpay' } });
  check('double payment blocked -> 400', r.status === 400);
  r = await req('/api/orders', { token: userTok });
  const paidOrder = (r.json || []).find(o => o.id === onlineOrder.id);
  check('order marked paid', paidOrder && paidOrder.payment_status === 'paid', JSON.stringify(paidOrder || {}).slice(0, 60));
  r = await req(`/api/payment/gateway`);
  check('payment gateway meta', r.status === 200 && !!r.json?.mode);
  r = await req('/api/orders', { method: 'POST', token: userTok, body: { address: { name: 'X', phone: '1', line: '', city: '', state: '', pincode: '' }, paymentMethod: 'cod' } });
  check('incomplete address -> 400', r.status === 400);

  // --- Contact message -----------------------------------------------------
  console.log('Contact form');
  r = await req('/api/content/contact', { method: 'POST', body: { name: 'Beta Tester', email: userEmail, phone: '9038150556', message: 'Beta test message ' + stamp } });
  check('submit contact message', (r.status === 200 || r.status === 201), `${r.status} ${JSON.stringify(r.json || {}).slice(0, 60)}`);
  const contactInfo = (await req('/api/content/contact')).json || {};
  check('contact page carries phone', /90381 ?50556/.test((contactInfo.phone || '') + ' ' + (contactInfo.whatsapp || '')));

  // --- Admin journey -------------------------------------------------------
  console.log('Admin: login -> stats -> orders -> messages');
  r = await req('/api/auth/admin-login', { method: 'POST', body: { email: ADMIN, password: ADMPW } });
  check('admin login', r.status === 200 && r.json?.user?.role === 'admin', `${r.status} ${JSON.stringify(r.json || {}).slice(0, 50)}`);
  adminTok = r.json?.token || '';
  r = await req('/api/admin/stats', { token: adminTok });
  const st = r.json || {};
  check('stats has revenue_today', typeof st.revenue_today === 'number');
  check('stats has revenue_month', typeof st.revenue_month === 'number');
  check('stats has cod_today', typeof st.cod_today === 'number');
  check('stats by_status includes ready', Object.keys(st.by_status || {}).includes('ready'), Object.keys(st.by_status || {}).join(','));
  check('stats has month_orders + unread_messages', typeof st.month_orders === 'number' && typeof st.unread_messages === 'number');
  r = await req('/api/admin/orders?status=ready', { token: adminTok });
  check('admin orders ready filter', r.status === 200 && Array.isArray(r.json) && r.json.every(o => o.status === 'ready'));
  r = await req('/api/admin/orders?q=' + encodeURIComponent('Beta Tester'), { token: adminTok });
  check('admin search by customer name', r.status === 200 && r.json.some(o => /Beta Tester/.test(o.customer_name || '')) || r.json.some(o => /Beta Tester/.test((o.user || {}).name || '')));
  const myOrder = [...(r.json || [])].find(o => o.order_no === orderNo);
  check('admin sees my COD order', !!myOrder, `order ${orderNo} not found in search`);
  check('admin sees customer note', myOrder && myOrder.note, myOrder?.note);
  r = await req(`/api/admin/orders/${orderId}/status`, { method: 'PATCH', token: adminTok, body: { status: 'ready' } });
  check('admin marks Ready for Dispatch', r.status === 200 && r.json?.order?.status === 'ready', `${r.status} ${JSON.stringify(r.json || {}).slice(0, 60)}`);
  r = await req(`/api/orders/track/${orderNo}`);
  const labelsAfter = (r.json?.progress || []).map(p => p.label || p.status).join(' ');
  check('user sees Ready for Dispatch', labelsAfter.toLowerCase().includes('ready for dispatch'));
  check('track shows current = ready', r.json?.status === 'ready');
  r = await req('/api/admin/messages', { token: adminTok });
  const msgs = r.json || [];
  check('admin messages inbox', r.status === 200 && msgs.length >= 1, `got ${msgs.length}`);
  const unread = msgs.find(m => /Beta test message/.test(m.message || '') && m.read === false);
  check('beta message present + unread', !!unread, JSON.stringify(msgs.find(m => /Beta test message/.test(m.message || '')) || {}).slice(0, 90));
  r = await req(`/api/admin/messages/${unread?.id}/read`, { method: 'PATCH', token: adminTok, body: { read: true } });
  const didRead = r.status === 200 && r.json?.read === true;
  r = await req('/api/admin/messages', { token: adminTok });
  check('mark message read', didRead && (r.json || []).find(m => /Beta test message/.test(m.message || ''))?.read === true);
  r = await req('/api/admin/login-logs', { token: adminTok });
  check('login logs', r.status === 200 && (r.json || []).length >= 1);
  r = await req('/api/admin/banners', { token: adminTok });
  check('admin banners', r.status === 200);
  r = await req('/api/admin/customers', { token: adminTok });
  check('customers list', r.status === 200 && (r.json || []).length >= 1);

  // --- Cleanup: clear beta cart --------------------------------------------
  await req('/api/cart', { method: 'DELETE', token: userTok });

  console.log(`\n=== BETA TEST ${failed ? `FAILED (${failed})` : 'PASSED'} ===`);
  const fs = require('fs');
  fs.writeFileSync('beta-test-report.json', JSON.stringify({ base: BASE, orderNo, user: userEmail, failed, results }, null, 2));
  process.exit(failed ? 1 : 0);
})();