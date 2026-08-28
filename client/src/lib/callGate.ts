/**
 * callGate — client half of the Digital Twin call-rate gate.
 *
 * Shared by VideoCallApp.tsx (desktop) and MobileDigitalTwin.tsx (mobile), like
 * callAudio.ts. Talks to POST /api/call/start (limit check, racing the connecting
 * screen) and POST /api/call/end (duration accounting beacon).
 *
 * Fail-open by contract: checkCallStart NEVER rejects — any outcome other than an
 * explicit 429 from the backend (network error, timeout, 5xx, no API_URL) resolves
 * to 'allowed'. The backend's monthly circuit-breaker is the real wallet guard;
 * this module just delivers its verdict to the UI.
 */

import { API_URL } from '@/lib/callAudio';
import { getVisitorId } from '@/lib/identity';

export type BlockReason = 'daily_limit' | 'monthly_budget';
export type GateResult = { status: 'allowed' } | { status: 'blocked'; reason: BlockReason };

// The connecting-gate effect in both call components holds 'active' for at most
// this long waiting on the limit check, then fails open. The fetch aborts itself
// on the same clock so the two never stack.
export const GATE_TIMEOUT_MS = 3000;

export async function checkCallStart(sessionId: string): Promise<GateResult> {
  if (!API_URL) return { status: 'allowed' };
  try {
    const headers: Record<string, string> = { 'X-Call-Session-Id': sessionId };
    const visitorId = getVisitorId();
    if (visitorId) headers['X-Visitor-Id'] = visitorId;

    const res = await fetch(`${API_URL}/api/call/start`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(GATE_TIMEOUT_MS),
    });
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      const reason: BlockReason = data.reason === 'monthly_budget' ? 'monthly_budget' : 'daily_limit';
      return { status: 'blocked', reason };
    }
    return { status: 'allowed' };
  } catch {
    return { status: 'allowed' };
  }
}

/** Fire-and-forget duration report. text/plain keeps it a simple CORS request
 *  (no preflight — sendBeacon can't preflight and rejects JSON-typed blobs
 *  cross-origin), which is also what lets it survive pagehide. */
export function reportCallEnd(sessionId: string, seconds: number): void {
  if (!API_URL) return;
  const body = JSON.stringify({
    session_id: sessionId,
    seconds: Math.max(0, Math.min(Math.round(seconds), 600)),
  });
  const url = `${API_URL}/api/call/end`;
  try {
    const sent = navigator.sendBeacon?.(url, new Blob([body], { type: 'text/plain' }));
    if (sent) return;
  } catch { /* fall through to fetch */ }
  fetch(url, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'text/plain' },
    body,
  }).catch(() => {});
}
