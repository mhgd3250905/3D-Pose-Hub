// w-wall-sit 靠墙静蹲 (wall sit). Back flat against a wall, thighs level, knees ~90 deg over the ankles, feet flat hip width,
// arms reaching straight forward (palms facing). Isometric hold: a slow breathing cycle lowers the hips ~6 mm and lets the
// arms drift a touch, the back stays on the wall. 8 s loop = 2 breaths.
// Facing +Z, head up (+Y), body left = +X. Wall face at z = ZW, facing +Z (wall prop yaw 0). No solver.
import { REST, r4, sg, track } from '../lib/ss-geo.mjs';
const DUR = 8, PY = 0.5476, ZW = -0.1135, AR = 0.482;
const breath = t => (1 - Math.cos(2 * Math.PI * t / 4)) / 2;   // 0 = top of the breath, 1 = exhaled (hips 6 mm lower)
const hand = (s, dy) => { const S = REST.shoulder(s); return { mode: 'free', frame: 'chest', wrist: r4([S[0] - sg(s) * 0.03, S[1] + dy, S[2] + AR]), finger: [0, 0, 1], normal: [-sg(s), 0, 0], poleUp: r4([sg(s) * 0.3, 1.15, 0.2]) }; };
export default {
  id: 'w-wall-sit', name: '靠墙静蹲', nameEn: 'Wall Sit',
  timeline: { duration: DUR, tracks: { b: track(DUR, breath) } },
  breath: 0.003,
  pose: {
    base: {
      pelvis: [0, PY, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      hands: { left: hand('left', 0), right: hand('right', 0) },
      feet: {
        left: { mode: 'floor', at: [0.115, 0.375], heading: 4, pitch: 0, poleLow: [0.2, 0.6, 0.8] },
        right: { mode: 'floor', at: [-0.115, 0.375], heading: -4, pitch: 0, poleLow: [-0.2, 0.6, 0.8] },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: { b: { pelvis: [0, PY - 0.006, 0], hands: { left: hand('left', -0.012), right: hand('right', -0.012) } } },
  },
  highlight: { groups: ['quadriceps', 'glute-max'], side: 'both', pulseTrack: 'b', pulseBase: 0.55 },
  camera: { dir: [1, 0.25, 0.8], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm', 'rightPalm'], pad: 0.14, k: 0.85, drift: 3, at: 0 },
  frame: { mode: 'fit', width: 700, height: 860, cx: 512, cy: 530 },
  stillAt: 0,
  shadow: { joints: ['leftAnkle', 'rightAnkle', 'leftToe', 'rightToe', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'wall', at: [0, 0, ZW], yaw: 0, size: [1.4, 2.0, 0.12] }],
  keyFrames: [0, 2, 4],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 168 }, { j: 'elbow.left', min: 168 }],
    allowContact: [],
  },
};
