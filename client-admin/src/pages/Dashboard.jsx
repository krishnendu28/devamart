import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money, time, toast, connectSocket } from '../api';
import Icon from '../components/Icons';

const STATUS_META = {
  placed: ['placed', 'Order Placed'], packed: ['packed', 'Packed'], shipped: ['shipped', 'Shipped'],
  on_the_way: ['on_the_way', 'On The Way'], delivered: ['delivered', 'Delivered'], cancelled: ['cancelled', 'Cancelled'],
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [live, setLive] = useState(null); // latest realtime order value + which order
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function refresh() {
    try {
      const [s, o] = await Promise.all([api('/api/admin/stats'), api('/api/admin/orders')]);
      setStats(s); setOrders(o.slice(0, 8));
    } catch (e) { /* token expiry handled by redirect */ }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); const t = setInterval(refresh, 30000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const s = connectSocket();
    const live = (o) => {
      setLive({ order: o, at: Date.now() });
      setOrders(prev => [o, ...prev.filter(x => x.id !== o.id)].slice(0, 8));
      refresh();
      toast(`New order ${o.order_no} · ${money(o.total)}`);
    };
    s.on('order:new', live);
    s.on('order:updated', () => { refresh(); });
    s.on('payment:confirmed', (p) => { if (p) toast(`Payment confirmed ${money(p.amount)} · ${p.order_no}`); refresh(); });
    return () => s.close();
  }, []);

  if (loading && !stats) return <div className="loading">Loading dashboard…</div>;

  const cards = [
    { lbl: 'Revenue Today', val: money(stats.revenue_today), ic: 'banknote', cls: 'red', tip: 'Paid orders today' },
    { lbl: 'Total Sales', val: money(stats.total_sales), ic: 'gem', cls: 'gold', tip: 'All time paid revenue' },
    { lbl: 'Pending Orders', val: stats.pending_orders, ic: 'clock', cls: 'blue', tip: 'Placed → On The Way' },
    { lbl: 'Total Orders', val: stats.total_orders, ic: 'cart', cls: 'green', tip: 'Including COD & online' },
  ];

  return (
    <>
      <div className={`live-strip ${live ? 'show' : ''}`} key={live?.at}>
        <span className="icon"><Icon name="bolt" size={18} /></span>
        <span className="txt">
          <b>Realtime order value:</b>
          {live ? (
            <> Order <b className="ono">#{live.order.order_no}</b> from <b>{live.order.customer_name}</b> — <b className="amt">{money(live.order.total)}</b>
              <span className="muted" style={{ fontSize: '.78rem' }}> · {live.order.payment_method === 'cod' ? 'COD' : 'UPI'} · {time(live.order.placed_at)}</span></>
          ) : (
            <> Live feed connects automatically — new orders &amp; payment confirmations appear here instantly.</>
          )}
        </span>
        <a className="btn sm ghost" href="/orders" style={{ marginLeft: 'auto' }}>View Orders</a>
      </div>

      <div className="cards">
        {cards.map(c => (
          <div className="card" key={c.lbl} title={c.tip}>
            <span className={`ic ${c.cls}`}><Icon name={c.ic} size={22} /></span>
            <span><span className="val">{c.val}</span><span className="lbl" style={{ display: 'block' }}>{c.lbl}</span></span>
          </div>
        ))}
      </div>

      <div className="cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { lbl: "Today's Orders", val: stats.today_orders, ic: 'clock' },
          { lbl: 'COD Outstanding', val: money(stats.cod_outstanding), ic: 'banknote' },
          { lbl: 'Customers', val: stats.total_users, ic: 'user' },
          { lbl: 'Products Live', val: stats.total_products, ic: 'bag' },
        ].map(c => (
          <div className="card" key={c.lbl}>
            <span className="ic gray"><Icon name={c.ic} size={22} /></span>
            <span><span className="val">{c.val}</span><span className="lbl" style={{ display: 'block' }}>{c.lbl}</span></span>
          </div>
        ))}
      </div>

      <div className="panel">
        <h3><Icon name="landmark" size={19} /> Revenue — last 7 days</h3>
        <div className="trend">
          {stats.trend.map(t => {
            const max = Math.max(...stats.trend.map(x => x.revenue), 1);
            return (
              <div className="bar-col" key={t.day}>
                <span className="amt">{t.revenue > 0 ? money(t.revenue) : ''}</span>
                <div className={`bar ${t.revenue > 0 ? '' : 'empty'}`} style={{ height: `${Math.max(4, (t.revenue / max) * 110)}px` }} />
                <span className="day">{new Date(t.day + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cards" style={{ gridTemplateColumns: '2fr 1.4fr' }}>
        <div className="panel">
          <h3><Icon name="box" size={19} /> Orders by status</h3>
          <div className="stat-row">
            {Object.entries(stats.by_status).map(([k, v]) => (
              <div className="stat" key={k}><b>{v}</b><span>{STATUS_META[k]?.[1] || k}</span></div>
            ))}
          </div>
          <div className="stat-row mt" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginTop: 12 }}>
            <div className="stat"><b>{stats.cod_orders}</b><span>COD orders</span></div>
            <div className="stat"><b>{stats.online_orders}</b><span>Online orders</span></div>
          </div>
        </div>
        <div className="panel">
          <h3><Icon name="bag" size={19} /> Products by category</h3>
          {stats.by_category.map(c => (
            <div key={c.slug} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 2px', borderBottom: '1px dashed var(--line)' }}>
              <span>{c.category}</span><b style={{ color: 'var(--red-dark)' }}>{c.products}</b>
            </div>
          ))}
          <button className="btn ghost sm mt" onClick={() => navigate('/products')}>Manage products →</button>
        </div>
      </div>

      <div className="panel">
        <h3><Icon name="box" size={19} /> Recent orders</h3>
        {orders.length === 0 ? (
          <div className="empty">No orders yet. New orders appear here instantly via WebSocket.</div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Status</th><th>Total</th><th>Time</th><th></th></tr></thead>
              <tbody>
                {orders.map(o => {
                  const [cls, label] = STATUS_META[o.status] || ['placed', o.status];
                  return (
                    <tr key={o.id}>
                      <td><b>#{o.order_no}</b></td>
                      <td>{o.customer_name}<br /><span className="muted" style={{ fontSize: '.74rem' }}>{o.customer_phone}</span></td>
                      <td>
                        <div className="mini-thumbs">
                          {o.items.slice(0, 3).map((it, i) => <img key={i} src={it.image} alt="" />)}
                        </div>
                      </td>
                      <td>
                        <span className={`pill ${o.payment_status === 'paid' ? 'paid' : 'pending'}`}>{o.payment_method === 'cod' ? 'COD' : 'UPI'}</span>
                        <div className="muted" style={{ fontSize: '.72rem' }}>{o.payment_status === 'paid' ? 'Paid' : 'Pending'}</div>
                      </td>
                      <td><span className={`pill ${cls}`}>{label}</span></td>
                      <td><b>{money(o.total)}</b></td>
                      <td className="muted" style={{ fontSize: '.76rem' }}>{time(o.placed_at)}</td>
                      <td><a className="btn sm ghost" href={`/orders`}>Open</a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}