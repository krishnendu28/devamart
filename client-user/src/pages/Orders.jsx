import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';
import { connectSocket } from '../api';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../api';
import Icon from '../components/Icons';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/orders').then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = connectSocket(getToken());
    socket.on('order:updated', (o) => {
      setOrders(list => list.map(x => x.id === o.id ? { ...x, ...o } : x));
    });
    return () => socket.close();
  }, []);

  const pills = {
    placed: ['placed', 'Order Placed'], packed: ['packed', 'Packed'], ready: ['ready', 'Ready for Dispatch'],
    shipped: ['shipped', 'Shipped'], on_the_way: ['on_the_way', 'On The Way'],
    delivered: ['delivered', 'Delivered'], cancelled: ['cancelled', 'Cancelled'],
  };

  return (
    <div className="container page">
      <div className="section-title"><h2>My Orders</h2><span className="sub">{orders.length} order{orders.length !== 1 ? 's' : ''} · live updates enabled</span></div>
      {loading ? (
        <div className="loading">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="empty">
          <div className="big"><Icon name="box" size={52} /></div>
          <h3>No orders yet</h3>
          <p>Your puja samagri is waiting. Place your first order!</p>
          <Link to="/shop" className="btn mt">Shop Now</Link>
        </div>
      ) : (
        orders.map(o => {
          const [cls, label] = pills[o.status] || ['placed', o.status_label];
          return (
            <div className="order-card" key={o.id}>
              <div className="top">
                <div>
                  <span className="ono">#{o.order_no}</span>
                  <span className="muted small"> · {new Date(o.placed_at + 'Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="row wrap">
                  <span className={`pill ${cls}`}>{label}</span>
                  <span className={`pill ${o.payment_status === 'paid' ? 'paid' : 'pending'}`}>{o.payment_method === 'cod' ? 'COD' : 'Online'} · {o.payment_status === 'paid' ? 'Paid' : o.payment_method === 'cod' ? 'Pay on delivery' : 'Pending'}</span>
                </div>
              </div>
              <div className="row between wrap">
                <div className="row mini-thumbs">
                  {o.items.slice(0, 4).map((it, i) => <img key={i} src={it.image} alt={it.name} title={it.name} />)}
                  {o.items.length > 4 && <span className="muted" style={{ fontStyle: 'italic' }}>+{o.items.length - 4} more</span>}
                </div>
                <div className="row">
                  <span className="muted small">{o.items.reduce((s, i) => s + i.qty, 0)} items</span>
                  <b style={{ color: 'var(--red-dark)' }}>{money(o.total)}</b>
                  <Link to={`/track?order=${o.order_no}`} className="btn ghost sm">Track</Link>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}