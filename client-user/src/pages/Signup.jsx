import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import CitySelect from '../components/CitySelect';
import Icon from '../components/Icons';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (form.password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setBusy(true);
    try {
      const u = await signup({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() });
      toast(`Account created! Namaste, ${u.name.split(' ')[0]}`);
      navigate('/');
    } catch (err) { setErr(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo-big"><img src="/logo.jpeg" alt="DevaMart" /></div>
        <h2>Create Account</h2>
        <p className="muted-center">Join DevaMart to shop &amp; track orders</p>
        {err && <div className="alert err">{err}</div>}
        <form onSubmit={submit}>
          <div className="field"><label>Full Name</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ramesh Kumar" autoComplete="name" required /></div>
          <div className="field">
            <label>Email <span className="small muted">(Gmail works)</span></label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@gmail.com" autoComplete="email" required />
            <div className="field-hint"><Icon name="check" size={12} /> Use Gmail, Yahoo, Outlook or any email — all work for login.</div>
          </div>
          <div className="field"><label>Mobile <span className="small muted">(optional)</span></label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile" inputMode="numeric" maxLength={10} autoComplete="tel" /></div>
          <div className="field">
            <label>City <span className="small muted">(optional)</span></label>
            <CitySelect value={form.city} onChange={city => set('city', city)} id="signup-city" />
            <div className="field-hint">We use your city to show delivery estimates and pre-fill checkout.</div>
          </div>
          <div className="field"><label>Password</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" required /></div>
          <button className="btn block mt" disabled={busy}>{busy ? 'Creating account…' : 'Sign Up'}</button>
        </form>
        <p className="center muted small mt">Already have an account? <Link to="/login" style={{ color: 'var(--red)' }}>Login</Link></p>
      </div>
    </div>
  );
}
