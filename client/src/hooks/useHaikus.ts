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
  { id: 'planes',   lines: ['Fifteen planes take flight', 'Balsa wood, midnight solder', 'Belagavi dreams'],         fact: 'Built 15 RC planes + 4 quadcopters from scratch in college', emoji: '✈️' },
  { id: 'parasail', lines: ['First paycheck arrives', 'Twenty-two engineers soar', 'Parasailing joy'],               fact: 'Celebrated first Cognizant paycheck by parasailing with 22 colleagues', emoji: '🪂' },
  { id: 'scuba',    lines: ['Underwater calm', 'Fluid dynamics, felt not', 'Dassault taught me this'],              fact: 'First scuba dive was a Dassault team event — experienced aerodynamics viscerally', emoji: '🤿' },
  { id: 'goa',      lines: ['Goa, four hours south', 'Debug code on the beach', 'Sunset clears the mind'],          fact: 'Regular Goa trips with the Belagavi crew — best debugging sessions happened on the beach', emoji: '🏖️' },
  { id: 'anime',    lines: ['Steins;Gate reruns', 'Ghost in the Shell at 2 AM', 'AI dreams take shape'],            fact: "Steins;Gate & Ghost in the Shell directly influenced his AI philosophy", emoji: '📺' },
  { id: 'workshop', lines: ['Seventy-two hours', 'Seventy-two engineers', 'Belagavi wakes'],                        fact: 'First RC plane workshop: 72 registrations in 72 hours — had to close signups', emoji: '🛠️' },
  { id: 'stirling', lines: ['Heat becomes motion', 'Stirling engine, half-built, proud', 'Theory made real'],       fact: 'Built a Stirling engine in college — theoretically possible, practically challenging', emoji: '⚙️' },
  { id: 'gre',      lines: ['Pune, 2 AM', 'Secret tricks for GRE math', 'Students line the hall'],                  fact: 'Became so good at GRE math in Pune that students lined up for his tips', emoji: '📐' },
  { id: 'newark',   lines: ['Two suitcases packed', 'Newark fog, September cold', 'Dreams weigh nothing here'],     fact: 'Arrived in Newark with two suitcases and a scholarship — September 2022', emoji: '🌁' },
  { id: 'sentinel', lines: ['Seven hours, one night', 'Search Sentinel wins first place', 'Snowstorm, NYC'],        fact: 'Built Search Sentinel in 7 hours during a NYC snowstorm — won 1st place at Pulse NYC', emoji: '🏆' },
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
