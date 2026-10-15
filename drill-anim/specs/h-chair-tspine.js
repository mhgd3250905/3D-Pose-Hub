// h-chair-tspine 跪姿椅面胸椎伸展 (kneeling chair thoracic extension / puppy stretch on a chair) · H 居家开肩系列.
// Kneeling on the mat in front of a sturdy chair, knees under the hips, toes tucked. Both hands flat on the front of the seat,
// shoulder-width, arms straight. Keeping the hips stacked over the knees, let the chest sink down between the arms toward the floor
// so the upper back arches and the armpits open (thoracic extension + overhead shoulder flexion - the shoulder line of a handstand);
// hold and breathe, then lift the chest back to a flat back. The lower back does not sag. 2 reps / 8 s: 1.4 s sink, 1.4 s hold,
// 1.0 s up, 0.2 s rest.
// Head points +X, face down (-Y), body right = +Z, body left = -Z (frame of h-catcow-quad). Solver: px, py, h0, c0 keep the knees
// pinned, the arms straight on the seat and the shoulders at the driven height. Chair front edge faces the athlete (yaw -90).
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, SEAT = 0.45, CX = 0.62, HX = 0.43, HY = SEAT + 0.012;
const p = keys([[0, 0], [0.2, 0], [1.6, 1], [3.0, 1], [4.0, 0], [4.2, 0], [5.6, 1], [7.0, 1]], DUR);
const seatHand = z => ({ mode: 'free', frame: 'world', palmAt: [HX, HY + 0.012, z], finger: [1, 0, 0], normal: [0, -1, 0], poleUp: [Math.sign(z) * -0.24, 0.95, 0.18] });
export default {
  id: 'h-chair-tspine', name: '跪姿椅面胸椎伸展', nameEn: 'Kneeling Chair Thoracic Extension',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: { sink: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [-0.48, 0.43, -0.0041],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 0]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      hands: { right: seatHand(0.19), left: seatHand(-0.19) },
      feet: {
        left: { mode: 'floor', at: [-0.868, -0.0857], heading: 90, pitch: 62, pole: [-0.515, 0.0407, -0.0857] },
        right: { mode: 'floor', at: [-0.868, 0.0771], heading: 90, pitch: 62, pole: [-0.515, 0.0407, 0.0771] },
      },
      constraints: [
        { type: 'mid', limb: 'leftLeg', at: [-0.5101, 0.0385, -0.0857], weight: 1 },
        { type: 'mid', limb: 'rightLeg', at: [-0.51, 0.0385, 0.0771], weight: 1 },
        { type: 'reach', limb: 'rightArm', angle: 176 }, { type: 'reach', limb: 'leftArm', angle: 176 },
        { type: 'joint', joint: 'shoulderCenter', axis: [0, 1, 0], value: 0.47, weight: 0.8 },
      ],
      solve: { vars: ['px', 'py', 'h0', 'c0'], reg: { px: 1, py: 1, h0: 0.01, c0: 0.02 }, iters: 60 },
    },
    deltas: { sink: { constraints: [{}, {}, {}, {}, { value: 0.35 }] } },
  },
  highlight: { groups: ['lats', 'erectors'], side: 'both', pulseTrack: 'sink', pulseBase: 0.3 },
  camera: { dir: [-0.1, 0.25, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'shoulderCenter'], pad: 0.14, k: 0.8, drift: 4, at: 2.2, fitTimeline: true },
  frame: { mode: 'fit', width: 860, cx: 512, cy: 540 },
  stillAt: 2.2,
  shadow: { joints: ['rightKnee', 'leftKnee', 'leftToe', 'rightToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'leftKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'rightKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'leftToe', rx: 30, ry: 9, a: 0.5 }, { j: 'rightToe', rx: 30, ry: 9, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'leftKnee', mid: 'pelvis', rx: 70, ry: 15, a: 0.2, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.45, 0, 0], size: [1.2, 0.61, 0.006] }, { type: 'chair', at: [CX, 0, 0], yaw: -90, height: SEAT, width: 0.46, depth: 0.42 }],
  keyFrames: [0.1, 1.0, 2.2],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    jointPins: [{ j: 'leftKnee' }, { j: 'rightKnee' }],
    straight: [{ j: 'elbow.right', min: 170 }, { j: 'elbow.left', min: 170 }],
    allowContact: ['thighL|shinL', 'thighR|shinR'],
  },
};
