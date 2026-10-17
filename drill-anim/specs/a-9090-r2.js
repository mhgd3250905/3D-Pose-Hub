// a-9090-r2 (HipLab media fix 2026-10-17, issue 10: feet follow the shins, see _9090-feet.mjs; poses otherwise as a-9090) · HipLab 自测② 90/90 上身直立 对比图 (stills, same camera and light) · built from s-9090 (upright part).
// RIGHT leg in front (shin across the body), LEFT leg to the side (shin pointing back), both knees 90 deg.
// A 松 = hands off the mat, sitting tall, both knees on the mat; B 一般 = needs the hands behind on the mat and leans back;
// C 紧 = one knee clearly lifts (the front knee here). Follow-up stills: front knee lifts (= C) / back knee lifts.
// t 0-2 A, 2-4 B, 4-6 C, 6-8 follow-up front, 8-10 follow-up back; stills at frames 15 / 45 / 75 / 105 / 135 (15 fps).
// Not a training animation. Head points +Y, front shin points +X, body left = +X (frame of s-9090).
import { build, armWrist, armDir, sg, r4 } from '../lib/home-anim.mjs';
import { rotAbout } from '../lib/ss-geo.mjs';
import { ROT_R, ROT_L, ANKLE_R, ANKLE_L } from './_9090-feet.mjs';
const DUR = 10;
const STEP = t => { t = ((t % DUR) + DUR) % DUR; return Math.min(4, Math.floor(t / 2)); };
const ST = [   // trunk lean (hips about X), hands ('front' = arms reaching forward, 'back' = palms on the mat behind), knee poles
  { lean: 0, hands: 'front', fl: 0, bl: 0 },
  { lean: -48, hands: 'back', fl: 0, bl: 0 },
  { lean: 0, hands: 'front', fl: 48, bl: 0 },
  { lean: 0, hands: 'front', fl: 48, bl: 0 },
  { lean: 0, hands: 'front', fl: 0, bl: 48 },
];
// knee lift: rotate the knee pole about the hip-ankle line, toward whichever side raises it
const lift = (P0, H, A, deg) => { if (!deg) return P0; const ax = A.map((x, i) => x - H[i]);
  const u = rotAbout(P0, H, ax, deg), d = rotAbout(P0, H, ax, -deg); return r4(u[1] > d[1] ? u : d); };
const FH = [-0.065, 0.092, 0.049], FA = ANKLE_R, BH = [0.065, 0.092, -0.049], BA = ANKLE_L;
const FP = [-0.3, 0.1, 1.0], BP = [1.0, 0.1, 0.1];
const at = (k, t) => ST[STEP(t)][k];
const B = [-0.6, 0, -0.8], LT = [0.8, 0, -0.6];
const back = s => [0.36 * B[0] + sg(s) * 0.22 * LT[0], 0.36 * B[2] + sg(s) * 0.22 * LT[2]];
const hand = s => ({ plant: { mode: 'floor', at: back(s), finger: [B[0] + sg(s) * 0.2 * LT[0], B[2] + sg(s) * 0.2 * LT[2]], poleUp: [sg(s) * 0.4, 1.0, -0.4] },
  free: { mode: 'free', frame: 'chest', wrist: r4(armWrist(s, 88, 8, 0.4855, 0.03)), finger: r4(armDir(s, 88, 8)), normal: [0, -1, 0.3], poleUp: [sg(s) * 0.5, 1.0, -0.3] },
  w: t => at('hands', t) === 'back' ? 0 : 1, arc: 0 });
const P = build(DUR, {
  pelvis: t => [0, at('lean', t) < 0 ? 0.13 : 0.14, 0],
  hips: { up: [0, 1, 0], front: [0.6, 0, 0.8], rot: [[[0.8, 0, -0.6], t => at('lean', t)]] },
  chest: { waist: [[[1, 0, 0], 0], [[0, 1, 0], -20]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    right: { mode: 'free', frame: 'world', ankle: ANKLE_R, rot: ROT_R, pole: t => lift(FP, FH, FA, at('fl', t)), thighTwist: 60 },
    left: { mode: 'free', frame: 'world', ankle: ANKLE_L, rot: ROT_L, pole: t => lift(BP, BH, BA, at('bl', t)), thighTwist: 40 },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { step: STEP, glow: t => 1 });
export default {
  id: 'a-9090-r2', name: '自测·90/90 对比图', nameEn: 'Self-test: 90/90 stills',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['glute-max'], panels: ['gluteMed'], side: 'both', inset: 0, pulseTrack: 'glow', pulseBase: 1.0 },
  camera: { dir: [0.35, 0.75, 1], fit: ['head', 'leftKnee', 'rightKnee', 'pelvis', 'leftToe', 'rightToe', 'leftPalm', 'rightPalm'], pad: 0.18, k: 1.0, drift: 0, at: 1.0, fitTimeline: true },
  frame: { mode: 'fit', width: 700, height: 680, cx: 512, cy: 560 },
  stillAt: 1.0,
  shadow: { joints: ['leftKnee', 'rightKnee', 'pelvis', 'rightAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.5, fade: [0.12, 0.3] }, { j: 'rightKnee', rx: 40, ry: 10, a: 0.5, fade: [0.12, 0.3] }],
    bands: [] },
  props: [{ type: 'mat', at: [0.02, 0, -0.1], size: [1.12, 1.4, 0.006], yaw: 0 }],
  keyFrames: [1.0, 3.0, 5.0],
  qa: {
    allowContact: ['footR|shinL', 'footR|thighL', 'shinR|thighL', 'thighR|shinR', 'thighL|shinL'],
  },
};
