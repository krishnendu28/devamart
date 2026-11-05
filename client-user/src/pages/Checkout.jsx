import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import CitySelect from '../components/CitySelect';
import { getSavedCity, saveCity } from '../data/cityPref';
import { stateForCity } from '../data/cities';
import Icon from '../components/Icons';

const emptyAddress = { name: '', phone: '', line: '', line2: '', city: '', state: '', pincode: '' };
const ADDRESS_KEY = 'dm_checkout_address';

function savedAddress() {
  try { return JSON.parse(localStorage.getItem(ADDRESS_KEY) || 'null'); } catch (e) { return null; }
}

const PAY_OPTIONS = [
  { key: 'cod', label: 'Cash on Delivery', sub: 'Pay when it arrives', ic: 'banknote', method: 'cod' },
  { key: 'gpay', label: 'Google Pay', sub: 'UPI · GPay', ic: 'phone', method: 'online', badge: 'GPay' },
  { key: 'phonepe', label: 'PhonePe', sub: 'UPI · PhonePe', ic: 'phone', method: 'online', badge: 'Pe' },
  { key: 'upi', label: 'Other UPI App', sub: 'Paytm · BHIM · any UPI', ic: 'send', method: 'online', badge: 'UPI' },
];

export default function Checkout() {
  const { cart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const memory = savedAddress();
  const [address, setAddress] = useState({
    ...emptyAddress,
    name: memory?.name || user?.name || '',
    phone: memory?.phone || user?.phone || '',
    line: memory?.line || '',
    line2: memory?.line2 || '',
    city: memory?.city || user?.city || getSavedCity() || '',
    state: memory?.state || stateForCity(memory?.city || user?.city || getSavedCity() || '') || '',
    pincode: memory?.pincode || '',
  });
  const [pay, setPay] = useState('cod');
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState([]);
  const [saveForLater, setSaveForLater] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const paymentMethod = PAY_OPTIONS.find(p => p.key === pay)?.method || 'cod';
  const shipping = cart.total >= 499 ? 0 : 49;
  const grand = cart.total + shipping;

  useEffect(() => {
    api('/api/addresses').then(setSaved).catch(() => {});
  }, []);

  function set(field, value) { setAddress(a => ({ ...a, [field]: value })); }

  function setCity(city, state) {
    setAddress(a => ({ ...a, city, state: state === undefined ? a.state : state }));
    setSelectedId(null);
  }

  function useSaved(a) {
    setSelectedId(a.id);
    setAddress({
      name: a.name, phone: a.phone, line: a.line, line2: a.line2 || '',
      city: a.city, state: a.state, pincode: a.pincode,
    });
    saveCity(a.city);
    toast(`Using ${a.label || 'saved'} address`);
  }

  async function removeSaved(a) {
    try {
      await api(`/api/addresses/${a.id}`, { method: 'DELETE' });
      setSaved(list => list.filter(x => x.id !== a.id));
      if (selectedId === a.id) setSelectedId(null);
      toast('Address removed');
    } catch (e) { toast(e.message); }
  }

  async function placeOrder() {
    setErr('');
    if (!cart.items.length) return navigate('/shop');
    if (!address.name || !address.phone || !address.line || !address.city || !address.state || !/^\d{6}$/.test(address.pincode)) {
      setErr('Please fill the complete delivery address with a valid 6-digit pincode.');
      return;
    }
    setPlacing(true);
    try {
      // Save the address (and remember the city) before placing so the customer
      // can reuse it next time. Failures here must never block checkout.
      saveCity(address.city);
      try { localStorage.setItem(ADDRESS_KEY, JSON.stringify(address)); } catch (e) { /* ignore */ }
      if (saveForLater && !selectedId) {
        try {
          const d = await api('/api/addresses', { method: 'POST', body: { ...address, label: 'Home' } });
          if (d && d.address) setSelectedId(d.address.id);
        } catch (e) { /* non-critical */ }
      }

      const d = await api('/api/orders', { method: 'POST', body: { address, paymentMethod, upiApp: pay === 'cod' ? undefined : pay, note } });
      toast(`Order ${d.order.order_no} placed!`);
      if (paymentMethod === 'online') {
        navigate(`/payment/${d.order.id}?app=${encodeURIComponent(pay)}`);
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
          {saved.length > 0 && (
            <div className="saved-block">
              <h3 style={{ marginTop: 0 }}><Icon name="pin" size={18} /> Saved Addresses</h3>
              <div className="saved-grid">
                {saved.map(a => (
                  <div key={a.id} className={`saved-card ${selectedId === a.id ? 'on' : ''}`}>
                    <button type="button" className="saved-pick" onClick={() => useSaved(a)}>
                      <b>{a.label || 'Home'} · {a.name}</b>
                      <span>{a.line}{a.line2 ? `, ${a.line2}` : ''}</span>
                      <span>{a.city}, {a.state} — {a.pincode}</span>
                      <span className="small muted">{a.phone}</span>
                    </button>
                    <button type="button" className="saved-del" title="Delete address" onClick={() => removeSaved(a)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 style={{ marginTop: saved.length ? 18 : 0 }}><Icon name="pin" size={18} /> Delivery Address</h3>
          <div className="field-row">
            <div className="field"><label>Full Name</label><input value={address.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ramesh Kumar" autoComplete="name" /></div>
            <div className="field"><label>Mobile Number</label><input value={address.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile" inputMode="numeric" maxLength={10} autoComplete="tel" /></div>
          </div>
          <div className="field"><label>Address line 1 <span className="small muted">(house / flat, street, area)</span></label><input value={address.line} onChange={e => set('line', e.target.value)} placeholder="Flat 12, Temple Street, Near Shani Mandir" autoComplete="address-line1" /></div>
          <div className="field"><label>Address line 2 <span className="small muted">(optional — landmark, apartment, floor)</span></label><input value={address.line2} onChange={e => set('line2', e.target.value)} placeholder="Near Ganesh Temple, 2nd floor" autoComplete="address-line2" /></div>
          <div className="field-row">
            <div className="field">
              <label>City</label>
              <CitySelect value={address.city} onChange={setCity} required id="checkout-city" />
            </div>
            <div className="field"><label>State</label><input value={address.state} onChange={e => set('state', e.target.value)} placeholder="Karnataka" autoComplete="address-level1" /></div>
          </div>
          <div className="field" style={{ maxWidth: 220 }}><label>PIN Code</label><input value={address.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))} placeholder="560001" inputMode="numeric" maxLength={6} autoComplete="postal-code" /></div>

          <label className="save-address-toggle">
            <input type="checkbox" checked={saveForLater} onChange={e => setSaveForLater(e.target.checked)} />
            <span><Icon name="check" size={15} /> Save this address for faster checkout next time</span>
          </label>

          <h3><Icon name="card" size={18} /> Payment Method</h3>
          <div className="gateways" style={{ maxWidth: 520 }}>
            {PAY_OPTIONS.map(o => (
              <div key={o.key} className={`gateway ${pay === o.key ? 'active' : ''}`} onClick={() => setPay(o.key)}>
                <span className="g-ic">{o.badge ? <b style={{ fontSize: 12, letterSpacing: '.4px' }}>{o.badge}</b> : <Icon name={o.ic} size={18} />}</span>
                <span><b>{o.label}</b><br /><span className="small muted">{o.sub}</span></span>
              </div>
            ))}
          </div>
          <div className="alert info small" style={{ fontSize: '.82rem' }}>
            {paymentMethod === 'online'
              ? <>You will be taken to a secure UPI payment screen after placing the order. <b>{PAY_OPTIONS.find(p => p.key === pay)?.label}</b> is selected.</>
              : 'Please keep the exact amount ready; change may not always be available.'}
          </div>

          <h3><Icon name="chat" size={18} /> Message for your order <span className="small muted">(optional)</span></h3>
          <div className="field">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Delivery instructions, preferred delivery time, gift note or anything the store should know…"
            />
            <div className="small muted" style={{ marginTop: 4, fontSize: '.76rem' }}>{note.length}/500 — our team reads every message before dispatching.</div>
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
