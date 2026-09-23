import { describe, it, expect } from 'vitest';
import { DOCK_ICON_CENTER_FROM_BOTTOM, dockTargetFor } from './dockTarget';

const VP = { width: 1280, height: 800 };

describe('dockTargetFor', () => {
  it("is the icon's horizontal centre, and a Y taken from the Dock's geometry", () => {
    expect(dockTargetFor({ left: 100, width: 60 }, VP)).toEqual({ x: 130, y: 800 - DOCK_ICON_CENTER_FROM_BOTTOM });
  });
  it('keeps Y on-screen however the icon itself sits (the auto-hidden Dock is translated below the viewport)', () => {
    // A hidden Dock's real icon rect would be ~100px lower; only the X of the rect is used.
    const t = dockTargetFor({ left: 500, width: 60 }, VP);
    expect(t.y).toBeLessThan(VP.height);
    expect(t.y).toBeGreaterThan(VP.height - 100);
  });
  it('falls back to bottom centre when the app has no Dock icon', () => {
    expect(dockTargetFor(null, VP)).toEqual({ x: 640, y: 800 - DOCK_ICON_CENTER_FROM_BOTTOM });
  });
  it('follows the viewport size', () => {
    expect(dockTargetFor(null, { width: 900, height: 600 })).toEqual({ x: 450, y: 600 - DOCK_ICON_CENTER_FROM_BOTTOM });
  });
  it('is in viewport coordinates: the icon rect is used as given, not offset', () => {
    expect(dockTargetFor({ left: 0, width: 60 }, VP).x).toBe(30);
  });
});
