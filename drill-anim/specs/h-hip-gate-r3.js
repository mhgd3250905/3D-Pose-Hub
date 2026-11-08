// h-hip-gate-r3 (pose fix 2026-11-08, user review: at the top of the side swing the RIGHT hand on the hip keeps shaking).
// Measured on h-hip-gate-r2-sc1-et1-fa1 at 30 fps: the right hand used a per-frame touch solve (bisect along the palm normal onto the
// body surface); as the lifted right thigh moves next to the hip the nearest surface jumps, so the wrist jumped up to 33.7 mm in one frame
// around the peak (t 1.97-2.13 s and 5.87-5.93 s; 91 of 240 frames moved > 2 mm, the hip itself never moves). r3: the right hand is
// frozen at the rest-frame position the touch solve gives at t = 0 (wrist world [-0.1769, 1.0095, -0.0457], same finger / palm normal /
// pole; pelvis and hips are static in this spec, so world = hips frame), no touch solve -> 0 mm per-frame motion. Frozen there, the lifted
// right thigh ran up to 77 mm into the hand at the top (self-collision t 1.6-2.05 / 5.93), so the still hand now rests 65 mm higher and
// 14 mm further back on the side of the waist (wrist [-0.185, 1.075, -0.06]): 0 mm per-frame motion, no hand-thigh contact.
// Left hand (on the chair back): the target was 2.5 mm beyond the v3 arm reach (1 'wrist limited' warning on every frame); it moves
// 4 mm up / 35 mm along the backrest toward the body -> elbow ~170 deg, 0 warnings. Legs (fa1 foot follow), timing, chair, camera unchanged.
import base from './h-hip-gate-r2-sc1-et1-fa1.js';
const s = structuredClone(base);
s.id = 'h-hip-gate-r3';
const R = s.pose.base.hands.right;
s.pose.base.hands.right = { mode: 'free', frame: 'world', wrist: [-0.185, 1.075, -0.06], finger: R.finger, normal: R.normal, poleUp: R.poleUp, ...(R.elbowTwist !== undefined ? { elbowTwist: R.elbowTwist } : {}) };
s.pose.base.hands.left.wrist = [0.352, 0.909, -0.005];
if (s.qa) s.qa = { ...s.qa, touch: [] };
export default s;
