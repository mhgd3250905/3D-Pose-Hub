// s-pigeon 鸽子式 (pigeon pose, upright beginner variant) · S 档髋部拉伸系列.
// RIGHT leg in front: knee forward-right, shin across the front of the body toward the left hip, outer shin/ankle on the mat.
// LEFT leg extended straight back, knee and top of the foot on the mat. Trunk tall, palms on two yoga blocks beside the hips
// v3 supported beginner variant: a 6.5 cm yoga support under the RIGHT hip keeps the stretch within the rig's hip limits.
// The pelvis, both knees and both ankles stay fixed throughout the loop: no foot slide to deepen the pose.
// 'open' is a gentle 4-degree exhale hinge of the upper body; the lower body stays supported. One slow rep / 8 s.
// Head points +Y, front faces +Z, body left = +X.
export default {
  id: 's-pigeon', name: '鸽子式', nameEn: 'Pigeon Pose',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.190, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 48]] },
      chest: { waist: [[[1, 0, 0], -43]] },
      hands: {
        left: { mode: 'free', frame: 'world', relax: 0, palmAt: [0.235, 0.255, 0.02], finger: [0, 0, 1], normal: [0, -1, 0], pole: [0.6, 0.3, -0.4] },
        right: { mode: 'free', frame: 'world', relax: 0, palmAt: [-0.235, 0.255, 0.03], finger: [0, 0, 1], normal: [0, -1, 0], pole: [-0.6, 0.3, -0.4] },
      },
      feet: {
        // Outer side of the front shoe and the back of the rear shoe are placed at the mat surface by measured shoe clearance.
        // The front ankle crosses toward the opposite hip; the outside pole and thigh roll keep flexion transverse/backward.
        right: { mode: 'floor', at: [0.08, 0.20], heading: 90, roll: 90, pole: [-0.60, -0.03556458136, 0.35], thighTwist: 90 },
        // Rear instep lies on the mat. A 180-degree foot flip drove the ankle skin 12 mm below the shoe contact plane.
        left: { mode: 'floor', at: [0.12, -0.74], pitch: 158, pole: [0.23, 0.04528893989, -0.345], thighTwist: -30 },
      },
      constraints: [
        { type: 'mid', limb: 'leftLeg', at: [0.22074896960, 0.050, -0.34292612548], axes: [0, 1, 0], weight: 3 },
        { type: 'mid', limb: 'rightLeg', at: [-0.32929393381, 0.050, 0.18684350198], axes: [0, 1, 0], weight: 3 },
      ],
      // Knee poles were solved from the rig offline at this fixed pelvis/ankle placement; keep all supports stationary.
      solve: { vars: [], reg: {} },
    },
    deltas: { open: { chest: { waist: [[[1, 0, 0], -39]] } } },
  },
  highlight: { groups: ['glute-max'], side: 'right', pulseTrack: 'open', pulseBase: 0.45 },
  camera: { dir: [-0.85, 0.32, -0.45], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm', 'rightPalm'], pad: 0.14, k: 1.0, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 500, height: 590, cx: 512, cy: 540 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightAnkle', 'leftKnee', 'rightKnee', 'pelvis'],
    blobs: [{ j: 'pelvis', rx: 70, ry: 14, a: 0.6 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.6 }, { j: 'rightKnee', rx: 40, ry: 10, a: 0.6 }],
    bands: [{ from: 'leftToe', to: 'rightAnkle', mid: 'pelvis', rx: 80, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, -0.15], size: [0.72, 1.83, 0.006], yaw: 0 },
    { type: 'mat', at: [0.235, 0.255, 0.02], size: [0.11, 0.23, 0.255] },
    { type: 'mat', at: [-0.235, 0.255, 0.03], size: [0.11, 0.23, 0.255] },
    // Existing slab prop reused as a yoga support: top y=0.065 m, bottom y=0, wholly inside the mat.
    { type: 'mat', at: [-0.085, 0.065, -0.05], size: [0.21, 0.26, 0.065] }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }],
    jointPins: [{ j: 'leftKnee' }, { j: 'rightKnee' }, { j: 'leftAnkle' }, { j: 'rightAnkle' }],
    allowContact: ['footR|thighL', 'shinR|thighL', 'footR|kneeL', 'thighR|shinR', 'torso|thighR'],
  },
};
