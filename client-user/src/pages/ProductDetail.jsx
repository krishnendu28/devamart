import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { toast } from '../components/Toast';
import Icon from '../components/Icons';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [missing, setMissing] = useState(false);
  const { add, busy } = useCart();
  const { has, toggle } = useFavorites();
  const navigate = useNavigate();

  useEffect(() => {
    setProduct(null);
    setMissing(false);
    api(`/api/products/${id}`, { auth: false })
      .then(p => {
        setProduct(p);
        return api(`/api/products?category=${p.category_slug}`, { auth: false });
      })
      .then(rel => setRelated(rel.filter(r => r.id !== Number(id)).slice(0, 4)))
      .catch(() => setMissing(true));
  }, [id]);

  async function handleAdd() {
    const ok = await add(product.id, qty);
    if (ok) toast(`Added ${product.name} to cart`);
  }

  function onFav() {
    toggle(product);
    toast(has(product.id) ? 'Removed from favorites' : 'Added to favorites');
  }

  if (missing) {
    return <div className="container page"><div className="empty"><div className="big"><Icon name="lamp" size={52} /></div><h3>Product not found</h3><Link to="/shop" className="btn mt">Back to Shop</Link></div></div>;
  }

  if (!product) return <div className="loading">Loading product…</div>;

  const off = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const isKit = product.category_slug === 'puja-samagri-kits';

  let checklist = [];
  let steps = [];
  try { checklist = JSON.parse(product.checklist || '[]'); } catch (e) {}
  try { steps = JSON.parse(product.instructions || '[]'); } catch (e) {}

  return (
    <div className="container page">
      <nav className="small muted mb" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'inherit' }}>Home</Link> / <Link to="/shop" style={{ color: 'inherit' }}>Shop</Link> / <Link to={`/shop?category=${product.category_slug}`} style={{ color: 'inherit' }}>{product.category_name}</Link>
      </nav>
      <div className="detail">
        <div className="gallery">
          <img src={product.image} alt={product.name} />
        </div>
        <div>
          <span className="cat" style={{ fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontSize: '.78rem' }}>{product.category_name}</span>
          <div className="pd-head">
            <h2>{product.name}</h2>
            <button className={`fav-btn big ${has(product.id) ? 'on' : ''}`} onClick={onFav} title="Add to favorites"><Icon name="heart" size={21} /></button>
          </div>
          {product.sku && <span className="muted small">SKU: {product.sku}</span>}
          <div className="row" style={{ margin: '14px 0 8px' }}>
            <span className="price-big">{money(product.price)}</span>
            {off > 0 && <span className="mrp" style={{ textDecoration: 'line-through', color: 'var(--muted)' }}>{money(product.mrp)}</span>}
            {off > 0 && <span className="off" style={{ color: 'var(--green)', fontWeight: 700 }}>{off}% OFF</span>}
          </div>
          <span className="muted small" style={{ display: 'block', marginBottom: 12 }}>+ free delivery on orders above ₹499 · COD &amp; UPI available</span>

          <p className="desc">{product.description}</p>
          {isKit && (
            <>
              <div className="alert info"><Icon name="doc" size={15} /> This kit includes a full item checklist and step-by-step puja instructions — nothing missing, nothing extra.</div>
              {checklist.length > 0 && (
                <div className="kit-box">
                  <h4>What's inside the kit</h4>
                  <ul className="kit-checklist">
                    {checklist.map((item, i) => (
                      <li key={i}><Icon name="check" size={13} /> {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {steps.length > 0 && (
                <div className="kit-box">
                  <h4>How to perform the puja</h4>
                  <ol className="kit-steps">
                    {steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}

          {product.stock > 0 ? (
            <div className="row mt">
              <span className="small muted" style={{ marginRight: 4 }}>Qty:</span>
              <div className="qty">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(Math.max(10, product.stock), q + 1))}>+</button>
              </div>
              <button className="btn" disabled={busy || product.stock === 0} onClick={handleAdd}>
                {busy ? 'Adding…' : 'Add to Cart'}
              </button>
              <button className="btn gold" disabled={busy || product.stock === 0} onClick={async () => { await handleAdd(); navigate('/checkout'); }}>
                Buy Now
              </button>
            </div>
          ) : (
            <div className="alert err">This product is currently out of stock.</div>
          )}

          <div className="chips mt-2">
            <span className="chip"><Icon name="check" size={13} /> Genuine &amp; fresh</span>
            <span className="chip"><Icon name="box" size={13} /> Ships in 24–48 hrs</span>
            <span className="chip"><Icon name="refresh" size={13} /> Easy replacement</span>
            <span className="chip"><Icon name="lock" size={13} /> Secure payment</span>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <>
          <div className="section-title"><h2>You may also like</h2></div>
          <div className="grid">{related.map(p => <ProductCard key={p.id} product={p} />)}</div>
        </>
      )}
    </div>
  );
}