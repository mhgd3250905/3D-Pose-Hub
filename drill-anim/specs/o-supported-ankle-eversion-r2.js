// r2 (user OK 2026-10-30 23:36): eversion 15 -> 20 deg (still within normal active range) and a front-ish camera;
// the r1 camera looked along the roll axis so the sole turning out was hard to read.
import source from './o-supported-ankle-eversion.js';
const spec = structuredClone(source); spec.id = 'o-supported-ankle-eversion-r2'; spec.revisionOf = source.id;
const k = spec.timeline.tracks.k0; spec.timeline.tracks.k0 = k.map(([t, v, ...r]) => [t, v * 20 / 15, ...r]);
spec.camera = { ...spec.camera, dir: [-0.25, 0.15, 1] };
export default spec;
