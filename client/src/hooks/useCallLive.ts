import { useSyncExternalStore } from 'react';
import { isCallLive, subscribeCallLive } from '../lib/callPresence';

/** True while a Digital Twin call view holds callPresence (accepted, through "Call ended" / blocked, until
 *  the view is gone). Ringing is not held. */
export function useCallLive(): boolean {
  return useSyncExternalStore(subscribeCallLive, isCallLive, () => false);
}
