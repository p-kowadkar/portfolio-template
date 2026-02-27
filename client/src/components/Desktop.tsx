import { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import type { WindowManager } from '../hooks/useWindowManager';
import MenuBar from './MenuBar';
import Dock from './Dock';
import Window from './Window';
import AchievementsWidget from './AchievementsWidget';
import ProjectsApp from './apps/ProjectsApp';
import ChatPKApp from './apps/ChatPKApp';
import VideoCallApp from './apps/VideoCallApp';
import MessagesApp from './apps/MessagesApp';
import BrowserApp from './apps/BrowserApp';
import CVApp from './apps/CVApp';
import MyStoryApp from './apps/MyStoryApp';
import TerminalApp from './apps/TerminalApp';
import HaikuEasterEgg from './HaikuEasterEgg';

interface DesktopProps {
  windowManager: WindowManager;
}

const appComponents: Record<string, React.ReactNode> = {
  projects: <ProjectsApp />,
  chat: <ChatPKApp />,
  videocall: <VideoCallApp />,
  messages: <MessagesApp />,
  browser: <BrowserApp />,
  cv: <CVApp />,
  mystory: <MyStoryApp />,
  terminal: <TerminalApp />,
};

export default function Desktop({ windowManager }: DesktopProps) {
  const { windows, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow } = windowManager;
  const [desktopClicked, setDesktopClicked] = useState(false);

  const activeWindow = [...windows]
    .filter((w) => w.isOpen && !w.isMinimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0];

  return (
    <div
      className="desktop-noise desktop-root fixed inset-0 overflow-hidden"
      style={{
        backgroundImage: `url('/data/CkFoRkrFcjVdqlKO.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={() => setDesktopClicked(true)}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          zIndex: 0,
        }}
      />

      {/* Menu bar */}
      <MenuBar
        activeApp={activeWindow?.id || null}
        onOpenApp={openWindow}
        onMinimizeAll={() => windows.forEach((w) => w.isOpen && !w.isMinimized && minimizeWindow(w.id))}
        onCloseAll={() => windows.forEach((w) => w.isOpen && closeWindow(w.id))}
        onBringAllToFront={() => windows.forEach((w) => w.isOpen && !w.isMinimized && focusWindow(w.id))}
      />

      {/* Desktop area (between menubar and dock) */}
      <div
        className="absolute inset-0"
        style={{
          top: '28px',
          bottom: '72px',
          zIndex: 2,
        }}
      >
        {/* Hero card */}
        <HeroCard openWindow={openWindow} />

        {/* Desktop icons */}
        <DesktopIcons openWindow={openWindow} />

        {/* Windows */}
        <AnimatePresence>
          {windows.map((win) =>
            win.isOpen && !win.isMinimized ? (
              <Window
                key={win.id}
                {...win}
                onClose={closeWindow}
                onMinimize={minimizeWindow}
                onMaximize={maximizeWindow}
                onFocus={focusWindow}
              >
                {appComponents[win.id]}
              </Window>
            ) : null
          )}
        </AnimatePresence>
      </div>

      {/* Achievements widget */}
      <AchievementsWidget />

      {/* Dock */}
      <Dock windowManager={windowManager} />

      {/* Haiku easter egg — Konami code: ↑↑↓↓←→←→BA */}
      <HaikuEasterEgg />
    </div>
  );
}

function HeroCard({ openWindow }: { openWindow: (id: string) => void }) {
  return (
    <>
      {/* Hero identity block — top-left */}
      <motion.div
        className="absolute"
        style={{
          top: '40px',
          left: '48px',
          zIndex: 1,
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
      >
        <div
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '52px',
            fontStyle: 'italic',
            fontWeight: 400,
            color: '#f0f0f2',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 40px rgba(0,0,0,0.8)',
          }}
        >
          Pranav
        </div>
        <div
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '52px',
            fontStyle: 'italic',
            fontWeight: 400,
            color: 'var(--pk-accent)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            textShadow: '0 0 60px var(--pk-accent-glow)',
          }}
        >
          Kowadkar
        </div>
        <div
          style={{
            marginTop: '10px',
            fontFamily: "'DM Mono', monospace",
            fontSize: '12px',
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          AI Engineer · Builder · Hackathon Winner
        </div>
      </motion.div>

      {/* Hint text — bottom center */}
      <motion.div
        className="absolute"
        style={{
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '11px',
            color: 'rgba(255,255,255,0.18)',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}
        >
          click icons to open · drag windows to move · ↑↑↓↓←→←→BA for a secret
        </p>
      </motion.div>
    </>
  );
}

function DesktopIcons({ openWindow }: { openWindow: (id: string) => void }) {
  // Desktop icons are in the dock — no floating icons needed
  return null;
}
