/**
 * callAudio — shared TTS/voice pipeline for the Digital Twin call components
 * (VideoCallApp.tsx desktop, MobileDigitalTwin.tsx mobile). Extracted so both
 * components AND useSimliAvatar share one CallCapReachedError class -- instanceof
 * checks break across module-local duplicates, which matters once the avatar hook
 * also needs to throw/catch it.
 */

export const API_URL = import.meta.env.VITE_API_URL as string | undefined;

// 10-min-per-call cap is enforced server-side (X-Call-Session-Id header, checked on
// /api/chat, /api/tts, and /api/simli/session). This error signals the cap was hit so
// the UI can end the call gracefully instead of silently falling back to browser TTS.
export class CallCapReachedError extends Error {}

// ─── Backend TTS proxy (ElevenLabs key stays server-side) ───────────────────────
export async function speakWithBackend(text: string, sessionId: string): Promise<void> {
  if (!API_URL) return;
  const res = await fetch(`${API_URL}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Call-Session-Id': sessionId },
    body: JSON.stringify({ text }),
  });
  if (res.status === 429) throw new CallCapReachedError();
  if (!res.ok) throw new Error(`TTS error: ${res.status}`);
  const blob = await res.blob();
  const audioUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    audio.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
    audio.onerror = reject;
    audio.play().catch(reject);
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
  try {
    if (API_URL) {
      await speakWithBackend(text, sessionId);
    } else {
      await speakWithBrowser(text);
    }
  } catch (e) {
    if (e instanceof CallCapReachedError) throw e;
    console.warn('TTS failed, falling back to browser:', e);
    await speakWithBrowser(text);
  }
}
