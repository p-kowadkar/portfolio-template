/**
 * callAudio — shared TTS/voice pipeline for the Digital Twin call components
 * (VideoCallApp.tsx desktop, MobileDigitalTwin.tsx mobile). Extracted so both
 * components AND useSimliAvatar share one CallCapReachedError class -- instanceof
 * checks break across module-local duplicates, which matters once the avatar hook
 * also needs to throw/catch it.
 *
 * The legacy (non-avatar) playback path -- an MP3 in a detached `new Audio()`, or the
 * browser's speechSynthesis -- has a module-level cancel handle, cancelFallbackSpeech().
 * Without it nothing could stop a sentence already playing through this path, not even
 * ending the call, so a reply could keep talking out loud with no window on screen.
 */

export const API_URL = import.meta.env.VITE_API_URL as string | undefined;

// 10-min-per-call cap is enforced server-side (X-Call-Session-Id header, checked on
// /api/chat, /api/tts, and /api/simli/session). This error signals the cap was hit so
// the UI can end the call gracefully instead of silently falling back to browser TTS.
export class CallCapReachedError extends Error {}

// ─── Cancel handle for the legacy playback path ────────────────────────────────
// A Set, not one slot: two legacy clips can overlap (the greeting via speak() while the
// first reply falls back through the TTS queue). `speechGen` lets a fetch that was still
// in flight when a cancel landed notice it was superseded and stay silent afterwards.
interface ActiveClip {
  el: HTMLAudioElement;
  url: string;
  settle: () => void;
}
const activeClips = new Set<ActiveClip>();
let speechGen = 0;

/** Stops every legacy clip playing right now (and browser TTS), and makes any clip still
 *  downloading skip playback. Pending speak()/speakWithBackend() promises RESOLVE, as if
 *  playback had simply finished early, so awaiting callers unwind normally. */
export function cancelFallbackSpeech(): void {
  speechGen++;
  activeClips.forEach(({ el, url, settle }) => {
    settle(); // resolve first, so the play() rejection pause() triggers below is a no-op
    el.onended = null;
    el.onerror = null;
    el.pause();
    el.removeAttribute('src');
    URL.revokeObjectURL(url);
  });
  activeClips.clear();
  window.speechSynthesis?.cancel();
}

// ─── Backend TTS proxy (ElevenLabs key stays server-side) ───────────────────────
export async function speakWithBackend(text: string, sessionId: string): Promise<void> {
  if (!API_URL) return;
  const gen = speechGen;
  const res = await fetch(`${API_URL}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Call-Session-Id': sessionId },
    body: JSON.stringify({ text }),
  });
  if (res.status === 429) throw new CallCapReachedError();
  if (!res.ok) throw new Error(`TTS error: ${res.status}`);
  const blob = await res.blob();
  if (gen !== speechGen) return; // cancelled while downloading -- never start playing
  const audioUrl = URL.createObjectURL(blob);
  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(audioUrl);
    const clip: ActiveClip = { el: audio, url: audioUrl, settle: resolve };
    const done = () => { activeClips.delete(clip); URL.revokeObjectURL(audioUrl); };
    audio.onended = () => { done(); resolve(); };
    audio.onerror = (e) => { done(); reject(e); };
    activeClips.add(clip);
    audio.play().catch((e) => { done(); reject(e); });
  });
}

// Raw PCM16/16kHz variant -- byte-identical to what the Simli avatar SDK's
// sendAudioData wants, no transcoding needed.
export async function fetchTtsPcm(text: string, sessionId: string): Promise<Uint8Array> {
  if (!API_URL) throw new Error('No API_URL configured');
  const res = await fetch(`${API_URL}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Call-Session-Id': sessionId },
    body: JSON.stringify({ text, format: 'pcm_16000' }),
  });
  if (res.status === 429) throw new CallCapReachedError();
  if (!res.ok) throw new Error(`TTS error: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

// ─── Browser TTS fallback ─────────────────────────────────────────────────────
export function speakWithBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1.0;
    utt.volume = 1.0;
    // Pick a male voice if available
    const voices = window.speechSynthesis.getVoices();
    const male = voices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('Daniel') || v.name.includes('Alex'));
    if (male) utt.voice = male;
    utt.onend = () => resolve();
    utt.onerror = () => resolve();
    window.speechSynthesis.speak(utt);
  });
}

export async function speak(text: string, sessionId: string): Promise<void> {
  const gen = speechGen;
  try {
    if (API_URL) {
      await speakWithBackend(text, sessionId);
    } else {
      await speakWithBrowser(text);
    }
  } catch (e) {
    if (e instanceof CallCapReachedError) throw e;
    if (gen !== speechGen) return; // cancelled while the backend fetch was failing -- don't start browser TTS after teardown
    console.warn('TTS failed, falling back to browser:', e);
    await speakWithBrowser(text);
  }
}
