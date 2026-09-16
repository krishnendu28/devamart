import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, setUser, getUser } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdminState] = useState(getUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    api('/api/auth/me').then(d => { setAdminState(d.user); setUser(d.user); })
      .catch(() => { setToken(null); setUser(null); setAdminState(null); })
      .finally(() => setReady(true));
  }, []);

  async function login(email, password) {
    const d = await api('/api/auth/admin-login', { method: 'POST', body: { email, password } });
    setToken(d.token); setUser(d.user); setAdminState(d.user);
    return d.user;
  }
  function logout() { setToken(null); setUser(null); setAdminState(null); }

  return <AuthContext.Provider value={{ admin, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);