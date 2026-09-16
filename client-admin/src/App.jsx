import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { connectSocket } from './api';
import Icon from './components/Icons';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import Banners from './pages/Banners';
import Activity from './pages/Activity';
import Toaster from './components/Toast';

function WithLayout({ title, sub, children }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const s = connectSocket();
    s.on('order:new', () => {
      setPending(p => p + 1);
      window.dispatchEvent(new CustomEvent('dm-toast', { detail: 'New order received - check Orders!' }));
    });
    return () => s.close();
  }, []);

  const links = [
    { to: '/', label: 'Dashboard', icon: 'home' },
    { to: '/orders', label: 'Orders', icon: 'box' },
    { to: '/banners', label: 'Banners', icon: 'image' },
    { to: '/products', label: 'Products', icon: 'bag' },
    { to: '/categories', label: 'Categories', icon: 'flame' },
    { to: '/customers', label: 'Customers', icon: 'user' },
    { to: '/activity', label: 'Login Activity', icon: 'activity' },
  ];

  return (
    <div className="admin">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="logo"><Icon name="om" size={22} /></span>
          <span><b>DevaMart</b><small>Admin Panel</small></span>
        </div>
        <nav>
          {links.map(l => {
            const active = l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to);
            return (
              <a key={l.to} href={l.to} className={active ? 'active' : ''} onClick={() => setOpen(false)}>
                <Icon name={l.icon} size={19} /> {l.label}
                {l.label === 'Orders' && pending > 0 && <span className="cnt">{pending}</span>}
              </a>
            );
          })}
        </nav>
        <div className="foot">
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}><Icon name="user" size={15} /> {admin?.name}</div>
          <button
            className="btn sm"
            style={{ marginTop: 8, background: 'rgba(255,255,255,.16)', color: '#fff', border: 0, boxShadow: 'none' }}
            onClick={() => { logout(); navigate('/login'); }}
          ><Icon name="logout" size={15} /> Logout</button>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <div>
            <h1>{title}</h1>
            <div className="sub">{sub}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="live-dot"><span className="d" />Live · WebSocket</span>
            <button className="menu" onClick={() => setOpen(v => !v)}>
              <span className="menu-bars"><i /><i /><i /></span> Menu
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Guard({ children }) {
  const { admin, ready } = useAuth();
  if (!ready) return <div className="loading">Checking credentials…</div>;
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Guard><WithLayout title="Dashboard" sub="Realtime revenue, orders &amp; performance"><Dashboard /></WithLayout></Guard>} />
        <Route path="/orders" element={<Guard><WithLayout title="Orders" sub="Live orders · update status &amp; payments"><Orders /></WithLayout></Guard>} />
        <Route path="/banners" element={<Guard><WithLayout title="Banners" sub="Manage the home carousel &amp; launching slider"><Banners /></WithLayout></Guard>} />
        <Route path="/products" element={<Guard><WithLayout title="Products" sub="Add, edit &amp; update — changes go live instantly"><Products /></WithLayout></Guard>} />
        <Route path="/categories" element={<Guard><WithLayout title="Categories" sub="Manage store categories"><Categories /></WithLayout></Guard>} />
        <Route path="/customers" element={<Guard><WithLayout title="Customers" sub="Registered users &amp; lifetime value"><Customers /></WithLayout></Guard>} />
        <Route path="/activity" element={<Guard><WithLayout title="Login Activity" sub="Every login &amp; signup across the store and admin"><Activity /></WithLayout></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}