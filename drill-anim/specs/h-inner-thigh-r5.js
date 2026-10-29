// User hand-only refinement: neutral wrist/forearm alignment and existing relaxed native fingers.
// Torso, pelvis, leg tracks, duration and camera are preserved from r4.
import priorTemplate from './h-inner-thigh-r3.js';
// h-inner-thigh 侧卧内收抬腿 (side-lying inner-thigh lift, bottom-leg adduction) · H 居家臀腿系列.
// Lying on the LEFT side, propped on the left forearm (elbow under the shoulder, as w-clamshell), hips stacked. The top (RIGHT)
// leg bends and its foot stands flat on the mat in front of the bottom knee; the right hand rests on the top hip. The straight
// bottom (LEFT) leg - toes forward, foot flexed - lifts ~17 deg off the mat by squeezing the inner thigh, holds, and lowers
// without touching down hard. 2 reps / 8 s: 1.1 s up, 0.8 s hold, 1.3 s down, 0.8 s rest.
// Head points +X, front faces +Z (camera side), body left = -Y (down) - frame of w-clamshell. No solver.
import { REST, leg, rot, restToWorld, restPtW, footRotW, r4 } from './_home-armfix-r1.mjs';
import { build, keys } from './_home-armfix-r1.mjs';
const DUR = 8, TW = 36, LIFT = 17, REST0 = -1.5;
const P0 = [-0.386029828141, 0.165, -0.001954201688];
const hips = { up: [1, 0, 0], front: [0, 0, 1], rot: [[[0, 0, 1], 0]] };
const WR = [0, 1.08554168, 0.0040458];
const W = restPtW(hips, P0, WR);
const chestPt = p => r4(W.map((x, i) => x + rot(restToWorld(hips, p.map((v, j) => v - WR[j])), [0, 0, 1], TW)[i]));
const SL = chestPt(REST.shoulder('left'));
const EY = 0.045, dy = SL[1] - EY, hz = Math.sqrt(0.2567 ** 2 - dy * dy);
const EL = r4([SL[0] + hz, EY, SL[2]]);
const p = keys([[0, 0], [0.3, 0], [1.4, 1], [2.2, 1], [3.5, 0], [4.3, 0], [5.4, 1], [6.2, 1], [7.5, 0]], DUR);
// bottom leg (rest frame, carried by the hips): straight, 6 deg forward; + about rest Z = toward body left = floorward
const ang = t => REST0 - (REST0 + LIFT) * p(t);
const bottom = t => leg('left', 6, 2, [[[0, 0, 1], ang(t)]]).ankle;
const P = build(DUR, {
  pelvis: P0,
  hips,
  chest: { waist: [[[0, 0, 1], TW]] },
  hands: {
    left: { mode: 'free', frame: 'world', wrist: [0.2949, 0.02799060380588475, 0.2136], finger: [-0.000212131318, -0.074264147879, 0.997238582385], normal: [0, -1, 0], pole: EL, relax: 1 },
    right: { mode: 'free', frame: 'world', wrist: [-0.25314112614411166, 0.40851265368506273, 0.015299861593930465], finger: [0.495834971195, -0.599219606055, 0.628555437387], normal: [0, -1, 0], pole: [-0.3662148887862272, 0.5451627914422537, -0.12803961039726688], relax: 1, touch: { clear: 0.0015, from: 0.0, solve: 'bisect', iters: 16 } },
  },
  feet: {
    left: { mode: 'free', frame: 'hips', ankle: t => r4(bottom(t)), rot: [[[0, 0, 1], ang]], poleLow: [0.09, 0.6, 0.9] },
    right: { mode: 'floor', at: [-0.70, 0.27], heading: -90, pitch: 0, pole: [-0.55, 0.9, 0.35] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lift: p });
const spec = {
  id: 'h-inner-thigh', name: '侧卧内收抬腿', nameEn: 'Side-Lying Inner-Thigh Lift',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors'], side: 'left', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [-0.2, 0.5, 1], fit: ['head', 'leftPalm', 'leftElbow', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'leftKnee', 'rightElbow'], pad: 0.14, k: 0.75, drift: 3, at: 1.8 },
  frame: { mode: 'fit', width: 840, cx: 512, cy: 540 },
  stillAt: 1.8,
  shadow: { joints: ['leftPalm', 'leftElbow', 'pelvis', 'leftKnee', 'leftAnkle', 'rightAnkle', 'waist'],
    blobs: [{ j: 'leftElbow', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'pelvis', rx: 80, ry: 16, a: 0.55 }, { j: 'rightAnkle', rx: 40, ry: 11, a: 0.55 },
      { j: 'leftAnkle', rx: 40, ry: 10, a: 0.45, fade: [0.09, 0.3] }],
    bands: [{ from: 'leftElbow', to: 'pelvis', mid: 'waist', rx: 60, ry: 13, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.45, 0, 0.12], size: [1.7, 0.61, 0.006] }],
  keyFrames: [0.2, 0.9, 1.8],
  qa: {
    pins: [{ c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }],
    touch: [{ side: 'right', when: 'always' }],
    straight: [{ j: 'knee.left', min: 170 }],
    allowContact: ['handR|torso', 'forearmR|torso', 'handR|thighR', 'thighL|thighR', 'shinL|shinR', 'footL|footR', 'upperArmL|torso', 'forearmL|torso', 'thighR|torso'],
  },
};

spec.id = "h-inner-thigh-r5";
spec.modelProfile="training-human-v2plus-hands-native";
spec.runtimeModel={profile:"training-human-v3-armfix",version:"0.1.0-r2"};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:"compression",torso:"base",limbs:"base",hands:"base",skin:"realistic"};
spec.camera=structuredClone(priorTemplate.camera);
spec.reviewed=false;spec.releaseEligible=false;spec.qaStatus="candidate-awaiting-gpu-and-user-review";
export default spec;
