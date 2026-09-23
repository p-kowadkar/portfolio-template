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

/** Whether the window is RUNNING: open, whether or not it is currently minimized. This is what a
 *  "running" indicator wants (a Dock dot, say). For "is it on screen right now" -- e.g. whether a
 *  Canvas is actually in front of the visitor -- use useIsWindowVisible. */
export function useIsWindowOpen(windowId: string): boolean {
  const windows = useContext(WindowParamsContext);
  return windows.find((w) => w.id === windowId)?.isOpen ?? false;
}

/** Whether the window is on screen: open and not minimized. A minimized window's app can still be
 *  mounted (once minimize stops unmounting, in a later sprint), but nobody is looking at it, so it
 *  must not be treated as e.g. the project the visitor is currently looking at. */
export function useIsWindowVisible(windowId: string): boolean {
  const windows = useContext(WindowParamsContext);
  const w = windows.find((x) => x.id === windowId);
  return !!w && w.isOpen && !w.isMinimized;
}

/**
 * WindowSelfContext -- what an app can ask about ITS OWN window, without knowing its id or
 * subscribing to the whole windows array. Provided per window by Window.tsx and memoized, so an
 * app re-renders only when its own flags change, never on another window's focus or drag.
 * (WindowParamsContext above is the whole array and changes on every focus.)
 *
 * The default is non-null on purpose: anything shared with mobile, or rendered outside a Window,
 * must not throw. Use it to pause work that should not run while the window is hidden (timers,
 * key listeners, autoplay) or that should follow focus.
 */
export interface WindowSelf {
  id: string | null;
  isMinimized: boolean;
  isFocused: boolean;
}
const WindowSelfContext = createContext<WindowSelf>({ id: null, isMinimized: false, isFocused: true });
export const WindowSelfProvider = WindowSelfContext.Provider;
export function useWindowSelf(): WindowSelf {
  return useContext(WindowSelfContext);
}
