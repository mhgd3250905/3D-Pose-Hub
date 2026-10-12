// s-butterfly 蝴蝶式 (seated butterfly / bound angle) · S 档髋部拉伸系列.
// Sitting on the mat, soles pressed together close to the groin, knees dropped open to the sides, both hands on the lower shins.
// 'open' 0 = trunk tall, 1 = hinge forward from the hips with a long back, stretching the inner thighs. One slow rep / 8 s.
// Head points +Y, front faces +Z, body left = +X.
// v2 (Hark): hands rest on the lower shins just above the ankles (touch bisect, 0.5-0.65 mm, palms never move); the v1 knee sink is
// dropped (the shins carried the hands ~20 mm with them); hips start at 6 deg tilt so the arms reach the shins from t=0; the hip height
// follows the fold so the thigh / seat stays on the mat (a small 'lift' bump where the hinge would press the thigh into the mat);
// a slight pelvis roll (right hip down) evens out the mesh asymmetry between the two thighs; ankles 7 mm lower (shoes on the mat).
export default {
  id: 's-butterfly', name: '蝴蝶式', nameEn: 'Seated Butterfly Stretch',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]],
    lift: [[0, 0], [0.6, 0], [1.25, 1], [1.6, 1], [2.0, 0.35], [2.6, 0], [5.2, 0], [5.9, 0.35], [6.2, 1], [6.55, 1], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.1192, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 6], [[0, 0, 1], 0.7]] },
      chest: { waist: [[[1, 0, 0], 4.0]] },   // v2: slight upper-body lean so the arms reach the shins without locking straight
      hands: {
        left: { mode: 'free', frame: 'world', relax: 0.5, palmAt: [0.0998, 0.1515, 0.3323], finger: [0.5, -0.25, 0.83], normal: [-0.25, -0.95, 0.15], pole: [0.6, 0.4, 0.1],
          touch: { solve: 'bisect', clear: 0.0005, exclude: { left: ['rightHand'], right: ['leftHand'] } } },
        right: { mode: 'free', frame: 'world', relax: 0.5, palmAt: [-0.0998, 0.1515, 0.3323], finger: [-0.5, -0.25, 0.83], normal: [0.25, -0.95, 0.15], pole: [-0.6, 0.4, 0.1],
          touch: { solve: 'bisect', clear: 0.0005, exclude: { left: ['rightHand'], right: ['leftHand'] } } },
      },
      feet: {
        left: { mode: 'free', frame: 'world', ankle: [0.06, 0.0832, 0.36], rot: [[[0, 0, 1], -75], [[0, 1, 0], -15]], pole: [0.7, 0.25, 0.3], thighTwist: -105.0 },
        right: { mode: 'free', frame: 'world', ankle: [-0.06, 0.0832, 0.36], rot: [[[0, 0, 1], 75], [[0, 1, 0], 15]], pole: [-0.7, 0.25, 0.3], thighTwist: 105.0 },
      },
      constraints: [],
      solve: { vars: [], reg: {} },
    },
    deltas: {
      open: { pelvis: [0, 0.1142, 0.02], hips: { rot: [[[1, 0, 0], 22], [[0, 0, 1], 2.25]] }, chest: { waist: [[[1, 0, 0], 12]] } },
      lift: { pelvis: [0, 0.1201, 0] },
    },
  },
  highlight: { groups: ['adductors'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [0.12, 0.32, 1], fit: ['head', 'leftKnee', 'rightKnee', 'pelvis', 'leftToe', 'rightToe'], pad: 0.2, k: 1.0, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 640, height: 600, cx: 512, cy: 540 },   // v2: mat fully in frame (v1: bottom margin 0 px)
  stillAt: 3.8,
  shadow: { joints: ['leftKnee', 'rightKnee', 'pelvis', 'leftAnkle'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.5 }, { j: 'rightKnee', rx: 40, ry: 10, a: 0.5 }],
    bands: [{ from: 'leftKnee', to: 'rightKnee', mid: 'pelvis', rx: 80, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, -0.3], size: [0.61, 1.83, 0.006], yaw: 0 }],   // v2: mat moved back (z 0.15 -> -0.3)
  keyFrames: [0.3, 2.0, 3.8],
  qa: {
    // hipFlexMax 150 (default 135): engine hipFlexDeg = atan2(thigh.z, -thigh.y) in the pelvis frame. Here the thighs are abducted 61-63 deg
    // and the knees sit ~15 deg above hip height (seated, knees up), so thigh.y > 0 and the projected angle passes 90 deg although the
    // thigh's forward component is only 15-22 deg (asin, pelvis frame). Measured 126.5-149.2.
    hipFlexMax: 150,
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }],
    jointPins: [{ j: 'leftAnkle' }, { j: 'rightAnkle' }, { j: 'leftToe' }, { j: 'rightToe' }],
    touch: [{ side: 'left', max_gap: 1.0 }, { side: 'right', max_gap: 1.0 }],
    allowContact: ['handL|footL', 'handR|footR', 'handL|footR', 'handR|footL', 'footL|footR', 'shinL|shinR', 'handL|shinL', 'handR|shinR', 'forearmL|shinL', 'forearmR|shinR', 'forearmL|thighL', 'forearmR|thighR', 'thighL|shinL', 'thighR|shinR'],
  },
};
