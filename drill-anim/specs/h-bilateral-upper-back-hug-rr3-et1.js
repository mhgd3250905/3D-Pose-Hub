// h-bilateral-upper-back-hug-rr3-et1 (pose-fix r1, 2026-11-05; user device mark r2-v1 5.7 s "forearm suddenly twists").
// rr3 added elbowTwist compensation tracks (left down to -110 deg, right -62 deg) tuned on the old body. On armfix-r2 they
// push the hand-vs-forearm roll from about -66 deg to +135 deg, so it crosses +-180 during the hug ramp (about 2.0 s and
// 5.8 s) and the forearm snaps half a turn. et1 drops only those elbowTwist tracks (upperArmTwist, positions, poles, hand
// orientation, timing and camera stay rr3's): measured roll stays inside -66..+25 deg with no wrap.
import base from './h-bilateral-upper-back-hug-rr3.js';
const s = structuredClone(base);
s.id = 'h-bilateral-upper-back-hug-rr3-et1';
for (const side of ['left', 'right']) { const k = 'r3_' + side + '_elbowTwist'; delete s.timeline.tracks[k]; delete s.pose.deltas[k]; delete s.pose.base.hands[side].elbowTwist; }
export default s;
