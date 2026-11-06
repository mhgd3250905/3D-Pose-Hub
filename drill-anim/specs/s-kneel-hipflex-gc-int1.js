// s-kneel-hipflex-gc-int1 (integration r1, 2026-11-06): ground-contact fix (s-kneel-hipflex-gc1, rear ankle +11 mm, plantarflex -3 deg) +
// self-collision fix of s-kneel-hipflex-sc1 (PR #29: hands-on-hips touch clearance left +41.4 / right +38.7 mm so thumbs/fingers
// no longer sink into hip / belly). Base is the GC spec; only the hands' touch.clear is raised by sc1's amounts.
import base from './s-kneel-hipflex-gc1.js';
const s = structuredClone(base);
s.id = 's-kneel-hipflex-gc-int1';
const ADD = { left: 0.0414, right: 0.0387 };
for (const side of ['left', 'right']) { const t = s.pose.base.hands[side].touch; t.clear = +((t.clear ?? 0.002) + ADD[side]).toFixed(4); }
export default s;
