/**
 * VideoCallApp — Digital Twin "Talk to PK"
 *
 * Design: FaceTime-style call experience
 *   Phase 1 — Incoming call screen (rings, accept / decline)
 *   Phase 2 — Active call: your portrait as remote feed, voice chat, Simli
 *             talking-head avatar layered on top once it connects
 *
 * Voice pipeline:
 *   User speaks → Web Speech API (STT) → /api/chat (persona: digital_twin) →
 *   ElevenLabs TTS (your cloned voice) → Simli lip-syncs it over your portrait
 *   Text input also available as a fallback / alternative to voice.
 *
 * TTS and the Simli session token both run through the backend (/api/tts,
 * /api/simli/session) so neither key ever ships in the client bundle. Falls
 * back to the Web Speech API (browser TTS) if the backend/avatar is unavailable.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO SET THIS UP
 * ─────────────────────────────────────────────────────────────────────────────
 * This component works out of the box once you've done three things:
 *
 * 1. ElevenLabs — clone your voice (Voices → Add Voice → Instant Voice Clone,
 *    ~1-2 min of clean single-speaker audio, no background noise/reverb).
 *    Copy the resulting voice_id and API key into backend/.env as
 *    ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID. See backend.env.example.
 *
 * 2. Simli — create an avatar (simli.ai → one reference photo: high-res,
 *    sharp focus especially the eyes, simple/clean background). Processing
 *    takes a couple of hours, not instant — plan around that. Copy the
 *    resulting Face ID and API key into backend/.env as SIMLI_FACE_ID /
 *    SIMLI_API_KEY.
 *
 * 3. Replace ANIME_PORTRAIT below with your own reference photo (same one
 *    you gave Simli works well) — drop it in client/public/data/ and point
 *    the constant at it. This is the static underlay shown before the avatar
 *    connects, and what stays visible if Simli isn't configured at all —
 *    the call still works as a voice-only experience without it.
 *
 * Everything else — the greeting text, your name in the UI, the persona
 * prompt the AI uses to speak as you — lives in DIGITAL_TWIN_PROMPT in
 * backend/main.py. Update that alongside this file.
 *
 * The call-rate gate (checkCallStart/reportCallEnd, from lib/callGate.ts) is
 * optional infrastructure — see backend.env.example for the Supabase setup.
 * Without it configured, calls are simply unlimited (fails open).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneOff, Mic, MicOff, Volume2, VolumeX,
  Send, Loader2, Subtitles, MessageSquareText, X,
} from 'lucide-react';
import { CallCapReachedError, API_URL, speak } from '@/lib/callAudio';
import { checkCallStart, reportCallEnd, GATE_TIMEOUT_MS, type BlockReason } from '@/lib/callGate';
import { useSimliAvatar } from '@/hooks/useSimliAvatar';
import { usePersistFn } from '@/hooks/usePersistFn';
import { useCaptions, captionWindow } from '@/hooks/useCaptions';
import { dispatchToolCall } from '@/lib/toolDispatch';
import { useOpenWindow } from '@/contexts/WindowActionsContext';

// ─── Constants ────────────────────────────────────────────────────────────────
// Replace with your own reference photo — see the setup note above.
const ANIME_PORTRAIT = '/data/digital-twin-portrait.png';
// How long the real "connecting" phase waits for the Simli avatar before giving up
// and greeting through legacy audio instead (portrait + MP3), same as pre-avatar UX.
const CONNECT_TIMEOUT_MS = 8000;
// Floor so the connecting screen doesn't flash when Simli connects fast or the
// kill-switch (no SIMLI_API_KEY) fails fast.
const MIN_CONNECTING_MS = 1100;

type Phase = 'ringing' | 'connecting' | 'active' | 'ended' | 'blocked';

interface Message {
  role: 'user' | 'pk';
  content: string;
  ts: number;
}

// ─── Web Speech API types ─────────────────────────────────────────────────────
interface SRResult { readonly transcript: string; }
interface SRResultList { readonly length: number; readonly isFinal: boolean; [index: number]: SRResult; }
interface SREvent { readonly results: { length: number; [index: number]: SRResultList; }; }
type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SREvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionType;
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

// ─── Call timer ───────────────────────────────────────────────────────────────
function useCallTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function VideoCallApp() {
  const [phase, setPhase] = useState<Phase>('ringing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);

  // Call-rate gate (2/day per visitor, monthly minutes budget) — 'pending' while
  // /api/call/start is in flight; the connecting-gate effect below waits on it.
  const [gate, setGate] = useState<'pending' | 'allowed' | 'blocked'>('pending');
  const [blockReason, setBlockReason] = useState<BlockReason | null>(null);

  const callTimer = useCallTimer(phase === 'active');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const callSessionIdRef = useRef<string>('');
  const avatar = useSimliAvatar({ onSpeakingChange: setSpeaking });
  const captions = useCaptions(speaking);
  const openWindow = useOpenWindow();
  const connectStartedRef = useRef(0);
  const beganActiveRef = useRef(false);
  // true = nothing to report to /api/call/end (no server row exists for this call)
  const endReportedRef = useRef(true);
  const phaseRef = useRef(phase);
  phaseRef.current = phase; // guards the async 429 handler against stale phases
  const inCall = phase === 'connecting' || phase === 'active';

  // Real connecting phase — waits for the avatar to genuinely come up (or settle as
  // failed) before greeting, instead of a fixed timer. Floor of MIN_CONNECTING_MS
  // avoids a flash on a fast connect/fast-fail; ceiling of CONNECT_TIMEOUT_MS gives up
  // and greets through legacy audio. Re-runs (and re-clears its own timer) whenever
  // avatar.live/failed changes mid-wait, always computing delay from connectStartedRef
  // so it converges on the right moment rather than restarting the clock.
  useEffect(() => {
    if (phase !== 'connecting') return;
    if (gate === 'blocked') return; // the blocked handler in acceptCall owns this transition
    const elapsed = Date.now() - connectStartedRef.current;
    const settled = avatar.live || avatar.failed;
    const avatarDelay = settled
      ? Math.max(0, MIN_CONNECTING_MS - elapsed)
      : Math.max(0, CONNECT_TIMEOUT_MS - elapsed);
    // Hold 'active' while the rate-gate check is in flight, but never past
    // GATE_TIMEOUT_MS — checkCallStart aborts itself on the same clock, so this
    // is belt-and-braces fail-open rather than a second timeout source.
    const gateDelay = gate === 'pending' ? Math.max(0, GATE_TIMEOUT_MS - elapsed) : 0;
    const t = setTimeout(beginActiveCall, Math.max(avatarDelay, gateDelay));
    return () => clearTimeout(t);
  }, [phase, gate, avatar.live, avatar.failed]);

  // Simli avatar cleanup — keyed on `inCall` (connecting OR active), not on `phase`
  // directly, so the connecting->active transition doesn't tear down the avatar that
  // just came up. start() itself is called explicitly and synchronously in acceptCall,
  // not from an effect (effects run after the render commits, too late for the
  // connecting-gate logic above to see a fresh state). Covers decline-during-connecting,
  // call end, unmount mid-session, and "Call again" uniformly.
  useEffect(() => {
    if (!inCall) return;
    // Duration accounting for the monthly budget. Counted from accept (matches the
    // server row's started_at), guarded so it fires exactly once per call across
    // every exit path: endCall, decline-during-connecting, blocked (suppressed via
    // the ref), unmount, and tab close (pagehide — beforeunload is unreliable on iOS).
    const report = () => {
      if (endReportedRef.current) return;
      endReportedRef.current = true;
      const durationSeconds = (Date.now() - connectStartedRef.current) / 1000;
      reportCallEnd(callSessionIdRef.current, durationSeconds);
    };
    window.addEventListener('pagehide', report);
    return () => {
      window.removeEventListener('pagehide', report);
      avatar.stop();
      report();
    };
  }, [inCall]);

  // Scroll chat to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Ringtone (use the existing boot sound as a placeholder ring)
  useEffect(() => {
    if (phase !== 'ringing') return;
    // Subtle pulsing ring tone using oscillator
    try {
      const ctx = new AudioContext();
      let stopped = false;
      const ring = () => {
        if (stopped) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 440;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        setTimeout(ring, 2000);
      };
      ring();
      ringtoneRef.current = { pause: () => { stopped = true; ctx.close(); } } as unknown as HTMLAudioElement;
    } catch (_) {}
    return () => { (ringtoneRef.current as any)?.pause?.(); };
  }, [phase]);

  // Accept call — the video/audio elements are always mounted now (base layer below),
  // so start() can run immediately instead of waiting for the 'active' phase to exist.
  const acceptCall = () => {
    (ringtoneRef.current as any)?.pause?.();
    const sessionId = crypto.randomUUID();
    callSessionIdRef.current = sessionId;
    beganActiveRef.current = false;
    endReportedRef.current = false; // a server row may exist from here on
    connectStartedRef.current = Date.now();
    setGate('pending');
    setBlockReason(null);
    avatar.prefetchToken(sessionId);
    avatar.start(sessionId);
    // Bless the media elements inside the click gesture — helps iOS actually let the
    // avatar's audio play later, now that this is possible (elements always exist).
    avatar.videoRef.current?.play().catch(() => {});
    avatar.audioRef.current?.play().catch(() => {});
    setPhase('connecting');
    // Rate-gate check races the connecting screen (same clock, fails open at 3s).
    checkCallStart(sessionId).then(result => {
      if (callSessionIdRef.current !== sessionId) return; // superseded by a newer call
      if (result.status === 'blocked') {
        if (phaseRef.current !== 'connecting' && phaseRef.current !== 'active') return;
        endReportedRef.current = true; // 429 → server inserted no row, nothing to report
        window.speechSynthesis?.cancel();
        stopListening();
        setBlockReason(result.reason);
        setGate('blocked');
        setPhase('blocked'); // inCall→false, so the cleanup effect stops the avatar
      } else {
        setGate('allowed');
      }
    });
  };

  // Fires once the connecting-gate effect above decides we've waited long enough (either
  // the avatar came up / settled as failed, or CONNECT_TIMEOUT_MS elapsed). Greets through
  // the avatar if it's live, otherwise straight through legacy audio — deliberately NOT
  // via speakLine()/avatar.speak() in the timeout case, since that would stack its own
  // 5s start-race on top of the wait already spent here.
  const beginActiveCall = usePersistFn(() => {
    if (beganActiveRef.current || phase !== 'connecting') return;
    beganActiveRef.current = true;
    setPhase('active');
    // Replace with your own greeting — keep it short, this is spoken aloud.
    const greeting = "Hey! Great to meet you. I'm Pranav — ask me anything about what I'm building, my background, or just say hi.";
    setMessages([{ role: 'pk', content: greeting, ts: Date.now() }]);
    captions.showCaption(greeting, { paceWithSpeech: soundOn });
    if (!soundOn) return;
    if (avatar.live) {
      speakLine(greeting).catch(() => {});
    } else {
      setSpeaking(true);
      speak(greeting, callSessionIdRef.current).catch(() => {}).finally(() => setSpeaking(false));
    }
  });

  // Decline / end call
  const endCall = () => {
    (ringtoneRef.current as any)?.pause?.();
    window.speechSynthesis?.cancel();
    stopListening();
    captions.clearCaption();
    setPhase('ended');
  };

  // Speak a line — Simli avatar first (lips move, video crossfades in), falling back
  // to the legacy MP3/browser-TTS path (callAudio.ts) if the avatar never came up or
  // died mid-call. May throw CallCapReachedError, same as the legacy speak().
  const speakLine = async (text: string) => {
    const sessionId = callSessionIdRef.current;
    const handledByAvatar = await avatar.speak(text, sessionId);
    if (!handledByAvatar) {
      setSpeaking(true);
      try {
        await speak(text, sessionId);
      } finally {
        setSpeaking(false);
      }
    }
  };

  // Director mode — dev builds only. "//<line>" makes the twin speak the exact
  // line: no /api/chat, no LLM, straight into the avatar/TTS path with captions
  // pacing along. Handy shoot rig if you want to record a demo video of your own
  // twin saying specific lines. import.meta.env.DEV is statically false in
  // production builds, so none of this ships live.
  const speakDirectorLine = usePersistFn(async (line: string) => {
    setMessages(prev => [...prev, { role: 'pk', content: line, ts: Date.now() }]);
    captions.showCaption(line, { paceWithSpeech: soundOn });
    if (soundOn) await speakLine(line).catch(() => {});
  });

  // Paste a whole block of "//"-prefixed lines (one per line) and they queue up,
  // each waiting for the previous to finish speaking — one paste delivers a whole
  // segment as one continuous take instead of managing Enter after every line.
  // A single-line paste (the normal case) falls through to the usual send path.
  const handleDirectorPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!import.meta.env.DEV) return;
    const lines = e.clipboardData.getData('text/plain').split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2 || !lines.every(l => l.startsWith('//'))) return; // let default paste happen
    e.preventDefault();
    setInput('');
    (async () => {
      for (const raw of lines) {
        const line = raw.replace(/^\/\/\s*/, '');
        if (line) await speakDirectorLine(line);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    })();
  };

  // Send message to backend
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    // Director mode — dev builds only, see the comment above handleDirectorPaste.
    if (import.meta.env.DEV && text.trim().startsWith('//')) {
      const line = text.trim().replace(/^\/\/\s*/, '');
      if (!line) return;
      setInput('');
      speakDirectorLine(line).catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    const userMsg: Message = { role: 'user', content: text.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTranscript('');
    setLoading(true);

    try {
      let reply = '';
      if (API_URL) {
        const history = messages.slice(-8).map(m => ({
          role: m.role === 'pk' ? 'model' : 'user',
          content: m.content,
        }));
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Call-Session-Id': callSessionIdRef.current },
          body: JSON.stringify({
            message: text.trim(),
            history,
            persona: 'digital_twin', // hint to backend to use first-person
          }),
        });
        if (res.status === 429) throw new CallCapReachedError();
        if (!res.ok) throw new Error(`Backend ${res.status}`);
        const data = await res.json();
        reply = data.reply;
        if (data.tool_call) {
          dispatchToolCall(data.tool_call, {
            openCanvas: (project) => openWindow('canvas', { project }),
            openScheduler: () => openWindow('scheduler'),
            openApp: (appId) => openWindow(appId),
          });
        }
      } else {
        reply = "I can't reach my backend right now — drop me a message at pk.kowadkar@gmail.com!";
      }

      const pkMsg: Message = { role: 'pk', content: reply, ts: Date.now() };
      setMessages(prev => [...prev, pkMsg]);
      captions.showCaption(reply, { paceWithSpeech: soundOn });

      if (soundOn) {
        await speakLine(reply);
      }
    } catch (err) {
      if (err instanceof CallCapReachedError) {
        const capMsg: Message = {
          role: 'pk',
          content: "We've hit the time limit for this call — let's keep going over email: pk.kowadkar@gmail.com!",
          ts: Date.now(),
        };
        setMessages(prev => [...prev, capMsg]);
        captions.showCaption(capMsg.content);
        setSpeaking(false);
        avatar.interrupt();
        setTimeout(() => endCall(), 2500);
        return;
      }
      console.error('Digital twin error:', err);
      const errMsg: Message = {
        role: 'pk',
        content: "Sorry, I'm having a connection issue. Try again in a sec, or reach me at pk.kowadkar@gmail.com.",
        ts: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
      captions.showCaption(errMsg.content);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [messages, loading, soundOn]);

  // Web Speech API — mic. Not implemented in Firefox or most non-Chromium/non-Safari
  // browsers; startListening just no-ops there since the mic button is hidden by
  // the SPEECH_RECOGNITION_SUPPORTED check below.
  const startListening = useCallback(() => {
    const SR: SpeechRecognitionConstructor | undefined = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e: SREvent) => {
      const results = Array.from({ length: e.results.length }, (_, i) => e.results[i]);
      const t = results.map(r => r[0].transcript).join('');
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        sendMessage(t);
        setMicOn(false);
      }
    };
    rec.onerror = () => setMicOn(false);
    rec.onend = () => setMicOn(false);
    rec.start();
    recognitionRef.current = rec;
    setMicOn(true);
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setMicOn(false);
  }, []);

  const toggleMic = () => {
    if (micOn) stopListening();
    else startListening();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full h-full overflow-hidden flex items-center justify-center"
      style={{ background: '#000' }}
    >
      {/* ── REMOTE FEED (always mounted) ── your portrait as a permanent underlay;
          Simli's <video>/<audio> crossfade on top once the avatar connects. Always
          rendered (never conditional on phase) because Simli's 'start' event fires
          from requestVideoFrameCallback and needs the element actually painted —
          it's covered by the opaque ringing/connecting/ended overlays (z-20) and
          only visible once the active phase's transparent-background content (z-10)
          is on top. Every avatar failure mode just means `live` stays false and the
          portrait stays visible — a working voice-only call either way. */}
      <div className="absolute inset-0 z-0">
        <img
          src={ANIME_PORTRAIT}
          alt="Pranav"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 10%',
            filter: 'brightness(0.55)',
          }}
        />
        <video
          ref={avatar.videoRef}
          autoPlay
          playsInline
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            // Simli outputs a roughly square feed -- contain (not cover) so it
            // letterboxes over the portrait instead of being zoomed/cropped.
            objectFit: 'contain', objectPosition: 'center',
            filter: 'brightness(0.85)',
            opacity: avatar.live ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />
        <audio ref={avatar.audioRef} autoPlay style={{ display: 'none' }} />
        {/* Speaking glow overlay */}
        <AnimatePresence>
          {speaking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0.2, 0.35, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(52,199,89,0.25) 0%, transparent 70%)' }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── INCOMING CALL ── */}
      <AnimatePresence>
        {phase === 'ringing' && (
          <motion.div
            key="ringing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-between py-16 z-20"
            style={{
              background: 'linear-gradient(180deg, #0a0a0c 0%, #12121a 60%, #0a0a0c 100%)',
            }}
          >
            {/* Blurred bg portrait */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${ANIME_PORTRAIT})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 10%',
                filter: 'blur(40px) brightness(0.25)',
                transform: 'scale(1.1)',
              }}
            />

            {/* Top info */}
            <div className="relative z-10 flex flex-col items-center gap-3 mt-4">
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}>
                INCOMING CALL
              </p>
              {/* Avatar with rings */}
              <div className="relative flex items-center justify-center mt-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${140 + i * 40}px`,
                      height: `${140 + i * 40}px`,
                      border: '1.5px solid rgba(52,199,89,0.25)',
                      animation: `pulse-ring ${1.8 + i * 0.3}s ease-out infinite ${i * 0.4}s`,
                    }}
                  />
                ))}
                <div
                  className="relative rounded-full overflow-hidden"
                  style={{
                    width: '120px',
                    height: '120px',
                    border: '3px solid rgba(52,199,89,0.7)',
                    boxShadow: '0 0 30px rgba(52,199,89,0.3)',
                  }}
                >
                  <img
                    src={ANIME_PORTRAIT}
                    alt="Pranav"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }}
                  />
                </div>
              </div>

              <div className="text-center mt-4">
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: '#f0f0f2', fontStyle: 'italic' }}>
                  Pranav Kowadkar
                </p>
                <motion.p
                  style={{ fontFamily: "'Outfit', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  Digital Twin · AI Engineer
                </motion.p>
              </div>
            </div>

            {/* Accept / Decline */}
            <div className="relative z-10 flex items-center gap-16">
              {/* Decline */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={endCall}
                  aria-label="Decline call"
                  className="flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
                  style={{
                    width: '68px', height: '68px', borderRadius: '50%',
                    background: '#ff3b30',
                    boxShadow: '0 4px 24px rgba(255,59,48,0.45)',
                    border: 'none',
                  }}
                >
                  <PhoneOff size={26} color="white" />
                </button>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>Decline</span>
              </div>

              {/* Accept */}
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  onClick={acceptCall}
                  aria-label="Accept call"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
                  style={{
                    width: '68px', height: '68px', borderRadius: '50%',
                    background: '#34c759',
                    boxShadow: '0 4px 24px rgba(52,199,89,0.5)',
                    border: 'none',
                  }}
                >
                  {/* Phone icon (inline SVG) */}
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </motion.button>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>Accept</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONNECTING ── */}
      <AnimatePresence>
        {phase === 'connecting' && (
          <motion.div
            key="connecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20"
            style={{ background: '#000' }}
          >
            <motion.div
              className="rounded-full overflow-hidden"
              style={{ width: '100px', height: '100px', border: '2px solid rgba(255,255,255,0.15)' }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <img src={ANIME_PORTRAIT} alt="Pranav" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} />
            </motion.div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
              CONNECTING...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ACTIVE CALL ── */}
      <AnimatePresence>
        {phase === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col z-10"
          >
            {/* Top bar — name + timer */}
            <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-2"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
              <div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '17px', color: '#f0f0f2', fontStyle: 'italic' }}>
                  Pranav Kowadkar
                </p>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34c759' }} />
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>
                    {callTimer}
                  </p>
                  {speaking && (
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#34c759', marginLeft: '4px' }}
                    >
                      speaking
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Captions toggle / transcript / sound */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => captions.setCcOn(!captions.ccOn)}
                  title={captions.ccOn ? 'Hide captions' : 'Show captions'}
                  aria-label={captions.ccOn ? 'Hide captions' : 'Show captions'}
                  className="flex items-center justify-center"
                  style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: captions.ccOn ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                  }}
                >
                  <Subtitles size={15} color={captions.ccOn ? 'white' : 'rgba(255,255,255,0.4)'} />
                </button>
                <button
                  onClick={() => setShowTranscript(s => !s)}
                  title="Transcript"
                  aria-label={showTranscript ? 'Hide transcript' : 'Show transcript'}
                  className="flex items-center justify-center"
                  style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: showTranscript ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                  }}
                >
                  <MessageSquareText size={15} color={showTranscript ? 'white' : 'rgba(255,255,255,0.4)'} />
                </button>
                <button
                  onClick={() => setSoundOn(s => !s)}
                  aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
                  className="flex items-center justify-center"
                  style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                  }}
                >
                  {soundOn ? <Volume2 size={15} color="white" /> : <VolumeX size={15} color="rgba(255,255,255,0.4)" />}
                </button>
              </div>
            </div>

            {/* Lower third — the face stays visible; text is a rolling caption
                strip, never the full reply (that lives in the transcript). */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-end gap-2 overflow-hidden px-8 pb-3">
              <AnimatePresence>
                {loading && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full"
                    style={{
                      background: 'rgba(0,0,0,0.55)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </motion.div>
                )}
                {captions.ccOn && captions.caption && (
                  <motion.div
                    key="caption"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      maxWidth: '640px',
                      padding: '9px 16px',
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '15px',
                      color: '#f5f5f1',
                      lineHeight: 1.5,
                      textAlign: 'center',
                    }}
                  >
                    {captionWindow(captions.caption, 14)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom controls */}
            <div
              className="relative z-10 px-4 pb-4 pt-2 flex flex-col gap-3"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
            >
              {/* Voice transcript preview */}
              <AnimatePresence>
                {micOn && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                  >
                    <motion.div
                      style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff3b30', flexShrink: 0 }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
                      {transcript || 'Listening...'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Text input row */}
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                    onPaste={handleDirectorPaste}
                    placeholder="Type a message..."
                    disabled={loading || micOn}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      color: '#f0f0f2', fontSize: '13px', fontFamily: "'Outfit', sans-serif",
                    }}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim() || micOn}
                    aria-label="Send message"
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                      background: input.trim() && !loading && !micOn ? '#E50914' : 'rgba(255,255,255,0.15)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'background 0.2s',
                    }}
                  >
                    {loading ? <Loader2 size={13} color="white" className="animate-spin" /> : <Send size={13} color="white" />}
                  </button>
                </div>

                {/* Mic button */}
                <motion.button
                  onClick={toggleMic}
                  disabled={loading}
                  aria-label={micOn ? 'Stop voice input' : 'Start voice input'}
                  animate={micOn ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 0.8, repeat: micOn ? Infinity : 0 }}
                  style={{
                    width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                    background: micOn ? '#ff3b30' : 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(12px)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: micOn ? '0 0 20px rgba(255,59,48,0.5)' : 'none',
                    transition: 'background 0.2s, box-shadow 0.2s',
                  }}
                >
                  {micOn ? <Mic size={18} color="white" /> : <MicOff size={18} color="rgba(255,255,255,0.7)" />}
                </motion.button>

                {/* End call */}
                <button
                  onClick={endCall}
                  aria-label="End call"
                  style={{
                    width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                    background: '#ff3b30',
                    boxShadow: '0 4px 16px rgba(255,59,48,0.4)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PhoneOff size={18} color="white" />
                </button>
              </div>

            </div>

            {/* Transcript — glass side panel, beside the face rather than over it */}
            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  key="transcript"
                  initial={{ x: 320, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 320, opacity: 0 }}
                  transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
                  className="absolute top-0 bottom-0 right-0 z-20 flex flex-col"
                  style={{
                    width: '300px',
                    background: 'rgba(16,16,20,0.78)',
                    backdropFilter: 'blur(24px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(150%)',
                    borderLeft: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)' }}>
                      TRANSCRIPT
                    </span>
                    <button
                      onClick={() => setShowTranscript(false)}
                      aria-label="Close transcript"
                      className="flex items-center justify-center"
                      style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <X size={13} color="rgba(255,255,255,0.6)" />
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col gap-2 px-3 py-3 overflow-y-auto">
                    {messages.map((msg) => (
                      <div key={msg.ts} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          style={{
                            maxWidth: '85%',
                            padding: '7px 11px',
                            borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: msg.role === 'user' ? 'rgba(229,9,20,0.6)' : 'rgba(255,255,255,0.07)',
                            border: msg.role === 'pk' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: '12.5px',
                            color: '#f0f0f2',
                            lineHeight: 1.5,
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div
                          style={{
                            padding: '9px 12px', borderRadius: '14px 14px 14px 4px',
                            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex', gap: '4px', alignItems: 'center',
                          }}
                        >
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CALL ENDED ── */}
      <AnimatePresence>
        {phase === 'ended' && (
          <motion.div
            key="ended"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20"
            style={{ background: '#000' }}
          >
            <div
              className="rounded-full overflow-hidden opacity-40"
              style={{ width: '80px', height: '80px' }}
            >
              <img src={ANIME_PORTRAIT} alt="Pranav" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} />
            </div>
            <div className="text-center">
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                Call ended
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', letterSpacing: '0.05em' }}>
                {callTimer}
              </p>
            </div>
            <button
              onClick={() => { setPhase('ringing'); setMessages([]); }}
              style={{
                padding: '10px 24px', borderRadius: '24px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif", fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Call again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CALL BLOCKED (daily limit / monthly budget) ── no "Call again" — it
          would just loop into another blocked round-trip. Email CTA instead. */}
      <AnimatePresence>
        {phase === 'blocked' && (
          <motion.div
            key="blocked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20"
            style={{ background: '#000' }}
          >
            <div
              className="rounded-full overflow-hidden opacity-40"
              style={{ width: '80px', height: '80px' }}
            >
              <img src={ANIME_PORTRAIT} alt="Pranav" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} />
            </div>
            <div className="text-center" style={{ maxWidth: '320px' }}>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                {blockReason === 'monthly_budget' ? "The twin's resting this month" : "We've talked a lot today"}
              </p>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', lineHeight: 1.5 }}>
                {blockReason === 'monthly_budget'
                  ? "This month's call minutes are all used up — the human version is still available."
                  : 'The twin has a daily call limit — come back tomorrow, or email the real Pranav.'}
              </p>
            </div>
            <a
              href="mailto:pk.kowadkar@gmail.com"
              style={{
                padding: '10px 24px', borderRadius: '24px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif", fontSize: '13px',
                cursor: 'pointer', textDecoration: 'none',
              }}
            >
              Email Pranav
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
