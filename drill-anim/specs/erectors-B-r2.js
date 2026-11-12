// erectors-B-r2 (pose fix 2026-11-08, user review: "脚方向反了"): on the v3 armfix model the active spec still had the pre-2026-10-13
// shoe direction heading -90 (toe joint at x -0.545, BEHIND the ankle, toes pointing back into the wall). Same fix the user accepted on
// 2026-10-13 (docs/erectors-B-footfix-2026-10-13.md): both feet heading 90 -> toes point forward/down under the body, balls of the feet
// and toes on the floor, heels up toward the wall, soles facing the wall (standard setup: legs straight back, toes dug in, feet braced
// at the foot of a wall). Ankle positions, 58 deg foot pitch, pelvis/ball contact, timing, arms and camera unchanged; the wall face is
// moved back so the heels clear it by ~1 mm (WALLX below, measured as the rearmost body vertex - 1 mm).
import base from './erectors-B.js';
const s = structuredClone(base);
const WALLX = -0.5456;   // rearmost body vertex (heel) measured at x = -0.5446 over the whole loop -> 1.0 mm gap
s.id = 'erectors-B-r2';
s.pose.base.feet.right.heading = 90;
s.pose.base.feet.left.heading = 90;
s.props = s.props.map(p => p.type === 'wall' ? { ...p, at: [WALLX, 0, 0] } : p);
export default s;
