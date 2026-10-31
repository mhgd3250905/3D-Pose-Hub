// h-band-chest-fly r2 (2026-10-31): frozen-fist D-handle. The dorsal bias (lean 1) put the loop along the forearm and the
// band lay on the arm at peak adduction. As in chest-C-r2 the loop points at a lateral anchor (lean 0), so the carabiner
// sits on the outer side of the fist and the band to the post (behind/outside the right shoulder) stays outside the arm.
import source from './h-band-chest-fly.js';
const spec = { ...source, props: source.props.map(p => ({ ...p })) }; spec.id = 'h-band-chest-fly-r2'; spec.revisionOf = source.id;
const i = spec.props.findIndex(p => p.type === 'dHandle');
spec.props[i] = { ...spec.props[i], toward: 'outside', lean: 0 };
spec.props.splice(i, 0, { type: 'anchor', name: 'outside', at: [-1.5, 1.2, 0.3] });
export default spec;
