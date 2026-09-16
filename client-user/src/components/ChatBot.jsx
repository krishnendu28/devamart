import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const { user } = useAuth();
  const bodyRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      api('/api/chat/welcome').then(w => {
        setMessages([{ sender: 'bot', text: w.answer }]);
        setSuggestions(w.suggestions);
      });
    }
  }, [open]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing]);

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setMessages(m => [...m, { sender: 'user', text: msg }]);
    setInput('');
    setTyping(true);
    try {
      const d = await api('/api/chat', { method: 'POST', body: { message: msg, userId: user?.id }, auth: false });
      setTimeout(() => {
        setMessages(m => [...m, { sender: 'bot', text: d.reply }]);
        setSuggestions(d.suggestions || []);
        setTyping(false);
      }, 350);
    } catch (e) {
      setTyping(false);
      setMessages(m => [...m, { sender: 'bot', text: 'Sorry, I could not reach the server. Please try again.' }]);
    }
  }

  if (!open) {
    return <button className="chat-fab" aria-label="Chat with Devam" onClick={() => setOpen(true)}><Icon name="chat" size={28} /></button>;
  }

  return (
    <div className="chat-panel">
      <div className="chat-head">
        <span className="ava">ॐ</span>
        <span>
          <b>Devam — Assistant</b>
          <small>Online · replies instantly</small>
        </span>
        <button className="icon-btn" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,.15)', borderColor: 'rgba(255,255,255,.3)', color: '#fff' }} onClick={() => setOpen(false)}>✕</button>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.sender}`}>{m.text}</div>
        ))}
        {typing && <div className="msg bot">Devam is typing…</div>}
      </div>
      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input placeholder="Ask about kits, delivery, COD…" value={input} onChange={e => setInput(e.target.value)} />
        <button type="submit" aria-label="Send"><Icon name="send" size={18} /></button>
      </form>
    </div>
  );
}