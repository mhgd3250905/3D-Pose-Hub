// w-feet-on-chair-bridge 脚踩椅面臀桥 (feet-on-chair glute bridge, hamstring bias). Supine on the mat, heels on the front of a
// chair seat (toes up), arms long on the mat with the palms pinned. 'lift' raises the hips (pelvis frame rotates about the
// shoulders, the upper torso bends less so the head and shoulders stay down) to one line shoulders-hips-knees, hold, lower
// until the glutes touch down. Knees open to ~125 deg at the top: back of the thighs (hamstrings) + glutes. 2 reps / 8 s.
// Head points -X, face up (+Y), body left = -Z (frame of glute-max-A).
const H = 0.45, AX = 0.60, AZ = 0.10, ALPHA = 44;
const rep = s => [[s + 0.3, 0], [s + 1.3, 1], [s + 2.7, 1], [s + 3.8, 0]];
export default {
  id: 'w-feet-on-chair-bridge', name: '脚踩椅面臀桥', nameEn: 'Feet-on-Chair Glute Bridge',
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
        left: { mode: 'floor', floor: H, at: [AX, -AZ], heading: 90, pitch: -38, poleLow: [0.12, 0.55, 0.7] },
        right: { mode: 'floor', floor: H, at: [AX, AZ], heading: 90, pitch: -38, poleLow: [-0.12, 0.55, 0.7] },
      },
      constraints: [
        { type: 'joint', joint: 'shoulderCenter', axis: [0, 1, 0], value: 0.095, weight: 0.5 },
        { type: 'joint', joint: 'head', axis: [0, 1, 0], value: 0.134, weight: 2 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: -0.47, weight: 0.1 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.118, weight: 0.6 },
        { type: 'reach', limb: 'rightArm', angle: 176, weight: 1 }, { type: 'reach', limb: 'leftArm', angle: 176, weight: 1 },
      ],
      solve: { vars: ['px', 'py'], reg: { px: 3, py: 0.5 } },
    },
    deltas: { lift: { hips: { rot: [[[0, 0, 1], ALPHA]] }, chest: { waist: [[[0, 0, 1], -ALPHA * 0.7]] }, constraints: [{}, {}, {}, { weight: 0 }] } },
  },
  highlight: { groups: ['hamstrings', 'glute-max'], side: 'both', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [0.1, 0.2, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm'], pad: 0.16, k: 0.75, drift: 3, at: 2.0 },
  frame: { mode: 'fit', width: 780, cx: 500, cy: 560 },
  stillAt: 2.0,
  shadow: { joints: ['rightPalm', 'leftPalm', 'pelvis', 'shoulderCenter', 'head'],
    blobs: [{ j: 'shoulderCenter', rx: 90, ry: 14, a: 0.55 }, { j: 'head', rx: 55, ry: 12, a: 0.5 }, { j: 'pelvis', rx: 80, ry: 15, a: 0.5, fade: [0.12, 0.4] }],
    bands: [] },
  props: [
    { type: 'mat', at: [-0.2, 0, 0], size: [1.4, 0.61, 0.006] },
    { type: 'chair', at: [0.72, 0, 0], yaw: -90, height: H, width: 0.44, depth: 0.42 },
  ],
  keyFrames: [0.15, 0.8, 2.0],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [],
    allowContact: ['handR|thighR', 'handL|thighL', 'forearmR|torso', 'forearmL|torso', 'upperArmR|torso', 'upperArmL|torso'],
  },
};
