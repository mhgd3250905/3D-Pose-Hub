// t-self-resisted-wrist-flexion 自阻力手腕上卷 (Self-Resisted Wrist Flexion) · Thomas supplement r2 (2026-11-19). Seated on a bench,
// leaning forward from the hips, right forearm resting on the right thigh, wrist just past the knee, palm up; the left palm presses on
// the right palm while the right wrist curls up (2.2 s), squeezes 0.8 s and lowers (3 s). Geometry, timing and contacts: _thomas-sup-wrist-r2.mjs;
// measurable standard: tools/thomas-sup/standards/t-self-resisted-wrist-flexion.md. Only the right side is animated (the App mirrors).
import { wristDrill } from './_thomas-sup-wrist-r2.mjs';
export default wristDrill('flex', 't-self-resisted-wrist-flexion', '自阻力手腕上卷', 'Self-Resisted Wrist Flexion', '6a', {
  pelvis: [0, 0.579, -0.03], hipTilt: 29, waistBend: 25, twist: -8, W: [-0.085, 0.543, 0.46], E: [-0.164, 0.617, 0.259], extDeg: 45, flexDeg: 70, closeUp: true,
  camera: { dir: [-1, 0.2, 0.05], fit: ['rightElbow', 'rightWrist', 'rightPalm', 'leftPalm', 'leftWrist', 'rightKnee'], pad: 0.1 },
});
