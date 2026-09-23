/**
 * dockTarget -- where a minimizing window flies to: the centre of its Dock icon, in VIEWPORT
 * (client) coordinates. The minimize animation subtracts the window's own centre to get its
 * translate, so both sides of that subtraction must be in the same space.
 *
 * Why it is a helper and not "just read the icon's rect": the Dock auto-hides by translating
 * itself below the viewport (Dock.tsx), so while it is hidden the icon's real rect is off-screen,
 * and a window animating toward it would fly out of view. The X comes from the DOM (hiding only
 * moves the Dock vertically, so an icon's horizontal position is stable), and the Y comes from the
 * Dock's known geometry, which is the same whether the Dock is showing or not.
 *
 * The anchor is `data-dock-id` on each DockItem's OUTER wrapper, not on the icon itself: the icon
 * carries the hover-magnification scale and lift springs, so its rect moves as the mouse does,
 * while the wrapper is a static 60px column.
 *
 * This module has zero behaviour change in the sprint that adds it -- nothing calls
 * getDockTarget yet (it is wired to the minimize-flight animation later). It exists now so the
 * Dock's data-dock-id contract and the pure math underneath it can be tested independently of
 * that animation.
 */
import { getViewport, type Point, type Viewport } from './windowState';

export const DOCK_ITEM_ATTR = 'data-dock-id';

/** How far the centre of a Dock icon sits above the bottom of the viewport. From Dock.tsx: the
 *  outer wrapper's 8px bottom padding + the pill's 10px bottom padding + the running-dot row under
 *  every icon (a 4px dot with a 4px top margin) + half of the 60px icon. If the Dock's padding or
 *  icon size changes, this must change with it. Template's Dock.tsx uses the identical 8px/10px/
 *  4px/4px/60px padding and icon-size numbers this constant was originally derived from (checked
 *  against Dock.tsx's own style values before reusing it), so it was kept as-is rather than
 *  recalculated -- and re-confirmed against the real DOM in the browser (see the port's progress
 *  log for the exact measurement). */
export const DOCK_ICON_CENTER_FROM_BOTTOM = 56;

/** The pure part: where the target is, given the icon's rect if it has one. With no icon (an app
 *  that has no Dock icon, like a future transient one before it is added) the target is bottom
 *  centre, so the window still shrinks toward the Dock instead of toward nothing. */
export function dockTargetFor(iconRect: { left: number; width: number } | null, viewport: Viewport): Point {
  return {
    x: iconRect ? iconRect.left + iconRect.width / 2 : viewport.width / 2,
    y: viewport.height - DOCK_ICON_CENTER_FROM_BOTTOM,
  };
}

/** The translate that moves a window's visual centre onto `target`, for the minimize animation.
 *  `rect` is the window's ROOT element in viewport coordinates (a CSS transform on a child does not
 *  change the root's rect, so it can be measured while the inner element is mid-animation), and
 *  `target` is getDockTarget's point in the same space. The inner element scales about its centre
 *  (the default transform-origin), and scaling about the centre leaves the centre where it is, so a
 *  plain translate by (target - centre) puts the centre on the target at any scale. */
export function translateToward(
  rect: { left: number; top: number; width: number; height: number },
  target: Point,
): Point {
  return {
    x: target.x - (rect.left + rect.width / 2),
    y: target.y - (rect.top + rect.height / 2),
  };
}

export function getDockTarget(id: string): Point {
  const el =
    typeof document !== 'undefined'
      ? document.querySelector(`[${DOCK_ITEM_ATTR}="${id.replace(/["\\]/g, '\\$&')}"]`)
      : null;
  return dockTargetFor(el ? el.getBoundingClientRect() : null, getViewport());
}
