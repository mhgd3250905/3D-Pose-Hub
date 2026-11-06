// h-donkey-kick-gc1-fa1: kicking (right) foot angle fix of h-donkey-kick-gc1 (foot-angle r2, 2026-11-06). User: raised feet at clearly
// wrong angles. The right foot world rot (base X35/Y90/Z0 -> lift Z-55) folded the toes back along the shin toward the knee = ~90 deg
// DORSIflexion relative to the solved shin in every frame (toe joint between ankle and knee; anatomical max ~20-30). Donkey-kick cue:
// knee bent 90, foot flexed, sole pressing to the ceiling. After: one extra world rotation about the lateral axis (+Z; the leg swings
// in the X-Y plane, so it commutes with the lift's Z swing) of -85 deg, same in base and lift -> ~2 deg plantar flexion, toes pointing
// back, sole up at the top of the kick. Only the right foot rotation changes: ankle/pole tracks, timing, camera unchanged.
import previous from './h-donkey-kick-gc1.js';
const s = { ...previous, id: 'h-donkey-kick-gc1-fa1', pose: { ...previous.pose } };
const add = f => ({ ...f, rot: [...f.rot, [[0, 0, 1], -85]] });
s.pose.base = { ...previous.pose.base, feet: { ...previous.pose.base.feet, right: add(previous.pose.base.feet.right) } };
s.pose.deltas = { ...previous.pose.deltas, lift: { ...previous.pose.deltas.lift, feet: { ...previous.pose.deltas.lift.feet, right: add(previous.pose.deltas.lift.feet.right) } } };
export default s;
