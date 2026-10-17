// n-squat-shift 低位蹲姿左右移重心 (low wide squat, weight shift side to side) · N HipLab 开胯 MVP 新增.
// Feet about twice hip width, toes turned out, heels flat. From a wide squat held with the chest tall (palms together in front of
// the chest), the pelvis travels slowly toward the LEFT foot (left knee bends more and tracks over the toes, the right leg
// lengthens and the inner right thigh opens), pauses, passes back through the centre and over to the RIGHT. Control of
// abduction in a low position, the base of breaking footwork; a lead-in to the Cossack squat. One cycle (both sides) / 8 s.
// Facing +Z, head up (+Y), body left = +X (frame of h-sumo-pry). No solver.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8, FX = 0.38, TOE = 36, SHIFT = 0.15;
const sh = keys([[0, 0], [0.3, 0], [1.8, 1], [2.8, 1], [4.0, 0], [4.3, 0], [5.8, -1], [6.8, -1], [8.0, 0]], DUR);   // +1 = toward the left foot
const a = t => Math.abs(sh(t));
const hand = s => ({ mode: 'free', frame: 'chest', palmAt: [sg(s) * 0.0345, 1.12, 0.27],
  finger: [0, 0.85, 0.53], normal: [-sg(s), 0, 0], poleLow: [sg(s) * 0.6, 0.6, 0.25] });
const knee = s => t => { const load = Math.max(0, sg(s) * sh(t)); return r4([sg(s) * (0.95 + 0.15 * load), 0.5, 0.85]); };
const P = build(DUR, {
  pelvis: t => r4([SHIFT * sh(t), 0.53 - 0.03 * a(t), -0.03]),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], t => 24 + 4 * a(t)], [[0, 0, 1], t => -4 * sh(t)]] },
  chest: { waist: [[[1, 0, 0], -4], [[0, 0, 1], t => 6 * sh(t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [FX, 0.0], heading: TOE, pitch: 0, poleLow: knee('left') },
    right: { mode: 'floor', at: [-FX, 0.0], heading: -TOE, pitch: 0, poleLow: knee('right') },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { shift: a });
export default {
  id: 'n-squat-shift', name: '低位蹲姿左右移重心', nameEn: 'Low Squat Side-to-Side Shift',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors', 'glute-max'], side: 'both', pulseTrack: 'shift', pulseBase: 0.3 },
  camera: { dir: [0.35, 0.3, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'], pad: 0.2, k: 0.85, drift: 3, at: 2.2, fitTimeline: true },
  frame: { mode: 'fit', width: 800, height: 680, cx: 512, cy: 580 },
  stillAt: 2.2,
  shadow: { joints: ['leftAnkle', 'rightAnkle', 'leftToe', 'rightToe', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }],
    bands: [{ from: 'leftAnkle', to: 'rightAnkle', mid: 'pelvis', rx: 90, ry: 14, a: 0.25, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, 0.05], size: [0.61, 1.4, 0.006], yaw: 90 }],
  keyFrames: [0.2, 2.2, 6.2],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [],
    allowContact: ['handL|handR', 'forearmL|forearmR', 'upperArmL|thighL', 'upperArmR|thighR', 'forearmL|thighL', 'forearmR|thighR', 'upperArmL|kneeL', 'upperArmR|kneeR'],
  },
};
