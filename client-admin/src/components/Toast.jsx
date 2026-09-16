import { useEffect, useState } from 'react';
import { toast } from '../api';

export default function Toaster() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    const h = (e) => setMsg(e.detail);
    window.addEventListener('dm-toast', h);
    return () => window.removeEventListener('dm-toast', h);
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return <div className="toast">{msg}</div>;
}