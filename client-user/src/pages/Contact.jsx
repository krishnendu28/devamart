import { useState } from 'react';
import { useContent, InfoLayout } from './InfoShared';
import { api } from '../api';
import { toast } from '../components/Toast';
import Icon from '../components/Icons';

export default function Contact() {
  const { data, loading } = useContent('/api/content/contact');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!form.name || !form.message) { setErr('Please enter your name and message.'); return; }
    setBusy(true);
    try {
      await api('/api/content/contact', { method: 'POST', body: form, auth: false });
      toast('Message sent! We will reply within one working day.');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="loading">Loading contact…</div>;

  return (
    <InfoLayout title={data.title}>
      <div className="detail" style={{ gridTemplateColumns: '1fr 1fr', gap: 26 }}>
        <div className="prose" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>Get in touch</h3>
          <p><Icon name="mail" size={15} /> <b>{data.email}</b></p>
          <p><Icon name="phone" size={15} /> <b>{data.phone}</b></p>
          <p><Icon name="chat" size={15} /> WhatsApp: <b>{data.whatsapp}</b></p>
          <p><Icon name="clock" size={15} /> {data.hours}</p>
          <p><Icon name="pin" size={15} /> {data.address}</p>
          <p className="small muted" style={{ marginTop: 18 }}>
            For bulk &amp; temple orders, mention the quantity and pincode — we reply with a special quote within 24 hours.
          </p>
        </div>
        <div className="prose" style={{ padding: 22 }}>
          <h3 style={{ marginTop: 0 }}>Send us a message</h3>
          {err && <div className="alert err">{err}</div>}
          <form onSubmit={submit}>
            <div className="field"><label>Your Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></div>
            <div className="field-row">
              <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" /></div>
              <div className="field"><label>Mobile</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit number" maxLength={10} /></div>
            </div>
            <div className="field"><label>Message *</label><textarea rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="How can we help?" /></div>
            <button className="btn block" disabled={busy}>{busy ? 'Sending…' : 'Send Message'}</button>
          </form>
        </div>
      </div>
    </InfoLayout>
  );
}