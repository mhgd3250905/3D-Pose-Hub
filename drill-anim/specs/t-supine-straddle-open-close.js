// t-supine-straddle-open-close 仰卧直腿大分腿慢开合 (supine straight-leg straddle, slow open / close) · Flare 2.0 r3 batch 2b (2026-11-21), new id.
// Standard: tools/flare2-moves-r3/standards/t-supine-straddle-open-close.md.
// Lying on the back on the mat, arms long beside the body with the palms on the mat, head down. Both legs straight and raised to
// vertical (hip flexion ~90 deg), feet together, toes softly pointed. Keeping the knees straight and the pelvis / lower back on the
// mat, both legs open slowly and evenly out to the sides into a wide straddle (~40 deg each leg from vertical, ~80 deg between the
// legs; gravity helps, the inner thighs control), pause, then close slowly back together. Both sides at once (symmetric, no mirror).
// Frame of a-supine-cross / glute-max-A: head points -X, face up (+Y), body left = -Z. Pelvis and legs placed; the solver only bends the
// waist (c0) so the shoulders and head rest on the mat with the arms long.
// Loop 8 s = 1 rep: 0.5 s closed, 3.0 s open, 0.5 s pause open, 3.0 s close, 1.0 s closed.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { leg, restToWorld } from '../lib/ss-geo.mjs';
const DUR = 8, FL = 88, KN = 1.5, AB = 40, PT = 30;   // hip flexion, knee bend, abduction each leg at the widest, toe point (deg)
const open = keys([[0, 0], [0.5, 0], [3.5, 1], [4.0, 1], [7.0, 0]], DUR);
const hips = { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[1, 0, 0], 0]] };
// left leg rotates +Ab about the rest vertical (toward rest +X = body left), the right leg -Ab. lib/ss-geo leg() has the thigh/shin of the
// older rig (0.353 / 0.410 m); the v2plus legs measure 0.4103 / 0.4168 m (sandbox V5), so the ankle is put on the leg() direction at the
// v2plus reach for a knee of 180 - KN deg (else the knees bend ~40 deg)
const LT = 0.4103, LS = 0.4168, LR = Math.sqrt(LT * LT + LS * LS - 2 * LT * LS * Math.cos((180 - KN) * Math.PI / 180));
const L = (s, t) => { const g = leg(s, FL, KN, [[[0, 1, 0], sg(s) * AB * open(t)]]), d = g.ankle.map((x, i) => x - g.hip[i]), n = Math.hypot(...d);
  const ankle = r4(g.hip.map((x, i) => x + d[i] / n * LR)), knee = r4(g.hip.map((x, i) => x + (g.knee[i] - g.hip[i]) / 0.353 * LT));
  return { hip: g.hip, knee, ankle }; };
const foot = s => ({ mode: 'free', frame: 'hips', ankle: t => L(s, t).ankle,
  rot: [[restToWorld(hips, [1, 0, 0]), -FL + KN + PT], [restToWorld(hips, [0, 1, 0]), t => +(sg(s) * AB * open(t)).toFixed(3)]],
  poleLow: t => { const K = L(s, t).knee; return r4([K[0], K[1] + 0.5, K[2] + 0.05]); } });   // knee cap toward the head (rest +Y at 90 deg flexion)
// arms long beside the body, palms flat on the mat (the planted flat-palm hands of glute-max-A-r2)
const HC = { left: 0.016937803496130735, right: 0.016938207447515723 };
const hand = s => ({ mode: 'fingertips', at: [0.0, -sg(s) * 0.265], floor: 0, clear: HC[s] - 0.0105, finger: [1, 0, -sg(s) * 0.05], normal: [0, -1, 0], relax: 0, poleUp: [sg(s) * 0.35, 1.1, -0.1] });
const P = build(DUR, {
  pelvis: [0, 0.114, 0],
  hips,
  chest: { waist: [[[0, 0, 1], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: foot('left'), right: foot('right') },
  // torso: shoulders / head down on the mat, arms straight (glute-max-A set-up), pelvis placed
  constraints: [
    { type: 'joint', joint: 'shoulderCenter', axis: [0, 1, 0], value: 0.107, weight: 0.5 },
    { type: 'joint', joint: 'head', axis: [0, 1, 0], value: 0.100, weight: 2 },
    { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: -0.47, weight: 0.1 },
    { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.117, weight: 0.6 },
    { type: 'reach', limb: 'rightArm', angle: 176, weight: 1 }, { type: 'reach', limb: 'leftArm', angle: 176, weight: 1 },
  ],
  solve: { vars: ['px', 'py', 'c0'], reg: { px: 3, py: 0.5, c0: 0.05 } },
}, { open });
export default {
  id: 't-supine-straddle-open-close', name: '仰卧直腿大分腿慢开合', nameEn: 'Supine Straddle Open-Close',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic', handPose: { left: 'palm-floor', right: 'palm-floor' } },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors', 'hip-flexors'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [0.9, 0.55, 0.15], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftAnkle', 'rightAnkle'], pad: 0.12, k: 0.8, drift: 0, at: 3.7, fitTimeline: true },
  frame: { mode: 'fit', width: 880, height: 800, cx: 512, cy: 540 },
  stillAt: 3.7,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftPalm', 'rightPalm'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6 }, { j: 'waist', rx: 70, ry: 13, a: 0.5 }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 },
      { j: 'leftPalm', rx: 30, ry: 9, a: 0.35 }, { j: 'rightPalm', rx: 30, ry: 9, a: 0.35 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 13, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.05, 0, 0], size: [1.83, 0.7, 0.006] }],
  keyFrames: [0.3, 3.7, 6.0],
  qa: { pins: [], straight: [{ j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }], allowContact: ['thighL|thighR', 'shinL|shinR'] },
  flare2: { version: 'r3', batch: '2b', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false,
    doseBrief: '表：慢速开合；草稿 8 次 × 2 组（次数/组数待定）', doseStatus: 'draft (AI, 开哥 to confirm)' },
};
