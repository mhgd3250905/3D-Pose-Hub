// h-bridge-march-r3 (elbow-twist r2, 2026-11-09): arm pose redo, replaces -r2.
// Standard glute bridge (march): lie on the back, arms long by the sides on the mat, palms down (NASM floor bridge "arms at your sides
// with palms facing down"; Physitrack / exercise.com glute bridge march "arms down at your sides"). The base had the palms pinned
// right beside the hips, so each arm bent ~55 deg and pushed back into the floor, with the left forearm rolled 135-143 deg against the
// upper arm (elbow pinch, ratio 0.80). -r2 then rolled the left humerus 130 deg (shoulder fold, band ratio 0.75 -> 0.50).
// Now both arms lie straight on the mat ~20 deg out from the trunk (wrist 0.47 m from the shoulder, elbow ~8 deg soft), palms flat
// down, fingers toward the feet; the humerus turns 30 deg inward (elbow pit up / slightly toward the feet) and the forearm pronation
// is left to the forearm/wrist. Floor-pinned palms (mode floor), so the hand sits on the mat; arm skin stays above the floor.
import base from './h-bridge-march-et1.js';
import { fixSide } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-bridge-march-r3';
for (const [side, sg] of [['left', -1], ['right', 1]]) {
  const h = s.pose.base.hands[side];
  h.mode = 'floor'; h.at = [0.033, sg * 0.348]; h.finger = [1, sg * 0.364]; h.poleUp = [0, -1, sg * 0.3];
  delete h.elbowTwist; delete h.upperArmTwist;
}
fixSide(s, 'left', 30, 0, 0);
fixSide(s, 'right', -30, 0, 0);
export default s;
