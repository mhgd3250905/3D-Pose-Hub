// s-lizard 蜥蜴式低弓步 (lizard lunge) · S 档髋部拉伸系列.
// RIGHT foot planted far forward, LEFT knee down on the mat far behind (shin flat, top of the foot down), both palms flat on
// two yoga blocks inside the right foot (beginner / desk-worker variant: the rig's joint limits - hip flex < 135, extension > -35,
// waist < 45 - cannot reach the floor with long arms), soft-straight arms, trunk inclined forward. 'open' 0 = hips high, 1 = hips sink low and
// forward, stretching the front of the left hip (and the inner right thigh). One slow rep / 8 s.
// Head points +Z (forward and up), front faces +Z, body left = +X.
export default {
  id: 's-lizard', name: '蜥蜴式低弓步', nameEn: 'Lizard Lunge',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.355, -0.02],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 26]] },
      chest: { waist: [[[1, 0, 0], 38]] },
      hands: {
        left: { mode: 'free', frame: 'world', relax: 0, palmAt: [0.16, 0.16, 0.569], finger: [0, 0, 1], normal: [0, -1, 0], pole: [0.6, 0.5, 0.3] },
        right: { mode: 'free', frame: 'world', relax: 0, palmAt: [-0.125, 0.16, 0.556], finger: [0, 0, 1], normal: [0, -1, 0], pole: [-0.6, 0.5, 0.3] },
      },
      feet: {
        right: { mode: 'floor', at: [-0.32, 0.60], heading: -24, pitch: 0, pole: [-0.5, 0.9, 0.4] },
        left: { mode: 'free', frame: 'world', ankle: [0.10, 0.0405, -0.69], rot: [[[1, 0, 0], 157.8]], pole: [0.10, 0.0, 0.40] },   // v2: top of the foot flat on the mat (toe 0.9 mm; v1 hovered 64 mm)
      },
      // v2: back knee held on the mat: knee-joint height animated with 'open' (the knee rolls as the thigh tilts) so the lowest knee vertex stays at 0.4-0.6 mm; the solver sets the pelvis height (py)
      constraints: [{ type: 'mid', limb: 'leftLeg', at: [0.1, 0.0516, -0.2], axes: [0, 1, 0], weight: 3 },
        // v2: soft-straight arms (elbow ~170) so both palms stay on the blocks through the whole rep; the solver adds waist bend (c0)
        { type: 'reach', limb: 'leftArm', angle: 170, weight: 1 }, { type: 'reach', limb: 'rightArm', angle: 170, weight: 1 }],
      solve: { vars: ['py', 'c0'], reg: { py: 0.1, c0: 0.05 } },
    },
    deltas: { open: { constraints: [{ at: [0.1, 0.0542, -0.2] }], pelvis: [0, 0.297, 0.035], hips: { rot: [[[1, 0, 0], 23]] }, chest: { waist: [[[1, 0, 0], 29]] } } },
  },
  highlight: { groups: ['hip-flexors'], side: 'left', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [0.85, 0.25, 0.55], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm'], pad: 0.14, k: 1.0, drift: 0.9, at: 3.8 },
  frame: { mode: 'fit', width: 760, height: 560, cx: 512, cy: 560 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightToe', 'rightAnkle', 'leftKnee', 'pelvis', 'leftPalm'],
    blobs: [{ j: 'rightAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'leftKnee', rx: 40, ry: 10, a: 0.6 }, { j: 'leftPalm', rx: 40, ry: 10, a: 0.6 }],
    bands: [{ from: 'leftToe', to: 'rightAnkle', mid: 'leftKnee', rx: 80, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [-0.05, 0, -0.1], size: [0.61, 1.83, 0.006], yaw: 0 },
    { type: 'mat', at: [0.16, 0.1594, 0.575], size: [0.11, 0.23, 0.1594] },          // yoga block under each palm (mat slab = rounded box); v2: 15.9 cm tall (on its middle side) so the palms rest on it (v1: 14 mm gap)
    { type: 'mat', at: [-0.125, 0.1594, 0.575], size: [0.11, 0.23, 0.1594] }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }],
    jointPins: [{ j: 'leftKnee', axes: 'xz' }, { j: 'leftAnkle' }],
    straight: [{ j: 'elbow.left', min: 166 }, { j: 'elbow.right', min: 166 }],
    allowContact: ['forearmR|shinR', 'handR|footR', 'upperArmR|thighR', 'forearmR|thighR', 'torso|thighR'],
  },
};
