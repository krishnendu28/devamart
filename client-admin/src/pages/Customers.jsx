import { useEffect, useState } from 'react';
import { api, money, time } from '../api';

export default function Customers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/admin/customers').then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel">
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Customer</th><th>Contact</th><th>Joined</th><th>Orders</th><th>Lifetime Spend</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5}><div className="loading">Loading…</div></td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={5}><div className="empty">No customers yet.</div></td></tr>}
            {users.map(u => (
              <tr key={u.id}>
                <td><b>{u.name}</b></td>
                <td>{u.email}<br /><span className="muted" style={{ fontSize: '.78rem' }}>{u.phone || '—'}</span></td>
                <td className="muted" style={{ fontSize: '.82rem' }}>{time(u.created_at)}</td>
                <td><span className="pill packed">{u.orders_count}</span></td>
                <td><b style={{ color: 'var(--red-dark)' }}>{u.spent ? money(u.spent) : '₹0'}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}