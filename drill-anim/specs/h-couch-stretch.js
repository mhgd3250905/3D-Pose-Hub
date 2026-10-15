// h-couch-stretch 沙发拉伸（后脚搭矮凳）(couch stretch, rear foot on a low stool) · H 居家开胯系列.
// Half-kneeling with the LEFT knee on the mat close to a low stool behind, the top of the left foot resting on the stool so
// the left knee is deeply bent; RIGHT foot planted in front (knee ~90 deg), hands on the hips. 'open' 0 = trunk leaning
// forward a little, 1 = trunk tall, pelvis tucked (posterior tilt) and shifted forward, so the stretch runs from the front of
// the left hip down the thigh (hip flexors + rectus femoris: hip extension with the knee bent). One slow rep / 8 s.
// Head points +Y, front faces +Z, body left = +X (world == rest axes; frame of s-kneel-hipflex).
const SEAT = 0.34, EDGE = -0.275;
export default {
  id: 'h-couch-stretch', name: '沙发拉伸', nameEn: 'Couch Stretch (Rear Foot on a Stool)',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.2, 0.85], [3.8, 1], [5.6, 0.85], [7.2, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.458, 0.0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 16]] },
      chest: { waist: [[[1, 0, 0], 4]] },
      hands: {
        left: { mode: 'free', frame: 'hips', wrist: [0.171, 1.10, -0.02], finger: [-0.15, -0.35, 0.92], normal: [-0.9, 0.35, 0.1], pole: [0.75, 1.15, -0.35], relax: 1, touch: { solve: 'bisect', clear: 0.0008 } },
        right: { mode: 'free', frame: 'hips', wrist: [-0.171, 1.10, -0.02], finger: [0.15, -0.35, 0.92], normal: [0.9, 0.35, 0.1], pole: [-0.75, 1.15, -0.35], relax: 1, touch: { solve: 'bisect', clear: 0.0008 } },
      },
      feet: {
        right: { mode: 'floor', at: [-0.12, 0.47], heading: -3, pitch: 0 },
        left: { mode: 'free', frame: 'world', ankle: [0.09, SEAT + 0.05, -0.266], rot: [[[1, 0, 0], 168]], pole: [0.085, 0.0, 0.45] },
      },
      constraints: [{ type: 'mid', limb: 'leftLeg', at: [0.087, 0.0488, -0.02], axes: [0, 1, 0], weight: 3 }],
      solve: { vars: ['py'], reg: { py: 0.1 } },
    },
    deltas: { open: { pelvis: [0, 0.44, 0.09], hips: { rot: [[[1, 0, 0], -8]] }, chest: { waist: [[[1, 0, 0], 6]] } } },
  },
  highlight: { groups: ['hip-flexors', 'quadriceps'], side: 'left', pulseTrack: 'open', pulseBase: 0.4 },
  camera: { dir: [1, 0.22, 0.25], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1.0, drift: 3, at: 3.8, fitTimeline: true },
  frame: { mode: 'fit', width: 640, height: 720, cx: 512, cy: 530 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightToe', 'rightAnkle', 'leftKnee', 'pelvis'],
    blobs: [{ j: 'rightAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.6 }],
    bands: [{ from: 'leftKnee', to: 'rightAnkle', mid: 'pelvis', rx: 70, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, 0.12], size: [0.61, 1.1, 0.006], yaw: 0 }, { type: 'chair', at: [0.05, 0, EDGE - 0.19], yaw: 0, height: SEAT, width: 0.42, depth: 0.38, back: 0.0 }],
  keyFrames: [0.3, 2.2, 3.8],
  qa: {
    pins: [{ c: 'footR', when: 'always' }],
    jointPins: [{ j: 'leftKnee' }, { j: 'leftAnkle' }],
    touch: [{ side: 'left', max_gap: 1.0 }, { side: 'right', max_gap: 1.0 }],
    allowContact: ['handL|torso', 'handR|torso', 'handL|thighL', 'handR|thighR', 'thighL|shinL'],
  },
};
