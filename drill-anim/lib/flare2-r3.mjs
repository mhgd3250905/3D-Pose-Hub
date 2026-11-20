// Flare 2.0 moves r3 (2026-11-21, batch 2a): helpers for the r3 specs (t-* 练后 专项补强 + Flare2). Pure math, no browser.
// Re-exports drill-anim/lib/flare2-r2.mjs (unchanged) and adds the hand shapes the r3 floor-support moves need. Hand pose = the same
// 19 numbers [iM,iP,iD,iA, mM,mP,mD,mA, rM,rP,rD,rA, lM,lP,lD,lA, tF,tA,tI] (deg) drawn by tools/flare2-moves-r3/v5/v5r2-ext.js.
import { SHAPES as S2, FPS, perFrame, ss, win, V } from './flare2-r2.mjs';
export { FPS, perFrame, ss, win, V };
export const SHAPES = {
  ...S2,
  // palm-flat floor support: fingers straight, lightly spread (as in any push-up / plank on the hands)
  flat: [0, 0, 0, 6, 0, 0, 0, 2, 0, 0, 0, 5, 0, 0, 0, 9, 0, -10, 0],
  // knuckle support (fist on the floor, weight on the index + middle knuckles): proximal phalanges at a right angle to the back of the
  // hand, so their backs and the knuckles form the flat contact face; middle/distal phalanges folded into the palm, thumb across them
  floorFist: [90, 100, 60, -2, 90, 100, 60, 0, 90, 100, 58, -2, 90, 98, 56, -4, 32, 30, 40],
};
// fingers pressed flat on the floor while the heel of the palm lifts by `liftDeg` (the palm tilts up about the knuckles): every finger
// is bent BACK at the knuckle (MCP extension) by the same angle so the fingers stay flat on the floor; the thumb lifts with the palm
export const fingersFlatUnderLift = (liftDeg) => SHAPES.flat.map((x, i) => (i % 4 === 0 && i < 16) ? +(x - liftDeg).toFixed(2) : (i === 16 ? +(x - 0.35 * liftDeg).toFixed(2) : x));
// mix of shapes {name: weight} (weights need not sum to 1; the remainder is 'open')
export const mix = (w) => SHAPES.open.map((_, i) => +Object.entries(w).reduce((a, [k, x]) => a + x * SHAPES[k][i], 0).toFixed(2));
