import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, setUser, getToken, getUser } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(getUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getToken()) {
      api('/api/auth/me')
        .then(d => { setUserState(d.user); setUser(d.user); })
        .catch(() => { setToken(null); setUser(null); setUserState(null); })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  async function login(email, password) {
    const d = await api('/api/auth/login', { method: 'POST', body: { email, password }, auth: false });
    setToken(d.token); setUser(d.user); setUserState(d.user);
    return d.user;
  }
  async function signup(payload) {
    const d = await api('/api/auth/signup', { method: 'POST', body: payload, auth: false });
    setToken(d.token); setUser(d.user); setUserState(d.user);
    return d.user;
  }
  function logout() { setToken(null); setUser(null); setUserState(null); }

  return <AuthContext.Provider value={{ user, ready, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);