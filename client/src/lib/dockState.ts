/**
 * dockState -- what a Dock icon's running dot says about its window. Pure, so the rule is tested
 * instead of eyeballed (the "live call" case in particular needs a real call to see in the app).
 */
import type { WindowLike } from './windowState';

/** nothing / running / minimized (dim: it is still running, holding its state, but not on screen) /
 *  a call live in its corner bubble (green). */
export type DockState = 'closed' | 'running' | 'minimized' | 'live';

export function dockStateOf(win: Pick<WindowLike, 'id' | 'isOpen' | 'isMinimized' | 'isCompact'> | undefined): DockState {
  if (!win || !win.isOpen) return 'closed';
  // A bubble only exists while a call is live: the call window falls back to full size the moment the
  // call ends, and only the call opts in to being shrunk instead of minimized.
  if (win.id === 'videocall' && win.isCompact) return 'live';
  return win.isMinimized ? 'minimized' : 'running';
}
