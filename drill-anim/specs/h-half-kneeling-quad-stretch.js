// h-half-kneeling-quad-stretch 半跪姿手拉脚股四头肌拉伸 (half-kneeling quad stretch, hand holds the rear foot) · 缺口批次 1（gap-batch1-20261026，股四拉伸）.
// Half-kneeling on a mat: LEFT knee down (padded by the mat), RIGHT foot planted in front with the knee ~90 deg. The left knee
// is bent and the left hand reaches back to hold the top of the left foot / ankle; the right hand rests on the right hip.
// 'open' 0 = trunk upright, pelvis neutral; 1 = pelvis tucked (posterior tilt, hips barely translate so the knee stays put) while the hand keeps
// the heel drawn toward the buttock, so the stretch runs down the front of the left thigh (rectus femoris / quadriceps, with
// the hip flexors). Gentle range: stop at a mild stretch, no arching of the lower back. No palm bears weight on the floor.
// Distinct from h-couch-stretch (rear foot on a stool, hands on hips) and o-stand-quad (standing, chair support): here the
// rear foot is held by the hand in half-kneeling, no equipment besides the mat.
// Design prescription (author, this file): one slow rep / 8 s, same tempo as h-couch-stretch: 0.6 s still, 1.6 s into the
// stretch, 1.6 s easing to the end position, 1.8 s back to 85 %, 1.6 s release (end-range hold ~3.4 s >= 2 s).
// Head +Y, front +Z, body left = +X (world == rest axes; frame of h-couch-stretch, whose kneeling base is reused).
export default {
  id: 'h-half-kneeling-quad-stretch', name: '半跪姿手拉脚股四头肌拉伸', nameEn: 'Half-Kneeling Quad Stretch (Hand Holds Rear Foot)',
  modelProfile: 'training-human-v2plus', alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  fps: 30, size: 1080,
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.2, 0.85], [3.8, 1], [5.6, 0.85], [7.2, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.458, 0.0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 8]] },
      chest: { waist: [[[1, 0, 0], 2], [[0, 1, 0], 6]] },
      hands: {
        left: { mode: 'free', frame: 'world', wrist: [0.163, 0.50, -0.125], finger: [-0.25, -0.55, -0.8], normal: [-0.85, 0.15, -0.5], pole: [0.6, 0.9, -0.3], relax: 0.4 },
        right: { mode: 'free', frame: 'hips', wrist: [-0.19, 1.10, -0.02], finger: [0.15, -0.35, 0.92], normal: [0.9, 0.35, 0.1], pole: [-0.75, 1.15, -0.35], relax: 1, touch: { solve: 'bisect', clear: 0.0008 } },
      },
      feet: {
        right: { mode: 'floor', at: [-0.12, 0.47], heading: -3, pitch: 0 },
        left: { mode: 'free', frame: 'world', ankle: [0.09, 0.44, -0.155], rot: [[[1, 0, 0], 125]], pole: [0.087, -1.0, 0.05] },
      },
      constraints: [{ type: 'mid', limb: 'leftLeg', at: [0.087, 0.0488, -0.04], axes: [0, 1, 1], weight: 3 }],
      solve: { vars: ['py', 'pz'], reg: { py: 0.1, pz: 0.1 } },   // pz keeps the kneeling knee from sliding on the mat
    },
    deltas: { open: { pelvis: [0, 0.44, 0.015], hips: { rot: [[[1, 0, 0], -6]] }, chest: { waist: [[[1, 0, 0], 4], [[0, 1, 0], 6]] },
      feet: { left: { ankle: [0.09, 0.46, -0.125], rot: [[[1, 0, 0], 120]] } },
      hands: { left: { wrist: [0.163, 0.52, -0.095] } } } },
  },
  highlight: { groups: ['quadriceps', 'hip-flexors'], side: 'left', pulseTrack: 'open', pulseBase: 0.4 },
  camera: { dir: [1, 0.22, 0.55], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm'], pad: 0.16, k: 1.0, drift: 0, at: 3.8, fitTimeline: true },
  frame: { mode: 'fit', width: 640, height: 720, cx: 512, cy: 530 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightToe', 'rightAnkle', 'leftKnee', 'pelvis'],
    blobs: [{ j: 'rightAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.6 }],
    bands: [{ from: 'leftKnee', to: 'rightAnkle', mid: 'pelvis', rx: 70, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, 0.12], size: [0.61, 1.1, 0.006], yaw: 0 }],
  keyFrames: [0.3, 2.2, 3.8],
  qa: {
    pins: [{ c: 'footR', when: 'always' }],
    jointPins: [{ j: 'leftKnee' }],
    touch: [{ side: 'right', max_gap: 1.0 }],
    allowContact: ['handR|torso', 'handR|thighR', 'thighL|shinL', 'handL|footL', 'handL|shinL'],
  },
};
