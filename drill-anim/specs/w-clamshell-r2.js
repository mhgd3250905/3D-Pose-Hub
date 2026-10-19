// w-clamshell-r2: camera-only revision of w-clamshell (review 2026-10-19, movement-first camera). high camera flattened the side-lying stack; front view shows the side-lying position, feet together and the top knee opening.
// Pose, timeline, props, highlight and QA are byte-identical to the source; only camera.dir changes.
// w-clamshell 侧卧蚌式开合 (side-lying clamshell). Lying on the LEFT side, propped on the left forearm (elbow on the mat, forearm
// pointing forward), hips stacked, hips flexed ~45 deg and knees ~90 deg, feet together. The RIGHT (top) knee opens upward while
// the feet stay touching: the knee orbits the hip-ankle line (exact arc, coordinate tracks for the knee pole), up to 38 deg;
// the pelvis does not roll back. Right hand rests on the top hip. 2 reps / 8 s: 1.0 s open, 1.0 s hold, 1.2 s close, 0.8 s rest.
// Head points +X, front faces +Z (camera side), body left = -Y (down) - frame of hip-abductors-A. No solver.
import { REST, leg, rot, rotAbout, restToWorld, restPtW, footRotW, r4, sampler, track } from '../lib/ss-geo.mjs';
const DUR = 8, OPEN = 38, TH = 0, TW = 36;                 // pelvis incline, waist side-bend (deg, about world +Z: head up)
const P = [-0.45, 0.165, 0];
const hips = { up: [1, 0, 0], front: [0, 0, 1], rot: [[[0, 0, 1], TH]] };
const WR = [0, 1.0408, 0.0059];
const W = restPtW(hips, P, WR);
const chestPt = p => r4(W.map((x, i) => x + rot(restToWorld(hips, p.map((v, j) => v - WR[j])), [0, 0, 1], TW)[i]));
const SL = chestPt(REST.shoulder('left'));
// left elbow on the mat ahead of / toward the head from the shoulder, forearm flat pointing forward (+Z)
const EY = 0.045, dy = SL[1] - EY, hz = Math.sqrt(0.2567 ** 2 - dy * dy);
const EL = r4([SL[0] + hz, EY, SL[2]]);                      // elbow toward the head: upper arm angled, forearm at 90 deg
const ELPOLE = r4([EL[0] + 0.12, EL[1] - 0.25, EL[2] - 0.05]);
// legs (rest frame, carried by the hips): 45/90, shoes ~touching
const FL = leg('left', 45, 90, [[[0, 0, 1], 1.4]]), FR = leg('right', 45, 90, [[[0, 0, 1], 7.4]]);   // both swung 4.4 deg floorward: bottom shoe on the mat
const axR = FR.ankle.map((x, i) => x - FR.hip[i]);
const poleOf = (L, K) => { const m = L.ankle.map((x, i) => (x + L.hip[i]) / 2); return r4(K.map((x, i) => x + 2 * (x - m[i]))); };
const K = [[0, 0], [0.3, 0], [1.3, 1], [2.3, 1], [3.5, 0], [4.3, 0], [5.3, 1], [6.3, 1], [7.5, 0]];
const pAt = sampler(K, DUR);
const poleAt = t => poleOf(FR, rotAbout(FR.knee, FR.hip, axR, OPEN * pAt(t)));
const tracks = { open: track(DUR, pAt) };
const deltas = {};
['x', 'y', 'z'].forEach((c, i) => { tracks['q' + c] = track(DUR, t => poleAt(t)[i]); const u = [0, 0, 0]; u[i] = 1; deltas['q' + c] = { feet: { right: { poleLow: u } } }; });
const FROT = footRotW(hips, [[[1, 0, 0], 55]]);
// Accepted body baseline (drill-anim/AGENTS.md): training-human-v2 with alignClavicles false; pose arithmetic unchanged.
export default { modelProfile: 'training-human-v2', alignClavicles: false,
  id: 'w-clamshell-r2', name: '侧卧蚌式开合', nameEn: 'Side-Lying Clamshell',
  timeline: { duration: DUR, tracks },
  pose: {
    base: {
      pelvis: P,
      hips,
      chest: { waist: [[[0, 0, 1], TW]] },
      hands: {
        left: { mode: 'floor', at: [EL[0], +(EL[2] + 0.228).toFixed(4)], finger: [0.0, 1], pole: EL },   // at = wrist; pole at the elbow target (mid+pole=target)
        right: { mode: 'free', frame: 'hips', palmAt: [-0.15, 1.055, 0.05], finger: [0.05, -0.35, 0.94], normal: [1, 0, 0], poleUp: [-0.55, 1.15, -0.25], touch: { clear: 0.0015, from: 0.0, solve: 'bisect', iters: 16 } },
      },
      feet: {
        left: { mode: 'free', frame: 'hips', ankle: FL.ankle, rot: FROT, poleLow: poleOf(FL, FL.knee) },
        right: { mode: 'free', frame: 'hips', ankle: FR.ankle, rot: FROT, poleLow: [0, 0, 0] },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas,
  },
  highlight: { groups: ['hip-abductors'], side: 'right', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [0.16, 0.42, 0.89], fit: ['head', 'leftPalm', 'leftElbow', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'leftKnee', 'rightElbow'], pad: 0.14, k: 0.75, drift: 3, at: 1.8 },
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
    allowContact: ['handR|torso', 'forearmR|torso', 'handR|thighR', 'thighL|thighR', 'shinL|shinR', 'footL|footR', 'upperArmL|torso', 'forearmL|torso'],
  },
};
