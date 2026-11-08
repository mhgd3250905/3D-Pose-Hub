// h-open-book-r12: hold-height fix of h-open-book-r11.js (2026-11-08). Only the top (right) upper-arm sweep in the hold changes.
// User review of r11: with the mirrored ~26-31 deg elbow (bending toward the head) the top hand hangs ~21 cm above the floor in
// the hold (t~4 s); r10's straight arm put it ~5 cm above. r12 lowers the top upper arm toward the floor during the hold by
// sweeping it further in the chest transverse plane (extra DH deg on top of r9's -150 deg), so the hand ends ~4-6 cm above the
// floor. The extra sweep is 0 up to the straight-up moment (p = P2, t = 2 s) and eases in with a smoothstep to the full value
// at p = 1 (hold), easing out the same way on the return, so the start segment and t = 2 are exactly r11. Elbow flexion,
// bend direction, palm-vs-crease (mirror of the bottom arm), ELEV(p), chest turn, bottom arm, legs, pillow, timing: r11.
import { make } from './h-open-book-r9.js';
import { elev } from './h-open-book-r10.js';
import { rightHand } from './h-open-book-r11.js';
const P2 = 0.5522642316338267;   // opening p at t=2 s
export const holdEase = q => { const x = Math.max(0, Math.min(1, (q - P2) / (1 - P2))); return x * x * (3 - 2 * x); };
export function makeR12({ DH = -18.5, DE = 0 } = {}) {
  const base = rightHand();
  const RIGHT = args => base({ ...args,
    ang: t => args.ang(t) + DH * holdEase(args.p(t)),
    eOf: t => args.eOf(t) + DE * holdEase(args.p(t)) * Math.PI / 180 });
  return make({ ELEV: elev, RIGHT });
}
const r12 = makeR12();
export default { ...r12, id: 'h-open-book-r12' };
