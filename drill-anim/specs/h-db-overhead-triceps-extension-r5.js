// h-db-overhead-triceps-extension r5 (2026-10-30, user review #4).
// Fixes: (1) the right hand is the frozen user-accepted webxr-dumbbell-wrist-r1 fist holding its own dumbbell
// (recipe hands = dumbbell-grasp; the left fist's dumbbell is hidden by the recipe); (2) anatomical path: the upper arm
// stays vertical beside the ear and the forearm only flexes at the elbow in the plane of the upper arm and the
// medial-backward direction, so at the bottom it folds down behind the head (rr4 swung it straight backwards at elbow height).
// Body, legs, left hand, timeline and camera are rr4 unchanged; only the right wrist/finger/normal tracks and pole change.
import prior from './h-db-overhead-triceps-extension-rr4.js';
import {gripPoseFixed} from '../../tools/action-completion-v3-r2/fixed-bar-grip-r1.mjs';
const spec = structuredClone(prior);
spec.id = 'h-db-overhead-triceps-extension-r5';
const n = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
const add = (...v) => v.reduce((s, a) => s.map((x, i) => x + a[i])), sc = (a, k) => a.map(x => x * k), dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// Measured on rr4 (remote keyframe probe 2026-10-30): right shoulder, upper-arm and forearm (elbow->wrist) lengths.
const S = [-0.188, 1.295, -0.006], UPPER = 0.257, FORE = 0.228;
export const OHTE = {upperArm: n([0.24, 1, 0.10]), foldDir: [0.5, 0, -0.85], topDeg: 8, bottomDeg: 125};
const u = OHTE.upperArm, E = add(S, sc(u, UPPER));
const m = n(add(OHTE.foldDir, sc(u, -dot(OHTE.foldDir, u))));          // in-plane fold direction, perpendicular to the upper arm
const np = n(cross(u, m));                                             // plane normal (lateral-back side of the hand)
export const poseAt = ext => {
  const th = (OHTE.bottomDeg + (OHTE.topDeg - OHTE.bottomDeg) * ext) * Math.PI / 180;
  const fore = add(sc(u, Math.cos(th)), sc(m, Math.sin(th)));
  const thumb = add(sc(u, Math.cos(th + Math.PI / 2)), sc(m, Math.sin(th + Math.PI / 2)));   // shaft axis, perpendicular to the forearm in the plane
  const zero = gripPoseFixed('right', [0, 0, 0], thumb, np), W = add(E, sc(fore, FORE));
  return {wrist: W, finger: zero.finger, normal: zero.normal, shaft: add(W, sc(zero.wrist, -1)), fore};
};
const tr = spec.timeline.tracks;
const base = poseAt(0);
// rr4 keeps base wrist/finger/normal at 0 and drives them absolutely through k0..k8; keep that.
spec.pose.base.hands.right = {...spec.pose.base.hands.right,
  pole: add(E, sc(u, 0.25), sc(m, -0.35)).map(x => +x.toFixed(4))};
tr.extension.forEach(([t, e], i) => {
  const p = poseAt(e);
  for (let j = 0; j < 3; j++) {
    if (tr['k' + j][i][0] !== t || tr['k' + (3 + j)][i][0] !== t || tr['k' + (6 + j)][i][0] !== t) throw Error('track time mismatch');
    tr['k' + j][i] = [t, +p.wrist[j].toFixed(5), 'linear'];
    tr['k' + (3 + j)][i] = [t, +p.finger[j].toFixed(5), 'linear'];
    tr['k' + (6 + j)][i] = [t, +p.normal[j].toFixed(5), 'linear'];
  }
});
spec.v2plus.handPose = {right: 'open', left: 'open'};
spec.props = [{type: 'dumbbell', attach: 'leftHand'}, {type: 'dumbbell', attach: 'rightHand'}];
spec.reviewed = false; spec.releaseEligible = false; spec.qaStatus = 'candidate-awaiting-user-review';
export default spec;
