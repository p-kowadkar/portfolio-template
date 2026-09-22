/**
 * useAIssistantConversation -- the AIssistant text conversation, kept across the window
 * being closed or the page reloaded. Shared by ChatPKApp.tsx (desktop) and
 * MobileAIssistant.tsx (mobile), so a conversation also follows a phone rotating across
 * the shell swap.
 *
 * Persistence only. It does NOT own sendMessage: the two implementations differ in error
 * copy, reply-field fallbacks and tool-call targets, and unifying them is a bigger
 * refactor than surviving a close needs.
 *
 *   const [loading, setLoading] = useState(false);
 *   const chat = useAIssistantConversation(loading);  // `loading` = a request is in flight
 *   const [input, setInput] = useState(chat.restoredInput);
 *   // chat.turns / chat.setTurns replace the component's own messages state
 *   // chat.reset() clears the conversation (a "New conversation" button)
 *
 * `turns` EXCLUDES the greeting: desktop seeds it as messages[0], mobile renders it as
 * static JSX, and a turns-only shape is what both can share.
 *
 * The backend is stateless (the client sends the last 10 turns each request), so client
 * storage is all a restored conversation needs. Stored in tab-scoped sessionStorage, never
 * transmitted (see sessionStore.ts).
 *
 * `inFlight` is stored explicitly, not inferred from "the last turn is a user turn": a
 * reply that is purely a tool call (AIssistant answers by opening a window) legitimately
 * leaves a trailing user turn, so inference would mis-restore it and a resend would
 * re-fire the tool call. With the flag, only a request that really never came back is
 * treated as unanswered: the visitor's question is popped back into the input box instead
 * of hanging as an orphan.
 */
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { readSession, writeSession, clearSession } from '@/lib/sessionStore';

export interface AIssistantMessage {
  role: 'user' | 'model';
  content: string;
}

interface AIssistantStoreV1 {
  v: 1;
  turns: AIssistantMessage[];
  inFlight: boolean;
}

const KEY = 'pk_aissistant_chat_v1';
// The client only ever sends the last 10 turns, so this is generous; it is the on-screen
// continuity that is being kept.
const MAX_TURNS = 40;

const isAIssistantMessage = (t: unknown): t is AIssistantMessage => {
  if (!t || typeof t !== 'object') return false;
  const m = t as Record<string, unknown>;
  return (m.role === 'user' || m.role === 'model') && typeof m.content === 'string';
};
// A malformed entry must be rejected here: rendering a non-string as a React child throws,
// and nothing above these components would catch it.
const isAIssistantStore = (v: unknown): v is AIssistantStoreV1 => {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return s.v === 1 && typeof s.inFlight === 'boolean' && Array.isArray(s.turns) && s.turns.every(isAIssistantMessage);
};

function load(): { turns: AIssistantMessage[]; restoredInput: string } {
  const stored = readSession(KEY, isAIssistantStore);
  if (!stored) return { turns: [], restoredInput: '' };
  let turns = stored.turns.slice(-MAX_TURNS);
  let restoredInput = '';
  const last = turns[turns.length - 1];
  if (stored.inFlight && last?.role === 'user') {
    restoredInput = last.content;
    turns = turns.slice(0, -1);
  }
  return { turns, restoredInput };
}

export function useAIssistantConversation(inFlight: boolean): {
  turns: AIssistantMessage[];
  setTurns: Dispatch<SetStateAction<AIssistantMessage[]>>;
  /** Text to seed the input box with: the question that was in flight when the window went away. */
  restoredInput: string;
  reset: () => void;
} {
  const [initial] = useState(load);
  const [turns, setTurns] = useState<AIssistantMessage[]>(initial.turns);

  // No debounce: this changes once per send and once per reply, and React batches the
  // setTurns + setLoading pair in the async continuation into one write.
  useEffect(() => {
    if (turns.length === 0 && !inFlight) {
      clearSession(KEY);
      return;
    }
    // Shrink, don't skip, when it's too big: skipping would leave the previous copy behind,
    // and that copy may say inFlight:true with a trailing user turn that has since been
    // answered, so the next mount would pop an already-answered question into the input.
    let kept = turns.slice(-MAX_TURNS);
    while (kept.length > 0) {
      if (writeSession(KEY, { v: 1, turns: kept, inFlight } satisfies AIssistantStoreV1)) return;
      kept = kept.slice(1);
    }
    clearSession(KEY); // nothing fits (or storage is unavailable): never leave a stale copy
  }, [turns, inFlight]);

  const reset = useCallback(() => {
    setTurns([]);
    clearSession(KEY);
  }, []);

  return { turns, setTurns, restoredInput: initial.restoredInput, reset };
}
