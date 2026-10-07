/*
 * DevaMart end-to-end API smoke test.
 * Boots the server on a test port, exercises every endpoint (REST + Socket.io),
 * then shuts down.  Run:  node test-api.js
 */
process.env.PORT = process.env.PORT || '4100';

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const io = require('socket.io-client');

const PORT = process.env.PORT;
const BASE = `http://localhost:${PORT}`;

// Isolated throwaway database so the suite is deterministic on every run.
const TEST_DB = path.join(os.tmpdir(), `devamart-test-${Date.now()}.db`);
process.env.DB_PATH = TEST_DB;
for (const suffix of ['', '-wal', '-shm']) {
  try { fs.unlinkSync(TEST_DB + suffix); } catch (e) {}
}
const seedRun = spawnSync(process.execPath, [path.join(__dirname, 'src', 'seed.js')], { env: process.env, encoding: 'utf8' });
if (seedRun.status !== 0) { console.error('Seed failed', seedRun.stderr); process.exit(1); }

let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, extra) {
  if (cond) { pass++; console.log(`  \u2713 ${name}`); }
  else { fail++; failures.push(name); console.log(`  \u2717 ${name}${extra ? ' -> ' + JSON.stringify(extra) : ''}`); }
}

async function req(method, url, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  return { status: res.status, data, contentType: res.headers.get('content-type') };
}

function section(t) { console.log(`\n${t}`); }

async function main() {
  const server = spawn(process.execPath, [path.join(__dirname, 'src', 'index.js')], {
    env: { ...process.env, PORT },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let booted = false;
  server.stdout.on('data', d => { if (String(d).includes('DevaMart API running')) booted = true; });
  server.stderr.on('data', d => console.error('[server]', String(d).trim()));

  const wait = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 50 && !booted; i++) await wait(200);
  if (!booted) { console.error('Server failed to start'); server.kill(); process.exit(1); }
  await wait(300);

  const stamp = Date.now();

  section('Health & catalogue');
  const health = await req('GET', '/api/health');
  ok('GET /api/health', health.status === 200 && health.data.ok === true, health.data);

  const cats = await req('GET', '/api/categories');
  ok('GET /api/categories returns 5 categories', cats.status === 200 && cats.data.length === 5, cats.data.length);

  const prods = await req('GET', '/api/products');
  ok('GET /api/products returns 70 products', prods.status === 200 && prods.data.length === 70, prods.data.length);
  ok('products have an image', prods.data[0].image && (prods.data[0].image.startsWith('/images/placeholder/') || prods.data[0].image.startsWith('http')), prods.data[0].image);

  const byCat = await req('GET', '/api/products?category=puja-samagri-kits');
  ok('filter by category works', byCat.status === 200 && byCat.data.length > 0 && byCat.data.every(p => p.category_slug === 'puja-samagri-kits'), byCat.data.length);

  const search = await req('GET', '/api/products?q=rudraksha');
  ok('search works', search.status === 200 && search.data.length >= 5, search.data.length);

  const featured = await req('GET', '/api/products?featured=1');
  ok('featured filter works', featured.status === 200 && featured.data.length > 0 && featured.data.every(p => p.featured === 1), featured.data.length);

  const sorted = await req('GET', '/api/products?sort=price_desc');
  ok('price_desc sort works', sorted.status === 200 && sorted.data[0].price >= sorted.data[sorted.data.length - 1].price);

  const one = await req('GET', `/api/products/${prods.data[0].id}`);
  ok('GET /api/products/:id', one.status === 200 && one.data.id === prods.data[0].id);

  const missing = await req('GET', '/api/products/999999');
  ok('unknown product 404', missing.status === 404);

  const img = await fetch(`${BASE}/images/placeholder/${prods.data[0].id}.svg`);
  const imgText = await img.text();
  ok('placeholder SVG generated', img.status === 200 && imgText.includes('<svg') && imgText.includes('DevaMart'));

  section('Auth');
  const signup = await req('POST', '/api/auth/signup', { body: { name: 'Test Bhakt', email: `test${stamp}@devamart.in`, phone: '9876543210', password: 'Test@1234' } });
  ok('POST /api/auth/signup', signup.status === 201 && !!signup.data.token, signup.data);
  const userToken = (signup.data && signup.data.token) || '';
  const userEmail = `test${stamp}@devamart.in`;

  const dupe = await req('POST', '/api/auth/signup', { body: { name: 'X', email: userEmail, password: 'Test@1234' } });
  ok('duplicate email rejected 409', dupe.status === 409);

  const badSignup = await req('POST', '/api/auth/signup', { body: { name: '', email: 'bad', password: '123' } });
  ok('invalid signup rejected 400', badSignup.status === 400);

  const login = await req('POST', '/api/auth/login', { body: { email: userEmail, password: 'Test@1234' } });
  ok('POST /api/auth/login', login.status === 200 && !!login.data.token, login.data);

  const badLogin = await req('POST', '/api/auth/login', { body: { email: userEmail, password: 'wrong' } });
  ok('wrong password rejected 401', badLogin.status === 401);

  const me = await req('GET', '/api/auth/me', { token: userToken });
  ok('GET /api/auth/me', me.status === 200 && me.data.user.email === userEmail);

  section('Authorization boundaries (security)');
  const noToken = await req('GET', '/api/cart');
  ok('cart without token -> 401', noToken.status === 401);

  const userHitsAdmin = await req('GET', '/api/admin/stats', { token: userToken });
  ok('user cannot access admin API -> 403', userHitsAdmin.status === 403, userHitsAdmin.data);

  const userOnAdminLogin = await req('POST', '/api/auth/admin-login', { body: { email: userEmail, password: 'Test@1234' } });
  ok('non-admin blocked from admin portal -> 403', userOnAdminLogin.status === 403);

  const adminLogin = await req('POST', '/api/auth/admin-login', { body: { email: 'admin@devamart.in', password: 'Admin@1234' } });
  ok('admin login', adminLogin.status === 200 && adminLogin.data.user.role === 'admin', adminLogin.data);
  const adminToken = (adminLogin.data && adminLogin.data.token) || '';

  const adminOnUserLogin = await req('POST', '/api/auth/login', { body: { email: 'admin@devamart.in', password: 'Admin@1234' } });
  ok('admin blocked from user login -> 403', adminOnUserLogin.status === 403);

  const adminHitsMe = await req('GET', '/api/auth/me', { token: adminToken });
  ok('admin /me role=admin', adminHitsMe.status === 200 && adminHitsMe.data.user.role === 'admin');

  section('Cart');
  const add1 = await req('POST', '/api/cart', { token: userToken, body: { productId: prods.data[0].id, qty: 2 } });
  ok('POST /api/cart add item', add1.status === 200 && add1.data.total_qty === 2, add1.data);
  await req('POST', '/api/cart', { token: userToken, body: { productId: prods.data[5].id, qty: 1 } });

  const cart = await req('GET', '/api/cart', { token: userToken });
  ok('GET /api/cart', cart.status === 200 && cart.data.items.length === 2 && cart.data.total > 0, cart.data);
  ok('cart line totals computed', Math.abs(cart.data.items[0].line_total - (cart.data.items[0].price * cart.data.items[0].qty)) < 0.01);

  const patchCart = await req('PATCH', `/api/cart/${cart.data.items[0].id}`, { token: userToken, body: { qty: 3 } });
  ok('PATCH /api/cart/:id qty', patchCart.status === 200);
  const cart2 = await req('GET', '/api/cart', { token: userToken });
  ok('cart qty updated to 3', cart2.data.items.find(i => i.id === cart.data.items[0].id).qty === 3);

  const addBad = await req('POST', '/api/cart', { token: userToken, body: { productId: 999999 } });
  ok('add unknown product 404', addBad.status === 404);

  section('Socket.io realtime');
  let gotNewOrder = null, gotStatusUpdate = null, gotProductChange = null;
  const sock = io(BASE, { transports: ['websocket'] });
  await new Promise((resolve) => { sock.on('connect', resolve); setTimeout(resolve, 2000); });
  sock.emit('join-admin', adminToken);
  sock.on('order:new', o => { gotNewOrder = o; });
  sock.on('order:updated', o => { gotStatusUpdate = o; });
  sock.on('product:changed', p => { gotProductChange = p; });
  await wait(400);

  section('Orders (COD)');
  const address = { name: 'Test Bhakt', phone: '9876543210', line: '12 Temple Street, Near Mandir, Bengaluru', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' };
  const codOrder = await req('POST', '/api/orders', { token: userToken, body: { address, paymentMethod: 'cod', note: 'Please deliver after 6 PM' } });
  ok('POST /api/orders COD', codOrder.status === 201 && codOrder.data.order.order_no.startsWith('DM'), codOrder.data);
  const codId = codOrder.data.order.id;
  ok('COD order payment_status pending', codOrder.data.order.payment_status === 'pending');
  ok('customer note saved on order', codOrder.data.order.note === 'Please deliver after 6 PM', codOrder.data.order);
  ok('order created with ready-for-dispatch status flow', codOrder.data.order.status === 'placed');
  ok('free shipping above 499', codOrder.data.order.shipping === 0 || codOrder.data.order.subtotal < 499);

  const emptyCartOrder = await req('POST', '/api/orders', { token: userToken, body: { address, paymentMethod: 'cod' } });
  ok('order with empty cart -> 400', emptyCartOrder.status === 400);

  const badAddr = await req('POST', '/api/orders', { token: userToken, body: { address: { name: 'x' }, paymentMethod: 'cod' } });
  ok('incomplete address -> 400', badAddr.status === 400);

  const myOrders = await req('GET', '/api/orders', { token: userToken });
  ok('GET /api/orders (mine)', myOrders.status === 200 && myOrders.data.length === 1);

  const getOrder = await req('GET', `/api/orders/${codId}`, { token: userToken });
  ok('GET /api/orders/:id', getOrder.status === 200 && getOrder.data.id === codId);

  const otherUserOrder = await req('GET', `/api/orders/${codId}`, { token: adminToken });
  ok('user cannot fetch order with non-user token -> 403', otherUserOrder.status === 403);

  const track = await req('GET', `/api/orders/track/${codOrder.data.order.order_no}`);
  ok('public track endpoint', track.status === 200 && track.data.progress.length === 6 && track.data.progress[0].reached === true, track.data);
  ok('track exposes Ready for Dispatch step', track.data.progress.some(s => s.status === 'ready' && s.label === 'Ready for Dispatch'), track.data.progress);
  const trackBad = await req('GET', '/api/orders/track/DMNOPEQ');
  ok('unknown order number 404', trackBad.status === 404);

  await wait(400);
  ok('socket order:new fired to admin', !!gotNewOrder && gotNewOrder.order_no === codOrder.data.order.order_no, gotNewOrder);

  section('Orders (Online payment)');
  await req('POST', '/api/cart', { token: userToken, body: { productId: prods.data[1].id, qty: 1 } });
  const onlineOrder = await req('POST', '/api/orders', { token: userToken, body: { address, paymentMethod: 'online', upiApp: 'phonepe', note: 'Gift wrap please' } });
  ok('POST /api/orders online', onlineOrder.status === 201 && onlineOrder.data.order.payment_url, onlineOrder.data);
  ok('upi app + note accepted on online order', onlineOrder.data.order.note === 'Gift wrap please', onlineOrder.data.order);
  const onlineId = onlineOrder.data.order.id;

  const init = await req('POST', '/api/payment/init', { token: userToken, body: { orderId: onlineId } });
  ok('POST /api/payment/init', init.status === 200 && init.data.status === 'initiated' && init.data.available_gateways.length === 4, init.data);

  const badInit = await req('POST', '/api/payment/init', { token: userToken, body: { orderId: codId } });
  ok('payment init on COD order -> 400', badInit.status === 400);

  const complete = await req('POST', `/api/payment/${onlineId}/complete`, { token: userToken, body: { gateway: 'gpay' } });
  ok('POST /api/payment/:id/complete', complete.status === 200 && complete.data.status === 'paid' && complete.data.tx_ref, complete.data);

  const afterPay = await req('GET', `/api/orders/${onlineId}`, { token: userToken });
  ok('order marked paid after payment', afterPay.data.payment_status === 'paid');

  const doublePay = await req('POST', `/api/payment/${onlineId}/complete`, { token: userToken, body: { gateway: 'gpay' } });
  ok('double payment blocked -> 400', doublePay.status === 400);

  await wait(300);
  ok('socket payment + order update fired', !!gotStatusUpdate, gotStatusUpdate);

  section('Orders (status flow by admin)');
  for (const st of ['packed', 'ready', 'shipped', 'on_the_way', 'delivered']) {
    const r = await req('PATCH', `/api/admin/orders/${codId}/status`, { token: adminToken, body: { status: st } });
    ok(`admin set status "${st}"`, r.status === 200 && r.data.order.status === st, r.data);
    if (st === 'ready') {
      ok('admin can mark Ready for Dispatch', r.data.order.status_label === 'Ready for Dispatch', r.data.order);
      const readyTrack = await req('GET', `/api/orders/track/${codOrder.data.order.order_no}`);
      ok('user sees Ready for Dispatch while tracking', readyTrack.data.status === 'ready' && readyTrack.data.status_label === 'Ready for Dispatch', readyTrack.data);
      const liveOrders = await req('GET', '/api/admin/orders?status=ready', { token: adminToken });
      ok('admin history filter finds ready orders', liveOrders.status === 200 && liveOrders.data.length === 1, liveOrders.data);
    }
  }
  const badStatus = await req('PATCH', `/api/admin/orders/${codId}/status`, { token: adminToken, body: { status: 'teleported' } });
  ok('invalid status rejected', badStatus.status === 400);

  const trackDone = await req('GET', `/api/orders/track/${codOrder.data.order.order_no}`);
  ok('track shows delivered (all steps reached)', trackDone.data.status === 'delivered' && trackDone.data.progress.every(s => s.reached));

  const codPaid = await req('PATCH', `/api/admin/orders/${codId}/payment`, { token: adminToken, body: { paymentStatus: 'paid' } });
  ok('admin marks COD collected', codPaid.status === 200 && codPaid.data.order.payment_status === 'paid');

  const onlineCodPatch = await req('PATCH', `/api/admin/orders/${onlineId}/payment`, { token: adminToken, body: { paymentStatus: 'pending' } });
  ok('cannot manually change online payment -> 400', onlineCodPatch.status === 400);

  section('Admin dashboard');
  const stats = await req('GET', '/api/admin/stats', { token: adminToken });
  ok('GET /api/admin/stats', stats.status === 200 && stats.data.total_orders >= 2 && stats.data.total_products === 70, stats.data && { orders: stats.data.total_orders, products: stats.data.total_products });
  ok('stats has revenue + cod outstanding + trend', typeof stats.data.revenue_today === 'number' && typeof stats.data.cod_outstanding === 'number' && Array.isArray(stats.data.trend));
  ok('stats daily revenue counts COD too', stats.data.revenue_today >= stats.data.paid_today, { revenue_today: stats.data.revenue_today, paid_today: stats.data.paid_today });
  ok('stats monthly revenue present', typeof stats.data.revenue_month === 'number' && stats.data.revenue_month >= stats.data.revenue_today, stats.data.revenue_month);
  ok('stats monthly orders + unread messages present', typeof stats.data.month_orders === 'number' && typeof stats.data.unread_messages === 'number');
  ok('stats by_status includes ready', typeof stats.data.by_status.ready === 'number', stats.data.by_status);
  ok('stats by_category present', Array.isArray(stats.data.by_category) && stats.data.by_category.length === 5);

  const adminOrders = await req('GET', '/api/admin/orders', { token: adminToken });
  ok('GET /api/admin/orders', adminOrders.status === 200 && adminOrders.data.length >= 2);
  ok('admin order has customer info', !!adminOrders.data[0].customer_name && !!adminOrders.data[0].address.line);

  const adminOrdersFiltered = await req('GET', '/api/admin/orders?status=delivered', { token: adminToken });
  ok('admin orders status filter', adminOrdersFiltered.status === 200 && adminOrdersFiltered.data.every(o => o.status === 'delivered'));

  section('Admin product CRUD');
  const catsAdmin = await req('GET', '/api/admin/categories', { token: adminToken });
  ok('GET /api/admin/categories', catsAdmin.status === 200 && catsAdmin.data.length === 5);
  const catId = catsAdmin.data[0].id;

  const created = await req('POST', '/api/admin/products', { token: adminToken, body: { name: 'Test Puja Item', price: 123, mrp: 199, category_id: catId, description: 'temp', stock: 5, featured: true } });
  ok('POST /api/admin/products', created.status === 201 && created.data.product.id, created.data);
  const newProdId = created.data.product.id;

  await wait(300);
  ok('socket product:changed (created) fired', !!gotProductChange && gotProductChange.action === 'created');

  const updated = await req('PATCH', `/api/admin/products/${newProdId}`, { token: adminToken, body: { price: 150, stock: 9 } });
  ok('PATCH /api/admin/products/:id', updated.status === 200 && updated.data.product.price === 150 && updated.data.product.stock === 9, updated.data);

  const publicSees = await req('GET', `/api/products/${newProdId}`);
  ok('public sees updated product', publicSees.status === 200 && publicSees.data.price === 150);

  const deleted = await req('DELETE', `/api/admin/products/${newProdId}`, { token: adminToken });
  ok('DELETE /api/admin/products/:id (soft)', deleted.status === 200);
  const afterDelete = await req('GET', `/api/products/${newProdId}`);
  ok('deleted product hidden from public', afterDelete.status === 404);
  const adminStillSees = await req('GET', '/api/admin/products', { token: adminToken });
  ok('admin still sees inactive product', adminStillSees.data.some(p => p.id === newProdId && p.active === 0));

  const newCat = await req('POST', '/api/admin/categories', { token: adminToken, body: { name: 'Test Category', icon: '🌸' } });
  ok('POST /api/admin/categories', newCat.status === 201 && newCat.data.category.id);
  const patchedCat = await req('PATCH', `/api/admin/categories/${newCat.data.category.id}`, { token: adminToken, body: { name: 'Test Category Renamed' } });
  ok('PATCH /api/admin/categories/:id', patchedCat.status === 200);

  section('Customers');
  const customers = await req('GET', '/api/admin/customers', { token: adminToken });
  ok('GET /api/admin/customers', customers.status === 200 && customers.data.some(c => c.email === userEmail));

  section('Chatbot');
  const welcome = await req('GET', '/api/chat/welcome');
  ok('GET /api/chat/welcome', welcome.status === 200 && !!welcome.data.answer);
  const chat1 = await req('POST', '/api/chat', { body: { message: 'What is in the Lakshmi puja kit?' } });
  ok('chat answers puja-kit intent', chat1.status === 200 && chat1.data.intent === 'puja_kit' && chat1.data.reply.includes('899'), chat1.data);
  const chat2 = await req('POST', '/api/chat', { body: { message: 'how can I track my order' } });
  ok('chat answers tracking intent', chat2.status === 200 && chat2.data.intent === 'track');
  const chat3 = await req('POST', '/api/chat', { body: { message: 'do you offer cash on delivery' } });
  ok('chat answers payment/COD intent', chat3.status === 200 && chat3.data.intent === 'payment');
  const chat4 = await req('POST', '/api/chat', { body: { message: 'xyzzy nonsense question' } });
  ok('chat fallback for unknown', chat4.status === 200 && chat4.data.intent === 'fallback');
  const chatBad = await req('POST', '/api/chat', { body: { message: '' } });
  ok('empty chat message -> 400', chatBad.status === 400);

  section('Content pages');
  const terms = await req('GET', '/api/content/terms');
  ok('GET /api/content/terms', terms.status === 200 && terms.data.sections.length >= 10);
  const privacy = await req('GET', '/api/content/privacy');
  ok('GET /api/content/privacy', privacy.status === 200 && privacy.data.sections.length >= 6);
  const about = await req('GET', '/api/content/about');
  ok('GET /api/content/about', about.status === 200 && about.data.body.length >= 3);
  const contact = await req('GET', '/api/content/contact');
  ok('GET /api/content/contact', contact.status === 200 && !!contact.data.email);
  const postContact = await req('POST', '/api/content/contact', { body: { name: 'Ramesh', email: 'r@x.com', message: 'Need bulk kit quote' } });
  ok('POST /api/content/contact', postContact.status === 201 && postContact.data.ok);

  const adminMessages = await req('GET', '/api/admin/messages', { token: adminToken });
  ok('admin sees customer messages', adminMessages.status === 200 && adminMessages.data.length >= 1, adminMessages.data && adminMessages.data.length);
  const firstMsg = adminMessages.data[0];
  ok('new message starts unread', firstMsg.read === false);
  const readMsg = await req('PATCH', `/api/admin/messages/${firstMsg.id}/read`, { token: adminToken, body: { read: true } });
  ok('admin marks message read', readMsg.status === 200 && readMsg.data.read === true);
  const userMessages = await req('GET', '/api/admin/messages', { token: userToken });
  ok('user cannot read admin messages -> 403', userMessages.status === 403);

  const orderNoteSearch = await req('GET', '/api/admin/orders?q=DM', { token: adminToken });
  ok('admin order search by query', orderNoteSearch.status === 200 && orderNoteSearch.data.length >= 2, orderNoteSearch.data && orderNoteSearch.data.length);

  section('Banners / carousel');
  const bannersPub = await req('GET', '/api/banners');
  ok('GET /api/banners public', bannersPub.status === 200 && bannersPub.data.length === 3, bannersPub.data.length);

  const bannersAdmin = await req('GET', '/api/admin/banners', { token: adminToken });
  ok('GET /api/admin/banners', bannersAdmin.status === 200 && bannersAdmin.data.length === 3);

  const newBanner = await req('POST', '/api/admin/banners', { token: adminToken, body: { title: 'Flash Sale', subtitle: '48 hours only', image_url: 'https://example.com/b.jpg', link: '/shop' } });
  ok('POST /api/admin/banners', newBanner.status === 201 && newBanner.data.banner.id, newBanner.data);
  const bId = newBanner.data.banner.id;

  const patchBanner = await req('PATCH', `/api/admin/banners/${bId}`, { token: adminToken, body: { title: 'Mega Sale', active: 1 } });
  ok('PATCH /api/admin/banners/:id', patchBanner.status === 200 && patchBanner.data.banner.title === 'Mega Sale');

  const dltBanner = await req('DELETE', `/api/admin/banners/${bId}`, { token: adminToken });
  ok('DELETE /api/admin/banners/:id', dltBanner.status === 200);

  const bannerUserNoAuth = await req('POST', '/api/admin/banners', { token: userToken, body: { title: 'x', image_url: 'https://e.com/i.jpg' } });
  ok('user cannot manage banners -> 403', bannerUserNoAuth.status === 403);

  section('Login logs');
  const loginLogs = await req('GET', '/api/admin/login-logs', { token: adminToken });
  ok('GET /api/admin/login-logs', loginLogs.status === 200 && loginLogs.data.length >= 6, loginLogs.data.length);
  ok('login logs include signup/login/admin entries', loginLogs.data.some(l => l.success === 1) && loginLogs.data.some(l => l.success === 0) && loginLogs.data.some(l => l.role === 'admin'));
  ok('login log has ip + user_agent + portal', !!loginLogs.data[0].ip && !!loginLogs.data[0].user_agent && ['user', 'admin'].includes(loginLogs.data[0].portal));

  const logsNoAuth = await req('GET', '/api/admin/login-logs', { token: userToken });
  ok('user cannot read login logs -> 403', logsNoAuth.status === 403);

  section('Payment gateway meta');
  const gw = await req('GET', '/api/payment/gateway', { token: userToken });
  ok('GET /api/payment/gateway', gw.status === 200 && ['razorpay', 'demo'].includes(gw.data.mode), gw.data);

  section('Cart clear / product delete');
  const clear = await req('DELETE', '/api/cart', { token: userToken });
  ok('DELETE /api/cart clears', clear.status === 200);
  const cartEmpty = await req('GET', '/api/cart', { token: userToken });
  ok('cart empty after clear', cartEmpty.data.items.length === 0);

  sock.close();
  server.kill();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`DevaMart API test result: ${pass} passed, ${fail} failed`);
  if (failures.length) console.log('Failures:\n - ' + failures.join('\n - '));
  console.log('='.repeat(50));
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(TEST_DB + suffix); } catch (e) {}
  }
  process.exit(fail ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });