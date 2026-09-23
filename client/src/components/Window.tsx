/**
 * Window.tsx
 * Design: Netflix-Dark × macOS Desktop
 *
 * Authentic macOS Sequoia/Sonoma window chrome:
 *  - Title bar: 28px tall, dark vibrancy glass
 *  - Traffic lights: 14px circles, 8px gap, 13px left padding
 *    - Unfocused: all three are #3a3a3c (muted gray, no color)
 *    - Focused idle: #ff5f57 / #febc2e / #28c840
 *    - On group hover: symbols appear (× / − / ⤢) in darker shade
 *  - Title: centered, 13px, SF Pro weight 500, muted when unfocused
 *  - Window shadow: deep drop shadow when focused, lighter when not
 */

import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { motion, AnimatePresence } from 'framer-motion';
import type { WindowState, WindowManager } from '../hooks/useWindowManager';
import { WindowSelfProvider } from '../contexts/WindowParamsContext';
import { MENUBAR_H, MIN_W, MIN_H, getViewport, initialFrame, type Area, type CloseGuard, type Frame } from '../lib/windowState';

interface WindowProps extends WindowState {
  onClose: WindowManager['closeWindow'];
  onMinimize: WindowManager['minimizeWindow'];
  onMaximize: WindowManager['maximizeWindow'];
  onFocus: WindowManager['focusWindow'];
  /** A drag/resize finished: write the window's new frame back to the manager. */
  onGeometryChange: WindowManager['setWindowGeometry'];
  /** The visitor answered the close-confirmation sheet with Cancel. */
  onCancelClose: WindowManager['cancelClose'];
  /** This window's app instance is going away without a close (an unmount): drop the bubble and
   *  policy it left behind. */
  onResetRuntime: WindowManager['resetWindowRuntime'];
  /** The desktop area (viewport minus the menu bar and Dock zone): what maximize and the
   *  compact bubble are sized and placed from. */
  area: Area;
  children: React.ReactNode;
  isFocused?: boolean;
}

// Compact bubble geometry — top-right corner, small enough to stay out of the
// way while still being legible. Fixed size rather than dynamic: the caller's
// own content (e.g. VideoCallApp's optional message-input row) reveals within
// this fixed box via its own internal flex layout, so Window.tsx never needs a
// data path from deep inside `children` back up to size the Rnd container.
const COMPACT_WIDTH = 240;
const COMPACT_HEIGHT = 200;

function Window({
  id,
  title,
  isOpen,
  isMinimized,
  isMaximized,
  isCompact,
  zIndex,
  position,
  size,
  defaultOffset,
  defaultSize,
  closeGuard,
  closeRequested,
  area,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onGeometryChange,
  onCancelClose,
  onResetRuntime,
  children,
  isFocused = true,
}: WindowProps) {
  const [trafficHovered, setTrafficHovered] = useState(false);

  // An unmount is not always a close (the desktop shell can be swapped for the mobile one, and a
  // future sprint's minimize will stop unmounting entirely), and the policy and bubble belong to
  // the app instance that just went away. The manager outlives it, so clear them, or a dead
  // window's bubble and "are you sure?" guard would come back on the next mount. A normal close
  // has already reset them, which makes this a no-op.
  useEffect(() => () => onResetRuntime(id), []); // eslint-disable-line react-hooks/exhaustive-deps

  const sheetUp = closeRequested && !!closeGuard;

  // What this window's own app can ask about it (see useWindowSelf). Memoized per window, and above
  // the early return below (hooks must not be conditional).
  const self = useMemo(() => ({ id, isMinimized, isFocused }), [id, isMinimized, isFocused]);

  if (!isOpen || isMinimized) return null;

  // The frame the manager stores for this window. (It is always set once a window is open; the
  // fallback is only for the instant of an exit animation on a window that was never sized.)
  const stored: Frame = position && size ? { position, size } : initialFrame({ defaultOffset, defaultSize }, getViewport());

  // What is actually on screen. A bubble and a maximized window are RENDER-TIME overrides of the
  // stored frame -- they never overwrite it, so un-maximize and expanding a bubble return to
  // exactly where the window was. Rnd is fully controlled (position and size are always given):
  // when it was only sometimes controlled, react-draggable kept the last controlled value and
  // a window came back from maximize/compact in the wrong place.
  const frame: Frame = isCompact
    ? {
        position: { x: area.width - COMPACT_WIDTH - 20, y: 40 },
        size: { width: COMPACT_WIDTH, height: COMPACT_HEIGHT },
      }
    : isMaximized
      // The legacy numbers, kept identical so this change carries no unrelated visual diff: y is
      // the menu bar's height inside a desktop area that is already offset by it, and the height
      // stops 8px short of the area's bottom.
      ? { position: { x: 0, y: MENUBAR_H }, size: { width: area.width, height: area.height - 8 } }
      : stored;

  return (
    <Rnd
      data-window-id={id}
      position={frame.position}
      size={frame.size}
      disableDragging={isMaximized || isCompact}
      enableResizing={!isMaximized && !isCompact}
      // re-resizable writes these as inline min-width/min-height, and CSS min-* beats an
      // explicit width/height -- so a flat 380x300 floor would silently turn the 240x200 bubble
      // into a 380x300 one, ~120px of it clipped off the right edge of the desktop.
      minWidth={isCompact ? COMPACT_WIDTH : MIN_W}
      minHeight={isCompact ? COMPACT_HEIGHT : MIN_H}
      dragHandleClassName="window-drag-handle"
      // Compact windows deliberately ignore the shared focus-order zIndex pool —
      // the whole point is staying visible/reachable no matter what else gets
      // focused on top of it (e.g. Canvas/Scheduler opening mid-call). So does a window with its
      // close-confirmation sheet up: the visitor is mid-decision, and a window opened meanwhile
      // (a tool call opening Canvas) must not bury the question, with keyboard focus trapped in it.
      style={{ zIndex: isCompact || sheetUp ? 9999 : zIndex, position: 'absolute' }}
      onMouseDown={() => onFocus(id)}
      bounds="parent"
      resizeHandleStyles={{
        top: { pointerEvents: 'none' as const },
        bottom: { pointerEvents: 'none' as const },
        left: { pointerEvents: 'none' as const },
        right: { pointerEvents: 'none' as const },
        topLeft: { pointerEvents: 'none' as const },
        topRight: { pointerEvents: 'none' as const },
        bottomLeft: { pointerEvents: 'none' as const },
        bottomRight: { pointerEvents: 'none' as const },
      }}
      // Write the result back on drag STOP only, never on drag: react-draggable renders from its
      // own state while dragging, so drag stays as smooth as before with no manager traffic per
      // mousemove. d.x/d.y are already in the parent's coordinates. Must return nothing --
      // react-rnd forwards the return value to react-draggable as `shouldContinue`.
      onDragStop={(_e, d) => {
        if (isMaximized || isCompact) return;
        onGeometryChange(id, { position: { x: d.x, y: d.y } });
      }}
      onResizeStart={(_e, _dir, ref) => {
        (ref as HTMLElement).style.pointerEvents = 'auto';
      }}
      // Dormant today (every resize handle is pointer-events:none, see resizeHandleStyles), but
      // wired so it is correct if resizing comes back: react-rnd hands over the final position
      // as the 5th argument, and without writing it back a top/left resize would snap to the
      // old x/y.
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        (ref as HTMLElement).style.pointerEvents = '';
        if (isMaximized || isCompact) return;
        onGeometryChange(id, { position: pos, size: { width: ref.offsetWidth, height: ref.offsetHeight } });
      }}
    >
      <motion.div
        className="flex flex-col w-full h-full"
        style={{
          position: 'relative', // anchors the close-confirmation sheet
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: isCompact
            ? '0 12px 40px rgba(0,0,0,0.65), 0 0 0 0.5px rgba(255,255,255,0.1) inset'
            : isFocused
              ? '0 44px 100px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.07) inset'
              : '0 20px 50px rgba(0,0,0,0.45)',
          background: 'transparent',
        }}
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* ── Title bar — hidden (not removed) in compact mode via `display: none`: the bubble
            look has no title bar/traffic lights, but keeping the element mounted with the same
            DOM shape means toggling isCompact never changes the ancestor chain leading to
            `children`, so the wrapped app (VideoCallApp) is never unmounted/remounted by this
            transition. ── */}
        <div
          className="window-drag-handle flex items-center shrink-0 relative select-none"
          style={{
            display: isCompact ? 'none' : 'flex',
            height: '28px',
            background: isFocused
              ? 'rgba(48, 48, 52, 0.98)'
              : 'rgba(38, 38, 40, 0.96)',
            borderBottom: '0.5px solid rgba(255,255,255,0.07)',
          }}
          onMouseEnter={() => setTrafficHovered(true)}
          onMouseLeave={() => setTrafficHovered(false)}
        >
          {/* Traffic lights group */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '13px',
              flexShrink: 0,
            }}
          >
            <TrafficLight
              idleColor={isFocused ? '#ff5f57' : '#3a3a3c'}
              activeColor="#ff5f57"
              symbol="✕"
              symbolColor="#8b1c18"
              groupHovered={trafficHovered}
              onClick={(e) => { e.stopPropagation(); onClose(id); }}
            />
            <TrafficLight
              idleColor={isFocused ? '#febc2e' : '#3a3a3c'}
              activeColor="#febc2e"
              symbol="−"
              symbolColor="#7d5a00"
              groupHovered={trafficHovered}
              onClick={(e) => { e.stopPropagation(); onMinimize(id); }}
            />
            <TrafficLight
              idleColor={isFocused ? '#28c840' : '#3a3a3c'}
              activeColor="#28c840"
              symbol="⤢"
              symbolColor="#0a5c1a"
              groupHovered={trafficHovered}
              onClick={(e) => { e.stopPropagation(); onMaximize(id); }}
            />
          </div>

          {/* Centered window title */}
          <span
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              fontFamily: '-apple-system, "SF Pro Text", "Helvetica Neue", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: isFocused ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
        </div>

        {/* ── Content area ── (inert while the close sheet is up, so the app underneath can be
            neither clicked nor tabbed into; the title bar stays live) */}
        <div
          className="window-content flex-1 overflow-auto"
          inert={sheetUp}
          onWheel={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(26, 26, 28, 0.97)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          }}
        >
          <WindowSelfProvider value={self}>{children}</WindowSelfProvider>
        </div>

        {/* ── Close confirmation ── raised when a window with a closeGuard is asked to close. */}
        <AnimatePresence>
          {sheetUp && closeGuard && (
            <CloseGuardSheet
              key="close-guard"
              guard={closeGuard}
              onCancel={() => onCancelClose(id)}
              onConfirm={() => onClose(id, true)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </Rnd>
  );
}

// Memoized: a focus change re-renders the two windows whose isFocused/zIndex changed, not all of
// them. Every prop is a stable reference for an untouched window (the manager only replaces the
// window objects it changed, callbacks are useCallbacks, `children` are module-level elements,
// and `area` is state in Desktop).
export default memo(Window);

/* ─────────────────────────────────────────────────────────────
   CloseGuardSheet — the "are you sure?" that a guarded window raises on close

   Lives INSIDE the window (a per-window sheet, like a macOS document sheet), not as a page-wide
   modal: a page modal would block the Canvas/Scheduler windows an app has just opened. Local to
   this file rather than the repo's shadcn AlertDialog (components/ui/alert-dialog.tsx), which is
   unused scaffold that portals a full-page overlay with its own theme tokens and would sit above
   everything, including whatever the visitor just asked to open.

   Cancel gets the initial focus, so Enter or Escape cancels -- a stray Enter must not confirm a
   destructive action. Two focusable buttons make a complete focus trap trivial. Clicking the
   scrim does nothing: an alert needs an explicit answer.
   ───────────────────────────────────────────────────────────── */

function CloseGuardSheet({
  guard,
  onCancel,
  onConfirm,
}: {
  guard: CloseGuard;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const uid = useId();

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      // Only two focusable things exist, so "trap" is just "the other one".
      e.preventDefault();
      (document.activeElement === cancelRef.current ? confirmRef.current : cancelRef.current)?.focus();
    }
  };

  const button = (bg: string): React.CSSProperties => ({
    flex: 1,
    padding: '6px 0',
    borderRadius: '7px',
    border: 'none',
    background: bg,
    color: '#fff',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: '-apple-system, "SF Pro Text", "Helvetica Neue", sans-serif',
    cursor: 'default',
  });

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: MENUBAR_H, // below the title bar, which stays live (drag, red, green)
        bottom: 0,
        zIndex: 5,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-body`}
        onKeyDown={onKeyDown}
        style={{
          width: '260px',
          maxWidth: '90%',
          padding: '18px 16px 14px',
          borderRadius: '12px',
          background: 'rgba(40,40,44,0.96)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: '0.5px solid rgba(255,255,255,0.14)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
          textAlign: 'center',
          fontFamily: '-apple-system, "SF Pro Text", "Helvetica Neue", sans-serif',
        }}
        initial={{ scale: 1.04, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.04, opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <p id={`${uid}-title`} style={{ fontSize: '13px', fontWeight: 600, color: '#f0f0f2', marginBottom: '4px' }}>
          {guard.title}
        </p>
        <p id={`${uid}-body`} style={{ fontSize: '11px', lineHeight: 1.4, color: 'rgba(255,255,255,0.6)', marginBottom: '14px' }}>
          {guard.body}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button ref={cancelRef} type="button" onClick={onCancel} style={button('rgba(255,255,255,0.12)')}>
            Cancel
          </button>
          <button ref={confirmRef} type="button" onClick={onConfirm} style={button('#E50914')}>
            {guard.confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TrafficLight — authentic macOS Sequoia button
   14px circle, subtle stroke ring, symbol on group hover
   ───────────────────────────────────────────────────────────── */

function TrafficLight({
  idleColor,
  activeColor,
  symbol,
  symbolColor,
  groupHovered,
  onClick,
}: {
  idleColor: string;
  activeColor: string;
  symbol: string;
  symbolColor: string;
  groupHovered: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const [selfHovered, setSelfHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setSelfHovered(true)}
      onMouseLeave={() => setSelfHovered(false)}
      style={{
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        background: selfHovered ? activeColor : idleColor,
        border: 'none',
        padding: 0,
        flexShrink: 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
        transition: 'background 0.08s ease',
        /* Authentic macOS: subtle ring + inner top highlight */
        boxShadow: `
          0 0 0 0.5px rgba(0,0,0,0.35),
          inset 0 0.5px 0 rgba(255,255,255,0.3),
          inset 0 -0.5px 0 rgba(0,0,0,0.2)
        `,
      }}
    >
      {groupHovered && (
        <span
          style={{
            fontSize: symbol === '⤢' ? '7px' : '9px',
            fontWeight: 900,
            color: symbolColor,
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
            marginTop: symbol === '✕' ? '-0.5px' : symbol === '⤢' ? '0.5px' : '0',
            fontFamily: '-apple-system, "SF Pro Text", sans-serif',
          }}
        >
          {symbol}
        </span>
      )}
    </button>
  );
}
