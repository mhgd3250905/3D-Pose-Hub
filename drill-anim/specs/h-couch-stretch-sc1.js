// h-couch-stretch-sc1: self-collision fix (pose-fix r4, 2026-11-05) of h-couch-stretch. Hands-on-hips: the source hand touch solve (bisect
// along the surface normal to `clear` above the body) rests the palm on the hip, but on the current model the thumb and fingers
// that wrap the waist sank into the hip / lower belly (self-collision d10 left 35.6 / right 30.9 mm). Each hand's touch
// clearance grows by that depth + 5 mm, so the whole hand sits that much further out along the same surface normal.
// Hand pose, finger / palm normal / poles, legs, trunk, timing and camera are the source's.
import base from './h-couch-stretch.js';
const s = structuredClone(base);
s.id = 'h-couch-stretch-sc1';
const ADD = { left: 0.0406, right: 0.0359 };
for (const side of ['left', 'right']) { const t = s.pose.base.hands[side].touch; t.clear = +((t.clear ?? 0.002) + ADD[side]).toFixed(4); }
export default s;
