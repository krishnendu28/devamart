import { useEffect, useState } from 'react';
import { api, toast, connectSocket } from '../api';

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '🪔', description: '' });
  const [saving, setSaving] = useState(false);

  async function load() { setCats(await api('/api/admin/categories')); }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const s = connectSocket();
    s.on('categories:changed', () => load());
    return () => s.close();
  }, []);

  function openNew() { setEdit(null); setForm({ name: '', icon: '🪔', description: '' }); setModal(true); }
  function openEdit(c) { setEdit(c); setForm({ name: c.name, icon: c.icon, description: c.description }); setModal(true); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (edit) {
        await api(`/api/admin/categories/${edit.id}`, { method: 'PATCH', body: form });
        toast('Category updated ✅');
      } else {
        await api('/api/admin/categories', { method: 'POST', body: form });
        toast('Category added ✅');
      }
      setModal(false); await load();
    } catch (e2) { toast('Error: ' + e2.message); }
    finally { setSaving(false); }
  }

  async function toggleActive(c) {
    await api(`/api/admin/categories/${c.id}`, { method: 'PATCH', body: { active: c.active ? 0 : 1 } });
    toast(c.active ? `"${c.name}" hidden from store` : `"${c.name}" visible again`);
    await load();
  }

  return (
    <>
      <div className="toolbar">
        <button className="btn gold" onClick={openNew}>＋ Add Category</button>
        <b className="muted">{cats.length} categories</b>
      </div>
      <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {cats.map(c => (
          <div className="card" key={c.id} style={{ display: 'block', opacity: c.active ? 1 : .5 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: 30 }}>{c.icon}</span>
              <span className={`pill ${c.active ? 'delivered' : 'cancelled'}`}>{c.active ? 'Live' : 'Hidden'}</span>
            </div>
            <b style={{ fontSize: '1.02rem', color: 'var(--red-dark)', display: 'block', margin: '6px 0 2px' }}>{c.name}</b>
            <span className="muted" style={{ fontSize: '.78rem' }}>{c.description || '—'}</span>
            <div className="muted" style={{ fontSize: '.78rem', marginTop: 6 }}>{c.products} products · slug: {c.slug}</div>
            <div className="row mt">
              <button className="btn sm ghost" onClick={() => openEdit(c)}>Edit</button>
              <button className="btn sm ghost" onClick={() => toggleActive(c)}>{c.active ? 'Hide' : 'Show'}</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-bg" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="btn ghost sm close" onClick={() => setModal(false)}>✕ Close</button>
            <h3>{edit ? `Edit: ${edit.name}` : 'Add Category'}</h3>
            <form onSubmit={save}>
              <div className="f-row">
                <div className="field"><label>Name *</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="field"><label>Icon (emoji)</label><input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} /></div>
              </div>
              <div className="field"><label>Description</label><textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <button className="btn block" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}