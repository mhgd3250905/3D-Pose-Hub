// t-seated-straddle-lift-1leg-r4 (elbow-twist-r1, 2026-11-08, global elbow scan): the elbow skin pinched into a thin "candy-wrapper" neck because the
// forearm was rolled against an unrotated upper arm. Fix: roll the humerus at the shoulder (upperArmTwist) so the elbow pit takes
// an anatomical direction and the elbow stays a near-pure hinge; elbowTwist/twistShare keep the rest of the forearm/hand roll.
// Change per side = upperArmTwist +a, elbowTwist +b, and a fraction c of any time-varying (delta-driven) elbowTwist moved to the shoulder.
// left: a=-35 b=-55 c=1; elbow min width ratio 0.42 -> 0.98, cross-elbow twist max 142 -> 30 deg, hand-vs-forearm max 42 -> 14 deg.
// right: a=45 b=75 c=1; elbow min width ratio 0.42 -> 0.97, cross-elbow twist max 142 -> 30 deg, hand-vs-forearm max 42 -> 24 deg.
// Measured with tools/pose-fix-1108/elbow-pinch-metric.js (+shoulder/wrist slices, pit, floor/contact proxy). Bone roll only: joint
// positions (drift <= 0.00 mm), palms, poles, timing, camera unchanged.
import base from './t-seated-straddle-lift-1leg-r3-gc1-ht1.js';
const s = structuredClone(base);
s.id = 't-seated-straddle-lift-1leg-r4';
function fixSide(side, a, b, c) {
  const h = s.pose.base.hands[side], U0 = h.upperArmTwist ?? 0, E0 = h.elbowTwist ?? 0;
  for (const d of Object.values(s.pose.deltas || {})) {
    const x = d.hands?.[side]; if (!x) continue;
    if (x.elbowTwist !== undefined) { const ev = x.elbowTwist - E0; x.elbowTwist += b; x.upperArmTwist = (x.upperArmTwist ?? U0) + a + c * ev; }
    else if (x.upperArmTwist !== undefined) x.upperArmTwist += a;
  }
  h.upperArmTwist = U0 + a; h.elbowTwist = E0 + b;
}
fixSide('left', -35, -55, 1);
fixSide('right', 45, 75, 1);
export default s;
