// Keeps the screen awake while a call is live. A voice call makes none of the touches a phone's own screen
// timeout counts as use, so without this the OS can lock the screen in the middle of the call, which
// suspends the page and cuts the call off.
//
// Holding a screen wake lock is not "request once": the browser takes it back on its own whenever the page
// is hidden (tab switch, app switch, screen off) and does not give it back. So this is a small state
// machine, "I want one" plus "take it again whenever the page is visible", over an injected navigator and
// document so it can be tested without a browser. Where the API does not exist (an old browser, a page not
// served over HTTPS) every call is a harmless no-op and the call simply behaves as it always did.

interface SentinelLike {
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
}
export interface WakeLockLike {
  request(type: 'screen'): Promise<SentinelLike>;
}
export interface VisibilityDocLike {
  visibilityState: string;
  addEventListener(type: 'visibilitychange', listener: () => void): void;
  removeEventListener(type: 'visibilitychange', listener: () => void): void;
}
export interface ScreenWakeHolder {
  /** From now on keep the screen awake. Idempotent. Call it inside the click that starts the call. */
  acquire(): void;
  /** The call is over: let the screen sleep again. Idempotent, and safe before a request has resolved. */
  release(): void;
}

export function createScreenWakeHolder(getWakeLock: () => WakeLockLike | undefined, doc: VisibilityDocLike): ScreenWakeHolder {
  let wanted = false;
  let sentinel: SentinelLike | null = null;
  let requesting = false;

  const take = async () => {
    const wakeLock = getWakeLock();
    if (!wakeLock || !wanted || sentinel || requesting || doc.visibilityState !== 'visible') return;
    requesting = true;
    try {
      const taken = await wakeLock.request('screen');
      if (!wanted) {
        // The call ended while the request was in flight: give it straight back rather than leak it.
        taken.release().catch(() => {});
        return;
      }
      sentinel = taken;
      // The browser took it back (the page was hidden). The next visibilitychange to visible takes it again.
      taken.addEventListener('release', () => {
        if (sentinel === taken) sentinel = null;
      });
    } catch {
      // Refused (battery saver, a permission policy, the page hidden a moment ago): the call still works and
      // the screen may sleep. The next visibilitychange to visible tries again.
    } finally {
      requesting = false;
    }
  };

  const onVisibilityChange = () => {
    if (wanted) void take();
  };

  return {
    acquire() {
      if (wanted) return;
      wanted = true;
      doc.addEventListener('visibilitychange', onVisibilityChange);
      void take();
    },
    release() {
      if (!wanted) return;
      wanted = false;
      doc.removeEventListener('visibilitychange', onVisibilityChange);
      const held = sentinel;
      sentinel = null;
      if (held) held.release().catch(() => {});
    },
  };
}
