// n-seated-squeeze 坐姿夹砖（膝内夹） (seated isometric knee squeeze on a block, office chair) · N HipLab 开胯 MVP 新增.
// Sitting tall on a chair, feet flat hip-width, hands resting on the thighs. A yoga block (or a firm cushion / rolled towel) sits
// between the knees; the knees squeeze it for 5 s (inner thighs / adductors, isometric), ease off, squeeze again. Almost no
// visible motion: meeting-proof strength. 2 squeezes / 8 s.
// Changed from the planned "fists between the knees + hands outside pushing out" pair: after two rounds the palms could not be
// kept on the inside of the rig's knees without sinking into the thighs, so the squeeze uses a block and the push-out half is
// left to a later band version. Head +Y, front faces +Z, body left = +X (frame of h-band-hip-ir). Floor feet; each knee is
// steered by a pole on its own hip-ankle circle.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { REST, restPtW, rotAbout } from '../lib/ss-geo.mjs';
const DUR = 8, SEAT = 0.45, CZ = -0.03, IN = 2.5;
const PEL = [0, 0.588, 0.02];
const hips = { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] };
const sub = (a, b) => a.map((x, i) => x - b[i]);
const sq = keys([[0, 0], [0.3, 0], [0.9, 1], [3.3, 1], [3.9, 0], [4.3, 0], [4.9, 1], [7.3, 1], [7.9, 0]], DUR);
const AT = { left: [0.15, 0.40], right: [-0.15, 0.40] };
const pole = (s, t) => { const H = restPtW(hips, PEL, REST.hip(s)), A = [AT[s][0], 0.086, AT[s][1]];
  const up = [A[0] + sg(s) * 0.07, 1.2, 0.95];
  return r4(rotAbout(up, H, sub(A, H), sg(s) * IN * sq(t))); };
const thighHand = (s, x) => ({ mode: 'free', frame: 'world', palmAt: [x, 0.615, 0.24], finger: [0.06 * s, -0.25, 0.96], normal: [0, -1, 0], pole: [0.65 * s, 0.85, 0.15], relax: 1,
  touch: { solve: 'bisect', clear: 0.0008, toward: s > 0 ? 'leftKnee' : 'rightKnee' } });
const P = build(DUR, {
  pelvis: PEL,
  hips,
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: thighHand(1, 0.14), right: thighHand(-1, -0.14) },
  feet: {
    left: { mode: 'floor', at: AT.left, heading: 4, pitch: 0, pole: t => pole('left', t) },
    right: { mode: 'floor', at: AT.right, heading: -4, pitch: 0, pole: t => pole('right', t) },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { work: sq });
export default {
  id: 'n-seated-squeeze', name: '坐姿夹砖（膝内夹）', nameEn: 'Seated Block Knee Squeeze',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors'], side: 'both', pulseTrack: 'work', pulseBase: 0.35 },
  camera: { dir: [-0.3, 0.95, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.18, k: 1.0, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 640, height: 760, cx: 512, cy: 530 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'leftAnkle', 'rightAnkle', 'rightToe', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'chair', at: [0, 0, CZ], yaw: 0, height: SEAT, width: 0.44, depth: 0.42 },
    { type: 'mat', at: [0, 0.6, 0.36], size: [0.09, 0.2, 0.12] }],
  keyFrames: [0.3, 2.0, 4.1],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    touch: [{ side: 'left', max_gap: 1.0 }, { side: 'right', max_gap: 1.0 }],
    allowContact: ['handL|thighL', 'handR|thighR'],
  },
};
