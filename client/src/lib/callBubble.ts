// What the mobile call's corner bubble shows. The bubble exists while a Canvas or Scheduler overlay is open
// on top of the call (MobileShell's isCallCompact), and only the live layout was ever designed for it:
// connecting, ringing, blocked and ended are full-screen layouts that cannot fit 150x190.
//
// Ending a call no longer closes that overlay (a half-filled booking must survive a hang-up), so the call
// can now END while still compact. That needs an answer for what the bubble shows then, and this is it:
//   off     not a bubble; the full-screen layouts render as usual
//   active  the live controls
//   ended   a small "Call ended" card, until it is dismissed (or fades on its own)
//   hidden  nothing: invisible and click-through, so the overlay underneath is untouched

export type CallPhase = 'ringing' | 'connecting' | 'active' | 'ended' | 'blocked';
export type BubbleMode = 'off' | 'active' | 'ended' | 'hidden';

export function compactBubbleMode(compact: boolean, phase: CallPhase, endedDismissed: boolean): BubbleMode {
  if (!compact) return 'off';
  if (phase === 'active') return 'active';
  if (phase === 'ended') return endedDismissed ? 'hidden' : 'ended';
  return 'hidden';
}
