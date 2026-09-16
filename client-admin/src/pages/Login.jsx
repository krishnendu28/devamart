import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../api';
import Icon from '../components/Icons';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const u = await login(email, password);
      toast(`Welcome back, ${u.name}!`);
      navigate('/');
    } catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo"><Icon name="lamp" size={30} /></div>
        <h2>DevaMart Admin</h2>
        <p className="muted-center">Restricted area — authorised staff only</p>
        {err && <div className="alert err">{err}</div>}
        <form onSubmit={submit}>
          <div className="field"><label>Admin Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@devamart.in" required autoFocus /></div>
          <div className="field"><label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required /></div>
          <button className="btn block" style={{ width: '100%' }} disabled={busy}>{busy ? 'Verifying…' : 'Login to Dashboard'}</button>
        </form>
        <p className="muted-center small" style={{ marginTop: 14, fontSize: '.78rem' }}>Demo login: admin@devamart.in / Admin@1234</p>
      </div>
    </div>
  );
}