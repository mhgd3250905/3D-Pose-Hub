// n-windshield-r3 (elbow-twist-r1, 2026-11-08, global elbow scan): the elbow skin pinched into a thin "candy-wrapper" neck because the
// forearm was rolled against an unrotated upper arm. Fix: roll the humerus at the shoulder (upperArmTwist) so the elbow pit takes
// an anatomical direction and the elbow stays a near-pure hinge; elbowTwist/twistShare keep the rest of the forearm/hand roll.
// Change per side = upperArmTwist +a, elbowTwist +b, and a fraction c of any time-varying (delta-driven) elbowTwist moved to the shoulder.
// left: a=45 b=-15 c=0; elbow min width ratio 0.84 -> 0.95, cross-elbow twist max 91 -> 41 deg, hand-vs-forearm max 29 -> 36 deg.
// right: a=-45 b=15 c=0; elbow min width ratio 0.85 -> 0.95, cross-elbow twist max 91 -> 41 deg, hand-vs-forearm max 29 -> 36 deg.
// Measured with tools/pose-fix-1108/elbow-pinch-metric.js (+shoulder/wrist slices, pit, floor/contact proxy). Bone roll only: joint
// positions (drift <= 0.00 mm), palms, poles, timing, camera unchanged.
import base from './n-windshield-r2-et1.js';
const s = structuredClone(base);
s.id = 'n-windshield-r3';
function fixSide(side, a, b, c) {
  const h = s.pose.base.hands[side], U0 = h.upperArmTwist ?? 0, E0 = h.elbowTwist ?? 0;
  for (const d of Object.values(s.pose.deltas || {})) {
    const x = d.hands?.[side]; if (!x) continue;
    if (x.elbowTwist !== undefined) { const ev = x.elbowTwist - E0; x.elbowTwist += b; x.upperArmTwist = (x.upperArmTwist ?? U0) + a + c * ev; }
    else if (x.upperArmTwist !== undefined) x.upperArmTwist += a;
  }
  h.upperArmTwist = U0 + a; h.elbowTwist = E0 + b;
}
fixSide('left', 45, -15, 0);
fixSide('right', -45, 15, 0);
export default s;
