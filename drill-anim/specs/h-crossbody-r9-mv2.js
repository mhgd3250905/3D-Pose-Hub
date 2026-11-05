// h-crossbody-r9-mv2 (pose-fix r2, 2026-11-05; user picked option C for the mv1 rest-frame overlap): mv1 draws the right
// arm 5->38 deg across the chest (33 deg range), but its left hand kept the arm contact the whole loop, so in the 1 s rest
// with the arm almost straight ahead the left forearm was wrapped through the chest (left hand->chest 73 mm).
// mv2: the left arm hangs relaxed at the side during the rest (t 7.4-8, 0-0.6 s), comes up while the right arm crosses and
// catches the right upper arm (contact reached at 1.6 s, before the 2.4 s hold), presses through the hold exactly as mv1,
// and lets go / lowers during the ease (5.6-6.8 s). The path to the arm bows forward of the belly. Right arm, hold
// contact, timing, camera, highlight unchanged.
import base from './h-crossbody-r9-mv1.js';
const s = structuredClone(base);
s.id = 'h-crossbody-r9-mv2';
const ss = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const UP0 = 0.6, UP1 = 1.6, DN0 = 5.6, DN1 = 6.8;
export const grip = t => t < UP0 ? 0 : t < UP1 ? ss((t - UP0) / (UP1 - UP0)) : t < DN0 ? 1 : t < DN1 ? 1 - ss((t - DN0) / (DN1 - DN0)) : 0;
// relaxed hang (world): left shoulder [0.188,1.370,-0.004], wrist 0.465 m below-out-front, palm toward the thigh
const HANG = { wrist: [0.228, 0.91, 0.03], finger: [0.06, -1, 0.04], normal: [0.1, 0, -1] };   // palm turned back (pronated) so the catch rotates the hand the short way
const nz = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
const tr = s.timeline.tracks, key = (f, i) => 'contact_' + f + i;
const times = tr[key('wrist', 0)].map(r => r[0]);
const val = (f, i, k) => tr[key(f, i)][k][1];
for (let k = 0; k < times.length; k++) {
  const t = times[k], g = grip(t); if (g >= 1) continue;
  const W = [0, 1, 2].map(i => val('wrist', i, k)), F = [0, 1, 2].map(i => val('finger', i, k)), N = [0, 1, 2].map(i => val('normal', i, k));
  const bow = 0.10 * Math.sin(Math.PI * g);
  const w = W.map((x, i) => HANG.wrist[i] + (x - HANG.wrist[i]) * g + (i === 2 ? bow : 0));
  const f = nz(nz(HANG.finger).map((x, i) => x + (F[i] - x) * g));
  let n = nz(HANG.normal).map((x, i) => x + (N[i] - x) * g); const d = n[0] * f[0] + n[1] * f[1] + n[2] * f[2]; n = nz(n.map((x, i) => x - d * f[i]));
  for (let i = 0; i < 3; i++) { tr[key('wrist', i)][k][1] = +w[i].toFixed(6); tr[key('finger', i)][k][1] = +f[i].toFixed(6); tr[key('normal', i)][k][1] = +n[i].toFixed(6); }
}
s.contactCalibration = { ...base.contactCalibration, leftHandReleaseMv2: { hang: HANG, up: [UP0, UP1], down: [DN0, DN1] } };
export default s;
