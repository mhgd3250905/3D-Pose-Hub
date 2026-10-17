// s-frog-r2 青蛙式 · HipLab media fix 2026-10-17 (issue 9: feet stood upright, soles toward the camera).
// Revision of s-frog (original spec, its SHA and published media unchanged). Only the two feet change:
// ankles dorsiflexed (toes ~90 deg to the shin), INNER edge of each foot on the mat, toes pointing OUT to the sides,
// soles facing back. Same orientation as the user-accepted local fix revisions/hark-4080-v1/s-frog (v3-local), here
// written with lib/foot-orient.mjs and rendered on the training-human-v2 benchmark. Everything else is s-frog.
// Head points +Z, front (chest) faces -Y (down), body left = +X.
import base from './s-frog.js';
import { footRot } from '../lib/foot-orient.mjs';
const spec = structuredClone(base);
// left foot: toes +X (out), its inner edge (rest -X) down; right foot: toes -X (out), its inner edge (rest +X) down
spec.pose.base.feet.left.rot = footRot([1, 0, 0], [0, -1, 0], [-1, 0, 0]);
spec.pose.base.feet.right.rot = footRot([-1, 0, 0], [0, -1, 0], [1, 0, 0]);
export default { ...spec, id: 's-frog-r2', modelProfile: 'training-human-v2', alignClavicles: false };
