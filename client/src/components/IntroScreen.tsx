// Design: Netflix-Dark × macOS Desktop
// IntroScreen: Shows a "click to enter" overlay first (required for browser autoplay policy),
// then plays the boot sound and runs the pk monogram animation on first user gesture.
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [phase, setPhase] = useState<'waiting' | 'black' | 'enter' | 'hold' | 'dissolve' | 'done'>('waiting');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStarted = useRef(false);

  const startIntro = useCallback(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    setPhase('black');

    // Play the boot sound — this works because it's triggered by a user gesture
    const audio = new Audio('/data/ftQYAfdOCJBKGKBM.mp3');
    audioRef.current = audio;
    audio.volume = 0.7;
    audio.play().catch(() => {});

    // Phase timeline:
    // 0ms     → black screen
    // 300ms   → enter (pk fades in + scales down from 1.4 to 1.0)
    // 1800ms  → dissolve (pk scales up to 2.0 + fades out, red glow expands)
    // 3200ms  → done (transition to desktop)
    const t1 = setTimeout(() => setPhase('enter'), 300);
    const t2 = setTimeout(() => setPhase('dissolve'), 2400);
    const t3 = setTimeout(() => { setPhase('done'); onComplete(); }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
}, [onComplete]);

  useEffect(() => {
  return () => {};
}, []);


  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      <motion.div
        key="intro-overlay"
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: '#000' }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* ── Click-to-enter gate (shown until user interacts) ── */}
        {phase === 'waiting' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            onClick={startIntro}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startIntro(); }}
            tabIndex={0}
            role="button"
            aria-label="Click to enter portfolio"
          >
            {/* Subtle maroon vignette */}
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 50% 60%, rgba(229,9,20,0.08) 0%, transparent 65%)',
              }}
            />

            {/* pk monogram — static, no animation yet */}
            <span
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: '8rem',
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.15)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                userSelect: 'none',
                marginBottom: '48px',
              }}
            >
              pk
            </span>

            {/* Click prompt */}
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  color: 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase',
                }}
              >
                click anywhere to enter
              </span>
              {/* Small chevron down */}
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ opacity: 0.3 }}>
                <path d="M1 1L8 8L15 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          </motion.div>
        )}

        {/* ── Animated intro (shown after click) ── */}
        {phase !== 'waiting' && (
          <>
            {/* Deep red ambient glow — breathes behind the monogram */}
            <motion.div
              className="absolute"
              style={{
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(229,9,20,0.25) 0%, rgba(229,9,20,0.08) 40%, transparent 70%)',
              }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={
                phase === 'dissolve'
                  ? { opacity: 0, scale: 3.5 }
                  : phase === 'enter' || phase === 'hold'
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.3 }
              }
              transition={{
                duration: phase === 'dissolve' ? 1.2 : 1.0,
                ease: 'easeOut',
              }}
            />

            {/* Secondary warm glow ring */}
            <motion.div
              className="absolute"
              style={{
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                border: '1px solid rgba(229,9,20,0.08)',
                boxShadow: '0 0 120px rgba(229,9,20,0.12), inset 0 0 60px rgba(229,9,20,0.05)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={
                phase === 'dissolve'
                  ? { opacity: 0, scale: 4 }
                  : phase === 'enter' || phase === 'hold'
                    ? { opacity: 0.6, scale: 1 }
                    : { opacity: 0, scale: 0.5 }
              }
              transition={{
                duration: phase === 'dissolve' ? 1.0 : 0.8,
                ease: 'easeOut',
              }}
            />

            {/* The pk monogram — the star of the show */}
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={
                phase === 'dissolve'
                  ? { scale: 2.2, opacity: 0, filter: 'blur(12px)' }
                  : phase === 'enter' || phase === 'hold'
                    ? { scale: 1, opacity: 1, filter: 'blur(0px)' }
                    : { scale: 1.5, opacity: 0, filter: 'blur(0px)' }
              }
              transition={{
                duration: phase === 'dissolve' ? 1.2 : 0.9,
                ease: phase === 'dissolve' ? [0.4, 0, 1, 1] : [0, 0, 0.2, 1],
              }}
            >
              {/* Red accent bar — top */}
              <motion.div
                className="absolute"
                style={{
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  height: '3px',
                  background: '#E50914',
                  borderRadius: '2px',
                }}
                initial={{ width: 0, opacity: 0 }}
                animate={
                  phase === 'dissolve'
                    ? { width: 0, opacity: 0 }
                    : phase === 'enter' || phase === 'hold'
                      ? { width: 48, opacity: 1 }
                      : { width: 0, opacity: 0 }
                }
                transition={{ delay: phase === 'enter' ? 0.3 : 0, duration: 0.5, ease: 'easeOut' }}
              />

              <span
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: '8rem',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: '#ffffff',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  textShadow: '0 0 100px rgba(229,9,20,0.5), 0 0 200px rgba(229,9,20,0.25)',
                  userSelect: 'none',
                }}
              >
                pk
              </span>

              {/* Red accent bar — bottom */}
              <motion.div
                className="absolute"
                style={{
                  bottom: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  height: '3px',
                  background: '#E50914',
                  borderRadius: '2px',
                }}
                initial={{ width: 0, opacity: 0 }}
                animate={
                  phase === 'dissolve'
                    ? { width: 0, opacity: 0 }
                    : phase === 'enter' || phase === 'hold'
                      ? { width: 24, opacity: 1 }
                      : { width: 0, opacity: 0 }
                }
                transition={{ delay: phase === 'enter' ? 0.5 : 0, duration: 0.4, ease: 'easeOut' }}
              />
            </motion.div>

            {/* Subtle CRT scan-line overlay for cinematic texture */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
                mixBlendMode: 'multiply',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'enter' || phase === 'hold' ? 1 : 0 }}
              transition={{ duration: 0.4 }}
            />

            {/* Film grain noise overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
                opacity: 0.5,
              }}
            />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
