// h-chair-sit-to-stand 普通椅双脚坐站。Facing +Z, body left +X, head +Y.
// One controlled repetition: seated 0-.5s; hip hinge .5-1.5s; rise 1.5-3.3s;
// stand 3.3-4.3s; lower 4.3-6.5s; return trunk upright 6.5-7.5s. Both feet stay planted.
// Stable ordinary chair (45 cm seat, no wheels, against a wall in real use), arms forward
// as counterbalance, no hand touch solver. Quadriceps and glute-max produce the rise;
// trunk muscles stabilize without deliberate lumbar flexion. No floor sitting or lying.
import { build, keys, armWrist, armDir, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8;
const rise = keys([[0, 0], [1.5, 0], [3.3, 1], [4.3, 1], [6.5, 0]], DUR);
const lean = keys([[0, 0], [0.5, 0], [1.5, 30], [3.3, 3], [4.3, 3], [6.5, 30], [7.5, 0]], DUR);
const forward = keys([[0, 0], [0.5, 0], [1.5, 0.045], [3.3, 0.32], [4.3, 0.32], [6.5, 0.045], [7.5, 0]], DUR);
const hand = s => ({ mode: 'free', frame: 'chest', wrist: t => r4(armWrist(s, 65 + lean(t), 7, 0.48, 0.02)), finger: t => r4(armDir(s, 65 + lean(t), 7)), normal: [-sg(s), 0, 0], poleUp: [sg(s) * 0.4, 1.1, -0.2] });
const P = build(DUR, {
  pelvis: t => r4([0, 0.588 + 0.296 * rise(t), 0.02 + forward(t)]),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], lean]] },
  chest: { waist: [[[1, 0, 0], 0]] }, hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.14, 0.34], heading: 5, pitch: 0, pole: [0.2, 0.5, 1.1] },
    right: { mode: 'floor', at: [-0.14, 0.34], heading: -5, pitch: 0, pole: [-0.2, 0.5, 1.1] },
  }, constraints: [], solve: { vars: [], reg: {} },
}, { effort: keys([[0, 0], [0.5, 0], [1.5, 1], [3.3, 0.25], [4.3, 0.25], [6.5, 1], [7.5, 0]], DUR) });
export default {
  id: 'h-chair-sit-to-stand', name: '普通椅双脚坐站', nameEn: 'Chair Sit-to-Stand',
  modelProfile: 'training-human-v2', alignClavicles: false, fps: 15,
  timeline: { duration: DUR, tracks: P.tracks }, pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['quadriceps', 'glute-max'], side: 'both', pulseTrack: 'effort', pulseBase: 0.35 },
  camera: { dir: [-1, 0.22, 0.55], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm', 'rightPalm'], pad: 0.16, k: 0.9, drift: 0, at: 3.3, fitTimeline: true },
  frame: { mode: 'fit', width: 760, height: 840, cx: 512, cy: 515 }, stillAt: 3.3,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'chair', at: [0, 0, -0.03], yaw: 0, height: 0.45, width: 0.44, depth: 0.42 }],
  keyFrames: [0, 1.5, 3.3, 6.5],
  qa: { pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }], allowContact: [] },
};
