// h-knee-hug 仰卧抱膝 (supine knees-to-chest) · H 居家核心拉伸系列 (replaces h-child-side, which the rig could not kneel-fold cleanly).
// Supine, head and shoulders relaxed on the mat. Both knees are drawn toward the chest, each hand holding the top of its own shin
// just below the knee. On the exhale the hands pull the knees a little closer and the tailbone curls off the mat (lower back
// lengthens, erectors stretch); on the inhale the grip eases and the knees float back out. 2 breaths / 8 s.
// Head points -X, face up (+Y), body left = -Z (frame of h-reverse-crunch). No solver: the pelvis curls about the waist joint
// (the waist counter-rotates so the rib cage stays on the mat); the palms are carried by the hips frame, on the shins.
import { build, keys, sg, r4, DEG, norm } from '../lib/home-anim.mjs';
import { leg } from '../lib/ss-geo.mjs';
const DUR = 8;
const p = keys([[0, 0], [0.4, 0], [2.2, 1], [2.9, 1], [4.0, 0.0], [4.4, 0], [6.2, 1], [6.9, 1]], DUR);   // 0 = eased, 1 = hugged in
const F = t => 127 + 8 * p(t), K = t => 137 + 5 * p(t), TH = t => 14 + 8 * p(t), ABD = 7;
const W0 = [-0.141, 0.123], P0 = [0.0, 0.122];
const pelvis = t => { const a = TH(t) * DEG, rx = P0[0] - W0[0], ry = P0[1] - W0[1];
  return r4([W0[0] + rx * Math.cos(a) - ry * Math.sin(a), W0[1] + rx * Math.sin(a) + ry * Math.cos(a), 0]); };
const L3 = (s, t) => leg(s, F(t), K(t), [[[0, 0, 1], sg(s) * ABD]]);
const legPose = s => ({ mode: 'free', frame: 'hips', ankle: t => L3(s, t).ankle,
  rot: [[[0, 0, 1], t => -(8 - (F(t) - K(t))) - TH(t) + 22]],
  poleLow: t => { const L = L3(s, t); return r4([L.knee[0] + sg(s) * 0.15, L.knee[1] + 0.2, L.knee[2] + 0.5]); } });
const sub3 = (a, b) => a.map((x, i) => x - b[i]), cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// palm on the outer-top face of the shin, 7 cm below the knee, palm facing the shin, fingers wrapping down and inward
const handGeo = (s, t) => { const L = L3(s, t), ds = norm(sub3(L.ankle, L.knee)), n = norm(cr(sub3(L.knee, L.hip), ds));
  let an = norm(cr(ds, n)); const g = (F(t) - K(t)) * DEG; if (an[1] * Math.sin(g) + an[2] * Math.cos(g) < 0) an = an.map(x => -x);
  const lat = norm(cr(an, ds)).map(x => x * Math.sign(cr(an, ds)[0] * sg(s) || 1));          // points away from the body midline
  const sq = norm(an.map((a, i) => a * 0.85 + lat[i] * 0.53));                               // contact normal: top, tipped outward
  const c = Math.cos(40 * DEG), si = Math.sin(40 * DEG);
  return { palm: r4(L.knee.map((k, i) => k + ds[i] * 0.07 + sq[i] * 0.062)), normal: r4(sq.map(x => -x)),
    finger: r4(norm(ds.map((d, i) => d * c - lat[i] * si))) }; };
const hand = s => ({ mode: 'free', frame: 'hips', palmAt: t => handGeo(s, t).palm, finger: t => handGeo(s, t).finger, normal: t => handGeo(s, t).normal,
  poleLow: [sg(s) * 0.7, 1.05, 0.15], relax: 0.5 });
const P = build(DUR, {
  pelvis,
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], TH]] },
  chest: { waist: [[[0, 0, 1], t => -TH(t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: legPose('left'), right: legPose('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { hug: p });
export default {
  id: 'h-knee-hug', name: '仰卧抱膝', nameEn: 'Supine Knees-to-Chest',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['erectors', 'glute-max'], side: 'both', pulseTrack: 'hug', pulseBase: 0.35 },
  camera: { dir: [0.1, 0.3, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.75, drift: 3, at: 2.5, fitTimeline: true },
  frame: { mode: 'fit', width: 740, height: 600, cx: 500, cy: 580 },
  stillAt: 2.5,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6, fade: [0.13, 0.25] }, { j: 'waist', rx: 70, ry: 13, a: 0.5 }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 }],
    bands: [{ from: 'shoulderCenter', to: 'waist', mid: 'waist', rx: 70, ry: 13, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.0, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 2.5, 3.6],
  qa: {
    pins: [],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR', 'kneeL|kneeR', 'handL|shinL', 'handR|shinR', 'thighL|torso', 'thighR|torso', 'forearmL|thighL', 'forearmR|thighR', 'forearmL|shinL', 'forearmR|shinR', 'handL|handR', 'handL|thighL', 'handR|thighR'],
  },
};
