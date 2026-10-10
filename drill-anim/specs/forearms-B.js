import { gripAttach, G as GRIP } from '../lib/grip.mjs';
// the baked fist spans -54..+99 mm along its grip axis (probe): the dumbbell slides +22 mm along the axis to centre it, and is
// 0.32 m long so both plates clear the fist (~10 mm each side)
const DBA = gripAttach('right'), DBO = DBA.offset.map((x, i) => +(x + 0.022 * GRIP.right.a[i]).toFixed(4));
// forearms-B 哑铃腕屈 + 腕伸 (seated dumbbell wrist curl + extension), right hand. Seated on a flat bench, feet flat, torso
// leaning forward; the right forearm rests along the right thigh, palm up, the wrist just past the knee, a light dumbbell held
// in the right hand. 'curl' bends the wrist up (flexion ~55 deg, forearm flexors), then the hand lowers past neutral into
// extension (~45 deg) under control; the forearm never leaves the thigh. The left hand rests on the left knee.
// v2 (Hark self-QA): v1's forearm floated ~10 cm above the thigh and the left hand ~10 cm above the knee. Now the torso leans
// 66 deg (was 38), the right wrist sits just past the knee at [-0.11, 0.518, 0.46] and a world elbow pole straight below the thigh
// puts the forearm ON the thigh (nearest-vertex gap ~4 mm); the left hand rests on the left knee (touch, 1.6 mm). Closed fist on the
// dumbbell (gripHand + gripAttach).
// 2 reps / 8 s. Head +Y, front +Z, body left = +X (world coordinates for the hands; the body is static).
const W = [-0.11, 0.518, 0.46];                         // right wrist, just past the knee
const fa = a => { const r = a * Math.PI / 180; return [0, +Math.sin(r).toFixed(4), +Math.cos(r).toFixed(4)]; };   // fingers
const na = a => { const r = a * Math.PI / 180; return [0, +Math.cos(r).toFixed(4), +(-Math.sin(r)).toFixed(4)]; }; // palm normal (up at 0)
const AF = 55, AE = -45;
// wrist angle track: neutral -> flex (1.0 s) -> hold 0.4 -> lower to extension (1.6 s) -> back to neutral (1.0 s)
const K = [[0, 0], [0.4, 0], [1.4, AF], [1.8, AF], [3.4, AE], [3.6, AE], [4.0, 0]];
const ease = u => (1 - Math.cos(Math.PI * u)) / 2;
const aAt = t => { const r = t % 4; for (let i = 0; i < K.length - 1; i++) { const [ta, va] = K[i], [tb, vb] = K[i + 1]; if (r >= ta && r < tb) return va + (vb - va) * ease((r - ta) / (tb - ta)); } return 0; };
const TS = Array.from({ length: 240 }, (_, k) => k / 30);
// finger / normal are linear in (cos a, sin a): tracks c and s carry them exactly
const TC = TS.map(t => [+t.toFixed(4), +Math.cos(aAt(t) * Math.PI / 180).toFixed(5), 'linear']);
const TSN = TS.map(t => [+t.toFixed(4), +Math.sin(aAt(t) * Math.PI / 180).toFixed(5), 'linear']);
const PF = TS.map(t => [+t.toFixed(4), +Math.max(0, aAt(t) / AF).toFixed(5), 'linear']);
export default {
  id: 'forearms-B', name: '哑铃腕屈 + 腕伸', nameEn: 'Seated Dumbbell Wrist Curl + Extension',
  timeline: { duration: 8, tracks: { c: TC, s: TSN, flex: PF } },
  pose: {
    base: {
      pelvis: [0, 0.585, -0.03],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { body: [[[1, 0, 0], 66]] },
      hands: {
        right: { mode: 'free', frame: 'world', relax: 0, wrist: W, finger: [0, 0, 0], normal: [0, 0, 0], pole: [-0.11, 0.3, 0.2] },
        left: { mode: 'free', frame: 'world', wrist: [0.12, 0.57, 0.36], finger: [-0.05, -0.45, 1], normal: [0, -1, -0.3], poleUp: [0.45, 0.9, -0.1], touch: { clear: 0.002 } },
      },
      feet: {
        right: { mode: 'floor', at: [-0.15, 0.40], heading: -6, pitch: 0 },
        left: { mode: 'floor', at: [0.15, 0.40], heading: 6, pitch: 0 },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: {
      c: { hands: { right: { finger: [0, 0, 1], normal: [0, 1, 0] } } },
      s: { hands: { right: { finger: [0, 1, 0], normal: [0, 0, -1] } } },
      flex: {},
    },
  },
  highlight: { groups: ['forearms'], side: 'right', pulseTrack: 'flex', pulseBase: 0.35 },
  camera: { dir: [-1, 0.35, 0.55], fit: ['head', 'rightToe', 'leftToe', 'pelvis', 'rightPalm', 'rightKnee'], pad: 0.12, k: 1.0, drift: 2, at: 1.6 },
  frame: { mode: 'fit', width: 760, height: 800, cx: 580, cy: 545 },
  stillAt: 1.6,
  shadow: { joints: ['rightToe', 'leftToe', 'rightAnkle', 'leftAnkle', 'pelvis'], blobs: [{ j: 'rightAnkle', rx: 40, ry: 10, a: 0.6 }, { j: 'leftAnkle', rx: 40, ry: 10, a: 0.6 }], bands: [] },
  props: [
    { type: 'bench', at: [0, 0, -0.08], yaw: 0, length: 1.0, height: 0.44 },
    { type: 'gripHand', side: 'right' },
    // v2: closed power grip (fist baked by P.bakeGrip #23 / gripHand #82); the handle runs through the fist centre (lib/grip.mjs gripAttach)
    { type: 'dumbbell', length: 0.32, plate: 0.045, attach: 'rightHand', offset: DBO, rot: DBA.rot },
  ],
  keyFrames: [0.4, 1.6, 3.4],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [],
    allowContact: ['forearmR|thighR', 'handL|thighL', 'forearmL|thighL', 'forearmL|shinL'],
    touch: [{ side: 'left', when: 'always' }],   // v2: the left hand rests on the left knee (gap <= 4 mm)
  },
};
