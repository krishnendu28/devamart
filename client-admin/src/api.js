import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || '';

export const getToken = () => localStorage.getItem('dm_admin_token');
export const setToken = t => t ? localStorage.setItem('dm_admin_token', t) : localStorage.removeItem('dm_admin_token');
export const getUser = () => { try { return JSON.parse(localStorage.getItem('dm_admin_user') || 'null'); } catch (e) { return null; } };
export const setUser = u => u ? localStorage.setItem('dm_admin_user', JSON.stringify(u)) : localStorage.removeItem('dm_admin_user');

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status; err.data = data; throw err;
  }
  return data;
}

export function connectSocket() {
  const s = io(API || window.location.origin, { transports: ['websocket', 'polling'] });
  if (getToken()) s.emit('join-admin', getToken());
  return s;
}

export const money = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
export const time = (d) => d ? new Date(d + 'Z').toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

export function toast(msg) { window.dispatchEvent(new CustomEvent('dm-toast', { detail: msg })); }