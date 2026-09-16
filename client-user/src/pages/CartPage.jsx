import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { money } from '../api';
import { toast } from '../components/Toast';
import Icon from '../components/Icons';

export default function CartPage() {
  const { cart, busy, update, remove } = useCart();
  const navigate = useNavigate();
  const shipping = cart.total >= 499 || cart.total === 0 ? 0 : 49;
  const grand = cart.total + shipping;

  async function handleUpdate(itemId, qty) {
    if (qty < 1) return;
    await update(itemId, qty);
  }

  if (cart.items.length === 0) {
    return (
      <div className="container page">
        <div className="empty">
          <div className="big"><Icon name="cart" size={52} /></div>
          <h2>Your cart is empty</h2>
          <p>Add puja kits, rudraksha or crystals to begin.</p>
          <Link to="/shop" className="btn mt">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="section-title"><h2>My Cart</h2><span className="sub">{cart.count} item{cart.count !== 1 ? 's' : ''}</span></div>
      <div className="cart-layout">
        <div>
          {cart.items.map(it => (
            <div className="line-item" key={it.id}>
              <img src={it.image} alt={it.name} />
              <div>
                <h4>{it.name}</h4>
                <span className="small muted">{money(it.price)} each</span>
                <div className="row mt" style={{ marginTop: 8 }}>
                  <div className="qty">
                    <button onClick={() => handleUpdate(it.id, it.qty - 1)}>−</button>
                    <span>{it.qty}</span>
                    <button onClick={() => handleUpdate(it.id, it.qty + 1)}>+</button>
                  </div>
                  <b style={{ color: 'var(--red-dark)' }}>{money(it.line_total)}</b>
                </div>
              </div>
              <button className="icon-btn" title="Remove" onClick={() => { remove(it.id); toast('Removed from cart'); }}>
                <Icon name="trash" size={18} />
              </button>
            </div>
          ))}
        </div>

        <aside className="summary">
          <h3 style={{ color: 'var(--red-dark)', marginBottom: 6 }}>Order Summary</h3>
          <div className="row sub"><span>Subtotal</span><span>{money(cart.total)}</span></div>
          <div className="row sub"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : money(shipping)}</span></div>
          <div className="row total"><span>Total</span><span>{money(grand)}</span></div>
          {shipping > 0 && <div className="alert info" style={{ fontSize: '.8rem', padding: '8px 10px' }}>Add {money(499 - cart.total)} more for FREE delivery</div>}
          <button className="btn block mt" disabled={busy} onClick={() => navigate('/checkout')}>Proceed to Checkout →</button>
          <Link to="/shop" className="btn ghost block mt" style={{ textAlign: 'center' }}>Continue Shopping</Link>
          <div className="small muted center mt" style={{ fontSize: '.78rem' }}><Icon name="card" size={14} /> COD · Google Pay · PhonePe · Paytm</div>
        </aside>
      </div>
    </div>
  );
}