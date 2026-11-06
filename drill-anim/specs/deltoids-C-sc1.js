// deltoids-C-sc1: self-collision fix (pose-fix r4, 2026-11-05) of deltoids-C. Hand on the thigh: fingers into the thigh: the source hand touch solve
// rests the palm `clear` above the body, but on the current model the fingers/thumb sank into it (self-collision d10
// left 31.1 mm). That hand's touch clearance grows by the depth + 5 mm, so the hand sits that much further out
// along the same surface normal. Hand pose, finger / palm normal / poles, other hand, legs, trunk, timing and camera are the source's.
import base from './deltoids-C.js';
const s = structuredClone(base);
s.id = 'deltoids-C-sc1';
const ADD = {"left": 0.0361};
for (const [side, a] of Object.entries(ADD)) { const t = s.pose.base.hands[side].touch; t.clear = +((t.clear ?? 0.002) + a).toFixed(4); }
export default s;
