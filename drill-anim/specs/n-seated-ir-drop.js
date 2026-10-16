// n-seated-ir-drop 坐姿后撑单膝内倒 (seated hip internal-rotation drop, hands behind) · N HipLab 开胯 MVP 新增.
// Replaces n-9090-ir-lean (90/90 lean toward the back leg): on this rig the twisted 90/90 lean could not keep the palms on the
// mat or the trunk bend under 45 deg after two rounds, so the same passive internal-rotation end range is taught seated.
// Sitting on the mat leaning back on straight arms, hands flat behind the hips, knees bent, feet flat and wide (about twice hip
// width). The RIGHT knee drops slowly IN toward the mat between the feet while the right foot stays planted (the thigh turns in
// = hip internal rotation, a stretch at the outer/back hip), pause, back up; then the LEFT. One cycle (both sides) / 8 s.
// Facing +Z, head up (+Y), body left = +X (frame of h-seated-reachback). Solver: h0 (trunk lean) keeps both arms straight;
// hands and feet pinned; each knee is steered by a pole rotating about its own hip-ankle line.
import { keys, build, sg, r4 } from '../lib/home-anim.mjs';
import { rotAbout } from '../lib/ss-geo.mjs';
const DUR = 8, HX = 0.18, HZ = -0.27, FZ = 0.56, FXF = 0.29, DROP = 52;
const R = keys([[0, 0], [0.3, 0], [1.8, 1], [2.8, 1], [3.9, 0]], DUR);
const L = keys([[0, 0], [4.3, 0], [5.8, 1], [6.8, 1], [7.9, 0]], DUR);
const HIP = s => [sg(s) * 0.085, 0.075, 0.02], ANK = s => [sg(s) * FXF, 0.086, FZ];
const pole = (s, t) => { const H = HIP(s), A = ANK(s), up = [A[0] * 0.9, 0.95, 0.55];
  return r4(rotAbout(up, H, A.map((x, i) => x - H[i]), sg(s) * DROP * (s === 'right' ? R(t) : L(t)))); };
const floorHand = x => ({ mode: 'floor', at: [x, HZ], finger: [Math.sign(x) * 0.15, -1], poleUp: [Math.sign(x) * 0.4, 1.0, -0.4] });
const P = build(DUR, {
  pelvis: [0, 0.119, 0.0],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], -26]] },
  chest: { waist: [[[1, 0, 0], -6]] },
  hands: { left: floorHand(HX), right: floorHand(-HX) },
  feet: {
    left: { mode: 'floor', at: [FXF, FZ], heading: 12, pitch: 0, roll: 0, pole: t => pole('left', t) },
    right: { mode: 'floor', at: [-FXF, FZ], heading: -12, pitch: 0, roll: 0, pole: t => pole('right', t) },
  },
  constraints: [{ type: 'reach', limb: 'leftArm', angle: 176 }, { type: 'reach', limb: 'rightArm', angle: 176 }],
  solve: { vars: ['h0'], reg: { h0: 0.001 }, iters: 40 },
}, { drop: t => Math.max(R(t), L(t)) });
export default {
  id: 'n-seated-ir-drop', name: '坐姿后撑单膝内倒', nameEn: 'Seated Hip Internal-Rotation Drop',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['glute-max', 'hip-abductors'], side: 'both', pulseTrack: 'drop', pulseBase: 0.3 },
  camera: { dir: [0.3, 0.75, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.85, drift: 3, at: 2.2, fitTimeline: true },
  frame: { mode: 'fit', width: 820, height: 720, cx: 512, cy: 540 },
  stillAt: 2.2,
  shadow: { joints: ['pelvis', 'leftAnkle', 'rightAnkle', 'leftPalm', 'rightPalm'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.6 }, { j: 'leftAnkle', rx: 40, ry: 11, a: 0.55 }, { j: 'rightAnkle', rx: 40, ry: 11, a: 0.55 }, { j: 'leftPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'rightPalm', rx: 40, ry: 11, a: 0.6 }],
    bands: [] },
  props: [{ type: 'mat', at: [0, 0, 0.15], size: [0.8, 1.5, 0.006] }],
  keyFrames: [0.2, 2.2, 6.2],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 168 }, { j: 'elbow.left', min: 168 }],
    allowContact: ['thighL|shinL', 'thighR|shinR', 'kneeL|kneeR', 'thighL|thighR'],
  },
};
