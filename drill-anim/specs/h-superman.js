// h-superman 俯卧超人式 (prone superman) · H 居家徒手后链系列.
// Prone on the mat, legs long with the tops of the feet down, both arms reaching straight overhead a little wider than the
// shoulders, palms down. Squeezing the glutes and the long back muscles, the arms, chest and both legs lift off the mat together
// (upper-back extension ~16 deg, hip extension ~13 deg, arms ~16 deg off the mat), the pelvis and belly stay down, the gaze stays
// on the mat; hold, then lower slowly. 2 reps / 8 s: 0.2 s rest, 1.2 s up, 1.5 s hold, 1.0 s down, 0.1 s rest.
// Head points +X, face down (-Y), body left = -Z (frame of w-prone-swimmer / h-cobra). No solver: the waist bend, the arm
// elevation (chest frame, swimmer geometry) and both straight legs (hips frame, turned about the hip) are functions of the lift.
import { build, keys, sg, r4, REST } from '../lib/home-anim.mjs';
import { leg, DEG } from '../lib/ss-geo.mjs';
const DUR = 8, W0 = 6, W1 = 22, A0 = 3, A1 = 17, EXT = 13, TH = 14, AR = 0.4845;
const p = keys([[0, 0], [0.2, 0], [1.4, 1], [2.9, 1], [3.9, 0], [4.2, 0], [5.4, 1], [6.9, 1], [7.9, 0]], DUR);
// arm direction in the rest frame: TH deg out from straight overhead (+Y), tilted 'up' (rest -Z = off the mat when prone) by phi
const armU = phi => { const c = Math.cos(phi * DEG); return [Math.sin(TH * DEG) * c, Math.cos(TH * DEG) * c, -Math.sin(phi * DEG)]; };
const mir = (s, v) => [sg(s) * v[0], v[1], v[2]];
const hand = s => {
  const S = REST.shoulder(s), ph = t => A0 + (A1 - A0) * p(t);
  return { mode: 'free', frame: 'chest',
    wrist: t => r4(S.map((x, i) => x + mir(s, armU(ph(t)))[i] * AR)),
    finger: t => r4(mir(s, armU(ph(t)))),
    normal: t => { const a = ph(t) * DEG; return r4([0, Math.sin(a) * 0.0, Math.cos(a)]).map((x, i) => i === 1 ? +(Math.sin(a) * Math.cos(TH * DEG)).toFixed(4) : x); },
    poleUp: t => r4(S.map((x, i) => x + mir(s, armU(ph(t)))[i] * 0.26 + [0, 0, -0.2][i])) };
};
// straight leg turned back about the hip (rest frame): 4 deg flexion at rest (matches the prone legs of h-cobra) -> -EXT
// (ankle pulled 0.15 % toward the hip: the rig's real leg is a hair shorter than TH + SH and the IK clamps otherwise)
const ankleAt = (s, t) => { const L = leg(s, 4 - (4 + EXT) * p(t), 2); return r4(L.ankle.map((x, i) => L.hip[i] + (x - L.hip[i]) * 0.9985 + (i === 0 ? sg(s) * 0.0015 : 0))); };
const foot = s => ({ mode: 'free', frame: 'hips', ankle: t => ankleAt(s, t),
  rot: [[[0, 0, 1], t => -80 - (4 + EXT) * p(t)]], poleLow: t => { const K = leg(s, 4 - (4 + EXT) * p(t), 2).knee; return r4([K[0] + sg(s) * 0.01, K[1] - 0.5, K[2] - 0.6]); } });
const P = build(DUR, {
  pelvis: [-0.45, 0.141, 0],
  hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], t => 1.0 * p(t)]] },
  chest: { waist: [[[0, 0, 1], t => W0 + (W1 - W0) * p(t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: foot('left'), right: foot('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lift: p });
export default {
  id: 'h-superman', name: '俯卧超人式', nameEn: 'Prone Superman',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['erectors', 'glute-max'], side: 'both', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [0.3, 0.42, -1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.8, drift: 3, at: 2.2, fitTimeline: true },
  frame: { mode: 'fit', width: 780, height: 560, cx: 512, cy: 560 },   // width 900 put the flat pose's fingertips on the left edge
  stillAt: 2.2,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 15, a: 0.6 }, { j: 'leftPalm', rx: 40, ry: 11, a: 0.5, fade: [0.04, 0.25] }, { j: 'rightPalm', rx: 40, ry: 11, a: 0.5, fade: [0.04, 0.25] },
      { j: 'leftToe', rx: 30, ry: 9, a: 0.45, fade: [0.04, 0.2] }, { j: 'rightToe', rx: 30, ry: 9, a: 0.45, fade: [0.04, 0.2] }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 14, a: 0.25, dy: 5, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.3, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.1, 0.9, 2.2],
  qa: {
    straight: [{ j: 'elbow.left', min: 172 }, { j: 'elbow.right', min: 172 }, { j: 'knee.left', min: 172 }, { j: 'knee.right', min: 172 }],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR', 'upperArmL|head', 'upperArmR|head'],
  },
};
