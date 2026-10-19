// Neutral-grip loaded elbow flexion: keep upper arms still, palms facing inward throughout.
// Distinct from h-db-curl's active supination. Light weights, no trunk swing, 1 easy set of 6 repetitions.
// Fixed model cannot independently highlight brachialis/brachioradialis; biceps is a participating muscle, not exclusive target.
import { build, keys, sg, r4, REST, armDir } from '../lib/home-anim.mjs';
import { UA, FA, DEG } from '../lib/ss-geo.mjs';
import { gripPose, gripAttach, G as GRIP } from '../lib/grip.mjs';
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const FIST = 0.099;   // wrist -> fist centre along the forearm (gripPose geometry)
// fist round a handle at the end of forearm direction f from elbow E, thumb toward a (made perpendicular to f)
const dbGrip = (side, E, f, a) => { f = nrm(f); a = nrm(sub(a, mul(f, dot(a, f)))); return gripPose(side, add(E, mul(f, FA + FIST)), a, mul(cross(f, a), -sg(side))); };
// dumbbell through the baked fist (+22 mm along the grip axis centres it, as in forearms-B / deltoids-B)
const DB = side => { const A = gripAttach(side); return { offset: r4(A.offset.map((x, i) => x + 0.022 * GRIP[side].a[i])), rot: A.rot }; };
const DUR = 8;
const p = keys([[0,0],[.5,0],[2,1],[3,1],[5,0],[6,0],[7.9,0]],DUR);
const arm = (side,t) => {const S=REST.shoulder(side), E=add(S,mul(nrm([sg(side)*.0621,-.2502,.0192]),.25678)), theta=(18+97*p(t))*DEG;
 const f=[0,-Math.cos(theta),Math.sin(theta)], a=[0,Math.sin(theta),Math.cos(theta)];
 return {S,E,f,a};};
const hand = side => {
  const g = t => { const A = arm(side, t); return dbGrip(side, A.E, A.f, A.a); };
  const pole = t => { const A = arm(side, t); return r4(A.E.map((x,i)=>2*x-A.S[i])); };
  return { mode: 'free', frame: 'chest', relax: 0, wrist: t => {const A=arm(side,t);return r4(add(A.E,mul(A.f,.22805)));}, finger: t => g(t).finger, normal: t => g(t).normal, poleUp: pole };
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
}, { curl:p });
export default {
  id: 'h-db-hammer-curl', name: '站姿双哑铃锤式弯举', nameEn: 'Standing Dumbbell Hammer Curl',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['biceps'], side: 'both', pulseTrack: 'curl', pulseBase: 0.3 },
  camera: { dir: [-1, 0.2, 1.2], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.14, k: 0.85, drift: 0, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 860, height: 880, cx: 512, cy: 505 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'rightHand', ...DB('right') },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'leftHand', ...DB('left') },
  ],
  keyFrames: [0.2, 1.0, 2.0, 6.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [],
    allowContact: [],
  },
};
