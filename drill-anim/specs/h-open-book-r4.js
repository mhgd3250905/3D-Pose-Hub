// New armfix-r2 template revision; preserve historical source and QA.
import priorTemplate from './h-open-book-r3.js';
// h-open-book 侧卧开书式 (side-lying open book) · H 居家开肩系列.
// Lying on the LEFT side on the mat, head on a cushion, hips and knees bent to 90 deg with the knees stacked, both arms straight in
// front at shoulder height (top hand resting on the bottom forearm). Keeping the knees together, the top (right) arm sweeps up
// in a big arc over the body and back toward the floor behind, the chest turning open with it and the eyes following the hand;
// pause and breathe, then sweep back. Thoracic rotation and a pec / front-shoulder stretch. 1 rep / 8 s: 0.4 s rest, 3.0 s open,
// 1.2 s hold, 3.0 s back, 0.4 s rest.
// Head points +X, front faces +Z (camera side), body left = -Y (down) - frame of h-reverse-clam. No solver: legs fixed (free feet,
// hips frame), the waist turns about the trunk axis, the right hand sweeps in the chest X-Z plane.
import { REST, leg, rotAbout, footRotW, r4 } from './_home-armfix-r1.mjs';
import { build, keys, armDir } from './_home-armfix-r1.mjs';
const DUR = 8, ROT = 32, A0 = 22, A1 = -148, TIP = 0;
const P0 = [-0.336029828141, 0.19, -0.001954201688];
const hips = { up: [1, 0, 0], front: [0, 0, 1], rot: [[[0, 0, 1], TIP]] };
const p = keys([[0, 0], [0.4, 0], [3.4, 1], [4.6, 1], [7.6, 0]], DUR);
const FL = leg('left', 88, 92), FR = leg('right', 88, 92, [[[0, 1, 0], 7]]);
const poleOf = (H, A, K) => { const m = A.map((x, i) => (x + H[i]) / 2); return r4(K.map((x, i) => x + 2 * (x - m[i]))); };
const FROT = [[[1, 0, 0], 12]];
// bottom (left) arm straight forward on the floor, palm up toward the top hand
// (hips frame, so it stays on the floor while the chest turns; it slides forward a little as the bottom shoulder comes forward)
const WAIST = [0, 1.08554168, 0.0040458], SB = 11;
const LW0 = rotAbout(REST.shoulder('left').map((x, k) => x + [0, 0, 1][k] * 0.482), WAIST, [0, 0, 1], SB);
// top (right) arm: direction (sin a, 0, cos a) in the chest frame, a from A0 (resting on the bottom forearm) to A1 (open behind)
const SR = REST.shoulder('right'), SHR = [0.03, 0, 0.035];
const ang = t => A0 + (A1 - A0) * p(t);
const dR = t => { const a = ang(t) * Math.PI / 180; return [Math.sin(a), 0, Math.cos(a)]; };
const fa = t => (ang(t) - 14 * (1 - p(t))) * Math.PI / 180;   // wrist a little extended at the start (fingers level)
const fR = t => { const a = fa(t); return [Math.sin(a), 0, Math.cos(a)]; };
const nR = t => { const a = fa(t); return [Math.cos(a), 0, -Math.sin(a)]; };
const shR = t => SHR.map(x => x * (1 - p(t)));
const P = build(DUR, {
  pelvis: t => [P0[0], +(P0[1] - 0.013 * p(t)).toFixed(4), P0[2]],
  hips,
  chest: { waist: [[[0, 0, 1], SB], [[1, 0, 0], t => -ROT * p(t)]] },
  shoulders: { right: t => shR(t) },
  hands: {
    left: { mode: 'free', frame: 'hips', wrist: t => r4([LW0[0] - 0.01 - 0.012 * p(t), LW0[1], LW0[2] + 0.085 * p(t)]), finger: [0, 0, 1], normal: [-1, 0, 0], poleLow: [0.3, 1.25, 0.1], relax: 0.6 },
    right: { mode: 'free', frame: 'chest', wrist: t => { const s = shR(t), d = dR(t); return r4(SR.map((x, k) => x + s[k] + d[k] * 0.482)); },
      finger: t => r4(fR(t)), normal: t => r4(nR(t)), poleUp: [-0.2, 1.8, 0.05], relax: 0.6 },
  },
  feet: {
    left: { mode: 'free', frame: 'hips', ankle: FL.ankle, rot: footRotW(hips, FROT), poleLow: poleOf(FL.hip, FL.ankle, FL.knee) },
    right: { mode: 'free', frame: 'hips', ankle: FR.ankle, rot: footRotW(hips, [[[0, 1, 0], 7], ...FROT]), poleLow: poleOf(FR.hip, FR.ankle, FR.knee) },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { open: p });
const spec = {
  id: 'h-open-book', name: '侧卧开书式', nameEn: 'Side-Lying Open Book',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['chest', 'obliques'], side: 'right', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [0.3, 1.0, 0.9], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'leftKnee', 'rightElbow'], pad: 0.13, k: 0.75, drift: 3, at: 4.0, fitTimeline: true },
  frame: { mode: 'fit', width: 840, cx: 512, cy: 530 },
  stillAt: 4.0,
  shadow: { joints: ['pelvis', 'leftKnee', 'leftAnkle', 'waist', 'shoulderCenter', 'leftPalm'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.55 }, { j: 'leftKnee', rx: 44, ry: 11, a: 0.5 }, { j: 'shoulderCenter', rx: 80, ry: 15, a: 0.5 }, { j: 'leftPalm', rx: 36, ry: 10, a: 0.45 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 60, ry: 13, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.30, 0, 0.12], size: [1.6, 0.61, 0.006] }, { type: 'mat', at: [0.27, 0.222, 0.0], size: [0.30, 0.34, 0.22] }],
  keyFrames: [0.2, 2.0, 4.0],
  qa: {
    pins: [],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR', 'kneeL|kneeR', 'handR|forearmL', 'handR|handL', 'forearmR|forearmL'],
  },
};

spec.id = "h-open-book-r4";
spec.modelProfile="training-human-v2plus-hands-native";
spec.runtimeModel={profile:"training-human-v3-armfix",version:"0.1.0-r2"};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:"compression",torso:"base",limbs:"base",hands:"base",skin:"realistic"};
spec.camera=structuredClone(priorTemplate.camera);
spec.reviewed=false;spec.releaseEligible=false;spec.qaStatus="candidate-awaiting-gpu-and-user-review";
export default spec;
