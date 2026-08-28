/**
 * useSimliAvatar — the whole Simli real-time avatar surface for the Digital Twin call
 * components (VideoCallApp.tsx desktop, MobileDigitalTwin.tsx mobile).
 *
 * Design: the static anime-portrait <img> stays as a PERMANENT underlay in both
 * components, and the <video>/<audio> pair this hook drives is now ALWAYS MOUNTED
 * (moved out of the phase-gated 'active' block into a base layer covered by opaque
 * ringing/connecting/ended overlays) — Simli's 'start' event fires from
 * requestVideoFrameCallback and needs the element actually rendered, so it can never
 * fire if the video only mounts once the call is already 'active'. This hook only
 * ever asks the caller to crossfade the video in (`live`), never to remove anything.
 * Every failure mode -- no key configured, token mint fails, WebRTC drop, depleted
 * minutes -- just means `live`/`failed` reflect that, and the caller's existing
 * MP3/browser-TTS speak() path (client/src/lib/callAudio.ts) keeps working.
 *
 * Transport is 'livekit', not 'p2p' -- matches Simli's own reference ElevenLabs demo
 * (create-simli-app-elevenlabs) and confirmed against the SDK source: livekit mode
 * ignores ICE servers entirely (audio/video flow over the signaling WebSocket), so
 * there's no ICE plumbing here or on the backend.
 *
 * Lifecycle:
 *   1. prefetchToken(sessionId) -- call from acceptCall(), inside the click gesture,
 *      overlapping the real "connecting" wait (see the gating effect in each component).
 *   2. start(sessionId) -- call explicitly and synchronously from acceptCall too (NOT
 *      from an effect -- effects run after the render commit, which would leave the
 *      avatar still 'idle' when the greeting's speak() checks it moments later).
 *   3. speak(text, sessionId) -- returns false if the caller should fall back to the
 *      legacy speak() from callAudio.ts (avatar never came up, or died mid-call).
 *   4. interrupt() -- call when the call-cap 429 fires, before the grace-period hangup.
 *   5. stop() -- call from a cleanup effect keyed on an `inCall` boolean (connecting OR
 *      active), not on phase directly, so the connecting->active transition doesn't
 *      tear down the avatar that just came up.
 */

import { useRef, useState, useEffect } from 'react';
import { SimliClient, LogLevel } from 'simli-client';
import { usePersistFn } from './usePersistFn';
import { CallCapReachedError, fetchTtsPcm, API_URL } from '@/lib/callAudio';

type AvatarInternalState = 'idle' | 'starting' | 'live' | 'failed';

// Simli's own demo chunk size for sendAudioData -- comfortably under WebRTC
// datachannel message-size limits. PCM16 mono 16kHz = 32,000 bytes/sec, so this
// is ~187ms of audio per chunk.
const CHUNK_BYTES = 6000;
const BYTES_PER_MS = 32; // 16000 samples/s * 2 bytes/sample / 1000ms

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function useSimliAvatar(opts: { onSpeakingChange: (speaking: boolean) => void }) {
  const onSpeakingChange = usePersistFn(opts.onSpeakingChange);

  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const clientRef = useRef<SimliClient | null>(null);
  const stateRef = useRef<AvatarInternalState>('idle');
  const epochRef = useRef(0);
  const tokenPromiseRef = useRef<Promise<string | null> | null>(null);
  const startPromiseRef = useRef<Promise<void> | null>(null);
  // Tracks whether a 'speaking' event fired for the CURRENT speak() call, so a
  // mid-utterance WebRTC drop only triggers an MP3 replay if nothing played yet.
  const spokeThisTurnRef = useRef(false);

  const closeLeakedAudioContext = (client: SimliClient) => {
    // The SDK opens a new AudioContext per client and never closes it -- browsers cap
    // concurrent contexts (~6), so repeated "Call again" cycles would eventually break.
    try {
      (client as unknown as { audioContext?: AudioContext }).audioContext?.close();
    } catch { /* already closed / not applicable */ }
  };

  const failPermanently = usePersistFn(() => {
    stateRef.current = 'failed';
    setLive(false);
    setFailed(true);
    const client = clientRef.current;
    if (client) {
      try { client.stop(); } catch { /* already gone */ }
      closeLeakedAudioContext(client);
    }
    clientRef.current = null;
    onSpeakingChange(false);
  });

  const fetchToken = usePersistFn(async (sessionId: string): Promise<string | null> => {
    if (!API_URL) return null;
    try {
      const res = await fetch(`${API_URL}/api/simli/session`, {
        method: 'POST',
        headers: { 'X-Call-Session-Id': sessionId },
      });
      if (!res.ok) return null; // 503 (no key configured) or 429 (cap) -- both mean "no avatar"
      const data = await res.json();
      return data.session_token ?? null;
    } catch {
      return null;
    }
  });

  const prefetchToken = usePersistFn((sessionId: string) => {
    tokenPromiseRef.current = fetchToken(sessionId);
  });

  const start = usePersistFn((sessionId: string) => {
    const epoch = ++epochRef.current;
    stateRef.current = 'starting';
    setFailed(false);

    startPromiseRef.current = (async () => {
      const token = tokenPromiseRef.current ? await tokenPromiseRef.current : await fetchToken(sessionId);
      if (epoch !== epochRef.current) return; // superseded (unmount/re-call/StrictMode)
      if (!token) { failPermanently(); return; }
      if (!videoRef.current || !audioRef.current) { failPermanently(); return; }

      // A fresh instance every start -- the SDK does not support restarting a
      // stopped client, and this also sidesteps any leftover listener state.
      const client = new SimliClient(
        token, videoRef.current, audioRef.current, null, LogLevel.ERROR, 'livekit',
      );
      // Swallow the SDK's orphaned connectionPromise rejection (fires if the internal
      // retry path replaces it after a WebSocket failure) -- cosmetic, already handled
      // via the 'startup_error'/'error' events below, just keeps the console clean.
      (client as unknown as { connectionPromise?: Promise<void> }).connectionPromise?.catch(() => {});

      client.on('start', () => {
        // Guards against the SDK's missing-`break` fallthrough (an ERROR frame can
        // emit 'error' then a ghost 'speaking'/'start') resurrecting a failed client.
        if (epoch !== epochRef.current || stateRef.current !== 'starting') return;
        stateRef.current = 'live';
        setLive(true);
        // Prime the pipeline with a short silent chunk, same as Simli's own demo --
        // kicks off the audio path immediately rather than waiting for real speech.
        try { client.sendAudioData(new Uint8Array(CHUNK_BYTES)); } catch { /* WS not open yet */ }
      });
      const stillActive = () =>
        epoch === epochRef.current && (stateRef.current === 'starting' || stateRef.current === 'live');
      client.on('speaking', () => {
        if (!stillActive()) return;
        spokeThisTurnRef.current = true;
        onSpeakingChange(true);
      });
      client.on('silent', () => {
        if (!stillActive()) return;
        onSpeakingChange(false);
      });
      const onFail = () => { if (epoch === epochRef.current) failPermanently(); };
      client.on('startup_error', onFail);
      client.on('error', onFail);
      client.on('stop', onFail);

      clientRef.current = client;
      try {
        await client.start();
      } catch {
        if (epoch === epochRef.current) failPermanently();
        return;
      }
      if (epoch !== epochRef.current) return;
      // Belt-and-braces for iOS autoplay policy (also blessed synchronously in the
      // click gesture by the caller, now that the elements are always mounted).
      videoRef.current?.play().catch(() => {});
      audioRef.current?.play().catch(() => {});
    })();
  });

  const stop = usePersistFn(() => {
    epochRef.current++; // cancels any in-flight start/speak
    const client = clientRef.current;
    if (client) {
      try { client.ClearBuffer(); } catch { /* no-op */ }
      client.stop().catch(() => {});
      closeLeakedAudioContext(client);
    }
    clientRef.current = null;
    stateRef.current = 'idle';
    setLive(false);
    setFailed(false);
    tokenPromiseRef.current = null;
    startPromiseRef.current = null;
    onSpeakingChange(false);
  });

  const interrupt = usePersistFn(() => {
    try { clientRef.current?.ClearBuffer(); } catch { /* no-op */ }
  });

  const speak = usePersistFn(async (text: string, sessionId: string): Promise<boolean> => {
    if (stateRef.current === 'starting' && startPromiseRef.current) {
      // Let the caller wait for WebRTC instead of playing voice-over-static-img.
      // Rarely hit now that components gate the greeting on the real connecting
      // phase -- this only matters for a reply sent while a late connect is pending.
      await Promise.race([startPromiseRef.current, sleep(5000)]);
    }
    if (stateRef.current !== 'live' || !clientRef.current) return false;

    const epoch = epochRef.current;
    spokeThisTurnRef.current = false;
    try {
      const pcm = await fetchTtsPcm(text, sessionId); // throws CallCapReachedError on 429
      if (epoch !== epochRef.current) return true; // call ended mid-fetch; not a failure

      const client = clientRef.current;
      for (let i = 0; i < pcm.length; i += CHUNK_BYTES) {
        if (epoch !== epochRef.current) return true;
        client.sendAudioData(pcm.slice(i, i + CHUNK_BYTES));
        if ((i / CHUNK_BYTES) % 8 === 7) await sleep(0); // yield to the event loop
      }

      const hardTimeoutMs = pcm.byteLength / BYTES_PER_MS + 4000;
      const deadline = Date.now() + hardTimeoutMs;
      await new Promise<void>((resolve) => {
        const check = () => {
          if (epoch !== epochRef.current) { resolve(); return; }
          if (Date.now() >= deadline) { resolve(); return; }
          setTimeout(check, 100);
        };
        // Resolve on the actual 'silent' event if it comes first.
        const onSilent = () => { if (spokeThisTurnRef.current) { cleanup(); resolve(); } };
        const cleanup = () => clientRef.current?.off('silent', onSilent);
        clientRef.current?.on('silent', onSilent);
        check();
      });
      return true;
    } catch (e) {
      if (e instanceof CallCapReachedError) throw e;
      const playedSomething = spokeThisTurnRef.current;
      failPermanently();
      return playedSomething; // if it already started talking, don't replay over MP3
    }
  });

  // Unmount safety net.
  useEffect(() => () => stop(), [stop]);

  return { videoRef, audioRef, live, failed, prefetchToken, start, stop, interrupt, speak };
}
