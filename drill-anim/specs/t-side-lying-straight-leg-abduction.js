// t-side-lying-straight-leg-abduction 侧卧直腿外展 (side-lying straight-leg hip abduction) · Flare 2.0 cool-down, r2 batch 1
// (2026-11-21). Standard: tools/flare2-moves-r2/standards/t-side-lying-straight-leg-abduction.md. Set-up and frame of w-clamshell-r2
// (that action is untouched): lying on the LEFT side on the mat, propped on the left forearm, hips stacked, right hand on the top hip.
// Both legs long. The top (RIGHT) leg - knee straight, toes pointing forward (not turned up to the ceiling), foot flexed - lifts
// heel first, slightly behind the body line (hip a little extended), to ~35 deg, holds, and lowers slowly without resting on the
// bottom leg in between. The pelvis stays stacked: no rolling back (pelvis orientation is fixed by construction).
// 2 reps / 8 s: 1.1 s up, 0.7 s hold, 1.4 s down, 0.8 s rest. One side shown (the app mirrors for the other side).
// Head points +X, front faces +Z (camera side), body left = -Y (down). No solver.
import { REST, leg, rot, restToWorld, restPtW, footRotW, r4 } from '../lib/ss-geo.mjs';
import { build, keys } from '../lib/home-anim.mjs';
const DUR = 8, TW = 36, REST_ADD = 6.5, LIFT = 35, EXT = 8, DORSI = -14;
const P0 = [-0.45, 0.177, 0];   // r2 check: 0.165 put the bottom foot 10.9 mm into the mat
const hips = { up: [1, 0, 0], front: [0, 0, 1], rot: [[[0, 0, 1], 0]] };
const WR = [0, 1.0408, 0.0059];
const W = restPtW(hips, P0, WR);
const chestPt = p => r4(W.map((x, i) => x + rot(restToWorld(hips, p.map((v, j) => v - WR[j])), [0, 0, 1], TW)[i]));
const SL = chestPt(REST.shoulder('left'));
const EY = 0.045, dy = SL[1] - EY, hz = Math.sqrt(0.2567 ** 2 - dy * dy);
const EL = r4([SL[0] + hz, EY, SL[2]]);
const p = keys([[0, 0], [0.3, 0], [1.4, 1], [2.1, 1], [3.5, 0], [4.3, 0], [5.4, 1], [6.1, 1], [7.5, 0]], DUR);
// top leg (rest frame, carried by the hips): about rest Z, + = toward body left (= floorward here). Resting: REST_ADD onto the
// bottom leg; lifted: REST_ADD - LIFT. Hip extension EXT (leg behind the body line) grows with the lift so the heel leads.
const ang = t => REST_ADD - LIFT * p(t);
// r2 check: the ss-geo leg is shorter than the v3 hub leg, so the exact ankle target bent the top knee to 164 deg at the top; the
// target is pushed 6 % further along hip->ankle (the IK then just straightens the leg; no pin on this foot).
const top = t => { const L = leg('right', -EXT * p(t) - 1, 1, [[[0, 0, 1], ang(t)]]); return { ankle: L.hip.map((h, i) => h + (L.ankle[i] - h) * 1.06) }; };
const bottom = leg('left', 6, 3, [[[0, 0, 1], 2]]);
const P = build(DUR, {
  pelvis: P0,
  hips,
  chest: { waist: [[[0, 0, 1], TW]] },
  hands: {
    left: { mode: 'floor', at: [EL[0], +(EL[2] + 0.228).toFixed(4)], finger: [0.0, 1], pole: EL },
    right: { mode: 'free', frame: 'hips', palmAt: [-0.15, 1.055, 0.05], finger: [0.05, -0.35, 0.94], normal: [1, 0, 0], poleUp: [-0.55, 1.15, -0.25], touch: { clear: 0.0015, from: 0.0, solve: 'bisect', iters: 16 } },
  },
  feet: {
    left: { mode: 'free', frame: 'hips', ankle: r4(bottom.ankle), rot: footRotW(hips, [[[0, 0, 1], 2], [[1, 0, 0], -6]]), poleLow: [0.09, 0.6, 0.9] },
    right: { mode: 'free', frame: 'hips', ankle: t => r4(top(t).ankle), rot: [[[0, 0, 1], t => ang(t)], [[0, 1, 0], -DORSI]], poleLow: [-0.09, 0.6, 0.9] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lift: p });
export default {
  id: 't-side-lying-straight-leg-abduction', name: '侧卧直腿外展', nameEn: 'Side-Lying Straight-Leg Abduction',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hip-abductors'], side: 'right', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [0.1, 0.42, 0.9], fit: ['head', 'leftPalm', 'leftElbow', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'leftKnee', 'rightElbow'], pad: 0.13, k: 1, drift: 0, at: 1.8 },
  frame: { mode: 'fit', width: 900, cx: 512, cy: 540 },
  stillAt: 1.8,
  shadow: { joints: ['leftPalm', 'leftElbow', 'pelvis', 'leftKnee', 'leftAnkle', 'waist'], blobs: [], bands: [] },
  props: [{ type: 'mat', at: [-0.55, 0, 0.12], size: [2.0, 0.61, 0.006] }],
  keyFrames: [0.2, 1.8, 3.0],
  qa: {
    pins: [{ c: 'handL', when: 'always' }, { c: 'footL', when: 'always' }],
    touch: [{ side: 'right', when: 'always' }],
    straight: [{ j: 'knee.right', min: 172 }, { j: 'knee.left', min: 170 }],
    allowContact: ['handR|torso', 'forearmR|torso', 'handR|thighR', 'thighL|thighR', 'shinL|shinR', 'footL|footR', 'upperArmL|torso', 'forearmL|torso'],
  },
  flare2: { version: 'r2', batch: 1, status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
