import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import Icon from '../components/Icons';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (form.password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setBusy(true);
    try {
      const u = await signup(form);
      toast(`Account created! Namaste, ${u.name.split(' ')[0]}`);
      navigate('/');
    } catch (err) { setErr(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo-big"><Icon name="sun" size={32} /></div>
        <h2>Create Account</h2>
        <p className="muted-center">Join DevaMart to shop &amp; track orders</p>
        {err && <div className="alert err">{err}</div>}
        <form onSubmit={submit}>
          <div className="field"><label>Full Name</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ramesh Kumar" required /></div>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required /></div>
          <div className="field"><label>Mobile (optional)</label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile" maxLength={10} /></div>
          <div className="field"><label>Password</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" required /></div>
          <button className="btn block mt" disabled={busy}>{busy ? 'Creating account…' : 'Sign Up'}</button>
        </form>
        <p className="center muted small mt">Already have an account? <Link to="/login" style={{ color: 'var(--red)' }}>Login</Link></p>
      </div>
    </div>
  );
}