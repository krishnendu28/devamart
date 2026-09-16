import { useEffect, useState } from 'react';

export function toast(msg) {
  window.dispatchEvent(new CustomEvent('dm-toast', { detail: msg }));
}

export default function Toaster() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    const h = (e) => { setMsg(e.detail); setTimeout(() => setMsg(null), 2600); };
    window.addEventListener('dm-toast', h);
    return () => window.removeEventListener('dm-toast', h);
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return <div className="toast">{msg}</div>;
}