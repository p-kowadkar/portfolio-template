/**
 * MobileDigitalTwin — iOS FaceTime-style Digital Twin for mobile
 * Same voice pipeline as desktop VideoCallApp — see that file for the full
 * setup instructions (ElevenLabs voice clone + Simli avatar + your own
 * reference photo). Keep this file and VideoCallApp.tsx in sync when you
 * edit the greeting, name, or portrait.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Send, Loader2, ChevronLeft, Subtitles, MessageSquareText, X, Maximize2 } from 'lucide-react';
import { CallCapReachedError, API_URL, speak } from '@/lib/callAudio';
import { checkCallStart, reportCallEnd, GATE_TIMEOUT_MS, CALL_CAP_MS, CAP_MESSAGE, type BlockReason } from '@/lib/callGate';
import { setCallLive } from '@/lib/callPresence';
import { compactBubbleMode } from '@/lib/callBubble';
import { useSimliAvatar } from '@/hooks/useSimliAvatar';
import { usePersistFn } from '@/hooks/usePersistFn';
import { useCaptions, captionWindow } from '@/hooks/useCaptions';
import { dispatchToolCall } from '@/lib/toolDispatch';
import { useCallTeardown } from '@/hooks/useCallTeardown';
import { useCallTimer } from '@/hooks/useCallTimer';
import type { SREvent, SpeechRecognitionType, SpeechRecognitionConstructor } from '@/lib/speechRecognition';

// Backend's open_app ids -> mobile's own screen ids. Canvas/scheduler ids
// already match (both sides use 'canvas'/'scheduler'), so only 'cv' needs
// translating.
const APP_ID_TO_MOBILE_SCREEN: Record<string, string> = {
  projects: 'projects',
  mystory: 'mystory',
  cv: 'resume',
};

// Replace with your own reference photo — see VideoCallApp.tsx for setup notes.
const ANIME_PORTRAIT = '/data/digital-twin-portrait.png';
// See VideoCallApp.tsx for the full rationale on these two constants.
const CONNECT_TIMEOUT_MS = 8000;
const MIN_CONNECTING_MS = 1100;
// The bubble's "Call ended" card fades on its own after this, so it never sits over a booking form.
const BUBBLE_ENDED_CARD_MS = 8000;

type Phase = 'ringing' | 'connecting' | 'active' | 'ended' | 'blocked';
interface Message { role: 'user' | 'pk'; content: string; ts: number; }

// ── Component ─────────────────────────────────────────────────────────────────
// onOpenApp: opens another mobile app screen as an overlay ON TOP of this one
// without unmounting it — wired by MobileShell.tsx to its overlayApp stack (see
// that file's comment on why: a mid-call tool call must not kill this screen's
// avatar/audio state just because a canvas or scheduler opened over it).
export default function MobileDigitalTwin({
  onClose,
  onOpenApp,
  compact,
  onExpand,
}: {
  onClose: () => void;
  onOpenApp?: (id: string, params?: Record<string, unknown>) => void;
  // True while Canvas/Scheduler is open on top of this screen (MobileShell's
  // isCallCompact) — swaps the active-call layout for a small floating bubble
  // instead of the normal full-screen call UI. onExpand restores it (closes
  // the overlay via MobileShell's setOverlayApp(null)), same as desktop's
  // restore button flips isCompact back off.
  compact?: boolean;
  onExpand?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('ringing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  // Compact bubble's own message row — see VideoCallApp.tsx for the rationale.
  const [compactMessageOpen, setCompactMessageOpen] = useState(false);
  // Call-rate gate — see VideoCallApp.tsx for the full rationale.
  const [gate, setGate] = useState<'pending' | 'allowed' | 'blocked'>('pending');
  const [blockReason, setBlockReason] = useState<BlockReason | null>(null);
  // The time limit ended this call (the client timer, or a server 429): the ended screens say so.
  const [endedByCap, setEndedByCap] = useState(false);
  // The bubble's "Call ended" card was dismissed or faded -- see callBubble.ts.
  const [bubbleEndedDismissed, setBubbleEndedDismissed] = useState(false);
  const callTimer = useCallTimer(phase === 'active', phase === 'ringing' || phase === 'connecting');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const callSessionIdRef = useRef<string>('');
  // The in-flight /api/chat request -- aborted by call.teardownVoice(). See
  // VideoCallApp.tsx / useCallTeardown.ts for the full rationale.
  const chatAbortRef = useRef<AbortController | null>(null);
  const avatar = useSimliAvatar({ onSpeakingChange: setSpeaking });
  const captions = useCaptions(speaking);
  const connectStartedRef = useRef(0);
  const beganActiveRef = useRef(false);
  const endReportedRef = useRef(true);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const inCall = phase === 'connecting' || phase === 'active';
  const bubble = compactBubbleMode(!!compact, phase, bubbleEndedDismissed);
  const callOwner = useRef({}).current; // this call view's hold in lib/callPresence.ts

  // The one shared teardown for the voice pipeline -- see VideoCallApp.tsx / useCallTeardown.ts.
  const call = useCallTeardown({
    chatAbortRef,
    recognitionRef,
    avatarInterrupt: avatar.interrupt,
    onMicOff: () => setMicOn(false),
  });

  // While this view holds callPresence, a rotation or resize cannot swap the phone shell for the desktop
  // one (that would unmount a live call) -- see VideoCallApp.tsx. Taken at accept, kept through "Call
  // ended" and the blocked screen, dropped when the view is gone. NOT on "Call again": it returns to the
  // same view. Back/Close drop it BEFORE onClose, because the unmount only comes after the screen's exit
  // animation.
  useEffect(() => {
    const release = () => setCallLive(callOwner, false);
    window.addEventListener('pagehide', release);
    return () => {
      window.removeEventListener('pagehide', release);
      release();
    };
  }, []);
  const closeView = () => {
    setCallLive(callOwner, false);
    onClose();
  };

  // Real connecting phase — see VideoCallApp.tsx for the full rationale. Waits for
  // the avatar to genuinely come up (or settle as failed) before greeting.
  useEffect(() => {
    if (phase !== 'connecting') return;
    if (gate === 'blocked') return; // the blocked handler in acceptCall owns this transition
    const elapsed = Date.now() - connectStartedRef.current;
    const settled = avatar.live || avatar.failed;
    const avatarDelay = settled
      ? Math.max(0, MIN_CONNECTING_MS - elapsed)
      : Math.max(0, CONNECT_TIMEOUT_MS - elapsed);
    const gateDelay = gate === 'pending' ? Math.max(0, GATE_TIMEOUT_MS - elapsed) : 0;
    const t = setTimeout(beginActiveCall, Math.max(avatarDelay, gateDelay));
    return () => clearTimeout(t);
  }, [phase, gate, avatar.live, avatar.failed]);

  // Simli avatar cleanup — keyed on `inCall`, not `phase`, so connecting->active
  // doesn't tear down the avatar that just came up. start() itself is called
  // explicitly in acceptCall, not from an effect (see VideoCallApp.tsx).
  useEffect(() => {
    if (!inCall) return;
    // Duration accounting for the monthly budget — see VideoCallApp.tsx.
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Ringtone
  useEffect(() => {
    if (phase !== 'ringing') return;
    let stopped = false;
    try {
      const ctx = new AudioContext();
      const ring = () => {
        if (stopped) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 440; osc.type = 'sine';
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
        setTimeout(ring, 2000);
      };
      ring();
      return () => { stopped = true; ctx.close(); };
    } catch { return; }
  }, [phase]);

  // Elements are always mounted now (base layer below), so start() can run immediately.
  const acceptCall = () => {
    const sessionId = crypto.randomUUID();
    callSessionIdRef.current = sessionId;
    beganActiveRef.current = false;
    endReportedRef.current = false;
    connectStartedRef.current = Date.now();
    call.beginCall();
    setGate('pending');
    setBlockReason(null);
    setEndedByCap(false);
    setBubbleEndedDismissed(false);
    avatar.prefetchToken(sessionId);
    avatar.start(sessionId);
    avatar.videoRef.current?.play().catch(() => {});
    avatar.audioRef.current?.play().catch(() => {});
    setCallLive(callOwner, true); // in the click, next to setPhase -- see the hold above
    setPhase('connecting');
    // Rate-gate check races the connecting screen — see VideoCallApp.tsx.
    checkCallStart(sessionId).then(result => {
      if (callSessionIdRef.current !== sessionId) return;
      if (!call.isLive()) return; // torn down (cancelled, unmounted) while the gate was answering
      if (result.status === 'blocked') {
        if (phaseRef.current !== 'connecting' && phaseRef.current !== 'active') return;
        endReportedRef.current = true; // 429 → server inserted no row
        // See VideoCallApp.tsx: a request and the mic may already be running by now.
        call.teardownVoice();
        setBlockReason(result.reason);
        setGate('blocked');
        setPhase('blocked');
      } else {
        setGate('allowed');
      }
    });
  };

  const beginActiveCall = usePersistFn(() => {
    if (beganActiveRef.current || phase !== 'connecting') return;
    beganActiveRef.current = true;
    setPhase('active');
    // Replace with your own greeting — keep it short, this is spoken aloud.
    const greeting = "Hey! Great to connect. I'm Pranav — ask me anything about what I'm building or my background.";
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

  // See VideoCallApp.tsx for the full rationale — teardownVoice is the one shared
  // hang-up, without which a reply already in flight could still speak out loud
  // after "Call ended" is already on screen. Ending a call never closes the
  // overlay a bubble sits over: the Scheduler there may hold a half-filled booking
  // (the bubble's End button sits right next to Expand, and the time limit ends
  // calls the visitor is not looking at). The bubble turns into a small "Call
  // ended" card instead (callBubble.ts), and the full ended screen is waiting when
  // the visitor closes the overlay themselves.
  const endCall = () => {
    call.teardownVoice();
    captions.clearCaption();
    setCompactMessageOpen(false);
    setPhase('ended');
  };

  // Idempotent -- see VideoCallApp.tsx's handleCapReached for the full rationale.
  const handleCapReached = usePersistFn(() => {
    if (!call.isLive()) return;
    call.teardownVoice(); // clears the cap timer, so the hangup below is scheduled AFTER it
    setMessages(prev => [...prev, { role: 'pk', content: CAP_MESSAGE, ts: Date.now() }]);
    captions.showCaption(CAP_MESSAGE);
    setEndedByCap(true);
    setSpeaking(false);
    call.scheduleCapHangup(endCall, 2500);
  });

  // The bubble's "Call ended" card is a notice, not a dialog: it clears itself.
  useEffect(() => {
    if (bubble !== 'ended') return;
    const t = setTimeout(() => setBubbleEndedDismissed(true), BUBBLE_ENDED_CARD_MS);
    return () => clearTimeout(t);
  }, [bubble]);

  // Speak a line — Simli avatar first, falling back to the legacy MP3/browser-TTS
  // path (callAudio.ts) if the avatar never came up or died mid-call.
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

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading || !call.isLive()) return;
    setMessages(prev => [...prev, { role: 'user', content: text.trim(), ts: Date.now() }]);
    setInput(''); setTranscript(''); setLoading(true);

    // Tracked so call.teardownVoice() can abort this request from any exit path — see
    // VideoCallApp.tsx / useCallTeardown.ts.
    const controller = new AbortController();
    chatAbortRef.current = controller;

    try {
      let reply = '';
      if (API_URL) {
        const history = messages.slice(-8).map(m => ({ role: m.role === 'pk' ? 'model' : 'user', content: m.content }));
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Call-Session-Id': callSessionIdRef.current },
          body: JSON.stringify({ message: text.trim(), history, persona: 'digital_twin' }),
          signal: controller.signal,
        });
        if (!call.isLive() || controller.signal.aborted) return;
        if (res.status === 429) throw new CallCapReachedError();
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (!call.isLive() || controller.signal.aborted) return;
        reply = data.reply;
        if (data.tool_call && onOpenApp) {
          dispatchToolCall(data.tool_call, {
            openCanvas: (project) => onOpenApp('canvas', { project }),
            openScheduler: () => onOpenApp('scheduler'),
            openApp: (appId) => {
              const mobileId = APP_ID_TO_MOBILE_SCREEN[appId];
              if (mobileId) onOpenApp(mobileId);
            },
          });
        }
      } else {
        reply = "I can't reach my backend right now — drop me a message at pk.kowadkar@gmail.com!";
      }
      setMessages(prev => [...prev, { role: 'pk', content: reply, ts: Date.now() }]);
      captions.showCaption(reply, { paceWithSpeech: soundOn });
      if (soundOn) {
        await speakLine(reply);
      }
    } catch (err) {
      if (controller.signal.aborted) return; // deliberate teardown, not a failure
      if (err instanceof CallCapReachedError) {
        handleCapReached();
        return;
      }
      if (!call.isLive()) return; // torn down while the request was failing
      const errText = "Connection issue — try again in a sec!";
      setMessages(prev => [...prev, { role: 'pk', content: errText, ts: Date.now() }]);
      captions.showCaption(errText);
    } finally {
      if (chatAbortRef.current === controller) chatAbortRef.current = null;
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [messages, loading, soundOn]);

  const startListening = useCallback(() => {
    const SR: SpeechRecognitionConstructor | undefined = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e: SREvent) => {
      const results = Array.from({ length: e.results.length }, (_, i) => e.results[i]);
      const t = results.map(r => r[0].transcript).join('');
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) { sendMessage(t); setMicOn(false); }
    };
    rec.onerror = () => setMicOn(false);
    rec.onend = () => setMicOn(false);
    rec.start();
    recognitionRef.current = rec;
    setMicOn(true);
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop(); recognitionRef.current = null; setMicOn(false);
  }, []);

  // Compact mode shrinks the whole component's root into a small top-right box
  // instead of adding a separate small element elsewhere in the tree — the
  // remote-feed video/portrait layer below is `absolute inset-0` relative to
  // THIS root, so shrinking the root is what makes the twin's face actually
  // show up inside the bubble, rather than a small black box floating over a
  // still-full-screen (now off-screen/covered) video layer.
  //
  // Once the call is over the bubble is either the small "Call ended" card or nothing at all (see
  // callBubble.ts), and in both the overlay underneath must stay usable: the root lets taps through.
  // The card is the exception: it is opaque, so a tap on it must not reach the booking under it
  // unseen; it catches the tap and a tap on it dismisses it. Hidden is opacity 0, not display:none,
  // so the always-mounted remote feed keeps painting.
  const rootStyle: React.CSSProperties = compact
    ? {
        position: 'fixed', top: '52px', right: '12px', width: '150px', height: '190px',
        borderRadius: '18px', overflow: 'hidden', pointerEvents: bubble === 'active' ? 'auto' : 'none',
        opacity: bubble === 'hidden' ? 0 : 1,
        border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
        background: '#000', fontFamily: "'Outfit', sans-serif",
      }
    : { background: '#000', fontFamily: "'Outfit', sans-serif" };

  return (
    <div className={compact ? 'flex flex-col' : 'fixed inset-0 flex flex-col overflow-hidden'} style={rootStyle}
      aria-hidden={bubble === 'hidden' || undefined} inert={bubble === 'hidden' || undefined}>

      {/* ── REMOTE FEED (always mounted) ── see VideoCallApp.tsx for the full rationale:
          Simli's 'start' event needs the <video> actually painted, so it can't be
          conditional on phase. Covered by the opaque ringing/connecting/ended overlays
          (z-20) below; only visible through the active phase's transparent content (z-10). */}
      <div className="absolute inset-0 z-0">
        <img src={ANIME_PORTRAIT} alt="Pranav" style={{
          width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%',
          filter: 'brightness(0.5)',
          // See VideoCallApp.tsx for the full rationale -- without fading this out
          // once the video is live, it stays visible behind the video forever in
          // the letterboxed margins objectFit:'contain' leaves uncovered.
          opacity: avatar.live ? 0 : 1,
          transition: 'opacity 0.6s ease',
        }} />
        <video
          ref={avatar.videoRef}
          autoPlay
          playsInline
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            // Simli's feed is roughly square -- contain, not cover, so it letterboxes
            // instead of zooming/cropping.
            objectFit: 'contain', objectPosition: 'center',
            filter: 'brightness(0.8)',
            opacity: avatar.live ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />
        <audio ref={avatar.audioRef} autoPlay style={{ display: 'none' }} />
        <AnimatePresence>
          {speaking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.3, 0.15, 0.3, 0] }}
              exit={{ opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(52,199,89,0.22) 0%, transparent 65%)' }} />
          )}
        </AnimatePresence>
      </div>

      {/* ── RINGING ── */}
      <AnimatePresence>
        {!compact && phase === 'ringing' && (
          <motion.div
            key="ring"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-between py-16 z-20"
          >
            {/* Blurred bg */}
            <div className="absolute inset-0" style={{
              backgroundImage: `url(${ANIME_PORTRAIT})`,
              backgroundSize: 'cover', backgroundPosition: 'center 10%',
              filter: 'blur(40px) brightness(0.2)', transform: 'scale(1.1)',
            }} />

            {/* Back button */}
            <div className="relative z-10 w-full px-4 flex items-center">
              <button onClick={closeView} aria-label="Back" className="flex items-center gap-1" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                <ChevronLeft size={20} />
                <span style={{ fontSize: '16px' }}>Back</span>
              </button>
            </div>

            {/* Avatar + name */}
            <div className="relative z-10 flex flex-col items-center gap-4">
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}>
                INCOMING CALL
              </p>
              <div className="relative flex items-center justify-center">
                {[1, 2, 3].map(i => (
                  <div key={i} className="absolute rounded-full" style={{
                    width: `${130 + i * 36}px`, height: `${130 + i * 36}px`,
                    border: '1.5px solid rgba(52,199,89,0.2)',
                    animation: `pulse-ring ${1.8 + i * 0.3}s ease-out infinite ${i * 0.4}s`,
                  }} />
                ))}
                <div className="rounded-full overflow-hidden" style={{
                  width: '110px', height: '110px',
                  border: '3px solid rgba(52,199,89,0.7)',
                  boxShadow: '0 0 30px rgba(52,199,89,0.3)',
                }}>
                  <img src={ANIME_PORTRAIT} alt="Pranav" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} />
                </div>
              </div>
              <div className="text-center">
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', color: '#f0f0f2', fontStyle: 'italic' }}>Pranav Kowadkar</p>
                <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }}
                  style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                  Digital Twin · AI Engineer
                </motion.p>
              </div>
            </div>

            {/* Accept / Decline */}
            <div className="relative z-10 flex items-center gap-20">
              <div className="flex flex-col items-center gap-2">
                <button onClick={endCall} aria-label="Decline call" style={{
                  width: '64px', height: '64px', borderRadius: '50%', background: '#ff3b30',
                  boxShadow: '0 4px 20px rgba(255,59,48,0.45)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <PhoneOff size={24} color="white" />
                </button>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Decline</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <motion.button onClick={acceptCall} aria-label="Accept call"
                  animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                  style={{
                    width: '64px', height: '64px', borderRadius: '50%', background: '#34c759',
                    boxShadow: '0 4px 20px rgba(52,199,89,0.5)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </motion.button>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Accept</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONNECTING ── */}
      <AnimatePresence>
        {!compact && phase === 'connecting' && (
          <motion.div key="conn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-20"
            style={{ background: '#000' }}>
            <motion.div className="rounded-full overflow-hidden"
              style={{ width: '90px', height: '90px', border: '2px solid rgba(255,255,255,0.15)' }}
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <img src={ANIME_PORTRAIT} alt="Pranav" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} />
            </motion.div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>CONNECTING...</p>
            <button onClick={endCall} aria-label="Cancel" style={{
              marginTop: '2px', padding: '7px 18px', borderRadius: '18px',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer',
            }}>
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ACTIVE CALL ── */}
      <AnimatePresence>
        {phase === 'active' && (compact ? (
          <motion.div
            key="active-compact"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-10 flex flex-col justify-end"
          >
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1" style={{ padding: '2px 6px', borderRadius: '8px', background: 'rgba(0,0,0,0.55)' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34c759', flexShrink: 0 }} />
              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.7)' }}>{speaking ? 'speaking' : callTimer}</span>
            </div>

            <AnimatePresence>
              {compactMessageOpen && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="px-1.5 pb-1">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <input
                      autoFocus
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { sendMessage(input); setCompactMessageOpen(false); } }}
                      placeholder="Message..."
                      disabled={loading}
                      style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#f0f0f2', fontSize: '10px' }}
                    />
                    <button
                      onClick={() => { if (input.trim()) { sendMessage(input); setCompactMessageOpen(false); } }}
                      disabled={loading || !input.trim()}
                      aria-label="Send"
                      style={{ width: '18px', height: '18px', borderRadius: '50%', border: 'none', flexShrink: 0, background: input.trim() && !loading ? '#E50914' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Send size={9} color="white" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-1.5 px-1.5 pb-2 pt-1.5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
              <button onClick={() => (micOn ? stopListening() : startListening())} disabled={loading} aria-label={micOn ? 'Stop voice input' : 'Start voice input'}
                style={{ width: '26px', height: '26px', borderRadius: '50%', border: 'none', flexShrink: 0, background: micOn ? '#ff3b30' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {micOn ? <Mic size={12} color="white" /> : <MicOff size={12} color="rgba(255,255,255,0.8)" />}
              </button>
              <button onClick={() => setCompactMessageOpen(v => !v)} aria-label="Type a message"
                style={{ width: '26px', height: '26px', borderRadius: '50%', border: 'none', flexShrink: 0, background: compactMessageOpen ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquareText size={12} color="white" />
              </button>
              <button onClick={endCall} aria-label="End call"
                style={{ width: '26px', height: '26px', borderRadius: '50%', border: 'none', flexShrink: 0, background: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PhoneOff size={12} color="white" />
              </button>
              <button onClick={() => onExpand?.()} aria-label="Expand call"
                style={{ width: '26px', height: '26px', borderRadius: '50%', border: 'none', flexShrink: 0, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Maximize2 size={11} color="white" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col z-10">

            {/* Top bar */}
            <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-3"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)' }}>
              <div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#f0f0f2', fontStyle: 'italic' }}>Pranav Kowadkar</p>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34c759' }} />
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>{callTimer}</p>
                  {speaking && (
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: '#34c759', marginLeft: '3px' }}>
                      speaking
                    </motion.span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => captions.setCcOn(!captions.ccOn)} aria-label={captions.ccOn ? 'Hide captions' : 'Show captions'} style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: captions.ccOn ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Subtitles size={14} color={captions.ccOn ? 'white' : 'rgba(255,255,255,0.4)'} />
                </button>
                <button onClick={() => setShowTranscript(s => !s)} aria-label={showTranscript ? 'Hide transcript' : 'Show transcript'} style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: showTranscript ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageSquareText size={14} color={showTranscript ? 'white' : 'rgba(255,255,255,0.4)'} />
                </button>
                <button onClick={() => setSoundOn(s => !s)} aria-label={soundOn ? 'Mute sound' : 'Unmute sound'} style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                }}>
                  {soundOn ? <Volume2 size={14} color="white" /> : <VolumeX size={14} color="rgba(255,255,255,0.4)" />}
                </button>
              </div>
            </div>

            {/* Lower third — rolling caption strip; the full reply lives in the
                transcript sheet, never over the face. */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-end gap-2 overflow-hidden px-4 pb-2">
              <AnimatePresence>
                {loading && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </motion.div>
                )}
                {captions.ccOn && captions.caption && (
                  <motion.div
                    key="caption"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      maxWidth: '100%',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontSize: '14px', color: '#f5f5f1', lineHeight: 1.5, textAlign: 'center',
                    }}
                  >
                    {captionWindow(captions.caption, 10)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom controls */}
            <div className="relative z-10 px-3 pb-8 pt-2 flex flex-col gap-2"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}>
              {/* Transcript */}
              <AnimatePresence>
                {micOn && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                    <motion.div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff3b30', flexShrink: 0 }}
                      animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
                      {transcript || 'Listening...'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input row */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(input); } }}
                    placeholder="Type a message..." disabled={loading || micOn}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f0f0f2', fontSize: '13px' }} />
                  <button onClick={() => sendMessage(input)} disabled={loading || !input.trim() || micOn} aria-label="Send message"
                    style={{
                      width: '26px', height: '26px', borderRadius: '50%', border: 'none',
                      background: input.trim() && !loading && !micOn ? '#E50914' : 'rgba(255,255,255,0.15)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                    {loading ? <Loader2 size={12} color="white" className="animate-spin" /> : <Send size={12} color="white" />}
                  </button>
                </div>

                {/* Mic */}
                <motion.button onClick={() => micOn ? stopListening() : startListening()} disabled={loading}
                  aria-label={micOn ? 'Stop voice input' : 'Start voice input'}
                  animate={micOn ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 0.8, repeat: micOn ? Infinity : 0 }}
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                    background: micOn ? '#ff3b30' : 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: micOn ? '0 0 18px rgba(255,59,48,0.5)' : 'none',
                  }}>
                  {micOn ? <Mic size={17} color="white" /> : <MicOff size={17} color="rgba(255,255,255,0.7)" />}
                </motion.button>

                {/* End call */}
                <button onClick={endCall} aria-label="End call" style={{
                  width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                  background: '#ff3b30', boxShadow: '0 4px 14px rgba(255,59,48,0.4)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <PhoneOff size={17} color="white" />
                </button>
              </div>
            </div>

            {/* Transcript — swipe-up glass sheet; full conversation on demand */}
            <AnimatePresence>
              {showTranscript && (
                <>
                  <motion.div
                    key="transcript-backdrop"
                    className="absolute inset-0 z-30"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowTranscript(false)}
                  />
                  <motion.div
                    key="transcript-sheet"
                    className="absolute inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden"
                    style={{
                      top: '24%',
                      borderRadius: '24px 24px 0 0',
                      background: 'rgba(18,18,22,0.85)',
                      backdropFilter: 'blur(26px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(26px) saturate(150%)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderBottom: 'none',
                      boxShadow: '0 -18px 50px rgba(0,0,0,0.5)',
                    }}
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={{ top: 0, bottom: 0.5 }}
                    onDragEnd={(_, info) => { if (info.offset.y > 90) setShowTranscript(false); }}
                  >
                    <div className="flex flex-col items-center pt-2.5 pb-1 shrink-0">
                      <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.25)' }} />
                    </div>
                    <div className="flex items-center justify-between px-4 pb-2 shrink-0">
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)' }}>
                        TRANSCRIPT
                      </span>
                      <button onClick={() => setShowTranscript(false)} aria-label="Close transcript" style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <X size={13} color="rgba(255,255,255,0.6)" />
                      </button>
                    </div>
                    <div className="flex-1 flex flex-col gap-2 px-3 pb-8 overflow-y-auto">
                      {messages.map(msg => (
                        <div key={msg.ts} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div style={{
                            maxWidth: '82%', padding: '8px 11px',
                            borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: msg.role === 'user' ? 'rgba(229,9,20,0.6)' : 'rgba(255,255,255,0.07)',
                            border: msg.role === 'pk' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                            fontSize: '13px', color: '#f0f0f2', lineHeight: 1.5,
                          }}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start">
                          <div style={{
                            padding: '9px 12px', borderRadius: '14px 14px 14px 4px',
                            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex', gap: '4px', alignItems: 'center',
                          }}>
                            {[0, 1, 2].map(i => (
                              <motion.div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }}
                                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                            ))}
                          </div>
                        </div>
                      )}
                      <div ref={bottomRef} />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── ENDED, in the bubble ── the call ended under a Canvas/Scheduler overlay that stays open
          (see endCall). A notice, so it announces itself without taking focus from the overlay. */}
      <AnimatePresence>
        {bubble === 'ended' && (
          <motion.div key="ended-compact" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 z-20 px-2 text-center"
            style={{ background: '#000', pointerEvents: 'auto' }}
            onClick={() => setBubbleEndedDismissed(true)}>
            <div className="rounded-full overflow-hidden opacity-40" style={{ width: '34px', height: '34px' }}>
              <img src={ANIME_PORTRAIT} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} />
            </div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>Call ended</p>
            {endedByCap && (
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '9px', lineHeight: 1.35, color: 'rgba(255,255,255,0.45)' }}>
                Time limit reached — email pk.kowadkar@gmail.com
              </p>
            )}
            <button onClick={() => setBubbleEndedDismissed(true)}
              style={{ minHeight: '26px', padding: '4px 14px', borderRadius: '13px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: '10px', cursor: 'pointer' }}>
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ENDED ── */}
      <AnimatePresence>
        {!compact && phase === 'ended' && (
          <motion.div key="ended" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20"
            style={{ background: '#000' }}>
            <div className="rounded-full overflow-hidden opacity-40" style={{ width: '72px', height: '72px' }}>
              <img src={ANIME_PORTRAIT} alt="Pranav" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} />
            </div>
            <div className="text-center">
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>Call ended</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '5px', letterSpacing: '0.05em' }}>{callTimer}</p>
              {endedByCap && (
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '12px', lineHeight: 1.5, maxWidth: '280px' }}>
                  {CAP_MESSAGE}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setPhase('ringing'); setMessages([]); setEndedByCap(false); }}
                style={{ padding: '9px 20px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}>
                Call again
              </button>
              <button onClick={closeView}
                style={{ padding: '9px 20px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BLOCKED (daily limit / monthly budget) ── no "Call again" here. */}
      <AnimatePresence>
        {!compact && phase === 'blocked' && (
          <motion.div key="blocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20"
            style={{ background: '#000' }}>
            <div className="rounded-full overflow-hidden opacity-40" style={{ width: '72px', height: '72px' }}>
              <img src={ANIME_PORTRAIT} alt="Pranav" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} />
            </div>
            <div className="text-center" style={{ maxWidth: '280px', padding: '0 16px' }}>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                {blockReason === 'monthly_budget' ? "The twin's resting this month" : "We've talked a lot today"}
              </p>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', lineHeight: 1.5 }}>
                {blockReason === 'monthly_budget'
                  ? "This month's call minutes are all used up — the human version is still available."
                  : 'The twin has a daily call limit — come back tomorrow, or email the real Pranav.'}
              </p>
            </div>
            <div className="flex gap-3">
              <a href="mailto:pk.kowadkar@gmail.com"
                style={{ padding: '9px 20px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer', textDecoration: 'none' }}>
                Email Pranav
              </a>
              <button onClick={closeView}
                style={{ padding: '9px 20px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
