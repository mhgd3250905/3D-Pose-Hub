// h-chair-lat 扶椅背阔肌拉伸 (chair-supported lat stretch, standing hip hinge) · H 居家背部系列.
// Standing a long step behind a sturdy dining chair, both hands on the top of its backrest shoulder-width apart, arms straight.
// Hinge at the hips and walk the hips back so the trunk is about level with the floor, then let the chest sink between the arms
// and push the hips back further: the stretch runs from the armpits down the sides of the back. Knees soft, back long, neck
// in line. Ease up a little and sink again. 8 s loop: 2.2 s sink, 2.4 s hold with a breath, 2 s ease, 1.4 s rest.
// Facing +Z (toward the chair), head up (+Y), body left = +X. No solver: hands are fixed on the rail; the hip hinge LEAN drives the
// trunk and the pelvis slides along Z so the shoulder->wrist distance stays at REACH (arms straight).
import { REST, restPtW, r4 } from '../lib/ss-geo.mjs';
import { build, keys } from '../lib/home-anim.mjs';
const DUR = 8, L0 = 78, L1 = 90, PY0 = 0.830, PY1 = 0.822, REACH = 0.484, HX = 0.2, CZ = 0.62, RAILY = 0.87;
const RAILZ = CZ - 0.183, WY = RAILY + 0.018, WZ = RAILZ - 0.03;
const p = keys([[0, 0], [0.4, 0], [2.6, 1], [5.0, 1], [7.0, 0.15], [8, 0]], DUR);
const lean = t => L0 + (L1 - L0) * p(t);
const hipsAt = a => ({ up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], a]] });
const pelvisAt = t => { const a = lean(t), py = PY0 + (PY1 - PY0) * p(t);
  const S = restPtW(hipsAt(a), [0, py, 0], REST.shoulder('left'));
  const dx = HX - S[0], dy = WY - S[1]; const dz = Math.sqrt(Math.max(0, REACH * REACH - dx * dx - dy * dy));
  return r4([0, py, WZ - dz - S[2]]); };
const railHand = s => ({ mode: 'free', frame: 'world', wrist: [s * HX, WY, WZ], finger: [0, -0.2, 1], normal: [0, -1, 0.15], poleUp: [s * 0.4, 1.6, 0.4] });
const P = build(DUR, {
  pelvis: pelvisAt,
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], lean]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: railHand(1), right: railHand(-1) },
  feet: {
    left: { mode: 'floor', at: [0.12, -0.47], heading: 4, pitch: 0, pole: [0.2, 0.5, 0.6] },
    right: { mode: 'floor', at: [-0.12, -0.47], heading: -4, pitch: 0, pole: [-0.2, 0.5, 0.6] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { sink: p });
export default {
  id: 'h-chair-lat', name: '扶椅背阔肌拉伸', nameEn: 'Chair-Supported Lat Stretch',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['lats'], side: 'both', pulseTrack: 'sink', pulseBase: 0.35 },
  camera: { dir: [1, 0.35, 0.2], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'leftPalm', 'rightPalm', 'leftElbow'], pad: 0.14, k: 0.95, drift: 3, at: 3.6 },
  frame: { mode: 'fit', width: 860, height: 760, cx: 512, cy: 520 },
  stillAt: 3.6,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'chair', at: [0, 0, CZ], yaw: 0, height: 0.45, width: 0.44, depth: 0.42 }],
  keyFrames: [0.2, 1.5, 3.6],
  qa: {
    pins: [{ c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.left', min: 166 }, { j: 'elbow.right', min: 166 }],
    allowContact: [],
  },
};
