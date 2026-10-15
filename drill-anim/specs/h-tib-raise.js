// h-tib-raise 靠墙勾脚尖 (wall tibialis raise) · H 居家小腿系列.
// Upper back and hips leaning against a wall, feet hip width about 30 cm out from the wall, legs straight. Keeping the heels on the
// floor, pull the toes and the fronts of the feet up toward the shins as high as they go, pause, and lower them under control
// without slapping the floor. Arms hang relaxed. Works the muscle on the front of the shin (shin-splint prevention).
// 2 reps / 8 s: 1.0 s up, 0.7 s hold, 1.5 s lower, 0.8 s rest.
// Facing +Z, head up (+Y), body left = +X; wall face at z = ZW behind the athlete (yaw 0). No solver: the foot pitches toes-up about
// the heel; the ankle shifts back/up so the heel stays put and the straight body rides along.
import { build, keys, armWrist, armDir, sg, r4 } from '../lib/home-anim.mjs';
import { REST, restToWorld } from '../lib/ss-geo.mjs';
const DUR = 8, PH = 28, LEAN = 9, FZ = 0.30, HY = -0.08, HZ = -0.06, DEG = Math.PI / 180;
const p = keys([[0, 0], [0.4, 0], [1.4, 1], [2.1, 1], [3.6, 0], [4.4, 0], [5.4, 1], [6.1, 1], [7.6, 0]], DUR);
const ph = t => PH * p(t) * DEG;
// heel (relative to the ankle) after the toes-up pitch; the ankle moves by -(delta) to keep the heel on its floor spot
const dz = t => { const a = ph(t); return (HZ * Math.cos(a) - HY * Math.sin(a)) - HZ; };
const dy = t => { const a = ph(t); return -(HY * Math.cos(a) + HZ * Math.sin(a)) + HY; };
const hips = { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], -LEAN]] };
// straight body pivoting on the ankle: pelvis on the ankle->hip line, LEAN deg behind vertical
const ANK = [0, 0.084, FZ];
const pelvis0 = (() => { const L = REST.pelvis[1] - 0.084 - 0.0085; return [0, ANK[1] + L * Math.cos(LEAN * DEG), FZ - L * Math.sin(LEAN * DEG) - 0.01]; })();
const SH = (() => { const o = restToWorld(hips, REST.shoulder('left').map((x, i) => x - REST.pelvis[i])); return pelvis0.map((x, i) => x + o[i]); })();
const ZW = +(SH[2] - 0.115).toFixed(4);
const hand = s => ({ mode: 'free', frame: 'chest', wrist: r4(armWrist(s, 4, 9, 0.475, 0.0)), finger: r4(armDir(s, 4, 9)), normal: [-sg(s), 0, 0.15], poleUp: [sg(s) * 0.3, 1.1, -0.4] });
const P = build(DUR, {
  pelvis: t => r4([0, pelvis0[1] + 0.63 * dy(t), pelvis0[2] - dz(t)]),
  hips,
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: t => r4([0.1, FZ - dz(t)]), heading: 2, pitch: t => -PH * p(t), poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: t => r4([-0.1, FZ - dz(t)]), heading: -2, pitch: t => -PH * p(t), poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { up: p });
export default {
  id: 'h-tib-raise', name: '靠墙勾脚尖', nameEn: 'Wall Tibialis Raise',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['tibialis'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 },
  camera: { dir: [1, 0.1, 0.22], fit: ['head', 'leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis', 'leftKnee', 'leftPalm', 'rightPalm'], pad: 0.14, k: 0.95, drift: 3, at: 1.8 },
  frame: { mode: 'fit', width: 700, height: 860, cx: 512, cy: 515 },
  stillAt: 1.8,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 42, ry: 10, a: 0.6 }, { j: 'rightAnkle', rx: 42, ry: 10, a: 0.6 }], bands: [] },
  props: [{ type: 'wall', at: [0, 0, ZW], yaw: 0, size: [1.3, 2.2, 0.12] }],
  keyFrames: [0.2, 0.9, 1.8],
  qa: {
    pins: [],
    straight: [{ j: 'knee.left', min: 170 }, { j: 'knee.right', min: 170 }],
    allowContact: [],
  },
};
