// s-frog 青蛙式 (frog stretch) · S 档髋部拉伸系列.
// Prone on forearms and knees: forearms flat on the mat (elbows under the shoulders), knees spread wide to the sides, knees ~90 deg,
// shins pointing back in line with the knees, inner ankles/feet on the mat, back flat. 'open' 0 = hips over the knees,
// 1 = hips rock back and sink a little, stretching the inner thighs. One slow rep / 8 s.
// Head points +Z, front (chest) faces -Y (down), body left = +X.
export default {
  id: 's-frog', name: '青蛙式', nameEn: 'Frog Stretch',
  timeline: { duration: 8, tracks: { open: [[0, 0], [0.6, 0], [2.0, 0.85], [3.8, 1], [5.6, 0.85], [7.0, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.30, 0.0],
      hips: { up: [0, 0, 1], front: [0, -1, 0], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: {   // v2: free palms placed on the mat (floor mode left the hand 6 mm up); palm 0.5 mm, never moves
        left: { mode: 'free', frame: 'world', palmAt: [0.12, 0.015, 0.727], finger: [-0.15, 0, 1], normal: [0, -1, 0], pole: [0.187, 0.0497, 0.441] },
        right: { mode: 'free', frame: 'world', palmAt: [-0.12, 0.015, 0.727], finger: [0.15, 0, 1], normal: [0, -1, 0], pole: [-0.187, 0.0497, 0.441] },
      },
      feet: {   // v2: ankles 9 mm lower (shoe on the mat); knee pole = the knee pin so the knee never leaves its spot
        left: { mode: 'free', frame: 'world', ankle: [0.42, 0.0607, -0.38], rot: [[[0, 1, 0], -90], [[0, 0, 1], -80]], pole: [0.345, 0.0485, 0.023] },
        right: { mode: 'free', frame: 'world', ankle: [-0.42, 0.0607, -0.38], rot: [[[0, 1, 0], 90], [[0, 0, 1], 80]], pole: [-0.345, 0.0485, 0.023] },
      },
      // v2: v1 had solve.vars [] so these constraints were ignored (knees 31-38 mm up and sliding 10 mm, elbows sliding 4 mm).
      // Knees and elbows are now pinned at mat height; the solver sets the hip height (py) and the waist bend (c0) so that both hold
      // while the hips rock back. The elbow height eases 1.2 mm with 'open' because the forearm rolls as the elbow opens.
      constraints: [
        { type: 'mid', limb: 'leftLeg', at: [0.345, 0.0485, 0.023], weight: 3 },
        { type: 'mid', limb: 'rightLeg', at: [-0.345, 0.0485, 0.023], weight: 3 },
        { type: 'mid', limb: 'leftArm', at: [0.187, 0.0497, 0.441], weight: 3 },
        { type: 'mid', limb: 'rightArm', at: [-0.187, 0.0497, 0.441], weight: 3 },
      ],
      solve: { vars: ['py', 'c0'], reg: { py: 0.1, c0: 0.05 } },
    },
    deltas: { open: { pelvis: [0, 0.298, -0.09],   // v2: rock back 9 cm (v1 5 cm)
      hands: { left: { pole: [0.187, 0.0485, 0.441] }, right: { pole: [-0.187, 0.0485, 0.441] } },
      constraints: [{}, {}, { at: [0.187, 0.0485, 0.441] }, { at: [-0.187, 0.0485, 0.441] }] } },
  },
  highlight: { groups: ['adductors'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [0.8, 0.45, -0.6], fit: ['head', 'leftKnee', 'rightKnee', 'pelvis', 'leftToe', 'rightToe', 'leftElbow'], pad: 0.16, k: 1.0, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 560, height: 470, cx: 534, cy: 500 },   // v2: smaller so the whole mat is in frame (v1: left and right ends cut)
  stillAt: 3.8,
  shadow: { joints: ['leftKnee', 'rightKnee', 'leftElbow', 'rightElbow', 'pelvis'],
    blobs: [{ j: 'leftKnee', rx: 40, ry: 10, a: 0.6 }, { j: 'rightKnee', rx: 40, ry: 10, a: 0.6 }, { j: 'leftElbow', rx: 40, ry: 10, a: 0.5 }, { j: 'rightElbow', rx: 40, ry: 10, a: 0.5 }],
    bands: [{ from: 'leftKnee', to: 'rightKnee', mid: 'pelvis', rx: 90, ry: 14, a: 0.3, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, 0.2], size: [1.0, 1.83, 0.006], yaw: 0 }],
  keyFrames: [0.3, 2.0, 3.8],
  qa: {
    pins: [{ c: 'handL', when: 'always' }, { c: 'handR', when: 'always' }, { c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    jointPins: [{ j: 'leftElbow', axes: 'xz' }, { j: 'rightElbow', axes: 'xz' }, { j: 'leftKnee' }, { j: 'rightKnee' }, { j: 'leftAnkle' }, { j: 'rightAnkle' }],
    allowContact: ['forearmL|upperArmL', 'forearmR|upperArmR'],
  },
};
