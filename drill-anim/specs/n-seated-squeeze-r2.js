// n-seated-squeeze r2 (2026-10-30, review #6): the yoga block between the knees was a 'mat' prop and got stripped by
// output.exerciseMat:false, so no block showed. It is now marked required, and widened to the measured inner-knee gap
// (knee centres x = +-0.134 m, ~0.05 m knee half-width -> 0.16 m block) so both knees press on it. Everything else unchanged.
import prior from './n-seated-squeeze.js';
const spec = structuredClone(prior);
spec.id = 'n-seated-squeeze-r2';
spec.props = spec.props.map(p => p.type === 'mat' ? {...p, at: [0, 0.545, 0.40], size: [0.18, 0.14, 0.10], required: true, role: 'yoga-block'} : p);
export default spec;
