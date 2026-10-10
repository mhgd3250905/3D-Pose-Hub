// s-seated-fold 坐姿体前屈 (seated forward fold, hamstring stretch) · S 档髋部拉伸系列.
// Sitting on the mat, both legs straight forward and together, toes up. 'open' 0 = trunk tall, hands on the thighs,
// 1 = hinge forward from the hips with a long back, hands slide down to the shins. One slow rep / 8 s.
// Head points +Y, front faces +Z, body left = +X.
export default {
  id: 's-seated-fold', name: '坐姿体前屈', nameEn: 'Seated Forward Fold',
  // v2: 'hand' = the hands' slide along the legs, lagging the trunk on the way down and leading it on the way up so the arms can reach
  // (palms stay on the legs); 'sag' lowers the hip target mid-transition so the thigh contact stays <= 1 mm.
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]],
    hand: [[0, 0], [0.9, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [6.7, 0]],   // return 6.4 -> 6.6 s: at 6.4 the right-hand touch bisect locked onto the thigh side (f188 left hand -16.5 mm)
    sag: [[0, 0], [0.6, 0], [1.4, 1], [2.2, 0], [5.4, 0], [6.2, 1], [7.0, 0]],
    rl: [[0, 0], [0.7, 0], [1.07, 1], [1.4, 0], [6.3, 0], [6.67, 1], [7.0, 0]] } },   // v2: extra pelvis roll where the right thigh lifted most
  pose: {
    base: {
      pelvis: [0, 0.139, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], -5], [[0, 0, 1], 1.0]] },   // v2: 1 deg roll (right hip down): the right thigh sat 1.1-3.4 mm above the mat (mesh asymmetry)
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: {   // v2: touch (bisect) puts the palms on the thighs / shins at 0.8 mm (v1 hovered 26.7 mm)
        left: { mode: 'free', frame: 'world', palmAt: [0.11, 0.198, 0.29], wrist: [0.12, 0.215, 0.22], finger: [0, -0.1, 1], normal: [0, -1, 0], pole: [0.5, 0.4, -0.2], touch: { solve: 'bisect', clear: 0.0005, exclude: { left: ['rightHand'], right: ['leftHand'] } } },
        right: { mode: 'free', frame: 'world', palmAt: [-0.11, 0.198, 0.29], wrist: [-0.12, 0.215, 0.22], finger: [0, -0.1, 1], normal: [0, -1, 0], pole: [-0.5, 0.4, -0.2], touch: { solve: 'bisect', clear: 0.0005, exclude: { left: ['rightHand'], right: ['leftHand'] } } },
      },
      feet: {
        // v2: heels on the mat (rot -80 -> -67.5: heel 14 mm -> ~0.5 mm), ankles reachable (z .768 -> .760) so they never slide
        left: { mode: 'free', frame: 'world', ankle: [0.09, 0.075, 0.760], rot: [[[1, 0, 0], -67.5]], pole: [0.09, 1.0, 0.4] },
        right: { mode: 'free', frame: 'world', ankle: [-0.09, 0.075, 0.760], rot: [[[1, 0, 0], -67.5]], pole: [-0.09, 1.0, 0.4] },
      },
      // v2: legs soft-straight (179 deg) to the fixed heels, hip height held so the thighs rest on the mat (contact 0-1 mm); solver moves the pelvis (py, pz)
      constraints: [{ type: 'reach', limb: 'leftLeg', angle: 179, weight: 2 }, { type: 'reach', limb: 'rightLeg', angle: 179, weight: 2 },
        { type: 'joint', joint: 'leftHip', axis: [0, 1, 0], value: 0.0882, weight: 2 }],
      solve: { vars: ['py', 'pz'], reg: { py: 0.1, pz: 0.1 } },
    },
    deltas: { open: {
      constraints: [{}, {}, { value: 0.0845 }],
      pelvis: [0, 0.122, 0.029],
      hips: { rot: [[[1, 0, 0], 38], [[0, 0, 1], 0.1]] }, chest: { waist: [[[1, 0, 0], 6]] },   // v2: more pelvis tilt (30 -> 38), less upper-back rounding (14 -> 6)
    }, sag: { constraints: [{}, {}, { value: 0.0870 }] }, rl: { hips: { rot: [[[1, 0, 0], -5], [[0, 0, 1], 1.15]] } }, hand: {
      hands: { left: { palmAt: [0.125, 0.15, 0.665], finger: [0.55, -0.55, 0.6], normal: [-0.55, -0.8, 0.1] }, right: { palmAt: [-0.125, 0.15, 0.665], finger: [-0.55, -0.55, 0.6], normal: [0.55, -0.8, 0.1] } },
    } },
  },
  highlight: { groups: ['hamstrings'], side: 'both', pulseTrack: 'open', pulseBase: 0.4 },
  camera: { dir: [1, 0.25, 0.15], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'leftWrist'], pad: 0.2, k: 1.0, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 480, height: 360, cx: 474, cy: 560 },   // v2: smaller + left so the whole mat is in frame (v1: right end cut)
  stillAt: 3.8,
  shadow: { joints: ['leftAnkle', 'rightAnkle', 'pelvis', 'leftKnee'],
    blobs: [{ j: 'pelvis', rx: 70, ry: 14, a: 0.7 }, { j: 'leftAnkle', rx: 40, ry: 10, a: 0.6 }],
    bands: [{ from: 'pelvis', to: 'leftAnkle', mid: 'leftKnee', rx: 70, ry: 14, a: 0.35, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, 0.36], size: [0.61, 1.83, 0.006], yaw: 0 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    jointPins: [{ j: 'leftAnkle' }, { j: 'rightAnkle' }],
    // max_gap 1.5: only at the frames where the palm crosses the shorts hem (f31-35, f193) the engine handClip reading jumps
    // (one-sided patch -> euclidean fallback, ~-0.03 -> +1.4 mm across 0.15 mm) and the bisect ends on the jump; every other frame <= 1.0 mm
    touch: [{ side: 'left', max_gap: 1.5 }, { side: 'right', max_gap: 1.5 }],
    straight: [{ j: 'knee.left', min: 176 }, { j: 'knee.right', min: 176 }],
    allowContact: ['handL|thighL', 'handR|thighR', 'handL|shinL', 'handR|shinR', 'thighL|thighR', 'shinL|shinR', 'footL|footR', 'torso|thighL', 'torso|thighR'],
  },
};
