// MobileTerminal — fun iOS terminal easter egg
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';

const COMMANDS: Record<string, string> = {
  help: `Available commands:
  whoami      — who is Pranav?
  skills      — technical skills
  hackathons  — hackathon wins
  contact     — get in touch
  clear       — clear terminal`,
  whoami: `Pranav Kowadkar
AI Engineer · Builder · Hackathon Winner
Based in New Jersey, originally from Belagavi, India.
Currently: AI Engineer @ NJIT Brain Connectivity Lab`,
  skills: `Languages:   Python, TypeScript, Rust, SQL
Frameworks:  FastAPI, React, LangChain, n8n
AI/ML:       Multi-agent systems, RAG, LLMs, RLAIF
Tools:       Supabase, Docker, Git, ElevenLabs
Specialty:   Production multi-agent architectures`,
  hackathons: `🏆 1st Place — Pulse NYC Hackathon
   Search Sentinel (built in 7hrs during a snowstorm)

🏆 n8n Sponsor Prize — ElevenLabs Global Hackathon
   EZ OnCall (voice-first DevOps agent)`,
  contact: `Email:    pk.kowadkar@gmail.com
LinkedIn: linkedin.com/in/pkowadkar
GitHub:   github.com/p-kowadkar
Telegram: @pk_kowadkar`,
};

interface Line {
  type: 'input' | 'output' | 'error';
  text: string;
}

export default function MobileTerminal({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<Line[]>([
    { type: 'output', text: 'pk@portfolio ~ % Welcome to Pranav\'s terminal.' },
    { type: 'output', text: 'Type "help" for available commands.' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleCommand = () => {
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;
    const newLines: Line[] = [...lines, { type: 'input', text: `pk@portfolio ~ % ${cmd}` }];
    if (cmd === 'clear') {
      setLines([{ type: 'output', text: 'pk@portfolio ~ % Terminal cleared.' }]);
    } else if (COMMANDS[cmd]) {
      setLines([...newLines, { type: 'output', text: COMMANDS[cmd] }]);
    } else {
      setLines([...newLines, { type: 'error', text: `command not found: ${cmd}. Try "help".` }]);
    }
    setInput('');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1117', fontFamily: '"SF Mono", "Fira Code", monospace' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-white/10 flex-shrink-0" style={{ background: 'rgba(13,17,23,0.95)' }}>
        <button onClick={onClose} className="flex items-center gap-1 text-[#4ade80]">
          <ChevronLeft size={22} />
        </button>
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-white/40 text-xs flex-1 text-center">pk@portfolio ~ zsh</span>
      </div>

      {/* Terminal output */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {lines.map((line, i) => (
          <div key={i} className="text-xs leading-relaxed whitespace-pre-wrap" style={{
            color: line.type === 'input' ? '#4ade80' : line.type === 'error' ? '#f87171' : 'rgba(255,255,255,0.75)',
          }}>
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 pb-8 pt-3 border-t border-white/10" style={{ background: 'rgba(13,17,23,0.95)' }}>
        <span className="text-[#4ade80] text-xs">pk@portfolio ~ %</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCommand(); }}
          autoFocus
          className="flex-1 bg-transparent text-white text-xs outline-none"
          placeholder="type a command..."
          style={{ caretColor: '#4ade80' }}
        />
      </div>
    </div>
  );
}
