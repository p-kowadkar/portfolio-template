// MobilePai — iOS Messages-style chat interface for Pai
// Design: Dark maroon/black, iMessage-style bubbles, iOS keyboard behavior
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const FALLBACK_SYSTEM_PROMPT = `You are Pai — Pranav Kowadkar's AI Guide. Speak with cinematic clarity and human warmth. Always speak in third person about Pranav. Never impersonate him. Keep responses conversational, 2-4 sentences. No bullet lists — flowing prose only.

Pranav Kowadkar is an AI Engineer, builder, and hackathon winner based in New Jersey. He grew up in Belagavi, Karnataka, India. He built 15 RC planes and 4 quadcopters from scratch. He studied Mechanical Engineering at KLE Dr. M.S. Sheshgiri College (VTU, 2014–2018), worked at Cognizant, CSIR-NAL, and Dassault Systèmes. Moved to the US in September 2022 for an MS in Data Science at NJIT (graduated May 2024, GPA 3.9). Currently AI Engineer at NJIT Brain Connectivity Lab. Won 1st Place at Pulse NYC Hackathon (Search Sentinel). Won n8n Sponsor Prize at ElevenLabs Hackathon (EZ OnCall). Built CareerForge (live at forge-your-future.com). Speaking at LLM Day NYC on March 6, 2026. Contact: pk.kowadkar@gmail.com | @pk_kowadkar on Telegram.`;

interface Message {
  role: 'user' | 'model';
  content: string;
}

const SUGGESTED = [
  "What's Pranav building right now?",
  "Tell me about his hackathon wins",
  "How did he get into AI?",
];

const PAI_AVATAR = 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/qFTubXyXITmAffEZ.png';

export default function MobilePai({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content }];
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
        });
        if (res.ok) {
          const data = await res.json();
          reply = data.reply || data.message || data.response || '';
        }
      }
      if (!reply && GEMINI_API_KEY) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: FALLBACK_SYSTEM_PROMPT }] },
              contents: newMessages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      }
      if (!reply) {
        reply = "I can't reach my knowledge base right now. Reach out to Pranav directly at pk.kowadkar@gmail.com or Telegram @pk_kowadkar — he's usually quick to respond!";
      }
      setMessages([...newMessages, { role: 'model', content: reply }]);
    } catch {
      setMessages([...newMessages, { role: 'model', content: "I can't reach my knowledge base right now. Contact Pranav at pk.kowadkar@gmail.com or @pk_kowadkar on Telegram." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
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
            <img src={PAI_AVATAR} alt="Pai" className="w-9 h-9 rounded-full object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0a0a0a]" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Pai</p>
            <p className="text-green-400 text-[11px]">Pranav's AI Guide · online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Greeting */}
        <div className="flex gap-2 items-end">
          <img src={PAI_AVATAR} alt="Pai" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontSize: '14px', lineHeight: 1.5 }}>
            Hey! I'm Pai — Pranav's AI Guide. Ask me anything about his work, projects, or background.
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
              <img src={PAI_AVATAR} alt="Pai" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
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
            <img src={PAI_AVATAR} alt="Pai" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
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
