// t-self-resisted-wrist-extension 自阻力手腕上抬 (Self-Resisted Wrist Extension) · Thomas supplement r2 (2026-11-19). Seated on a bench,
// leaning forward from the hips, right forearm resting on the right thigh, wrist just past the knee, palm down; the left palm presses on
// the back of the right hand while the right wrist lifts up (2.2 s), holds 0.8 s and lowers (3 s). Geometry, timing and contacts:
// _thomas-sup-wrist-r2.mjs; measurable standard: tools/thomas-sup/standards/t-self-resisted-wrist-extension.md. Only the right side is
// animated (the App mirrors).
import { wristDrill } from './_thomas-sup-wrist-r2.mjs';
export default wristDrill('ext', 't-self-resisted-wrist-extension', '自阻力手腕上抬', 'Self-Resisted Wrist Extension', '6b', {
  pelvis: [0, 0.579, -0.03], hipTilt: 29, waistBend: 25, twist: -8, W: [-0.085, 0.558, 0.46], E: [-0.165, 0.615, 0.254], flexDeg: 55, extDeg: 60, surf: 0.017, poleL: [0.6, 1.0, -0.1], closeUp: true,
  camera: { dir: [-1, 0.2, 0.05], fit: ['rightElbow', 'rightWrist', 'rightPalm', 'leftPalm', 'leftWrist', 'rightKnee'], pad: 0.1 },
});
