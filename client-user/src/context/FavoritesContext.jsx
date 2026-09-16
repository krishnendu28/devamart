import { createContext, useContext, useEffect, useState } from 'react';

const FavContext = createContext(null);

const KEY = 'dm_favs';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
}

export function FavoritesProvider({ children }) {
  const [favs, setFavs] = useState(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(favs));
  }, [favs]);

  function snapshot(p) {
    return {
      id: p.id, name: p.name, price: p.price, mrp: p.mrp,
      image: p.image, category_name: p.category_name || p.category,
      featured: !!p.featured, stock: p.stock,
    };
  }

  function has(id) {
    return favs.some(f => String(f.id) === String(id));
  }

  function toggle(p) {
    setFavs(prev => {
      const id = String(p.id);
      if (prev.some(f => String(f.id) === id)) {
        return prev.filter(f => String(f.id) !== id);
      }
      if (prev.length >= 50) prev = prev.slice(-49);
      return [...prev, snapshot(p)];
    });
  }

  function remove(id) {
    setFavs(prev => prev.filter(f => String(f.id) !== String(id)));
  }

  function clear() { setFavs([]); }

  return (
    <FavContext.Provider value={{ favs, count: favs.length, has, toggle, remove, clear }}>
      {children}
    </FavContext.Provider>
  );
}

export const useFavorites = () => useContext(FavContext);