// Hand-only refinement: fingers follow the thigh instead of pointing forward.
// A small implicit relaxed pose avoids the full-curl preset; no legacy touch.
import previous from './h-bent-knee-calf-raise-rr3.js';
const s = structuredClone(previous);
s.id = 'h-bent-knee-calf-raise-rr4';
delete s.v2plus.handPose;
for (const [side, hand] of Object.entries(s.pose.base.hands)) {
  const sign = side === 'left' ? 1 : -1;
  Object.assign(hand, {palmAt:[sign * .18,1.00,.04], finger:[0,-.95,.3],
    normal:[-sign,0,0], poleUp:[sign * .42,1.10,-.16], relax:.2});
}
export default s;
