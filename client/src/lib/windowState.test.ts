import { describe, it, expect } from 'vitest';
import {
  MIN_H, MIN_W, activateWindowIn, areaOf, bringToFront, canMinimize, canZoom, cancelCloseIn, clampAllIn,
  clampFrame, closeWindowIn, getFrontWindow, initialFrame, maximizeWindowIn, minimizeWindowIn, openWindowIn,
  resetRuntimeIn, restoreWindowIn, restoredState, setCompactIn, setGeometryIn, setPolicyIn, showAllWindowsIn,
  type CloseGuard, type Frame, type Viewport, type WindowLike,
} from './windowState';

const win = (over: Partial<WindowLike> = {}): WindowLike => ({
  id: 'a',
  isOpen: false,
  isMinimized: false,
  isMaximized: false,
  isCompact: false,
  zIndex: 10,
  position: null,
  size: null,
  defaultOffset: { x: 0, y: 0 },
  defaultSize: { width: 600, height: 400 },
  minimizeMode: 'hide',
  closeGuard: null,
  closeRequested: false,
  ...over,
});
const open = (over: Partial<WindowLike> = {}) =>
  win({ isOpen: true, position: { x: 100, y: 80 }, size: { width: 600, height: 400 }, ...over });

const VP: Viewport = { width: 1440, height: 900 }; // desktop area 1440 x 800
const AREA = areaOf(VP);

describe('areaOf', () => {
  it('is the viewport minus the menu bar and the Dock zone', () => {
    expect(AREA).toEqual({ width: 1440, height: 800 });
    expect(areaOf({ width: 100, height: 50 })).toEqual({ width: 100, height: 0 });
  });
});

describe('initialFrame', () => {
  // The old module-level centered() plus the "+ 28" Window.tsx added. First-open positions must
  // not move, so this is the regression guard for that fold-in.
  const legacy = (sw: number, sh: number, w: number, h: number, ox = 0) => ({
    x: Math.max(60, Math.round((sw - w) / 2) + ox),
    y: Math.max(60, Math.round((sh - h) / 2 - 20) + 0) + 28,
  });
  // [width, height, offsetX] for the 10 windows, straight from useWindowManager's initialWindows
  const defs: [number, number, number][] = [
    [960, 600, 0], [420, 580, 40], [560, 460, -20], [460, 520, 60], [1060, 640, 0],
    [720, 560, 30], [900, 620, 0], [640, 420, 0], [760, 560, 10], [900, 700, 0],
  ];
  for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 1920, height: 1080 }, { width: 1024, height: 700 }]) {
    it(`matches the legacy formula at ${vp.width}x${vp.height}`, () => {
      for (const [w, h, ox] of defs) {
        const f = initialFrame({ defaultSize: { width: w, height: h }, defaultOffset: { x: ox, y: 0 } }, vp);
        expect(f.position).toEqual(legacy(vp.width, vp.height, w, h, ox));
        expect(f.size).toEqual({ width: w, height: h });
      }
    });
  }
});

describe('clampFrame', () => {
  const f = (x: number, y: number, width: number, height: number): Frame => ({ position: { x, y }, size: { width, height } });

  it('returns the SAME frame when it already fits', () => {
    const frame = f(100, 80, 600, 400);
    expect(clampFrame(frame, AREA)).toBe(frame);
  });
  it('slides an off-screen window back inside', () => {
    expect(clampFrame(f(-50, -10, 600, 400), AREA)).toEqual(f(0, 0, 600, 400));
    expect(clampFrame(f(1300, 700, 600, 400), AREA)).toEqual(f(840, 400, 600, 400));
  });
  it('shrinks an oversized window to the area but never below the minimum', () => {
    expect(clampFrame(f(0, 0, 2000, 2000), AREA)).toEqual(f(0, 0, 1440, 800));
    expect(clampFrame(f(0, 0, 100, 100), AREA).size).toEqual({ width: MIN_W, height: MIN_H });
  });
  it('shrinks to a short viewport (the Scheduler is 700 tall; a 720-high viewport has 620 of area)', () => {
    const short = areaOf({ width: 1280, height: 720 });
    expect(short.height).toBe(620);
    expect(clampFrame(f(60, 88, 900, 700), short)).toEqual(f(60, 0, 900, 620));
  });
  it('rounds fractional values', () => {
    expect(clampFrame(f(10.4, 20.6, 500.5, 400.2), AREA)).toEqual(f(10, 21, 501, 400));
  });
  it('keeps the untouched inner objects when only one of position/size changes', () => {
    const frame = f(-5, 40, 600, 400);
    const out = clampFrame(frame, AREA);
    expect(out.size).toBe(frame.size);
    expect(out.position).not.toBe(frame.position);
  });
  it('never goes negative when the window is bigger than a tiny area', () => {
    const tiny = { width: 200, height: 100 };
    expect(clampFrame(f(50, 50, 600, 400), tiny)).toEqual(f(0, 0, MIN_W, MIN_H));
  });
});

describe('bringToFront', () => {
  const z = (id: string, zIndex: number) => ({ id, zIndex });
  it('raises a window above the rest', () => {
    expect(bringToFront([z('a', 10), z('b', 12)], 'a')).toEqual([z('a', 13), z('b', 12)]);
  });
  it('resolves a tie (every window starts at 10)', () => {
    expect(bringToFront([z('a', 10), z('b', 10)], 'a')).toEqual([z('a', 11), z('b', 10)]);
  });
  it('returns the SAME array when the window is already strictly on top', () => {
    const ws = [z('a', 10), z('b', 12)];
    expect(bringToFront(ws, 'b')).toBe(ws);
  });
  it('returns the same array for an unknown id and for a lone window', () => {
    const ws = [z('a', 10)];
    expect(bringToFront(ws, 'nope')).toBe(ws);
    expect(bringToFront(ws, 'a')).toBe(ws);
  });
  it('only grows on a real switch: re-focusing the front window any number of times changes nothing', () => {
    const front = bringToFront([z('a', 10), z('b', 10)], 'a');
    let ws = front;
    for (let i = 0; i < 100; i++) ws = bringToFront(ws, 'a');
    expect(ws).toBe(front);
  });
});

describe('openWindowIn', () => {
  it('opens a closed window at its first-open frame, clamped, with flags reset', () => {
    const [w] = openWindowIn([win()], 'a', { project: 'x' }, VP);
    expect(w).toMatchObject({ isOpen: true, isMinimized: false, isMaximized: false, isCompact: false, params: { project: 'x' } });
    expect(w.position).toEqual(initialFrame(win(), VP).position);
    expect(w.size).toEqual({ width: 600, height: 400 });
  });
  it('reopens a closed window at the frame it had, not the default', () => {
    const closed = win({ position: { x: 333, y: 44 }, size: { width: 500, height: 350 } });
    const [w] = openWindowIn([closed], 'a', undefined, VP);
    expect(w.position).toEqual({ x: 333, y: 44 });
    expect(w.size).toEqual({ width: 500, height: 350 });
  });
  it('pulls a remembered frame back inside a smaller viewport', () => {
    const closed = win({ position: { x: 1200, y: 600 }, size: { width: 600, height: 400 } });
    const [w] = openWindowIn([closed], 'a', undefined, { width: 1000, height: 700 });
    expect(w.position).toEqual({ x: 400, y: 200 });
  });
  it('a fresh open never inherits a stale bubble', () => {
    const [w] = openWindowIn([win({ isCompact: true })], 'a', undefined, VP);
    expect(w.isCompact).toBe(false);
  });
  it('opening a minimized window restores it and keeps it maximized', () => {
    const [w] = openWindowIn([open({ isMinimized: true, isMaximized: true })], 'a', undefined, VP);
    expect(w).toMatchObject({ isOpen: true, isMinimized: false, isMaximized: true });
  });
  it('already visible: takes params, comes to front, and NEVER touches isCompact', () => {
    const [w] = openWindowIn([open({ isCompact: true })], 'a', { p: 1 }, VP);
    expect(w).toMatchObject({ isCompact: true, params: { p: 1 } });
  });
  it('keeps the old params when none are passed', () => {
    const [w] = openWindowIn([open({ params: { project: 'old' } })], 'a', undefined, VP);
    expect(w.params).toEqual({ project: 'old' });
  });
  it('brings the window to the front', () => {
    const ws = openWindowIn([open({ id: 'a', zIndex: 10 }), open({ id: 'b', zIndex: 12 })], 'a', undefined, VP);
    expect(ws.find((w) => w.id === 'a')!.zIndex).toBe(13);
  });
  it('returns the SAME array for an already-front visible window with no params (a re-click)', () => {
    const ws = [open({ id: 'a', zIndex: 12 }), open({ id: 'b', zIndex: 10 })];
    expect(openWindowIn(ws, 'a', undefined, VP)).toBe(ws);
  });
  it('ignores an unknown id', () => {
    const ws = [open()];
    expect(openWindowIn(ws, 'nope', undefined, VP)).toBe(ws);
  });
});

describe('restoreWindowIn', () => {
  it('un-minimizes without touching params and comes to the front', () => {
    const ws = [open({ id: 'a', isMinimized: true, params: { keep: 1 }, zIndex: 10 }), open({ id: 'b', zIndex: 12 })];
    const out = restoreWindowIn(ws, 'a', VP);
    expect(out[0]).toMatchObject({ isMinimized: false, params: { keep: 1 }, zIndex: 13 });
  });
  it('leaves a closed window closed', () => {
    const ws = [win()];
    expect(restoreWindowIn(ws, 'a', VP)).toBe(ws);
  });
  it('just focuses a window that is already visible', () => {
    const ws = [open({ id: 'a', zIndex: 10 }), open({ id: 'b', zIndex: 12 })];
    expect(restoreWindowIn(ws, 'a', VP)[0].zIndex).toBe(13);
  });
});

describe('closeWindowIn', () => {
  it('resets the flags but keeps the frame and params', () => {
    const [w] = closeWindowIn([open({ isMaximized: true, isCompact: true, params: { p: 1 } })], 'a');
    expect(w).toMatchObject({ isOpen: false, isMinimized: false, isMaximized: false, isCompact: false, params: { p: 1 } });
    expect(w.position).toEqual({ x: 100, y: 80 });
    expect(w.size).toEqual({ width: 600, height: 400 });
  });
  it('returns the same array for a window that is already fully closed', () => {
    const ws = [win()];
    expect(closeWindowIn(ws, 'a')).toBe(ws);
  });
  it('also closes a minimized window', () => {
    expect(closeWindowIn([open({ isMinimized: true })], 'a')[0]).toMatchObject({ isOpen: false, isMinimized: false });
  });
});

describe('minimizeWindowIn', () => {
  it('hides it, drops compact, and keeps maximized so restore comes back maximized', () => {
    const [w] = minimizeWindowIn([open({ isCompact: true, isMaximized: true })], 'a');
    expect(w).toMatchObject({ isMinimized: true, isCompact: false, isMaximized: true });
  });
  it('is a no-op for a closed or already-minimized window', () => {
    const closed = [win()];
    const min = [open({ isMinimized: true })];
    expect(minimizeWindowIn(closed, 'a')).toBe(closed);
    expect(minimizeWindowIn(min, 'a')).toBe(min);
  });
});

describe('minimizeWindowIn (compact mode)', () => {
  it("shrinks into the bubble instead of hiding, and touches nothing else (frame and isMaximized stay)", () => {
    const [w] = minimizeWindowIn([open({ minimizeMode: 'compact', isMaximized: true })], 'a');
    expect(w).toMatchObject({ isCompact: true, isMinimized: false, isMaximized: true });
    expect(w.position).toEqual({ x: 100, y: 80 });
  });
  it('is a no-op for a window that is already a bubble (Minimize All leaves the call alone)', () => {
    const ws = [open({ minimizeMode: 'compact', isCompact: true })];
    expect(minimizeWindowIn(ws, 'a')).toBe(ws);
  });
  it('is ignored while a close confirmation is up', () => {
    const ws = [open({ closeRequested: true, closeGuard: { title: 't', body: 'b', confirmLabel: 'c' } })];
    expect(minimizeWindowIn(ws, 'a')).toBe(ws);
  });
  it('is still ignored for a closed window in compact mode', () => {
    const ws = [win({ minimizeMode: 'compact' })];
    expect(minimizeWindowIn(ws, 'a')).toBe(ws);
  });
});

describe('closeWindowIn (guarded)', () => {
  const guard: CloseGuard = { title: 'End Call?', body: 'Closing the window will end the current call.', confirmLabel: 'End Call' };

  it('raises the sheet instead of closing', () => {
    const [w] = closeWindowIn([open({ closeGuard: guard })], 'a');
    expect(w).toMatchObject({ isOpen: true, closeRequested: true });
  });
  it('brings a bubble back to a full window first (a 240x200 bubble cannot host the sheet)', () => {
    const [w] = closeWindowIn([open({ closeGuard: guard, isCompact: true })], 'a');
    expect(w).toMatchObject({ isCompact: false, closeRequested: true, isOpen: true });
  });
  it('brings a hidden window back first, and keeps it maximized', () => {
    const [w] = closeWindowIn([open({ closeGuard: guard, isMinimized: true, isMaximized: true })], 'a');
    expect(w).toMatchObject({ isMinimized: false, isMaximized: true, closeRequested: true });
  });
  it('brings the window to the front', () => {
    const ws = closeWindowIn([open({ id: 'a', closeGuard: guard, zIndex: 10 }), open({ id: 'b', zIndex: 12 })], 'a');
    expect(ws.find((w) => w.id === 'a')!.zIndex).toBe(13);
  });
  it('asking twice returns the SAME array (a second red click, or Close All then red)', () => {
    const once = closeWindowIn([open({ closeGuard: guard })], 'a');
    expect(closeWindowIn(once, 'a')).toBe(once);
  });
  it('force closes it, resets the policy, and keeps the frame and params', () => {
    const [w] = closeWindowIn(
      [open({ closeGuard: guard, closeRequested: true, minimizeMode: 'compact', isCompact: true, params: { p: 1 } })],
      'a',
      true,
    );
    expect(w).toMatchObject({ isOpen: false, isCompact: false, minimizeMode: 'hide', closeGuard: null, closeRequested: false, params: { p: 1 } });
    expect(w.position).toEqual({ x: 100, y: 80 });
  });
  it('an unguarded window still closes at once, and a plain close drops any leftover policy', () => {
    const [w] = closeWindowIn([open({ minimizeMode: 'compact' })], 'a');
    expect(w).toMatchObject({ isOpen: false, minimizeMode: 'hide' });
  });
  it('a closed window with a leftover policy is not "already closed": it gets reset', () => {
    const [w] = closeWindowIn([win({ minimizeMode: 'compact' })], 'a');
    expect(w.minimizeMode).toBe('hide');
  });
});

describe('cancelCloseIn', () => {
  it('drops the sheet and leaves the window (and the guard) as it is', () => {
    const guard = { title: 't', body: 'b', confirmLabel: 'c' };
    const [w] = cancelCloseIn([open({ closeGuard: guard, closeRequested: true })], 'a');
    expect(w).toMatchObject({ isOpen: true, closeRequested: false, closeGuard: guard });
  });
  it('is a no-op when no close was requested', () => {
    const ws = [open()];
    expect(cancelCloseIn(ws, 'a')).toBe(ws);
  });
  it('raises the window: something opened while the sheet was up may sit above it now', () => {
    const guard = { title: 't', body: 'b', confirmLabel: 'c' };
    const ws = [open({ id: 'a', zIndex: 10, closeGuard: guard, closeRequested: true }), open({ id: 'b', zIndex: 20 })];
    const [a] = cancelCloseIn(ws, 'a');
    expect(a.zIndex).toBeGreaterThan(20);
  });
});

describe('setPolicyIn', () => {
  const guard: CloseGuard = { title: 'End Call?', body: 'Closing the window will end the current call.', confirmLabel: 'End Call' };

  it('sets the minimize mode and the close guard', () => {
    const [w] = setPolicyIn([open()], 'a', { minimizeMode: 'compact', closeGuard: guard });
    expect(w).toMatchObject({ minimizeMode: 'compact', closeGuard: guard });
  });
  it('compares the guard BY VALUE: a fresh identical literal returns the SAME array (no effect loop)', () => {
    const ws = setPolicyIn([open()], 'a', { closeGuard: guard });
    expect(setPolicyIn(ws, 'a', { closeGuard: { ...guard } })).toBe(ws);
    expect(setPolicyIn(ws, 'a', { minimizeMode: 'hide', closeGuard: { ...guard } })).toBe(ws);
  });
  it('keeps the existing guard object when the new one is equal, so downstream memoization holds', () => {
    const ws = setPolicyIn([open()], 'a', { closeGuard: guard });
    const stored = ws[0].closeGuard;
    const again = setPolicyIn(ws, 'a', { closeGuard: { ...guard }, minimizeMode: 'compact' });
    expect(again[0].closeGuard).toBe(stored);
  });
  it('a changed guard is written', () => {
    const ws = setPolicyIn([open()], 'a', { closeGuard: guard });
    expect(setPolicyIn(ws, 'a', { closeGuard: { ...guard, body: 'different' } })[0].closeGuard!.body).toBe('different');
  });
  it('leaves a field alone when it is not in the patch', () => {
    const [w] = setPolicyIn([open({ minimizeMode: 'compact', closeGuard: guard })], 'a', { minimizeMode: 'hide' });
    expect(w).toMatchObject({ minimizeMode: 'hide', closeGuard: guard });
  });
  it('clearing the guard dismisses a sheet that is up (the call ended by itself mid-confirm)', () => {
    const [w] = setPolicyIn([open({ closeGuard: guard, closeRequested: true })], 'a', { closeGuard: null });
    expect(w).toMatchObject({ closeGuard: null, closeRequested: false, isOpen: true });
  });
  it('is a no-op for a closed window (an unmount cleanup can fire after the close)', () => {
    const ws = [win()];
    expect(setPolicyIn(ws, 'a', { minimizeMode: 'compact', closeGuard: guard })).toBe(ws);
  });
  it('an unknown id changes nothing', () => {
    const ws = [open()];
    expect(setPolicyIn(ws, 'nope', { minimizeMode: 'compact' })).toBe(ws);
  });
});

describe('resetRuntimeIn', () => {
  it('drops the bubble and the policy an unmounted app instance left behind', () => {
    const guard = { title: 't', body: 'b', confirmLabel: 'c' };
    const [w] = resetRuntimeIn([open({ isCompact: true, minimizeMode: 'compact', closeGuard: guard, closeRequested: true })], 'a');
    expect(w).toMatchObject({ isCompact: false, minimizeMode: 'hide', closeGuard: null, closeRequested: false, isOpen: true });
  });
  it('returns the SAME array when there is nothing to reset (the normal close path)', () => {
    const ws = [open()];
    expect(resetRuntimeIn(ws, 'a')).toBe(ws);
  });
  it('does not touch the frame, maximized state, or params', () => {
    const [w] = resetRuntimeIn([open({ isCompact: true, isMaximized: true, params: { p: 1 } })], 'a');
    expect(w).toMatchObject({ isMaximized: true, params: { p: 1 } });
    expect(w.position).toEqual({ x: 100, y: 80 });
  });
});

describe('maximizeWindowIn', () => {
  it('toggles, and never writes the stored frame', () => {
    const [on] = maximizeWindowIn([open()], 'a');
    expect(on.isMaximized).toBe(true);
    expect(on.position).toEqual({ x: 100, y: 80 });
    expect(maximizeWindowIn([on], 'a')[0].isMaximized).toBe(false);
  });
  it('is ignored for a bubble, a hidden window, or a closed one', () => {
    for (const ws of [[open({ isCompact: true })], [open({ isMinimized: true })], [win()]]) {
      expect(maximizeWindowIn(ws, 'a')).toBe(ws);
    }
  });
});

describe('setCompactIn', () => {
  it('keeps isMaximized and the frame, so expanding returns to exactly where it was', () => {
    const [bubble] = setCompactIn([open({ isMaximized: true })], 'a', true);
    expect(bubble).toMatchObject({ isCompact: true, isMaximized: true });
    expect(bubble.position).toEqual({ x: 100, y: 80 });
    const [back] = setCompactIn([bubble], 'a', false);
    expect(back).toMatchObject({ isCompact: false, isMaximized: true, position: { x: 100, y: 80 } });
  });
  it('ignores compact for a closed, hidden, or close-pending window (a late tool call, or a sheet up, cannot leave a stuck bubble)', () => {
    for (const ws of [[win()], [open({ isMinimized: true })], [open({ closeRequested: true })]]) {
      expect(setCompactIn(ws, 'a', true)).toBe(ws);
    }
  });
  it('returns the same array when nothing changes', () => {
    const ws = [open({ isCompact: true })];
    expect(setCompactIn(ws, 'a', true)).toBe(ws);
    const plain = [open()];
    expect(setCompactIn(plain, 'a', false)).toBe(plain);
  });
  it('raises the window on a change in EITHER direction -- a programmatic expand needs its z raised too, not just a shrink', () => {
    const ws = [open({ id: 'a', zIndex: 10 }), open({ id: 'b', zIndex: 20 })];
    const [a1] = setCompactIn(ws, 'a', true);
    expect(a1.zIndex).toBeGreaterThan(20);
    const shrunk = [a1, ws[1]];
    const higherOther = [shrunk[0], { ...shrunk[1], zIndex: a1.zIndex + 5 }];
    const [a2] = setCompactIn(higherOther, 'a', false);
    expect(a2.zIndex).toBeGreaterThan(higherOther[1].zIndex);
  });
});

describe('setGeometryIn', () => {
  it('writes a dragged position back', () => {
    const [w] = setGeometryIn([open()], 'a', { position: { x: 300, y: 200 } }, VP);
    expect(w.position).toEqual({ x: 300, y: 200 });
    expect(w.size).toEqual({ width: 600, height: 400 });
  });
  it('clamps and rounds what it is given', () => {
    const [w] = setGeometryIn([open()], 'a', { position: { x: -40.6, y: 9999 } }, VP);
    expect(w.position).toEqual({ x: 0, y: 400 });
  });
  it('returns the SAME array when the write-back changes nothing (a plain title-bar click)', () => {
    const ws = [open()];
    expect(setGeometryIn(ws, 'a', { position: { x: 100, y: 80 } }, VP)).toBe(ws);
  });
  it('is a no-op for a maximized, compact or closed window', () => {
    for (const ws of [[open({ isMaximized: true })], [open({ isCompact: true })], [win()]]) {
      expect(setGeometryIn(ws, 'a', { position: { x: 5, y: 5 } }, VP)).toBe(ws);
    }
  });
  it('writes a resize (size and the position react-rnd hands back with it)', () => {
    const [w] = setGeometryIn([open()], 'a', { position: { x: 90, y: 70 }, size: { width: 700, height: 450 } }, VP);
    expect(w.position).toEqual({ x: 90, y: 70 });
    expect(w.size).toEqual({ width: 700, height: 450 });
  });
});

describe('clampAllIn', () => {
  it('pulls every remembered frame inside the new viewport, hidden and closed windows included', () => {
    const small: Viewport = { width: 900, height: 700 };
    const ws = [
      open({ id: 'a', position: { x: 700, y: 400 } }),
      open({ id: 'b', isMinimized: true, position: { x: 800, y: 500 } }),
      win({ id: 'c', position: { x: 850, y: 550 }, size: { width: 600, height: 400 } }),
    ];
    const out = clampAllIn(ws, small);
    expect(out.map((w) => w.position)).toEqual([{ x: 300, y: 200 }, { x: 300, y: 200 }, { x: 300, y: 200 }]);
  });
  it('skips never-opened windows (no frame yet)', () => {
    const ws = [win()];
    expect(clampAllIn(ws, { width: 500, height: 400 })).toBe(ws);
  });
  it('returns the SAME array when everything already fits', () => {
    const ws = [open(), open({ id: 'b' })];
    expect(clampAllIn(ws, VP)).toBe(ws);
  });
  it('leaves untouched windows as the same objects', () => {
    const fits = open({ id: 'a', position: { x: 10, y: 10 } });
    const off = open({ id: 'b', position: { x: 2000, y: 10 } });
    const out = clampAllIn([fits, off], VP);
    expect(out[0]).toBe(fits);
    expect(out[1]).not.toBe(off);
  });
});

describe('restoredState', () => {
  it('un-minimizes and pulls the frame inside the CURRENT area (the browser may have shrunk while it was hidden)', () => {
    const w = open({ isMinimized: true, position: { x: 1300, y: 700 }, size: { width: 600, height: 400 } });
    const out = restoredState(w, { width: 1000, height: 700 });
    expect(out.isMinimized).toBe(false);
    expect(out.position).toEqual({ x: 400, y: 200 });
  });
  it('keeps maximized, params and everything else it was not asked to change', () => {
    const w = open({ isMinimized: true, isMaximized: true, params: { p: 1 } });
    expect(restoredState(w, VP)).toMatchObject({ isMaximized: true, params: { p: 1 }, isOpen: true });
  });
});

describe('getFrontWindow', () => {
  const z = (id: string, zIndex: number, over: Partial<WindowLike> = {}) => open({ id, zIndex, ...over });
  it('is the visible window with the highest z', () => {
    expect(getFrontWindow([z('a', 10), z('b', 12), z('c', 11)])?.id).toBe('b');
  });
  it('ignores closed and minimized windows, however high their z', () => {
    const ws = [z('a', 10), z('b', 99, { isMinimized: true }), win({ id: 'c', zIndex: 98 })];
    expect(getFrontWindow(ws)?.id).toBe('a');
  });
  it('ignores a bubble while any full window is visible: a bubble is raised on every shrink but is not what the visitor is working in', () => {
    const ws = [z('canvas', 12), z('call', 13, { isCompact: true })];
    expect(getFrontWindow(ws)?.id).toBe('canvas');
  });
  it('falls back to a lone bubble when nothing else is visible', () => {
    expect(getFrontWindow([z('call', 13, { isCompact: true }), z('t', 11, { isMinimized: true })])?.id).toBe('call');
  });
  it('is undefined when nothing is visible', () => {
    expect(getFrontWindow([win(), z('m', 10, { isMinimized: true })])).toBeUndefined();
    expect(getFrontWindow([])).toBeUndefined();
  });
});

describe('showAllWindowsIn', () => {
  it('restores every minimized window, clamps each frame, and leaves the z-order alone', () => {
    const ws = [
      open({ id: 'a', zIndex: 12, isMinimized: true, position: { x: 1300, y: 700 } }),
      open({ id: 'b', zIndex: 15 }),
      open({ id: 'c', zIndex: 11, isMinimized: true }),
    ];
    const out = showAllWindowsIn(ws, { width: 1000, height: 700 });
    expect(out.map((w) => w.isMinimized)).toEqual([false, false, false]);
    expect(out.map((w) => w.zIndex)).toEqual([12, 15, 11]);
    expect(out[0].position).toEqual({ x: 400, y: 200 }); // pulled inside the smaller area
  });
  it('never opens a closed window', () => {
    const ws = [win({ id: 'closed' }), open({ id: 'm', isMinimized: true })];
    const out = showAllWindowsIn(ws, VP);
    expect(out[0].isOpen).toBe(false);
    expect(out[1].isMinimized).toBe(false);
  });
  it('returns the SAME array when nothing is minimized', () => {
    const ws = [open({ id: 'a' }), open({ id: 'b', isCompact: true })];
    expect(showAllWindowsIn(ws, VP)).toBe(ws);
  });
});

describe('activateWindowIn (what a Dock or menu click means)', () => {
  it('opens a closed window', () => {
    const [w] = activateWindowIn([win()], 'a', VP);
    expect(w).toMatchObject({ isOpen: true, isMinimized: false });
  });
  it('restores a minimized window and brings it to the front', () => {
    const ws = [open({ id: 'a', isMinimized: true, zIndex: 10 }), open({ id: 'b', zIndex: 12 })];
    const out = activateWindowIn(ws, 'a', VP);
    expect(out[0].isMinimized).toBe(false);
    expect(out[0].zIndex).toBeGreaterThan(12);
  });
  it('expands a bubble and raises it (the call comes back to full size when its Dock icon is clicked)', () => {
    const ws = [open({ id: 'call', isCompact: true, zIndex: 11 }), open({ id: 'canvas', zIndex: 12 })];
    const out = activateWindowIn(ws, 'call', VP);
    expect(out[0].isCompact).toBe(false);
    expect(out[0].zIndex).toBeGreaterThan(12);
  });
  it('focuses a window that is already visible, touching nothing else', () => {
    const ws = [open({ id: 'a', zIndex: 10 }), open({ id: 'b', zIndex: 12 })];
    const out = activateWindowIn(ws, 'a', VP);
    expect(out[0].zIndex).toBeGreaterThan(12);
    expect(out[0]).toMatchObject({ isMinimized: false, isCompact: false });
  });
  it('returns the same array for an unknown id, and for the window that is already in front', () => {
    const ws = [open({ id: 'a', zIndex: 10 }), open({ id: 'b', zIndex: 12 })];
    expect(activateWindowIn(ws, 'nope', VP)).toBe(ws);
    expect(activateWindowIn(ws, 'b', VP)).toBe(ws);
  });
});

describe('canMinimize / canZoom (what a menu item may promise)', () => {
  const guard: CloseGuard = { title: 'End Call?', body: 'b', confirmLabel: 'End Call' };
  it('canMinimize: yes for an ordinary visible window', () => {
    expect(canMinimize(open())).toBe(true);
  });
  it('canMinimize: no for nothing, a closed window, a hidden one, or one with its close sheet up', () => {
    expect(canMinimize(undefined)).toBe(false);
    expect(canMinimize(win())).toBe(false);
    expect(canMinimize(open({ isMinimized: true }))).toBe(false);
    expect(canMinimize(open({ closeGuard: guard, closeRequested: true }))).toBe(false);
  });
  it('canMinimize: a live call (compact mode) can still be shrunk, but not once it is already the bubble', () => {
    expect(canMinimize(open({ minimizeMode: 'compact' }))).toBe(true);
    expect(canMinimize(open({ minimizeMode: 'compact', isCompact: true }))).toBe(false);
  });
  it('canMinimize: an ordinary window that happens to be compact CAN be minimized (it hides)', () => {
    expect(canMinimize(open({ isCompact: true }))).toBe(true);
  });
  it('canZoom: only a visible, full-size window', () => {
    expect(canZoom(open())).toBe(true);
    expect(canZoom(open({ isMaximized: true }))).toBe(true); // it un-zooms
    expect(canZoom(undefined)).toBe(false);
    expect(canZoom(win())).toBe(false);
    expect(canZoom(open({ isMinimized: true }))).toBe(false);
    expect(canZoom(open({ isCompact: true }))).toBe(false);
  });
  it('the reducers agree with the predicates for EVERY combination of flags (a menu item is enabled exactly when the click does something)', () => {
    const bools = [false, true];
    for (const isOpen of bools) for (const isMinimized of bools) for (const isCompact of bools)
      for (const closeRequested of bools) for (const mode of ['hide', 'compact'] as const) {
        const w = open({ isOpen, isMinimized, isCompact, closeRequested, minimizeMode: mode, closeGuard: closeRequested ? guard : null });
        const ws = [w];
        expect(minimizeWindowIn(ws, 'a') !== ws).toBe(canMinimize(w));
        expect(maximizeWindowIn(ws, 'a') !== ws).toBe(canZoom(w));
      }
  });
});
