// h-db-reverse-curl 站姿双哑铃反握弯举 (standing dumbbell reverse curl) · 缺口批次 1（gap-batch1-20261026，二头肌/肱桡肌）.
// Standing tall, feet hip-width, a light dumbbell in each hand with an overhand (pronated) grip: palms face back at the start and
// down/forward at the top, thumbs pointing in toward the body the whole time. Elbows stay pinned by the ribs; both forearms curl
// up together to about chest height, pause, then lower slowly to long arms. Wrists stay straight, no swinging.
// Distinct from h-db-curl (supinating), h-db-hammer-curl (neutral) and h-band-biceps-curl: pronated grip shifts load toward
// brachioradialis / brachialis; the model has no separate brachioradialis region, so biceps + forearms are highlighted.
// Design prescription (author, this file): 2 reps / 8 s, each rep 0.3 s start, 1.3 s up, 0.4 s pause, 1.6 s down, 0.4 s rest.
// Range is a little shorter than the supinated curl (forearm 30 -> 124 deg from hanging: the bottom keeps a slight elbow bend so the plates clear the thighs). Facing +Z, head +Y, body left = +X.
import { build, keys, sg, r4, REST, armDir } from '../lib/home-anim.mjs';
import { UA, FA } from '../lib/ss-geo.mjs';
import { gripPose, gripAttach, G as GRIP } from '../lib/grip.mjs';
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const FIST = 0.099;
const dbGrip = (side, E, f, a) => { f = nrm(f); a = nrm(sub(a, mul(f, dot(a, f)))); return gripPose(side, add(E, mul(f, FA + FIST)), a, mul(cross(f, a), -sg(side))); };
const DB = side => { const A = gripAttach(side); return { offset: r4(A.offset.map((x, i) => x + 0.022 * GRIP[side].a[i])), rot: A.rot }; };
const DUR = 8;
const p = keys([[0, 0], [0.3, 0], [1.6, 1], [2.0, 1], [3.6, 0], [4.3, 0], [5.6, 1], [6.0, 1], [7.6, 0]], DUR);
const arm = (side, t) => { const q = p(t), S = REST.shoulder(side);
  const E = add(S, mul(armDir(side, 4 + 8 * q, 10), UA)), f = armDir(side, 30 + 94 * q, 3);
  const a = [-sg(side), 0, 0];   // thumb medial throughout = pronated (overhand) grip
  return { S, E, f, a }; };
const hand = side => {
  const g = t => { const A = arm(side, t); return dbGrip(side, A.E, A.f, A.a); };
  const pole = t => { const A = arm(side, t); return r4(add(A.E, [sg(side) * 0.06, 0.02, -0.3])); };
  return { mode: 'free', frame: 'chest', relax: 0, wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal, poleUp: pole };
};
const P = build(DUR, {
  pelvis: [0, 0.888, 0.006],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.12, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { curl: p });
export default {
  id: 'h-db-reverse-curl', name: '站姿双哑铃反握弯举', nameEn: 'Standing Dumbbell Reverse Curl',
  modelProfile: 'training-human-v2plus', alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  fps: 30, size: 1080,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['biceps', 'forearms'], side: 'both', pulseTrack: 'curl', pulseBase: 0.3 },
  camera: { dir: [0.75, 0.15, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.14, k: 0.85, drift: 0, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 700, height: 880, cx: 512, cy: 505 },
  stillAt: 1.8,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'rightHand', ...DB('right') },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'leftHand', ...DB('left') },
  ],
  keyFrames: [0.2, 1.8, 3.0, 4.2],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [],
    allowContact: [],
  },
};
