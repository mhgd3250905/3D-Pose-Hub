// h-standing-arm-extension-stretch-r7 (elbow-twist r2, 2026-11-09): reverts the elbow-twist r1 change (-r6 rolled the upper arms
// +-40 deg; shoulder width 0.97 -> 0.92, flips +20). Forearm roll (elbowTwist) has no effect on this spec, and the pre-fix elbow
// ratio is 0.84, so the pose goes back to -r5 unchanged (user-approved 2026-11-09).
import base from './h-standing-arm-extension-stretch-r5.js';
const s = structuredClone(base);
s.id = 'h-standing-arm-extension-stretch-r7';
export default s;
