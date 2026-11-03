// obliques-B r2 (2026-10-31): obliques-B is the same banded Pallof press as h-band-pallof (h-band-pallof was remade from it), so
// r2 reuses the user-approved h-band-pallof-r2 set-up whole: both frozen fists stacked on one D-handle (stackSep), left fist
// rolled ROLL_L -85 deg about the shaft (no wrist kink), press end W1 [-0.062, 1.29, 0.457]. Only the id and obliques-B's own
// camera direction differ; drift 0 (fixed camera).
import pallof from './h-band-pallof-r2.js';
export default { ...pallof, id: 'obliques-B-r2', revisionOf: 'obliques-B',
  camera: { ...pallof.camera, dir: [0.45, 0.15, 1], drift: 0 } };
