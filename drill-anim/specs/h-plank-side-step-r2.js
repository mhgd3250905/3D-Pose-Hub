// h-plank-side-step r2 (2026-10-30, review #9): the spec's own 0.6 m hand mat blocked the recipe's full-body mat, so the feet
// tapped out on the bare floor. The hand-only mat is dropped; the recipe matProp (1.65 x 0.94 m, hands to toes, both tap
// positions inside) is used instead. Motion unchanged.
import prior from './h-plank-side-step.js';
const spec = structuredClone(prior);
spec.id = 'h-plank-side-step-r2';
spec.props = (spec.props || []).filter(p => p.type !== 'mat');
export default spec;
