// h-side-er 侧卧肩外旋 (side-lying shoulder external rotation) · H 居家肩部系列.
// Lying on the LEFT side, propped on the left forearm, hips and knees bent and stacked (clamshell base). The top (RIGHT) elbow is
// bent 90 deg and pinned to the side of the ribs (a rolled towel under it); the forearm starts across the belly. Keeping the elbow
// glued to the side, rotate the forearm up and out toward the ceiling as far as the shoulder allows, pause, and lower slowly.
// Only the forearm swings - no rolling the trunk back. A water bottle can be held for load. 2 reps / 8 s: 1.2 s up, 0.6 s
// pause, 1.6 s lower, 0.6 s rest.
// Head points +X, front faces +Z (camera side), body left = -Y (down) - frame of w-clamshell. Right hand in the chest frame (rest
// coordinates): the forearm swings about the vertical (rest) upper-arm axis through the elbow, PSI from forward (+ = outward).
import { REST, leg, rot, restToWorld, restPtW, footRotW, r4 } from '../lib/ss-geo.mjs';
import { build, keys } from '../lib/home-anim.mjs';
const DUR = 8, TW = 36, PS0 = -42, PS1 = 48, FA = 0.2281, DEG = Math.PI / 180;
const P0 = [-0.45, 0.165, 0];
const hips = { up: [1, 0, 0], front: [0, 0, 1], rot: [[[0, 0, 1], 0]] };
const WR = [0, 1.0408, 0.0059];
const W = restPtW(hips, P0, WR);
const chestPt = p => r4(W.map((x, i) => x + rot(restToWorld(hips, p.map((v, j) => v - WR[j])), [0, 0, 1], TW)[i]));
const SL = chestPt(REST.shoulder('left'));
const EY = 0.045, dy = SL[1] - EY, hz = Math.sqrt(0.2567 ** 2 - dy * dy);
const EL = r4([SL[0] + hz, EY, SL[2]]);
const FL = leg('left', 45, 90, [[[0, 0, 1], 1.4]]), FR = leg('right', 45, 90, [[[0, 0, 1], 7.4]]);
const poleOf = (L, K) => { const m = L.ankle.map((x, i) => (x + L.hip[i]) / 2); return r4(K.map((x, i) => x + 2 * (x - m[i]))); };
const FROT = footRotW(hips, [[[1, 0, 0], 55]]);
const p = keys([[0, 0], [0.3, 0], [1.5, 1], [2.1, 1], [3.7, 0], [4.3, 0], [5.5, 1], [6.1, 1], [7.7, 0]], DUR);
const psi = t => (PS0 + (PS1 - PS0) * p(t)) * DEG;
const SR = REST.shoulder('right'), ER = [SR[0] - 0.03, SR[1] - 0.2567 * 0.995, SR[2] + 0.012];
const d = t => [-Math.sin(psi(t)), 0, Math.cos(psi(t))];
const n = t => [Math.cos(psi(t)), 0, Math.sin(psi(t))];
const P = build(DUR, {
  pelvis: P0,
  hips,
  chest: { waist: [[[0, 0, 1], TW]] },
  hands: {
    left: { mode: 'floor', at: [EL[0], +(EL[2] + 0.228).toFixed(4)], finger: [0.0, 1], pole: EL },
    right: { mode: 'free', frame: 'chest', wrist: t => r4(ER.map((x, i) => x + d(t)[i] * FA)), finger: t => r4(d(t)), normal: t => r4(n(t)), poleUp: [-0.15, 0.6, -0.05] },
  },
  feet: {
    left: { mode: 'free', frame: 'hips', ankle: FL.ankle, rot: FROT, poleLow: poleOf(FL, FL.knee) },
    right: { mode: 'free', frame: 'hips', ankle: FR.ankle, rot: FROT, poleLow: poleOf(FR, FR.knee) },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { rot: p });
export default {
  id: 'h-side-er', name: '侧卧肩外旋', nameEn: 'Side-Lying External Rotation',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['rotator-cuff'], side: 'right', pulseTrack: 'rot', pulseBase: 0.3 },
  camera: { dir: [-0.1, 0.9, -0.7], fit: ['head', 'leftPalm', 'leftElbow', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'rightPalm', 'rightElbow'], pad: 0.14, k: 0.8, drift: 3, at: 1.8 },
  frame: { mode: 'fit', width: 840, cx: 512, cy: 540 },
  stillAt: 1.8,
  shadow: { joints: ['leftPalm', 'leftElbow', 'pelvis', 'leftKnee', 'leftAnkle', 'rightAnkle', 'waist'],
    blobs: [{ j: 'leftElbow', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'pelvis', rx: 80, ry: 16, a: 0.55 }, { j: 'leftKnee', rx: 40, ry: 11, a: 0.5 }],
    bands: [{ from: 'leftElbow', to: 'pelvis', mid: 'waist', rx: 60, ry: 13, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.45, 0, 0.12], size: [1.7, 0.61, 0.006] }],
  keyFrames: [0.2, 0.9, 1.8],
  qa: {
    pins: [{ c: 'handL', when: 'always' }],
    straight: [],
    allowContact: ['upperArmR|torso', 'forearmR|torso', 'handR|torso', 'thighL|thighR', 'shinL|shinR', 'footL|footR', 'upperArmL|torso', 'forearmL|torso', 'kneeL|kneeR'],
  },
};
