// MobileAIssistant — iOS Messages-style chat interface for AIssistant
// Design: Dark maroon/black, iMessage-style bubbles, iOS keyboard behavior
// Requires VITE_API_URL — no client-side fallback by design, see ChatPKApp.tsx
// (desktop) for the full rationale: the RAG prompt and every API key stay
// server-side in backend/main.py, never in the client bundle.
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronLeft, SquarePen } from 'lucide-react';
import { dispatchToolCall } from '../../../lib/toolDispatch';
import { useAIssistantConversation, type AIssistantMessage } from '../../../hooks/useAIssistantConversation';

type Message = AIssistantMessage;

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

const SUGGESTED = [
  "What's Pranav building right now?",
  "Tell me about his hackathon wins",
  "How did he get into AI?",
];

const AI_AVATAR = 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/qFTubXyXITmAffEZ.png';

// Backend's open_app ids -> mobile's own screen ids. Canvas/scheduler ids
// already match (both sides use 'canvas'/'scheduler'), so only 'cv' needs
// translating.
const APP_ID_TO_MOBILE_SCREEN: Record<string, string> = {
  projects: 'projects',
  mystory: 'mystory',
  cv: 'resume',
};

export default function MobileAIssistant({ onClose, onOpenApp }: { onClose: () => void; onOpenApp?: (id: string, params?: Record<string, unknown>) => void }) {
  const [loading, setLoading] = useState(false);
  // The conversation survives going Home and coming back (and a page reload), and is
  // shared with the desktop AIssistant, so it also follows a phone rotating across the
  // shell swap. The greeting is rendered as static JSX below, so `messages` holds only
  // the real turns.
  const chat = useAIssistantConversation(loading);
  const messages = chat.turns;
  const setMessages = chat.setTurns;
  const [input, setInput] = useState(chat.restoredInput);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The in-flight /api/chat request. AIssistant had no way to cancel it, so going Home
  // mid-reply still ran the tool-call dispatch when the answer arrived and could pop an
  // overlay open over the springboard. Aborted on unmount and when the conversation is
  // reset. There's no "screen is open" signal on mobile the way the desktop window has
  // one (see ChatPKApp.tsx), so a reply landing inside the ~300ms exit animation when the
  // visitor backs out can still get processed -- a known, accepted gap, same as the live
  // site's own mobile AIssistant.
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => { abortRef.current?.abort(); }, []);

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

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content }];
    const controller = new AbortController();
    abortRef.current = controller;
    setMessages(newMessages);
    setLoading(true);
    try {
      let reply = '';
      if (API_URL) {
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            history: newMessages.slice(0, -1).slice(-10).map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          reply = data.reply || data.message || data.response || '';
          if (data.tool_call && onOpenApp) {
            dispatchToolCall(data.tool_call, {
              openCanvas: (project) => onOpenApp('canvas', { project }),
              openScheduler: () => onOpenApp('scheduler'),
              openApp: (appId) => {
                const mobileId = APP_ID_TO_MOBILE_SCREEN[appId];
                if (mobileId) onOpenApp(mobileId);
              },
            });
          }
        }
      }
      // The screen was left (or the conversation reset) while this was in flight: a reply
      // from an AIssistant that's gone must not open overlays or append to a conversation
      // that no longer exists.
      if (controller.signal.aborted) return;
      if (!reply) {
        reply = "I can't reach my knowledge base right now. Reach out to Pranav directly at pk.kowadkar@gmail.com or Telegram @pk_kowadkar — he's usually quick to respond!";
      }
      setMessages([...newMessages, { role: 'model', content: reply }]);
    } catch {
      // Deliberate (screen left / new conversation), not an outage: no "can't reach" bubble.
      if (controller.signal.aborted) return;
      setMessages([...newMessages, { role: 'model', content: "I can't reach my knowledge base right now. Contact Pranav at pk.kowadkar@gmail.com or @pk_kowadkar on Telegram." }]);
    } finally {
      // Only a request that finished normally clears `loading` (a reset already did, and
      // an unmounted AIssistant has nothing to update). Left set on an abort, the stored
      // inFlight flag stays true, so the unanswered question is handed back to the input
      // on the next open.
      if (abortRef.current === controller && !controller.signal.aborted) {
        abortRef.current = null;
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-white/10" style={{ background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(20px)' }}>
        <button onClick={onClose} className="flex items-center gap-1 text-[#e53e3e]">
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <img src={AI_AVATAR} alt="AIssistant" className="w-9 h-9 rounded-full object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0a0a0a]" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">AIssistant</p>
            <p className="text-green-400 text-[11px]">Pranav's AI Guide · online</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={startNewConversation}
            aria-label="New conversation"
            className="flex items-center justify-center w-9 h-9 rounded-full text-white/60"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <SquarePen size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Greeting */}
        <div className="flex gap-2 items-end">
          <img src={AI_AVATAR} alt="AIssistant" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontSize: '14px', lineHeight: 1.5 }}>
            Hey! I'm AIssistant — Pranav's AI Guide. Ask me anything about his work, projects, or background.
          </div>
        </div>

        {/* Suggested chips — only show before first message */}
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 pl-9">
            {SUGGESTED.map((s) => (
              <motion.button
                key={s}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => sendMessage(s)}
                className="self-start text-left text-sm px-4 py-2 rounded-2xl border"
                style={{ background: 'rgba(229,9,20,0.1)', borderColor: 'rgba(229,9,20,0.3)', color: '#ff6b6b', fontSize: '13px' }}
              >
                {s}
              </motion.button>
            ))}
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 items-end ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {msg.role === 'model' && (
              <img src={AI_AVATAR} alt="AIssistant" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            )}
            <div
              className="max-w-[78%] rounded-2xl px-4 py-2.5"
              style={{
                background: msg.role === 'user' ? '#e53e3e' : 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '14px',
                lineHeight: 1.5,
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.role === 'model' ? '4px' : '16px',
              }}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div className="flex gap-2 items-end">
            <img src={AI_AVATAR} alt="AIssistant" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            <div className="rounded-2xl rounded-bl-sm px-4 py-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="w-2 h-2 rounded-full bg-white/40"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-8 pt-3 border-t border-white/10" style={{ background: 'rgba(15,15,15,0.95)' }}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            placeholder="Ask me anything..."
            className="flex-1 rounded-full px-4 py-2.5 text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '14px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity"
            style={{ background: input.trim() ? '#e53e3e' : 'rgba(255,255,255,0.1)', opacity: loading ? 0.5 : 1 }}
          >
            <Send size={15} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
