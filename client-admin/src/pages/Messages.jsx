import { useEffect, useState } from 'react';
import { api, time, toast } from '../api';
import Icon from '../components/Icons';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  async function load() {
    try {
      setMessages(await api('/api/admin/messages'));
    } catch (e) { /* handled by UI */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function markRead(id, read) {
    await api(`/api/admin/messages/${id}/read`, { method: 'PATCH', body: { read } });
    setMessages(list => list.map(m => (m.id === id ? { ...m, read } : m)));
    if (selected && selected.id === id) setSelected(s => ({ ...s, read }));
  }

  async function remove(id) {
    if (!window.confirm('Delete this message?')) return;
    await api(`/api/admin/messages/${id}`, { method: 'DELETE' });
    setMessages(list => list.filter(m => m.id !== id));
    if (selected && selected.id === id) setSelected(null);
    toast('Message deleted');
  }

  const q = search.trim().toLowerCase();
  const filtered = messages.filter(m => {
    if (filter === 'unread' && m.read) return false;
    if (filter === 'read' && !m.read) return false;
    if (!q) return true;
    return `${m.name} ${m.email || ''} ${m.phone || ''} ${m.message}`.toLowerCase().includes(q);
  });

  const unread = messages.filter(m => !m.read).length;

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search name, phone, message…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 260 }} />
        <div className="seg">
          {[['all', 'All'], ['unread', `Unread${unread ? ` (${unread})` : ''}`], ['read', 'Read']].map(([k, label]) => (
            <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
        <b className="muted">{filtered.length} message{filtered.length !== 1 ? 's' : ''}</b>
        <button className="btn ghost sm" onClick={() => { setLoading(true); load(); }}>↻ Refresh</button>
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading">Loading messages…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 40 }}><Icon name="mail" size={40} /></div>
            <p>No messages here. Customer enquiries from the Contact Us page land in this inbox.</p>
          </div>
        ) : (
          <div className="msg-list">
            {filtered.map(m => (
              <div key={m.id} className={`msg-item ${m.read ? '' : 'unread'}`} onClick={() => { setSelected(m); if (!m.read) markRead(m.id, true); }}>
                <div className="msg-head">
                  <span className={`dot ${m.read ? '' : 'on'}`} />
                  <b>{m.name}</b>
                  <span className="muted" style={{ fontSize: '.76rem' }}>{time(m.created_at)}</span>
                </div>
                <div className="msg-meta muted" style={{ fontSize: '.76rem' }}>
                  {m.email && <span><Icon name="mail" size={13} /> {m.email}</span>}
                  {m.phone && <span><Icon name="phone" size={13} /> {m.phone}</span>}
                </div>
                <p className="msg-body">{m.message}</p>
                <div className="row-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn ghost sm" onClick={() => markRead(m.id, !m.read)}>{m.read ? 'Mark unread' : 'Mark read'}</button>
                  <button className="btn ghost sm" onClick={() => window.open(`mailto:${m.email || 'support@devamart.in'}?subject=${encodeURIComponent('Re: your enquiry to DevaMart')}`, '_blank')}>Reply</button>
                  <button className="btn danger sm" onClick={() => remove(m.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-bg" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="btn ghost sm close" onClick={() => setSelected(null)}>✕ Close</button>
            <h3>Message from {selected.name}</h3>
            <div className="alert info" style={{ fontSize: '.84rem' }}>
              {selected.email && <div><Icon name="mail" size={14} /> {selected.email}</div>}
              {selected.phone && <div><Icon name="phone" size={14} /> {selected.phone}</div>}
              <div className="muted" style={{ marginTop: 4 }}>Received {time(selected.created_at)}</div>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '.92rem' }}>{selected.message}</div>
            <div className="row" style={{ gap: 10, marginTop: 16 }}>
              <button className="btn ghost sm" onClick={() => markRead(selected.id, !selected.read)}>{selected.read ? 'Mark unread' : 'Mark read'}</button>
              <button className="btn danger sm" onClick={() => remove(selected.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
