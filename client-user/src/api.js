import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || '';

export function getToken() { return localStorage.getItem('dm_user_token'); }
export function setToken(t) { t ? localStorage.setItem('dm_user_token', t) : localStorage.removeItem('dm_user_token'); }
export function getUser() {
  try { return JSON.parse(localStorage.getItem('dm_user') || 'null'); } catch (e) { return null; }
}
export function setUser(u) { u ? localStorage.setItem('dm_user', JSON.stringify(u)) : localStorage.removeItem('dm_user'); }

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;

  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const imgUrl = (p) => (p && p.image ? p.image : '');

/** Locally generated fallback so a throttled/stock image never leaves a blank tile. */
export const placeholderUrl = (id) => `${API}/images/placeholder/${id || 0}.svg`;

let sharedSocket = null;

export function connectSocket(token) {
  if (!sharedSocket) {
    sharedSocket = io(API || window.location.origin, { transports: ['websocket', 'polling'] });
  }
  if (token) sharedSocket.emit('join-user', token);
  return sharedSocket;
}

export function getSocket() {
  return connectSocket(getToken());
}

export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;