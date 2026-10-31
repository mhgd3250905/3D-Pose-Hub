// serratus-C r2 (2026-10-31): ring push-up plus on the frozen fist. Same motion, rings and timing as serratus-C; the recipe
// switches both hands to bar-grasp (fixed-bar-grip-r1, now also accepting the rings prop) with explicit bars: the frozen 32 mm
// fist shaft lies on each ring's gripped lower section (grip [0, GY, +-RZ], tangent along X, thumb toward the head), same
// neutral-grip convention as the approved parallette push-up chest-B. Fixed camera (drift 0).
// Top arm reach 178.5 -> 175 deg and the plus 3 -> 2 cm: with the frozen fist's wrist further from the ring, the 3 cm scapular "plus" at lock-out
// over-reached and the solver clamped both wrists (warning at t 3.2).
import base from './serratus-C.js';
const b = base.pose.base, TOP = 175, SCAP = 0.02;
export default { ...base, id: 'serratus-C-r2', revisionOf: 'serratus-C', camera: { ...base.camera, drift: 0 },
  pose: { ...base.pose, deltas: { ...base.pose.deltas, scap: { shoulders: { shift: [0, 0, SCAP] } } }, base: { ...b, constraints: b.constraints.map((c, i) => i < 2 ? { ...c, angle: TOP } : c) } },
  qa: { ...base.qa, straight: base.qa.straight.map(s => s.j.startsWith('elbow') ? { ...s, min: 175 } : s) } };
