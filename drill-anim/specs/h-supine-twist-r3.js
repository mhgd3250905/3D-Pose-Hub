// h-supine-twist-r3: camera-only revision of the published h-supine-twist-r2 (review 2026-10-19, movement-first camera).
// The overhead camera hid the 90-degree knee bend and the knee drop read as a flat slide; a high feet-end view
// shows knees bent 90 degrees, arms out on the mat and both knees dropping to each side. Pose and QA stay r2's.
import base from './h-supine-twist-r2.js';
const spec = structuredClone(base);
spec.camera = { ...spec.camera, dir: [0, 0.6, 0.8] };
export default { ...spec, id: 'h-supine-twist-r3' };
