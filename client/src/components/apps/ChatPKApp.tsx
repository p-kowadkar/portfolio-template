// Design: Netflix-dark · macOS chat window aesthetic
// AIssistant — Pranav's AI Guide. Routes through backend /api/chat for live RAG (journey + resume + GitHub).
// Requires VITE_API_URL — there's no client-side fallback by design: the RAG
// prompt and every API key stay server-side in backend/main.py, never in the
// client bundle. If you want a "works with zero backend" mode, that's a
// bigger tradeoff than swapping in a client-exposed key here; the backend is
// a few minutes to deploy (see the README) and worth doing properly.
// Color: #0a0a0a bg, #E50914 accent, #f5f5f1 body
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, SquarePen } from 'lucide-react';
import { dispatchToolCall } from '../../lib/toolDispatch';
import { useOpenWindow } from '../../contexts/WindowActionsContext';
import { useIsWindowOpen } from '../../contexts/WindowParamsContext';
import { useAIssistantConversation, type AIssistantMessage } from '../../hooks/useAIssistantConversation';

type Message = AIssistantMessage;

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

// Not part of the persisted conversation (see useAIssistantConversation.ts): always
// re-seeded as messages[0].
const GREETING: Message = {
  role: 'model',
  content: "Hey! I'm AIssistant — Pranav's AI Guide. Ask me anything about his work, projects, or background.",
};

export default function ChatPKApp() {
  const [loading, setLoading] = useState(false);
  // The conversation survives closing the window and page reloads. `loading` tells it a
  // request is in flight, so a question that never got an answer is handed back to the
  // input box on the next open instead of hanging there as an orphan.
  const chat = useAIssistantConversation(loading);
  const setTurns = chat.setTurns;
  const messages = useMemo<Message[]>(() => [GREETING, ...chat.turns], [chat.turns]);
  const [input, setInput] = useState(chat.restoredInput);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openWindow = useOpenWindow();

  // The in-flight /api/chat request. ChatPKApp had no way to cancel it, so closing the
  // window mid-reply still ran dispatchToolCall when the answer arrived, and could pop
  // windows open from an AIssistant that was already gone. Aborted on unmount only --
  // NOT when the window's `isOpen` flag flips, which happens a beat before the exit
  // animation finishes and the component actually unmounts. Aborting on that earlier
  // signal would clobber the stored inFlight flag via this same abort's `finally` (see
  // sendMessage), so a reply landing in that gap is dropped there instead, leaving
  // `loading` set so the orphaned question is still restored on the next open.
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => { abortRef.current?.abort(); }, []);
  const chatOpen = useIsWindowOpen('chat');
  const chatOpenRef = useRef(chatOpen);
  chatOpenRef.current = chatOpen;

  const startNewConversation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    chat.reset();
    setLoading(false);
    setInput('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const SUGGESTED_CHIPS = [
    "What's Pranav building right now?",
    "Tell me about CareerForge",
    "Any fun facts about Pranav?",
  ];

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const controller = new AbortController();
    abortRef.current = controller;
    setTurns((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    // Re-focus the input after sending
    setTimeout(() => inputRef.current?.focus(), 50);

    try {
      let reply = '';

      if (API_URL) {
        // ── Primary: backend /api/chat with live RAG ──────────────────────────
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Backend error: ${res.status}`);
        const data = await res.json();
        reply = data.reply;

        // The window was closed while this was in flight: a reply from an AIssistant
        // that's gone must not open windows or append to a conversation that no longer
        // exists on screen.
        if (controller.signal.aborted || !chatOpenRef.current) return;

        if (data.tool_call) {
          dispatchToolCall(data.tool_call, {
            openCanvas: (project) => openWindow('canvas', { project }),
            openScheduler: () => openWindow('scheduler'),
            openApp: (appId) => openWindow(appId),
          });
        }
      } else {
        reply = "AIssistant isn't fully configured yet — reach out to Pranav directly at pk.kowadkar@gmail.com.";
      }

      if (controller.signal.aborted || !chatOpenRef.current) return;
      if (!reply) throw new Error('Empty reply');
      setTurns((prev) => [...prev, { role: 'model', content: reply }]);
    } catch (err) {
      // Deliberate (window closed / new conversation), not an outage: no "backend is
      // offline" bubble.
      if (!chatOpenRef.current) return;
      if (controller.signal.aborted || (err as { name?: string })?.name === 'AbortError') return;
      console.error('AIssistant error:', err);
      setTurns((prev) => [
        ...prev,
        {
          role: 'model',
          content: "I can't reach my knowledge base right now — the backend seems to be offline. Rather than give you stale or inaccurate info, I'd suggest reaching out to Pranav directly: pk.kowadkar@gmail.com or Telegram @pk_kowadkar. He's usually quick to respond!",
        },
      ]);
    } finally {
      // Only a request that finished normally, in an open window, clears `loading`. A
      // reset already did. When the window was closed under it, `loading` is left set ON
      // PURPOSE: it is what keeps the stored inFlight flag true, so the unanswered
      // question is handed back to the input on the next open instead of hanging in the
      // thread with no reply.
      if (abortRef.current === controller && !controller.signal.aborted && chatOpenRef.current) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(20,20,22,0.8)' }}
      >
        {/* AIssistant Avatar */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 0 12px rgba(229,9,20,0.4)',
            border: '1.5px solid var(--pk-accent)',
            flexShrink: 0,
          }}
        >
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/115134064/qFTubXyXITmAffEZ.png"
            alt="AIssistant"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }}
          />
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#f0f0f2' }}>AIssistant</p>
          <div className="flex items-center gap-1.5">
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30d158', boxShadow: '0 0 6px rgba(48,209,88,0.6)' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#30d158' }}>online</span>
          </div>
        </div>
        <div className="flex items-center gap-3" style={{ marginLeft: 'auto' }}>
          {chat.turns.length > 0 && (
            <button
              onClick={startNewConversation}
              aria-label="New conversation"
              title="New conversation"
              className="flex items-center justify-center transition-colors"
              style={{
                width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.55)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f0f0f2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            >
              <SquarePen size={13} />
            </button>
          )}
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>
            {API_URL ? 'live rag' : 'static'}
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
            >
              {msg.role === 'model' && (
                <div
                  className="flex items-end justify-center shrink-0"
                  style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    overflow: 'hidden',
                    boxShadow: '0 0 8px rgba(229,9,20,0.3)',
                    marginBottom: '2px',
                    border: '1px solid var(--pk-accent)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/115134064/qFTubXyXITmAffEZ.png"
                    alt="AIssistant"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }}
                  />
                </div>
              )}
              <div
                style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user'
                    ? '#E50914'
                    : 'rgba(255,255,255,0.07)',
                  border: msg.role === 'model' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  color: '#f0f0f2',
                  fontSize: '13.5px',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start gap-2"
          >
            <div
              className="flex items-end justify-center shrink-0"
              style={{
                width: '26px', height: '26px', borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: '2px',
                border: '1px solid var(--pk-accent)',
                flexShrink: 0,
              }}
            >
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/115134064/qFTubXyXITmAffEZ.png"
                alt="AIssistant"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }}
              />
            </div>
            <div
              style={{
                padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', gap: '5px', alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggested chips (shown only before first user message) ── */}
      {messages.length === 1 && !loading && (
        <div
          className="shrink-0 px-4 pb-2 flex flex-wrap gap-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          {SUGGESTED_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.75)',
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                transition: 'background 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(229,9,20,0.15)';
                e.currentTarget.style.borderColor = 'rgba(229,9,20,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <div
        className="shrink-0 px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(14,14,16,0.9)' }}
      >
        <div
          className="flex items-center gap-2"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px',
            padding: '8px 8px 8px 16px',
            transition: 'border-color 0.2s',
          }}
          onFocus={() => {}}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask me anything..."
            disabled={loading}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#f0f0f2', fontSize: '13.5px', fontFamily: "'Outfit', sans-serif",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: input.trim() && !loading ? '#E50914' : 'rgba(255,255,255,0.1)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s, transform 0.1s', flexShrink: 0,
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
