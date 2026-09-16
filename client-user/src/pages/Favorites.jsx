import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useFavorites } from '../context/FavoritesContext';
import Icon from '../components/Icons';

export default function Favorites() {
  const { favs, clear } = useFavorites();

  return (
    <div className="container page">
      <div className="section-title">
        <div>
          <span className="eyebrow">Your wishlist</span>
          <h2>My Favorites</h2>
        </div>
        {favs.length > 0 && <button className="btn ghost sm" onClick={clear}>Clear all</button>}
      </div>

      {favs.length === 0 ? (
        <div className="empty">
          <div className="big"><Icon name="heart" size={52} /></div>
          <h3>No favorites yet</h3>
          <p>Tap the heart on any product to keep it here for later.</p>
          <Link to="/shop" className="btn mt">Browse Products</Link>
        </div>
      ) : (
        <div className="grid">
          {favs.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}