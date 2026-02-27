import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const achievements = [
  { icon: '🏆', text: '1st Place — Pulse NYC Hackathon (Search Sentinel)' },
  { icon: '🏆', text: 'n8n Sponsor Prize — ElevenLabs Global Hackathon (EZ OnCall)' },
  { icon: '🎤', text: 'Speaker — LLM Day NYC · March 6, 2026' },
];

export default function AchievementsWidget() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % achievements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="fixed top-8 right-4 z-40"
      style={{ maxWidth: '280px' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20, y: -4 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -20, y: -4 }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            background: 'rgba(28, 28, 30, 0.82)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-start gap-2.5">
            <span style={{ fontSize: '16px', lineHeight: 1.4, flexShrink: 0 }}>
              {achievements[current].icon}
            </span>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '11px',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.5,
              }}
            >
              {achievements[current].text}
            </p>
          </div>

          {/* Dots */}
          <div className="flex gap-1.5 mt-2.5 justify-end">
            {achievements.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: i === current ? '14px' : '5px',
                  height: '5px',
                  borderRadius: '3px',
                  background: i === current ? 'var(--pk-accent)' : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  padding: 0,
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
