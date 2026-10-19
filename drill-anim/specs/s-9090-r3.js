// s-9090-r3 90/90 坐姿换髋 · camera-only revision of s-9090-r2 (review 2026-10-19).
// The published camera looked straight down from above, so the 90/90 knee angles, the forward fold and the glute
// highlight could not be read. Pose, timeline, feet and highlight are exactly s-9090-r2; only camera.dir changes to a
// front-left high three-quarter view (front shin toward the camera side).
import base from './s-9090-r2.js';
const spec = structuredClone(base);
spec.camera = { ...spec.camera, dir: [0.55, 0.7, 0.8] };
export default { ...spec, id: 's-9090-r3' };
