// deltoids-C-gc-int1 (integration r1, 2026-11-06): ground-contact fix (deltoids-C-gc1, pelvis +32 mm, rear knee on y=0) +
// self-collision fix of deltoids-C-sc1 (PR #29: left hand on thigh, touch clearance +36.1 mm so fingers no longer sink into the thigh).
// Base is the GC spec; only the left hand's touch.clear is raised by the same amount sc1 used. Everything else is gc1's.
import base from './deltoids-C-gc1.js';
const s = structuredClone(base);
s.id = 'deltoids-C-gc-int1';
const ADD = { left: 0.0361 };
for (const [side, a] of Object.entries(ADD)) { const t = s.pose.base.hands[side].touch; t.clear = +((t.clear ?? 0.002) + a).toFixed(4); }
export default s;
