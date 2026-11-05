import { useEffect, useState } from 'react';
import { api, money, toast, connectSocket } from '../api';

const IMAGE_SLOTS = 5;
const emptyImages = () => Array.from({ length: IMAGE_SLOTS }, () => '');
const cleanImages = list => (list || []).map(s => String(s || '').trim()).filter(Boolean).slice(0, IMAGE_SLOTS);

const blank = {
  id: null, name: '', sku: '', category_id: '', description: '', price: '', mrp: '', stock: 100,
  image: '', images: emptyImages(), available: 1, coming_soon: 0, featured: 0, active: 1, checklist: [], instructions: [],
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [p, c] = await Promise.all([api('/api/admin/products'), api('/api/admin/categories')]);
      setProducts(p); setCategories(c);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const s = connectSocket();
    s.on('product:changed', () => load());
    s.on('categories:changed', () => load());
    return () => s.close();
  }, []);

  function openAdd() { setForm({ ...blank, images: emptyImages(), category_id: categories[0]?.id || '' }); setModal(true); }
  function openEdit(p) {
    const imgs = cleanImages(p.images && p.images.length ? p.images : (p.image ? [p.image] : []));
    while (imgs.length < IMAGE_SLOTS) imgs.push('');
    setForm({
      id: p.id, name: p.name, sku: p.sku || '', category_id: p.category_id, description: p.description,
      price: p.price, mrp: p.mrp || '', stock: p.stock, image: p.image || '', images: imgs,
      available: p.available === 0 ? 0 : 1,
      coming_soon: p.coming_soon ? 1 : 0,
      featured: p.featured, active: p.active,
      checklist: Array.isArray(p.checklist) ? p.checklist : [], instructions: Array.isArray(p.instructions) ? p.instructions : [],
    });
    setModal(true);
  }

  function setImage(i, value) {
    setForm(f => { const next = [...f.images]; next[i] = value; return { ...f, images: next, image: cleanImages(next)[0] || '' }; });
  }
  function clearImage(i) {
    setForm(f => { const next = [...f.images]; next[i] = ''; return { ...f, images: next, image: cleanImages(next)[0] || '' }; });
  }

  const isKit = () => categories.find(c => Number(c.id) === Number(form.category_id))?.slug === 'puja-samagri-kits';

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const imgs = cleanImages(form.images);
    const body = {
      name: form.name, sku: form.sku, category_id: Number(form.category_id),
      description: form.description, price: Number(form.price), mrp: Number(form.mrp || form.price),
      stock: Number(form.stock) || 0, image: imgs[0] || form.image || '', images: imgs,
      available: form.available ? 1 : 0,
      coming_soon: form.coming_soon ? 1 : 0,
      featured: form.featured ? 1 : 0, active: form.active ? 1 : 0,
    };
    if (isKit()) {
      body.checklist = form.checklist.map(s => String(s).trim()).filter(Boolean);
      body.instructions = form.instructions.map(s => String(s).trim()).filter(Boolean);
    }
    try {
      if (form.id) { await api(`/api/admin/products/${form.id}`, { method: 'PATCH', body }); toast('Product updated — users see it instantly ✅'); }
      else { await api('/api/admin/products', { method: 'POST', body }); toast('Product added ✅'); }
      setModal(false); await load();
    } catch (e2) { toast('Error: ' + e2.message); }
    finally { setSaving(false); }
  }

  async function toggleActive(p) {
    await api(`/api/admin/products/${p.id}`, { method: 'PATCH', body: { active: p.active ? 0 : 1 } });
    toast(p.active ? `"${p.name}" hidden from users` : `"${p.name}" is live again`);
    await load();
  }
  async function toggleAvailable(p) {
    const next = p.available === 0 ? 1 : 0;
    await api(`/api/admin/products/${p.id}`, { method: 'PATCH', body: { available: next } });
    toast(next ? `"${p.name}" is now AVAILABLE — users see it instantly ✅` : `"${p.name}" marked UNAVAILABLE for users`);
    await load();
  }
  async function toggleComingSoon(p) {
    const next = p.coming_soon ? 0 : 1;
    await api(`/api/admin/products/${p.id}`, { method: 'PATCH', body: { coming_soon: next } });
    toast(next ? `"${p.name}" is now COMING SOON — hidden from users until launch` : `"${p.name}" is live again — users can order it`);
    await load();
  }
  async function remove(p) {
    if (!confirm(`Hide "${p.name}" from the store?`)) return;
    await api(`/api/admin/products/${p.id}`, { method: 'DELETE' });
    toast('Product removed from store');
    await load();
  }

  const filtered = products.filter(p =>
    (!catFilter || String(p.category_id) === String(catFilter)) &&
    (!search.trim() || `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="toolbar">
        <input placeholder="Search name / SKU…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn gold" onClick={openAdd}>＋ Add Product</button>
        <b className="muted">{filtered.length} products</b>
        <span className="muted small">Changes go live to users instantly</span>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>MRP</th><th>Stock</th><th>Featured</th><th>Status</th><th>Availability</th><th>Coming Soon</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11}><div className="loading">Loading…</div></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={11}><div className="empty">No products match.</div></td></tr>}
              {filtered.map(p => (
                <tr key={p.id} style={{ opacity: p.active ? 1 : .45 }}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: 260 }}>
                      <img src={p.image} className="thumb" alt="" />
                      <div>
                        <b>{p.name}</b>
                        {(p.images || []).length > 1 && (
                          <div className="muted" style={{ fontSize: '.72rem' }}>{(p.images || []).length} images</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: '.78rem' }}>{p.sku || '—'}</td>
                  <td>{p.category_name}</td>
                  <td><b style={{ color: 'var(--red-dark)' }}>{money(p.price)}</b></td>
                  <td className="muted">{p.mrp ? money(p.mrp) : '—'}</td>
                  <td style={{ color: p.stock === 0 ? 'var(--red)' : 'inherit' }}>{p.stock}</td>
                  <td>{p.featured ? '⭐' : '—'}</td>
                  <td>
                    <span className={`pill ${p.active ? 'delivered' : 'cancelled'}`}>{p.active ? 'Live' : 'Hidden'}</span>
                  </td>
                  <td>
                    <button
                      className={`btn sm ${p.available === 0 ? 'danger' : 'gold'}`}
                      onClick={() => toggleAvailable(p)}
                      title="Toggle availability for users"
                    >
                      {p.available === 0 ? 'Unavailable' : 'Available'}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`btn sm ${p.coming_soon ? 'gold' : 'ghost'}`}
                      onClick={() => toggleComingSoon(p)}
                      title="Hide from users and label the product as Coming Soon"
                    >
                      {p.coming_soon ? '⏳ Coming Soon' : 'Set Coming Soon'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <button className="btn sm ghost" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn sm ghost" onClick={() => toggleActive(p)}>{p.active ? 'Hide' : 'Show'}</button>
                      <button className="btn sm danger" onClick={() => remove(p)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-bg" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="btn ghost sm close" onClick={() => setModal(false)}>✕ Close</button>
            <h3>{form.id ? `Edit: ${form.name}` : 'Add New Product'}</h3>
            <form onSubmit={save}>
              <div className="f-row">
                <div className="field"><label>Product Name *</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="field"><label>SKU</label><input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="DM-101" /></div>
              </div>
              <div className="f-row">
                <div className="field"><label>Category *</label>
                  <select required value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field"><label>Stock</label><input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
              </div>
              <div className="f-row">
                <div className="field"><label>Selling Price ₹ *</label><input type="number" step="0.01" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div className="field"><label>MRP ₹ (strikethrough)</label><input type="number" step="0.01" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))} /></div>
              </div>
              <div className="field"><label>Description</label><textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              {isKit() && (
                <>
                  <div className="kit-edit">
                    <details open>
                      <summary>Kit checklist — "What's inside the box" (shown on product page)</summary>
                      {form.checklist.map((item, i) => (
                        <div className="f-row" key={i}>
                          <input value={item} onChange={e => { const next = [...form.checklist]; next[i] = e.target.value; setForm(f => ({ ...f, checklist: next })); }} placeholder={`Item ${i + 1}: e.g. 1 Bronze kalash`} />
                          <button type="button" className="btn sm danger" onClick={() => setForm(f => ({ ...f, checklist: f.checklist.filter((_, j) => j !== i) }))}>✕</button>
                        </div>
                      ))}
                      <button type="button" className="btn sm ghost" onClick={() => setForm(f => ({ ...f, checklist: [...f.checklist, ''] }))}>＋ Add checklist item</button>
                    </details>
                    <details>
                      <summary>Kit instructions — "How to perform the puja" (numbered steps)</summary>
                      {form.instructions.map((item, i) => (
                        <div className="f-row" key={i}>
                          <input value={item} onChange={e => { const next = [...form.instructions]; next[i] = e.target.value; setForm(f => ({ ...f, instructions: next })); }} placeholder={`Step ${i + 1}: e.g. Light the lamp first…`} />
                          <button type="button" className="btn sm danger" onClick={() => setForm(f => ({ ...f, instructions: f.instructions.filter((_, j) => j !== i) }))}>✕</button>
                        </div>
                      ))}
                      <button type="button" className="btn sm ghost" onClick={() => setForm(f => ({ ...f, instructions: [...f.instructions, ''] }))}>＋ Add instruction step</button>
                    </details>
                  </div>
                </>
              )}
              <div className="field">
                <label>Product Images — up to 5 (slot 1 is the main image)</label>
                <div className="img-slots">
                  {form.images.map((src, i) => (
                    <div className={`img-slot ${src.trim() ? 'filled' : ''}`} key={i}>
                      <div className="img-slot-preview">
                        {src.trim()
                          ? <img src={src} alt={`Slot ${i + 1}`} onError={e => { e.currentTarget.style.opacity = .25; }} />
                          : <span>{i === 0 ? '★ Main' : `Slot ${i + 1}`}</span>}
                      </div>
                      <input
                        value={src}
                        onChange={e => setImage(i, e.target.value)}
                        placeholder={i === 0 ? 'Main image URL' : `Image ${i + 1} URL (optional)`}
                      />
                      <button
                        type="button"
                        className="btn sm ghost"
                        onClick={() => clearImage(i)}
                        disabled={!src.trim()}
                      >Clear</button>
                    </div>
                  ))}
                </div>
                <span className="muted" style={{ fontSize: '.76rem' }}>
                  Add 4–5 photos so customers can browse every angle. Empty slots are ignored; leave all blank for an auto-generated placeholder.
                </span>
              </div>
              <div className="f-row" style={{ marginBottom: 14 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.88rem' }}>
                  <input type="checkbox" checked={!!form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked ? 1 : 0 }))} /> Show as Bestseller
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.88rem' }}>
                  <input type="checkbox" checked={!!form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked ? 1 : 0 }))} /> Active (visible to users)
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.88rem' }}>
                  <input type="checkbox" checked={!!form.available} onChange={e => setForm(f => ({ ...f, available: e.target.checked ? 1 : 0 }))} /> Available for purchase
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.88rem' }}>
                  <input type="checkbox" checked={!!form.coming_soon} onChange={e => setForm(f => ({ ...f, coming_soon: e.target.checked ? 1 : 0 }))} /> ⏳ Coming Soon — hide from users until launch
                </label>
              </div>
              <button className="btn block" disabled={saving}>{saving ? 'Saving…' : form.id ? 'Save Changes' : 'Add Product'}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}