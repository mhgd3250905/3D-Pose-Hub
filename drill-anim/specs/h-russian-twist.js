// h-russian-twist 俄罗斯转体 (Russian twist, feet-down beginner version) · H 居家核心力量系列.
// Seated on the mat, knees bent ~95 deg, heels down and feet flat; the trunk leans back ~23 deg from vertical with a long spine.
// Palms pressed together in front of the chest (arms rounded), the rib cage turns slowly to the RIGHT (~36 deg) so the hands
// travel beside the right hip, back through the centre and to the LEFT - the knees and pelvis stay still and facing forward.
// 2 full cycles / 8 s: each side 0.8 s turn, 0.4 s pause, 0.8 s back.
// Head +Y, front faces +Z, body left = +X. No solver: lean and twist are prescribed, hands ride in the chest frame.
import { build, keys, sg, r4, DEG } from '../lib/home-anim.mjs';
const DUR = 8, PT = 10, LEAN = 13, TW = 36;
const s = keys([[0, 0], [0.8, 1], [1.2, 1], [2.0, 0], [2.8, -1], [3.2, -1], [4.0, 0], [4.8, 1], [5.2, 1], [6.0, 0], [6.8, -1], [7.2, -1]], DUR);   // +1 = turn right
const tilt = PT + LEAN;                              // total trunk lean back (deg)
const axis = [0, Math.cos(tilt * DEG), -Math.sin(tilt * DEG)];   // long axis of the leaned trunk
// palms together ~30 cm in front of the sternum (chest rest frame), fingers forward-up
const hand = side => ({ mode: 'free', frame: 'chest', wrist: [sg(side) * 0.068, 1.08, 0.27], finger: [-sg(side) * 0.12, 0.45, 0.88], normal: [-sg(side), 0, 0],
  poleUp: [sg(side) * 1, 0.2, -0.3], relax: 0 });
const P = build(DUR, {
  pelvis: [0, 0.122, -0.02],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], -PT]] },
  chest: { waist: [[[1, 0, 0], -LEAN], [axis, t => -TW * s(t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.62], heading: 6, pitch: 0, poleLow: [0.35, 1.0, 0.8] },
    right: { mode: 'floor', at: [-0.12, 0.62], heading: -6, pitch: 0, poleLow: [-0.35, 1.0, 0.8] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { turn: t => Math.abs(s(t)) });
export default {
  id: 'h-russian-twist', name: '俄罗斯转体', nameEn: 'Russian Twist (Feet Down)',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['obliques'], side: 'both', pulseTrack: 'turn', pulseBase: 0.3 },
  camera: { dir: [0.7, 0.3, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow', 'leftPalm'], pad: 0.12, k: 0.9, drift: 2, at: 1.0 },
  frame: { mode: 'fit', width: 760, height: 780, cx: 512, cy: 530 },
  stillAt: 0.0,
  shadow: { joints: ['pelvis', 'leftAnkle', 'rightAnkle', 'leftToe', 'rightToe'],
    blobs: [{ j: 'pelvis', rx: 90, ry: 18, a: 0.6 }, { j: 'leftAnkle', rx: 44, ry: 11, a: 0.55 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.55 }], bands: [] },
  props: [{ type: 'mat', at: [0, 0, 0.25], size: [1.83, 0.61, 0.006], yaw: 90 }],
  keyFrames: [0.0, 1.0, 3.0],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    allowContact: ['handL|handR', 'forearmL|forearmR', 'thighL|thighR'],
  },
};
