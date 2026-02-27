// LockScreen — iOS-style lock screen that appears after 60s of inactivity
// Shows: date, time, blurred wallpaper, "slide to unlock" hint
// Dismisses on: tap, swipe up, or any touch

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WALLPAPER = 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/HlEzSRgFAgrgshVP.png';
const IDLE_TIMEOUT = 60_000; // 60 seconds

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [time, setTime] = useState(() => getTime());
  const [date, setDate] = useState(() => getDate());
  const [slideHint, setSlideHint] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTime());
      setDate(getDate());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Pulse the slide hint
  useEffect(() => {
    const t = setInterval(() => setSlideHint((v) => !v), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.35 }}
      onClick={onUnlock}
      onTouchStart={onUnlock}
    >
      {/* Blurred wallpaper */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${WALLPAPER})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.4) blur(12px) saturate(1.3)',
          transform: 'scale(1.05)',
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-16 px-6">
        {/* Top: Time & Date */}
        <div className="flex flex-col items-center mt-8">
          <motion.p
            className="text-white font-thin"
            style={{
              fontSize: '80px',
              lineHeight: 1,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 200,
              letterSpacing: '-2px',
            }}
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            {time}
          </motion.p>
          <p
            className="text-white/70 mt-2"
            style={{
              fontSize: '18px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {date}
          </p>
        </div>

        {/* Middle: pk monogram */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <span
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontStyle: 'italic',
                fontSize: '32px',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              pk
            </span>
          </div>
          <p
            className="text-white/50 text-sm"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
          >
            Pranav Kowadkar
          </p>
        </div>

        {/* Bottom: Slide to unlock */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <motion.div
            className="flex items-center gap-2"
            animate={{ opacity: slideHint ? 0.6 : 0.3 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ x: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12M10 4l6 6-6 6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <span
              className="text-white/50 tracking-widest uppercase"
              style={{ fontSize: '12px', fontFamily: 'monospace' }}
            >
              tap to unlock
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Idle detector hook ────────────────────────────────────────────────────────
export function useIdleLock(timeout = IDLE_TIMEOUT) {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setLocked(true), timeout);
    };

    const events = ['touchstart', 'touchend', 'click', 'keydown'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset(); // start timer on mount

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [timeout]);

  const unlock = useCallback(() => setLocked(false), []);
  return { locked, unlock };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTime() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function getDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
