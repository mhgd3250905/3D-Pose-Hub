// t-seated-forearm-rotation 坐姿哑铃翻手腕 (Seated Forearm Pronation-Supination) · Thomas supplement r2 (2026-11-19). Seated on a bench,
// leaning forward from the hips, right forearm resting on the right thigh, wrist just past the knee, a light dumbbell held near one end;
// the forearm stays on the thigh and turns the palm from up to down (2.8 s) and back (3.2 s) about the forearm axis; the left hand rests
// on the left thigh. Geometry, timing and contacts: _thomas-sup-wrist-r2.mjs; measurable standard:
// tools/thomas-sup/standards/t-seated-forearm-rotation.md. Only the right side is animated (the App mirrors).
import { wristDrill } from './_thomas-sup-wrist-r2.mjs';
import { gripAttach } from '../lib/grip.mjs';
const spec = wristDrill('rot', 't-seated-forearm-rotation', '坐姿哑铃翻手腕', 'Seated Forearm Pronation-Supination', '7', {
  pelvis: [0, 0.579, -0.03], hipTilt: 29, waistBend: 25, twist: 0, W: [-0.085, 0.57, 0.463], E: [-0.165, 0.62, 0.257], supDeg: 80, proDeg: 80, rollShare: 0, elbowTwistR: 130.1, upperArmTwistR: 29.3, closeUp: true,
  restL: { wrist: [0.11, 0.607, 0.26], finger: [-0.05, -0.35, 1], normal: [0, -1, -0.3] }, poleL: [0.6, 1.0, -0.1],
  camera: { dir: [-0.35, 0.45, 1], fit: ['rightElbow', 'rightWrist', 'rightPalm', 'rightKnee'], pad: 0.12 },
});
// r3 (2026-11-19, 开哥「抓握的都可以用专门的抓握手模」): the right hand holds the dumbbell with the hub's accepted fixed dumbbell fist
// (recipe hands dumbbell-grasp on both sides, the only one-dumbbell form the recipe rules allow, with fixedDumbbellsHidden ['left'] as
// h-db-overhead-triceps-extension); V5 draws that fist on the right (v5.hubGraspHands, tools/v5/runtime/v5-hub.js) and its own open
// hand on the left, which rests on the left thigh. The fist and its dumbbell are one rigid piece on the hand bone, so the dumbbell turns
// with the forearm. Source dumbbells (one per hand, required by dumbbell-grasp and replaced by the fixed one): handle across the fist.
// r2 drew an open V5 hand with fingers bent onto a one-ended dumbbell (v5.grip), replaced here.
spec.props.push({ type: 'dumbbell', length: 0.28, plate: 0.045, attach: 'rightHand', ...gripAttach('right') },
  { type: 'dumbbell', length: 0.28, plate: 0.045, attach: 'leftHand', ...gripAttach('left') });
spec.v5 = { ...spec.v5, hubGraspHands: ['right'] };
// r4 (2026-11-19, 开哥「小臂弯折有问题，感觉拧着了」): the elbow is a hinge. r3 rolled the forearm bone with the turn (rollShare 0.3,
// elbowTwist -180 + 0.3q) on top of a hub IK default that already left it 101 deg rolled against the upper arm at palm up (53 deg at
// palm down), and the upper arm sat 29 deg off the bend plane (the forearm folded sideways from the elbow pit): the elbow skin turned
// 28-50 deg and pinched to 0.64. r4: the upper arm turns about its own axis by upperArmTwistR so the elbow pit faces the bend (pit
// 0.6 deg), the forearm bone keeps a constant roll that cancels the elbow twist (elbowTwistR, rollShare 0: 0.0 deg all cycle), and the
// whole pronation / supination is the hand-vs-forearm twist the V5 forearm twist helpers spread along the forearm (+75 ... -85 deg,
// 0 at the elbow). W / E 5 mm up and 3 mm forward keep the forearm on the thigh (-3.2 ... -1.4 mm) and the dumbbell off the shin (12 mm).
// Numbers: tools/thomas-sup/standards/t-seated-forearm-rotation.md (r3 -> r4).
export default spec;
