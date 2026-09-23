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
import { dispatchToolCall, type ToolCall } from '../../lib/toolDispatch';
import { useOpenWindow } from '../../contexts/WindowActionsContext';
import { useIsWindowOpen, useWindowSelf } from '../../contexts/WindowParamsContext';
import { useAIssistantConversation, type AIssistantMessage } from '../../hooks/useAIssistantConversation';

type Message = AIssistantMessage;

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
// A request that never answers used to be cut short by accident: minimizing unmounted this window,
// which aborted it. The window now stays mounted (Sprint 6), so a stalled request (a cold backend
// that never wakes) would keep the input disabled through minimize and restore. Give up after this
// long, generous enough for a cold start.
// (A plain timer that aborts the request's own controller, not AbortSignal.any: that needs Chrome
// 116 / Firefox 124 / Safari 17.4, and on anything older it THROWS before fetch runs, which would
// turn every message into the "backend is offline" reply.)
const CHAT_REQUEST_TIMEOUT_MS = 60_000;

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
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openWindow = useOpenWindow();
  const { isMinimized } = useWindowSelf();
  const minimizedRef = useRef(isMinimized);
  minimizedRef.current = isMinimized;
  // A tool call that arrives while this window is minimized waits here until the visitor restores
  // it. The reply text lands either way, but the ACTION (a new tab, Canvas popping open) belongs to
  // the moment they are looking at the answer that explains it; minimizing used to abort the
  // request, so this never happened.
  const heldToolCallRef = useRef<ToolCall | null>(null);

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
    heldToolCallRef.current = null;
    chat.reset();
    setLoading(false);
    setInput('');
  };

  const runToolCall = (toolCall: ToolCall) => {
    dispatchToolCall(toolCall, {
      openCanvas: (project) => openWindow('canvas', { project }),
      openScheduler: () => openWindow('scheduler'),
      openApp: (appId) => openWindow(appId),
    });
  };
  // Restored: now the visitor can see the reply, so run the action that came with it.
  useEffect(() => {
    if (isMinimized) return;
    const held = heldToolCallRef.current;
    if (!held) return;
    heldToolCallRef.current = null;
    runToolCall(held);
  }, [isMinimized]);

  // Scroll the message list itself, never an anchor element: scrollIntoView scrolls EVERY scrollable
  // ancestor, and a reply landing while this window is minimized would shift the whole desktop and
  // corrupt react-rnd's offset math for every window. (A container's scrollTop also works while
  // hidden, so a restored window is already at the bottom.)
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
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
    // Set when the timer below is what aborted the request: that IS an outage, unlike the deliberate
    // aborts (window closed, new conversation), so the catch and finally must tell them apart.
    let timedOut = false;
    const timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, CHAT_REQUEST_TIMEOUT_MS);
    setTurns((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    // Re-focus the input after sending
    setTimeout(() => inputRef.current?.focus(), 50);

    try {
      let reply = '';
      let toolCall: ToolCall | undefined;

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
        toolCall = data.tool_call;
      } else {
        reply = "AIssistant isn't fully configured yet — reach out to Pranav directly at pk.kowadkar@gmail.com.";
      }

      // The window was closed while this was in flight: a reply from an AIssistant
      // that's gone must not open windows or append to a conversation that no longer
      // exists on screen.
      if (controller.signal.aborted || !chatOpenRef.current) return;

      // A tool call can come back with no accompanying text at all (the model answers
      // purely by opening a window) — that's a valid, expected reply, not a failure.
      // Only the true empty case (neither text nor a tool call) means something actually
      // went wrong.
      if (toolCall) {
        if (minimizedRef.current) heldToolCallRef.current = toolCall;
        else runToolCall(toolCall);
      }
      if (!reply && !toolCall) throw new Error('Empty reply');
      if (reply) setTurns((prev) => [...prev, { role: 'model', content: reply }]);
    } catch (err) {
      // Deliberate (window closed / new conversation), not an outage: no "backend is offline"
      // bubble. A timeout aborts the same controller, so it is recognised first: it is an outage.
      if (!chatOpenRef.current) return;
      if (!timedOut && (controller.signal.aborted || (err as { name?: string })?.name === 'AbortError')) return;
      console.error('AIssistant error:', err);
      setTurns((prev) => [
        ...prev,
        {
          role: 'model',
          content: "I can't reach my knowledge base right now — the backend seems to be offline. Rather than give you stale or inaccurate info, I'd suggest reaching out to Pranav directly: pk.kowadkar@gmail.com or Telegram @pk_kowadkar. He's usually quick to respond!",
        },
      ]);
    } finally {
      clearTimeout(timeoutId);
      // Only a request that finished normally (or timed out), in an open window, clears `loading`. A
      // reset already did. When the window was closed under it, `loading` is left set ON PURPOSE: it
      // is what keeps the stored inFlight flag true, so the unanswered question is handed back to
      // the input on the next open instead of hanging in the thread with no reply.
      if (abortRef.current === controller && (!controller.signal.aborted || timedOut) && chatOpenRef.current) {
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
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
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
                  // Paused while the window is hidden: this loop runs on the JS frame loop, and a stalled
                  // request would otherwise keep it spinning under a hidden window.
                  animate={isMinimized ? { opacity: 0.6, scale: 1 } : { opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                  transition={isMinimized ? { duration: 0 } : { duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
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
