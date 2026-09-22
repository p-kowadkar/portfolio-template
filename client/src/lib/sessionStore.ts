/**
 * sessionStore -- tiny fail-open JSON store over sessionStorage, for the handful of
 * things that should survive a window being closed or minimized (the AIssistant
 * conversation, an unsent Messages draft, Terminal command history) but NOT a new tab or
 * a new visit.
 *
 * sessionStorage on purpose: it is tab-scoped and dies with the tab, which is the right
 * lifetime for a visitor's half-typed message or chat on a public portfolio, and nothing
 * here is ever transmitted anywhere. Every function swallows storage errors (Safari
 * private mode and disabled storage throw on setItem), the same fail-open stance as
 * identity.ts: if storage doesn't work, the feature just doesn't persist and the app
 * behaves exactly as it did before.
 *
 * Keys are versioned (`pk_*_v1`): a shape change bumps the suffix and the old entry is
 * simply never read again (it dies with the tab), so there is no migration code.
 */

/** A stored value larger than this (as JSON) is not written at all. */
const MAX_CHARS = 100_000;

/** Reads and validates a stored value. Anything that fails to parse or doesn't pass the
 *  type guard (a stale shape, a tampered entry) is removed and reads as absent. */
export function readSession<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(key);
      return null;
    }
    if (isValid(parsed)) return parsed;
    sessionStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

/** Returns whether the value was written. Over the size cap it writes NOTHING: the last
 *  good copy stays in place, and a visitor's text is never silently truncated. Callers
 *  that can afford to lose old data (the AIssistant conversation) shrink and retry
 *  themselves. */
export function writeSession(key: string, value: unknown, maxChars: number = MAX_CHARS): boolean {
  try {
    const raw = JSON.stringify(value);
    if (raw.length > maxChars) return false;
    sessionStorage.setItem(key, raw);
    return true;
  } catch {
    return false;
  }
}

export function clearSession(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* storage unavailable -- nothing to clear */
  }
}
