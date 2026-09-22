/**
 * windowState -- the pure half of the desktop window manager (useWindowManager.ts is the
 * React half). Frames (position + size), z-order, and one transformer per manager action,
 * all plain functions over plain data so they can be unit-tested without React.
 *
 * Why the manager owns each window's frame at all: react-rnd used to keep x/y/width/height
 * in its own internal state, seeded from `default` on mount. So a window's position was lost
 * whenever it unmounted (a close), un-maximize and un-compact could not
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
    const frame = clampFrame(frameOf(w, viewport), area);
    next = { ...w, isMinimized: false, position: frame.position, size: frame.size, params: params ?? w.params };
  } else {
    // Already visible: take the params, come to the front. Never touches isCompact, so a Dock
    // or tool-call open of a live bubble leaves it a bubble.
    next = params === undefined ? w : { ...w, params };
  }
  return bringToFront(next === w ? windows : replace(windows, next), id);
}

/** Un-minimize (no params) and come to the front; a closed window is left alone. */
export function restoreWindowIn<W extends WindowLike>(windows: W[], id: string, viewport: Viewport): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w || !w.isOpen) return windows;
  if (!w.isMinimized) return bringToFront(windows, id);
  const frame = clampFrame(frameOf(w, viewport), areaOf(viewport));
  return bringToFront(
    replace(windows, { ...w, isMinimized: false, position: frame.position, size: frame.size }),
    id,
  );
}

/** Quit: the flags reset, but the frame and params stay (macOS remembers a window's frame). */
export function closeWindowIn<W extends WindowLike>(windows: W[], id: string): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w) return windows;
  if (!w.isOpen && !w.isMinimized && !w.isMaximized && !w.isCompact) return windows;
  return replace(windows, { ...w, isOpen: false, isMinimized: false, isMaximized: false, isCompact: false });
}

/** Hide. Also drops compact (a hidden bubble makes no sense, and a stale isCompact used to
 *  resurface on the next open as a chrome-less bubble). isMaximized is kept so restore comes
 *  back maximized. */
export function minimizeWindowIn<W extends WindowLike>(windows: W[], id: string): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w || !w.isOpen || w.isMinimized) return windows;
  return replace(windows, { ...w, isMinimized: true, isCompact: false });
}

/** Zoom toggle. Only a visible, full-size window can be zoomed; never writes the frame. */
export function maximizeWindowIn<W extends WindowLike>(windows: W[], id: string): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w || !w.isOpen || w.isMinimized || w.isCompact) return windows;
  return replace(windows, { ...w, isMaximized: !w.isMaximized });
}

/** Explicit direction, not a toggle. Compact and maximized are RENDER-TIME overrides of the
 *  stored frame: entering compact clears neither isMaximized nor the frame, so expanding
 *  returns to exactly where the window was (maximized included). Only a window that is open
 *  and visible can become a bubble, so a late tool call from a stream that outlived its window
 *  can't leave a closed window flagged compact. */
export function setCompactIn<W extends WindowLike>(windows: W[], id: string, compact: boolean): W[] {
  const w = windows.find((x) => x.id === id);
  if (!w) return windows;
  if (compact && (!w.isOpen || w.isMinimized)) return windows;
  if (w.isCompact === compact) return windows;
  return replace(windows, { ...w, isCompact: compact });
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
