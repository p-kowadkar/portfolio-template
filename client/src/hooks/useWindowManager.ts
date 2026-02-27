import { useState, useCallback } from 'react';

export interface WindowState {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  defaultPosition: { x: number; y: number };
  defaultSize: { width: number; height: number };
}

// Helper: center a window of given size on screen, below the hero text
function centered(w: number, h: number, offsetX = 0, offsetY = 0) {
  const sw = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const sh = typeof window !== 'undefined' ? window.innerHeight : 900;
  return {
    x: Math.max(60, Math.round((sw - w) / 2) + offsetX),
    y: Math.max(60, Math.round((sh - h) / 2 - 20) + offsetY),
  };
}

const initialWindows: WindowState[] = [
  {
    id: 'projects',
    title: 'Projects',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 10,
    defaultPosition: centered(960, 600),
    defaultSize: { width: 960, height: 600 },
  },
  {
    id: 'chat',
    title: 'Pai',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 10,
    defaultPosition: centered(420, 580, 40),
    defaultSize: { width: 420, height: 580 },
  },
  {
    id: 'videocall',
    title: 'Video Call — Digital Twin',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 10,
    defaultPosition: centered(560, 460, -20),
    defaultSize: { width: 560, height: 460 },
  },
  {
    id: 'messages',
    title: 'Messages',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 10,
    defaultPosition: centered(460, 520, 60),
    defaultSize: { width: 460, height: 520 },
  },
  {
    id: 'browser',
    title: 'Browser',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 10,
    defaultPosition: centered(1060, 640),
    defaultSize: { width: 1060, height: 640 },
  },
  {
    id: 'cv',
    title: 'Resume — Pranav Kowadkar',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 10,
    defaultPosition: centered(720, 560, 30),
    defaultSize: { width: 720, height: 560 },
  },
  {
    id: 'mystory',
    title: 'My Story — Pranav Kowadkar',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 10,
    defaultPosition: centered(900, 620),
    defaultSize: { width: 900, height: 620 },
  },
  {
    id: 'terminal',
    title: 'Terminal — pk@portfolio',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 10,
    defaultPosition: centered(640, 420),
    defaultSize: { width: 640, height: 420 },
  },
];

export interface WindowManager {
  windows: WindowState[];
  openWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
}

export function useWindowManager(): WindowManager {
  const [windows, setWindows] = useState<WindowState[]>(initialWindows);
  const [topZ, setTopZ] = useState(11);

  const focusWindow = useCallback((id: string) => {
    setTopZ((z) => {
      const newZ = z + 1;
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, zIndex: newZ } : w))
      );
      return newZ;
    });
  }, []);

  const openWindow = useCallback(
    (id: string) => {
      setWindows((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, isOpen: true, isMinimized: false } : w
        )
      );
      focusWindow(id);
    },
    [focusWindow]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, isOpen: false, isMinimized: false, isMaximized: false }
          : w
      )
    );
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      )
    );
  }, []);

  return { windows, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow };
}
