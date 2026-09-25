import { describe, it, expect } from 'vitest';
import { compactBubbleMode, type CallPhase } from './callBubble';

const PHASES: CallPhase[] = ['ringing', 'connecting', 'active', 'ended', 'blocked'];

describe('compactBubbleMode', () => {
  it('is off for every phase when the call is not a bubble, dismissed or not', () => {
    for (const phase of PHASES) {
      expect(compactBubbleMode(false, phase, false)).toBe('off');
      expect(compactBubbleMode(false, phase, true)).toBe('off');
    }
  });

  it('shows the live controls while the call is active in the bubble', () => {
    expect(compactBubbleMode(true, 'active', false)).toBe('active');
    expect(compactBubbleMode(true, 'active', true)).toBe('active'); // a stale dismiss never hides a live call
  });

  it('turns into the ended card when the call ends under an open overlay, until it is dismissed', () => {
    expect(compactBubbleMode(true, 'ended', false)).toBe('ended');
    expect(compactBubbleMode(true, 'ended', true)).toBe('hidden');
  });

  it('hides the phases that only have a full-screen layout rather than cramming them into the bubble', () => {
    for (const phase of ['ringing', 'connecting', 'blocked'] as const) {
      expect(compactBubbleMode(true, phase, false)).toBe('hidden');
      expect(compactBubbleMode(true, phase, true)).toBe('hidden');
    }
  });

  it('never returns a mode that renders a full-screen layout inside the bubble', () => {
    for (const phase of PHASES) {
      for (const dismissed of [false, true]) {
        expect(['active', 'ended', 'hidden']).toContain(compactBubbleMode(true, phase, dismissed));
      }
    }
  });
});
