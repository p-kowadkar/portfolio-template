/**
 * useCallTimer -- the call duration as "mm:ss", shared by the two Digital Twin call
 * components (VideoCallApp.tsx desktop, MobileDigitalTwin.tsx mobile). Each had its own
 * copy, and both reset to 00:00 the instant the call left 'active' -- which is exactly
 * when the "Call ended" screen renders, so it always said 00:00.
 *
 *   const callTimer = useCallTimer(phase === 'active', phase === 'ringing' || phase === 'connecting');
 *
 * - While `active`, it counts. It derives the value from Date.now() rather than adding
 *   one per tick, so a throttled background tab or a delayed interval can't drift it.
 * - When `active` turns false it FREEZES on the exact final second, so the ended screen
 *   shows how long the call really lasted.
 * - It starts over when the next call goes active, and whenever `resetWhen` is true. Pass
 *   the "a new call is being set up" phases there: without it, cancelling a second call
 *   during 'connecting' (it never reached 'active') would show the FIRST call's duration
 *   on its ended screen.
 */
import { useEffect, useRef, useState } from 'react';

export function useCallTimer(active: boolean, resetWhen = false): string {
  const [seconds, setSeconds] = useState(0);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (resetWhen) setSeconds(0);
  }, [resetWhen]);

  useEffect(() => {
    if (!active) return;
    startedAtRef.current = Date.now();
    setSeconds(0);
    const tick = () => setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
      tick(); // freeze on the exact final second, not the last whole tick
    };
  }, [active]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
