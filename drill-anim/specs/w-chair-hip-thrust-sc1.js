// w-chair-hip-thrust-sc1: self-collision fix (pose-fix r5, 2026-11-05) of w-chair-hip-thrust. Hands on hips: with fingers forward-down the thumb wrapped into the
// waist at the deepest frame (touch clearance alone could not clear it in r4). Hand shape changed to a flatter hand on the side of the hip:
// fingers point mostly down (finger y -0.35 -> -0.8), plus touch clearance +30 mm. Palm stays on the hip; legs, trunk, timing, camera are the source's.
import base from './w-chair-hip-thrust.js';
const s = structuredClone(base);
s.id = 'w-chair-hip-thrust-sc1';
for (const side of ['left', 'right']) { const h = s.pose.base.hands[side]; const sx = side === 'left' ? -1 : 1;
  h.finger = [0.05 * sx, -0.8, 0.6]; h.touch.clear = +(h.touch.clear + 0.030).toFixed(4); }
export default s;
