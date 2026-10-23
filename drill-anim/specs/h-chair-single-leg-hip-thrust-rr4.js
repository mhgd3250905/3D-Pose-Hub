// Preserve rr3 pelvis, legs, chair support, timing, camera and hand targets.
// Do not apply the old-body touch search to v2plus meshes. Hands stay relaxed
// beside the hips and provide no external support.
import previous from './h-chair-single-leg-hip-thrust-rr3.js';
const s = structuredClone(previous);
s.id = 'h-chair-single-leg-hip-thrust-rr4';
for (const hand of Object.values(s.pose.base.hands)) delete hand.touch;
export default s;
