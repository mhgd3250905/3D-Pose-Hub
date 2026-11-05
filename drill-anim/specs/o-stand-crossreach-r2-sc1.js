// o-stand-crossreach-r2-sc1 (pose-fix r7, 2026-11-05): shallower leg cross. The right foot (crossed behind the left) moves 2 cm less
// far across (x 0.20 -> 0.18) and 6 cm further back (z -0.25 -> -0.31), so the crossed thighs no longer sink 22.8 mm into each
// other. Everything else (arms, chair, trunk lean, timing, camera) is r2's.
import base from './o-stand-crossreach-r2.js';
const s = structuredClone(base);
s.id = 'o-stand-crossreach-r2-sc1';
s.pose.base.feet.right = { ...s.pose.base.feet.right, at: [0.18, -0.31] };
export default s;
