// h-chair-single-leg-hip-thrust-rr8-fa1: raised (right) foot angle fix of rr8 (foot-angle r2, 2026-11-06). User: raised/crossed feet
// at clearly wrong angles. The raised right foot rot [[Z,-90]] (hips frame) pointed the toes straight along the shin = ~90 deg plantar
// flexion relative to the solved shin in every frame (anatomical max ~50; a single-leg hip thrust keeps the lifted foot neutral/flexed).
// After: one extra world rotation about the sagittal-plane lateral axis (+Z, the axis the hips pitch about, so it holds through the
// thrust) turns the toes up 73 deg -> ~10 deg plantar flexion, sole facing forward/away. Only the right foot rotation changes:
// ankle path, knee pole, support leg, arms, timing and camera unchanged.
import previous from './h-chair-single-leg-hip-thrust-rr8.js';
const s = structuredClone(previous);
s.id = 'h-chair-single-leg-hip-thrust-rr8-fa1';
s.pose.base.feet.right.rot = [...s.pose.base.feet.right.rot, [[0, 0, 1], 73]];
export default s;
