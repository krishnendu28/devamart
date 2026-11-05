const db = require('./db');

// DevaMart operates on IST. SQLite stores placed_at in UTC (datetime('now')),
// so every day/month comparison shifts by +330 minutes before grouping.
const IST = '+330 minutes';

function todayIST() {
  // en-CA gives YYYY-MM-DD, which sorts and compares cleanly.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function liveTotals(day = todayIST()) {
  const month = day.slice(0, 7);
  const one = (sql, ...params) => db.prepare(sql).get(...params).v;

  const revenueToday = one(
    `SELECT COALESCE(SUM(total),0) v FROM orders
     WHERE date(placed_at, ?) = ? AND status != 'cancelled'`, IST, day);
  const revenueMonth = one(
    `SELECT COALESCE(SUM(total),0) v FROM orders
     WHERE strftime('%Y-%m', placed_at, ?) = ? AND status != 'cancelled'`, IST, month);
  const totalRevenue = one(
    `SELECT COALESCE(SUM(total),0) v FROM orders WHERE status != 'cancelled'`);
  const totalSales = one(
    `SELECT COALESCE(SUM(total),0) v FROM orders WHERE status != 'cancelled' AND payment_status='paid'`);
  const codOutstanding = one(
    `SELECT COALESCE(SUM(total),0) v FROM orders
     WHERE status != 'cancelled' AND payment_method='cod' AND payment_status='pending'`);
  const todayOrders = db.prepare(
    `SELECT COUNT(*) c FROM orders WHERE date(placed_at, ?) = ?`).get(IST, day).c;
  const monthOrders = db.prepare(
    `SELECT COUNT(*) c FROM orders WHERE strftime('%Y-%m', placed_at, ?) = ?`).get(IST, month).c;

  return {
    revenue_today: revenueToday,
    revenue_month: revenueMonth,
    total_revenue: totalRevenue,
    total_sales: totalSales,
    cod_outstanding: codOutstanding,
    today_orders: todayOrders,
    month_orders: monthOrders,
  };
}

/**
 * Return the locked figures for today. The first call of the day creates the
 * row; afterwards the row is only recomputed when an order changes (so a plain
 * page refresh never moves the numbers). A new row is created after midnight IST.
 */
function getDailyTotals({ force = false } = {}) {
  const day = todayIST();
  let row = db.prepare('SELECT * FROM daily_totals WHERE day=?').get(day);

  if (!row || force) {
    const t = liveTotals(day);
    if (row) {
      db.prepare(`UPDATE daily_totals SET revenue_today=?, revenue_month=?, total_revenue=?,
        total_sales=?, cod_outstanding=?, today_orders=?, month_orders=?, computed_at=datetime('now')
        WHERE day=?`).run(t.revenue_today, t.revenue_month, t.total_revenue, t.total_sales,
        t.cod_outstanding, t.today_orders, t.month_orders, day);
    } else {
      db.prepare(`INSERT INTO daily_totals (day, revenue_today, revenue_month, total_revenue,
        total_sales, cod_outstanding, today_orders, month_orders) VALUES (?,?,?,?,?,?,?,?)`)
        .run(day, t.revenue_today, t.revenue_month, t.total_revenue, t.total_sales,
          t.cod_outstanding, t.today_orders, t.month_orders);
    }
    row = db.prepare('SELECT * FROM daily_totals WHERE day=?').get(day);
  }

  return {
    ...row,
    locked_day: row.day,
    locked_at: row.computed_at,
    live: liveTotals(day),
  };
}

function refreshDailyTotals() {
  return getDailyTotals({ force: true });
}

module.exports = { todayIST, liveTotals, getDailyTotals, refreshDailyTotals };
