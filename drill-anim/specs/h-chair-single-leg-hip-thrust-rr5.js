// Same supported hip-thrust motion; neutral, lightly curled hands beside hips.
// Narrower lens improves actual rendered detail instead of enlarging tiny pixels.
import previous from './h-chair-single-leg-hip-thrust-rr4.js';
const s = structuredClone(previous);
s.id = 'h-chair-single-leg-hip-thrust-rr5';
delete s.v2plus.handPose;
for (const [side, hand] of Object.entries(s.pose.base.hands)) {
  const sign = side === 'left' ? 1 : -1;
  Object.assign(hand, {palmAt:[sign * .18,1.00,.04], finger:[0,-.95,.3],
    normal:[-sign,0,0], poleUp:[sign * .42,1.10,-.16], relax:.2});
}
s.camera = {...s.camera, fov:14};
export default s;
