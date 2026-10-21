// h-wall-calf-bent-knee 扶墙屈膝小腿拉伸。Facing +Z, body left +X, head +Y.
// Short split stance, RIGHT leg behind; both heels stay flat. Bend both knees gently,
// shift pelvis forward/down slightly, hold 3.4 s, release. The rear knee remains bent:
// distinct from h-wall-calf's straight-knee gastrocnemius emphasis. Calves highlight is
// a surface approximation of the soleus-biased stretch, not an isolated deep-muscle map.
// Stable wall, non-slip shoes; no bouncing, painful range or forced heel lift. Mirror for left.
import { build, keys, r4 } from '../lib/home-anim.mjs';
const DUR = 8;
const p = keys([[0, 0], [0.5, 0], [2.3, 1], [5.7, 1], [7.5, 0]], DUR);
const wallHand = s => ({ mode: 'free', frame: 'world', wrist: [s * 0.22, 1.22, 0.455], finger: [0, 1, 0], normal: [0, 0, 1], pole: [s * 0.38, 1.10, 0.23] });
const P = build(DUR, {
  pelvis: t => r4([0, 0.85 - 0.02 * p(t), -0.04 + 0.015 * p(t)]),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], t => 6 + 3 * p(t)]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: wallHand(1), right: wallHand(-1) },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.13], heading: 0, pitch: 0, pole: [0.16, 0.5, 0.9] },
    right: { mode: 'floor', at: [-0.12, -0.12], heading: 0, pitch: 0, pole: [-0.16, 0.5, 0.7] },
  }, constraints: [], solve: { vars: [], reg: {} },
}, { stretch: p });
export default {
  id: 'h-wall-calf-bent-knee', name: '扶墙屈膝小腿拉伸', nameEn: 'Bent-Knee Wall Calf Stretch',
  modelProfile: 'training-human-v2', alignClavicles: false, fps: 15,
  timeline: { duration: DUR, tracks: P.tracks }, pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['calves'], side: 'right', pulseTrack: 'stretch', pulseBase: 0.35 },
  camera: { dir: [-1, 0.14, 0.12], fit: ['head', 'leftToe', 'rightToe', 'rightAnkle', 'pelvis', 'leftKnee', 'leftPalm', 'rightPalm'], pad: 0.14, k: 1, drift: 0, at: 4, fitTimeline: true },
  frame: { mode: 'fit', width: 820, height: 820, cx: 512, cy: 515 }, stillAt: 4,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'wall', at: [0, 0, 0.483], yaw: 180, size: [1.3, 2.2, 0.12] }],
  keyFrames: [0, 2, 4, 6],
  qa: { pins: [{ c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }], allowContact: [] },
};
