// h-chair-kickback 扶椅站姿后踢腿 (chair-supported standing glute kickback) · H 居家臀腿系列.
// Standing facing the backrest of a sturdy dining chair, both hands resting on its top rail, trunk hinged forward ~14 deg with a
// neutral spine. The RIGHT leg (knee slightly soft) sweeps straight back to ~34 deg behind vertical by squeezing the glute -
// no arching of the low back, pelvis stays square - holds, and returns until the toes hover beside the standing foot.
// 2 reps / 8 s: 1.2 s back, 0.6 s squeeze, 1.4 s return, 0.8 s rest.
// Head +Y, front faces +Z (toward the chair), body left = +X. No solver: the pelvis is fixed (hinged LEAN deg), the swing
// foot is carried by the pelvis so its leg length matches the standing leg.
import { build, keys, r4 } from '../lib/home-anim.mjs';
import { leg } from '../lib/ss-geo.mjs';
const DUR = 8, LEAN = 14, BACK = 36, CZ = 0.44, RAILY = 0.87, RAILZ = CZ - 0.183;
const p = keys([[0, 0], [0.4, 0], [1.6, 1], [2.2, 1], [3.6, 0], [4.4, 0], [5.6, 1], [6.2, 1], [7.6, 0]], DUR);
// rest-frame flexion of the right thigh (pelvis frame); at the top of the kick the thigh is ~40 deg behind vertical
const flex = t => LEAN + 1 - BACK * p(t);            // standing leg sits at ~20 deg rest flexion (pelvis hinge)
const kneeF = t => 6 + 4 * p(t);
// +1.2 cm (pelvis frame up) so the swing foot hovers ~1 cm beside the standing foot; foot rot undoes the pelvis hinge (toes level)
const ankle = t => { const a = leg('right', flex(t), kneeF(t)).ankle; return [a[0], a[1] + 0.012 + 0.008 * Math.sin(Math.PI * Math.min(1, p(t) * 2.5)), a[2]]; };
const railHand = (x, side) => ({ mode: 'free', frame: 'world', wrist: [x, RAILY + 0.035, RAILZ - 0.045], finger: [0, -0.15, 1], normal: [0, -1, 0.1],
  poleUp: [side === 'left' ? 0.7 : -0.7, 0.4, -0.6] });
const P = build(DUR, {
  pelvis: [0.02, 0.889, -0.03],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], LEAN]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: railHand(0.17, 'left'), right: railHand(-0.17, 'right') },
  feet: {
    left: { mode: 'floor', at: [0.098, -0.04], heading: 4, pitch: 0 },
    right: { mode: 'free', frame: 'hips', ankle: t => r4(ankle(t)), rot: [[[1, 0, 0], t => 3 - LEAN + 22 * p(t)]], poleLow: [-0.1, 0.5, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { kick: p });
export default {
  id: 'h-chair-kickback', name: '扶椅站姿后踢腿', nameEn: 'Chair-Supported Standing Kickback',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['glute-max'], side: 'right', pulseTrack: 'kick', pulseBase: 0.3 },
  camera: { dir: [-1, 0.15, 0.25], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'leftPalm', 'rightPalm'], pad: 0.14, k: 1.0, drift: 3, at: 1.9 },
  frame: { mode: 'fit', width: 700, height: 820, cx: 500, cy: 515 },
  stillAt: 1.9,
  shadow: { joints: ['leftToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.45, fade: [0.09, 0.4] }], bands: [] },
  props: [{ type: 'chair', at: [0, 0, CZ], yaw: 0, height: 0.45, width: 0.44, depth: 0.42 }],
  keyFrames: [0.2, 1.0, 1.9],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }],
    straight: [{ j: 'knee.left', min: 170 }],
    allowContact: [],
  },
};
