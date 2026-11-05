import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const HIDE_ON = ['/cart', '/checkout', '/payment'];

/** Persistent cart button (bottom-left) so the cart is one tap away everywhere. */
export default function FloatingCart() {
  const { cart } = useCart();
  const { pathname } = useLocation();
  if (HIDE_ON.some(p => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <Link to="/cart" className="cart-fab" aria-label={`Cart with ${cart.count} items`}>
      <span className="cart-fab-emoji" aria-hidden="true">🛒</span>
      <span className="cart-fab-text">
        <b>My Cart</b>
        <small>{cart.count ? `${cart.count} item${cart.count === 1 ? '' : 's'}` : 'Empty'}</small>
      </span>
      {cart.count > 0 && <span className="cart-fab-count">{cart.count > 99 ? '99+' : cart.count}</span>}
    </Link>
  );
}
