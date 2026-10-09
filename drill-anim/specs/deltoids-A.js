// deltoids-A 直臂侧平板支撑 (straight-arm side plank, hip dip) - the approved v7 animation, ported.
// Uses the v7 solver unchanged (page/anim-sideplank.js __pose6, base pose from assets/sideplank-cfg.json).
const A = 0.18; // hip dip, metres
export default {
  id: 'deltoids-A', name: '直臂侧平板支撑', nameEn: 'Straight-Arm Side Plank',
  solver: 'sideplank-v7',
  clothSink: 0, // v7 rendered without the tee-skin sink (the attribute never reached its shader); keep 0 to stay pixel-identical
  bakeHands: ['left'], // v7 relaxed akimbo hand (fingers together + soft curl), baked exactly as v7 did
  solverArgs: { HC: { wrist: [0.168, 1.05, -0.045], finger: [0, -0.7, 0.7], normal: [-1, 0, 0], pole: [0.5, 1.25, -0.25], torsoW: 0.4 }, touch: { clear: 0.0015, from: 0, pull: 1 } }, // touch: hand rests on the hip surface (no penetration)
  timeline: { duration: 8, tracks: { dip: [[0, 0], [0.6, 0], [2.1, A], [3.6, 0], [4.4, 0], [5.9, A], [7.4, 0]] } },
  highlight: { groups: ['deltoids'], lobes: true, pulseAt: [3.6, 7.4], pulseWidth: 0.45, pulseBase: 0.25 },
  camera: { dir: [0.25, 0.32, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftAnkle', 'rightAnkle', 'leftElbow'], pad: 0.1, k: 1.0, drift: 0.9 },
  frame: { mode: 'v7', width: 750, left: 165, top: 300 },
  shadow: { joints: ['rightPalm', 'rightToe', 'leftToe', 'pelvis'],
    blobs: [{ j: 'rightPalm', dx: 10, dy: 8, rx: 70, ry: 12, a: 0.75 }, { j: 'rightToe', dx: -5, dy: 4, rx: 55, ry: 12, a: 0.7 }, { j: 'leftToe', dx: -5, dy: 4, rx: 55, ry: 12, a: 0.7 }],
    bands: [{ from: 'rightPalm', to: 'rightToe', mid: 'pelvis', rx: 60, ry: 14, a: 0.35, dy: 10, sag: 0.5, hipK: [1.25, 1.6, 0.30, 0.8, 1.3] }] },
  props: [],
  keyFrames: [0, 2.1, 3.6],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    allowContact: ['handL|torso', 'forearmL|torso', 'thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
