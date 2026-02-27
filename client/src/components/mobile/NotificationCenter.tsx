// NotificationCenter — iOS-style pull-down notification shade
// Triggered by: swiping down from the status bar area
// Shows 3 achievement notifications for Pranav's prizes and speaking opportunities

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NOTIFICATIONS = [
  {
    id: 'llmday',
    app: 'Calendar',
    appIcon: '📅',
    title: 'Speaking at LLM Day NYC',
    body: 'March 6, 2026 · Multi-agent architectures, RLAIF & LLM-as-Judge',
    time: 'Mar 6',
    accent: '#60a5fa',
    badge: 'UPCOMING',
  },
  {
    id: 'pulse',
    app: 'Hackathon',
    appIcon: '🏆',
    title: '1st Place — Pulse NYC Hackathon',
    body: 'Search Sentinel · Real-time AI-powered search threat detection',
    time: 'Jan 2025',
    accent: '#fbbf24',
    badge: 'WINNER',
  },
  {
    id: 'elevenlabs',
    app: 'Hackathon',
    appIcon: '🥇',
    title: 'n8n Sponsor Prize — ElevenLabs Hackathon',
    body: 'EZ OnCall · AI voice agent for on-call engineering workflows',
    time: 'Nov 2024',
    accent: '#34d399',
    badge: 'WINNER',
  },
];

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const shadeRef = useRef<HTMLDivElement>(null);

  // Reset dismissed when reopened
  useEffect(() => {
    if (isOpen) setDismissed([]);
  }, [isOpen]);

  const dismiss = (id: string) => {
    setDismissed((prev) => [...prev, id]);
  };

  const visible = NOTIFICATIONS.filter((n) => !dismissed.includes(n.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Notification shade */}
          <motion.div
            ref={shadeRef}
            className="fixed top-0 left-0 right-0 z-[61] flex flex-col"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            style={{
              background: 'rgba(12,12,12,0.92)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderBottomLeftRadius: '20px',
              borderBottomRightRadius: '20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              paddingBottom: '20px',
            }}
          >
            {/* Status bar area (replicated for continuity) */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <LiveTime />
              <div className="flex items-center gap-1.5">
                {/* Signal */}
                <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
                  <rect x="0" y="8" width="3" height="4" rx="0.5"/>
                  <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5"/>
                  <rect x="9" y="3" width="3" height="9" rx="0.5"/>
                  <rect x="13.5" y="0" width="3" height="12" rx="0.5" opacity="0.35"/>
                </svg>
                {/* WiFi */}
                <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
                  <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
                  <path d="M3.5 6.5C4.9 5.1 6.4 4.3 8 4.3s3.1.8 4.5 2.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <path d="M1 3.8C3 1.8 5.4.7 8 .7s5 1.1 7 3.1" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
                </svg>
                {/* Battery */}
                <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
                  <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="white" strokeOpacity="0.35"/>
                  <rect x="2" y="2" width="16" height="8" rx="2" fill="white"/>
                  <path d="M23 4v4a2 2 0 000-4z" fill="white" fillOpacity="0.4"/>
                </svg>
              </div>
            </div>

            {/* Date header */}
            <div className="px-5 pb-3 pt-1">
              <p className="text-white/90 text-3xl font-light" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Divider */}
            <div className="mx-5 mb-3 h-px bg-white/10" />

            {/* Notifications */}
            <div className="px-4 flex flex-col gap-2.5">
              <AnimatePresence>
                {visible.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: 20, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 60, scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: `1px solid ${notif.accent}22`,
                    }}
                  >
                    {/* Accent left bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-0.5"
                      style={{ background: notif.accent }}
                    />

                    <div className="px-4 py-3 pl-5">
                      {/* App row */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: '12px' }}>{notif.appIcon}</span>
                          <span
                            className="text-white/40 uppercase tracking-widest"
                            style={{ fontSize: '10px', fontFamily: 'monospace' }}
                          >
                            {notif.app}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider"
                            style={{
                              background: `${notif.accent}22`,
                              color: notif.accent,
                              fontFamily: 'monospace',
                            }}
                          >
                            {notif.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white/30 text-[11px]" style={{ fontFamily: 'monospace' }}>
                            {notif.time}
                          </span>
                          <button
                            onClick={() => dismiss(notif.id)}
                            className="text-white/25 hover:text-white/60 transition-colors text-base leading-none"
                            style={{ fontSize: '16px', lineHeight: 1, padding: '0 2px' }}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <p
                        className="text-white font-semibold mb-0.5"
                        style={{
                          fontSize: '14px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        }}
                      >
                        {notif.title}
                      </p>

                      {/* Body */}
                      <p
                        className="text-white/55"
                        style={{
                          fontSize: '12px',
                          lineHeight: 1.4,
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        }}
                      >
                        {notif.body}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {visible.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-white/25 text-sm py-4"
                  style={{ fontFamily: 'monospace' }}
                >
                  no notifications
                </motion.p>
              )}
            </div>

            {/* Pull handle */}
            <div className="flex justify-center mt-5">
              <motion.button
                onClick={onClose}
                className="flex flex-col items-center gap-1"
                whileTap={{ scale: 0.9 }}
              >
                <div className="w-8 h-1 rounded-full bg-white/20" />
                <span className="text-white/20 text-[10px] tracking-widest uppercase" style={{ fontFamily: 'monospace' }}>
                  swipe up to close
                </span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function LiveTime() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  });
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span style={{ fontSize: '15px', fontWeight: 600, color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      {time}
    </span>
  );
}
