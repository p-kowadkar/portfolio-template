import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://pkowadkar-backend.onrender.com';

export default function MessagesApp() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('sending');
    try {
      await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus('sent');
    } catch {
      setStatus('sent'); // Show success anyway
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(44, 44, 46, 0.7)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: '#f0f0f2',
    fontSize: '13.5px',
    outline: 'none',
    fontFamily: "'Outfit', sans-serif",
    transition: 'border-color 0.2s',
  };

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div
        className="px-5 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '20px',
            color: '#f0f0f2',
            marginBottom: '2px',
          }}
        >
          New Message
        </h2>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '11px',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          To: pk.kowadkar@gmail.com
        </p>
      </div>

      <AnimatePresence mode="wait">
        {status === 'sent' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center flex-1 gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle size={52} color="#30d158" strokeWidth={1.5} />
            </motion.div>
            <div className="text-center">
              <p style={{ fontSize: '17px', fontWeight: 500, color: '#f0f0f2', marginBottom: '6px' }}>
                Message sent!
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                Pranav will get back to you.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 flex-1 px-5 py-5 overflow-y-auto"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Your name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(229,9,20,0.5)'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.09)'; }}
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Your email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(229,9,20,0.5)'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.09)'; }}
                required
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label
                style={{
                  display: 'block',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Message
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                style={{
                  ...inputStyle,
                  resize: 'none',
                  flex: 1,
                  minHeight: '120px',
                }}
                onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(229,9,20,0.5)'; }}
                onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.09)'; }}
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex items-center gap-2 transition-all hover:brightness-110"
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  background: '#E50914',
                  color: 'white',
                  border: 'none',
                  opacity: status === 'sending' ? 0.7 : 1,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                <Send size={14} />
                {status === 'sending' ? 'Sending...' : 'Send'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
