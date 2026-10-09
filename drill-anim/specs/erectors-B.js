// erectors-B 瑞士球背伸 (Swiss-ball back extension). Prone over a Swiss ball, hips on top of the ball, legs straight back
// with the toes dug in at the foot of a wall; fingertips lightly behind the ears, elbows wide. 'ext' lifts the trunk from
// rounded down over the ball (waist flexed ~40 deg) up to one straight line with the legs, no further (no lumbar
// hyperextension), holds 1 s and lowers slowly. Head +X, body faces the floor at the bottom, body left = -Z.
// 2 reps / 8 s: 1.2 s up, 1.0 s hold, 1.5 s down, 0.3 s rest.
const BX = 0.22, BR = 0.37;                         // ball centre x, radius
const INC = 45;                                     // body-line inclination (toes on the floor -> head up), deg
const FX = -0.45, FZ = 0.09, WALLX = -0.60;
const c = Math.cos(INC * Math.PI / 180), s = Math.sin(INC * Math.PI / 180);
const rep = t => [[t + 0.3, 0], [t + 1.5, 1], [t + 2.5, 1], [t + 4.0, 0]];
const hand = sg => ({ mode: 'free', frame: 'chest', wrist: [sg * 0.14, 1.56, -0.05], finger: [-sg * 0.55, 0.3, -0.78], normal: [-sg, 0, 0], poleUp: [sg * 0.8, 1.35, -1.6], touch: { clear: 0.002 } });
export default {
  id: 'erectors-B', name: '瑞士球背伸', nameEn: 'Swiss Ball Back Extension',
  timeline: { duration: 8, tracks: { ext: [[0, 0], ...rep(0), ...rep(4)] } },
  pose: {
    base: {
      pelvis: [0.10, 0.80, 0],
      hips: { up: [c, s, 0], front: [s, -c, 0], rot: [[[0, 0, 1], 0]] },
      chest: { waist: [[[0, 0, 1], -40]] },
      hands: { right: hand(-1), left: hand(1) },
      feet: {
        right: { mode: 'floor', at: [FX, FZ], heading: -90, pitch: 58 },
        left: { mode: 'floor', at: [FX, -FZ], heading: -90, pitch: 58 },
      },
      constraints: [
        { type: 'reach', limb: 'rightLeg', angle: 179.5, weight: 4 }, { type: 'reach', limb: 'leftLeg', angle: 179.5, weight: 4 },
        { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 0.1 }, { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 0.1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0.10, weight: 0.4 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.80, weight: 0.4 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 0.2, py: 0.05, h0: 0.02 } },
    },
    deltas: { ext: { chest: { waist: [[[0, 0, 1], 0]] } } },
  },
  highlight: { groups: ['erectors'], side: 'both', pulseTrack: 'ext', pulseBase: 0.3 },
  camera: { dir: [0.15, 0.32, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftElbow', 'rightElbow', 'leftPalm', 'rightPalm'], pad: 0.3, k: 0.75, drift: 4, at: 2.0 },
  frame: { mode: 'fit', width: 760, cx: 512, cy: 540 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'pelvis'], blobs: [{ j: 'rightToe', rx: 34, ry: 9, a: 0.55 }, { j: 'leftToe', rx: 34, ry: 9, a: 0.55 }], bands: [] },
  props: [
    { type: 'swissBall', at: [BX, 0, 0], r: BR },
    { type: 'wall', at: [WALLX, 0, 0], yaw: 90, size: [1.4, 1.6, 0.12] },
  ],
  keyFrames: [0.3, 1.5, 3.2],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: ['handR|head', 'handL|head', 'upperArmR|head', 'upperArmL|head', 'forearmR|head', 'forearmL|head'],
  },
};
