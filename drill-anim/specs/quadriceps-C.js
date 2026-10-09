// quadriceps-C 器械腿屈伸（顶端锁直） (machine leg extension, lock out at the top). Seated on a leg-extension machine, back on the
// pad (torso reclined 8 deg), thighs level on the seat, knees at the machine pivot, the roller pad on the front of both lower shins.
// 'ext' 0 = knees at 90 deg (shins vertical), 1 = knees locked straight (>=176 deg), 1 s squeeze. Hands rest on the side handles.
// The shins swing on exact arcs about the knees (chord + per-frame offY/offZ tracks).
// 2 reps / 8 s: 1.2 s up, 0.8 s hold, 1.2 s down, 0.8 s pause. Head points +Y, front faces +Z, body left = +X.
const DEG = Math.PI / 180;
const TH = 0.35292, SH = 0.40981;
const M = { hipR: [-0.0815, 0.5722, 0.0221], hipL: [0.0815, 0.5722, 0.0221] };   // hip joints in this pose (measured, probes/rest-like)
const K = h => [h[0], h[1] - 0.012, h[2] + Math.sqrt(TH * TH - 0.012 * 0.012)];  // knee: thigh level, 1.2 cm drop
const B0 = 90, B1 = 2.2;                                                         // shin angle below horizontal: 90 = vertical, 2.2 = knee 177.8 deg
const ank = (h, b) => { const k = K(h), r = b * DEG; return [k[0], +(k[1] - SH * Math.sin(r)).toFixed(5), +(k[2] + SH * Math.cos(r)).toFixed(5)]; };
const cosE = u => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, u)))) / 2;
const qAt = t => { const r = t % 4; return r < 0.4 ? 0 : r < 1.6 ? cosE((r - 0.4) / 1.2) : r < 2.4 ? 1 : r < 3.6 ? 1 - cosE((r - 2.4) / 1.2) : 0; };
const A0 = ank(M.hipR, B0), A1 = ank(M.hipR, B1);
const KEYS = { ext: [], offY: [], offZ: [] };
for (let f = 0; f < 240; f++) { const t = f / 30, q = qAt(t), A = ank(M.hipR, B0 + (B1 - B0) * q);
  KEYS.ext.push([t, +q.toFixed(5), 'linear']);
  KEYS.offY.push([t, +(A[1] - (A0[1] + q * (A1[1] - A0[1]))).toFixed(5), 'linear']);
  KEYS.offZ.push([t, +(A[2] - (A0[2] + q * (A1[2] - A0[2]))).toFixed(5), 'linear']); }
const foot = (h, b, side) => ({ mode: 'free', frame: 'world', ankle: ank(h, b), rot: [[[1, 0, 0], b - 90]], pole: [h[0] * 1.2, K(h)[1] + 0.4, K(h)[2] + 0.15] });
const off = (h, i) => { const a = ank(h, B0); a[i] += 1; return a; };
export default {
  id: 'quadriceps-C', name: '器械腿屈伸（顶端锁直）', nameEn: 'Machine Leg Extension (Lockout)',
  timeline: { duration: 8, tracks: KEYS },
  pose: {
    base: {
      pelvis: [0, 0.62, 0.02],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], -8]] },
      hands: {
        right: { mode: 'free', frame: 'world', wrist: [-0.25, 0.635, 0.08], finger: [-0.05, -0.35, 1], normal: [0.1, -1, 0.1], pole: [-0.5, 0.75, -0.3] },
        left: { mode: 'free', frame: 'world', wrist: [0.25, 0.635, 0.08], finger: [0.05, -0.35, 1], normal: [-0.1, -1, 0.1], pole: [0.5, 0.75, -0.3] },
      },
      feet: { right: foot(M.hipR, B0, 'right'), left: foot(M.hipL, B0, 'left') },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: {
      ext: { feet: { right: { ankle: ank(M.hipR, B1), rot: [[[1, 0, 0], B1 - 90]] }, left: { ankle: ank(M.hipL, B1), rot: [[[1, 0, 0], B1 - 90]] } } },
      offY: { feet: { right: { ankle: off(M.hipR, 1) }, left: { ankle: off(M.hipL, 1) } } },
      offZ: { feet: { right: { ankle: off(M.hipR, 2) }, left: { ankle: off(M.hipL, 2) } } },
    },
  },
  highlight: { groups: ['quadriceps'], side: 'both', pulseTrack: 'ext', pulseBase: 0.3 },
  camera: { dir: [-1, 0.15, 0.32], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'rightAnkle'], pad: 0.18, k: 1.0, drift: 0.9, at: 1.6 },
  frame: { mode: 'fit', width: 420, height: 450, cx: 650, cy: 460 },
  stillAt: 1.6,
  shadow: { joints: ['pelvis'], blobs: [], bands: [] },
  props: [{ type: 'legExtension', seatY: 0.481, seatZ: [-0.16, 0.26], back: { y: 1.0, z: -0.153, tilt: 8, h: 0.66 }, handles: { x: 0.25, y: 0.514, z: [-0.02, 0.26] }, rollerUp: 0.09, rollerR: 0.045, gap: -0.001, armX: -0.25 }],
  keyFrames: [0.4, 1.6, 3.0],
  qa: {
    pins: [],
    straight: [{ j: 'knee.right', min: 176, when: 'params.ext>0.999' }, { j: 'knee.left', min: 176, when: 'params.ext>0.999' }],
    allowContact: [],
  },
};
