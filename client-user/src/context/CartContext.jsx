import { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], count: 0, total: 0 });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    if (!user) { setCart({ items: [], count: 0, total: 0 }); return; }
    api('/api/cart').then(setCart).catch(() => setCart({ items: [], count: 0, total: 0 }));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  async function add(productId, qty = 1) {
    setBusy(true);
    try {
      await api('/api/cart', { method: 'POST', body: { productId, qty } });
      await refresh();
      return true;
    } finally { setBusy(false); }
  }
  async function update(itemId, qty) {
    await api(`/api/cart/${itemId}`, { method: 'PATCH', body: { qty } });
    await refresh();
  }
  async function remove(itemId) {
    await api(`/api/cart/${itemId}`, { method: 'DELETE' });
    await refresh();
  }
  async function clear() {
    await api('/api/cart', { method: 'DELETE' });
    await refresh();
  }

  return (
    <CartContext.Provider value={{ cart, busy, add, update, remove, clear, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);