// "Is this the phone shell?" as a read that stands still while a call is live. Swapping shells unmounts
// everything under App, including a call the visitor may have burned one of their two daily calls on, so
// while a call holds callPresence the answer stays whatever the last read said, however the window resizes
// or rotates in the meantime. The moment the hold is dropped the next read looks at the window again.
//
// A pure factory over two injected reads so it can be tested without a window.

export function createShellLatch(detect: () => boolean, isLive: () => boolean): () => boolean {
  // The last value this returned while nothing was holding it: what App last rendered. Undefined only
  // until the first read; a first read that lands while a call is already live has nothing to hold, so it
  // detects (and then holds that).
  let last: boolean | undefined;
  return () => {
    if (isLive() && last !== undefined) return last;
    last = detect();
    return last;
  };
}
