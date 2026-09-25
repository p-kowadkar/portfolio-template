import * as React from "react";
import { createShellLatch } from "../lib/shellLatch";
import { isCallLive, subscribeCallLive } from "../lib/callPresence";

const MOBILE_BREAKPOINT = 768;

function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isNarrow = window.innerWidth < MOBILE_BREAKPOINT;
  // True mobile: narrow viewport AND touch-capable (excludes touch laptops at full width)
  return isNarrow && hasTouch;
}

// Which shell App renders is decided HERE, and swapping shells unmounts everything under App, live call
// included. So while a call holds callPresence this keeps answering with the shell App last showed. It is a
// shared snapshot read at render time (not per-hook state written from an event) so that a resize that
// landed just before the visitor accepted a call is held too, and so every consumer agrees.
const readIsMobile = createShellLatch(detectMobile, isCallLive);

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener("change", onChange);
  window.addEventListener('resize', onChange);
  // Dropping the hold is what tells a waiting swap it may happen now.
  const offPresence = subscribeCallLive(onChange);
  return () => {
    mql.removeEventListener("change", onChange);
    window.removeEventListener('resize', onChange);
    offPresence();
  };
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, readIsMobile, () => false);
}
