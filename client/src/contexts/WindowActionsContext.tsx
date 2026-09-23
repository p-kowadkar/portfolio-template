import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { MinimizeMode, CloseGuard } from '../lib/windowState';

/**
 * Sibling to WindowParamsContext.tsx, same reason: Desktop.tsx's appComponents
 * map pre-instantiates each app as a static `<SomeApp />` element once, so
 * there's no prop path for openWindow to reach an already-mounted app (e.g.
 * VideoCallApp dispatching a mid-call tool_call into openWindow('canvas', ...)).
 * This context sidesteps that the same way — any app component can reach
 * openWindow without Desktop.tsx/appComponents needing to change per-app.
 * Mobile doesn't need this — MobileShell threads its own open-app callback
 * directly as a prop.
 */
type OpenWindow = (id: string, params?: Record<string, unknown>) => void;
type SetWindowCompact = (id: string, compact: boolean) => void;
// An app declares what its own window's yellow light does and whether closing it needs
// confirming (see lib/windowState.ts). The manager knows nothing about what an app is doing;
// the app says so, and clears it again when it no longer applies.
type SetWindowPolicy = (id: string, patch: { minimizeMode?: MinimizeMode; closeGuard?: CloseGuard | null }) => void;

interface WindowActions {
  openWindow: OpenWindow;
  setWindowCompact: SetWindowCompact;
  setWindowPolicy: SetWindowPolicy;
}

const WindowActionsContext = createContext<WindowActions | null>(null);

export function WindowActionsProvider({
  openWindow,
  setWindowCompact,
  setWindowPolicy,
  children,
}: {
  openWindow: OpenWindow;
  setWindowCompact: SetWindowCompact;
  setWindowPolicy: SetWindowPolicy;
  children: ReactNode;
}) {
  // All three are stable callbacks from the window manager, so this value never changes. It used
  // to be a fresh object literal every render (when this context held just `openWindow` directly,
  // that plain function was already a stable reference; bundling more actions into one context
  // value means memoizing it matters now), which would otherwise re-render every consumer (the
  // chat window, the call) on every window-state change for nothing.
  const value = useMemo(
    () => ({ openWindow, setWindowCompact, setWindowPolicy }),
    [openWindow, setWindowCompact, setWindowPolicy],
  );
  return <WindowActionsContext.Provider value={value}>{children}</WindowActionsContext.Provider>;
}

export function useWindowActions(): WindowActions {
  const actions = useContext(WindowActionsContext);
  if (!actions) {
    throw new Error('useWindowActions must be used within a WindowActionsProvider (see Desktop.tsx)');
  }
  return actions;
}

/** Thin convenience wrapper kept for existing call sites (VideoCallApp, ChatPKApp and their
 *  mobile equivalents) that only ever needed openWindow -- avoids touching those already-wired
 *  tool-call paths just to destructure one field out of useWindowActions(). */
export function useOpenWindow(): OpenWindow {
  return useWindowActions().openWindow;
}
