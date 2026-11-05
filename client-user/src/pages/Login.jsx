import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import CitySelect from '../components/CitySelect';
import { getSavedCity, saveCity } from '../data/cityPref';
import Icon from '../components/Icons';

export default function Login() {
  const { login, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState(getSavedCity());
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const from = location.state?.from || '/';

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const u = await login(email.trim().toLowerCase(), password);
      if (city) {
        saveCity(city);
        // First login after signup without a city: remember it for delivery estimates.
        if (!u.city) { try { await updateProfile({ city }); } catch (e) { /* non-critical */ } }
      }
      toast(`Namaste, ${u.name.split(' ')[0]}!`);
      navigate(from);
    } catch (err) {
      setErr(err.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo-big"><img src="/logo.jpeg" alt="DevaMart" /></div>
        <h2>Welcome Back</h2>
        <p className="muted-center">Login to shop puja kits &amp; track your orders</p>
        {err && <div className="alert err">{err}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" autoComplete="email" required />
            <div className="field-hint"><Icon name="check" size={12} /> Gmail, Yahoo, Outlook or any email — all supported.</div>
          </div>
          <div className="field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required /></div>
          <div className="field">
            <label>Delivery city <span className="small muted">(optional)</span></label>
            <CitySelect value={city} onChange={next => setCity(next)} id="login-city" />
            <div className="field-hint"><Icon name="truck" size={12} /> We use this to estimate delivery and pre-fill checkout.</div>
          </div>
          <button className="btn block mt" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
        </form>
        <p className="center muted small mt">New to DevaMart? <Link to="/signup" style={{ color: 'var(--red)' }}>Create an account</Link></p>
      </div>
    </div>
  );
}
