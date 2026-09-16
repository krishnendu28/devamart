import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import Icon from '../components/Icons';

const emptyAddress = { name: '', phone: '', line: '', city: '', state: '', pincode: '' };

export default function Checkout() {
  const { cart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ ...emptyAddress, name: user?.name || '', phone: user?.phone || '' });
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState('');

  const shipping = cart.total >= 499 ? 0 : 49;
  const grand = cart.total + shipping;

  function set(field, value) { setAddress(a => ({ ...a, [field]: value })); }

  async function placeOrder() {
    setErr('');
    if (!cart.items.length) return navigate('/shop');
    if (!address.name || !address.phone || !address.line || !address.city || !address.state || !/^\d{6}$/.test(address.pincode)) {
      setErr('Please fill the complete delivery address with a valid 6-digit pincode.');
      return;
    }
    setPlacing(true);
    try {
      const d = await api('/api/orders', { method: 'POST', body: { address, paymentMethod } });
      toast(`Order ${d.order.order_no} placed!`);
      if (paymentMethod === 'online') {
        navigate(`/payment/${d.order.id}`);
      } else {
        navigate(`/track?order=${d.order.order_no}&new=1`);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setPlacing(false);
    }
  }

  if (!cart.items.length) {
    return <div className="container page"><div className="empty"><div className="big"><Icon name="cart" size={52} /></div><h2>Nothing to checkout</h2><button className="btn mt" onClick={() => navigate('/shop')}>Shop Now</button></div></div>;
  }

  return (
    <div className="container page" style={{ maxWidth: 980 }}>
      <div className="section-title"><h2>Checkout</h2></div>
      <div className="cart-layout">
        <div className="prose" style={{ padding: 22 }}>
          <h3 style={{ marginTop: 0 }}><Icon name="pin" size={18} /> Delivery Address</h3>
          <div className="field-row">
            <div className="field"><label>Full Name</label><input value={address.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ramesh Kumar" /></div>
            <div className="field"><label>Mobile Number</label><input value={address.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile" maxLength={10} /></div>
          </div>
          <div className="field"><label>Address (House / Flat, Street, Area — one line)</label><input value={address.line} onChange={e => set('line', e.target.value)} placeholder="Flat 12, Temple Street, Near Shani Mandir" /></div>
          <div className="field-row">
            <div className="field"><label>City</label><input value={address.city} onChange={e => set('city', e.target.value)} placeholder="Bengaluru" /></div>
            <div className="field"><label>State</label><input value={address.state} onChange={e => set('state', e.target.value)} placeholder="Karnataka" /></div>
          </div>
          <div className="field" style={{ maxWidth: 220 }}><label>PIN Code</label><input value={address.pincode} onChange={e => set('pincode', e.target.value)} placeholder="560001" maxLength={6} /></div>

          <h3><Icon name="card" size={18} /> Payment Method</h3>
          <div className="gateways" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: 420 }}>
            <div className={`gateway ${paymentMethod === 'online' ? 'active' : ''}`} onClick={() => setPaymentMethod('online')}>
              <span className="g-ic"><Icon name="phone" size={18} /></span>
              <span><b>Online (UPI)</b><br /><span className="small muted">GPay · PhonePe · Paytm</span></span>
            </div>
            <div className={`gateway ${paymentMethod === 'cod' ? 'active' : ''}`} onClick={() => setPaymentMethod('cod')}>
              <span className="g-ic"><Icon name="banknote" size={18} /></span>
              <span><b>Cash on Delivery</b><br /><span className="small muted">Pay when delivered</span></span>
            </div>
          </div>
          <div className="alert info small" style={{ fontSize: '.82rem' }}>
            {paymentMethod === 'online' ? 'You will be taken to a secure UPI payment screen after placing the order.' : 'Please keep the exact amount ready; change may not always be available.'}
          </div>
        </div>

        <aside className="summary">
          <h3 style={{ color: 'var(--red-dark)', marginBottom: 6 }}>Your Order</h3>
          {cart.items.map(it => (
            <div className="row sub" key={it.id} style={{ justifyContent: 'space-between', fontSize: '.85rem' }}>
              <span>{it.qty} × {it.name.slice(0, 26)}{it.name.length > 26 ? '…' : ''}</span>
              <span>{money(it.line_total)}</span>
            </div>
          ))}
          <div className="row sub"><span>Subtotal</span><span>{money(cart.total)}</span></div>
          <div className="row sub"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : money(shipping)}</span></div>
          <div className="row total"><span>Total to Pay</span><span>{money(grand)}</span></div>
          {err && <div className="alert err">{err}</div>}
          <button className="btn block mt" disabled={placing} onClick={placeOrder}>
            {placing ? <><span className="spinner" /> Placing order…</> : `Place Order · ${money(grand)}`}
          </button>
          <div className="small muted center mt" style={{ fontSize: '.78rem' }}><Icon name="lock" size={13} /> Your payment details are secured. Address is used only for delivery.</div>
        </aside>
      </div>
    </div>
  );
}