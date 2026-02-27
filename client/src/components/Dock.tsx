/**
 * Dock.tsx
 * Design: Netflix-Dark × macOS Sonoma Desktop
 *
 * Authentic macOS Sonoma dock:
 *  - Frosted glass pill/shelf sitting 8px above the screen bottom
 *  - 60px icon size (at rest), magnifies to ~80px on hover
 *  - 10px gap between icons, 16px horizontal padding
 *  - 10px vertical padding (top + bottom inside the pill)
 *  - Separator between app windows and external links
 *  - Active indicator: 4px white dot below icon
 *  - Tooltip: rounded pill above icon, SF Pro font
 *  - Dock background: rgba(255,255,255,0.12) with heavy blur — macOS light-on-dark vibrancy
 *  - Subtle 0.5px white border on top edge only (macOS shelf highlight)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
  type MotionValue,
} from 'framer-motion';
import type { WindowManager } from '../hooks/useWindowManager';

interface DockApp {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: () => void;
  external?: string;
}

interface DockProps {
  windowManager: WindowManager;
}

/* ─────────────────────────────────────────────────────────────
   SVG App Icons — macOS-quality with depth, gradients, shadows
   ───────────────────────────────────────────────────────────── */

function FolderIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="fi-back" x1="30" y1="14" x2="30" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#64D2FF" />
          <stop offset="1" stopColor="#0071E3" />
        </linearGradient>
        <linearGradient id="fi-front" x1="30" y1="24" x2="30" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AC8FA" />
          <stop offset="1" stopColor="#0A84FF" />
        </linearGradient>
        <linearGradient id="fi-tab" x1="14" y1="10" x2="14" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#74DAFF" />
          <stop offset="1" stopColor="#5AC8FA" />
        </linearGradient>
        <filter id="fi-drop" x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter="url(#fi-drop)">
        {/* Back panel */}
        <rect x="6" y="15" width="48" height="36" rx="5" fill="url(#fi-back)" />
        {/* Tab */}
        <path d="M6 19 C6 16 8 14 11 14 L21 14 C23 14 24 15 26 18 L28 21 L6 21 Z" fill="url(#fi-tab)" />
        {/* Front panel */}
        <rect x="6" y="24" width="48" height="27" rx="4" fill="url(#fi-front)" />
        {/* Top highlight stripe */}
        <rect x="7" y="25" width="46" height="6" rx="3" fill="rgba(255,255,255,0.22)" />
        {/* Subtle inner lines */}
        <line x1="14" y1="36" x2="46" y2="36" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
        <line x1="14" y1="41" x2="40" y2="41" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="ci-bg" x1="5" y1="5" x2="55" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF3B30" />
          <stop offset="0.55" stopColor="var(--pk-accent)" />
          <stop offset="1" stopColor="#8B0000" />
        </linearGradient>
        <filter id="ci-drop" x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter="url(#ci-drop)">
        <rect x="5" y="5" width="50" height="50" rx="12" fill="url(#ci-bg)" />
        {/* Top sheen */}
        <rect x="5" y="5" width="50" height="25" rx="12" fill="rgba(255,255,255,0.1)" />
        {/* Inner border */}
        <rect x="6" y="6" width="48" height="48" rx="11" stroke="rgba(255,255,255,0.1)" strokeWidth="0.75" fill="none" />
        {/* Chat bubble body */}
        <rect x="14" y="16" width="32" height="21" rx="6" fill="rgba(255,255,255,0.18)" />
        {/* Bubble tail */}
        <path d="M19 37 L15 44 L25 37" fill="rgba(255,255,255,0.18)" />
        {/* pk text */}
        <text x="30" y="31" textAnchor="middle" fontFamily="'DM Serif Display', Georgia, serif" fontSize="13" fontStyle="italic" fill="white" opacity="0.96">pk</text>
      </g>
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="vi-bg" x1="5" y1="5" x2="55" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B68EE" />
          <stop offset="0.5" stopColor="#5E5CE6" />
          <stop offset="1" stopColor="#3634A3" />
        </linearGradient>
        <filter id="vi-drop" x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter="url(#vi-drop)">
        <rect x="5" y="5" width="50" height="50" rx="12" fill="url(#vi-bg)" />
        <rect x="5" y="5" width="50" height="25" rx="12" fill="rgba(255,255,255,0.08)" />
        <rect x="6" y="6" width="48" height="48" rx="11" stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" fill="none" />
        {/* Camera body */}
        <rect x="11" y="19" width="26" height="18" rx="4" fill="rgba(255,255,255,0.88)" />
        {/* Lens */}
        <circle cx="24" cy="28" r="6" fill="rgba(94,92,230,0.55)" />
        <circle cx="24" cy="28" r="3.5" fill="rgba(94,92,230,0.8)" />
        <circle cx="22.5" cy="26.5" r="1.2" fill="rgba(255,255,255,0.5)" />
        {/* Viewfinder */}
        <path d="M39 21 L49 28 L39 35 Z" fill="rgba(255,255,255,0.82)" />
        {/* Rec dot */}
        <circle cx="16" cy="22" r="1.5" fill="#FF3B30" />
      </g>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="mi-bg" x1="5" y1="5" x2="55" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D058" />
          <stop offset="0.5" stopColor="#30D158" />
          <stop offset="1" stopColor="#1A8A3A" />
        </linearGradient>
        <filter id="mi-drop" x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter="url(#mi-drop)">
        <rect x="5" y="5" width="50" height="50" rx="12" fill="url(#mi-bg)" />
        <rect x="5" y="5" width="50" height="25" rx="12" fill="rgba(255,255,255,0.1)" />
        <rect x="6" y="6" width="48" height="48" rx="11" stroke="rgba(255,255,255,0.09)" strokeWidth="0.75" fill="none" />
        {/* Envelope */}
        <rect x="11" y="18" width="38" height="25" rx="3" fill="rgba(255,255,255,0.93)" />
        {/* V-fold */}
        <path d="M11 20 L30 31 L49 20" stroke="rgba(26,138,58,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Top flap */}
        <path d="M11 18 L30 29 L49 18" fill="rgba(255,255,255,0.97)" />
        <path d="M11 18 L30 29 L49 18" stroke="rgba(26,138,58,0.12)" strokeWidth="0.75" fill="none" />
      </g>
    </svg>
  );
}

function BrowserIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="bi-bg" x1="5" y1="5" x2="55" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E90FF" />
          <stop offset="0.5" stopColor="#0A84FF" />
          <stop offset="1" stopColor="#0055CC" />
        </linearGradient>
        <filter id="bi-drop" x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter="url(#bi-drop)">
        <rect x="5" y="5" width="50" height="50" rx="12" fill="url(#bi-bg)" />
        <rect x="5" y="5" width="50" height="25" rx="12" fill="rgba(255,255,255,0.08)" />
        <rect x="6" y="6" width="48" height="48" rx="11" stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" fill="none" />
        {/* Compass ring */}
        <circle cx="30" cy="30" r="15" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" fill="none" />
        <circle cx="30" cy="30" r="13.5" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" fill="none" />
        {/* N needle (red) */}
        <path d="M30 17 L27 30 L30 28 L33 30 Z" fill="#FF3B30" />
        {/* S needle (white) */}
        <path d="M30 43 L33 30 L30 32 L27 30 Z" fill="rgba(255,255,255,0.85)" />
        {/* Cardinal ticks */}
        <line x1="30" y1="14" x2="30" y2="16" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
        <line x1="30" y1="44" x2="30" y2="46" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
        <line x1="14" y1="30" x2="16" y2="30" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
        <line x1="44" y1="30" x2="46" y2="30" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="ti-bg" x1="5" y1="5" x2="55" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#37BBFE" />
          <stop offset="0.5" stopColor="#2AABEE" />
          <stop offset="1" stopColor="#1E96D1" />
        </linearGradient>
        <filter id="ti-drop" x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter="url(#ti-drop)">
        <rect x="5" y="5" width="50" height="50" rx="12" fill="url(#ti-bg)" />
        <rect x="5" y="5" width="50" height="25" rx="12" fill="rgba(255,255,255,0.1)" />
        <rect x="6" y="6" width="48" height="48" rx="11" stroke="rgba(255,255,255,0.09)" strokeWidth="0.75" fill="none" />
        {/* Paper plane */}
        <path d="M13 29 L47 15 L38 46 L28 35 Z" fill="rgba(255,255,255,0.95)" />
        <path d="M28 35 L26 44 L22 39 Z" fill="rgba(255,255,255,0.7)" />
        <path d="M28 35 L38 25" stroke="rgba(255,255,255,0.95)" strokeWidth="1" />
      </g>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="li-bg" x1="5" y1="5" x2="55" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0D7CC4" />
          <stop offset="0.5" stopColor="#0A66C2" />
          <stop offset="1" stopColor="#004182" />
        </linearGradient>
        <filter id="li-drop" x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter="url(#li-drop)">
        <rect x="5" y="5" width="50" height="50" rx="12" fill="url(#li-bg)" />
        <rect x="5" y="5" width="50" height="25" rx="12" fill="rgba(255,255,255,0.08)" />
        <rect x="6" y="6" width="48" height="48" rx="11" stroke="rgba(255,255,255,0.07)" strokeWidth="0.75" fill="none" />
        {/* "in" wordmark */}
        <text x="30" y="38" textAnchor="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="24" fontWeight="bold" fill="white" opacity="0.95">in</text>
      </g>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="gi-bg" x1="5" y1="5" x2="55" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2d2d2d" />
          <stop offset="1" stopColor="#161b22" />
        </linearGradient>
        <filter id="gi-drop" x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter="url(#gi-drop)">
        <rect x="5" y="5" width="50" height="50" rx="12" fill="url(#gi-bg)" />
        <rect x="5" y="5" width="50" height="25" rx="12" fill="rgba(255,255,255,0.06)" />
        <rect x="6" y="6" width="48" height="48" rx="11" stroke="rgba(255,255,255,0.09)" strokeWidth="0.75" fill="none" />
        {/* GitHub octocat */}
        <path d="M30 14 C21 14 14 21 14 30 C14 37 18.5 43 25 45 C25.8 45.2 26.1 44.7 26.1 44.2 C26.1 43.7 26.1 42.2 26.1 40.2 C21 41.2 20 37.7 20 37.7 C19.2 35.7 18 35.2 18 35.2 C16.4 34.2 18.1 34.2 18.1 34.2 C19.8 34.3 20.7 35.9 20.7 35.9 C22.3 38.5 24.9 37.7 26.2 37.2 C26.4 36.1 26.8 35.3 27.3 34.9 C22.9 34.5 18.3 32.8 18.3 25.4 C18.3 23.4 19 21.8 20.2 20.5 C20 20.1 19.4 18.2 20.4 15.7 C20.4 15.7 21.9 15.3 26.1 17.7 C27.8 17.2 29.4 17 31 17 C32.6 17 34.2 17.2 35.9 17.7 C40.1 15.3 41.6 15.7 41.6 15.7 C42.6 18.2 42 20.1 41.8 20.5 C43 21.8 43.7 23.4 43.7 25.4 C43.7 32.8 39.1 34.5 34.7 34.9 C35.4 35.4 36 36.5 36 38.2 C36 40.7 36 43.2 36 44.2 C36 44.7 36.3 45.2 37.1 45 C43.5 43 48 37 48 30 C48 21 41 14 30 14 Z" fill="white" opacity="0.92" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   DockItem — magnification + tooltip + active dot
   ───────────────────────────────────────────────────────────── */

const ICON_SIZE = 60;
const MAGNIFIED_SIZE = 80;
const MAGNIFY_RADIUS = 100;

function DockItem({
  app,
  isOpen,
  mouseX,
}: {
  app: DockApp;
  isOpen: boolean;
  mouseX: MotionValue<number>;
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val: number) => {
    const el = ref.current;
    if (!el) return 1000;
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    return Math.abs(val - center);
  });

  const scale = useTransform(
    distance,
    [0, MAGNIFY_RADIUS / 2, MAGNIFY_RADIUS],
    [MAGNIFIED_SIZE / ICON_SIZE, (MAGNIFIED_SIZE / ICON_SIZE + 1) / 2, 1]
  );
  const springScale = useSpring(scale, { stiffness: 350, damping: 28 });

  const liftY = useTransform(distance, [0, MAGNIFY_RADIUS / 2, MAGNIFY_RADIUS], [-12, -5, 0]);
  const springY = useSpring(liftY, { stiffness: 350, damping: 28 });

  return (
    <div className="relative flex flex-col items-center" style={{ width: ICON_SIZE, flexShrink: 0 }}>
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="dock-tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.1 }}
          >
            {app.label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon */}
      <motion.div
        ref={ref}
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          scale: springScale,
          y: springY,
          cursor: 'pointer',
          originY: 1, // scale from bottom
        }}
        whileTap={{ scale: 0.88 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={app.external ? () => window.open(app.external, '_blank') : app.action}
      >
        {app.icon}
      </motion.div>

      {/* Active indicator dot */}
      <div
        style={{
          width: isOpen ? 4 : 0,
          height: 4,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)',
          marginTop: 4,
          transition: 'all 0.25s ease',
          boxShadow: isOpen ? '0 0 6px rgba(255,255,255,0.6)' : 'none',
          flexShrink: 0,
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   My Story icon — open book with crimson pages
   ───────────────────────────────────────────────────────────── */
function MyStoryIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="ms-bg" x1="5" y1="5" x2="55" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a0a0a" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id="ms-page-l" x1="8" y1="14" x2="30" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f5f5f1" />
          <stop offset="1" stopColor="#d4d4d0" />
        </linearGradient>
        <linearGradient id="ms-page-r" x1="30" y1="14" x2="52" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0f0ec" />
          <stop offset="1" stopColor="#c8c8c4" />
        </linearGradient>
        <filter id="ms-drop" x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      <g filter="url(#ms-drop)">
        {/* Book cover */}
        <rect x="5" y="5" width="50" height="50" rx="12" fill="url(#ms-bg)" />
        <rect x="5" y="5" width="50" height="25" rx="12" fill="rgba(255,255,255,0.04)" />
        <rect x="6" y="6" width="48" height="48" rx="11" stroke="color-mix(in srgb, var(--pk-accent) 25%, transparent)" strokeWidth="0.75" fill="none" />
        {/* Left page */}
        <path d="M10 14 Q10 12 12 12 L29 12 L29 48 Q20 46 12 48 Q10 48 10 46 Z" fill="url(#ms-page-l)" />
        {/* Right page */}
        <path d="M31 12 L48 12 Q50 12 50 14 L50 46 Q50 48 48 48 Q40 46 31 48 Z" fill="url(#ms-page-r)" />
        {/* Spine */}
        <rect x="28.5" y="12" width="3" height="36" fill="color-mix(in srgb, var(--pk-accent) 60%, transparent)" rx="1" />
        {/* Left page lines */}
        <line x1="14" y1="20" x2="27" y2="20" stroke="color-mix(in srgb, var(--pk-accent) 40%, transparent)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="14" y1="25" x2="27" y2="25" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="14" y1="30" x2="27" y2="30" stroke="rgba(0,0,0,0.12)" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="14" y1="35" x2="27" y2="35" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="14" y1="40" x2="24" y2="40" stroke="rgba(0,0,0,0.08)" strokeWidth="0.8" strokeLinecap="round" />
        {/* Right page lines */}
        <line x1="33" y1="20" x2="46" y2="20" stroke="color-mix(in srgb, var(--pk-accent) 40%, transparent)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="33" y1="25" x2="46" y2="25" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="33" y1="30" x2="46" y2="30" stroke="rgba(0,0,0,0.12)" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="33" y1="35" x2="46" y2="35" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="33" y1="40" x2="42" y2="40" stroke="rgba(0,0,0,0.08)" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   CV / Resume icon — macOS Preview-style document icon
   ───────────────────────────────────────────────────────────── */
function CVIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="cv-bg" x1="30" y1="8" x2="30" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f5f5f7" />
          <stop offset="1" stopColor="#d1d1d6" />
        </linearGradient>
        <linearGradient id="cv-fold" x1="42" y1="8" x2="52" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b0b0b8" />
          <stop offset="1" stopColor="#8e8e93" />
        </linearGradient>
        <filter id="cv-drop" x="-10%" y="-5%" width="120%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.35)" />
        </filter>
      </defs>
      {/* Document body */}
      <path d="M12 10 L42 10 L52 20 L52 52 Q52 54 50 54 L12 54 Q10 54 10 52 L10 12 Q10 10 12 10 Z" fill="url(#cv-bg)" filter="url(#cv-drop)" />
      {/* Fold corner */}
      <path d="M42 10 L42 20 L52 20 Z" fill="url(#cv-fold)" />
      {/* Red header bar */}
      <rect x="10" y="10" width="32" height="10" rx="0" fill="var(--pk-accent)" opacity="0.9" />
      {/* Name text lines */}
      <rect x="15" y="26" width="22" height="2.5" rx="1.2" fill="#1c1c1e" opacity="0.7" />
      <rect x="15" y="31" width="16" height="2" rx="1" fill="#3a3a3c" opacity="0.5" />
      {/* Content lines */}
      <rect x="15" y="38" width="26" height="1.8" rx="0.9" fill="#3a3a3c" opacity="0.35" />
      <rect x="15" y="42" width="20" height="1.8" rx="0.9" fill="#3a3a3c" opacity="0.3" />
      <rect x="15" y="46" width="24" height="1.8" rx="0.9" fill="#3a3a3c" opacity="0.25" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id="term-bg" x1="5" y1="5" x2="55" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a1a1a" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
        <filter id="term-drop" x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      <g filter="url(#term-drop)">
        <rect x="5" y="5" width="50" height="50" rx="12" fill="url(#term-bg)" />
        <rect x="6" y="6" width="48" height="48" rx="11" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" fill="none" />
        {/* Title bar */}
        <rect x="5" y="5" width="50" height="14" rx="12" fill="rgba(255,255,255,0.05)" />
        <rect x="5" y="12" width="50" height="7" fill="rgba(255,255,255,0.05)" />
        {/* Traffic lights */}
        <circle cx="16" cy="13" r="3" fill="#FF5F57" />
        <circle cx="24" cy="13" r="3" fill="#FFBD2E" />
        <circle cx="32" cy="13" r="3" fill="#28C840" />
        {/* Prompt */}
        <text x="12" y="31" fontFamily="'DM Mono', monospace" fontSize="8" fill="var(--pk-accent)" opacity="0.9">pk@portfolio ~</text>
        {/* Cursor line */}
        <text x="12" y="41" fontFamily="'DM Mono', monospace" fontSize="8" fill="rgba(255,255,255,0.6)">% _</text>
        <rect x="18" y="35" width="5" height="8" rx="1" fill="var(--pk-accent)" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0;0.7" dur="1.2s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>
  );
}
/* ─────────────────────────────────────────────────────────────
   Dock separator — thin vertical divider, macOS style
   ───────────────────────────────────────────────────────────── */

function DockSeparator() {
  return (
    <div
      style={{
        width: '1px',
        height: '40px',
        background: 'rgba(255,255,255,0.18)',
        margin: '0 6px',
        alignSelf: 'center',
        borderRadius: '1px',
        flexShrink: 0,
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Dock
   ───────────────────────────────────────────────────────────── */

export default function Dock({ windowManager }: DockProps) {
  const { windows, openWindow } = windowManager;
  const mouseX = useMotionValue(Infinity);
  const [dockVisible, setDockVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showDock = useCallback(() => {
    setDockVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setDockVisible(false), 3000);
  }, []);

  // Auto-hide after 3s on mount
  useEffect(() => {
    hideTimer.current = setTimeout(() => setDockVisible(false), 3000);
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  // Show when mouse is within 80px of bottom
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY > window.innerHeight - 80) showDock();
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showDock]);

  const windowApps: DockApp[] = [
    { id: 'projects', label: 'Projects', icon: <FolderIcon />, action: () => openWindow('projects') },
    { id: 'chat', label: 'Pai', icon: <ChatIcon />, action: () => openWindow('chat') },
    { id: 'mystory', label: 'My Story', icon: <MyStoryIcon />, action: () => openWindow('mystory') },
    { id: 'videocall', label: 'Video Call', icon: <VideoIcon />, action: () => openWindow('videocall') },
    { id: 'messages', label: 'Messages', icon: <MailIcon />, action: () => openWindow('messages') },
    { id: 'browser', label: 'Browser', icon: <BrowserIcon />, action: () => openWindow('browser') },
    { id: 'cv', label: 'Resume', icon: <CVIcon />, action: () => openWindow('cv') },
    { id: 'terminal', label: 'Terminal', icon: <TerminalIcon />, action: () => openWindow('terminal') },
  ];

  const externalApps: DockApp[] = [
    { id: 'telegram', label: 'Telegram', icon: <TelegramIcon />, external: 'https://t.me/pk_kowadkar' },
    { id: 'linkedin', label: 'LinkedIn', icon: <LinkedInIcon />, external: 'https://linkedin.com/in/pkowadkar' },
    { id: 'github', label: 'GitHub', icon: <GitHubIcon />, external: 'https://github.com/p-kowadkar' },
  ];

  return (
    /* Outer wrapper: full width, fixed at bottom, pointer-events off so desktop clicks pass through */
    <motion.div
      className="fixed bottom-0 left-0 right-0 flex justify-center z-50"
      style={{ paddingBottom: '8px', pointerEvents: 'none' }}
      animate={{ y: dockVisible ? 0 : 100, opacity: dockVisible ? 1 : 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* The glass pill shelf */}
      <motion.div
        className="flex items-end"
        style={{
          gap: '10px',
          paddingLeft: '16px',
          paddingRight: '16px',
          paddingTop: '10px',
          paddingBottom: '10px',
          /* macOS Sonoma dock: white-tinted vibrancy glass */
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
          borderRadius: '20px',
          /* Top highlight (macOS shelf edge) */
          boxShadow: `
            0 0 0 0.5px rgba(255,255,255,0.3),
            0 1px 0 0 rgba(255,255,255,0.2) inset,
            0 20px 60px rgba(0,0,0,0.5),
            0 4px 16px rgba(0,0,0,0.35)
          `,
          pointerEvents: 'auto',
        }}
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {windowApps.map((app, i) => {
          const win = windows.find((w) => w.id === app.id);
          const isOpen = win ? win.isOpen && !win.isMinimized : false;
          return (
            <DockItem
              key={app.id}
              app={app}
              isOpen={isOpen}
              mouseX={mouseX}
              index={i}
              total={windowApps.length + externalApps.length}
            />
          );
        })}

        <DockSeparator />

        {externalApps.map((app, i) => (
          <DockItem
            key={app.id}
            app={app}
            isOpen={false}
            mouseX={mouseX}
            index={windowApps.length + i}
            total={windowApps.length + externalApps.length}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
