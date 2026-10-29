// deltoids-A-r3 直臂侧平板支撑（沉髋）: standard pose-spec port of deltoids-A (which ran on the legacy 'sideplank-v7' solver
// that the armfix-r2 runtime does not drive). Pose built from the chest-A side-plank hold (rotL: support RIGHT straight arm,
// chest opens to -Z) held for the whole loop; the free LEFT hand rests on the hip (v7 HC target, hips frame); the v7 hip-dip
// timing is kept (A = 0.18 m dip of the pelvis, shoulders and feet fixed). Head points +X. Hark remote port 2026-10-29: not reviewed.
const TH = 18, HX = 0.0, HZ = 0.23, FX = -1.17, A = 0.18, PY = 0.464;
export default {
  id: 'deltoids-A-r3', name: '直臂侧平板支撑', nameEn: 'Straight-Arm Side Plank (Hip Dip)',
  timeline: { duration: 8, tracks: { dip: [[0, 0], [0.6, 0], [2.1, 1], [3.6, 0], [4.4, 0], [5.9, 1], [7.4, 0], [8, 0]] } },
  pose: {
    base: {
      pelvis: [-0.42, 0.40, 0],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[1, 0, 0], 90], [[0, 0, 1], TH]] },
      hands: {
        right: { mode: 'floor', at: [HX, HZ], finger: [1, 0], poleUp: [-0.3, 0.95, 0.18] },
        left: { mode: 'free', frame: 'hips', wrist: [0.168, 1.05, -0.045], finger: [0, -0.7, 0.7], normal: [-1, 0, 0], poleUp: [0.5, 1.25, -0.25] },
      },
      feet: {
        left: { mode: 'floor', at: [FX - 0.03, -0.20], heading: 180, pitch: 0, roll: 80 },
        right: { mode: 'floor', at: [FX - 0.12, 0.08], heading: 180, pitch: 0, roll: 80 },
      },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 8 },
        { type: 'reach', limb: 'rightLeg', angle: 178, weight: 12 }, { type: 'reach', limb: 'leftLeg', angle: 178, weight: 12 },
        { type: 'joint', joint: 'rightShoulder', axis: [0, 0, 1], value: HZ, weight: 0.3 }, { type: 'joint', joint: 'rightShoulder', axis: [1, 0, 0], value: HX, weight: 0.3 },
        { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 0.3 }, { type: 'legAlign', limb: 'leftLeg', flex: 12, weight: 0.3 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: PY, weight: 0 },
      ],
      solve: { vars: ['px', 'py', 'pz', 'h1'], reg: { px: 1, py: 1, pz: 1, h1: 0.05 }, iters: 60 },
    },
    deltas: {
      dip: { constraints: [{}, {}, {}, {}, {}, {}, {}, { value: PY - A, weight: 10 }] },
    },
  },
  highlight: { groups: ['deltoids'], lobes: true, pulseAt: [3.6, 7.4], pulseWidth: 0.45, pulseBase: 0.25 },
  camera: { dir: [0.25, 0.32, -1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftAnkle', 'rightAnkle', 'leftElbow'], pad: 0.1, k: 1.0, drift: 0 },
  frame: { mode: 'fit', width: 820, height: 780, cx: 512, cy: 520 },
  props: [],
  keyFrames: [0, 2.1, 3.6],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    allowContact: ['handL|torso', 'forearmL|torso', 'thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
