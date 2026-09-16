import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import Icon from '../components/Icons';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const from = location.state?.from || '/';

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const u = await login(email, password);
      toast(`Namaste, ${u.name.split(' ')[0]}!`);
      navigate(from);
    } catch (err) {
      setErr(err.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo-big"><Icon name="lamp" size={32} /></div>
        <h2>Welcome Back</h2>
        <p className="muted-center">Login to shop puja kits &amp; track your orders</p>
        {err && <div className="alert err">{err}</div>}
        <form onSubmit={submit}>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
          <div className="field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required /></div>
          <button className="btn block mt" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
        </form>
        <p className="center muted small mt">New to DevaMart? <Link to="/signup" style={{ color: 'var(--red)' }}>Create an account</Link></p>
      </div>
    </div>
  );
}