// t-self-resisted-wrist-extension 自阻力手腕上抬 (Self-Resisted Wrist Extension) · Thomas supplement r2 (2026-11-19). Seated on a bench,
// leaning forward from the hips, right forearm resting on the right thigh, wrist just past the knee, palm down; the left palm presses on
// the back of the right hand while the right wrist lifts up (2.2 s), holds 0.8 s and lowers (3 s). Geometry, timing and contacts:
// _thomas-sup-wrist-r2.mjs; measurable standard: tools/thomas-sup/standards/t-self-resisted-wrist-extension.md. Only the right side is
// animated (the App mirrors).
import { wristDrill } from './_thomas-sup-wrist-r2.mjs';
export default wristDrill('ext', 't-self-resisted-wrist-extension', '自阻力手腕上抬', 'Self-Resisted Wrist Extension', '6b', {
  pelvis: [0, 0.579, -0.03], hipTilt: 29, waistBend: 25, twist: -8, W: [-0.085, 0.558, 0.46], E: [-0.165, 0.615, 0.254], flexDeg: 55, extDeg: 60, surf: 0.017, poleL: [0.6, 1.0, -0.1], closeUp: true,
  upperArmTwistR: 26.5, elbowTwistR: -58.7,
  upperArmTwistL: [[-55, -20.7], [-47.3, -21.3], [-41, -21.8], [-26.2, -22.5], [-5.7, -22.7], [2.5, -22.5], [31.3, -20.1], [33.6, -19.7], [52.3, -15.8], [57.7, -14.2], [60, -13.5]],
  elbowTwistL: [[-55, -59.4], [-47.3, -62.6], [-41, -65.5], [-26.2, -73], [-5.7, -85.3], [2.5, -90.9], [31.3, -114.3], [33.6, -116.4], [52.3, -133.8], [57.7, -138.6], [60, -140.6]],
  camera: { dir: [-1, 0.2, 0.05], fit: ['rightElbow', 'rightWrist', 'rightPalm', 'leftPalm', 'leftWrist', 'rightKnee'], pad: 0.1 },
});
// r5 (2026-11-19, 开哥批准继续修肘部「糖纸拧转」): the elbows are hinges. The hub default forearm rolls twisted the right elbow
// (static) and the left elbow (the pressing hand turns with the right hand, so its twist changed with the wrist angle) by 90-150 deg.
// Right: static upperArmTwistR / elbowTwistR; left: tables over the wrist angle a (opt-in in _thomas-sup-wrist-r2.mjs), fitted in two
// measured passes. Joints and hand world poses unchanged; pronation / supination spread along the forearms by the V5 twist helpers.
// Numbers: tools/thomas-sup/standards/t-self-resisted-wrist-extension.md (r4 -> r5).
