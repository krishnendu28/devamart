import { useEffect, useState } from 'react';
import { api, money, time, toast, connectSocket } from '../api';

const STATUSES = ['placed', 'packed', 'shipped', 'on_the_way', 'delivered', 'cancelled'];
const STATUS_META = {
  placed: ['placed', 'Order Placed'], packed: ['packed', 'Packed'], shipped: ['shipped', 'Shipped'],
  on_the_way: ['on_the_way', 'On The Way'], delivered: ['delivered', 'Delivered'], cancelled: ['cancelled', 'Cancelled'],
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const sp = new URLSearchParams();
    if (statusFilter) sp.set('status', statusFilter);
    if (payFilter) sp.set('payment', payFilter);
    const list = await api(`/api/admin/orders?${sp.toString()}`);
    setOrders(list);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, [statusFilter, payFilter]);

  useEffect(() => {
    const s = connectSocket();
    s.on('order:new', () => { load(); toast('New order placed!'); });
    s.on('order:updated', () => { load(); });
    return () => s.close();
  }, [statusFilter, payFilter]);

  async function setStatus(id, status) {
    const d = await api(`/api/admin/orders/${id}/status`, { method: 'PATCH', body: { status } });
    toast(`Order ${d.order.order_no} → ${status.replace('_', ' ')}`);
    load();
    if (selected && selected.id === id) setSelected({ ...selected, status: d.order.status, status_label: d.order.status_label });
  }
  async function markPaid(id) {
    await api(`/api/admin/orders/${id}/payment`, { method: 'PATCH', body: { paymentStatus: 'paid' } });
    toast('Payment collected ✅');
    load();
    if (selected && selected.id === id) setSelected(s => ({ ...s, payment_status: 'paid' }));
  }

  const filtered = search.trim()
    ? orders.filter(o => `${o.order_no} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(search.trim().toLowerCase()))
    : orders;

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search order #, customer, phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s][1]}</option>)}
        </select>
        <select value={payFilter} onChange={e => setPayFilter(e.target.value)}>
          <option value="">All payments</option>
          <option value="cod">COD</option>
          <option value="online">Online</option>
        </select>
        <b className="muted">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</b>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Order #</th><th>Customer</th><th>Address</th><th>Items</th><th>Payment</th><th>Status</th><th>Total</th><th>Placed</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9}><div className="loading">Loading…</div></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={9}><div className="empty">No orders to show.</div></td></tr>}
              {filtered.map(o => {
                const [cls, label] = STATUS_META[o.status] || ['placed', o.status];
                return (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(o)}>
                    <td><b>#{o.order_no}</b></td>
                    <td>{o.customer_name}<br /><span className="muted" style={{ fontSize: '.74rem' }}>{o.customer_phone}</span></td>
                    <td style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{o.address.line}, {o.address.city}<br />{o.address.state} {o.address.pincode}</td>
                    <td>
                      <div className="mini-thumbs" title={o.items.map(i => `${i.name} ×${i.qty}`).join(', ')}>
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
                    <td>
                      <select
                        value={o.status}
                        style={{ fontSize: '.76rem', padding: '5px 7px' }}
                        onClick={e => e.stopPropagation()}
                        onChange={e => setStatus(o.id, e.target.value)}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s][1]}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-bg" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="btn ghost sm close" onClick={() => setSelected(null)}>✕ Close</button>
            <h3>Order #{selected.order_no}</h3>
            <div className="alert info small" style={{ fontSize: '.8rem' }}>
              <b>{selected.customer_name}</b> · {selected.customer_email} · {selected.customer_phone}
            </div>

            <div className="f-row mt">
              <div>
                <div className="field"><label>Deliver to</label>
                  <div style={{ fontSize: '.86rem' }}>{selected.address.line}<br />{selected.address.city}, {selected.address.state} — {selected.address.pincode}</div>
                </div>
              </div>
              <div>
                <div className="field"><label>Payment & status</label>
                  <div style={{ fontSize: '.86rem' }}>
                    <span className={`pill ${selected.payment_method === 'cod' ? 'placed' : 'packed'}`}>{selected.payment_method === 'cod' ? 'Cash on Delivery' : 'Online UPI'}</span>
                    <span className={`pill ${selected.payment_status === 'paid' ? 'paid' : 'pending'}`} style={{ marginLeft: 6 }}>{selected.payment_status === 'paid' ? 'Paid' : 'Payment pending'}</span>
                    <div style={{ marginTop: 6 }}>
                      <select value={selected.status} onChange={e => setStatus(selected.id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s][1]}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="field"><label>Items</label>
              {selected.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
                  <img src={it.image} className="thumb" alt="" />
                  <span style={{ flex: 1 }}>{it.name}</span>
                  <span className="muted">{it.qty} × {money(it.price)}</span>
                  <b>{money(it.qty * it.price)}</b>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span>Subtotal</span><b>{money(selected.subtotal)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping</span><b>{selected.shipping === 0 ? 'FREE' : money(selected.shipping)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', color: 'var(--red-dark)', borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 8 }}>
                <b>Total</b><b>{money(selected.total)}</b>
              </div>
            </div>

            <div className="row" style={{ gap: 10 }}>
              {selected.payment_method === 'cod' && selected.payment_status !== 'paid' && (
                <button className="btn gold" onClick={() => markPaid(selected.id)}>Mark COD collected</button>
              )}
              <button className="btn ghost" onClick={() => { setSelected(null); window.open(`/api/orders/track/${selected.order_no}`, '_blank'); }}>🔗 Tracking link</button>
            </div>
            <div className="muted small" style={{ marginTop: 12 }}>Placed {time(selected.placed_at)} · Last updated {time(selected.updated_at)}</div>
          </div>
        </div>
      )}
    </>
  );
}