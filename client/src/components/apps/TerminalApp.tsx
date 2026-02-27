// TerminalApp.tsx
// Design: Netflix-dark · macOS-style terminal with crimson accent
// Commands: help, about, haiku, haiku --all, clear, whoami, skills, contact, easter

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaikus, FALLBACK_HAIKUS } from '@/hooks/useHaikus';

interface OutputLine {
  id: number;
  type: 'input' | 'output' | 'error' | 'haiku' | 'banner' | 'success';
  content: string | string[];
}

const BANNER = [
  '  ██████╗ ██╗  ██╗',
  '  ██╔══██╗██║ ██╔╝',
  '  ██████╔╝█████╔╝ ',
  '  ██╔═══╝ ██╔═██╗ ',
  '  ██║     ██║  ██╗',
  '  ╚═╝     ╚═╝  ╚═╝',
  '',
  '  pranav.kowadkar — v2.0.26',
  '  type "help" for available commands',
  '  type "haiku" for a surprise 🎋',
];

const HELP_TEXT = [
  '  AVAILABLE COMMANDS',
  '  ─────────────────────────────────────',
  '  about          → who is pk?',
  '  skills         → tech stack overview',
  '  contact        → get in touch',
  '  haiku          → random fun-fact haiku',
  '  haiku --all    → all 10 hidden haikus',
  '  easter         → hint for the big easter egg',
  '  clear          → clear terminal',
  '  whoami         → current user info',
  '  ─────────────────────────────────────',
];

const ABOUT_TEXT = [
  '  Pranav Kowadkar — AI/ML Engineer & Builder',
  '',
  '  From Belagavi, Karnataka → Newark, NJ → Silicon Valley',
  '  Mechanical Engineer turned AI Systems Architect.',
  '  Built 15 RC planes before writing his first line of code.',
  '',
  '  Currently: Building Smriti (persistent-memory AI)',
  '  Previously: Dassault Systèmes, Cognizant, NJIT',
  '  Talks: LLM Day NYC — March 6, 2026',
];

const SKILLS_TEXT = [
  '  TECH STACK',
  '  ─────────────────────────────────────',
  '  AI/ML      → PyTorch, Transformers, LangChain, RAG',
  '  Languages  → Python, Rust, C/C++, TypeScript',
  '  Data       → Spark, Kafka, Airflow, dbt, Snowflake',
  '  Cloud      → AWS, GCP, Docker, Kubernetes',
  '  Frontend   → React, Vite, Tailwind',
  '  ─────────────────────────────────────',
];

const CONTACT_TEXT = [
  '  CONTACT',
  '  ─────────────────────────────────────',
  '  email    → pranav.kowadkar@gmail.com',
  '  github   → github.com/p-kowadkar',
  '  linkedin → linkedin.com/in/pranavkowadkar',
  '  ─────────────────────────────────────',
  '  or just use the Messages app →',
];

const EASTER_HINT = [
  '  🥚 EASTER EGG HINT',
  '  ─────────────────────────────────────',
  '  There are 10 hidden haikus scattered',
  '  across this portfolio. Each one encodes',
  '  a real fact from the journey.',
  '',
  '  To unlock them all at once:',
  '  ↑ ↑ ↓ ↓ ← → ← → B A',
  '  (Konami code — on the desktop)',
  '  ─────────────────────────────────────',
];

const WHOAMI_TEXT = [
  '  visitor@pk-portfolio ~ $',
  '  uid=1000(visitor) gid=1000(visitor)',
  '  groups=1000(visitor),4(adm),24(cdrom)',
  '  shell=/bin/zsh',
  '  home=/Users/visitor',
];

let lineCounter = 100;

export default function TerminalApp() {
  const { haikus } = useHaikus();
  const activeHaikus = haikus.length > 0 ? haikus : FALLBACK_HAIKUS;

  const [lines, setLines] = useState<OutputLine[]>([
    { id: 0, type: 'banner', content: BANNER },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const addLines = useCallback((newLines: OutputLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const handleCommand = useCallback((raw: string) => {
    const cmd = raw.trim().toLowerCase();
    const id = () => ++lineCounter;

    // Echo the input
    addLines([{ id: id(), type: 'input', content: `pk@portfolio ~ % ${raw}` }]);

    if (!cmd) return;

    // Save to history
    setHistory((prev) => [raw, ...prev.slice(0, 49)]);
    setHistoryIdx(-1);

    if (cmd === 'clear') {
      setLines([{ id: id(), type: 'banner', content: BANNER }]);
      return;
    }

    if (cmd === 'help') {
      addLines([{ id: id(), type: 'output', content: HELP_TEXT }]);
      return;
    }

    if (cmd === 'about') {
      addLines([{ id: id(), type: 'output', content: ABOUT_TEXT }]);
      return;
    }

    if (cmd === 'skills') {
      addLines([{ id: id(), type: 'output', content: SKILLS_TEXT }]);
      return;
    }

    if (cmd === 'contact') {
      addLines([{ id: id(), type: 'output', content: CONTACT_TEXT }]);
      return;
    }

    if (cmd === 'whoami') {
      addLines([{ id: id(), type: 'output', content: WHOAMI_TEXT }]);
      return;
    }

    if (cmd === 'easter') {
      addLines([{ id: id(), type: 'success', content: EASTER_HINT }]);
      return;
    }

    if (cmd === 'haiku --all') {
      const allLines: OutputLine[] = [
        { id: id(), type: 'output', content: ['  ALL 10 HAIKUS — fun facts disguised as poetry', '  ─────────────────────────────────────'] },
      ];
      activeHaikus.forEach((h: typeof FALLBACK_HAIKUS[0], i: number) => {
        allLines.push({
          id: id(),
          type: 'haiku',
          content: [
            `  ${h.emoji}  #${i + 1}`,
            `     ${h.lines[0]}`,
            `     ${h.lines[1]}`,
            `     ${h.lines[2]}`,
            `     ↳ ${h.fact}`,
            '',
          ],
        });
      });
      addLines(allLines);
      return;
    }

    if (cmd === 'haiku') {
      const h = activeHaikus[Math.floor(Math.random() * activeHaikus.length)];
      addLines([{
        id: id(),
        type: 'haiku',
        content: [
          `  ${h.emoji}`,
          `  ${h.lines[0]}`,
          `  ${h.lines[1]}`,
          `  ${h.lines[2]}`,
          '',
          `  ↳ ${h.fact}`,
          '',
          '  (run again for another, or "haiku --all" to see all 10)',
        ],
      }]);
      return;
    }

    // Unknown command
    addLines([{
      id: id(),
      type: 'error',
      content: [`  zsh: command not found: ${raw}`, '  type "help" for available commands'],
    }]);
  }, [addLines]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(next);
      setInput(history[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(historyIdx - 1, -1);
      setHistoryIdx(next);
      setInput(next === -1 ? '' : history[next] ?? '');
    }
  };

  const lineColor = (type: OutputLine['type']) => {
    switch (type) {
      case 'input': return 'rgba(255,255,255,0.85)';
      case 'error': return '#ff453a';
      case 'haiku': return 'rgba(255,215,100,0.9)';
      case 'success': return '#30d158';
      case 'banner': return 'var(--pk-accent)';
      default: return 'rgba(255,255,255,0.55)';
    }
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'rgba(8,8,10,0.97)', fontFamily: "'DM Mono', 'Fira Code', monospace" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ fontSize: '12px', lineHeight: 1.7 }}>
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
              style={{ color: lineColor(line.type), whiteSpace: 'pre' }}
            >
              {Array.isArray(line.content)
                ? line.content.map((l, i) => <div key={i}>{l}</div>)
                : <div>{line.content}</div>
              }
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.4)' }}
      >
        <span style={{ color: 'var(--pk-accent)', fontSize: '12px', flexShrink: 0 }}>pk@portfolio ~ %</span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '12px',
            fontFamily: "'DM Mono', 'Fira Code', monospace",
            caretColor: 'var(--pk-accent)',
          }}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
