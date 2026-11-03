// chest-C r2 (2026-10-31): on the frozen-fist D-handle the dorsal bias (lean 0.6) swung the loop to the medial side, so the
// cable ran inside the arm (user review). The loop now points at a lateral anchor (far right of the body, lean 0): the
// carabiner sits on the outer side of the fist and the cable to the pulley (outside the right shoulder) runs outside the arm.
import source from './chest-C.js';
const spec = structuredClone(source); spec.id = 'chest-C-r2'; spec.revisionOf = source.id;
const i = spec.props.findIndex(p => p.type === 'dHandle');
spec.props[i] = { ...spec.props[i], toward: 'outside', lean: 0 };
spec.props.splice(i, 0, { type: 'anchor', name: 'outside', at: [-1.5, 1.15, 0.0] });
export default spec;
