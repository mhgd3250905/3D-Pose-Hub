// n-chair-wiper 坐椅雨刷（膝内倒） (seated knee drop-in, office chair) · N HipLab 开胯 MVP 新增.
// Sitting tall on the front third of a chair, feet planted wider than the hips, hands resting on the thighs. One knee at a time
// tips slowly IN toward the midline while its foot stays planted and rolls onto the inner edge (hip internal rotation), pause,
// back to centre, then the other knee. The knees never touch. Zero-fail hip internal-rotation relaxation for the desk.
// One cycle (both sides) / 8 s: right knee in 0.3-1.7 s, hold to 2.6 s, back by 3.8 s; left knee 4.3-7.8 s.
// Head +Y, front faces +Z, body left = +X (frame of h-band-hip-ir). Floor feet; each knee is steered by a pole that rotates about
// its own hip-ankle line.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { REST, restPtW, rotAbout } from '../lib/ss-geo.mjs';
const DUR = 8, DROP = 42, SEAT = 0.45, CZ = -0.03;
const PEL = [0, 0.588, 0.06];
const hips = { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] };
const R = keys([[0, 0], [0.3, 0], [1.7, 1], [2.6, 1], [3.8, 0]], DUR);                 // right knee in
const L = keys([[0, 0], [4.3, 0], [5.7, 1], [6.6, 1], [7.8, 0]], DUR);                 // left knee in
const AT = { left: [0.25, 0.44], right: [-0.25, 0.44] };
const pole = (s, t) => { const H = restPtW(hips, PEL, REST.hip(s)), A = [AT[s][0], 0.086, AT[s][1]];
  const up = [A[0] * 0.8 + sg(s) * 0.12, 1.2, 0.95];
  return r4(rotAbout(up, H, A.map((x, i) => x - H[i]), sg(s) * DROP * (s === 'right' ? R(t) : L(t)))); };
const thighHand = (s, x) => ({ mode: 'free', frame: 'world', palmAt: [x, 0.615, 0.28], finger: [0.12 * s, -0.25, 0.96], normal: [0, -1, 0], pole: [0.65 * s, 0.85, 0.15], relax: 1,
  touch: { solve: 'bisect', clear: 0.0008, toward: s > 0 ? 'leftKnee' : 'rightKnee' } });
const P = build(DUR, {
  pelvis: PEL,
  hips,
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: thighHand(1, 0.15), right: thighHand(-1, -0.15) },
  feet: {
    left: { mode: 'floor', at: AT.left, heading: 12, pitch: 0, roll: 0, pole: t => pole('left', t) },
    right: { mode: 'floor', at: AT.right, heading: -12, pitch: 0, roll: 0, pole: t => pole('right', t) },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { turn: t => Math.max(R(t), L(t)) });
export default {
  id: 'n-chair-wiper', name: '坐椅雨刷（膝内倒）', nameEn: 'Seated Knee Drop-In',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hip-abductors', 'glute-max'], side: 'both', pulseTrack: 'turn', pulseBase: 0.3 },
  camera: { dir: [-0.12, 0.42, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.18, k: 1.0, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 640, height: 760, cx: 512, cy: 530 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'leftAnkle', 'rightAnkle', 'rightToe', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'chair', at: [0, 0, CZ], yaw: 0, height: SEAT, width: 0.44, depth: 0.42 }],
  keyFrames: [0.3, 2.0, 6.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    touch: [{ side: 'left', max_gap: 1.0 }, { side: 'right', max_gap: 1.0 }],
    allowContact: ['handL|thighL', 'handR|thighR'],
  },
};
