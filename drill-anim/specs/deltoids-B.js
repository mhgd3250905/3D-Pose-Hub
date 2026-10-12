import { gripAttach, G as GRIP } from '../lib/grip.mjs';
// the baked fist spans -54..+99 mm along its grip axis (probe): the dumbbell slides +22 mm along the axis to centre it, and is
// 0.32 m long so both plates clear the fist (~10 mm each side)
const DBA = gripAttach('right'), DBO = DBA.offset.map((x, i) => +(x + 0.022 * GRIP.right.a[i]).toFixed(4));
// deltoids-B 哑铃土耳其起立（前半程：仰卧 → 肘撑 → 手撑坐起 → 高桥 → 原路返回）. Light dumbbell locked out over the right
// shoulder the whole time (arm vertical in world), left hand flat on the mat and pinned, right foot flat and pinned (knee bent),
// left leg straight with the heel pinned. Phases: 'elb' rolls onto the left forearm, 'sit' presses up onto the straight left arm
// (tall sit), 'brg' lifts the hips into the high bridge (reference pose). 1 rep / 12 s, reversed in the same timing.
// Supine frame: head -X, legs +X, up +Y, body left = -Z (same as abs-A / lats-A).
const DUR = 12;
const track = (a, b, c, d) => [[0, 0], [a, 0], [b, 1], [c, 1], [d, 0]];
const ELB = track(1.0, 2.6, 9.4, 11.0), SIT = track(2.6, 4.0, 8.0, 9.4), BRG = track(4.0, 5.4, 6.6, 8.0);
// absolute values per phase [supine, elbow, sit, bridge]; the three tracks are chained (each delta adds its step on top)
const PH = {
  pelvis: [[0.04, 0.12, -0.04], [0.06, 0.12, -0.07], [0.06, 0.12, -0.09], [0.16, 0.12, -0.10]],
  roll: [0, -40, -25, -20], pitch: [0, -35, -45, -15],
  wristR: [[-0.36, 0.66, 0.20], [-0.25, 1.11, -0.27], [-0.09, 1.08, -0.34], [-0.33, 1.07, -0.20]],
  armL: [165, 85, 178, 178], elbW: [0, 5, 0, 0], pelY: [0.136, 0.255, 0.158, 0.34], legW: [60, 45, 60, 60],
};
const add = (a, b, c) => Array.isArray(a) ? a.map((x, i) => add(x, b[i], c[i])) : +(a + b - c).toFixed(4);
const step = (k, i) => i === 1 ? PH[k][1] : add(PH[k][0], PH[k][i], PH[k][i - 1]);   // absolute at p=1 for chained deltas
const delta = i => ({
  pelvis: step('pelvis', i),
  hips: { rot: [[[1, 0, 0], step('roll', i)], [[0, 0, 1], step('pitch', i)]] },
  hands: { right: { wrist: step('wristR', i) } },
  constraints: [{ angle: step('armL', i) }, { value: step('pelY', i) }, { weight: step('elbW', i) }, { weight: step('legW', i) }],
});
// 'arc': extra pelvis lift mid-way into/out of the bridge so the straight left leg swings on an arc around the heel
const ARC = [[0, 0], [4.0, 0], [4.7, 1], [5.4, 0], [6.6, 0], [7.3, 1], [8.0, 0]], ARC_UP = -0.07;
const HL = [-0.05, -0.50];                                   // left hand on the mat
export default {
  id: 'deltoids-B', name: '哑铃土耳其起立', nameEn: 'Dumbbell Turkish Get-Up (to high bridge)',
  timeline: { duration: DUR, tracks: { elb: ELB, sit: SIT, brg: BRG, arc: ARC } },
  pose: {
    base: {
      pelvis: PH.pelvis[0],
      hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[1, 0, 0], 0], [[0, 0, 1], 0]] },
      hands: {
        right: { mode: 'free', frame: 'world', relax: 0, wrist: PH.wristR[0], finger: [0, 1, 0], normal: [1, 0, 0], poleUp: [-0.2, 0.3, 1.0] },
        left: { mode: 'floor', at: HL, finger: [0.7, -0.7], poleUp: [0.0, 1.5, -0.2] },
      },
      feet: {
        right: { mode: 'floor', at: [0.52, 0.14], heading: 90, pitch: 0 },
        left: { mode: 'floor', at: [0.86, -0.36], heading: 115, pitch: -72 },
      },
      constraints: [
        { type: 'reach', limb: 'leftArm', angle: PH.armL[0], weight: 2 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: PH.pelY[0], weight: 10 },
        { type: 'joint', joint: 'leftElbow', axis: [0, 1, 0], value: 0.07, weight: 0 },
        { type: 'reach', limb: 'leftLeg', angle: 177, weight: PH.legW[0] },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 6, py: 0.3, pz: 10 } },
    },
    deltas: { elb: delta(1), sit: delta(2), brg: delta(3), arc: { pelvis: [PH.pelvis[0][0] - 0.06, PH.pelvis[0][1], PH.pelvis[0][2]], constraints: [{}, { value: +(PH.pelY[0] + ARC_UP).toFixed(4) }, {}, {}] } },
  },
  highlight: { groups: ['deltoids'], side: 'both', pulseTrack: 'sit', pulseBase: 0.35 },
  camera: { dir: [0.9, 0.55, 0.8], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm'], pad: 0.15, k: 1.0, drift: 2, at: 6.0 },
  // v2: framed so the whole mat stays in the picture (v1 cut ~54 px off its left and bottom edges); framing probe margins >=80 px
  frame: { mode: 'fit', width: 600, height: 640, cx: 558, cy: 498 },
  stillAt: 6.0,
  shadow: { joints: ['leftPalm', 'rightAnkle', 'leftAnkle', 'pelvis'], blobs: [{ j: 'leftPalm', rx: 40, ry: 10, a: 0.6 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.6 }, { j: 'leftAnkle', rx: 40, ry: 10, a: 0.6 }, { j: 'pelvis', rx: 80, ry: 16, a: 0.45 }], bands: [] },
  props: [
    { type: 'mat', at: [0.15, 0, -0.2], size: [1.83, 1.0, 0.006] },
    { type: 'gripHand', side: 'right' },
    // v2: closed power grip (fist baked by P.bakeGrip #23 / gripHand #82); the handle runs through the fist centre (lib/grip.mjs gripAttach)
    { type: 'dumbbell', length: 0.32, plate: 0.045, attach: 'rightHand', offset: DBO, rot: DBA.rot },
  ],
  keyFrames: [2.6, 4.0, 6.0],
  qa: {
    pins: [{ c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'knee.left', min: 172 }],
    allowContact: ['forearmL|torso', 'upperArmL|torso', 'handR|head'],
  },
};
