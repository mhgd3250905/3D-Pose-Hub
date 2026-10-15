// h-wall-calf 靠墙小腿拉伸 (wall calf stretch, straight back leg) · H 居家小腿系列.
// Facing a wall in a split stance, both palms on the wall at shoulder height. The RIGHT leg is back, knee locked straight, the
// whole heel pressed into the floor, toes pointing straight at the wall; the left leg is forward with the knee bent. Keeping one
// straight line from the right heel through the hip to the head, lean the hips toward the wall (arms bend) until a stretch is felt
// in the right calf, hold and breathe, then ease back a little. 8 s loop: 1.8 s lean in, 3.4 s hold with a slow breath, 1.8 s ease.
// Facing +Z, head up (+Y), body left = +X. No solver: the right hip is put on the straight heel->hip line at lean ALPHA (deg from
// vertical), the pelvis follows from it; the wall and hands are fixed.
import { REST, restPtW, restToWorld, r4 } from '../lib/ss-geo.mjs';
import { build, keys } from '../lib/home-anim.mjs';
const DUR = 8, A0 = 18, A1 = 23, LEGR = 0.760, ZB = -0.38, XB = -0.1;
const p = keys([[0, 0], [0.5, 0], [2.3, 1], [5.7, 1], [7.5, 0]], DUR);
const br = t => (1 - Math.cos(2 * Math.PI * Math.max(0, Math.min(1, (t - 2.3) / 3.4)))) / 2;     // one slow breath during the hold
const alpha = t => A0 + (A1 - A0) * p(t) + 0.8 * br(t);
const DEG = Math.PI / 180;
const hipsAt = a => ({ up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], a]] });
const pelvisAt = a => { const H = [XB + 0.02, 0.084 + LEGR * Math.cos(a * DEG), ZB + LEGR * Math.sin(a * DEG)];
  const o = restToWorld(hipsAt(a), REST.hip('right').map((x, i) => x - REST.pelvis[i])); return r4(H.map((x, i) => x - o[i])); };
const P1 = pelvisAt(A1 + 0.8), S1 = restPtW(hipsAt(A1 + 0.8), P1, REST.shoulder('left'));
const WZ = +(S1[2] + 0.38).toFixed(4), HY = +(S1[1] - 0.04).toFixed(4);
const P0 = pelvisAt(A0), ZF = +(P0[2] + 0.17).toFixed(4);
const wallHand = s => ({ mode: 'free', frame: 'world', wrist: [s * 0.22, HY, WZ - 0.028], finger: [0, 1, 0.0], normal: [0, 0, 1], poleUp: [s * 0.55, 0.95, -0.1] });
const P = build(DUR, {
  pelvis: t => pelvisAt(alpha(t)),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], alpha]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: wallHand(1), right: wallHand(-1) },
  feet: {
    left: { mode: 'floor', at: [0.11, ZF], heading: 3, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [XB, ZB], heading: 0, pitch: 0, poleLow: [-0.15, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lean: p });
export default {
  id: 'h-wall-calf', name: '靠墙小腿拉伸', nameEn: 'Wall Calf Stretch',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['calves'], side: 'right', pulseTrack: 'lean', pulseBase: 0.35 },
  camera: { dir: [-1, 0.14, 0.12], fit: ['head', 'leftToe', 'rightToe', 'rightAnkle', 'pelvis', 'leftKnee', 'leftPalm', 'rightPalm'], pad: 0.14, k: 1.0, drift: 3, at: 3.5 },
  frame: { mode: 'fit', width: 820, height: 820, cx: 512, cy: 515 },
  stillAt: 3.5,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'wall', at: [0, 0, WZ], yaw: 180, size: [1.3, 2.2, 0.12] }],
  keyFrames: [0.2, 1.4, 3.5],
  qa: {
    pins: [{ c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'knee.right', min: 170 }],
    allowContact: [],
  },
};
