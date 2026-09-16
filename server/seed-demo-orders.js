/*
 * Seeds a handful of realistic DEMO orders (past 7 days) so the admin
 * dashboard, revenue chart and order list look alive immediately.
 * Run: node seed-demo-orders.js
 */
const db = require('./src/db');

function no(i) { return `DM${((new Date() - i * 86400000) % 52) > 25 ? '1' : '2'}0${String(i).padStart(2, '0')}${String(Math.floor(100000 + Math.random() * 900000))}`; }

const PRODUCTS = db.prepare('SELECT * FROM products').all();
const USER = db.prepare("SELECT id FROM users WHERE role='user' LIMIT 1").get();
if (!USER) { console.log('No demo user — run seed.js first.'); process.exit(1); }

const pick = (min, max) => { const arr = PRODUCTS.filter(p => p.price >= min && p.price <= max).slice(0, 6); const n = 1 + Math.floor(Math.random() * 3); const items = []; for (let i = 0; i < n; i++) { const p = arr[Math.floor(Math.random() * arr.length)]; items.push({ product_id: p.id, name: p.name, price: p.price, qty: 1 + Math.floor(Math.random() * 2), image: p.image || `/images/placeholder/${p.id}.svg`, category: 'demo' }); } return items; };
const names = ['Amit Sharma', 'Priya Iyer', 'Ramesh Gupta', 'Sunita Devi', 'Vikram Singh', 'Anita Rao', 'Kunal Das'];
const states = ['Karnataka', 'Maharashtra', 'Delhi', 'West Bengal', 'Uttar Pradesh', 'Tamil Nadu'];
const cities = ['Bengaluru', 'Mumbai', 'Delhi', 'Kolkata', 'Lucknow', 'Chennai'];
const statuses = ['placed', 'packed', 'shipped', 'on_the_way', 'delivered', 'delivered', 'delivered'];
const meth = ['online', 'online', 'cod', 'online', 'cod', 'online', 'cod'];

function daysAgoISO(days, hour) {
  const d = new Date(); d.setDate(d.getDate() - days); d.setHours(hour, 15 + Math.floor(Math.random() * 44), 0, 0);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

if (db.prepare('SELECT COUNT(*) c FROM orders').get().c === 0 && process.argv[2] !== '--force') {
  const ins = db.prepare(`
    INSERT INTO orders (order_no, user_id, items, subtotal, shipping, total, address, payment_method, payment_status, status, placed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insPay = db.prepare(`INSERT INTO payments (order_id, amount, method, gateway, status, created_at, paid_at) VALUES (?,?,?,?,?,?,?)`);

  for (let i = 0; i < 7; i++) {
    const items = pick(49, 2199);
    const subtotal = +items.reduce((s, x) => s + x.price * x.qty, 0).toFixed(2);
    const shipping = subtotal >= 499 ? 0 : 49;
    const total = +(subtotal + shipping).toFixed(2);
    const m = meth[i] || 'online';
    const st = statuses[i] || 'placed';
    const paid = m === 'online' && st !== 'cancelled' ? 'paid' : (m === 'cod' && st === 'delivered' ? 'paid' : 'pending');
    const addr = { name: names[i % names.length], phone: '9' + String(7 + i) + String(10000000 + i * 1111111), line1: `${i + 2} Temple Avenue`, line2: 'Near Hanuman Mandir', city: cities[i % cities.length], state: states[i % states.length], pincode: String(110000 + i * 137) };
    const placedAt = daysAgoISO(i, 9 + (i % 9));
    const updatedAt = st === 'delivered' ? daysAgoISO(i, 17) : placedAt;

    const info = ins.run(no(i), USER.id, JSON.stringify(items), subtotal, shipping, total, JSON.stringify(addr), m, paid, st, placedAt, updatedAt);
    if (m === 'online' && paid === 'paid') {
      insPay.run(info.lastInsertRowid, total, 'upi', i % 2 ? 'gpay' : 'phonepe', 'paid', placedAt, updatedAt);
    } else if (m === 'cod' && paid === 'paid') {
      insPay.run(info.lastInsertRowid, total, 'cod', 'cash', 'paid', placedAt, updatedAt);
    }
  }
  console.log('Demo orders seeded: 7 orders across the last week.');
} else {
  console.log('Orders already exist — run with --force to duplicate demo orders.');
}