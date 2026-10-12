// w-dead-bug 死虫式 (dead bug). Supine on the mat, low back flat, arms reaching straight up to the ceiling, hips and knees at
// 90/90 (tabletop). The RIGHT arm lowers overhead toward the floor while the LEFT leg extends long and low (heel hovering),
// back to the start, then the other pair. 8 s: two alternating reps (4 s each: 1.2 s out, 0.7 s hold, 1.3 s back, 0.8 s rest).
// Head points -X, face up (+Y), body left = -Z (frame of glute-max-A / abs-A). No solver: the trunk lies still on the mat.
import { REST, UA, FA, r4, leg, sampler, track, DEG, sg } from '../lib/ss-geo.mjs';
const DUR = 8, AR = 0.4838;                                    // ~177 deg elbow (measured)
const armDir = phi => [0, -Math.cos(phi * DEG), Math.sin(phi * DEG)];   // rest frame: arm flexion phi (90 = up to the ceiling)
const wrist = (s, phi) => { const S = REST.shoulder(s), d = armDir(phi); return r4([S[0] - sg(s) * 0.02, S[1] + AR * d[1], S[2] + AR * d[2]]); };
const PH0 = 90, PH1 = 173;                                     // arm up / lowered overhead (hand ~8 cm above the mat)
const hand = (s, phi) => ({ mode: 'free', frame: 'chest', wrist: wrist(s, phi), finger: r4(armDir(phi)), normal: [-sg(s), 0, 0], poleUp: r4([sg(s) * 0.45, 1.25, -0.05]) });
// legs (rest frame): tabletop 90/90 -> extended (hip flexion 9, knee 6)
const legPose = (s, f, k, p) => ({ mode: 'free', frame: 'hips', ankle: leg(s, f, k).ankle, rot: [[[0, 0, 1], -(p - (f - k))]], poleLow: r4([sg(s) * 0.12, 0.62, 0.7]) });
// hips frame here: rest X -> world -Z, so a rotation about rest +X is a rotation about world +Z by the opposite angle
const L0 = [90, 90, 8], L1 = [6, 5, 18];
const KA = [[0, 0], [0.3, 0], [1.5, 1], [2.2, 1], [3.5, 0]], KB = KA.map(([t, v]) => [t + 4, v]);
const pa = sampler([...KA, [4, 0]], DUR), pb = sampler([[0, 0], ...KB], DUR);
// the lowering arm moves on its exact arc about the shoulder (a blended chord would fold the elbow): wrist = S + AR*(0, -cos phi, sin phi)
// with tracks c = -cos(phi) and s = sin(phi) - 1 added on top of the 90 deg base (coordinate tracks, cf. hip-abductors-A)
const phiOf = p => (PH0 + (PH1 - PH0) * p) * DEG;
const arcTracks = (S, pf) => ({ ['c' + S]: track(DUR, t => -Math.cos(phiOf(pf(t)))), ['s' + S]: track(DUR, t => Math.sin(phiOf(pf(t))) - 1) });
const arcDelta = (s, k) => { const h = hand(s, PH0); const add = (v, i, a) => v.map((x, j) => +(x + (j === i ? a : 0)).toFixed(5));
  return { hands: { [s]: k === 'c' ? { wrist: add(h.wrist, 1, AR), finger: add(h.finger, 1, 1) } : { wrist: add(h.wrist, 2, AR), finger: add(h.finger, 2, 1) } } }; };
export default {
  id: 'w-dead-bug', name: '死虫式', nameEn: 'Dead Bug',
  timeline: { duration: DUR, tracks: { a: track(DUR, pa), b: track(DUR, pb), ...arcTracks('R', pa), ...arcTracks('L', pb) } },
  pose: {
    base: {
      pelvis: [0.0, 0.115, 0],
      hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], 0]] },
      hands: { left: hand('left', PH0), right: hand('right', PH0) },
      feet: { left: legPose('left', ...L0), right: legPose('right', ...L0) },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: {
      a: { hands: { right: { poleUp: hand('right', PH1).poleUp } }, feet: { left: legPose('left', ...L1) } },
      b: { hands: { left: { poleUp: hand('left', PH1).poleUp } }, feet: { right: legPose('right', ...L1) } },
      cR: arcDelta('right', 'c'), sR: arcDelta('right', 's'), cL: arcDelta('left', 'c'), sL: arcDelta('left', 's'),
    },
  },
  highlight: { groups: ['abs'], side: 'both', pulseAt: [1.85, 5.85], pulseWidth: 0.9, pulseBase: 0.3 },
  camera: { dir: [0.1, 0.55, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.75, drift: 3, at: 1.85 },
  frame: { mode: 'fit', width: 860, cx: 512, cy: 540 },
  stillAt: 1.85,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6 }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 13, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.05, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.15, 1.85, 5.85],
  qa: {
    pins: [],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }],
    allowContact: ['upperArmR|head', 'upperArmL|head', 'thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
