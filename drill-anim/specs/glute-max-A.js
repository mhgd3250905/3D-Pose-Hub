// glute-max-A 单腿臀桥 (single-leg glute bridge). Supine on the mat, head -X, face up (+Y), body left = -Z.
// Left foot planted flat (pinned), right leg held straight in line with the thigh (raised ~30 deg), arms flat on the mat,
// palms down and pinned. 'lift' 0..1 raises the hips (pelvis frame rotates about the shoulders); the upper torso bends less
// (waist bend) so the head stays on the mat. 2 reps / 8 s with a 1.6 s squeeze at the top.
const rep = s => [[s + 0.3, 0], [s + 1.3, 1], [s + 2.9, 1], [s + 3.9, 0]];
const ALPHA = 29;   // hip lift angle at the top, degrees
export default {
  id: 'glute-max-A', name: '单腿臀桥', nameEn: 'Single-Leg Glute Bridge',
  timeline: { duration: 8, tracks: { lift: [[0, 0], ...rep(0), ...rep(4)] } },
  pose: {
    base: {
      pelvis: [0.0, 0.115, 0],
      hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], 0]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      hands: {
        right: { mode: 'floor', at: [0.0, 0.265], finger: [1, 0.05], poleUp: [-0.35, 1.1, -0.1] },
        left: { mode: 'floor', at: [0.0, -0.265], finger: [1, -0.05], poleUp: [0.35, 1.1, -0.1] },
      },
      feet: {
        left: { mode: 'floor', at: [0.52, -0.12], heading: 90, pitch: 0, poleLow: [0.12, 0.55, 0.6] },
        right: { mode: 'free', frame: 'hips', ankle: [-0.085, 0.0969, 0.1121], rot: [[[0, 0, 1], -6]], poleLow: [-0.09, 0.5, 0.6] },
      },
      constraints: [
        { type: 'joint', joint: 'shoulderCenter', axis: [0, 1, 0], value: 0.095, weight: 0.5 },
        { type: 'joint', joint: 'head', axis: [0, 1, 0], value: 0.127, weight: 1 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: -0.47, weight: 0.1 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.15, weight: 0.6 },
        // arms straight (176 deg) along the body with the palms pinned: the torso slides so the shoulder-wrist reach stays constant
        { type: 'reach', limb: 'rightArm', angle: 176, weight: 1 }, { type: 'reach', limb: 'leftArm', angle: 176, weight: 1 },
      ],
      solve: { vars: ['px', 'py'], reg: { px: 3, py: 0.5 } },
    },
    deltas: { lift: { hips: { rot: [[[0, 0, 1], ALPHA]] }, chest: { waist: [[[0, 0, 1], -ALPHA * 0.6]] }, constraints: [{}, {}, {}, { weight: 0 }] } },
  },
  highlight: { groups: ['glute-max'], side: 'both', pulseAt: [2.1, 6.1], pulseWidth: 0.8, pulseBase: 0.25 },
  camera: { dir: [0.05, 0.13, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightAnkle', 'leftPalm'], pad: 0.14, k: 0.7, drift: 0.9, at: 2.1 },
  frame: { mode: 'fit', width: 760, cx: 492, cy: 540 },   // v2: was width 820 / cx 512, the raised shoe touched the right edge
  shadow: { joints: ['leftToe', 'leftAnkle', 'rightPalm', 'leftPalm', 'pelvis', 'shoulderCenter', 'head'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'shoulderCenter', rx: 90, ry: 14, a: 0.55 }, { j: 'head', rx: 55, ry: 12, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'leftAnkle', mid: 'pelvis', rx: 60, ry: 12, a: 0.25, dy: 4, sag: 0.6 }] },
  props: [{ type: 'mat', at: [0.0, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0, 0.8, 2.1],
  stillAt: 2.1, // comp placement is fitted to the top of the bridge (the raised leg is highest there)
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'knee.right', min: 172 }],
    allowContact: ['handR|thighR', 'handL|thighL', 'forearmR|torso', 'forearmL|torso', 'upperArmR|torso', 'upperArmL|torso'],
  },
};
