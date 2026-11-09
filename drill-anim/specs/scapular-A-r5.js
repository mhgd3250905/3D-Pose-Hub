// scapular-A-r5 (elbow-twist r2, 2026-11-09): reverts scapular-A-r4. r4 thinned the wrist (forearm+hand mesh wrist slice
// left 0.88 -> 0.76, right 0.99 -> 0.73; hand-vs-forearm twist 70/75 deg). The pose goes back to the pre-fix
// scapular-A-r2-gc1-et1 unchanged (user-approved 2026-11-09 21:54); the palm orientation will be redone after the ROM spec is confirmed.
import base from './scapular-A-r2-gc1-et1.js';
const s = structuredClone(base);
s.id = 'scapular-A-r5';
export default s;
