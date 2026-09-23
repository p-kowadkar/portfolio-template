import { describe, it, expect } from 'vitest';
import { DOCK_ICON_CENTER_FROM_BOTTOM, dockTargetFor, translateToward } from './dockTarget';

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

describe('translateToward', () => {
  const target = { x: 640, y: 744 };
  it('is the vector from the window centre to the target', () => {
    // A 600x400 window at (100, 80): centre (400, 280).
    expect(translateToward({ left: 100, top: 80, width: 600, height: 400 }, target)).toEqual({ x: 240, y: 464 });
  });
  it('is zero when the window is already centred on the target', () => {
    expect(translateToward({ left: 340, top: 544, width: 600, height: 400 }, target)).toEqual({ x: 0, y: 0 });
  });
  it('goes negative for a window right of / below the target (a bubble in the top-right corner)', () => {
    const bubble = { left: 1020, top: 68, width: 240, height: 200 };
    expect(translateToward(bubble, target)).toEqual({ x: 640 - 1140, y: 744 - 168 });
  });
  it('puts the window centre on the target at ANY scale (the animation scales about the centre, then translates)', () => {
    const rect = { left: 100, top: 80, width: 600, height: 400 };
    const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const t = translateToward(rect, target);
    // What the browser does for transform-origin: centre; transform: translate(t) scale(s): a point p lands
    // at centre + s * (p - centre) + t. The centre is p = centre, so it lands on the target for every s.
    const landed = (p: { x: number; y: number }, s: number) => ({
      x: centre.x + s * (p.x - centre.x) + t.x,
      y: centre.y + s * (p.y - centre.y) + t.y,
    });
    for (const s of [1, 0.5, 0.08]) expect(landed(centre, s)).toEqual(target);
    // ...while a corner shrinks toward it instead of staying put.
    const corner = { x: rect.left, y: rect.top };
    expect(landed(corner, 0.08).x).toBeCloseTo(target.x - 0.08 * (centre.x - corner.x), 6);
  });
});
