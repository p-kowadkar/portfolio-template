// MobileShell — iOS springboard-style shell for pkowadkar.com
// Design: Dark maroon/black iOS aesthetic, frosted glass dock, live status bar
// Renders only on mobile (< 768px). Desktop experience is unchanged.

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobilePai from './apps/MobilePai';
import MobileProjects from './apps/MobileProjects';
import MobileMyStory from './apps/MobileMyStory';
import MobileResume from './apps/MobileResume';
import MobileTerminal from './apps/MobileTerminal';
import MobileContact from './apps/MobileContact';
import MobileHaiku from './apps/MobileHaiku';
import NotificationCenter from './NotificationCenter';
import LockScreen, { useIdleLock } from './LockScreen';

// ── Wallpaper (same CDN as desktop) ─────────────────────────────────────────
const WALLPAPER = 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/HlEzSRgFAgrgshVP.png';
const PROFILE_PHOTO = 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/UqpYnDLTsOlaAVmS.png';

// ── App registry ─────────────────────────────────────────────────────────────
type AppId = 'pai' | 'projects' | 'mystory' | 'resume' | 'terminal' | 'contact' | 'haiku' | 'github' | 'linkedin' | 'telegram' | 'careerforge';

interface AppDef {
  id: AppId;
  label: string;
  icon: React.ReactNode;
  external?: string;
}

// ── SVG Icons (iOS-style, matching desktop quality) ──────────────────────────
function PaiIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="60" height="60" rx="13" fill="url(#pai_grad)"/>
      <defs>
        <linearGradient id="pai_grad" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a0a0a"/>
          <stop offset="1" stopColor="#3d0000"/>
        </linearGradient>
      </defs>
      <circle cx="30" cy="22" r="9" fill="#fff" fillOpacity="0.15" stroke="#e53e3e" strokeWidth="1.5"/>
      <circle cx="30" cy="22" r="5" fill="#e53e3e"/>
      <path d="M16 44c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="30" cy="22" r="2" fill="#fff"/>
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="60" height="60" rx="13" fill="url(#proj_grad)"/>
      <defs>
        <linearGradient id="proj_grad" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a1a2e"/>
          <stop offset="1" stopColor="#16213e"/>
        </linearGradient>
      </defs>
      <rect x="12" y="20" width="36" height="26" rx="3" fill="none" stroke="#60a5fa" strokeWidth="1.5"/>
      <path d="M12 26h36" stroke="#60a5fa" strokeWidth="1.5"/>
      <rect x="17" y="14" width="12" height="8" rx="2" fill="#60a5fa" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="1.5"/>
      <rect x="18" y="31" width="10" height="2" rx="1" fill="#60a5fa" fillOpacity="0.7"/>
      <rect x="18" y="36" width="16" height="2" rx="1" fill="#60a5fa" fillOpacity="0.5"/>
      <rect x="18" y="41" width="12" height="2" rx="1" fill="#60a5fa" fillOpacity="0.3"/>
    </svg>
  );
}

function MyStoryIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="60" height="60" rx="13" fill="url(#story_grad)"/>
      <defs>
        <linearGradient id="story_grad" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f2027"/>
          <stop offset="1" stopColor="#203a43"/>
        </linearGradient>
      </defs>
      <path d="M30 12 L44 20 L44 40 L30 48 L16 40 L16 20 Z" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
      <path d="M30 12 L30 48" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2"/>
      <circle cx="30" cy="24" r="3" fill="#f59e0b"/>
      <circle cx="30" cy="36" r="3" fill="#f59e0b" fillOpacity="0.6"/>
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="60" height="60" rx="13" fill="url(#resume_grad)"/>
      <defs>
        <linearGradient id="resume_grad" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a0a0a"/>
          <stop offset="1" stopColor="#2d1515"/>
        </linearGradient>
      </defs>
      <rect x="15" y="10" width="30" height="40" rx="3" fill="none" stroke="#f87171" strokeWidth="1.5"/>
      <path d="M21 20h18M21 26h18M21 32h12M21 38h8" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="15" y="10" width="30" height="8" rx="3" fill="#f87171" fillOpacity="0.2"/>
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="60" height="60" rx="13" fill="#0d1117"/>
      <rect x="10" y="14" width="40" height="32" rx="4" fill="#161b22" stroke="#30363d" strokeWidth="1"/>
      <path d="M16 24l6 5-6 5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26 34h14" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="60" height="60" rx="13" fill="url(#contact_grad)"/>
      <defs>
        <linearGradient id="contact_grad" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0a1628"/>
          <stop offset="1" stopColor="#1e3a5f"/>
        </linearGradient>
      </defs>
      <rect x="12" y="18" width="36" height="26" rx="4" fill="none" stroke="#38bdf8" strokeWidth="1.5"/>
      <path d="M12 22l18 13 18-13" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="60" height="60" rx="13" fill="#161b22"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M30 13C20.06 13 12 21.06 12 31c0 7.96 5.16 14.71 12.32 17.1.9.16 1.23-.39 1.23-.87v-3.03c-5.01 1.09-6.07-2.41-6.07-2.41-.82-2.08-2-2.63-2-2.63-1.63-1.12.12-1.09.12-1.09 1.81.13 2.76 1.85 2.76 1.85 1.6 2.75 4.2 1.95 5.23 1.49.16-1.16.63-1.95 1.14-2.4-3.99-.45-8.19-2-8.19-8.88 0-1.96.7-3.57 1.85-4.82-.19-.46-.8-2.28.17-4.75 0 0 1.51-.48 4.94 1.84A17.2 17.2 0 0130 22.7c1.53.01 3.07.21 4.5.61 3.43-2.32 4.94-1.84 4.94-1.84.97 2.47.36 4.29.18 4.75 1.15 1.25 1.84 2.86 1.84 4.82 0 6.9-4.2 8.42-8.21 8.86.65.56 1.22 1.65 1.22 3.33v4.94c0 .48.33 1.04 1.24.87C42.85 45.7 48 38.96 48 31c0-9.94-8.06-18-18-18z" fill="white"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="60" height="60" rx="13" fill="#0077b5"/>
      <path d="M18 24h6v18h-6V24zM21 21a3 3 0 110-6 3 3 0 010 6zM26 24h5.7v2.5h.08C32.8 24.7 35 23 38.2 23c5.2 0 6.8 3.2 6.8 7.4V42h-6V31.5c0-2.5-.05-5.7-3.5-5.7-3.5 0-4 2.7-4 5.5V42H26V24z" fill="white"/>
    </svg>
  );
}

function HaikuIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="60" height="60" rx="13" fill="url(#haiku_grad)"/>
      <defs>
        <linearGradient id="haiku_grad" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a0505"/>
          <stop offset="1" stopColor="#2d0a0a"/>
        </linearGradient>
      </defs>
      {/* Brush stroke lines — haiku poetry feel */}
      <path d="M16 20 Q30 17 44 20" stroke="#e53e3e" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M20 29 Q30 26 40 29" stroke="#e53e3e" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.65"/>
      <path d="M18 38 Q30 35 42 38" stroke="#e53e3e" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/>
      {/* Cherry blossom dot */}
      <circle cx="30" cy="12" r="3" fill="#e53e3e" opacity="0.8"/>
      <circle cx="30" cy="12" r="1.5" fill="#fff" opacity="0.6"/>
    </svg>
  );
}

function CareerForgeIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="60" height="60" rx="13" fill="url(#cf_grad)"/>
      <defs>
        <linearGradient id="cf_grad" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0a0a1a"/>
          <stop offset="1" stopColor="#1a1a3a"/>
        </linearGradient>
      </defs>
      {/* Anvil/forge shape */}
      <rect x="18" y="28" width="24" height="10" rx="2" fill="#6366f1" opacity="0.9"/>
      <rect x="22" y="22" width="16" height="8" rx="2" fill="#818cf8"/>
      {/* Spark */}
      <circle cx="38" cy="20" r="2" fill="#fbbf24"/>
      <path d="M36 18 L40 16 M38 22 L42 22" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
      {/* CF text */}
      <text x="30" y="46" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="monospace" opacity="0.7">FORGE</text>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="60" height="60" rx="13" fill="#229ED9"/>
      <path d="M12 30l6 2 3 9 4-5 8 6 7-22-28 10z" fill="white" fillOpacity="0.9"/>
      <path d="M18 32l3 9 4-5" stroke="#229ED9" strokeWidth="1"/>
      <path d="M21 41l8-8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── Live Status Bar ───────────────────────────────────────────────────────────
function StatusBar() {
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
    <div className="flex items-center justify-between px-5 pt-3 pb-1 text-white text-xs font-semibold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      <span style={{ fontSize: '15px', fontWeight: 600 }}>{time}</span>
      <div className="flex items-center gap-1.5">
        {/* Signal bars */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
          <rect x="0" y="8" width="3" height="4" rx="0.5" opacity="1"/>
          <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" opacity="1"/>
          <rect x="9" y="3" width="3" height="9" rx="0.5" opacity="1"/>
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
  );
}

// ── App Icon Component ────────────────────────────────────────────────────────
function AppIcon({ app, onTap, badge }: { app: AppDef; onTap: (id: AppId) => void; badge?: number }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1.5 cursor-pointer select-none"
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={() => {
        if (app.external) {
          window.open(app.external, '_blank');
        } else {
          onTap(app.id);
        }
      }}
    >
      <div className="relative w-[60px] h-[60px]">
        <div className="w-full h-full rounded-[13px] overflow-hidden shadow-lg" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
          {app.icon}
        </div>
        {badge && badge > 0 && (
          <div
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: '#e53e3e', fontSize: '10px', padding: '0 4px', fontFamily: 'monospace', boxShadow: '0 2px 6px rgba(229,62,62,0.6)' }}
          >
            {badge}
          </div>
        )}
      </div>
      <span className="text-white text-[11px] font-medium text-center leading-tight drop-shadow-md" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
        {app.label}
      </span>
    </motion.div>
  );
}

// ── App Screen Wrapper ────────────────────────────────────────────────────────
function AppScreen({ appId, onClose }: { appId: AppId; onClose: () => void }) {
  const renderApp = () => {
    switch (appId) {
      case 'pai': return <MobilePai onClose={onClose} />;
      case 'projects': return <MobileProjects onClose={onClose} />;
      case 'mystory': return <MobileMyStory onClose={onClose} />;
      case 'resume': return <MobileResume onClose={onClose} />;
      case 'terminal': return <MobileTerminal onClose={onClose} />;
      case 'contact': return <MobileContact onClose={onClose} />;
      case 'haiku': return <MobileHaiku onClose={onClose} />;
      default: return null;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {renderApp()}
    </motion.div>
  );
}

// ── Main MobileShell ──────────────────────────────────────────────────────────
export default function MobileShell() {
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [paiOpened, setPaiOpened] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const { locked, unlock } = useIdleLock(60_000);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);

  // Hide swipe hint after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowSwipeHint(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // Swipe-down from top 60px to open notification center
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dt = Date.now() - touchStartTime.current;
    const startedNearTop = touchStartY.current < 60;
    if (startedNearTop && dy > 50 && dt < 600) {
      setNotifOpen(true);
    }
  };

  const handleOpenApp = (id: AppId) => {
    if (id === 'pai') setPaiOpened(true);
    setActiveApp(id);
  };

  const gridApps: AppDef[] = [
    { id: 'pai', label: 'Pai', icon: <PaiIcon /> },
    { id: 'projects', label: 'Projects', icon: <ProjectsIcon /> },
    { id: 'mystory', label: 'My Story', icon: <MyStoryIcon /> },
    { id: 'resume', label: 'Resume', icon: <ResumeIcon /> },
    { id: 'terminal', label: 'Terminal', icon: <TerminalIcon /> },
    { id: 'contact', label: 'Contact', icon: <ContactIcon /> },
    { id: 'haiku', label: 'Haiku', icon: <HaikuIcon /> },
    { id: 'github', label: 'GitHub', icon: <GitHubIcon />, external: 'https://github.com/p-kowadkar' },
    { id: 'linkedin', label: 'LinkedIn', icon: <LinkedInIcon />, external: 'https://linkedin.com/in/pkowadkar' },
    { id: 'telegram', label: 'Telegram', icon: <TelegramIcon />, external: 'https://t.me/pk_kowadkar' },
    { id: 'careerforge', label: 'CareerForge', icon: <CareerForgeIcon />, external: 'https://forge-your-future.com' },
  ];

  const dockApps: AppDef[] = [
    { id: 'pai', label: 'Pai', icon: <PaiIcon /> },
    { id: 'projects', label: 'Projects', icon: <ProjectsIcon /> },
    { id: 'mystory', label: 'My Story', icon: <MyStoryIcon /> },
    { id: 'resume', label: 'Resume', icon: <ResumeIcon /> },
  ];

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: '#000' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Wallpaper */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${WALLPAPER})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.55) saturate(1.2)',
        }}
      />
      {/* Gradient overlay for readability */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.5) 100%)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Status Bar — tap to open notification center */}
        <div onClick={() => setNotifOpen(true)} className="cursor-pointer">
          <StatusBar />
        </div>

        {/* Profile greeting */}
        <div className="flex flex-col items-center mt-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 shadow-xl mb-2">
            <img src={PROFILE_PHOTO} alt="Pranav Kowadkar" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-white font-semibold text-lg tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
            Pranav Kowadkar
          </h1>
          <p className="text-white/60 text-xs tracking-widest uppercase mt-0.5">AI Engineer · Builder</p>
        </div>

        {/* App Grid */}
        <div className="flex-1 px-6">
          <div className="grid grid-cols-3 gap-y-6 gap-x-4 justify-items-center">
            {gridApps.map((app) => (
              <AppIcon key={app.id} app={app} onTap={handleOpenApp} badge={app.id === 'pai' && !paiOpened ? 1 : undefined} />
            ))}
          </div>
        </div>

        {/* Bottom Dock */}
        <div className="px-6 pb-8 pt-4">
          <div
            className="flex items-center justify-around py-3 px-4 rounded-3xl"
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {dockApps.map((app) => (
              <motion.div
                key={app.id}
                className="flex flex-col items-center gap-1 cursor-pointer"
                whileTap={{ scale: 0.88 }}
                onClick={() => setActiveApp(app.id)}
              >
                <div className="w-[52px] h-[52px] rounded-[12px] overflow-hidden shadow-md">
                  {app.icon}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Swipe hint */}
      <AnimatePresence>
        {showSwipeHint && (
          <motion.div
            className="absolute top-10 left-0 right-0 flex flex-col items-center pointer-events-none z-20"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v10M4 8l4 4 4-4" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <span className="text-white/30 text-[9px] tracking-widest uppercase mt-0.5" style={{ fontFamily: 'monospace' }}>swipe down for notifications</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock Screen */}
      <AnimatePresence>
        {locked && <LockScreen onUnlock={unlock} />}
      </AnimatePresence>

      {/* Notification Center */}
      <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* App Screens */}
      <AnimatePresence>
        {activeApp && (
          <AppScreen key={activeApp} appId={activeApp} onClose={() => setActiveApp(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
