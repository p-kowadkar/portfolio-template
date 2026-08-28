import { createContext, useContext, type ReactNode } from 'react';
import type { WindowState } from '../hooks/useWindowManager';

/**
 * Desktop.tsx's appComponents map pre-instantiates each app as a static
 * `<SomeApp />` element once, up front — it has no way to hand a freshly-opened
 * window's params to that element as props. This context sidesteps that: any
 * app component can look up its own window's params (set via
 * openWindow(id, params)) without appComponents/Desktop.tsx needing to change
 * at all. Mobile doesn't need this — MobileShell already threads params
 * directly as a prop through AppScreen's per-case switch.
 */
const WindowParamsContext = createContext<WindowState[]>([]);

export function WindowParamsProvider({ windows, children }: { windows: WindowState[]; children: ReactNode }) {
  return <WindowParamsContext.Provider value={windows}>{children}</WindowParamsContext.Provider>;
}

export function useWindowParams(windowId: string): Record<string, unknown> | undefined {
  const windows = useContext(WindowParamsContext);
  return windows.find((w) => w.id === windowId)?.params;
}

export function useIsWindowOpen(windowId: string): boolean {
  const windows = useContext(WindowParamsContext);
  return windows.find((w) => w.id === windowId)?.isOpen ?? false;
}
