import { useEffect, useState } from 'react';
import { api, toast } from '../api';
import Icon from '../components/Icons';

const POSITIONS = [
  { v: 'center', label: 'Center' },
  { v: 'top', label: 'Top' },
  { v: 'bottom', label: 'Bottom' },
  { v: 'left', label: 'Left' },
  { v: 'right', label: 'Right' },
];

const empty = { title: '', subtitle: '', image_url: '', link: '/shop', pos: 'center', active: 1, sort: 99 };

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {id} or new
  const [form, setForm] = useState(empty);

  async function load() {
    try { setBanners(await api('/api/admin/banners')); } catch (e) { toast(e.message, 'err'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openNew() { setForm(empty); setEditing({ id: null }); }
  function openEdit(b) { setForm({ ...b, active: b.active ? 1 : 0 }); setEditing({ id: b.id }); }
  function close() { setEditing(null); }

  async function save() {
    if (!form.title || !form.image_url) { toast('Title and image URL are required', 'err'); return; }
    try {
      if (editing?.id) {
        await api(`/api/admin/banners/${editing.id}`, { method: 'PATCH', body: form });
        toast('Banner updated — carousel refreshed live');
      } else {
        await api('/api/admin/banners', { method: 'POST', body: form });
        toast('Banner added — now live on the home page');
      }
      close(); load();
    } catch (e) { toast(e.message, 'err'); }
  }

  async function remove(b) {
    if (!window.confirm(`Delete banner "${b.title}"? The slide will disappear immediately.`)) return;
    try { await api(`/api/admin/banners/${b.id}`, { method: 'DELETE' }); toast('Banner deleted'); load(); }
    catch (e) { toast(e.message, 'err'); }
  }

  async function toggle(b) {
    try { await api(`/api/admin/banners/${b.id}`, { method: 'PATCH', body: { active: b.active ? 0 : 1 } }); load(); }
    catch (e) { toast(e.message, 'err'); }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (loading) return <div className="loading">Loading banners…</div>;

  return (
    <>
      <div className="toolbar">
        <div className="muted" style={{ fontSize: '.9rem' }}>{banners.length} slide{banners.length === 1 ? '' : 's'} in rotation · enabled slides show on the home carousel</div>
        <button className="btn" onClick={openNew}><Icon name="image" size={16} /> Add banner</button>
      </div>

      {editing && (
        <div className="modal-bg" onClick={close}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="btn ghost sm close" onClick={close}>✕ Close</button>
            <h3>{editing.id ? `Edit: ${form.title}` : 'New banner'}</h3>
            <div className="field"><label>Title *</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Diwali Lakshmi Puja Offer" /></div>
            <div className="field"><label>Subtitle</label><input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Kits from ₹899 · Free delivery above ₹499" /></div>
            <div className="field"><label>Image URL *</label><input value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://…/1600w.jpg" /></div>
            {form.image_url && <div className="banner-preview"><img src={form.image_url} alt="preview" onError={e => { e.target.style.opacity = .35; }} /><span>Carousel preview (wide image, ~1600px recommended)</span></div>}
            <div className="field"><label>Link (where the slide navigates)</label><input value={form.link} onChange={e => set('link', e.target.value)} placeholder="/shop?category=puja-samagri-kits" /></div>
            <div className="f-row">
              <div className="field"><label>Image position</label>
                <select value={form.pos} onChange={e => set('pos', e.target.value)}>
                  {POSITIONS.map(p => <option key={p.v} value={p.v}>{p.label}</option>)}
                </select>
              </div>
              <div className="field"><label>Order (lower sorts first)</label><input type="number" value={form.sort} onChange={e => set('sort', +e.target.value)} /></div>
            </div>
            <label className="check"><input type="checkbox" checked={!!form.active} onChange={e => set('active', e.target.checked ? 1 : 0)} /> Visible on the home page</label>
            <div className="row mt" style={{ justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={close}>Cancel</button>
              <button className="btn" onClick={save}>{editing.id ? 'Save changes' : 'Add banner'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        {banners.length === 0 ? (
          <div className="empty">No banners yet. Add one to power the home carousel.</div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th></th><th>Slide</th><th>Title</th><th>Link</th><th>Position</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {banners.map(b => (
                  <tr key={b.id}>
                    <td style={{ width: 90 }}><img src={b.image_url} alt="" style={{ width: 150, height: 58, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} onError={e => { e.target.style.opacity = .3; }} /></td>
                    <td><b>#{b.id}</b></td>
                    <td><b>{b.title}</b>{b.subtitle && <div className="muted" style={{ fontSize: '.76rem' }}>{b.subtitle}</div>}</td>
                    <td className="muted" style={{ fontSize: '.8rem' }}>{b.link}</td>
                    <td>{b.pos}</td>
                    <td><span className={`pill ${b.active ? 'paid' : 'pending'}`}>{b.active ? 'Active' : 'Hidden'}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn sm ghost" onClick={() => openEdit(b)}><Icon name="doc" size={14} /> Edit</button>
                        <button className="btn sm ghost" onClick={() => toggle(b)}>{b.active ? 'Hide' : 'Show'}</button>
                        <button className="btn sm ghost danger" onClick={() => remove(b)}><Icon name="trash" size={14} /> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}