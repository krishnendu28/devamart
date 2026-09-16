import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import Icon from '../components/Icons';

const CATEGORY_PHOTOS = {
  'puja-samagri-kits': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Hindu_pooja_thali.jpg/960px-Hindu_pooja_thali.jpg',
  'idols': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/Ganesh_Murti_-_Traditional_Idol_of_Lord_Ganesha_012.jpg/960px-Ganesh_Murti_-_Traditional_Idol_of_Lord_Ganesha_012.jpg',
  'rudraksha': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/Rudraksha_mala.jpg/960px-Rudraksha_mala.jpg',
  'healing-crystals': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Amethyst_crystals_close.jpg/960px-Amethyst_crystals_close.jpg',
  'decor-furniture': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Kamatchi_Vilakku.jpg/960px-Kamatchi_Vilakku.jpg',
};

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'default';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/categories', { auth: false }).then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (category && category !== 'all') sp.set('category', category);
    if (q) sp.set('q', q);
    if (sort !== 'default') sp.set('sort', sort);
    api(`/api/products?${sp.toString()}`, { auth: false })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, q, sort]);

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (!value || value === 'all' || value === 'default') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  const activeCat = categories.find(c => c.slug === category);

  return (
    <div className="page shop-page">
      <div className="section-title">
        <div>
          <h2>{category ? activeCat?.name || 'Products' : q ? `Results for "${q}"` : 'All Products'}</h2>
          <span className="sub">{products.length} products</span>
        </div>
        <div className="row">
          {q && <button className="btn ghost sm" onClick={() => setParam('q', '')}>Clear search ×</button>}
          <select value={sort} onChange={e => setParam('sort', e.target.value)}>
            <option value="default">Sort: Recommended</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name A–Z</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      <div className="shop-layout">
        <aside className="filters">
          <h3>Categories</h3>
          <a className={!category || category === 'all' ? 'active' : ''} onClick={() => setParam('category', 'all')}>
            <span>All Products</span><span className="n">{products.length}</span>
          </a>
          {categories.map(c => (
            <a key={c.id} className={category === c.slug ? 'active' : ''} onClick={() => setParam('category', c.slug)}>
              <span className="cat-mini"><img src={CATEGORY_PHOTOS[c.slug] || ''} alt="" />{c.name}</span><span className="n">{c.product_count}</span>
            </a>
          ))}
        </aside>

        <div>
          {loading ? (
            <div className="loading">Loading products…</div>
          ) : products.length === 0 ? (
            <div className="empty">
              <div className="big"><Icon name="lamp" size={52} /></div>
              <h3>No products found</h3>
              <p>Try a different category or search term.</p>
            </div>
          ) : (
            <div className="grid">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}