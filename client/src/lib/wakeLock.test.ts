import { describe, it, expect } from 'vitest';
import { createScreenWakeHolder, type WakeLockLike } from './wakeLock';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

// A fake browser: a document whose visibility and listeners we drive, and a wake lock whose requests we can
// resolve, refuse or leave hanging.
const rig = (opts: { visible?: boolean; supported?: boolean } = {}) => {
  const listeners = new Set<() => void>();
  const doc = {
    visibilityState: opts.visible === false ? 'hidden' : 'visible',
    addEventListener: (_t: 'visibilitychange', l: () => void) => { listeners.add(l); },
    removeEventListener: (_t: 'visibilitychange', l: () => void) => { listeners.delete(l); },
  };
  const setVisible = (v: boolean) => { doc.visibilityState = v ? 'visible' : 'hidden'; Array.from(listeners).forEach((l) => l()); };

  const sentinels: { released: boolean; fireRelease: () => void }[] = [];
  const pending: { resolve: () => void; reject: (e: Error) => void }[] = [];
  let mode: 'resolve' | 'hang' | 'refuse' = 'resolve';
  const wl: WakeLockLike & { requests: number } = {
    requests: 0,
    request: () => {
      wl.requests += 1;
      if (mode === 'refuse') return Promise.reject(new Error('NotAllowedError'));
      const relListeners: (() => void)[] = [];
      const s = {
        released: false,
        fireRelease: () => { s.released = true; relListeners.forEach((l) => l()); },
        release: () => { if (!s.released) { s.released = true; relListeners.forEach((l) => l()); } return Promise.resolve(); },
        addEventListener: (_t: 'release', l: () => void) => { relListeners.push(l); },
      };
      sentinels.push(s);
      if (mode === 'hang') return new Promise((res, rej) => { pending.push({ resolve: () => res(s), reject: rej }); });
      return Promise.resolve(s);
    },
  };
  const holder = createScreenWakeHolder(() => (opts.supported === false ? undefined : wl), doc);
  return { holder, wl, sentinels, pending, setVisible, listeners, setMode: (m: typeof mode) => { mode = m; } };
};

describe('createScreenWakeHolder', () => {
  it('acquire takes one screen wake lock, and asking again while wanted does nothing', async () => {
    const r = rig();
    r.holder.acquire(); r.holder.acquire();
    await flush();
    expect(r.wl.requests).toBe(1);
    expect(r.sentinels[0].released).toBe(false);
  });

  it('release gives it back, and is idempotent', async () => {
    const r = rig();
    r.holder.acquire(); await flush();
    r.holder.release(); r.holder.release();
    expect(r.sentinels[0].released).toBe(true);
    expect(r.wl.requests).toBe(1);
  });

  it('releasing while the request is still in flight gives the late lock straight back (no leak)', async () => {
    const r = rig(); r.setMode('hang');
    r.holder.acquire(); await flush();
    r.holder.release();
    r.pending[0].resolve(); await flush();
    expect(r.sentinels[0].released).toBe(true);
  });

  it('acquire, release, acquire during ONE in-flight request keeps that lock and asks for no second one', async () => {
    const r = rig(); r.setMode('hang');
    r.holder.acquire(); await flush();
    r.holder.release();
    r.holder.acquire();
    r.pending[0].resolve(); await flush();
    expect(r.wl.requests).toBe(1);
    expect(r.sentinels[0].released).toBe(false);
  });

  it('a page that is hidden when the call starts asks for nothing until it becomes visible', async () => {
    const r = rig({ visible: false });
    r.holder.acquire(); await flush();
    expect(r.wl.requests).toBe(0);
    r.setVisible(true); await flush();
    expect(r.wl.requests).toBe(1);
  });

  it('when the browser takes the lock back (page hidden) the next time the page is visible takes it again', async () => {
    const r = rig();
    r.holder.acquire(); await flush();
    r.setVisible(false); r.sentinels[0].fireRelease();      // what a browser does on tab/app switch
    await flush();
    r.setVisible(true); await flush();
    expect(r.wl.requests).toBe(2);
    expect(r.sentinels[1].released).toBe(false);
  });

  it('a visibility change while a lock is still held asks for no second one', async () => {
    const r = rig();
    r.holder.acquire(); await flush();
    r.setVisible(false); r.setVisible(true); await flush();
    expect(r.wl.requests).toBe(1);
  });

  it('a refused request never throws, and is tried again when the page next becomes visible', async () => {
    const r = rig(); r.setMode('refuse');
    r.holder.acquire(); await flush();
    expect(r.wl.requests).toBe(1);
    r.setMode('resolve');
    r.setVisible(false); r.setVisible(true); await flush();
    expect(r.wl.requests).toBe(2);
    expect(r.sentinels[0].released).toBe(false);
  });

  it('where the API is missing every call is a no-op', async () => {
    const r = rig({ supported: false });
    expect(() => { r.holder.acquire(); r.holder.release(); r.holder.acquire(); }).not.toThrow();
    await flush();
    expect(r.wl.requests).toBe(0);
  });

  it('release stops listening: a later visibility change asks for nothing', async () => {
    const r = rig();
    r.holder.acquire(); await flush();
    r.holder.release();
    expect(r.listeners.size).toBe(0);
    r.setVisible(false); r.setVisible(true); await flush();
    expect(r.wl.requests).toBe(1);
  });

  it('can be acquired again after a release (a second call on the same screen)', async () => {
    const r = rig();
    r.holder.acquire(); await flush();
    r.holder.release();
    r.holder.acquire(); await flush();
    expect(r.wl.requests).toBe(2);
    expect(r.sentinels[0].released).toBe(true);
    expect(r.sentinels[1].released).toBe(false);
  });
});
