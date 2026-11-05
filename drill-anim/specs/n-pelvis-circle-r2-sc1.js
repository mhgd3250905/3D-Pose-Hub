// n-pelvis-circle-r2-sc1: self-collision fix (pose-fix r5, 2026-11-05) of n-pelvis-circle-r2. hands on hips: fingers into the thigh/waist, 28.1 / 26.3 mm: the source hand touch solve rests the palm `clear`
// above the body, but on the current model the fingers/thumb sank into it. That hand's touch clearance grows by the depth + 5 mm, so the
// hand sits that much further out along the same surface normal. Hand pose, finger / palm normal / poles, other hand, legs, trunk, timing and camera are the source's.
import base from './n-pelvis-circle-r2.js';
const s = structuredClone(base);
s.id = 'n-pelvis-circle-r2-sc1';
const ADD = {"left": 0.033, "right": 0.031};
for (const [side, a] of Object.entries(ADD)) { const t = s.pose.base.hands[side].touch; t.clear = +((t.clear ?? 0.002) + a).toFixed(4); }
export default s;
