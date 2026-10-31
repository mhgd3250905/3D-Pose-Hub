// h-goblet-squat r3: kettlebell goblet squat held by the horns. Both hands are the frozen user-accepted webxr-dumbbell-wrist-r1
// fist (dumbbells hidden by the recipe); each fist's 32 mm shaft axis lies on one straight horn of goblet-horns-kettlebell-r1.
// Body motion (pelvis, hips, poles) is the rr1 motion unchanged; only the world-pinned wrists/fingers are re-solved per frame
// so the bell rests on the lower chest. Chest position comes from rr1's own sampled shoulderCenter-pelvis offsets (by squat depth).
import prior from './h-goblet-squat-rr1.js';
import {gripPoseFixed} from '../../tools/action-completion-v3-r2/fixed-bar-grip-r1.mjs';
const spec = structuredClone(prior);
spec.id = 'h-goblet-squat-r3';
spec.nameEn = 'Kettlebell Goblet Squat';
const n = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
const add = (...v) => v.reduce((s, a) => s.map((x, i) => x + a[i])), sc = (a, k) => a.map(x => x * k);
// shoulderCenter - pelvis, sampled from rr1 at down = 0, .309, .611, 1 (remote keyframe probe 2026-10-30).
const OFF = [[0, [0, .407, .009]], [.309, [0, .402, .063]], [.611, [0, .39, .115]], [1, [0, .365, .18]]];
const offAt = d => { for (let i = 1; i < OFF.length; i++) if (d <= OFF[i][0] || i === OFF.length - 1) {
  const [d0, a] = OFF[i - 1], [d1, b] = OFF[i], t = Math.min(1, Math.max(0, (d - d0) / (d1 - d0))); return a.map((x, j) => x + (b[j] - x) * t); } };
export const GOBLET = {halfWidthM: .075, thumbBackRad: .26, bellCentreDownM: .30, bellCentreFwdM: .21, hornCentreAboveBellM: .21};
const tr = spec.timeline.tracks, val = (k, i) => tr[k][i][1];
const W = {left: ['k4', 'k5', 'k6'], right: ['k10', 'k11', 'k12']};
let base = null;
// The bell follows the chest and tilts with the torso (horn axis = torso axis tilted thumbs-back). World-pinned finger/normal
// get their own delta tracks (difference from the standing base) so each fist stays exactly on its horn every frame.
const F = {}, keys = [];
let next = Math.max(...Object.keys(tr).filter(k => /^k\d+$/.test(k)).map(k => +k.slice(1))) + 1;
for (const side of ['left', 'right']) for (const field of ['finger', 'normal']) for (let j = 0; j < 3; j++) {
  const k = 'k' + next++; keys.push([k, side, field, j]); tr[k] = [];
  const path = Array.from({length: j + 1}, (_, q) => q === j ? 1 : {});
  spec.pose.deltas[k] = {hands: {[side]: {[field]: path}}};
}
const poses = tr.down.map(([t, d], i) => {
  const pelvis = [val('k0', i), val('k1', i), val('k2', i)], off = offAt(d), S = add(pelvis, off);
  const u = n(off), fw = n([0, -u[2], u[1]]);
  const ax = n(add(sc(u, Math.cos(GOBLET.thumbBackRad)), sc(fw, -Math.sin(GOBLET.thumbBackRad))));
  const bell = add(S, sc(u, -GOBLET.bellCentreDownM), sc(fw, GOBLET.bellCentreFwdM)), G = add(bell, sc(ax, GOBLET.hornCentreAboveBellM));
  const out = {};
  for (const side of ['left', 'right']) {
    const sx = side === 'left' ? 1 : -1, p = gripPoseFixed(side, add(G, [sx * GOBLET.halfWidthM, 0, 0]), ax, [sx, 0, 0]);
    W[side].forEach((k, j) => { if (tr[k][i][0] !== t) throw Error('track time mismatch'); tr[k][i] = [t, p.wrist[j], tr[k][i][2]]; });
    out[side] = p;
  }
  return out;
});
base = poses[0];
for (const side of ['left', 'right']) Object.assign(spec.pose.base.hands[side], {finger: base[side].finger, normal: base[side].normal});
tr.down.forEach(([t], i) => { for (const [k, side, field, j] of keys) tr[k].push([t, +(poses[i][side][field][j] - base[side][field][j]).toFixed(5), 'linear']); });
spec.props = [{ type: 'dumbbell', attach: 'leftHand' }, { type: 'dumbbell', attach: 'rightHand' }];
spec.reviewed = false; spec.releaseEligible = false; spec.qaStatus = 'candidate-awaiting-user-review';
export default spec;
