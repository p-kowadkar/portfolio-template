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

import { useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { motion } from 'framer-motion';
import type { WindowState, WindowManager } from '../hooks/useWindowManager';

interface WindowProps extends WindowState {
  onClose: WindowManager['closeWindow'];
  onMinimize: WindowManager['minimizeWindow'];
  onMaximize: WindowManager['maximizeWindow'];
  onFocus: WindowManager['focusWindow'];
  children: React.ReactNode;
  isFocused?: boolean;
}

export default function Window({
  id,
  title,
  isOpen,
  isMinimized,
  isMaximized,
  zIndex,
  defaultPosition,
  defaultSize,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  children,
  isFocused = true,
}: WindowProps) {
  const rndRef = useRef<Rnd | null>(null);
  const [trafficHovered, setTrafficHovered] = useState(false);

  if (!isOpen || isMinimized) return null;

  const maxSize = isMaximized
    ? { width: window.innerWidth, height: window.innerHeight - 28 - 80 }
    : undefined;
  const maxPos = isMaximized ? { x: 0, y: 28 } : undefined;

  return (
    <Rnd
      ref={rndRef}
      default={{
        x: defaultPosition.x,
        y: defaultPosition.y + 28,
        width: defaultSize.width,
        height: defaultSize.height,
      }}
      position={maxPos}
      size={maxSize}
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      minWidth={380}
      minHeight={300}
      dragHandleClassName="window-drag-handle"
      style={{ zIndex, position: 'absolute' }}
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
      onResizeStart={(_e, _dir, ref) => {
        (ref as HTMLElement).style.pointerEvents = 'auto';
      }}
      onResizeStop={(_e, _dir, ref) => {
        (ref as HTMLElement).style.pointerEvents = '';
      }}
    >
      <motion.div
        className="flex flex-col w-full h-full"
        style={{
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: isFocused
            ? '0 44px 100px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.07) inset'
            : '0 20px 50px rgba(0,0,0,0.45)',
          background: 'transparent',
        }}
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* ── Title bar ── */}
        <div
          className="window-drag-handle flex items-center shrink-0 relative select-none"
          style={{
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

        {/* ── Content area ── */}
        <div
          className="window-content flex-1 overflow-auto"
          onWheel={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(26, 26, 28, 0.97)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          }}
        >
          {children}
        </div>
      </motion.div>
    </Rnd>
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
