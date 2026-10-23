// Preserve rr2 motion and hand targets. The legacy touch search ignores the
// visible v2plus torso and pushes both wrists inward by 120 mm on failure.
// Hands remain unweighted beside the hips; this is not a load-bearing contact.
import previous from './h-bent-knee-calf-raise-rr2.js';
const s = structuredClone(previous);
s.id = 'h-bent-knee-calf-raise-rr3';
for (const hand of Object.values(s.pose.base.hands)) delete hand.touch;
export default s;
