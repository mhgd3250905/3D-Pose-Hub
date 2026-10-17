// a-thomas HipLab 自测③ 托马斯测试 对比图 (stills A/B/C, same camera and light) · built from n-thomas-test.
// Held poses: t 0-2 s = A 松 (long right leg flat on the mat), 2-4 s = B 一般 (knee pit off the mat, a palm fits under it),
// 4-6 s = C 紧 (right thigh lifted, knee bent). Stills are rendered at frames 15 / 45 / 75 (15 fps). Not a training animation.
// Original n-thomas-test header follows.
// Lying on the back. The left hand draws the LEFT knee toward the chest (palm on the outer shin just below the knee) while the RIGHT leg stays long and relaxed on the mat; the right arm rests long on the mat, palm down. On the exhale the knee comes a little closer and
// the pelvis tucks slightly; the long leg should stay on the floor (if the right thigh lifts, the right hip flexors are short:
// HipLab self-test 3). On the inhale the grip eases. 2 breaths / 8 s. Also a relaxing stretch for the front of the right hip.
// Head points -X, face up (+Y), body left = -Z (frame of h-knee-hug). No solver: the pelvis curls about the waist joint, the
// long leg is counter-extended at the hip by the same angle so it stays on the mat. TIGHT(t) (0 here) lifts the long leg for the
// A/B/C stills of the self-test (a-thomas).
import { build, keys, sg, r4, DEG, norm } from '../lib/home-anim.mjs';
import { leg } from '../lib/ss-geo.mjs';
const DUR = 6;
const p = t => 1;   // knee held in (hugged) in every still
const STEP = t => { t = ((t % DUR) + DUR) % DUR; return t < 2 ? 0 : t < 4 ? 1 : 2; };
const TIGHT = t => [0, 0.4, 1][STEP(t)];   // A / B / C
const F = t => 127 + 5 * p(t), K = t => 135 + 5 * p(t), TH = t => 6 + 6 * p(t), ABD = 5;
const W0 = [-0.141, 0.123], P0 = [0.0, 0.122];
const pelvis = t => { const a = TH(t) * DEG, rx = P0[0] - W0[0], ry = P0[1] - W0[1];
  return r4([W0[0] + rx * Math.cos(a) - ry * Math.sin(a), W0[1] + rx * Math.sin(a) + ry * Math.cos(a), 0]); };
const L3 = t => leg('left', F(t), K(t), [[[0, 0, 1], ABD]]);
const LR = t => leg('right', -TH(t) - 2.5 + 26 * TIGHT(t), 3 + 42 * TIGHT(t));
const sub3 = (a, b) => a.map((x, i) => x - b[i]), cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// palms on the top of the left shin (left hand tipped outward, right hand tipped inward), fingers wrapping round it
const handGeo = (s, t) => { const L = L3(t), ds = norm(sub3(L.ankle, L.knee)), n = norm(cr(sub3(L.knee, L.hip), ds));
  let an = norm(cr(ds, n)); const g = (F(t) - K(t)) * DEG; if (an[1] * Math.sin(g) + an[2] * Math.cos(g) < 0) an = an.map(x => -x);
  const out = norm(cr(an, ds)).map(x => x * Math.sign(cr(an, ds)[0] * sg('left') || 1));   // away from the midline (left side)
  const lat = s === 'left' ? out : out.map(x => -x), d = 0.07, w = 0.53;
  const sq = norm(an.map((a, i) => a * 0.85 + lat[i] * w));
  const c = Math.cos(40 * DEG), si = Math.sin(40 * DEG);
  return { palm: r4(L.knee.map((k, i) => k + ds[i] * d + sq[i] * 0.062)), normal: r4(sq.map(x => -x)),
    finger: r4(norm(ds.map((dd, i) => dd * c - lat[i] * si))) }; };
const handHug = s => ({ mode: 'free', frame: 'hips', palmAt: t => handGeo(s, t).palm, finger: t => handGeo(s, t).finger, normal: t => handGeo(s, t).normal,
  poleLow: [sg(s) * 0.7, 1.05, 0.15], relax: 0.5 });
const P = build(DUR, {
  pelvis,
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], TH]] },
  chest: { waist: [[[0, 0, 1], t => -TH(t)]] },
  hands: { left: handHug('left'),
    // right arm long on the mat beside the right thigh, palm down (free to slide under the long knee in the self-test)
    right: { mode: 'free', frame: 'world', palmAt: [0.02, 0.027, 0.42], finger: [1, 0, 0.25], normal: [0, -1, 0], pole: [-0.22, 0.05, 0.6], relax: 0.6 } },
  feet: {
    left: { mode: 'free', frame: 'hips', ankle: t => L3(t).ankle, rot: [[[0, 0, 1], t => -(8 - (F(t) - K(t))) - TH(t) + 22]],
      poleLow: t => { const L = L3(t); return r4([L.knee[0] + 0.15, L.knee[1] + 0.2, L.knee[2] + 0.5]); } },
    right: { mode: 'free', frame: 'hips', ankle: t => LR(t).ankle, rot: [[[0, 0, 1], t => -TH(t) - 2.5 + 3]],
      poleLow: t => { const L = LR(t); return r4([L.knee[0] - 0.05, L.knee[1], L.knee[2] + 0.5]); } },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { hug: p, step: STEP });
export default {
  id: 'a-thomas', name: '自测·托马斯测试 对比图', nameEn: 'Self-test: Thomas test stills',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hip-flexors'], side: 'right', pulseTrack: 'hug', pulseBase: 1.0 },
  camera: { dir: [0.1, 0.35, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.8, drift: 0, at: 5.0, fitTimeline: true },
  frame: { mode: 'fit', width: 800, height: 600, cx: 512, cy: 580 },
  stillAt: 2.5,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'rightKnee', 'rightAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6 }, { j: 'waist', rx: 70, ry: 13, a: 0.5 }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 },
      { j: 'rightKnee', rx: 45, ry: 10, a: 0.45, fade: [0.06, 0.2] }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.45, fade: [0.06, 0.2] }],
    bands: [{ from: 'shoulderCenter', to: 'waist', mid: 'waist', rx: 70, ry: 13, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.1, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [1.0, 3.0, 5.0],
  qa: {
    pins: [],
    straight: [],
    allowContact: ['handL|shinL', 'thighL|torso', 'forearmL|thighL', 'forearmL|shinL', 'handL|thighL', 'handR|torso', 'forearmR|torso'],
  },
};
