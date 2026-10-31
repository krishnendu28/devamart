import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { money } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { toast } from './Toast';
import Icon from './Icons';

const CAT_PHOTO = {
  'puja-samagri-kits': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Hindu_pooja_thali.jpg/960px-Hindu_pooja_thali.jpg',
  idols: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/Ganesh_Murti_-_Traditional_Idol_of_Lord_Ganesha_012.jpg/960px-Ganesh_Murti_-_Traditional_Idol_of_Lord_Ganesha_012.jpg',
  rudraksha: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/Rudraksha_mala.jpg/960px-Rudraksha_mala.jpg',
  'healing-crystals': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Amethyst_crystals_close.jpg/960px-Amethyst_crystals_close.jpg',
  'decor-furniture': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Kamatchi_Vilakku.jpg/960px-Kamatchi_Vilakku.jpg',
};

export default function ProductCard({ product }) {
  const off = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  const [img, setImg] = useState((product.images && product.images[0]) || product.image || CAT_PHOTO[product.category_slug]);
  const { user } = useAuth();
  const { add, busy } = useCart();
  const { has, toggle } = useFavorites();
  const navigate = useNavigate();

  const fav = has(product.id);
  const unavailable = product.available === 0;
  const soldOut = product.stock === 0;

  // Realtime image/price changes from the admin panel.
  useEffect(() => {
    setImg((product.images && product.images[0]) || product.image || CAT_PHOTO[product.category_slug]);
  }, [product.image, product.images, product.category_slug]);

  function onFav(e) {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
    toast(fav ? 'Removed from favorites' : 'Added to favorites');
  }

  function onAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    if (unavailable) { toast('This product is currently unavailable'); return; }
    if (soldOut) { toast('Out of stock right now'); return; }
    if (!user) { toast('Please login to add items to cart'); navigate('/login'); return; }
    add(product.id, 1).then(ok => { if (ok) toast(`Added to cart · ${product.name}`); });
  }

  return (
    <Link to={`/product/${product.id}`} className="pcard">
      <div className="thumb">
        <img src={img} alt={product.name} loading="lazy" onError={() => setImg(CAT_PHOTO[product.category_slug] || CAT_PHOTO['puja-samagri-kits'])} />
        <button
          className={`fav-btn ${fav ? 'on' : ''}`}
          title={fav ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          onClick={onFav}
        ><Icon name="heart" size={17} /></button>
        {product.featured ? <span className="tag">Bestseller</span> : null}
        {off >= 20 ? <span className="tag sale">{off}% OFF</span> : null}
      </div>
      <div className="body">
        <span className="cat">{product.category_name || product.category}</span>
        <h3>{product.name}</h3>
        {product.stock === 0 || unavailable ? (
          <span className="stock-out">{unavailable ? 'Unavailable' : 'Out of stock'}</span>
        ) : (
          <div className="price-row">
            <span className="price">{money(product.price)}</span>
            {off > 0 && <span className="mrp">{money(product.mrp)}</span>}
            {off > 0 && <span className="off">save {off}%</span>}
          </div>
        )}
        <button className="btn add-btn" disabled={busy || soldOut || unavailable} onClick={onAdd}>
          {busy ? 'Adding…' : unavailable ? 'Unavailable' : soldOut ? 'Sold out' : '+ Add to Cart'}
        </button>
      </div>
    </Link>
  );
}