// n-wide-fold 站姿宽距体前屈（扶椅） (standing wide-leg forward fold, hands on a chair seat) · N HipLab 开胯 MVP 新增.
// Feet wide apart (about 1.8x shoulder width), toes forward, knees long but not locked. Folding from the hips with a long back,
// both palms rest on the seat of a chair placed in front; on the exhale the hips sink back a little and the chest drops between
// the arms (inner thighs and the backs of the thighs lengthen), on the inhale ease up a little. Hands never reach for the floor
// (the rig's long arms + waist < 45 limit). One slow rep / 8 s. Facing +Z, head +Y, body left = +X. No solver: the pelvis tilt,
// waist bend and pelvis path are prescribed; the palms stay pinned on the seat, the legs reach the planted feet by IK.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8, FX = 0.37, SEAT = 0.45, CZ = 0.66;
const p = keys([[0, 0], [0.5, 0], [2.6, 1], [4.6, 1], [6.8, 0]], DUR);
const hand = s => ({ mode: 'free', frame: 'world', palmAt: [sg(s) * 0.16, SEAT + 0.052, 0.50], finger: [sg(s) * 0.15, 0, 1], normal: [0, -1, 0], pole: [sg(s) * 0.8, 0.7, 0.2], relax: 0.5 });
const P = build(DUR, {
  pelvis: t => r4([0, 0.795 - 0.013 * p(t), -0.07 - 0.03 * p(t)]),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], t => 66 + 6 * p(t)]] },
  chest: { waist: [[[1, 0, 0], t => 16 + 6 * p(t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [FX, 0.0], heading: 6, pitch: 0, poleLow: [0.25, 0.5, 1] },
    right: { mode: 'floor', at: [-FX, 0.0], heading: -6, pitch: 0, poleLow: [-0.25, 0.5, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { fold: p });
export default {
  id: 'n-wide-fold', name: '站姿宽距体前屈（扶椅）', nameEn: 'Standing Wide-Leg Fold (Chair)',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors', 'hamstrings'], side: 'both', pulseTrack: 'fold', pulseBase: 0.3 },
  camera: { dir: [1, 0.35, 0.75], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm'], pad: 0.2, k: 0.9, drift: 3, at: 3.0, fitTimeline: true },
  frame: { mode: 'fit', width: 800, height: 760, cx: 512, cy: 540 },
  stillAt: 3.0,
  shadow: { joints: ['leftAnkle', 'rightAnkle', 'leftToe', 'rightToe', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }],
    bands: [{ from: 'leftAnkle', to: 'rightAnkle', mid: 'pelvis', rx: 90, ry: 14, a: 0.25, dy: 4, sag: 0.0 }] },
  props: [{ type: 'chair', at: [0, 0, CZ], yaw: 180, height: SEAT, width: 0.44, depth: 0.42 }],
  keyFrames: [0.3, 2.6, 4.0],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }],
    straight: [{ j: 'knee.left', min: 166 }, { j: 'knee.right', min: 166 }],
    allowContact: [],
  },
};
