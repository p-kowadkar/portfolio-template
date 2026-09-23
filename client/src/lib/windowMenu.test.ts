import { describe, it, expect } from 'vitest';
import { closeAllOrder, windowMenuRows } from './windowMenu';
import type { WindowLike } from './windowState';

const win = (id: string, over: Partial<WindowLike> = {}): WindowLike => ({
  id, isOpen: true, isMinimized: false, isMaximized: false, isCompact: false, zIndex: 10,
  position: { x: 0, y: 0 }, size: { width: 600, height: 400 }, defaultOffset: { x: 0, y: 0 },
  defaultSize: { width: 600, height: 400 }, minimizeMode: 'hide', closeGuard: null, closeRequested: false, ...over,
});
const label = (id: string) => id.toUpperCase();
const guard = { title: 'End Call?', body: 'b', confirmLabel: 'End Call' };

describe('windowMenuRows', () => {
  it('lists only open windows, in the manager\'s order', () => {
    const rows = windowMenuRows([win('a'), win('closed', { isOpen: false }), win('b')], null, label);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
  });
  it('marks the front window with a check and a minimized one with a diamond', () => {
    const rows = windowMenuRows([win('a'), win('b', { isMinimized: true }), win('c')], 'a', label);
    expect(rows.map((r) => r.mark)).toEqual(['✓', '◆', '']);
  });
  it('carries the state in the accessible name too, because the marks are decorative', () => {
    const rows = windowMenuRows([win('a'), win('b', { isMinimized: true })], 'a', label);
    expect(rows[0].ariaLabel).toBe('A, front');
    expect(rows[1].ariaLabel).toBe('B, minimized');
  });
  it('is empty when nothing is open', () => {
    expect(windowMenuRows([win('a', { isOpen: false })], null, label)).toEqual([]);
  });
});

describe('closeAllOrder', () => {
  it('closes unguarded windows first and the guarded one LAST, so its confirm sheet is what is left on screen', () => {
    const ws = [win('projects'), win('videocall', { closeGuard: guard }), win('terminal')];
    expect(closeAllOrder(ws)).toEqual(['projects', 'terminal', 'videocall']);
  });
  it('skips windows that are already closed', () => {
    expect(closeAllOrder([win('a'), win('b', { isOpen: false })])).toEqual(['a']);
  });
  it('is stable when nothing is guarded', () => {
    expect(closeAllOrder([win('a'), win('b'), win('c')])).toEqual(['a', 'b', 'c']);
  });
});
