import { describe, it, expect } from 'vitest';
import { isCallLive, setCallLive, subscribeCallLive } from './callPresence';

// Module state is shared across tests, so every test drops what it took.
const counter = () => {
  let n = 0;
  return { bump: () => { n += 1; }, get n() { return n; } };
};

describe('callPresence', () => {
  it('is free until something holds it', () => {
    expect(isCallLive()).toBe(false);
  });

  it('a hold makes it live and dropping it frees it, and subscribers hear each flip once', () => {
    const a = {};
    const heard = counter();
    const off = subscribeCallLive(heard.bump);
    setCallLive(a, true);
    expect(isCallLive()).toBe(true);
    expect(heard.n).toBe(1);
    setCallLive(a, false);
    expect(isCallLive()).toBe(false);
    expect(heard.n).toBe(2);
    off();
  });

  it('holding twice with the same owner is one hold, and says nothing the second time', () => {
    const a = {};
    const heard = counter();
    const off = subscribeCallLive(heard.bump);
    setCallLive(a, true);
    setCallLive(a, true);
    expect(heard.n).toBe(1);
    setCallLive(a, false); // one drop frees it: the owner only ever counted once
    expect(isCallLive()).toBe(false);
    off();
  });

  it('two owners never clear each other: it stays live until both let go', () => {
    const a = {};
    const b = {};
    const heard = counter();
    const off = subscribeCallLive(heard.bump);
    setCallLive(a, true);
    setCallLive(b, true);
    expect(heard.n).toBe(1); // held -> still held is not a flip
    setCallLive(a, false);
    expect(isCallLive()).toBe(true);
    expect(heard.n).toBe(1);
    setCallLive(b, false);
    expect(isCallLive()).toBe(false);
    expect(heard.n).toBe(2);
    off();
  });

  it('dropping something that never held is a no-op with no notification', () => {
    const heard = counter();
    const off = subscribeCallLive(heard.bump);
    setCallLive({}, false);
    expect(isCallLive()).toBe(false);
    expect(heard.n).toBe(0);
    off();
  });

  it('an unsubscribed listener hears nothing more, and every remaining one still does', () => {
    const a = {};
    const one = counter();
    const two = counter();
    const offOne = subscribeCallLive(one.bump);
    const offTwo = subscribeCallLive(two.bump);
    setCallLive(a, true);
    offOne();
    setCallLive(a, false);
    expect(one.n).toBe(1);
    expect(two.n).toBe(2);
    offTwo();
  });

  it('a listener that unsubscribes while being notified does not skip the others', () => {
    const a = {};
    const later = counter();
    let offFirst = () => {};
    offFirst = subscribeCallLive(() => offFirst());
    const offLater = subscribeCallLive(later.bump);
    setCallLive(a, true);
    expect(later.n).toBe(1);
    setCallLive(a, false);
    offLater();
  });
});
