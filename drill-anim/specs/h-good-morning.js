// h-good-morning 徒手早安式 (bodyweight good morning) · H 居家徒手后链系列.
// Standing tall, feet hip-width, arms crossed on the chest (each palm on the front of the opposite shoulder; hands behind the head clipped the rigid head). Knees unlock a little and
// stay soft; the hips push straight back while the trunk hinges forward as one flat board (no rounding, no squatting) until it
// is close to level and the backs of the thighs are stretched; pause, then drive the hips forward to stand tall.
// 2 reps / 8 s: 0.3 s stand, 1.8 s down, 0.4 s pause, 1.4 s up, 0.1 s stand.
// Knee poles are world points in front of the knees (a hips-frame poleLow rotates with the big hinge and flips the knee).
// Facing +Z, head up (+Y), body left = +X. No solver: pelvis and hip-hinge lean are functions of the rep phase; the crossed hands
// are fixed in the chest frame so they travel with the flat trunk.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8, L0 = 3, L1 = 74;
const p = keys([[0, 0], [0.3, 0], [2.1, 1], [2.5, 1], [3.9, 0], [4.3, 0], [6.1, 1], [6.5, 1], [7.9, 0]], DUR);
const TOP = [0, 0.884, 0.006], BOT = [0, 0.795, -0.205];
const lean = t => L0 + (L1 - L0) * p(t);
// arms crossed on the chest (erectors-C / quadriceps-A hands: each palm on the front of the opposite shoulder, palmAt)
// (no touch solve: the bisect snap stalled the training-human-v2 page; palms sit ~1 cm proud of the chest instead)
const chestHand = (at, fin, pole) => ({ mode: 'free', frame: 'chest', palmAt: at, finger: fin, normal: [0, -0.25, -1], poleUp: pole });
const P = build(DUR, {
  pelvis: t => r4(TOP.map((x, i) => x + (BOT[i] - x) * p(t))),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], lean]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { right: chestHand([0.106, 1.335, 0.152], [0.55, 0.45, -0.5], [-0.12, 1.10, 0.22]), left: chestHand([-0.074, 1.312, 0.166], [-0.55, 0.45, -0.5], [0.10, 1.10, 0.24]) },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 5, pitch: 0, pole: [0.2, 0.5, 0.9] },
    right: { mode: 'floor', at: [-0.12, 0.0], heading: -5, pitch: 0, pole: [-0.2, 0.5, 0.9] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { hinge: p });
export default {
  id: 'h-good-morning', name: '徒手早安式', nameEn: 'Bodyweight Good Morning',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hamstrings', 'erectors'], side: 'both', pulseTrack: 'hinge', pulseBase: 0.3 },
  camera: { dir: [1, 0.25, -0.2], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'], pad: 0.14, k: 0.9, drift: 3, at: 2.3, fitTimeline: true },
  frame: { mode: 'fit', width: 820, height: 860, cx: 512, cy: 510 },
  stillAt: 0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [],
  keyFrames: [0.2, 1.2, 2.3],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    allowContact: ['handR|torso', 'forearmR|torso', 'handL|torso', 'forearmL|torso', 'forearmL|forearmR', 'handL|forearmR', 'handR|forearmL'],
  },
};
