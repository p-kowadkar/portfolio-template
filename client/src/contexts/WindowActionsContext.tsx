import { createContext, useContext, type ReactNode } from 'react';

/**
 * Sibling to WindowParamsContext.tsx, same reason: Desktop.tsx's appComponents
 * map pre-instantiates each app as a static `<SomeApp />` element once, so
 * there's no prop path for openWindow to reach an already-mounted app (e.g.
 * VideoCallApp dispatching a tool_call into openWindow('canvas', ...)).
 * This context sidesteps that the same way — any app component can reach
 * openWindow without Desktop.tsx/appComponents needing to change per-app.
 * Mobile doesn't need this — MobileShell threads its own open-app callback
 * directly as a prop (see MobileShell.tsx's onOpenOverlay).
 */
type OpenWindow = (id: string, params?: Record<string, unknown>) => void;

const WindowActionsContext = createContext<OpenWindow | null>(null);

export function WindowActionsProvider({ openWindow, children }: { openWindow: OpenWindow; children: ReactNode }) {
  return <WindowActionsContext.Provider value={openWindow}>{children}</WindowActionsContext.Provider>;
}

export function useOpenWindow(): OpenWindow {
  const openWindow = useContext(WindowActionsContext);
  if (!openWindow) {
    throw new Error('useOpenWindow must be used within a WindowActionsProvider (see Desktop.tsx)');
  }
  return openWindow;
}
