// erectors-C 45° 罗马椅背伸 (45-degree hyperextension). Body line rises toward +Z at 45 deg; body faces down-forward
// f = (0, -0.71, 0.71); body left = +X. Legs straight and fixed: feet flat on the plate (perpendicular to the legs), ankles locked
// under the rollers, the front of the thighs on the hip pads just below the hip joints. The hips hinge: 'h' rotates the pelvis and
// torso about the hip axis (held fixed by joint constraints) from the straight line (0) down to 85 deg of hip flexion, spine neutral.
// Arms crossed on the chest as in the reference (quadriceps-A hands: each palm on the front of the opposite shoulder, touch bisect).
// Loop 8 s = 2 even reps of 4 s: 1.0 s hold in line / 1.4 s lower / 0.2 s bottom / 1.4 s raise.
const AN = 45 * Math.PI / 180, U = [0, Math.sin(AN), Math.cos(AN)], F = [0, -Math.cos(AN), Math.sin(AN)];
const add = (a, b) => a.map((v, i) => v + b[i]), mul = (a, k) => a.map(v => v * k);
const H = [0, 1.0, 0.0];                                    // hip-joint centre (world), fixed
const LT = 0.353, LS = 0.41, KA = 178.5 * Math.PI / 180, LEG = Math.sqrt(LT * LT + LS * LS - 2 * LT * LS * Math.cos(KA));
const FX = 0.08;
const ankle = sg => add([sg * FX, 0, 0], add(H, mul(U, -LEG)));
const AC = add(H, mul(U, -LEG));                             // ankle centre line point
const PADU = 0.205, PADF = 0.159, ROLU = 0.10, ROLF = 0.088, SOLE = 0.0845;
const PAD = add(H, add(mul(U, -PADU), mul(F, PADF)));
const ROL = add(AC, add(mul(U, ROLU), mul(F, -ROLF)));
const PLATE = add(AC, add(mul(U, -SOLE), mul(F, 0.06)));
const foot = sg => ({ mode: 'free', frame: 'world', ankle: ankle(sg), rot: [[[1, 0, 0], 45]], pole: add(add(H, mul(U, -0.36)), add([sg * 0.1, 0, 0], mul(F, 0.6))) });
const hand = (s, at, fin, pole, clear = 0.0015) => ({ mode: 'free', frame: 'chest', palmAt: at, finger: fin, normal: [0, -0.25, -1], poleUp: pole,
  touch: { clear, from: 0.0, solve: 'bisect', iters: 16 } });
const PEL = add(H, mul(U, 0.048));
const rep = s => [[s + 1.0, 0], [s + 2.4, 1], [s + 2.6, 1], [s + 4.0, 0]];
export default {
  id: 'erectors-C', name: '45° 罗马椅背伸', nameEn: '45° Hyperextension',
  timeline: { duration: 8, tracks: { h: [[0, 0], ...rep(0), ...rep(4)] } },
  pose: {
    base: {
      pelvis: PEL,
      hips: { up: U, front: F, rot: [[[1, 0, 0], 0]] },
      hands: { right: hand('right', [0.12, 1.33, 0.12], [0.55, 0.45, -0.5], [-0.12, 1.10, 0.22]), left: hand('left', [-0.085, 1.31, 0.11], [-0.55, 0.45, -0.5], [0.10, 1.10, 0.24], 0.0024) },
      feet: { right: foot(-1), left: foot(1) },
      constraints: [
        { type: 'joint', joint: 'leftHip', axis: [0, 1, 0], value: H[1] }, { type: 'joint', joint: 'leftHip', axis: [0, 0, 1], value: H[2] },
        { type: 'joint', joint: 'rightHip', axis: [0, 1, 0], value: H[1] }, { type: 'joint', joint: 'rightHip', axis: [0, 0, 1], value: H[2] },
      ],
      solve: { vars: ['py', 'pz'], reg: { py: 0.01, pz: 0.01 } },
    },
    deltas: { h: { hips: { rot: [[[1, 0, 0], 85]] } } },
  },
  highlight: { groups: ['erectors'], side: 'both', pulseTrack: 'h', pulseBase: 1.0 },
  camera: { dir: [1, 0.55, 0.1], fit: ['head', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftShoulder', 'rightShoulder'], pad: 0.24, k: 1.0, drift: 6, at: 0 },
  frame: { mode: 'fit', width: 760, cx: 512, cy: 530 },
  stillAt: 0,
  shadow: { joints: ['pelvis'], blobs: [{ j: 'pelvis', rx: 160, ry: 18, a: 0.25 }], bands: [] },
  props: [{ type: 'romanChair', angle: 45, pad: PAD, roller: ROL, plate: PLATE }],
  keyFrames: [0.5, 2.5, 3.3],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    jointPins: [{ j: 'leftHip' }, { j: 'rightHip' }],
    straight: [{ j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    touch: [{ side: 'right', when: 'always' }, { side: 'left', when: 'always' }],
    allowContact: ['forearmL|forearmR', 'forearmL|upperArmR', 'forearmR|upperArmL', 'handR|upperArmL', 'handL|upperArmR', 'forearmL|handR', 'forearmR|handL'],
  },
};
