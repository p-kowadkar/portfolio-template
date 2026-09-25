// Is a Digital Twin call on screen? Both call components (desktop VideoCallApp, mobile MobileDigitalTwin)
// hold a token here from the moment the visitor accepts until the call view is gone, and two things read it:
// useIsMobile (App swaps the desktop and mobile shells on a resize or a rotation, and a swap unmounts a
// live call) and the mobile idle lock (it must not lock over a call). Module-level because App sits above
// both shells.
//
// Owner tokens, not a bare boolean: two holders can never clear each other's hold, and releasing twice (or
// releasing something that never acquired) is a no-op.

const owners = new Set<object>();
const listeners = new Set<() => void>();

export function isCallLive(): boolean {
  return owners.size > 0;
}

/** Take (`live`) or drop the hold for one owner. Subscribers hear about it only when the store as a whole
 *  flips between held and free, so a second owner or a repeated call is silent. */
export function setCallLive(owner: object, live: boolean): void {
  const before = owners.size > 0;
  if (live) owners.add(owner);
  else owners.delete(owner);
  if ((owners.size > 0) !== before) Array.from(listeners).forEach((notify) => notify());
}

export function subscribeCallLive(notify: () => void): () => void {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}
