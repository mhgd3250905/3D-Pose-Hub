// h-seated-reachback 坐姿后撑滑臀 (seated reach-back / shoulder extension stretch) · H 居家开肩系列.
// Sitting on the mat, knees bent with the feet flat, hands flat on the mat behind the hips, shoulder-width, fingers pointing back
// (away from the body), arms straight. Keeping the hands planted and the chest up, slowly slide the hips forward toward the feet
// so the hands end up further behind you: the front of the shoulders and the chest stretch (shoulder extension - the position of
// back-support moves and bridges). Hold and breathe, slide back. 1 rep / 8 s: 0.4 s rest, 2.6 s slide, 2.2 s hold, 2.4 s back,
// 0.4 s rest.
// Facing +Z, head up (+Y), body left = +X, seated (pelvis frame of s-butterfly). Solver: h0 (trunk lean) keeps both arms straight
// while the pelvis slides forward on the floor; hands and feet pinned.
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8, HX = 0.18, HZ = -0.27, FZ = 0.66, FXF = 0.15;
const p = keys([[0, 0], [0.4, 0], [3.0, 1], [5.2, 1], [7.6, 0]], DUR);
const floorHand = (x, side) => ({ mode: 'floor', at: [x, HZ], finger: [Math.sign(x) * 0.15, -1], poleUp: [Math.sign(x) * 0.4, 1.0, -0.4] });
export default {
  id: 'h-seated-reachback', name: '坐姿后撑滑臀', nameEn: 'Seated Reach-Back Shoulder Stretch',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: { slide: track(DUR, p) } },
  pose: {
    base: {
      pelvis: [0, 0.119, 0.0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], -28]] },
      chest: { waist: [[[1, 0, 0], -6]] },
      hands: { left: floorHand(HX, 'left'), right: floorHand(-HX, 'right') },
      feet: { left: { mode: 'floor', at: [FXF, FZ], heading: 4, pitch: 0, poleLow: [0.3, 0.95, 0.9] }, right: { mode: 'floor', at: [-FXF, FZ], heading: -4, pitch: 0, poleLow: [-0.3, 0.95, 0.9] } },
      constraints: [
        { type: 'reach', limb: 'leftArm', angle: 176 }, { type: 'reach', limb: 'rightArm', angle: 176 },
      ],
      solve: { vars: ['h0'], reg: { h0: 0.001 }, iters: 40 },
    },
    deltas: { slide: { pelvis: [0, 0.119, 0.15] } },
  },
  highlight: { groups: ['chest', 'deltoids'], side: 'both', pulseTrack: 'slide', pulseBase: 0.3 },
  camera: { dir: [1, 0.35, 0.35], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow'], pad: 0.12, k: 0.8, drift: 5, at: 4.0, fitTimeline: true },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 530 },
  stillAt: 4.0,
  shadow: { joints: ['pelvis', 'leftAnkle', 'rightAnkle', 'leftPalm', 'rightPalm'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.6 }, { j: 'leftAnkle', rx: 40, ry: 11, a: 0.55 }, { j: 'rightAnkle', rx: 40, ry: 11, a: 0.55 }, { j: 'leftPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'rightPalm', rx: 40, ry: 11, a: 0.6 }],
    bands: [] },
  props: [{ type: 'mat', at: [0, 0, 0.2], size: [0.61, 1.6, 0.006] }],
  keyFrames: [0.2, 1.7, 4.0],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 168 }, { j: 'elbow.left', min: 168 }],
    allowContact: ['thighL|shinL', 'thighR|shinR'],
  },
};
