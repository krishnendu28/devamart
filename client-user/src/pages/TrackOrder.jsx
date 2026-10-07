import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, money } from '../api';
import { connectSocket } from '../api';
import { getToken } from '../api';
import Icon from '../components/Icons';

const STEPS = [
  { key: 'placed', label: 'Order Placed', icon: 'doc' },
  { key: 'packed', label: 'Packed', icon: 'box' },
  { key: 'ready', label: 'Ready for Dispatch', icon: 'send' },
  { key: 'shipped', label: 'Shipped', icon: 'truck' },
  { key: 'on_the_way', label: 'On The Way', icon: 'pin' },
  { key: 'delivered', label: 'Delivered', icon: 'check' },
];

export default function TrackOrder() {
  const [params] = useSearchParams();
  const [orderNo, setOrderNo] = useState(params.get('order') || '');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const firstRun = useRef(true);

  async function track(no) {
    const num = (no ?? orderNo).trim();
    if (!num) { setErr('Please enter your order number (starts with DM).'); return; }
    setErr(''); setLoading(true); setLive(false);
    try {
      const d = await api(`/api/orders/track/${encodeURIComponent(num)}`, { auth: false });
      setData(d); setOrderNo(num);
    } catch (e) { setData(null); setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const initial = params.get('order');
    if (initial && firstRun.current) {
      firstRun.current = false;
      setOrderNo(initial);
      track(initial);
    }
  }, []);

  useEffect(() => {
    if (!data || data.status === 'delivered' || data.status === 'cancelled') return;
    setLive(true);
    const socket = connectSocket(getToken());
    socket.on('order:updated', (o) => {
      if (o.order_no === data.order_no) {
        setData(d => ({ ...d, status: o.status, status_label: o.status_label, updated_at: o.updated_at,
          progress: d.progress.map(p => {
            const order = ['placed', 'packed', 'ready', 'shipped', 'on_the_way', 'delivered'];
            return { ...p, reached: order.indexOf(p.status) <= order.indexOf(o.status) };
          }),
        }));
      }
    });
    return () => socket.close();
  }, [data?.order_no]);

  const stepIndex = STEPS.findIndex(s => s.key === data?.status);

  return (
    <div className="container page">
      <div className="section-title"><h2>Track Your Order</h2><span className="sub">Live status: Packed → Ready for Dispatch → Shipped → On The Way → Delivered</span></div>
      <div className="track-wrap">
        <div className="prose" style={{ padding: 20 }}>
          <div className="row">
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <input className="input" placeholder="Enter order number, e.g. DM260917123456" value={orderNo}
                onChange={e => setOrderNo(e.target.value)} onKeyDown={e => e.key === 'Enter' && track()} />
            </div>
            <button className="btn" disabled={loading} onClick={() => track()}>{loading ? 'Searching…' : 'Track'}</button>
          </div>
          {err && <div className="alert err mt">{err}</div>}

          {data && (
            <>
              <div className="row between wrap mt" style={{ marginTop: 22 }}>
                <div>
                  <div className="small muted">Order Number</div>
                  <b style={{ color: 'var(--red-dark)', fontSize: '1.2rem' }}>#{data.order_no}</b>
                </div>
                <div>
                  <div className="small muted">Payment</div>
                  <b>{data.payment_method === 'cod' ? 'Cash on Delivery' : 'Online UPI'} · {data.payment_status === 'paid' ? 'Paid' : 'Pending'}</b>
                </div>
                <div>
                  <div className="small muted">Amount</div>
                  <b style={{ color: 'var(--red-dark)' }}>{money(data.total)}</b>
                </div>
              </div>
              {live && <div className="alert ok" style={{ fontSize: '.82rem', marginBottom: 0 }}><span className="live-dot" /> Live — this updates the moment the store updates your order.</div>}

              <ul className="timeline">
                {STEPS.map((s, i) => {
                  const done = data.status === 'cancelled' ? false : i <= stepIndex;
                  const cancelled = data.status === 'cancelled';
                  return (
                    <li key={s.key} className={done ? 'done' : ''}>
                      <span className="dot">{done ? <Icon name="check" size={16} /> : <Icon name={s.icon} size={16} />}</span>
                      <h4>{s.label}</h4>
                      <span className="when">
                        {cancelled && i === 0 ? 'Order cancelled' : done ? 'Completed' : 'Pending'}
                        {done && i === stepIndex && !cancelled ? ' · current status' : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {data.status === 'cancelled' && <div className="alert err">This order was cancelled.</div>}
              <div className="small muted">Last updated: {new Date((data.updated_at || data.placed_at) + 'Z').toLocaleString('en-IN')}</div>
              <Link to="/shop" className="btn ghost sm mt">Continue shopping</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}