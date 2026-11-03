// Actual-new-mesh palm-contact calibration after r4 removed the failed proxy walker.
// r4 restored exact reachable palm targets but left ~11.3894mm/9.4689mm between
// the left/right palm surface patches and the visible waist. Move each target
// towards its measured surface, retaining a 0.5mm gap, orientation and hip frame.
// All lift/ankle/foot-roll tracks, support solver and timing stay r4's.
import base from './h-side-leg-raise-r4.js';
const spec = structuredClone(base);
spec.pose.base.hands.left.palmAt[0] -= 0.010889397229769644;
spec.pose.base.hands.right.palmAt[0] += 0.008968894348133208;
export default { ...spec, id: 'h-side-leg-raise-r5' };
