/**
 * Web Speech API (STT) types shared by the two Digital Twin call components
 * (VideoCallApp.tsx desktop, MobileDigitalTwin.tsx mobile) and useCallTeardown.
 * TypeScript's DOM lib doesn't ship these, so they were hand-copied into each
 * component; one copy means a change (like adding abort()) is made once.
 */

export interface SRResult { readonly transcript: string; }
export interface SRResultList { readonly length: number; readonly isFinal: boolean; [index: number]: SRResult; }
export interface SREvent { readonly results: { length: number; [index: number]: SRResultList; }; }

export type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SREvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  /** Asks the browser for a FINAL result from the audio captured so far -- right for the
   *  visitor's own mic toggle, wrong for hanging up (see abort). */
  stop: () => void;
  /** Discards the audio captured so far and never fires a result. Hanging up must use this:
   *  stop() can deliver a last onresult after the call is over, which would launch a whole
   *  new LLM + TTS turn with nobody there. */
  abort: () => void;
};

export type SpeechRecognitionConstructor = new () => SpeechRecognitionType;

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
