// h-hip-gate 扶椅站姿开髋门 (chair-supported standing hip gate opener / closer) · H 居家开胯系列.
// Standing tall side-on to a sturdy chair, the LEFT hand on its backrest, the right hand on the right hip. "Open the gate":
// the RIGHT knee lifts in front to hip height, swings out to the side as far as the hip allows (hip external rotation /
// abduction with the knee bent), then lowers back down beside the standing leg. Then "close the gate": the same arc in
// reverse (out to the side -> sweep across to the front -> down). Pelvis and trunk stay square and tall.
// 1 open + 1 close / 8 s. Facing +Z, head +Y, body left = +X; chair to the left. No solver: the swing leg is carried by the
// pelvis (rest-frame flexion / outward yaw / knee bend from eased key poses).
import { build, keys, r4 } from '../lib/home-anim.mjs';
import { leg, footRotW, rotAbout } from '../lib/ss-geo.mjs';
const DUR = 8, CX = 0.545, RAILY = 0.87;
// key poses (flex, outward yaw, knee): A stand -> B knee up front -> C knee out to the side -> D lowering at the side -> A
const KP = { A: [3, 0, 12], B: [86, 0, 96], C: [80, 62, 96], D: [28, 58, 70] };
const seq = (names, t0, t1) => names.map((n, i) => [t0 + (t1 - t0) * i / (names.length - 1), KP[n]]);
const path = [...seq(['A', 'B', 'C', 'D', 'A'], 0.3, 3.8), ...seq(['A', 'D', 'C', 'B', 'A'], 4.2, 7.7).slice(1)];
const comp = j => keys([[0, KP.A[j]], ...path.map(([t, v]) => [t, v[j]])].filter((k, i, a) => i === 0 || k[0] > a[i - 1][0]), DUR);
const F = comp(0), Y = comp(1), K = comp(2);
const hips = { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] };
const L = t => leg('right', F(t), K(t), [[[0, 1, 0], -Y(t)]]);
const pole = t => { const l = L(t), m = l.ankle.map((x, i) => (x + l.hip[i]) / 2); const fwd = rotAbout([0, 0, 1], [0, 0, 0], [0, 1, 0], -Y(t));
  return r4(l.knee.map((x, i) => x + 2 * (x - m[i]) + 0.35 * fwd[i])); };
const lift = t => Math.min(1, F(t) / 80);
// the swing foot only follows the shin pitch once the thigh is clear of the floor (flex 15 -> 50 deg), so it stands flat at A
const pw = t => Math.max(0, Math.min(1, (F(t) - 15) / 35));
const P = build(DUR, {
  pelvis: [0.035, 0.889, 0.0],
  hips,
  chest: { waist: [[[1, 0, 0], 0], [[0, 0, 1], 2]] },
  hands: {
    left: { mode: 'free', frame: 'world', wrist: [CX - 0.183 - 0.01, RAILY + 0.035, 0.03], finger: [0.15, -0.15, 1], normal: [0, -1, 0.05], poleUp: [0.75, 0.6, -0.4] },
    right: { mode: 'free', frame: 'hips', palmAt: [-0.16, 0.99, 0.02], finger: [0.1, -0.3, 0.95], normal: [1, 0, 0], poleUp: [-0.6, 1.15, -0.3], touch: { clear: 0.0015, from: 0.0, solve: 'bisect', iters: 16 } },
  },
  feet: {
    left: { mode: 'floor', at: [0.1, 0.0], heading: 4, pitch: 0, poleLow: [0.15, 0.55, 1] },
    right: { mode: 'free', frame: 'hips', ankle: t => r4(L(t).ankle),
      rot: footRotW(hips, [[[1, 0, 0], 0], [[0, 1, 0], 0]]).map((r, i) => [r[0], i === 0 ? (t => (-(F(t) - K(t)) + 12 * lift(t)) * pw(t)) : (t => -Y(t))]),
      poleLow: pole },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lift });
export default {
  id: 'h-hip-gate', name: '扶椅站姿开髋门', nameEn: 'Chair-Supported Hip Gate Opener',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hip-flexors', 'hip-abductors'], side: 'right', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [-0.95, 0.35, 0.75], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'leftPalm', 'rightAnkle'], pad: 0.14, k: 0.9, drift: 3, at: 1.6, fitTimeline: true },
  frame: { mode: 'fit', width: 720, height: 820, cx: 512, cy: 515 },
  stillAt: 1.6,
  shadow: { joints: ['leftToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.45, fade: [0.09, 0.4] }], bands: [] },
  props: [{ type: 'chair', at: [CX, 0, 0.0], yaw: 90, height: 0.45, width: 0.44, depth: 0.42 }],
  keyFrames: [0.2, 1.2, 1.6],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'handL', when: 'always' }],
    touch: [{ side: 'right', when: 'always' }],
    allowContact: ['handR|torso', 'handR|thighR', 'forearmR|torso'],
  },
};
