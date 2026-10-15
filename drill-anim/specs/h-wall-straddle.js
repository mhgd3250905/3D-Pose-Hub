// h-wall-straddle 靠墙仰卧 V 字分腿 (legs-up-the-wall straddle) · H 居家开胯系列.
// Lying on the back with the hips close to a wall, both legs straight up the wall, heels resting on it. The legs slowly slide
// apart down the wall into a wide V and let gravity open the inner thighs (adductors, inner hamstrings); hold for two breaths,
// then slide the legs back together. Arms rest on the mat. 1 rep / 8 s: 3.0 s open, 2.4 s hold, 2.0 s close, 0.6 s rest.
// Head points -X, face up (+Y), body left = -Z (frame of h-knee-hug); wall face at x = XW facing -X. No solver.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { leg, restToWorld, footRotW } from '../lib/ss-geo.mjs';
const DUR = 8, F = 86, A0 = 9, A1 = 46, XW = 0.165;
const p = keys([[0, 0], [0.3, 0], [3.3, 1], [5.7, 1], [7.7, 0]], DUR);
const br = keys([[0, 0], [3.3, 0], [4.5, 1], [5.7, 0]], DUR);   // breath: legs sink 2 deg more on the exhale
const hips = { up: [-1, 0, 0], front: [0, 1, 0], rot: [] };
const ang = t => A0 + (A1 - A0) * p(t) + 2 * br(t);
const L = (s, t) => leg(s, F, 2, [[[0, 1, 0], sg(s) * ang(t)]]);
const legDesc = s => ({ mode: 'free', frame: 'hips', ankle: t => L(s, t).ankle,
  rot: footRotW(hips, [[[1, 0, 0], -F + 18 + 0.0001], [[0, 1, 0], 0]]).map((r, i) => i === 1 ? [r[0], t => sg(s) * ang(t)] : r),
  poleLow: t => { const K = L(s, t).knee; return r4([K[0] + sg(s) * 0.12, K[1] + 0.5, K[2] + 0.05]); } });
const hand = s => ({ mode: 'free', frame: 'world', palmAt: [0.0, 0.027, -sg(s) * 0.438], finger: [1, 0, -sg(s) * 0.3], normal: [0, -1, 0], pole: [-0.22, 0.05, -sg(s) * 0.6], relax: 0.6 });
const P = build(DUR, {
  pelvis: [0, 0.114, 0],
  hips,
  chest: { waist: [[[0, 0, 1], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: legDesc('left'), right: legDesc('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { open: p });
export default {
  id: 'h-wall-straddle', name: '靠墙仰卧V字分腿', nameEn: 'Legs-Up-the-Wall Straddle',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors', 'hamstrings'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [-0.8, 0.95, 0.22], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftAnkle', 'rightAnkle'], pad: 0.12, k: 0.8, drift: 3, at: 4.5, fitTimeline: true },
  frame: { mode: 'fit', width: 780, height: 760, cx: 512, cy: 530 },
  stillAt: 4.5,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6 }, { j: 'waist', rx: 70, ry: 13, a: 0.5 }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 13, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.47, 0, 0], size: [1.24, 0.61, 0.006] }, { type: 'wall', at: [XW, 0, 0], yaw: -90, size: [1.7, 1.12, 0.12] }],
  keyFrames: [0.2, 2.0, 4.5],
  qa: {
    pins: [],
    straight: [{ j: 'knee.left', min: 168 }, { j: 'knee.right', min: 168 }],
    allowContact: ['handL|torso', 'handR|torso', 'forearmL|torso', 'forearmR|torso', ],
  },
};
