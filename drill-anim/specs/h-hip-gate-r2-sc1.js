// h-hip-gate-r2-sc1: self-collision fix (pose-fix r4, 2026-11-05) of h-hip-gate-r2. Hand on hip: fingers into the hip / upper thigh: the source hand touch solve
// rests the palm `clear` above the body, but on the current model the fingers/thumb sank into it (self-collision d10
// right 31.6 mm). That hand's touch clearance grows by the depth + 5 mm, so the hand sits that much further out
// along the same surface normal. Hand pose, finger / palm normal / poles, other hand, legs, trunk, timing and camera are the source's.
import base from './h-hip-gate-r2.js';
const s = structuredClone(base);
s.id = 'h-hip-gate-r2-sc1';
const ADD = {"right": 0.0366};
for (const [side, a] of Object.entries(ADD)) { const t = s.pose.base.hands[side].touch; t.clear = +((t.clear ?? 0.002) + a).toFixed(4); }
export default s;
