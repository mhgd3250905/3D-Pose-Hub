// o-supported-march-lfx1 (legacy-fix r1 batch 4, 2026-11-21, codex/legacy-fix-r1): higher knee lift, built from
// o-supported-march-et1-kn1.js (that file and every older o-supported-march spec unchanged; imported and deep-cloned here).
// Request (开哥 after the batch-3 sample, via hark-sk 20:18): the lifted thigh only reached ~49 deg off vertical (foot ~11 cm off the
// floor). Target: thigh near horizontal (80-90 deg off vertical), knee ~90 deg, shin hanging naturally, toes slightly pulled up
// (ankle a little dorsiflexed); left/right mirrored; alternation, timing (8 s: right 0.3-3.7 s, left 4.3-7.7 s), easing unchanged.
// Standing leg straight and still, left hand on the chair back, right arm hanging, trunk upright, pelvis not moved.
// How: et1-kn1 drives each foot by baked world tracks (ankle xyz k0-2 / k7-9, foot pitch k3 / k10, knee pole xyz k4-6 / k11-13),
// computed for the old leg geometry. Only those 14 tracks are recomputed, row by row on the same time grid, from the v3 leg as the
// hub measures it (hip joint (+-0.0815, 0.9099, -0.0045), thigh 0.4097 m, shin 0.4168 m), with the original lift fraction f(t)
// (tracks rightLift / leftLift, unchanged) driving a planar hip/knee chain:
//   thigh angle off vertical  th = TH0 + (TH1 - TH0) f      (TH0 = the standing value, so f = 0 is the original stance)
//   knee flexion               kf = KF0 + (KF1 - KF0) f
//   ankle = hip + Lt (0,-cos th, sin th) + Ls (0,-cos(th-kf), sin(th-kf));  pole = the knee point (as the original leg() pole)
//   foot pitch (world, about +X; + = toes down) = PITCH1 f
// At f = 0 the ankle lands on the original standing ankle target to 0.1 mm, so the standing leg and both stances are unchanged.
// Pelvis, hips, chest, hands, props, camera, highlight, keyFrames, qa pins: all unchanged.
import base from './o-supported-march-et1-kn1.js';
const TH1 = 85, KF1 = 90, PITCH1 = -4;        // deg: thigh 85 off vertical, knee 90 deg flexion (shin ~5 deg behind vertical), toes 4 deg up in world
const HIP = { left: [0.0815, 0.9099, -0.0045], right: [-0.0815, 0.9099, -0.0045] }, LT = 0.4097, LS = 0.4168;
const STAND = { knee: [0.5005, 0.0123], ankle: [0.0842, -0.0075] };   // hub standing knee / ankle (y, z), measured (batch-3 audit)
const D = Math.PI / 180, r4 = x => +(+x).toFixed(4) + 0;
const TH0 = Math.atan2(STAND.knee[1] - HIP.left[2], HIP.left[1] - STAND.knee[0]) / D;                       // ~2.3
const PH0 = Math.atan2(STAND.ankle[1] - STAND.knee[1], STAND.knee[0] - STAND.ankle[0]) / D;                 // shin off vertical ~-2.7
const KF0 = TH0 - PH0;                                                                                         // ~5.1
const chain = (side, f) => {
  const h = HIP[side], th = (TH0 + (TH1 - TH0) * f) * D, kf = (KF0 + (KF1 - KF0) * f) * D, ph = th - kf;
  const knee = [h[0], h[1] - LT * Math.cos(th), h[2] + LT * Math.sin(th)];
  return { knee, ankle: [h[0], knee[1] - LS * Math.cos(ph), knee[2] + LS * Math.sin(ph)] };
};
const s = structuredClone(base);
s.id = 'o-supported-march-lfx1';
const T = s.timeline.tracks;
const KEYS = { left: { lift: 'leftLift', ankle: ['k0', 'k1', 'k2'], rot: 'k3', pole: ['k4', 'k5', 'k6'] },
  right: { lift: 'rightLift', ankle: ['k7', 'k8', 'k9'], rot: 'k10', pole: ['k11', 'k12', 'k13'] } };
for (const side of ['left', 'right']) {
  const K = KEYS[side], lift = T[K.lift];
  for (const k of [...K.ankle, K.rot, ...K.pole]) if (T[k].length !== lift.length || T[k].some((r, i) => r[0] !== lift[i][0])) throw Error('lfx1: track grid mismatch ' + k);
  lift.forEach(([t, f], i) => {
    const c = chain(side, f);
    K.ankle.forEach((k, j) => { T[k][i] = [t, r4(c.ankle[j]), 'linear']; });
    K.pole.forEach((k, j) => { T[k][i] = [t, r4(c.knee[j]), 'linear']; });
    T[K.rot][i] = [t, r4(PITCH1 * f), 'linear'];
  });
}
export default s;
