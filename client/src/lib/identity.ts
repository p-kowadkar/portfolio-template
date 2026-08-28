/**
 * identity — visitor/session identifiers shared by callGate.ts (rate limiting)
 * and analytics.ts (engagement tracking). getVisitorId() was originally defined
 * in callGate.ts; extracted here since it has no call-gate-specific logic and
 * both modules need the same identity.
 */

const VISITOR_KEY = 'pk_visitor_id';
const SESSION_KEY = 'pk_session_id';

/** Stable per-browser visitor id, persisted indefinitely. Null when localStorage
 *  is unavailable (Safari private mode throws on setItem). */
export function getVisitorId(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** One id per tab/visit (sessionStorage) — the "impression" unit analytics.ts
 *  uses for click-to-impression ratios: every session that exists is one
 *  impression of every always-visible Dock/app entry point. */
export function getSessionId(): string | null {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}
