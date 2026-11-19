// t-self-resisted-wrist-flexion 自阻力手腕上卷 (Self-Resisted Wrist Flexion) · Thomas supplement r2 (2026-11-19). Seated on a bench,
// leaning forward from the hips, right forearm resting on the right thigh, wrist just past the knee, palm up; the left palm presses on
// the right palm while the right wrist curls up (2.2 s), squeezes 0.8 s and lowers (3 s). Geometry, timing and contacts: _thomas-sup-wrist-r2.mjs;
// measurable standard: tools/thomas-sup/standards/t-self-resisted-wrist-flexion.md. Only the right side is animated (the App mirrors).
import { wristDrill } from './_thomas-sup-wrist-r2.mjs';
export default wristDrill('flex', 't-self-resisted-wrist-flexion', '自阻力手腕上卷', 'Self-Resisted Wrist Flexion', '6a', {
  pelvis: [0, 0.579, -0.03], hipTilt: 29, waistBend: 25, twist: -8, W: [-0.085, 0.543, 0.46], E: [-0.164, 0.617, 0.259], extDeg: 45, flexDeg: 70, closeUp: true,
  upperArmTwistR: 28.2, elbowTwistR: 115.0,
  upperArmTwistL: [[-45, -37.6], [-37.3, -36.9], [-31, -36.4], [-16.2, -35], [4.3, -32.5], [12.5, -31.2], [41.3, -24.6], [43.6, -23.9], [62.3, -16.7], [67.7, -14.2], [70, -13.1]],
  elbowTwistL: [[-45, -80.1], [-37.3, -84.7], [-31, -88.6], [-16.2, -98.2], [4.3, -112.8], [12.5, -119.1], [41.3, -141.5], [43.6, -143.2], [62.3, -154.6], [67.7, -156.9], [70, -157.7]],
  camera: { dir: [-1, 0.2, 0.05], fit: ['rightElbow', 'rightWrist', 'rightPalm', 'leftPalm', 'leftWrist', 'rightKnee'], pad: 0.1 },
});
// r5 (2026-11-19, 开哥批准继续修肘部「糖纸拧转」): the elbows are hinges. The hub default forearm rolls twisted the right elbow
// (static) and the left elbow (the pressing hand turns with the right hand, so its twist changed with the wrist angle) by 90-150 deg.
// Right: static upperArmTwistR / elbowTwistR; left: tables over the wrist angle a (opt-in in _thomas-sup-wrist-r2.mjs), fitted in two
// measured passes. Joints and hand world poses unchanged; pronation / supination spread along the forearms by the V5 twist helpers.
// Numbers: tools/thomas-sup/standards/t-self-resisted-wrist-flexion.md (r4 -> r5).
