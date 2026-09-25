// The phone's idle lock listens for touches on `window`. A touch inside an iframe never gets there: the
// iframe's own document takes it. So while one of these apps is up the visitor can be busy (filling out a
// booking, scrolling the resume) and the idle timer sees nothing, and the lock screen would drop over them
// after a minute. These are the phone apps that are an iframe; the lock is paused while one is showing.
const IDLE_BLIND_APPS: ReadonlySet<string> = new Set(['scheduler', 'resume']);

/** True when the front app or the overlay on top of it is one the idle timer cannot see the visitor using. */
export function idleTimerBlind(activeApp: string | null | undefined, overlayApp: string | null | undefined): boolean {
  return (activeApp != null && IDLE_BLIND_APPS.has(activeApp)) || (overlayApp != null && IDLE_BLIND_APPS.has(overlayApp));
}
