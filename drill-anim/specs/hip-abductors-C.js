// hip-abductors-C 器械髋外展 (seated machine hip abduction). Seated tall on a hip-abductor machine (back pad, torso reclined 8 deg),
// thighs level, knees at 90 deg, feet on the footrests, pads on the outside of both knees. 'abd' drives the ankle yaw about the vertical
// axis through each hip from 8 to 35 deg; measured true hip abduction (QA hip_abd) is ~7 deg -> ~29 deg each side, i.e. ~22 deg of travel
// per side, 0.8 s squeeze. Knees and feet travel on exact circles (chord + per-frame offX/offZ tracks).
// Both hands grip the side handles (geometry-free 'grip' prop from #23 = baked power grip; the handle bars run along Z, so the wrist
// targets slide with the handles). Handles sit behind the hips (z -0.373..-0.093) so the arms reach back and the left-side camera sees
// the glute medius (upper outer hip) unblocked.
// 2 reps / 8 s: 1.2 s out, 0.8 s hold, 1.2 s in, 0.8 s pause. Head points +Y, front faces +Z, body left = +X.
const DEG = Math.PI / 180;
const TH = 0.35292, SH = 0.40981;
const HIP = { right: [-0.0815, 0.5722, 0.0221], left: [0.0815, 0.5722, 0.0221] };   // measured in this pose
const P0 = 8, P1 = 35;
const ank = (side, psi) => { const h = HIP[side], sg = side === 'left' ? 1 : -1, r = psi * DEG, d = Math.sqrt(TH * TH - 0.012 * 0.012);
  return [+(h[0] + sg * d * Math.sin(r)).toFixed(5), +(h[1] - 0.012 - SH).toFixed(5), +(h[2] + d * Math.cos(r)).toFixed(5)]; };
const cosE = u => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, u)))) / 2;
const qAt = t => { const r = t % 4; return r < 0.4 ? 0 : r < 1.6 ? cosE((r - 0.4) / 1.2) : r < 2.4 ? 1 : r < 3.6 ? 1 - cosE((r - 2.4) / 1.2) : 0; };
// both sides mirror each other: offX is applied with opposite signs through the deltas (+1 m on the left ankle, -1 m on the right)
const KEYS = { abd: [], offX: [], offZ: [] };
const L0 = ank('left', P0), L1 = ank('left', P1);
for (let f = 0; f < 240; f++) { const t = f / 30, q = qAt(t), A = ank('left', P0 + (P1 - P0) * q);
  KEYS.abd.push([t, +q.toFixed(5), 'linear']);
  KEYS.offX.push([t, +(A[0] - (L0[0] + q * (L1[0] - L0[0]))).toFixed(5), 'linear']);
  KEYS.offZ.push([t, +(A[2] - (L0[2] + q * (L1[2] - L0[2]))).toFixed(5), 'linear']); }
const foot = (side, psi) => { const sg = side === 'left' ? 1 : -1, a = ank(side, psi); return { mode: 'free', frame: 'world', ankle: a, rot: [[[0, 1, 0], sg * psi]],
  pole: [+(a[0] + sg * 0.15 * Math.sin(psi * DEG)).toFixed(4), 0.95, +(a[2] + 0.3).toFixed(4)] }; };
const shift = (side, i, k) => { const a = ank(side, P0); a[i] += k; return { ankle: a }; };
export default {
  id: 'hip-abductors-C', name: '器械髋外展', nameEn: 'Seated Machine Hip Abduction',
  timeline: { duration: 8, tracks: KEYS },
  pose: {
    base: {
      pelvis: [0, 0.62, 0.02],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], -8]] },
      hands: {
        right: { mode: 'free', frame: 'world', relax: 0, wrist: [-0.3141, 0.6712, -0.25], finger: [-0.1375, -0.9456, 0.295], normal: [0.9844, -0.0974, 0.1467], pole: [-0.6, 0.9, -0.4] },
        left: { mode: 'free', frame: 'world', relax: 0, wrist: [0.3141, 0.6712, -0.25], finger: [0.1375, -0.9456, 0.295], normal: [-0.9844, -0.0974, 0.1467], pole: [0.6, 0.9, -0.4] },
      },
      feet: { right: foot('right', P0), left: foot('left', P0) },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: {
      abd: { feet: { right: foot('right', P1), left: foot('left', P1) } },
      offX: { feet: { right: shift('right', 0, -1), left: shift('left', 0, 1) } },
      offZ: { feet: { right: shift('right', 2, 1), left: shift('left', 2, 1) } },
    },
  },
  highlight: { groups: ['hip-abductors'], side: 'both', pulseTrack: 'abd', pulseBase: 0.3 },
  camera: { dir: [1, 0.35, 0.45], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'leftKnee'], pad: 0.18, k: 1.0, drift: 0.9, at: 1.6 },
  frame: { mode: 'fit', width: 520, height: 600, cx: 430, cy: 560 },
  stillAt: 1.6,
  shadow: { joints: ['pelvis'], blobs: [], bands: [] },
  props: [{ type: 'hipAbductor', seatY: 0.481, seatZ: [-0.16, 0.26], back: { y: 1.0, z: -0.153, tilt: 8, h: 0.66 }, handles: { x: 0.29, y: 0.575, z: [-0.373, -0.093] }, padUp: 0.09, gap: 0.003 },
    { type: 'grip', side: 'right' }, { type: 'grip', side: 'left' }],
  keyFrames: [0.4, 1.6, 3.0],
  qa: { pins: [], straight: [], allowContact: [] },
};
