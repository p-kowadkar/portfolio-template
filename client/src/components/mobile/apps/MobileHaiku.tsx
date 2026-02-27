// MobileHaiku — iOS-style haiku easter egg viewer
// Tap the haiku icon on the springboard to see AI-generated haikus about Pranav

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaikus } from '@/hooks/useHaikus';

interface MobileHaikuProps {
  onClose: () => void;
}

export default function MobileHaiku({ onClose }: MobileHaikuProps) {
  const { haikus, loading, source } = useHaikus();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * Math.max(1, 1)));
  const [direction, setDirection] = useState(1);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);

  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  };
  const handleSwipeEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - swipeStartY.current);
    if (Math.abs(dx) > 50 && dy < 80) {
      if (dx < 0) next();
      else prev();
    }
  };

  const currentHaiku = haikus[index] ?? null;

  const next = useCallback(() => {
    if (haikus.length === 0) return;
    setDirection(1);
    setIndex((i) => (i + 1) % haikus.length);
  }, [haikus.length]);

  const prev = useCallback(() => {
    if (haikus.length === 0) return;
    setDirection(-1);
    setIndex((i) => (i - 1 + haikus.length) % haikus.length);
  }, [haikus.length]);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #0a0000 0%, #1a0505 40%, #0d0d0d 100%)',
      }}
      onTouchStart={handleSwipeStart}
      onTouchEnd={handleSwipeEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-red-400 text-sm font-medium"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7l6 6" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <span
          className="text-white/40 text-xs tracking-widest uppercase"
          style={{ fontFamily: 'monospace' }}
        >
          haiku
          {source === 'backend' && (
            <span className="text-white/20 ml-1">✦ live</span>
          )}
        </span>
        <div className="w-12" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            <p className="text-white/30 text-xs font-mono">generating haiku...</p>
          </div>
        ) : currentHaiku ? (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentHaiku.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-sm"
            >
              {/* Emoji */}
              <div className="text-center mb-8">
                <span style={{ fontSize: '56px' }}>{currentHaiku.emoji}</span>
              </div>

              {/* Haiku lines */}
              <div className="mb-8 text-center">
                {currentHaiku.lines.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    style={{
                      fontFamily: "'DM Serif Display', Georgia, serif",
                      fontStyle: 'italic',
                      fontSize: i === 1 ? '24px' : '20px',
                      color: i === 1 ? '#f5f5f1' : 'rgba(245,245,241,0.65)',
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>

              {/* Fun fact */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl p-4 mb-8"
                style={{
                  background: 'rgba(229,9,20,0.06)',
                  border: '1px solid rgba(229,9,20,0.15)',
                }}
              >
                <p
                  className="text-center"
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.4)',
                    lineHeight: 1.6,
                    fontFamily: 'monospace',
                  }}
                >
                  {currentHaiku.fact}
                </p>
              </motion.div>

              {/* Counter */}
              <p className="text-center text-white/20 text-xs font-mono mb-6">
                {index + 1} / {haikus.length}
              </p>
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="text-white/30 text-sm font-mono text-center">no haikus found</p>
        )}
      </div>

      {/* Navigation */}
      {!loading && haikus.length > 1 && (
        <div className="px-8 pb-12 flex gap-4">
          <button
            onClick={prev}
            className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            }}
          >
            ← prev
          </button>
          <button
            onClick={next}
            className="flex-1 py-3.5 rounded-2xl text-sm font-medium"
            style={{
              background: 'rgba(229,9,20,0.12)',
              border: '1px solid rgba(229,9,20,0.25)',
              color: '#e53e3e',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            }}
          >
            next →
          </button>
        </div>
      )}
    </div>
  );
}
