// s-9090-r2 90/90 坐姿换髋 · HipLab media fix 2026-10-17 (issue 10: both feet stood upright, toes to the ceiling).
// Revision of s-9090 (original spec, its SHA and published media unchanged). Only the feet change, see _9090-feet.mjs:
// front foot along the shin to the side on its outer edge, back foot back along the shin on its inner edge.
// Head points +Y, front shin points +X, body left = +X.
import base from './s-9090.js';
import { ROT_R, ROT_L, ANKLE_R, ANKLE_L } from './_9090-feet.mjs';
const spec = structuredClone(base);
Object.assign(spec.pose.base.feet.right, { rot: ROT_R, ankle: ANKLE_R });
Object.assign(spec.pose.base.feet.left, { rot: ROT_L, ankle: ANKLE_L });
export default { ...spec, id: 's-9090-r2', modelProfile: 'training-human-v2', alignClavicles: false };
