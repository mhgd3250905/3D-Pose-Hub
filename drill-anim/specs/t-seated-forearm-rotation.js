// t-seated-forearm-rotation 坐姿哑铃翻手腕 (Seated Forearm Pronation-Supination) · Thomas supplement r2 (2026-11-19). Seated on a bench,
// leaning forward from the hips, right forearm resting on the right thigh, wrist just past the knee, a light dumbbell held near one end;
// the forearm stays on the thigh and turns the palm from up to down (2.8 s) and back (3.2 s) about the forearm axis; the left hand rests
// on the left thigh. Geometry, timing and contacts: _thomas-sup-wrist-r2.mjs; measurable standard:
// tools/thomas-sup/standards/t-seated-forearm-rotation.md. Only the right side is animated (the App mirrors).
import { wristDrill } from './_thomas-sup-wrist-r2.mjs';
const spec = wristDrill('rot', 't-seated-forearm-rotation', '坐姿哑铃翻手腕', 'Seated Forearm Pronation-Supination', '7', {
  pelvis: [0, 0.579, -0.03], hipTilt: 29, waistBend: 25, twist: 0, W: [-0.085, 0.565, 0.46], E: [-0.165, 0.615, 0.254], supDeg: 80, proDeg: 80, rollShare: 0.3, closeUp: true,
  restL: { wrist: [0.11, 0.585, 0.33], finger: [-0.05, -0.35, 1], normal: [0, -1, -0.3] }, poleL: [0.6, 1.0, -0.1],
  camera: { dir: [-0.35, 0.45, 1], fit: ['rightElbow', 'rightWrist', 'rightPalm', 'rightKnee'], pad: 0.12 },
});
// V5 grip (opt-in, tools/v5/runtime/v5-hub.js): right fingers + thumb wrapped round a 29 mm handle, one-ended dumbbell (head on the thumb side).
spec.v5 = { ...spec.v5, grip: { side: 'right', dumbbell: true } };
export default spec;
