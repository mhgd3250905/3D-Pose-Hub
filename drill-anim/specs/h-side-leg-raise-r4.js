// Diagnostic hand-contact candidate; r3's shoe/seam repair stays frozen.
// The old proxy-only touch walker moved up to 120mm towards the body core when
// no proxy normal was found, leaving the new hands embedded while returning 0.
// Retain the original explicit hip-frame palm targets and orientation; validate
// their reach and actual new-mesh contact instead of applying that failed search.
import base from './h-side-leg-raise-r3.js';
const spec = structuredClone(base);
delete spec.pose.base.hands.left.touch;
delete spec.pose.base.hands.right.touch;
export default { ...spec, id: 'h-side-leg-raise-r4' };
