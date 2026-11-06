// h-half-kneeling-quad-stretch-r6-sc1: self-collision fix (pose-fix r7, 2026-11-05) of h-half-kneeling-quad-stretch-r6. The right hand
// resting on the right hip/thigh sank its fingers 28.3 mm into the thigh on the current model; its touch clearance grows by 33 mm so
// the palm sits that much further out along the same surface normal. Left heel grasp (native action pose), legs, trunk, timing and
// camera are r6's; the native action corrective is re-bound to this spec id (native-action-hand-pose-r1 SPEC_IDS + manifest).
import base from './h-half-kneeling-quad-stretch-r6.js';
const s = structuredClone(base);
s.id = 'h-half-kneeling-quad-stretch-r6-sc1';
s.revisionOf = 'h-half-kneeling-quad-stretch-r6';
s.actionCorrective = { ...s.actionCorrective, specId: s.id };
{ const t = s.pose.base.hands.right.touch; t.clear = +((t.clear ?? 0.002) + 0.033).toFixed(4); }
export default s;
