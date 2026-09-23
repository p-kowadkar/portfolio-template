import { useState, useCallback } from 'react';
import {
  getViewport, bringToFront, openWindowIn, restoreWindowIn, closeWindowIn, cancelCloseIn, minimizeWindowIn,
  maximizeWindowIn, setCompactIn, setGeometryIn, setPolicyIn, resetRuntimeIn, clampAllIn,
  type WindowLike, type Point, type Size, type MinimizeMode, type CloseGuard,
} from '../lib/windowState';

/** A desktop window. The pure fields (flags, z-order, frame) live in lib/windowState.ts along
 *  with the logic that changes them; this adds what only the manager and the UI need. */
export interface WindowState extends WindowLike {
  title: string;
  // isCompact (in WindowLike) shrinks the window into a small always-on-top corner bubble
  // instead of closing it -- used by the Digital Twin call so it can keep running while a tool
  // call opens Canvas/Scheduler on top of it. See Window.tsx and VideoCallApp.tsx.
  //
  // params (in WindowLike), e.g. { project: 'careerforge' } for the canvas window, is set by
  // openWindow's second argument and read by whatever component the window id renders.
}

const initialWindows: WindowState[] = [
  {
    id: 'projects',
    title: 'Projects',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    isCompact: false,
    zIndex: 10,
    position: null,
    size: null,
    minimizeMode: 'hide',
    closeGuard: null,
    closeRequested: false,
    defaultOffset: { x: 0, y: 0 },
    defaultSize: { width: 960, height: 600 },
  },
  {
    id: 'chat',
    title: 'AIssistant',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    isCompact: false,
    zIndex: 10,
    position: null,
    size: null,
    minimizeMode: 'hide',
    closeGuard: null,
    closeRequested: false,
    defaultOffset: { x: 40, y: 0 },
    defaultSize: { width: 420, height: 580 },
  },
  {
    id: 'videocall',
    title: 'Video Call — Digital Twin',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    isCompact: false,
    zIndex: 10,
    position: null,
    size: null,
    minimizeMode: 'hide',
    closeGuard: null,
    closeRequested: false,
    defaultOffset: { x: -20, y: 0 },
    defaultSize: { width: 560, height: 460 },
  },
  {
    id: 'messages',
    title: 'Messages',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    isCompact: false,
    zIndex: 10,
    position: null,
    size: null,
    minimizeMode: 'hide',
    closeGuard: null,
    closeRequested: false,
    defaultOffset: { x: 60, y: 0 },
    defaultSize: { width: 460, height: 520 },
  },
  {
    id: 'browser',
    title: 'Browser',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    isCompact: false,
    zIndex: 10,
    position: null,
    size: null,
    minimizeMode: 'hide',
    closeGuard: null,
    closeRequested: false,
    defaultOffset: { x: 0, y: 0 },
    defaultSize: { width: 1060, height: 640 },
  },
  {
    id: 'cv',
    title: 'Resume — Pranav Kowadkar',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    isCompact: false,
    zIndex: 10,
    position: null,
    size: null,
    minimizeMode: 'hide',
    closeGuard: null,
    closeRequested: false,
    defaultOffset: { x: 30, y: 0 },
    defaultSize: { width: 720, height: 560 },
  },
  {
    id: 'mystory',
    title: 'My Story — Pranav Kowadkar',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    isCompact: false,
    zIndex: 10,
    position: null,
    size: null,
    minimizeMode: 'hide',
    closeGuard: null,
    closeRequested: false,
    defaultOffset: { x: 0, y: 0 },
    defaultSize: { width: 900, height: 620 },
  },
  {
    id: 'terminal',
    title: 'Terminal — pk@portfolio',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    isCompact: false,
    zIndex: 10,
    position: null,
    size: null,
    minimizeMode: 'hide',
    closeGuard: null,
    closeRequested: false,
    defaultOffset: { x: 0, y: 0 },
    defaultSize: { width: 640, height: 420 },
  },
  {
    id: 'canvas',
    title: 'Canvas',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    isCompact: false,
    zIndex: 10,
    position: null,
    size: null,
    minimizeMode: 'hide',
    closeGuard: null,
    closeRequested: false,
    defaultOffset: { x: 10, y: 0 },
    defaultSize: { width: 760, height: 560 },
  },
  {
    id: 'scheduler',
    title: 'Schedule a Call',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    isCompact: false,
    zIndex: 10,
    position: null,
    size: null,
    minimizeMode: 'hide',
    closeGuard: null,
    closeRequested: false,
    defaultOffset: { x: 0, y: 0 },
    defaultSize: { width: 900, height: 700 },
  },
];

export interface WindowManager {
  windows: WindowState[];
  openWindow: (id: string, params?: Record<string, unknown>) => void;
  /** Un-minimize a window (no params) and bring it to the front. */
  restoreWindow: (id: string) => void;
  /** Close (quit) a window. A window with a closeGuard raises its confirm sheet instead, unless
   *  `force` is set (only the sheet's confirm button passes it). */
  closeWindow: (id: string, force?: boolean) => void;
  /** The visitor answered the confirm sheet with Cancel. */
  cancelClose: (id: string) => void;
  /** Yellow light: hides the window, or (minimizeMode 'compact') shrinks it into the corner bubble. */
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  setWindowCompact: (id: string, compact: boolean) => void;
  /** A drag/resize finished: store the window's new frame. */
  setWindowGeometry: (id: string, patch: { position?: Point; size?: Size }) => void;
  /** The browser was resized: pull every remembered frame back inside the desktop area. */
  clampWindowsToViewport: () => void;
  /** An app declares what yellow does for its window and whether closing it needs confirming. */
  setWindowPolicy: (id: string, patch: { minimizeMode?: MinimizeMode; closeGuard?: CloseGuard | null }) => void;
  /** An app instance is gone without a close: drop the bubble and policy it left behind. */
  resetWindowRuntime: (id: string) => void;
}

// Each action is a thin wrapper over a pure transformer in lib/windowState.ts, which is where
// the semantics (and the tests) live. They read the viewport at call time, inside the updater.
export function useWindowManager(): WindowManager {
  const [windows, setWindows] = useState<WindowState[]>(initialWindows);

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) => bringToFront(prev, id));
  }, []);

  const openWindow = useCallback((id: string, params?: Record<string, unknown>) => {
    setWindows((prev) => openWindowIn(prev, id, params, getViewport()));
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows((prev) => restoreWindowIn(prev, id, getViewport()));
  }, []);

  const closeWindow = useCallback((id: string, force = false) => {
    setWindows((prev) => closeWindowIn(prev, id, force));
  }, []);

  const cancelClose = useCallback((id: string) => {
    setWindows((prev) => cancelCloseIn(prev, id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => minimizeWindowIn(prev, id));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) => maximizeWindowIn(prev, id));
  }, []);

  // Explicit direction (not a toggle, unlike maximizeWindow) -- the two callers (an automatic
  // tool-call trigger, a manual restore button) each already know exactly which state they
  // want. Compact is a render-time override of the stored frame: it clears neither
  // isMaximized nor the frame, so expanding returns to exactly where the window was.
  const setWindowCompact = useCallback((id: string, compact: boolean) => {
    setWindows((prev) => {
      const next = setCompactIn(prev, id, compact);
      return compact && next !== prev ? bringToFront(next, id) : next;
    });
  }, []);

  const setWindowGeometry = useCallback((id: string, patch: { position?: Point; size?: Size }) => {
    setWindows((prev) => setGeometryIn(prev, id, patch, getViewport()));
  }, []);

  const clampWindowsToViewport = useCallback(() => {
    setWindows((prev) => clampAllIn(prev, getViewport()));
  }, []);

  const setWindowPolicy = useCallback((id: string, patch: { minimizeMode?: MinimizeMode; closeGuard?: CloseGuard | null }) => {
    setWindows((prev) => setPolicyIn(prev, id, patch));
  }, []);

  const resetWindowRuntime = useCallback((id: string) => {
    setWindows((prev) => resetRuntimeIn(prev, id));
  }, []);

  return {
    windows, openWindow, restoreWindow, closeWindow, cancelClose, minimizeWindow, maximizeWindow,
    focusWindow, setWindowCompact, setWindowGeometry, clampWindowsToViewport, setWindowPolicy, resetWindowRuntime,
  };
}
