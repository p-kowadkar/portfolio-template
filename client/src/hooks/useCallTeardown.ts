/**
 * useCallTeardown -- the ONE way a Digital Twin call's voice pipeline gets shut down.
 *
 * Before this, "hanging up" was hand-rolled in several places (endCall, the blocked
 * branch, cap-reached) and simply missing from the window-unmount path, so closing
 * the window mid-reply hung up the avatar and the billing clock but left the rest
 * running: the in-flight /api/chat request could still land and speak its reply
 * through a detached fallback Audio, and SpeechRecognition could still deliver a
 * final result that started a brand-new turn. Every exit path now runs
 * teardownVoice(), including unmount.
 *
 * It only owns the VOICE pipeline (and the screen wake lock that keeps a phone from locking mid-call:
 * taken in beginCall, given back in teardownVoice, so every exit path releases it too). The avatar
 * connection (avatar.stop()) and the /api/call/end accounting beacon stay with the component's own
 * [inCall] effect, which already fires exactly once across every exit path.
 *
 * ─── Usage contract ─────────────────────────────────────────────────────────
 *   const call = useCallTeardown({
 *     chatAbortRef,                    // the in-flight /api/chat AbortController
 *     recognitionRef,                  // the SpeechRecognition instance, if the mic is on
 *     avatarInterrupt: avatar.interrupt,
 *     onMicOff: () => setMicOn(false),
 *   });
 *
 *   call.beginCall();           // in acceptCall -- arms the call (isLive() is true from here)
 *   call.teardownVoice();       // End, cap-reached, blocked -- and automatically on unmount
 *   call.isLive();              // first line of every async entry point that can fire late
 *   call.scheduleCapHangup(endCall, 2500);
 *
 * isLive() is what stops the callbacks an AbortController can't reach. Aborting the fetch
 * stops the network request, but a SpeechRecognition result can start a NEW request with a
 * fresh controller, and the cap handler / the rate-gate .then can both resolve after the
 * call is over. Each of those checks isLive() and bails.
 *
 * Every function returned is referentially stable and reads current state at call time
 * (usePersistFn), so stale closures -- like the one a mic's onresult captured when it
 * started -- still see the live flag.
 *
 * Note: this port has no SSE stream / sentence-level TTS queue to interrupt (the
 * template's /api/chat is a single non-streaming round trip, unlike the live site's
 * streaming /api/chat/stream + useTtsPlaybackQueue pipeline) -- so teardownVoice()
 * aborts the in-flight /api/chat fetch directly instead of an SSE reader, and there is
 * no queue/chunker to reset. See window-lifecycle-port-plan.md for the full rationale.
 */
import { useEffect, useRef, type RefObject } from 'react';
import { usePersistFn } from './usePersistFn';
import { cancelFallbackSpeech } from '@/lib/callAudio';
import { createScreenWakeHolder, type ScreenWakeHolder, type WakeLockLike } from '@/lib/wakeLock';
import type { SpeechRecognitionType } from '@/lib/speechRecognition';

export interface CallTeardownParts {
  chatAbortRef: RefObject<AbortController | null>;
  recognitionRef: RefObject<SpeechRecognitionType | null>;
  avatarInterrupt: () => void;
  onMicOff: () => void;
}

export interface CallTeardown {
  /** Arms the call. Also clears any cap timer left over from a previous call. */
  beginCall: () => void;
  /** True from beginCall() until teardownVoice(). */
  isLive: () => boolean;
  /** Idempotent. Stops everything that can make noise or start a turn. */
  teardownVoice: () => void;
  /** Runs `fn` after `ms` unless the call is torn down first (teardownVoice clears it). */
  scheduleCapHangup: (fn: () => void, ms: number) => void;
}

export function useCallTeardown(parts: CallTeardownParts): CallTeardown {
  const liveRef = useRef(false);
  const capTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Created on first use so nothing touches navigator/document at import or first render.
  const wakeRef = useRef<ScreenWakeHolder | null>(null);
  const wake = () =>
    (wakeRef.current ??= createScreenWakeHolder(
      () => (typeof navigator === 'undefined' ? undefined : (navigator as unknown as { wakeLock?: WakeLockLike }).wakeLock),
      document,
    ));

  const clearCapTimer = () => {
    if (capTimerRef.current) {
      clearTimeout(capTimerRef.current);
      capTimerRef.current = null;
    }
  };

  const beginCall = usePersistFn(() => {
    clearCapTimer();
    liveRef.current = true;
    wake().acquire(); // inside the Accept click; a no-op where the API is missing or the page is not HTTPS
  });

  const isLive = usePersistFn(() => liveRef.current);

  const teardownVoice = usePersistFn(() => {
    liveRef.current = false;
    clearCapTimer();
    wakeRef.current?.release(); // idempotent: End, cap, blocked, and unmount all land here

    // Network: stop the in-flight /api/chat request.
    parts.chatAbortRef.current?.abort();
    parts.chatAbortRef.current = null;

    // Whatever the avatar has buffered.
    parts.avatarInterrupt();

    // Audio already playing through the non-avatar path (MP3 or browser TTS).
    cancelFallbackSpeech();

    // Mic: detach the handlers BEFORE aborting. stop() would ask the browser for a final
    // result, and a late onresult would call sendMessage and start a turn nobody hears.
    const rec = parts.recognitionRef.current;
    parts.recognitionRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        try { rec.stop(); } catch { /* already stopped */ }
      }
    }
    parts.onMicOff();
  });

  const scheduleCapHangup = usePersistFn((fn: () => void, ms: number) => {
    clearCapTimer();
    capTimerRef.current = setTimeout(() => {
      capTimerRef.current = null;
      fn();
    }, ms);
  });

  // Unmount: the window was closed, the mobile screen was left, or the page is going
  // away. Runs teardownVoice's latest closure (usePersistFn), so it sees fresh refs
  // rather than first-render ones.
  useEffect(() => () => teardownVoice(), [teardownVoice]);

  return { beginCall, isLive, teardownVoice, scheduleCapHangup };
}
