import { describe, it, expect } from 'vitest';
import { idleTimerBlind } from './idleBlind';

describe('idleTimerBlind', () => {
  it('is true when the front app is an iframe app', () => {
    expect(idleTimerBlind('scheduler', null)).toBe(true);
    expect(idleTimerBlind('resume', null)).toBe(true);
  });

  it('is true when an iframe app is the overlay on top of another app (a tool call opened it mid-call)', () => {
    expect(idleTimerBlind('digitaltwin', 'scheduler')).toBe(true);
    expect(idleTimerBlind('digitaltwin', 'resume')).toBe(true);
  });

  it('is false on the springboard and in every app whose touches the timer does see', () => {
    expect(idleTimerBlind(null, null)).toBe(false);
    for (const id of ['pai', 'projects', 'mystory', 'terminal', 'contact', 'haiku', 'digitaltwin', 'canvas']) {
      expect(idleTimerBlind(id, null)).toBe(false);
      expect(idleTimerBlind('digitaltwin', id)).toBe(false);
    }
  });

  it('treats undefined like null (an overlay that is not there)', () => {
    expect(idleTimerBlind('pai', undefined)).toBe(false);
    expect(idleTimerBlind(undefined, undefined)).toBe(false);
  });
});
