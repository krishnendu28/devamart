import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import Icon from './Icons';

const NAV = [
  { to: '/', label: 'Explore', icon: 'compass', end: true },
  { to: '/shop', label: 'Shop All', icon: 'bag' },
  { to: '/favorites', label: 'My Favorites', icon: 'heart' },
  { to: '/track', label: 'Track Order', icon: 'truck' },
  { divider: true },
  { to: '/about', label: 'About Us', icon: 'lamp' },
  { to: '/contact', label: 'Contact Us', icon: 'mail' },
  { to: '/terms', label: 'Terms & Conditions', icon: 'doc' },
  { to: '/privacy', label: 'Privacy Policy', icon: 'lock' },
];

const TRUST = ['Authentic Puja Kits', 'Verified Rudraksha', 'Free delivery above ₹499', 'COD & UPI', 'Live tracking', 'Easy returns & replacement'];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { count } = useFavorites();
  const navigate = useNavigate();

  function submitSearch(e) {
    e.preventDefault();
    const query = q.trim();
    navigate(`/shop${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    setQ('');
    setSearchOpen(false);
    setOpen(false);
  }

  const initial = user ? (user.name || 'D').trim()[0].toUpperCase() : '';

  return (
    <>
      <div className="topbar">
        <div className="topbar-track">
          {[...TRUST, ...TRUST].map((t, i) => (
            <span key={i} className="topbar-item">{t}<i className="dot" /></span>
          ))}
        </div>
      </div>

      <header className="site">
        <div className="container">
          <div className="header-inner">
            <button className="hamburger" aria-label="Open menu" onClick={() => setOpen(true)}>
              <span /><span /><span />
            </button>

            <Link to="/" className="brand">
              <span className="logo"><Icon name="lamp" size={26} /></span>
              <span className="brand-text">
                <h1>DevaMart</h1>
                <small>Puja · Astrology · Vastu</small>
              </span>
            </Link>

            <nav className="nav-links">
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
              <NavLink to="/shop" className={({ isActive }) => (isActive ? 'active' : '')}>Shop</NavLink>
              <NavLink to="/favorites" className={({ isActive }) => (isActive ? 'active' : '')}>Favorites</NavLink>
              <NavLink to="/track" className={({ isActive }) => (isActive ? 'active' : '')}>Track</NavLink>
              <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>About</NavLink>
            </nav>

            <div className="header-actions">
              <button
                className={`icon-btn ${searchOpen ? 'search-on' : ''}`}
                title="Search"
                aria-label="Search"
                onClick={() => setSearchOpen(o => !o)}
              >
                <Icon name="search" size={19} />
              </button>
              <Link to="/favorites" className="icon-btn" title="Favorites" aria-label="Favorites">
                <Icon name="heart" size={19} />
                {count > 0 && <span className="badge">{count > 99 ? '99+' : count}</span>}
              </Link>
              <Link to="/cart" className="icon-btn" title="Cart" aria-label="Cart">
                <Icon name="cart" size={19} />
                {cart.count > 0 && <span className="badge">{cart.count > 99 ? '99+' : cart.count}</span>}
              </Link>

              {user ? (
                <div className="account">
                  <button className="avatar" onClick={() => setMenu(m => !m)} aria-label="Account menu">
                    {initial}
                  </button>
                  {menu && (
                    <>
                      <div className="menu-backdrop" onClick={() => setMenu(false)} />
                      <div className="user-menu">
                        <div className="user-head">
                          <b>{user.name}</b>
                          <span>{user.email}</span>
                        </div>
                        <Link to="/orders" onClick={() => setMenu(false)}><Icon name="box" size={18} /> My Orders</Link>
                        <Link to="/favorites" onClick={() => setMenu(false)}><Icon name="heart" size={18} /> Favorites</Link>
                        <Link to="/track" onClick={() => setMenu(false)}><Icon name="truck" size={18} /> Track Order</Link>
                        <button className="danger" onClick={() => { logout(); setMenu(false); navigate('/'); }}><Icon name="logout" size={18} /> Logout</button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link to="/login" className="icon-btn" title="Login" aria-label="Login">
                  <Icon name="user" size={20} />
                </Link>
              )}
            </div>
          </div>

          {searchOpen && (
            <div className="search-drop">
              <form className="container header-search" onSubmit={submitSearch}>
                <div className="searchbar">
                  <span className="search-ic"><Icon name="search" size={16} /></span>
                  <input
                    autoFocus
                    className="input"
                    placeholder="Search kits, rudraksha, crystals…"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') setSearchOpen(false); }}
                  />
                </div>
                <button className="btn sm" type="submit">Search</button>
              </form>
            </div>
          )}
        </div>
      </header>

      <div className={`overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`drawer ${open ? 'show' : ''}`}>
        <div className="drawer-head">
          <div className="logo"><Icon name="lamp" size={26} /></div>
          <h3>{user ? `Namaste, ${user.name.split(' ')[0]}` : 'Welcome to DevaMart'}</h3>
          <p>{user ? user.email : 'Login to shop & track your orders'}</p>
        </div>
        <nav>
          {NAV.map((item, i) => {
            if (item.divider) return <div className="divider" key={`d${i}`} />;
            if (item.protected && !user) return null;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}>
                <span className="ico"><Icon name={item.icon} size={18} /></span> {item.label}
              </NavLink>
            );
          })}
          {!user && <>
            <div className="divider" />
            <NavLink to="/orders" onClick={() => setOpen(false)}><span className="ico"><Icon name="box" size={18} /></span> My Orders (Login)</NavLink>
          </>}
          <div className="divider" />
          {user ? (
            <button className="linklike" onClick={() => { logout(); setOpen(false); navigate('/'); }}>
              <span className="ico"><Icon name="logout" size={18} /></span> Logout
            </button>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setOpen(false)}><span className="ico"><Icon name="user" size={18} /></span> Login</NavLink>
              <NavLink to="/signup" onClick={() => setOpen(false)}><span className="ico"><Icon name="sun" size={18} /></span> Create Account</NavLink>
            </>
          )}
        </nav>
        <div className="drawer-foot">
          Help? Call <a href="tel:+919038150556">+91 90381 50556</a><br />support@devamart.in
        </div>
      </aside>
    </>
  );
}