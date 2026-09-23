/**
 * windowMenu -- the pure parts of the menu bar's Window menu: which rows it lists, how they are marked,
 * and the order Close All closes windows in. Kept out of MenuBar.tsx so they are unit-tested.
 */
import type { WindowLike } from './windowState';

export interface WindowMenuRow {
  id: string;
  label: string;
  /** Decorative: a check for the front window, a diamond for a minimized one. */
  mark: '' | '✓' | '◆';
  /** The button's accessible name: the marks are decorative, so the state is in words here. */
  ariaLabel: string;
}

/** One row per OPEN window (minimized ones included: that is how a hidden window is found), in the
 *  manager's order. */
export function windowMenuRows(
  windows: WindowLike[],
  frontId: string | null,
  labelOf: (id: string) => string,
): WindowMenuRow[] {
  return windows
    .filter((w) => w.isOpen)
    .map((w) => {
      const front = w.id === frontId;
      const label = labelOf(w.id);
      return {
        id: w.id,
        label,
        mark: front ? '✓' : w.isMinimized ? '◆' : '',
        ariaLabel: `${label}${w.isMinimized ? ', minimized' : ''}${front ? ', front' : ''}`,
      };
    });
}

/** Close All: unguarded windows first, the guarded one (the live call) last. Each close is an
 *  independent update, so an unguarded close never disturbs a pending confirmation; closing the
 *  guarded window last leaves its "End Call?" sheet as the last thing raised, on top. */
export function closeAllOrder<W extends WindowLike>(windows: W[]): string[] {
  const open = windows.filter((w) => w.isOpen);
  return [...open.filter((w) => !w.closeGuard), ...open.filter((w) => w.closeGuard)].map((w) => w.id);
}
