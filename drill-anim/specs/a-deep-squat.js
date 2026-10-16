// a-deep-squat HipLab 自测⑥ 深蹲到底 对比图 (stills A/B/C, same camera and light) · built from h-squat.
// Feet a little wider than the hips, toes turned out, arms forward for balance. A 松 = all the way down, heels flat, chest up;
// B 一般 = gets low but the heels lift off the floor; C 紧 = stops with the thighs about level with the floor (h-squat bottom).
// t 0-2 / 2-4 / 4-6 s, stills at frames 15 / 45 / 75 (15 fps). Not a training animation. The A pose stays under the rig's
// hip-flexion limit (135 deg) by turning the knees out and keeping the trunk fairly upright.
// Facing +Z, head up (+Y), body left = +X (frame of h-squat). No solver.
import { build, armWrist, armDir, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 6;
const STEP = t => { t = ((t % DUR) + DUR) % DUR; return t < 2 ? 0 : t < 4 ? 1 : 2; };
const S = [
  { pel: [0, 0.405, -0.075], lean: 30, arm: 78, fx: 0.19, toe: 24, pitch: 0, knee: 0.6 },
  { pel: [0, 0.47, -0.07], lean: 24, arm: 80, fx: 0.17, toe: 16, pitch: 38, knee: 0.5 },
  { pel: [0, 0.535, -0.13], lean: 38, arm: 82, fx: 0.15, toe: 10, pitch: 0, knee: 0.42 },
];
const at = (k, t) => S[STEP(t)][k];
const hand = s => ({ mode: 'free', frame: 'chest', wrist: t => r4(armWrist(s, at('arm', t) + at('lean', t), 4, 0.4855, 0.03)),
  finger: t => r4(armDir(s, at('arm', t) + at('lean', t), 4)), normal: [-sg(s), 0, 0], poleUp: [sg(s) * 0.35, 1.1, -0.2] });
const foot = s => ({ mode: 'floor', at: t => [sg(s) * at('fx', t), 0.0], heading: t => sg(s) * at('toe', t), pitch: t => at('pitch', t), poleLow: t => [sg(s) * at('knee', t), 0.55, 1] });
const P = build(DUR, {
  pelvis: t => at('pel', t),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], t => at('lean', t)]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: foot('left'), right: foot('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { step: STEP, glow: t => 1 });
export default {
  id: 'a-deep-squat', name: '自测·深蹲到底 对比图', nameEn: 'Self-test: deep squat stills',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['glute-max', 'adductors'], side: 'both', pulseTrack: 'glow', pulseBase: 1.0 },
  camera: { dir: [1, 0.22, 0.75], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm', 'rightPalm'], pad: 0.14, k: 0.85, drift: 0, at: 5.0, fitTimeline: true },
  frame: { mode: 'fit', width: 700, height: 700, cx: 512, cy: 540 },
  stillAt: 5.0,
  shadow: { joints: ['leftAnkle', 'rightAnkle', 'leftToe', 'rightToe', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'mat', at: [0, 0, 0.0], size: [0.61, 1.0, 0.006], yaw: 90 }],
  keyFrames: [1.0, 3.0, 5.0],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    allowContact: ['thighL|shinL', 'thighR|shinR', 'thighL|torso', 'thighR|torso'],
  },
};
