/**
 * useHaikus — fetches dynamically generated haikus from the pk-portfolio backend.
 * On session start, calls GET /api/haiku which uses Gemini RAG over:
 *   - Pranav's journey document
 *   - Master resume
 *   - GitHub activity (repos, recent commits)
 * Falls back to hardcoded haikus if the backend is unavailable.
 */

import { useState, useEffect } from 'react';

export interface Haiku {
  id: string;
  lines: [string, string, string];
  fact: string;
  emoji: string;
}

// Fallback haikus — used when backend is unavailable
export const FALLBACK_HAIKUS: Haiku[] = [
  { id: 'placeholder-funny',       lines: ['Haiku one right here', 'Something funny about you', 'Edit me — go on'],         fact: 'Haiku1: Something funny about you.', emoji: '😄' },
  { id: 'placeholder-insightful',  lines: ['Haiku two waits here', 'Something insightful and true', 'Your own quiet truth'], fact: 'Haiku2: Something insightful about you.', emoji: '💡' },
  { id: 'placeholder-achievement', lines: ['Haiku three, a win', "Something you're proud you built", 'Name your own triumph'], fact: 'Haiku3: A personal achievement.', emoji: '🏆' },
  { id: 'placeholder-hobby',       lines: ['Haiku four, a hobby', 'Something you love outside work', 'What lights you up most'], fact: 'Haiku4: A hobby or passion.', emoji: '🎨' },
  { id: 'placeholder-place',       lines: ['Haiku five, a place', 'Somewhere that shaped who you are', 'Your own origin'],  fact: 'Haiku5: A place that shaped you.', emoji: '🌍' },
  { id: 'placeholder-milestone',   lines: ['Haiku six, a big leap', 'A moment you took the risk', 'Your own turning point'], fact: 'Haiku6: A milestone or turning point.', emoji: '🚀' },
  { id: 'placeholder-habit',       lines: ['Haiku seven, quirk', 'A small habit, oddly yours', "Nobody else's"],           fact: 'Haiku7: A quirky habit.', emoji: '🔧' },
  { id: 'placeholder-people',      lines: ['Haiku eight, a name', 'Someone who shaped how you think', 'Say thanks in a line'], fact: 'Haiku8: A person who shaped you.', emoji: '🤝' },
  { id: 'placeholder-curiosity',   lines: ['Haiku nine, a spark', "The question you can't let go", 'Chase it in five-sev-five'], fact: 'Haiku9: A curiosity or obsession.', emoji: '🔭' },
  { id: 'placeholder-dream',       lines: ['Haiku ten, a wish', 'Something you\'re building toward', 'Not there yet — still going'], fact: 'Haiku10: A dream or goal.', emoji: '✨' },
];

const API_BASE = import.meta.env.VITE_API_URL as string | undefined;
const SESSION_KEY = 'pk_haikus_session';

export function useHaikus() {
  const [haikus, setHaikus] = useState<Haiku[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'backend' | 'cache' | 'fallback'>('fallback');

  useEffect(() => {
    // Check sessionStorage first — same haikus for the whole browser session
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= 5) {
          setHaikus(parsed);
          setSource('cache');
          setLoading(false);
          return;
        }
      } catch {
        // ignore parse errors
      }
    }

    // No backend configured — go straight to fallback haikus, no network call.
    if (!API_BASE) {
      setHaikus(FALLBACK_HAIKUS);
      setSource('fallback');
      setLoading(false);
      return;
    }

    // Fetch fresh haikus from backend
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    fetch(`${API_BASE}/api/haiku`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        clearTimeout(timeout);
        if (data.haikus && Array.isArray(data.haikus) && data.haikus.length >= 5) {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.haikus));
          setHaikus(data.haikus);
          setSource('backend');
        } else {
          throw new Error('Invalid response');
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        // Backend unavailable — use fallback haikus
        setHaikus(FALLBACK_HAIKUS);
        setSource('fallback');
      })
      .finally(() => setLoading(false));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return { haikus, loading, source };
}
