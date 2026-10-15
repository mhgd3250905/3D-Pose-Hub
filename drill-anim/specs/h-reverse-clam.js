// h-reverse-clam 侧卧反向蚌式 (side-lying reverse clamshell, hip internal rotation) · H 居家开胯系列.
// Lying on the LEFT side, propped on the left forearm, hips stacked, hips flexed ~45 deg and knees ~90 deg (the w-clamshell
// set-up). The knees stay pressed together while the TOP (right) foot lifts up away from the bottom foot: the shin swings about
// the thigh's own axis (hip internal rotation, the end range most people lack for 开胯), hold, lower under control. The pelvis
// does not roll. Right hand rests on the top hip. 2 reps / 8 s: 1.1 s up, 0.9 s hold, 1.2 s down, 0.8 s rest.
// Head points +X, front faces +Z (camera side), body left = -Y (down) - frame of w-clamshell. No solver: the ankle orbits the
// hip-knee line (exact arc as coordinate tracks); the knee stays put.
import { REST, leg, rot, rotAbout, restToWorld, restPtW, footRotW, r4 } from '../lib/ss-geo.mjs';
import { build, keys } from '../lib/home-anim.mjs';
const DUR = 8, LIFT = 40, TW = 36;
const P0 = [-0.45, 0.165, 0];
const hips = { up: [1, 0, 0], front: [0, 0, 1], rot: [[[0, 0, 1], 0]] };
const WR = [0, 1.0408, 0.0059];
const W = restPtW(hips, P0, WR);
const chestPt = p => r4(W.map((x, i) => x + rot(restToWorld(hips, p.map((v, j) => v - WR[j])), [0, 0, 1], TW)[i]));
const SL = chestPt(REST.shoulder('left'));
const EY = 0.045, dy = SL[1] - EY, hz = Math.sqrt(0.2567 ** 2 - dy * dy);
const EL = r4([SL[0] + hz, EY, SL[2]]);
const FL = leg('left', 45, 90, [[[0, 0, 1], 1.4]]), FR = leg('right', 45, 90, [[[0, 0, 1], 7.4]]);
const poleOf = (H, A, K) => { const m = A.map((x, i) => (x + H[i]) / 2); return r4(K.map((x, i) => x + 2 * (x - m[i]))); };
const axHK = FR.knee.map((x, i) => x - FR.hip[i]);
// sign so that a positive lift moves the top ankle toward rest -X (= world +Y, up, since body left points down)
const SGN = rotAbout(FR.ankle, FR.knee, axHK, 10)[0] < FR.ankle[0] ? 1 : -1;
const p = keys([[0, 0], [0.3, 0], [1.4, 1], [2.3, 1], [3.5, 0], [4.3, 0], [5.4, 1], [6.3, 1], [7.5, 0]], DUR);
const ankR = t => rotAbout(FR.ankle, FR.knee, axHK, SGN * LIFT * p(t));
const FROT = [[[1, 0, 0], 55]];
const P = build(DUR, {
  pelvis: P0,
  hips,
  chest: { waist: [[[0, 0, 1], TW]] },
  hands: {
    left: { mode: 'floor', at: [EL[0], +(EL[2] + 0.228).toFixed(4)], finger: [0.0, 1], pole: EL },
    right: { mode: 'free', frame: 'hips', palmAt: [-0.15, 1.055, 0.05], finger: [0.05, -0.35, 0.94], normal: [1, 0, 0], poleUp: [-0.55, 1.15, -0.25], touch: { clear: 0.0015, from: 0.0, solve: 'bisect', iters: 16 } },
  },
  feet: {
    left: { mode: 'free', frame: 'hips', ankle: FL.ankle, rot: footRotW(hips, FROT), poleLow: poleOf(FL.hip, FL.ankle, FL.knee) },
    right: { mode: 'free', frame: 'hips', ankle: t => r4(ankR(t)), rot: footRotW(hips, [[[1, 0, 0], 55], [axHK, 0]]).map((r, i) => i === 1 ? [r[0], t => SGN * LIFT * p(t)] : r),
      poleLow: t => poleOf(FR.hip, ankR(t), FR.knee) },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lift: p });
export default {
  id: 'h-reverse-clam', name: '侧卧反向蚌式', nameEn: 'Side-Lying Reverse Clamshell',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hip-abductors', 'glute-max'], side: 'right', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [-0.75, 0.8, 0.85], fit: ['head', 'leftPalm', 'leftElbow', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'leftKnee', 'rightElbow', 'rightAnkle'], pad: 0.14, k: 0.75, drift: 3, at: 1.8, fitTimeline: true },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 540 },
  stillAt: 1.8,
  shadow: { joints: ['leftPalm', 'leftElbow', 'pelvis', 'leftKnee', 'leftAnkle', 'waist'],
    blobs: [{ j: 'leftElbow', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'pelvis', rx: 80, ry: 16, a: 0.55 }, { j: 'leftKnee', rx: 44, ry: 11, a: 0.5 }],
    bands: [{ from: 'leftElbow', to: 'pelvis', mid: 'waist', rx: 60, ry: 13, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.45, 0, 0.12], size: [1.6, 0.61, 0.006] }],
  keyFrames: [0.2, 0.8, 1.8],
  qa: {
    pins: [{ c: 'handL', when: 'always' }],
    touch: [{ side: 'right', when: 'always' }],
    allowContact: ['handR|torso', 'forearmR|torso', 'handR|thighR', 'thighL|thighR', 'shinL|shinR', 'footL|footR', 'upperArmL|torso', 'forearmL|torso', 'kneeL|kneeR'],
  },
};
