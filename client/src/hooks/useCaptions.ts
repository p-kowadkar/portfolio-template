/**
 * useCaptions — lower-third live captions for the Digital Twin call screens
 * (VideoCallApp.tsx desktop, MobileDigitalTwin.tsx mobile).
 *
 * Word-by-word reveal paced against the shared `speaking` boolean both call
 * components already maintain (Simli's onSpeakingChange + the legacy TTS
 * wrapper) — that one signal covers every voice path, including the avatar's
 * WebRTC audio where no local audio element exists to read currentTime from:
 *   - paceWithSpeech: hold at zero words until the voice actually starts,
 *     reveal at ~reading pace while it talks, flush the rest + fade when the
 *     speaking flag falls. If the voice never starts (all TTS paths failed
 *     silently), a bailout timer converts to unpaced so text still appears.
 *   - unpaced (muted calls, error/cap lines that are never spoken): reveal
 *     immediately at reading pace and self-finish.
 *
 * The component renders a rolling window of the revealed words, so a long
 * reply never grows past ~2 lines — the whole reply lives in the transcript.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const CC_KEY = 'pk_captions_on';
const TICK_MS = 300; // ~200 wpm — slightly ahead of the voice, like real subtitles
const FADE_DELAY_MS = 1700;
const VOICE_START_BAILOUT_MS = 6000;

export interface Caption {
  words: string[];
  shown: number;
  done: boolean;
}

export function useCaptions(speaking: boolean) {
  const [ccOn, setCcOnState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CC_KEY) !== '0';
    } catch {
      return true;
    }
  });
  const [caption, setCaption] = useState<Caption | null>(null);
  const paceWithSpeechRef = useRef(false);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSpeakingRef = useRef(false);

  const setCcOn = useCallback((on: boolean) => {
    setCcOnState(on);
    try {
      localStorage.setItem(CC_KEY, on ? '1' : '0');
    } catch {
      /* private mode etc. — preference just won't persist */
    }
  }, []);

  const clearFade = () => {
    if (fadeRef.current) {
      clearTimeout(fadeRef.current);
      fadeRef.current = null;
    }
  };

  // Reveal everything that's left and schedule the fade-out.
  const endCaption = useCallback(() => {
    setCaption((c) => (c && !c.done ? { ...c, shown: c.words.length, done: true } : c));
    clearFade();
    fadeRef.current = setTimeout(() => setCaption(null), FADE_DELAY_MS);
  }, []);

  const clearCaption = useCallback(() => {
    clearFade();
    setCaption(null);
  }, []);

  const showCaption = useCallback((text: string, opts?: { paceWithSpeech?: boolean }) => {
    clearFade();
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;
    paceWithSpeechRef.current = opts?.paceWithSpeech ?? false;
    setCaption({ words, shown: paceWithSpeechRef.current ? 0 : 1, done: false });
  }, []);

  // Word ticker — one timeout per revealed word, re-armed by the state change
  // it causes. Cheap (a reply is tens of words) and trivially cancel-safe.
  useEffect(() => {
    if (!caption || caption.done) return;

    const waitingForVoice = paceWithSpeechRef.current && !speaking && caption.shown === 0;
    if (waitingForVoice) {
      // Voice never came up (every TTS path failed) — degrade to unpaced.
      const bail = setTimeout(() => {
        paceWithSpeechRef.current = false;
        setCaption((c) => (c && c.shown === 0 ? { ...c, shown: 1 } : c));
      }, VOICE_START_BAILOUT_MS);
      return () => clearTimeout(bail);
    }

    if (caption.shown >= caption.words.length) {
      // Fully revealed. Paced captions wait for the speaking flag to fall
      // (handled below); unpaced ones are finished right here.
      if (!paceWithSpeechRef.current) endCaption();
      return;
    }

    const t = setTimeout(() => {
      setCaption((c) => (c && !c.done ? { ...c, shown: Math.min(c.shown + 1, c.words.length) } : c));
    }, TICK_MS);
    return () => clearTimeout(t);
  }, [caption, speaking, endCaption]);

  // Speech finished (speaking true -> false): flush + fade the paced caption.
  useEffect(() => {
    if (prevSpeakingRef.current && !speaking && paceWithSpeechRef.current) {
      endCaption();
    }
    prevSpeakingRef.current = speaking;
  }, [speaking, endCaption]);

  useEffect(() => () => clearFade(), []);

  return { caption, ccOn, setCcOn, showCaption, endCaption, clearCaption };
}

// Rolling display window — the last `windowSize` revealed words, with an
// ellipsis once earlier words have scrolled out. Keeps the strip ~2 lines.
export function captionWindow(caption: Caption, windowSize: number): string {
  const start = Math.max(0, caption.shown - windowSize);
  const text = caption.words.slice(start, caption.shown).join(' ');
  return start > 0 ? `… ${text}` : text;
}
