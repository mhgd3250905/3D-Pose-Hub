// a-supine-cross HipLab 自测④ 仰卧单腿横跨（内收） 对比图 (stills A/B/C) · built from n-leg-circles (cross-over clip).
// The straight right leg (hip flexion 45 deg) crosses toward the left: A 松 = the foot one foot-length past the outside of the
// long left leg, pelvis still; B 一般 = foot right above the long leg; C 紧 = foot short of the long leg and the right side of the
// pelvis already rolling off the mat. t 0-2 / 2-4 / 4-6 s, stills at frames 15 / 45 / 75. Not a training animation.
// Original n-leg-circles header follows.
// Lying on the back, arms long beside the body, palms down on the mat (never on the belly). The RIGHT leg is raised straight
// (hip flexion 48-76 deg) and draws two slow circles in the air while the pelvis and the long left leg stay still (hip
// flexors / abductors / adductors control). Then the straight leg lowers to ~45 deg and crosses over toward the left side,
// stopping above/past the long left leg before the pelvis would roll (the HipLab self-test 4 "supine cross-over" clip,
// 7.6-12 s), and returns. One cycle / 12 s: 0-7.2 s two circles, 7.2-12 s cross-over and back.
// Head points -X, face up (+Y), body left = -Z, body right = +Z (frame of h-band-leg-out). No solver.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { leg, footRotW, restToWorld } from '../lib/ss-geo.mjs';
const DUR = 6;
const STEP = t => { t = ((t % DUR) + DUR) % DUR; return t < 2 ? 0 : t < 4 ? 1 : 2; };
const ADD = [-40, -20, 12], ROLLS = [0, 0, 12];
const PEL = [0, 0.114, 0];
const hips = { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[1, 0, 0], 0]] };
const Fl = t => 45, Ab = t => ADD[STEP(t)];
const LR = t => leg('right', Fl(t), 2, [[[0, 1, 0], -Ab(t)]]);
const LL = leg('left', -2.5, 3);   // left leg long on the mat (as h-band-leg-out)
const hand = s => ({ mode: 'free', frame: 'world', palmAt: [0.0, 0.027, -sg(s) * 0.438], finger: [1, 0, -sg(s) * 0.3], normal: [0, -1, 0], pole: [-0.22, 0.05, -sg(s) * 0.6], relax: 0.6 });
const P = build(DUR, {
  pelvis: t => [0, 0.114 + (STEP(t) === 2 ? 0.017 : 0), 0],
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[1, 0, 0], t => -ROLLS[STEP(t)]]] },
  chest: { waist: [[[0, 0, 1], 0], [[1, 0, 0], t => ROLLS[STEP(t)] * 0.8]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'free', frame: 'hips', ankle: LL.ankle, rot: footRotW(hips, [[[1, 0, 0], 3 - 5.5]]), poleLow: r4([LL.knee[0] - 0.05, LL.knee[1], LL.knee[2] + 0.5]) },
    right: { mode: 'free', frame: 'hips', ankle: t => LR(t).ankle,
      rot: [[restToWorld(hips, [1, 0, 0]), t => -Fl(t) + 8], [restToWorld(hips, [0, 1, 0]), t => -Ab(t)]],
      poleLow: t => { const K = LR(t).knee; return r4([K[0] - 0.1, K[1] + 0.5, K[2] + 0.05]); } },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { step: STEP, glow: t => 1 });
export default {
  id: 'a-supine-cross', name: '自测·仰卧单腿横跨 对比图', nameEn: 'Self-test: supine cross-over stills',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hip-abductors'], side: 'right', pulseTrack: 'glow', pulseBase: 1.0 },
  camera: { dir: [0.45, 1, 0.12], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'rightAnkle'], pad: 0.12, k: 0.8, drift: 0, at: 1.0, fitTimeline: true },
  frame: { mode: 'fit', width: 880, height: 760, cx: 512, cy: 540 },
  stillAt: 2.0,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftAnkle', 'leftPalm', 'rightPalm'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6 }, { j: 'waist', rx: 70, ry: 13, a: 0.5 }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 }, { j: 'leftAnkle', rx: 40, ry: 10, a: 0.45 },
      { j: 'leftPalm', rx: 30, ry: 9, a: 0.35 }, { j: 'rightPalm', rx: 30, ry: 9, a: 0.35 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 13, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.05, 0, 0], size: [1.83, 0.7, 0.006] }],
  keyFrames: [1.0, 3.0, 5.0],
  qa: {
    pins: [],
    straight: [{ j: 'knee.right', min: 168 }, { j: 'knee.left', min: 168 }],
    allowContact: ['handL|torso', 'handR|torso', 'forearmL|torso', 'forearmR|torso'],
  },
};
