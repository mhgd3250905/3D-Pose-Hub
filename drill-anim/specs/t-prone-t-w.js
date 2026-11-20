// t-prone-t-w 俯卧 T-W (prone T and W raises, no Y) · Flare 2.0 练后 专项补强, r3 batch 2a (2026-11-21).
// Standard: tools/flare2-moves-r3/standards/t-prone-t-w.md.
// Lying face down on the mat, legs long, forehead / chest low, neck neutral. T: arms straight out to the sides at shoulder level,
// thumbs pointing up; squeeze the shoulder blades together and lift the arms off the mat, hold 2 s, lower. Then W: elbows tucked in
// toward the ribs (upper arms ~45 deg from the body), elbows bent ~90 deg, forearms pointing toward the head and turned UP (outward
// rotation lifts the hands higher than the elbows); squeeze the shoulder blades and lift, hold 2 s, lower. Arms re-set on the mat
// between the two shapes. Shoulder blades retract (shoulders.shift toward the back, drawn by V5 v5.scapulaShift) during each lift.
// Loop 10 s = one T + one W (10 reps = 10 loops): 0.4-1.4 lift T, 1.4-3.4 hold, 3.4-4.3 lower, 4.3-5.0 arms re-set into W on the
// mat, 5.0-6.0 lift W, 6.0-8.0 hold, 8.0-8.9 lower, 8.9-9.6 arms back out to T on the mat.
// Frame of w-prone-swimmer: head +X, body faces the floor (-Y), body left = -Z. Arms in the chest frame (rest coordinates: +X body
// left, +Y head, +Z front = floor side, -Z = back = ceiling).
import { build, keys } from '../lib/home-anim.mjs';
import { V } from '../lib/flare2-r3.mjs';
const DUR = 10;
const shape = keys([[0, 0], [4.3, 0], [5.0, 1], [8.9, 1], [9.6, 0]], DUR);                     // 0 = T, 1 = W
const lift = keys([[0, 0], [0.4, 0], [1.4, 1], [3.4, 1], [4.3, 0], [5.0, 0], [6.0, 1], [8.0, 1], [8.9, 0]], DUR);
const UA = 0.2567, FA = 0.2281, ARM = 0.4835;
const T_REST = -10.8, T_LIFT = 3;        // T: arm elevation (deg toward the back/ceiling) resting on the mat / lifted
const W_ABD = 45, W_REST = -28, W_LIFT = -11, W_ER0 = 6, W_ER1 = 14;   // W: upper arm from the body, elevation, forearm turned up (deg)
const RETRACT = 0.014;                 // shoulder blades squeezed together at the top (m, toward the back)
const SH = s => [s === 'left' ? 0.1879 : -0.1879, 1.3702, -0.0042];
const sx = s => (s === 'left' ? 1 : -1);
const shiftAt = t => [0, 0, -RETRACT * lift(t)];
// rotate a rest-frame direction up toward the back (-Z) about the body long axis (Y) by deg, for side s
const up = (d, s, deg) => V.rot(d, [0, 1, 0], sx(s) * deg);
function arm(s, t) {
  const l = lift(t), w = shape(t), S = V.add(SH(s), shiftAt(t));
  // T: straight out to the side; thumb toward the back (palm faces the head end); elbow (olecranon) toward the feet
  const dT = up([sx(s), 0, 0], s, T_REST + (T_LIFT - T_REST) * l);
  const T = { wrist: V.add(S, V.mul(dT, ARM)), finger: dT, normal: [0, 1, 0], pole: V.add(V.add(S, V.mul(dT, 0.25)), [0, -0.3, 0]) };
  // W: upper arm out and down toward the hips, forearm toward the head, turned up toward the back by ER
  const a = W_ABD * Math.PI / 180, ev = W_REST + (W_LIFT - W_REST) * l;
  const u = V.norm(up([sx(s) * Math.sin(a), -Math.cos(a), 0], s, ev));
  let f = V.norm(up([sx(s) * Math.cos(a), Math.sin(a), 0], s, ev));
  f = V.norm(V.rot(f, u, -sx(s) * (W_ER0 + (W_ER1 - W_ER0) * l)));      // outward rotation: hand rises toward the back
  const E = V.add(S, V.mul(u, UA)), Wr = V.add(E, V.mul(f, FA));
  const mid = V.mul(V.add(S, Wr), 0.5), pole = V.add(E, V.mul(V.norm(V.sub(E, mid)), 0.3));
  // palm toward the floor (+Z) made perpendicular to the forearm
  const n0 = [0, 0, 1], nW = V.norm(V.sub(n0, V.mul(f, V.dot(n0, f))));
  const W = { wrist: Wr, finger: f, normal: nW, pole };
  const L = (p, q) => p.map((x, i) => x + (q[i] - x) * w);
  // re-setting between T and W on the mat: the hands skim 3 cm above it instead of dragging through it
  const hop = [0, 0, -0.03 * Math.sin(Math.PI * w)];
  return { wrist: V.add(L(T.wrist, W.wrist), hop), finger: V.norm(L(T.finger, W.finger)), normal: V.norm(L(T.normal, W.normal)), pole: L(T.pole, W.pole) };
}
const r4 = a => a.map(x => +x.toFixed(4));
const hand = s => ({ mode: 'free', frame: 'chest', wrist: t => r4(arm(s, t).wrist), finger: t => r4(arm(s, t).finger), normal: t => r4(arm(s, t).normal), poleUp: t => r4(arm(s, t).pole) });
const P = build(DUR, {
  pelvis: [-0.45, 0.141, 0],
  hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 0]] },
  chest: { waist: [[[0, 0, 1], 6]] },
  shoulders: { shift: t => r4(shiftAt(t)) },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'free', frame: 'hips', ankle: [0.083, 0.093, 0.108], rot: [[[0, 0, 1], -80]], poleLow: [0.09, 0.5, -0.6] },
    right: { mode: 'free', frame: 'hips', ankle: [-0.083, 0.093, 0.108], rot: [[[0, 0, 1], -80]], poleLow: [-0.09, 0.5, -0.6] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lift });
export default {
  id: 't-prone-t-w', name: '俯卧 T-W', nameEn: 'Prone T-W Raise',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  v5: { scapulaShift: true },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['scapular', 'deltoids'], side: 'both', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [-0.35, 0.85, 0.55], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftElbow', 'rightElbow'], pad: 0.12, k: 1, drift: 0, at: 2.4, fitTimeline: true },
  frame: { mode: 'fit', width: 880, cx: 520, cy: 540 },
  stillAt: 2.4,
  shadow: { joints: ['pelvis', 'shoulderCenter', 'leftPalm', 'rightPalm'], blobs: [], bands: [] },
  props: [{ type: 'mat', at: [-0.3, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 2.4, 7.0],
  qa: { pins: [], straight: [], allowContact: ['thighL|thighR', 'shinL|shinR'] },
  flare2: { version: 'r3', batch: '2a', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
