import { describe, it, expect } from 'vitest';
import { createShellLatch } from './shellLatch';

// A window and a call, stubbed: `mobile` is what detect() would say right now, `live` whether a call holds.
const rig = (mobile: boolean, live = false) => {
  const s = { mobile, live };
  return { s, read: createShellLatch(() => s.mobile, () => s.live) };
};

describe('createShellLatch', () => {
  it('follows the window on every read while no call holds it', () => {
    const { s, read } = rig(false);
    expect(read()).toBe(false);
    s.mobile = true;
    expect(read()).toBe(true);
    s.mobile = false;
    expect(read()).toBe(false);
  });

  it('stands still while a call holds it, whichever way the window flips', () => {
    const { s, read } = rig(false);
    read(); // App rendered the desktop shell
    s.live = true;
    s.mobile = true; // rotated to a phone width mid-call
    expect(read()).toBe(false);
    s.mobile = false;
    s.mobile = true;
    expect(read()).toBe(false);
  });

  it('holds the mobile shell the same way in the other direction', () => {
    const { s, read } = rig(true);
    read();
    s.live = true;
    s.mobile = false; // rotated wide mid-call
    expect(read()).toBe(true);
  });

  it('looks at the window again on the first read after the hold is dropped', () => {
    const { s, read } = rig(false);
    read();
    s.live = true;
    s.mobile = true;
    read();
    s.live = false;
    expect(read()).toBe(true);
  });

  it('a flip and a flip back while held ends where it began: no swap on release', () => {
    const { s, read } = rig(false);
    read();
    s.live = true;
    s.mobile = true;
    read();
    s.mobile = false;
    read();
    s.live = false;
    expect(read()).toBe(false);
  });

  it('holds whatever the last free read said, not the window at the instant the hold began', () => {
    const { s, read } = rig(false);
    read(); // App last rendered desktop...
    s.mobile = true; // ...the window resized, but App has not re-read yet...
    s.live = true; // ...and the visitor accepted a call in that gap
    expect(read()).toBe(false);
  });

  it('a first read that lands while a call already holds has nothing to hold: it detects, then holds that', () => {
    const { s, read } = rig(true, true);
    expect(read()).toBe(true);
    s.mobile = false;
    expect(read()).toBe(true);
  });

  it('two latches are independent', () => {
    const one = rig(false);
    const two = rig(true);
    expect(one.read()).toBe(false);
    expect(two.read()).toBe(true);
  });
});
