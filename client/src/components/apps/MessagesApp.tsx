import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { readSession, writeSession, clearSession } from '@/lib/sessionStore';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

// An unsent draft survives closing/minimizing the window, so a half-written message isn't
// lost to a stray click on the red light. Tab-scoped and never transmitted (see
// sessionStore.ts); cleared once the message is actually delivered, or by the visitor.
// Only `form` is stored, never `status`: every mount starts 'idle'.
const DRAFT_KEY = 'pk_messages_draft_v1';
const DRAFT_DEBOUNCE_MS = 400;
const EMPTY_FORM = { name: '', email: '', message: '' };
type Form = typeof EMPTY_FORM;
const isDraft = (v: unknown): v is Form =>
  !!v && typeof v === 'object' && (['name', 'email', 'message'] as const).every((k) => typeof (v as Record<string, unknown>)[k] === 'string');
const isBlank = (f: Form) => !f.name && !f.email && !f.message;
// Over the size cap writeSession skips the write, so a very long message keeps the last
// good copy instead of a truncated one.
const saveDraft = (f: Form) => {
  if (isBlank(f)) clearSession(DRAFT_KEY);
  else writeSession(DRAFT_KEY, f);
};

export default function MessagesApp() {
  const [form, setForm] = useState<Form>(() => {
    const d = readSession(DRAFT_KEY, isDraft);
    return d ? { name: d.name, email: d.email, message: d.message } : EMPTY_FORM;
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'unconfigured' | 'error'>('idle');

  // Debounced save while the form is being edited. Not while sending/sent/unconfigured/error:
  // a submit that is in flight (or already showing a terminal screen) must not re-write what
  // it is about to clear, or resurrect a draft that was just cleared.
  useEffect(() => {
    if (status !== 'idle') return;
    const t = setTimeout(() => saveDraft(form), DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [form, status]);

  // Flush on unmount, otherwise closing the window inside the debounce window would drop
  // the tail of what was typed.
  const formRef = useRef(form);
  const statusRef = useRef(status);
  formRef.current = form;
  statusRef.current = status;
  useEffect(() => () => {
    if (statusRef.current === 'idle') saveDraft(formRef.current);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    // No backend configured — don't send anywhere, don't fake success.
    if (!API_URL) {
      setStatus('unconfigured');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      // Drop the draft (stored AND in memory) only once the backend actually accepted the
      // message. A non-2xx or network failure keeps the draft -- both are honest 'error'
      // here (unlike the live site, whose contact form quietly shows "sent" either way; this
      // template's version already told visitors the truth before this sprint, and that's
      // worth keeping), so nothing the visitor wrote is ever lost to a failed send.
      if (res.ok) {
        clearSession(DRAFT_KEY);
        setForm(EMPTY_FORM);
        setStatus('sent');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
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
            {/* Closing and reopening the window already gives a fresh form -- this just
                saves the round trip while it's still open. */}
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="transition-all hover:brightness-125"
              style={{
                marginTop: '4px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: "'Outfit', sans-serif",
                cursor: 'pointer',
              }}
            >
              Send another message
            </button>
          </motion.div>
        ) : status === 'unconfigured' || status === 'error' ? (
          <motion.div
            key="unconfigured"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center"
          >
            <AlertCircle size={48} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
            <div>
              <p style={{ fontSize: '16px', fontWeight: 500, color: '#f0f0f2', marginBottom: '6px' }}>
                {status === 'unconfigured' ? "Contact form isn't set up yet" : 'Something went wrong'}
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                {status === 'unconfigured'
                  ? 'Set VITE_API_URL and deploy backend/ (see README) to receive messages here.'
                  : "The backend didn't accept that — try again, or email directly."}
                {' '}
                <a href="mailto:pk.kowadkar@gmail.com" style={{ color: '#E50914' }}>pk.kowadkar@gmail.com</a>
              </p>
            </div>
            <button
              onClick={() => setStatus('idle')}
              style={{
                padding: '8px 18px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Back to form
            </button>
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
            <div className="flex justify-between items-center">
              {/* Doubles as the hint that a draft was restored. */}
              <div>
                {status === 'idle' && !isBlank(form) && (
                  <button
                    type="button"
                    onClick={() => { setForm(EMPTY_FORM); clearSession(DRAFT_KEY); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '12.5px',
                      fontFamily: "'Outfit', sans-serif",
                      cursor: 'pointer',
                      padding: '4px 2px',
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
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
