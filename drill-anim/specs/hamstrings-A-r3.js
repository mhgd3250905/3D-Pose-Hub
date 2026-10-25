// b002 RDL reach calibration on training-human-v2plus 1.0.0-rc2. Original r2 is retained.
// The legacy +55 mm rest-Z wrist offset exceeded the unchanged arm reach; remove it.
// Shorten only right free-ankle Y/Z vectors around the measured right hip to a maximum
// 178-degree knee reach. Left floor support, all timing/rotations/bow tracks and QA remain unchanged.
// Measurement evidence: diagnostics/b002-hamstrings-r3-eval2/{rest,before,after}.json.
import base from './hamstrings-A-r2.js';
const spec = structuredClone(base);
spec.id = 'hamstrings-A-r3';
const hip = [-0.081543,0.8519647653602053,0.0056505], rightLegScale = 0.9983364277226576;
for (const pose of [spec.pose.base, spec.pose.deltas.hinge, spec.pose.deltas.bow]) {
  for (const side of ['left', 'right']) pose.hands[side].wrist[2] -= 0.055;
  const ankle = pose.feet.right.ankle;
  for (const axis of [1, 2]) ankle[axis] = hip[axis] + (ankle[axis] - hip[axis]) * rightLegScale;
}
export default spec;
