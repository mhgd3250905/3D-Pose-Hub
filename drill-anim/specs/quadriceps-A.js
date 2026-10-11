// quadriceps-A 跪姿反向北欧 (reverse Nordic). Tall kneel on the mat: knees pinned (two-bone knee at a world point, world knee
// pole = the same point), toes tucked (like forearms-A). 'lean' tips the whole knee->shoulder line back as one rigid piece
// (no fold at the hip: the pelvis is constrained onto the thigh line, pelvis rotation = lean), then returns.
// Arms crossed on the chest like the reference: each palm rests on the front of the opposite shoulder (palmAt + touch bisect,
// right forearm crossing over the left).
// Front points +X, up +Y, body left = -Z. 2 reps / 8 s: 1.3 s back, 0.8 s hold, 1.2 s up, 0.7 s rest.
const KX = 0.0, KY = 0.0765, KZ = 0.0857, FX = -0.376;
const LEAN = 30, HK = 0.40;                                      // lean back, deg; knee -> pelvis joint distance (thigh + hip offset)
const hand = (s, at, fin, pole, clear = 0.0015) => ({ mode: 'free', frame: 'chest', palmAt: at, finger: fin, normal: [0, -0.25, -1], poleUp: pole,
  touch: { clear, from: 0.0, solve: 'bisect', iters: 16 } });
export default {
  id: 'quadriceps-A', name: '跪姿反向北欧', nameEn: 'Reverse Nordic',
  timeline: { duration: 8, tracks: { lean: [[0, 0], [0.4, 0], [1.7, 1], [2.5, 1], [3.7, 0], [4.4, 0], [5.7, 1], [6.5, 1], [7.7, 0]] } },
  pose: {
    base: {
      pelvis: [KX, KY + HK, 0],
      hips: { up: [0, 1, 0], front: [1, 0, 0], rot: [[[0, 0, 1], 0]] },
      hands: { right: hand('right', [0.12, 1.33, 0.12], [0.55, 0.45, -0.5], [-0.12, 1.10, 0.22]), left: hand('left', [-0.085, 1.31, 0.11], [-0.55, 0.45, -0.5], [0.10, 1.10, 0.24], 0.0024) },
      feet: {
        right: { mode: 'floor', at: [FX, KZ], heading: 90, pitch: 62, pole: [KX, KY, KZ] },
        left: { mode: 'floor', at: [FX, -KZ], heading: 90, pitch: 62, pole: [KX, KY, -KZ] },
      },
      constraints: [
        { type: 'mid', limb: 'rightLeg', at: [KX, KY, KZ], weight: 1 }, { type: 'mid', limb: 'leftLeg', at: [KX, KY, -KZ], weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: KX, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 0.3, py: 0.3, pz: 1 }, iters: 60 },
    },
    deltas: { lean: { hips: { rot: [[[0, 0, 1], LEAN]] }, constraints: [{}, {}, { value: +(KX - HK * Math.sin(LEAN * Math.PI / 180)).toFixed(4) }] } },
  },
  highlight: { groups: ['quadriceps'], side: 'both', pulseAt: [2.1, 6.1], pulseWidth: 0.7, pulseBase: 0.3 },
  camera: { dir: [0.25, 0.2, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.75, drift: 0.9, at: 2.1 },
  frame: { mode: 'fit', width: 2000, height: 730, cx: 512, cy: 560 },
  stillAt: 2.1,
  shadow: { joints: ['rightKnee', 'leftKnee', 'rightToe', 'leftToe', 'pelvis'],
    blobs: [{ j: 'rightKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'leftKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'rightToe', rx: 30, ry: 9, a: 0.5 }, { j: 'leftToe', rx: 30, ry: 9, a: 0.5 }],
    bands: [{ from: 'rightKnee', to: 'rightToe', mid: 'rightKnee', rx: 50, ry: 11, a: 0.3, dy: 4, sag: 0.1 }] },
  props: [{ type: 'mat', at: [-0.2, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 1.05, 2.1],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    jointPins: [{ j: 'rightKnee' }, { j: 'leftKnee' }],
    straight: [],
    touch: [{ side: 'right', when: 'always' }, { side: 'left', when: 'always' }],
    allowContact: ['forearmL|forearmR', 'forearmL|upperArmR', 'forearmR|upperArmL', 'handR|upperArmL', 'handL|upperArmR', 'forearmL|handR', 'forearmR|handL', 'thighR|shinR', 'thighL|shinL', 'thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
