// a-butterfly HipLab 自测① 蝴蝶式膝高 对比图 (stills A/B/C, same camera and light) · built from s-butterfly (upright part).
// Sitting tall, soles together close to the body, hands holding the lower shins. Compare the knees with the ankles:
// A 松 = knees well below ankle level, close to the mat; B 一般 = knees about level with the ankles; C 紧 = knees clearly above
// the ankles (a "roof"). t 0-2 / 2-4 / 4-6 s, stills at frames 15 / 45 / 75 (15 fps). Not a training animation.
// Head points +Y, front faces +Z, body left = +X (frame of s-butterfly). Each knee is placed by a pole rotating about its own
// hip-ankle line (angle from vertical); the palms rest on the shins by surface contact.
import { build, sg, r4 } from '../lib/home-anim.mjs';
import { rotAbout } from '../lib/ss-geo.mjs';
const DUR = 6;
const STEP = t => { t = ((t % DUR) + DUR) % DUR; return t < 2 ? 0 : t < 4 ? 1 : 2; };
const OPEN = [74, 54, 30];                      // knee direction from vertical, deg (A / B / C)
const HIP = s => [sg(s) * 0.0815, 0.072, 0.008], ANK = s => [sg(s) * 0.06, 0.0832, 0.36];
const pole = (s, t) => { const H = HIP(s), A = ANK(s), m = H.map((x, i) => (x + A[i]) / 2), up = [m[0], m[1] + 0.6, m[2]];
  return r4(rotAbout(up, H, A.map((x, i) => x - H[i]), -sg(s) * OPEN[STEP(t)])); };
const touch = { solve: 'bisect', clear: 0.0005, exclude: { left: ['rightHand'], right: ['leftHand'] } };
const P = build(DUR, {
  pelvis: [0, 0.1192, 0],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 6], [[0, 0, 1], 0.7]] },
  chest: { waist: [[[1, 0, 0], 4.0]] },
  hands: {
    left: { mode: 'free', frame: 'world', relax: 0.5, palmAt: t => [0.0998, [0.1515, 0.1515, 0.128][STEP(t)], [0.3323, 0.3323, 0.35][STEP(t)]], finger: [0.5, -0.25, 0.83], normal: [-0.25, -0.95, 0.15], pole: [0.6, 0.4, 0.1], touch },
    right: { mode: 'free', frame: 'world', relax: 0.5, palmAt: t => [-0.0998, [0.1515, 0.1515, 0.128][STEP(t)], [0.3323, 0.3323, 0.35][STEP(t)]], finger: [-0.5, -0.25, 0.83], normal: [0.25, -0.95, 0.15], pole: [-0.6, 0.4, 0.1], touch },
  },
  feet: {
    left: { mode: 'free', frame: 'world', ankle: ANK('left'), rot: [[[0, 0, 1], -75], [[0, 1, 0], -15]], pole: t => pole('left', t), thighTwist: -105.0 },
    right: { mode: 'free', frame: 'world', ankle: ANK('right'), rot: [[[0, 0, 1], 75], [[0, 1, 0], 15]], pole: t => pole('right', t), thighTwist: 105.0 },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { step: STEP, glow: t => 1 });
export default {
  id: 'a-butterfly', name: '自测·蝴蝶式膝高 对比图', nameEn: 'Self-test: butterfly knee height stills',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors'], side: 'both', pulseTrack: 'glow', pulseBase: 1.0 },
  camera: { dir: [0.12, 0.32, 1], fit: ['head', 'leftKnee', 'rightKnee', 'pelvis', 'leftToe', 'rightToe'], pad: 0.2, k: 1.0, drift: 0, at: 5.0, fitTimeline: true },
  frame: { mode: 'fit', width: 640, height: 600, cx: 512, cy: 540 },
  stillAt: 5.0,
  shadow: { joints: ['leftKnee', 'rightKnee', 'pelvis', 'leftAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.5, fade: [0.12, 0.35] }, { j: 'rightKnee', rx: 40, ry: 10, a: 0.5, fade: [0.12, 0.35] }],
    bands: [] },
  props: [{ type: 'mat', at: [0, 0, -0.3], size: [0.61, 1.83, 0.006], yaw: 0 }],
  keyFrames: [1.0, 3.0, 5.0],
  qa: {
    hipFlexMax: 150,
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    touch: [{ side: 'left', max_gap: 1.0 }, { side: 'right', max_gap: 1.0 }],
    allowContact: ['handL|footL', 'handR|footR', 'handL|footR', 'handR|footL', 'footL|footR', 'shinL|shinR', 'handL|shinL', 'handR|shinR', 'forearmL|shinL', 'forearmR|shinR', 'forearmL|thighL', 'forearmR|thighR', 'thighL|shinL', 'thighR|shinR'],
  },
};
