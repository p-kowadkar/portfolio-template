/**
 * windowState -- the pure half of the desktop window manager (useWindowManager.ts is the
 * React half). Frames (position + size), z-order, and one transformer per manager action,
 * all plain functions over plain data so they can be unit-tested without React.
 *
 * Why the manager owns each window's frame at all: react-rnd used to keep x/y/width/height
 * in its own internal state, seeded from `default` on mount. So a window's position was lost
 * whenever it unmounted (close, and today minimize too), un-maximize and un-compact could not
 * return it to where it was, and nothing outside react-rnd could reposition a window. With the
 * frame in the manager, Rnd becomes a fully controlled component and maximize/compact are
 * pure render-time overrides that never overwrite it.
 *
 * Every transformer returns the SAME array (or frame) reference when nothing changed. React
 * bails out of a re-render on an identical state reference, and a title-bar click fires
 * onDragStop with unchanged coordinates, so this is what keeps a plain click from re-rendering
 * every window.
 *
 * Coordinates: a frame's position is in the desktop area's own coordinate space -- exactly
 * what Rnd's `position` prop takes. The desktop area is the div between the menu bar and the
 * Dock zone (see Desktop.tsx), so it is the viewport minus MENUBAR_H on top and DOCK_RESERVE
 * on the bottom.
 */

export interface Point { x: number; y: number }
export interface Size { width: number; height: number }
export interface Frame { position: Point; size: Size }
/** The browser viewport (window.innerWidth / innerHeight). */
export interface Viewport { width: number; height: number }
/** The desktop area windows live in: the viewport minus the menu bar and the Dock zone. */
export interface Area { width: number; height: number }

/** What the yellow light does. 'hide' minimizes (the default); 'compact' shrinks the window into
 *  the corner bubble instead, for a window with something live that must not be interrupted
 *  (the Digital Twin call: audio and video keep going in the bubble). */
export type MinimizeMode = 'hide' | 'compact';

/** Copy for the "are you sure?" sheet that closing a guarded window raises. */
export interface CloseGuard { title: string; body: string; confirmLabel: string }

/** The fields these transformers read and write; useWindowManager's WindowState extends it. */
export interface WindowLike {
  id: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isCompact: boolean;
  zIndex: number;
  /** The window's own frame. null until it is first opened. Kept across close (macOS
   *  remembers a window's frame), and never overwritten by maximize or compact. */
  position: Point | null;
  size: Size | null;
  /** Where a never-opened window first lands, as an offset from the centre. */
  defaultOffset: Point;
  defaultSize: Size;
  params?: Record<string, unknown>;
  /** Per-window policy, declared by the app that owns the window (through
   *  WindowActionsContext.setWindowPolicy) and dropped again when the window closes. The window
   *  manager knows nothing about calls: the Digital Twin just says "yellow means bubble, and
   *  closing me needs a confirmation while a call is live". */
  minimizeMode: MinimizeMode;
  closeGuard: CloseGuard | null;
  /** A guarded close was requested and the confirm sheet is up. */
  closeRequested: boolean;
}

export const MENUBAR_H = 28;
export const DOCK_RESERVE = 72;
/** A window never shrinks below this (it is what Rnd was given as minWidth/minHeight). */
export const MIN_W = 380;
export const MIN_H = 300;

export function getViewport(): Viewport {
  return typeof window !== 'undefined'
    ? { width: window.innerWidth, height: window.innerHeight }
    : { width: 1440, height: 900 };
}

export function areaOf(viewport: Viewport): Area {
  return { width: viewport.width, height: Math.max(0, viewport.height - MENUBAR_H - DOCK_RESERVE) };
}

/** Where a never-opened window lands. Numerically identical to what the old module-level
 *  `centered()` plus the `+ 28` in Window.tsx produced, so first-open positions do not move.
 *  (The desktop area is already offset by the menu bar, so this sits 28px lower than a true
 *  centre. That is legacy and is kept, like the maximize numbers, so this change carries no
 *  unrelated visual diff.) */
export function initialFrame(w: Pick<WindowLike, 'defaultSize' | 'defaultOffset'>, viewport: Viewport): Frame {
  const { width, height } = w.defaultSize;
  return {
    position: {
      x: Math.max(60, Math.round((viewport.width - width) / 2) + w.defaultOffset.x),
      y: Math.max(60, Math.round((viewport.height - height) / 2 - 20) + w.defaultOffset.y) + MENUBAR_H,
    },
    size: w.defaultSize,
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** Pulls a frame fully inside the area: oversized windows shrink to fit (never below
 *  MIN_W x MIN_H) and off-screen ones slide back in. Returns the SAME frame (and inner
 *  point/size) when nothing needed to change. */
export function clampFrame(frame: Frame, area: Area): Frame {
  const width = Math.max(MIN_W, Math.min(Math.round(frame.size.width), area.width));
  const height = Math.max(MIN_H, Math.min(Math.round(frame.size.height), area.height));
  const x = clamp(Math.round(frame.position.x), 0, Math.max(0, area.width - width));
  const y = clamp(Math.round(frame.position.y), 0, Math.max(0, area.height - height));
  const sameSize = width === frame.size.width && height === frame.size.height;
  const samePos = x === frame.position.x && y === frame.position.y;
  if (sameSize && samePos) return frame;
  return {
    position: samePos ? frame.position : { x, y },
    size: sameSize ? frame.size : { width, height },
  };
}

/** Raises a window above every other one. Returns the same array when it is already strictly
 *  on top, so re-focusing the front window (which is what every plain click on it does) changes
 *  nothing and re-renders nothing. It used to bump a global counter on every click. Z-indexes
 *  now only grow when focus actually switches windows. */
export function bringToFront<W extends Pick<WindowLike, 'id' | 'zIndex'>>(windows: W[], id: string): W[] {
  const target = windows.find((w) => w.id === id);
  if (!target) return windows;
  const maxOther = windows.reduce((m, w) => (w.id === id ? m : Math.max(m, w.zIndex)), -Infinity);
  if (target.zIndex > maxOther) return windows;
  return windows.map((w) => (w.id === id ? { ...w, zIndex: maxOther + 1 } : w));
}

const replace = <W extends WindowLike>(windows: W[], next: W): W[] =>
  windows.map((w) => (w.id === next.id ? next : w));

/** The window's stored frame, or its first-open frame if it has never had one. */
function frameOf(w: WindowLike, viewport: Viewport): Frame {
  return w.position && w.size ? { position: w.position, size: w.size } : initialFrame(w, viewport);
}

/** open, restore, or (already visible) just take the params and come to the front. */
export function openWindowIn<W extends WindowLike>(
  windows: W[],
  id: string,
  params: Record<string, unknown> | undefined,
  viewport: Viewport,
): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w) return windows;
  const area = areaOf(viewport);
  let next: W;
  if (!w.isOpen) {
    // closed -> open. A fresh open never inherits a bubble; the frame is the remembered one
    // (or the first-open one), pulled back inside the current viewport.
    const frame = clampFrame(frameOf(w, viewport), area);
    next = {
      ...w,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      isCompact: false,
      position: frame.position,
      size: frame.size,
      params: params ?? w.params,
    };
  } else if (w.isMinimized) {
    // Opening a minimized window IS a restore (tool calls like openWindow('canvas', {...})
    // rely on it). isMaximized is kept, so it comes back maximized like macOS.
    next = { ...restoredState(w, viewport), params: params ?? w.params };
  } else {
    // Already visible: take the params, come to the front. Never touches isCompact, so a Dock
    // or tool-call open of a live bubble leaves it a bubble.
    next = params === undefined ? w : { ...w, params };
  }
  return bringToFront(next === w ? windows : replace(windows, next), id);
}

/** A window coming back from minimized: visible again, its frame pulled inside the CURRENT area
 *  (the browser may have been resized while it was hidden). Every un-minimize path -- opening a
 *  minimized window, restoring it, Show All Windows -- maps through this one function, so none of
 *  them can skip the clamp. */
export function restoredState<W extends WindowLike>(w: W, viewport: Viewport): W {
  const frame = clampFrame(frameOf(w, viewport), areaOf(viewport));
  return { ...w, isMinimized: false, position: frame.position, size: frame.size };
}

/** Un-minimize (no params) and come to the front; a closed window is left alone. */
export function restoreWindowIn<W extends WindowLike>(windows: W[], id: string, viewport: Viewport): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w || !w.isOpen) return windows;
  if (!w.isMinimized) return bringToFront(windows, id);
  return bringToFront(replace(windows, restoredState(w, viewport)), id);
}

/** The window the visitor is working in: the visible window with the highest z, leaving out bubbles.
 *  A bubble is raised on every shrink (so it keeps a sane z when it expands), which would make the
 *  call "win" the z-order whenever it shrank beside Canvas or the Scheduler, and leave the window the
 *  visitor was actually using looking unfocused. A bubble only counts when nothing else is visible.
 *  Minimized and closed windows never count, so focus hands off to the next visible one. */
export function getFrontWindow<W extends WindowLike>(windows: W[]): W | undefined {
  const visible = windows.filter((w) => w.isOpen && !w.isMinimized);
  const full = visible.filter((w) => !w.isCompact);
  const pool = full.length ? full : visible;
  return pool.reduce<W | undefined>((best, w) => (!best || w.zIndex > best.zIndex ? w : best), undefined);
}

/** Show All Windows: every minimized window comes back (frames clamped), and the z-order is left
 *  exactly as it was (unlike "bring to front", which reorders everything by array position). */
export function showAllWindowsIn<W extends WindowLike>(windows: W[], viewport: Viewport): W[] {
  if (!windows.some((w) => w.isOpen && w.isMinimized)) return windows;
  return windows.map((w) => (w.isOpen && w.isMinimized ? restoredState(w, viewport) : w));
}

/** What clicking a window's Dock icon (or its menu entry) means: closed -> open it; minimized ->
 *  restore it; a bubble -> expand it (and raise it); otherwise just bring it to the front. Tool calls
 *  keep using openWindow, which never touches a bubble. */
export function activateWindowIn<W extends WindowLike>(windows: W[], id: string, viewport: Viewport): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w) return windows;
  if (!w.isOpen) return openWindowIn(windows, id, undefined, viewport);
  if (w.isMinimized) return restoreWindowIn(windows, id, viewport);
  if (w.isCompact) return setCompactIn(windows, id, false);
  return bringToFront(windows, id);
}

const sameGuard = (a: CloseGuard | null, b: CloseGuard | null) =>
  a === b || (!!a && !!b && a.title === b.title && a.body === b.body && a.confirmLabel === b.confirmLabel);

const hasDefaultPolicy = (w: WindowLike) => w.minimizeMode === 'hide' && w.closeGuard === null && !w.closeRequested;

/** Quit: the flags and the policy reset, but the frame and params stay (macOS remembers a
 *  window's frame).
 *
 *  A GUARDED window (one with a closeGuard) is not closed by this unless `force` is set: it
 *  raises the confirm sheet instead (closeRequested). Guarded-by-default means every caller --
 *  the red light, Close All, anything added later -- gets the guard without knowing it exists;
 *  only the sheet's confirm button passes `force`. The sheet lives inside the window and a
 *  240x200 bubble or a hidden window cannot host it, so a request first brings the window back
 *  to a full, visible one. Asking twice is harmless (the same array comes back). */
export function closeWindowIn<W extends WindowLike>(windows: W[], id: string, force = false): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w) return windows;
  if (w.isOpen && w.closeGuard && !force) {
    if (w.closeRequested && !w.isMinimized && !w.isCompact) return bringToFront(windows, id);
    return bringToFront(replace(windows, { ...w, closeRequested: true, isMinimized: false, isCompact: false }), id);
  }
  if (!w.isOpen && !w.isMinimized && !w.isMaximized && !w.isCompact && hasDefaultPolicy(w)) return windows;
  return replace(windows, {
    ...w,
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    isCompact: false,
    minimizeMode: 'hide',
    closeGuard: null,
    closeRequested: false,
  });
}

/** The visitor answered the confirm sheet with Cancel. The window comes to the front: something the
 *  app opened while the sheet was up (a tool call opening Canvas) may sit above it now, and after a
 *  Cancel the visitor expects to be looking at the call they chose to keep. */
export function cancelCloseIn<W extends WindowLike>(windows: W[], id: string): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w || !w.closeRequested) return windows;
  return bringToFront(replace(windows, { ...w, closeRequested: false }), id);
}

/** An app declares (or clears) its window's policy. No-op for a window that is not open: an app's
 *  unmount cleanup may call this after the window closed. Compares the guard BY VALUE, because an
 *  app sets it from an effect with a fresh object literal each time, and a same-array return is
 *  what stops that from turning into an effect -> setState -> render loop. Clearing the guard also
 *  dismisses a sheet that is up (e.g. the call ended by itself while "End Call?" was showing). */
export function setPolicyIn<W extends WindowLike>(
  windows: W[],
  id: string,
  patch: { minimizeMode?: MinimizeMode; closeGuard?: CloseGuard | null },
): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w || !w.isOpen) return windows;
  const minimizeMode = patch.minimizeMode ?? w.minimizeMode;
  const closeGuard = patch.closeGuard === undefined ? w.closeGuard : patch.closeGuard;
  const closeRequested = closeGuard === null ? false : w.closeRequested;
  if (minimizeMode === w.minimizeMode && sameGuard(closeGuard, w.closeGuard) && closeRequested === w.closeRequested) {
    return windows;
  }
  return replace(windows, {
    ...w,
    minimizeMode,
    closeGuard: sameGuard(closeGuard, w.closeGuard) ? w.closeGuard : closeGuard,
    closeRequested,
  });
}

/** The window's app instance is gone without a close (an unmount: the desktop shell was swapped
 *  for the mobile one, or the window was hidden). Its policy and bubble belonged to that instance,
 *  and the manager outlives it, so drop them: otherwise a dead call's bubble and guard would come
 *  back on the next mount. */
export function resetRuntimeIn<W extends WindowLike>(windows: W[], id: string): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w) return windows;
  if (!w.isCompact && hasDefaultPolicy(w)) return windows;
  return replace(windows, { ...w, isCompact: false, minimizeMode: 'hide', closeGuard: null, closeRequested: false });
}

/** What yellow does, per the window's minimizeMode. 'hide' hides it (also drops compact: a hidden
 *  bubble makes no sense, and a stale isCompact used to resurface on the next open as a
 *  chrome-less bubble; isMaximized is kept so restore comes back maximized). 'compact' shrinks it
 *  into the corner bubble instead and touches nothing else: the frame and isMaximized stay, so
 *  expanding returns to exactly where it was. Ignored while a close confirmation is up, and for a
 *  window that is closed or already hidden. */
export function minimizeWindowIn<W extends WindowLike>(windows: W[], id: string): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w || !canMinimize(w)) return windows;
  if (w.minimizeMode === 'compact') return replace(windows, { ...w, isCompact: true });
  return replace(windows, { ...w, isMinimized: true, isCompact: false });
}

/** Zoom toggle. Only a visible, full-size window can be zoomed; never writes the frame. */
export function maximizeWindowIn<W extends WindowLike>(windows: W[], id: string): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w || !canZoom(w)) return windows;
  return replace(windows, { ...w, isMaximized: !w.isMaximized });
}

/** Whether yellow would change anything for this window right now. minimizeWindowIn uses this very
 *  predicate, and so does the Window menu to grey out "Minimize", so a menu item is enabled exactly
 *  when its click does something (a lone call bubble, or a window with its close sheet up, ignore
 *  it: the first is already as small as it gets, the second is mid-decision). */
export function canMinimize(w: WindowLike | undefined): boolean {
  if (!w || !w.isOpen || w.isMinimized || w.closeRequested) return false;
  return !(w.minimizeMode === 'compact' && w.isCompact);
}

/** Whether the green light would change anything: only a visible, full-size window zooms. */
export function canZoom(w: WindowLike | undefined): boolean {
  return !!w && w.isOpen && !w.isMinimized && !w.isCompact;
}

/** Explicit direction, not a toggle. Compact and maximized are RENDER-TIME overrides of the
 *  stored frame: entering compact clears neither isMaximized nor the frame, so expanding
 *  returns to exactly where the window was (maximized included). Only a window that is open
 *  and visible can become a bubble, so a late tool call from a stream that outlived its window
 *  can't leave a closed window flagged compact. A window waiting on the visitor's answer to a
 *  close confirmation can't become one either: its sheet doesn't fit in a bubble, and the
 *  visitor is mid-decision (minimizeWindowIn ignores it for the same reason). */
export function setCompactIn<W extends WindowLike>(windows: W[], id: string, compact: boolean): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w) return windows;
  if (compact && (!w.isOpen || w.isMinimized || w.closeRequested)) return windows;
  if (w.isCompact === compact) return windows;
  // Raise on a change in EITHER direction. A bubble ignores the shared z-order (Window.tsx pins it
  // above the other windows), so one that expands comes back at whatever stale z it had, possibly
  // under windows opened while it was a bubble. A visitor's Expand click focuses the window first,
  // but a programmatic expand (the time-limit hangup, a blocked gate answer) has no click to do it,
  // and its "Call ended" screen would open hidden behind another window.
  return bringToFront(replace(windows, { ...w, isCompact: compact }), id);
}

/** A drag/resize wrote its result back. No-op for a window that is closed, maximized or
 *  compact (its frame is not the one on screen, so a stray write-back -- a drag in flight when
 *  a tool call flips it compact -- must not overwrite the stored one). */
export function setGeometryIn<W extends WindowLike>(
  windows: W[],
  id: string,
  patch: { position?: Point; size?: Size },
  viewport: Viewport,
): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w || !w.isOpen || w.isMaximized || w.isCompact) return windows;
  const base = frameOf(w, viewport);
  const frame = clampFrame(
    {
      position: patch.position ? { x: Math.round(patch.position.x), y: Math.round(patch.position.y) } : base.position,
      size: patch.size ? { width: Math.round(patch.size.width), height: Math.round(patch.size.height) } : base.size,
    },
    areaOf(viewport),
  );
  if (
    w.position && w.size &&
    frame.position.x === w.position.x && frame.position.y === w.position.y &&
    frame.size.width === w.size.width && frame.size.height === w.size.height
  ) {
    return windows;
  }
  return replace(windows, { ...w, position: frame.position, size: frame.size });
}

/** The browser was resized: pull every remembered frame back inside the new desktop area,
 *  minimized and closed windows included, so restore and reopen land in view too. */
export function clampAllIn<W extends WindowLike>(windows: W[], viewport: Viewport): W[] {
  const area = areaOf(viewport);
  let changed = false;
  const next = windows.map((w) => {
    if (!w.position || !w.size) return w;
    const f = clampFrame({ position: w.position, size: w.size }, area);
    if (f.position === w.position && f.size === w.size) return w;
    changed = true;
    return { ...w, position: f.position, size: f.size };
  });
  return changed ? next : windows;
}
