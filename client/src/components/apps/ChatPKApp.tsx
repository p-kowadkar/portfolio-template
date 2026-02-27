// Design: Netflix-dark · macOS chat window aesthetic
// Pai — Pranav's AI Guide. Routes through backend /api/chat for live RAG (journey + resume + GitHub).
// Falls back to direct Gemini call if VITE_API_URL is not set.
// Color: #0a0a0a bg, #E50914 accent, #f5f5f1 body
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
// Fallback: direct Gemini (used only if backend URL not configured)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK SYSTEM PROMPT
// Used only when VITE_API_URL is not set (i.e. no RAG backend configured).
// When the backend IS configured, the prompt lives server-side in main.py and
// is enriched with your journey.txt + resume.txt via RAG — much better quality.
//
// HOW TO CUSTOMIZE:
// Replace the placeholder sections below with your own details.
// The prompt follows a structured format that keeps the AI on-topic and
// speaking in third person about you (never impersonating you).
//
// Sections to fill in:
//   WHO IS [NAME]     — 2-3 sentence identity summary
//   CAREER TIMELINE   — chronological bullet list of roles/milestones
//   KEY PROJECTS      — your 3-5 most impressive projects
//   FUN FACTS         — personal anecdotes that make you memorable
//   CONTACT           — how people should reach you
//   CRITICAL RULES    — constraints for the AI (keep these, adjust as needed)
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_SYSTEM_PROMPT = `You are [AI_GUIDE_NAME] — [YOUR_NAME]'s AI Guide, embedded in their portfolio.
You are a vivid, articulate narrator of their professional journey. Speak with cinematic clarity,
grounded confidence, and human warmth. You are NOT [YOUR_NAME] — you are their assistant,
always speaking in third person.

IDENTITY: If asked if you ARE [YOUR_NAME], respond:
"I'm [AI_GUIDE_NAME] — [YOUR_NAME]'s AI Guide. Let's explore their journey together."

Always speak in third person. Never impersonate [YOUR_NAME]. Never start responses with
"Certainly!" or "Great question!" — just answer naturally. Keep responses conversational
and complete — never cut off mid-sentence. Avoid bullet lists; write in flowing prose.
Aim for 2-4 sentences for simple questions, up to a short paragraph for complex ones.

=== WHO IS [YOUR_NAME] ===
[Replace with a 2-3 sentence summary: who they are, what they do, where they're based,
and what makes them distinctive. This is the first thing the AI guide will draw on.]

=== CAREER TIMELINE ===
[Replace with a chronological bullet list of your key milestones, e.g.:
- [Year]–[Year]: [Degree], [University]
- [Year]–[Year]: [Role], [Company] — [one memorable detail]
- [Year]: [Accomplishment or milestone]
The more specific and human the details, the better.]

=== KEY PROJECTS ===
[Replace with 3-5 projects, e.g.:
- [Project Name]: [One-sentence description]. [Outcome or award if any.]
Include live URLs if the projects are public.]

=== FUN FACTS ===
[Replace with 4-6 personal anecdotes or quirks. These are what make visitors
remember [YOUR_NAME] after they close the tab. Be specific — vague facts are forgettable.]

=== CONTACT ===
[Replace with preferred contact channels: email, LinkedIn, GitHub, etc.]

=== CRITICAL RULES ===
- ALWAYS speak in third person. Say "[YOUR_NAME] built" not "I built".
- If asked something off-topic: "We're drifting off-track — let's get back to [YOUR_NAME]'s journey."
- If you don't know something specific, say "I'm not sure about that one — reach out to [YOUR_NAME] directly."
- If someone asks to contact [YOUR_NAME], direct them to their preferred contact channel above.`;

export default function ChatPKApp() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hey! I'm Pai — Pranav's AI Guide. Ask me anything about his work, projects, or background.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setMessages((prev) => [...prev, userMsg]);
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
        });
        if (!res.ok) throw new Error(`Backend error: ${res.status}`);
        const data = await res.json();
        reply = data.reply;
      } else if (GEMINI_API_KEY) {
        // ── Fallback: direct Gemini (no live RAG) ────────────────────────────
        const history = messages.slice(-6).map((m) => ({
          role: m.role,
          parts: [{ text: m.content }],
        }));
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: FALLBACK_SYSTEM_PROMPT }] },
              contents: [...history, { role: 'user', parts: [{ text }] }],
              generationConfig: { maxOutputTokens: 8192, temperature: 0.8 },
            }),
          }
        );
        if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
        const data = await res.json();
        reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      } else {
        reply = "Pai isn't fully configured yet — reach out to Pranav directly at pk.kowadkar@gmail.com.";
      }

      if (!reply) throw new Error('Empty reply');
      setMessages((prev) => [...prev, { role: 'model', content: reply }]);
    } catch (err) {
      console.error('Pai error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: "I can't reach my knowledge base right now — the backend seems to be offline. Rather than give you stale or inaccurate info, I'd suggest reaching out to Pranav directly: pk.kowadkar@gmail.com or Telegram @pk_kowadkar. He's usually quick to respond!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(20,20,22,0.8)' }}
      >
        {/* Pai Avatar */}
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
            alt="Pai"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }}
          />
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#f0f0f2' }}>Pai</p>
          <div className="flex items-center gap-1.5">
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30d158', boxShadow: '0 0 6px rgba(48,209,88,0.6)' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#30d158' }}>online</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>
          {API_URL ? 'live rag' : 'static'}
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
                    alt="Pai"
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
                alt="Pai"
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
