import { useEffect, useState } from 'react';
import { api, time } from '../api';
import Icon from '../components/Icons';

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | success | failed | admin | user

  async function load() {
    try { setLogs(await api('/api/admin/login-logs?limit=300')); } catch (e) { /* handled by guard */ }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []);

  const filtered = logs.filter(l => {
    if (filter === 'success') return l.success === 1;
    if (filter === 'failed') return l.success === 0;
    if (filter === 'admin') return l.role === 'admin';
    if (filter === 'user') return l.role === 'user';
    return true;
  });

  const counts = {
    total: logs.length,
    success: logs.filter(l => l.success === 1).length,
    failed: logs.filter(l => l.success === 0).length,
    admin: logs.filter(l => l.role === 'admin').length,
  };

  if (loading) return <div className="loading">Loading activity…</div>;

  return (
    <>
      <div className="cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { lbl: 'Total events', val: counts.total, ic: 'activity', cls: 'blue' },
          { lbl: 'Successful logins', val: counts.success, ic: 'check_ok', cls: 'green' },
          { lbl: 'Failed attempts', val: counts.failed, ic: 'warn', cls: 'red' },
          { lbl: 'Admin logins', val: counts.admin, ic: 'shield', cls: 'purple' },
        ].map(c => (
          <div className="card" key={c.lbl}>
            <span className={`ic ${c.cls}`}><Icon name={c.ic} size={22} /></span>
            <span><span className="val">{c.val}</span><span className="lbl" style={{ display: 'block' }}>{c.lbl}</span></span>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="toolbar">
          <div className="muted" style={{ fontSize: '.9rem' }}>Every login &amp; signup is recorded with IP and device — refreshes every 20s.</div>
          <div className="seg">
            {[['all', 'All'], ['success', 'Success'], ['failed', 'Failed'], ['admin', 'Admins'], ['user', 'Users']].map(([k, label]) => (
              <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Time</th><th>Email</th><th>Role</th><th>Portal</th><th>IP address</th><th>Device / Browser</th><th>Result</th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7}><div className="empty">No events match this filter.</div></td></tr>}
              {filtered.slice(0, 200).map(l => (
                <tr key={l.id}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{time(l.created_at)}</td>
                  <td><b>{l.email}</b></td>
                  <td><span className={`pill ${l.role === 'admin' ? 'paid' : 'blue'}`}>{l.role}</span></td>
                  <td><span className="pill">{l.portal === 'admin' ? 'Admin panel' : 'Store'}</span></td>
                  <td className="muted" style={{ fontFamily: 'monospace', fontSize: '.8rem' }}>{l.ip}</td>
                  <td className="muted" style={{ fontSize: '.78rem' }}>{l.user_agent || '—'}</td>
                  <td><span className={`pill ${l.success ? 'paid' : 'failed'}`}>{l.success ? 'Success' : 'Failed'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}