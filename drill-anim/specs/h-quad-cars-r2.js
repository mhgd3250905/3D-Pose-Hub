// h-quad-cars-r2 四足髋关节画圈 · HipLab media fix 2026-10-17 (issue 8: highlight broke into floating fragments).
// Revision of h-quad-cars (original spec, its SHA and published media unchanged). Motion, camera and timing are identical;
// only the highlight selection changes.
// Why: on the training-human-v2 body the muscle-map coordinates (mmRest) of the shorts are distorted around the hip:
// vertices skinned to the thigh bone land ~0.26 m higher and in front of their true place in muscle-map space, so the
// 'glute-max' (glutes) + 'hip-abductors' (gluteMed) request only won two jagged slivers of the buttock (the rest of the
// buttock scores as 'oblique'). The fix that would make every glute highlight clean is in the frozen human sources
// (page/posedlib.js / toon.js, part of models/training-human-v2.json), so it needs a new human version, not this spec.
// Here we select the panels that actually cover the right buttock on this body in this pose: glutes + gluteMed + oblique,
// right side only, with a wider soft edge (inset 0.08) so the panel seams do not read as cracks. Target muscles of hip
// CARs: gluteus maximus / medius and the deep hip rotators (shown as the buttock), matching the label to be shown.
import base from './h-quad-cars.js';
export default {
  ...base,
  id: 'h-quad-cars-r2',
  highlight: { ...base.highlight, groups: [], panels: ['glutes', 'gluteMed', 'oblique'], side: 'right', inset: 0.08 },
};
