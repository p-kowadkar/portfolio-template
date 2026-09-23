import { describe, it, expect } from 'vitest';
import { dockStateOf } from './dockState';

const w = (over: Partial<Parameters<typeof dockStateOf>[0] & object> = {}) => ({
  id: 'terminal', isOpen: true, isMinimized: false, isCompact: false, ...over,
});

describe('dockStateOf', () => {
  it('is closed for a window that is closed or unknown', () => {
    expect(dockStateOf(undefined)).toBe('closed');
    expect(dockStateOf(w({ isOpen: false }))).toBe('closed');
  });
  it('is running for an open window on screen', () => {
    expect(dockStateOf(w())).toBe('running');
  });
  it('is minimized for an open window that is hidden: it is STILL running, which is the point of the dim dot', () => {
    expect(dockStateOf(w({ isMinimized: true }))).toBe('minimized');
  });
  it('is live only for the call while it is a bubble', () => {
    expect(dockStateOf(w({ id: 'videocall', isCompact: true }))).toBe('live');
    expect(dockStateOf(w({ id: 'videocall' }))).toBe('running'); // full-size call: an ordinary running window
    expect(dockStateOf(w({ id: 'terminal', isCompact: true }))).toBe('running'); // any other bubble is not a call
  });
  it('a closed window is closed even if it kept stale flags', () => {
    expect(dockStateOf(w({ id: 'videocall', isOpen: false, isCompact: true, isMinimized: true }))).toBe('closed');
  });
});
