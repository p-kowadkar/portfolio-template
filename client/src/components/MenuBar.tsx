/**
 * MenuBar.tsx
 * Design: Netflix-Dark × macOS Desktop
 * Fixes applied:
 *   1. Accent color propagates everywhere via CSS var (no hardcoded #E50914)
 *   2. Deep Space / AMOLED / Light themes are visually distinct with real wallpapers
 *   3. Light mode adds .light class to <html> for CSS variable overrides
 *   4. MiniCalendar dates are clickable → opens cal.com/pkowadkar with date pre-filled
 *   5. "Schedule a Meeting" button in notification center
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PROFILE_IMAGE =
  'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/UqpYnDLTsOlaAVmS.png';

/* ── Accent colours ── */
const ACCENTS = [
  { id: 'red',    label: 'Netflix Red',  hex: '#E50914' },
  { id: 'blue',   label: 'Electric',     hex: '#0a84ff' },
  { id: 'purple', label: 'Grape',        hex: '#bf5af2' },
  { id: 'orange', label: 'Tangerine',    hex: '#ff9f0a' },
  { id: 'teal',   label: 'Teal',         hex: '#5ac8fa' },
  { id: 'pink',   label: 'Flamingo',     hex: '#ff375f' },
  { id: 'green',  label: 'Mint',         hex: '#30d158' },
];

/* ── Wallpaper themes ── */
const WALLPAPERS = [
  {
    id: 'dark',
    label: 'Neural Dark',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/HlEzSRgFAgrgshVP.png',
    light: false,
    bg: '',
  },
  {
    id: 'deeper',
    label: 'Deep Space',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/ObYSPAusdNNdmwNj.png',
    light: false,
    bg: '#080c14',
  },
  {
    id: 'amoled',
    label: 'AMOLED Black',
    url: '',
    light: false,
    bg: '#000000',
  },
  {
    id: 'light',
    label: 'Light',
    url: 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/aVrZhZVHEEUgSPhi.png',
    light: true,
    bg: '#F5F0E8',
  },
];

/* ── Achievements for notification center ── */
const ACHIEVEMENTS = [
  { icon: '🏆', text: '1st Place — Pulse NYC Hackathon', sub: 'Search Sentinel' },
  { icon: '🏆', text: 'n8n Sponsor Prize — ElevenLabs Global Hackathon', sub: 'EZ OnCall' },
  { icon: '🎤', text: 'Speaker — LLM Day NYC', sub: 'March 6, 2026' },
  { icon: '🚀', text: 'CareerForge — Live Product', sub: 'forge-your-future.com' },
];

interface MenuBarProps {
  activeApp: string | null;
  onOpenApp?: (id: string) => void;
  onMinimizeAll?: () => void;
  onCloseAll?: () => void;
  onBringAllToFront?: () => void;
}

export default function MenuBar({
  activeApp,
  onOpenApp,
  onMinimizeAll,
  onCloseAll,
  onBringAllToFront,
}: MenuBarProps) {
  const [time, setTime] = useState(new Date());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showNotif, setShowNotif] = useState(false);
  const [accentColor, setAccentColor] = useState('#E50914');
  const [wallpaper, setWallpaper] = useState('dark');
  const [isLight, setIsLight] = useState(false);
  const [bugText, setBugText] = useState('');
  const [bugSent, setBugSent] = useState(false);
  const [bugSending, setBugSending] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  /* Live clock */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Close menus on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Apply accent color to CSS variable — propagates to ALL elements using var(--pk-accent) */
  useEffect(() => {
    const hex = accentColor;
    document.documentElement.style.setProperty('--pk-accent', hex);
    // Derive dim (12% opacity) and glow (25% opacity) variants
    document.documentElement.style.setProperty('--pk-accent-dim', hex + '1f');
    document.documentElement.style.setProperty('--pk-accent-glow', hex + '40');
  }, [accentColor]);

  /* Apply wallpaper + light/dark class */
  useEffect(() => {
    const desktop = document.querySelector('.desktop-root') as HTMLElement | null;
    const theme = WALLPAPERS.find((w) => w.id === wallpaper);
    if (!theme) return;

    // Toggle light mode class on <html>
    if (theme.light) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      setIsLight(true);
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      setIsLight(false);
    }

    if (!desktop) return;
    if (theme.url) {
      desktop.style.backgroundImage = `url('${theme.url}')`;
      desktop.style.backgroundSize = 'cover';
      desktop.style.backgroundPosition = 'center';
      desktop.style.backgroundColor = theme.bg || '';
    } else {
      // AMOLED: pure black with radial maroon vignette
      desktop.style.backgroundImage =
        'radial-gradient(ellipse at 50% 80%, rgba(120,0,10,0.18) 0%, transparent 65%)';
      desktop.style.backgroundColor = '#000000';
    }
  }, [wallpaper]);

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const appName =
    {
      projects: 'Finder',
      chat: 'Pai',
      videocall: 'FaceTime',
      messages: 'Messages',
      browser: 'Safari',
      cv: 'Preview',
      mystory: 'My Story',
    }[activeApp ?? ''] ?? 'Finder';

  const toggle = (id: string) => setOpenMenu((prev) => (prev === id ? null : id));
  const hover  = (id: string) => { if (openMenu !== null) setOpenMenu(id); };
  const close  = () => setOpenMenu(null);

  /* ── Anonymous bug report ── */
  const sendBug = useCallback(async () => {
    if (!bugText.trim()) return;
    setBugSending(true);
    try {
      await fetch('https://formspree.io/f/xpwzgkqv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message: bugText,
          _subject: '[pk.portfolio] Anonymous Bug Report',
          source: window.location.href,
          ua: navigator.userAgent,
        }),
      });
      setBugSent(true);
      setBugText('');
      setTimeout(() => { setBugSent(false); close(); }, 2000);
    } catch {
      /* silent fail */
    } finally {
      setBugSending(false);
    }
  }, [bugText]);

  // Text colors adapt to light/dark mode
  const textPrimary = isLight ? 'rgba(28,20,16,0.9)' : 'rgba(255,255,255,0.85)';
  const textSecondary = isLight ? 'rgba(28,20,16,0.55)' : 'rgba(255,255,255,0.45)';
  const menubarBg = isLight
    ? 'rgba(235, 228, 218, 0.90)'
    : 'rgba(20, 20, 22, 0.82)';
  const menubarBorder = isLight
    ? '0.5px solid rgba(100,60,40,0.15)'
    : '0.5px solid rgba(255,255,255,0.07)';

  return (
    <div
      ref={menuRef}
      className="fixed top-0 left-0 right-0 flex items-center justify-between z-[100]"
      style={{
        height: '28px',
        background: menubarBg,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderBottom: menubarBorder,
        paddingLeft: '8px',
        paddingRight: '12px',
      }}
    >
      {/* ── Left: pk + app name + menus ── */}
      <div className="flex items-center h-full relative">

        {/* pk Apple-style menu */}
        <MenuButton label="pk" isOpen={openMenu === 'pk'} onClick={() => toggle('pk')} onHover={() => hover('pk')} serif isLight={isLight} />
        <AnimatePresence>
          {openMenu === 'pk' && (
            <Dropdown onClose={close} minWidth={220} isLight={isLight}>
              {/* Profile header */}
              <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ borderBottom: isLight ? '1px solid rgba(100,60,40,0.1)' : '1px solid rgba(255,255,255,0.07)' }}>
                <img src={PROFILE_IMAGE} alt="Pranav" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--pk-accent)' }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: isLight ? '#1C1410' : '#f0f0f2', lineHeight: 1.3 }}>Pranav Kowadkar</p>
                  <p style={{ fontSize: 10, color: textSecondary, fontFamily: 'monospace' }}>AI Engineer · Builder</p>
                </div>
              </div>
              <div style={{ height: 4 }} />
              <DropItem label="About This Portfolio" onClick={() => { onOpenApp?.('browser'); close(); }} isLight={isLight} />
              <Divider isLight={isLight} />
              <DropItem label="GitHub" shortcut="↗" onClick={() => { window.open('https://github.com/p-kowadkar', '_blank'); close(); }} isLight={isLight} />
              <DropItem label="LinkedIn" shortcut="↗" onClick={() => { window.open('https://linkedin.com/in/pkowadkar', '_blank'); close(); }} isLight={isLight} />
              <DropItem label="Telegram" shortcut="↗" onClick={() => { window.open('https://t.me/pk_kowadkar', '_blank'); close(); }} isLight={isLight} />
              <Divider isLight={isLight} />
              <DropItem label="Email Me" shortcut="✉" onClick={() => { window.open('mailto:pk.kowadkar@gmail.com', '_blank'); close(); }} isLight={isLight} />
            </Dropdown>
          )}
        </AnimatePresence>

        {/* Active app name */}
        <span style={{ fontSize: 13, fontWeight: 600, color: isLight ? '#1C1410' : '#f0f0f2', padding: '0 6px', letterSpacing: '-0.01em', userSelect: 'none' }}>
          {appName}
        </span>

        {/* File */}
        <MenuButton label="File" isOpen={openMenu === 'File'} onClick={() => toggle('File')} onHover={() => hover('File')} isLight={isLight} />
        <AnimatePresence>
          {openMenu === 'File' && (
            <Dropdown onClose={close} minWidth={210} isLight={isLight}>
              <DropItem label="Open Projects" shortcut="⌘P" onClick={() => { onOpenApp?.('projects'); close(); }} isLight={isLight} />
              <DropItem label="Open Pai" shortcut="⌘K" onClick={() => { onOpenApp?.('chat'); close(); }} isLight={isLight} />
              <DropItem label="Open Browser" shortcut="⌘B" onClick={() => { onOpenApp?.('browser'); close(); }} isLight={isLight} />
              <Divider isLight={isLight} />
              <DropItem label="Open Messages" shortcut="⌘M" onClick={() => { onOpenApp?.('messages'); close(); }} isLight={isLight} />
              <DropItem label="Open Video Call" shortcut="⌘V" onClick={() => { onOpenApp?.('videocall'); close(); }} isLight={isLight} />
              <Divider isLight={isLight} />
              <DropItem label="View Resume" shortcut="⌘R" onClick={() => { onOpenApp?.('cv'); close(); }} isLight={isLight} />
              <DropItem label="My Story" shortcut="⌘S" onClick={() => { onOpenApp?.('mystory'); close(); }} isLight={isLight} />
              <Divider isLight={isLight} />
              <DropItem label="View Source on GitHub" shortcut="↗" onClick={() => { window.open('https://github.com/p-kowadkar/pkowadkar-portfolio', '_blank'); close(); }} isLight={isLight} />
            </Dropdown>
          )}
        </AnimatePresence>

        {/* View */}
        <MenuButton label="View" isOpen={openMenu === 'View'} onClick={() => toggle('View')} onHover={() => hover('View')} isLight={isLight} />
        <AnimatePresence>
          {openMenu === 'View' && (
            <Dropdown onClose={close} minWidth={240} isLight={isLight}>
              <SectionLabel label="Appearance" isLight={isLight} />
              {WALLPAPERS.map((w) => (
                <DropItem
                  key={w.id}
                  label={w.label}
                  checked={wallpaper === w.id}
                  onClick={() => { setWallpaper(w.id); close(); }}
                  isLight={isLight}
                />
              ))}
              <Divider isLight={isLight} />
              <SectionLabel label="Accent Color" isLight={isLight} />
              <div className="flex items-center gap-2 px-3 py-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    title={a.label}
                    onClick={() => { setAccentColor(a.hex); close(); }}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: a.hex,
                      border: accentColor === a.hex ? `2px solid ${isLight ? '#1C1410' : '#fff'}` : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'transform 0.1s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                ))}
              </div>
              <Divider isLight={isLight} />
              <SectionLabel label="Go To" isLight={isLight} />
              <DropItem label="Experience" onClick={() => { onOpenApp?.('browser'); close(); }} isLight={isLight} />
              <DropItem label="Education" onClick={() => { onOpenApp?.('browser'); close(); }} isLight={isLight} />
              <DropItem label="CareerForge" shortcut="↗" onClick={() => { window.open('https://www.forge-your-future.com', '_blank'); close(); }} isLight={isLight} />
            </Dropdown>
          )}
        </AnimatePresence>

        {/* Window */}
        <MenuButton label="Window" isOpen={openMenu === 'Window'} onClick={() => toggle('Window')} onHover={() => hover('Window')} isLight={isLight} />
        <AnimatePresence>
          {openMenu === 'Window' && (
            <Dropdown onClose={close} minWidth={230} isLight={isLight}>
              <SectionLabel label="Arrange" isLight={isLight} />
              <DropItem
                label="Tile Side by Side"
                shortcut="⌃⌘T"
                onClick={() => { onOpenApp?.('projects'); onOpenApp?.('browser'); close(); }}
                isLight={isLight}
              />
              <DropItem
                label="Cascade Windows"
                shortcut="⌃⌘C"
                onClick={() => { ['projects','chat','browser','messages'].forEach((id) => onOpenApp?.(id)); close(); }}
                isLight={isLight}
              />
              <Divider isLight={isLight} />
              <SectionLabel label="Manage" isLight={isLight} />
              <DropItem label="Minimize All" shortcut="⌘H" onClick={() => { onMinimizeAll?.(); close(); }} isLight={isLight} />
              <DropItem label="Bring All to Front" onClick={() => { onBringAllToFront?.(); close(); }} isLight={isLight} />
              <DropItem label="Close All" shortcut="⌥⌘W" onClick={() => { onCloseAll?.(); close(); }} destructive isLight={isLight} />
              <Divider isLight={isLight} />
              <SectionLabel label="Open" isLight={isLight} />
              <DropItem label="Projects" shortcut="⌘1" onClick={() => { onOpenApp?.('projects'); close(); }} isLight={isLight} />
              <DropItem label="Pai" shortcut="⌘2" onClick={() => { onOpenApp?.('chat'); close(); }} isLight={isLight} />
              <DropItem label="Browser" shortcut="⌘3" onClick={() => { onOpenApp?.('browser'); close(); }} isLight={isLight} />
              <DropItem label="Messages" shortcut="⌘4" onClick={() => { onOpenApp?.('messages'); close(); }} isLight={isLight} />
              <DropItem label="Video Call" shortcut="⎈5" onClick={() => { onOpenApp?.('videocall'); close(); }} isLight={isLight} />
              <DropItem label="My Story" shortcut="⎈6" onClick={() => { onOpenApp?.('mystory'); close(); }} isLight={isLight} />
            </Dropdown>
          )}
        </AnimatePresence>

        {/* Help */}
        <MenuButton label="Help" isOpen={openMenu === 'Help'} onClick={() => toggle('Help')} onHover={() => hover('Help')} isLight={isLight} />
        <AnimatePresence>
          {openMenu === 'Help' && (
            <Dropdown onClose={close} minWidth={280} isLight={isLight}>
              <SectionLabel label="Something broken?" isLight={isLight} />
              <div className="px-3 pb-1">
                <p style={{ fontSize: 11, color: textSecondary, marginBottom: 8, lineHeight: 1.5 }}>
                  Report it anonymously — Pranav gets notified instantly.
                </p>
                <textarea
                  value={bugText}
                  onChange={(e) => setBugText(e.target.value)}
                  placeholder="Describe what's broken..."
                  rows={3}
                  style={{
                    width: '100%',
                    background: isLight ? 'rgba(100,60,40,0.06)' : 'rgba(255,255,255,0.06)',
                    border: isLight ? '1px solid rgba(100,60,40,0.15)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    color: isLight ? '#1C1410' : '#f0f0f2',
                    fontSize: 11,
                    padding: '6px 8px',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    userSelect: 'text',
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={sendBug}
                  disabled={bugSending || !bugText.trim()}
                  style={{
                    marginTop: 6,
                    width: '100%',
                    padding: '5px 0',
                    borderRadius: 6,
                    background: bugSent ? '#28c840' : 'var(--pk-accent)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    border: 'none',
                    cursor: bugSending || !bugText.trim() ? 'not-allowed' : 'pointer',
                    opacity: bugSending || !bugText.trim() ? 0.5 : 1,
                    transition: 'opacity 0.15s, background 0.15s',
                  }}
                >
                  {bugSent ? '✓ Sent!' : bugSending ? 'Sending…' : 'Send Report'}
                </button>
              </div>
            </Dropdown>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right: system icons + date/time ── */}
      <div className="flex items-center gap-3 h-full">
        {/* Spotlight */}
        <button
          style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', opacity: 0.65, display: 'flex', alignItems: 'center' }}
          onClick={() => {}}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke={isLight ? '#1C1410' : 'white'} strokeWidth="1.4" />
            <line x1="8.5" y1="8.5" x2="12" y2="12" stroke={isLight ? '#1C1410' : 'white'} strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
        {/* Control center dots */}
        <button
          style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', opacity: 0.65, display: 'flex', alignItems: 'center' }}
          onClick={() => {}}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <circle cx="2" cy="2" r="2" fill={isLight ? '#1C1410' : 'white'} />
            <circle cx="8" cy="2" r="2" fill={isLight ? '#1C1410' : 'white'} />
            <circle cx="2" cy="8" r="2" fill={isLight ? '#1C1410' : 'white'} />
            <circle cx="8" cy="8" r="2" fill={isLight ? '#1C1410' : 'white'} />
          </svg>
        </button>
        {/* WiFi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" style={{ opacity: 0.65 }}>
          <circle cx="7.5" cy="10" r="1.2" fill={isLight ? '#1C1410' : 'white'} />
          <path d="M4.5 7.5 Q7.5 5.5 10.5 7.5" stroke={isLight ? '#1C1410' : 'white'} strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M2 5 Q7.5 1.5 13 5" stroke={isLight ? '#1C1410' : 'white'} strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M0 2.5 Q7.5 -1.5 15 2.5" stroke={isLight ? '#1C1410' : 'white'} strokeWidth="1.2" strokeLinecap="round" fill="none" strokeOpacity="0.5" />
        </svg>
        {/* Date + Time — click to open notification center */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotif((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: showNotif ? (isLight ? 'rgba(100,60,40,0.12)' : 'rgba(255,255,255,0.12)') : 'transparent',
              border: 'none',
              borderRadius: 5,
              padding: '2px 6px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (!showNotif) (e.currentTarget as HTMLButtonElement).style.background = isLight ? 'rgba(100,60,40,0.07)' : 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={(e) => { if (!showNotif) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span style={{ fontFamily: '-apple-system, "SF Pro Text", sans-serif', fontSize: 12, color: textSecondary, letterSpacing: '-0.01em' }}>
              {dateStr}
            </span>
            <span style={{ fontFamily: '-apple-system, "SF Pro Text", sans-serif', fontSize: 12, color: isLight ? '#1C1410' : 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em', minWidth: 62, textAlign: 'right' }}>
              {timeStr}
            </span>
          </button>
          {/* Notification Center popover */}
          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.34, 1.1, 0.64, 1] }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  width: 300,
                  background: isLight ? 'rgba(238,232,222,0.98)' : 'rgba(30, 30, 32, 0.96)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  borderRadius: 14,
                  border: isLight ? '1px solid rgba(100,60,40,0.12)' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                  overflow: 'hidden',
                  zIndex: 200,
                }}
              >
                {/* Calendar header */}
                <div style={{ padding: '16px 16px 10px', borderBottom: isLight ? '1px solid rgba(100,60,40,0.08)' : '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontFamily: '-apple-system, "SF Pro Display", sans-serif', fontSize: 28, fontWeight: 200, color: isLight ? '#1C1410' : '#f0f0f2', lineHeight: 1 }}>
                    {time.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                  <p style={{ fontFamily: '-apple-system, "SF Pro Text", sans-serif', fontSize: 13, color: textSecondary, marginTop: 2 }}>
                    {time.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  {/* Mini calendar grid — dates are clickable → cal.com */}
                  <MiniCalendar date={time} isLight={isLight} />
                  {/* Schedule a Meeting CTA */}
                  <button
                    onClick={() => window.open('https://cal.com/pkowadkar', '_blank')}
                    style={{
                      marginTop: 10,
                      width: '100%',
                      padding: '7px 0',
                      borderRadius: 8,
                      background: 'var(--pk-accent)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      letterSpacing: '0.01em',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.85')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                  >
                    📅 Schedule a Meeting
                  </button>
                </div>
                {/* Achievements / notifications */}
                <div style={{ padding: '10px 0 8px' }}>
                  <p style={{ fontFamily: '-apple-system, "SF Pro Text", sans-serif', fontSize: 11, fontWeight: 600, color: textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 16px 6px' }}>
                    Highlights
                  </p>
                  {ACHIEVEMENTS.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-2" style={{ borderBottom: i < ACHIEVEMENTS.length - 1 ? (isLight ? '1px solid rgba(100,60,40,0.06)' : '1px solid rgba(255,255,255,0.04)') : 'none' }}>
                      <span style={{ fontSize: 16, lineHeight: 1.3, flexShrink: 0 }}>{a.icon}</span>
                      <div>
                        <p style={{ fontSize: 12, color: isLight ? '#1C1410' : '#f0f0f2', lineHeight: 1.4 }}>{a.text}</p>
                        <p style={{ fontSize: 10, color: textSecondary, marginTop: 1 }}>{a.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Mini calendar grid — dates clickable → cal.com
   ───────────────────────────────────────────── */
function MiniCalendar({ date, isLight }: { date: Date; isLight: boolean }) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = date.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const openCalendar = (day: number) => {
    // Format date as YYYY-MM-DD for cal.com date param
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    window.open(`https://cal.com/pkowadkar?date=${year}-${mm}-${dd}`, '_blank');
  };

  const dayLabelColor = isLight ? 'rgba(28,20,16,0.3)' : 'rgba(255,255,255,0.3)';
  const dayColor = isLight ? 'rgba(28,20,16,0.65)' : 'rgba(255,255,255,0.65)';

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {days.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9, color: dayLabelColor, fontWeight: 600, letterSpacing: '0.04em' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => (
          <div
            key={i}
            onClick={d ? () => openCalendar(d) : undefined}
            style={{
              textAlign: 'center',
              fontSize: 11,
              lineHeight: '22px',
              borderRadius: '50%',
              width: 22,
              height: 22,
              margin: '0 auto',
              background: d === today ? 'var(--pk-accent)' : 'transparent',
              color: d === today ? '#fff' : d ? dayColor : 'transparent',
              fontWeight: d === today ? 700 : 400,
              cursor: d ? 'pointer' : 'default',
              transition: d ? 'background 0.12s, color 0.12s' : 'none',
            }}
            onMouseEnter={(e) => {
              if (d && d !== today) {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--pk-accent-dim)';
                (e.currentTarget as HTMLDivElement).style.color = 'var(--pk-accent)';
              }
            }}
            onMouseLeave={(e) => {
              if (d && d !== today) {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                (e.currentTarget as HTMLDivElement).style.color = dayColor;
              }
            }}
          >
            {d ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared primitives
   ───────────────────────────────────────────── */
function MenuButton({
  label,
  isOpen,
  onClick,
  onHover,
  serif,
  isLight,
}: {
  label: string;
  isOpen: boolean;
  onClick: () => void;
  onHover: () => void;
  serif?: boolean;
  isLight?: boolean;
}) {
  const textColor = isLight
    ? isOpen ? '#1C1410' : 'rgba(28,20,16,0.85)'
    : isOpen ? '#fff' : 'rgba(255,255,255,0.85)';
  const bgColor = isOpen
    ? (isLight ? 'rgba(100,60,40,0.12)' : 'rgba(255,255,255,0.13)')
    : 'transparent';

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      style={{
        height: '100%',
        padding: '0 8px',
        background: bgColor,
        border: 'none',
        borderRadius: 5,
        color: textColor,
        fontSize: serif ? 14 : 13,
        fontFamily: serif ? "'DM Serif Display', serif" : '-apple-system, "SF Pro Text", sans-serif',
        fontStyle: serif ? 'italic' : 'normal',
        fontWeight: serif ? 400 : 500,
        letterSpacing: serif ? '0' : '-0.01em',
        cursor: 'default',
        transition: 'background 0.1s, color 0.1s',
        whiteSpace: 'nowrap',
      }}
      onMouseLeave={(e) => {
        if (!isOpen) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {label}
    </button>
  );
}

function Dropdown({
  children,
  onClose,
  minWidth = 200,
  isLight,
}: {
  children: React.ReactNode;
  onClose: () => void;
  minWidth?: number;
  isLight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        minWidth,
        background: isLight ? 'rgba(240,234,225,0.98)' : 'rgba(32, 32, 34, 0.97)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRadius: 8,
        border: isLight ? '1px solid rgba(100,60,40,0.12)' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        padding: '4px 0',
        zIndex: 150,
      }}
    >
      {children}
    </motion.div>
  );
}

function DropItem({
  label,
  shortcut,
  onClick,
  disabled,
  checked,
  destructive,
  isLight,
}: {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  checked?: boolean;
  destructive?: boolean;
  isLight?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const normalColor = isLight ? 'rgba(28,20,16,0.82)' : 'rgba(255,255,255,0.82)';
  const disabledColor = isLight ? 'rgba(28,20,16,0.22)' : 'rgba(255,255,255,0.22)';
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '4px 14px',
        background: hov && !disabled ? 'var(--pk-accent)' : 'transparent',
        border: 'none',
        color: disabled
          ? disabledColor
          : destructive
          ? hov ? '#fff' : '#ff453a'
          : hov
          ? '#fff'
          : normalColor,
        fontSize: 12,
        fontFamily: '-apple-system, "SF Pro Text", sans-serif',
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        transition: 'background 0.08s, color 0.08s',
        gap: 8,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {checked !== undefined && (
          <span style={{ width: 12, fontSize: 11, color: checked ? 'var(--pk-accent)' : 'transparent' }}>✓</span>
        )}
        {label}
      </span>
      {shortcut && (
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: hov ? 'rgba(255,255,255,0.55)' : (isLight ? 'rgba(28,20,16,0.28)' : 'rgba(255,255,255,0.28)'), flexShrink: 0 }}>
          {shortcut}
        </span>
      )}
    </button>
  );
}

function SectionLabel({ label, isLight }: { label: string; isLight?: boolean }) {
  return (
    <p style={{
      fontSize: 10,
      fontWeight: 700,
      color: isLight ? 'rgba(28,20,16,0.35)' : 'rgba(255,255,255,0.28)',
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      padding: '6px 14px 3px',
      fontFamily: '-apple-system, "SF Pro Text", sans-serif',
    }}>
      {label}
    </p>
  );
}

function Divider({ isLight }: { isLight?: boolean }) {
  return <div style={{ height: 1, background: isLight ? 'rgba(100,60,40,0.1)' : 'rgba(255,255,255,0.07)', margin: '3px 0' }} />;
}
