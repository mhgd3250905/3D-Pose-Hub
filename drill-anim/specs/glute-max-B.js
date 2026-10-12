// glute-max-B 弹力带四足直腿后踢 (banded quadruped straight-leg kickback), right leg working.
// Quadruped frame of forearms-A: head points +X, body faces the floor (-Y), body left = -Z. Hands flat under the shoulders
// (pinned), arms locked, left knee pinned on the mat, left toes tucked. The right leg is carried in world coordinates: it
// stays straight (knee 178 deg) the whole loop: it rests extended back ~10 deg below the hip line (toes just above the mat) and
// 'kick' sweeps the straight leg up to ~12 deg above the hip line (sole facing back), holds 1 s, and lowers (no re-kneel).
// A loop band runs round both ankles. 2 even reps / 8 s.
// v2 (Hark self-QA #91, on top of uuugk a830ecc): the kneeling knee really rests on the mat. v1/v2 pinned the knee joint at y 0.0765, which left the
// lowest shin/knee skin 40 mm above the floor (34 mm above the mat): the knee floated. KY 0.0407 puts the kneecap on the mat;
// the hip drops by the same amount (thigh stays vertical), and the straight leg's arc is recomputed round the new hip.
// (KX -0.524 -> -0.515, HIP x -0.511 -> -0.502, FX -0.90 -> -0.868: keep the hip-shoulder and knee-ankle distances = real bone lengths
//  at the lower hip/knee; without them the solver twisted the trunk 7 cm sideways and the right arm bent to 174 deg)
const HZ = 0.19, KX = -0.515, KY = 0.0407, KZ = 0.0857, FX = -0.868, HY = 0.3932;
const floorHand = z => ({ mode: 'floor', at: [0.0, z], finger: [1, 0], poleUp: [Math.sign(z) * -0.24, 0.95, 0.18] });
// right hip (world, solved pose) + exact two-bone reach for a 178 deg knee, LIFT deg above horizontal, straight back (-X)
// Hark: HIP = the solved right hip joint (probe) - near full extension a 2 mm hip error costs ~6 deg of knee; knee target 177.5 deg
const HIP = [-0.5033, 0.3914, 0.0775], TH = 0.35292, SH = 0.40981, REACH = Math.sqrt(TH * TH + SH * SH + 2 * TH * SH * Math.cos(2.5 * Math.PI / 180));
const LIFT = 12 * Math.PI / 180;
const kickAnk = [HIP[0] - REACH * Math.cos(LIFT), HIP[1] + REACH * Math.sin(LIFT), HIP[2]];
// start/return: the straight leg already extended back, DOWN deg below the hip line, toes just above the mat (no re-kneel)
const DOWN = 11.62 * Math.PI / 180;   // v2: 24 deg put the toes 12 cm into the mat; Hark: 11.62 deg = toe tip on the mat (v2's 10 deg left it 65 mm up)
const lowAnk = [HIP[0] - REACH * Math.cos(DOWN), HIP[1] - REACH * Math.sin(DOWN), HIP[2]];
// straight leg moves on an arc round the hip, not on the chord: 'arc' adds the sagitta at mid-swing (radial, mid angle)
const MID = (LIFT - DOWN) / 2, SAG = REACH * (1 - Math.cos((LIFT + DOWN) / 2));
const arcAnk = [lowAnk[0] - SAG * Math.cos(MID), lowAnk[1] + SAG * Math.sin(MID), HIP[2]];
const rep = s => [[s, 0], [s + 1.0, 1], [s + 2.0, 1], [s + 3.3, 0]];
const arc = s => [[s, 0], [s + 0.5, 1], [s + 1.0, 0], [s + 2.0, 0], [s + 2.65, 1], [s + 3.3, 0]];
export default {
  id: 'glute-max-B', name: '弹力带四足直腿后踢', nameEn: 'Banded Quadruped Straight-Leg Kickback',
  timeline: { duration: 8, tracks: {
    kick: [[0, 0], ...rep(0.4), ...rep(4.4), [8, 0]],
    arc: [[0, 0], ...arc(0.4), ...arc(4.4), [8, 0]],
  } },
  pose: {
    base: {
      pelvis: [-0.52, 0.414, 0],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 8]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      hands: { right: floorHand(HZ), left: floorHand(-HZ) },
      feet: {
        right: { mode: 'free', frame: 'world', ankle: lowAnk, rot: [[[1, 0, 0], 86], [[0, 1, 0], 90]], pole: [KX, -0.30, KZ] },
        left: { mode: 'floor', at: [FX, -KZ], heading: 90, pitch: 62, pole: [KX, KY, -KZ] },
      },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'mid', limb: 'leftLeg', at: [KX, KY, -KZ], weight: 1 },
        { type: 'joint', joint: 'rightHip', axis: [0, 1, 0], value: HY, weight: 0.6 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz', 'h0', 'c0'], reg: { px: 0.3, py: 0.3, pz: 1, h0: 0.01, c0: 0.3 }, iters: 80 },
    },
    deltas: {
      kick: { feet: { right: { ankle: kickAnk, rot: [[[1, 0, 0], 90], [[0, 1, 0], 90]] } } },
      arc: { feet: { right: { ankle: arcAnk } } },
    },
  },
  highlight: { groups: ['glute-max'], side: 'right', pulseTrack: 'kick', pulseBase: 0.3 },
  camera: { dir: [-0.25, 0.42, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftShoulder'], pad: 0.14, k: 0.75, drift: 4, at: 1.9 },
  frame: { mode: 'fit', width: 840, cx: 512, cy: 545 },
  stillAt: 1.9,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightKnee', 'leftKnee', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 46, ry: 12, a: 0.7 }, { j: 'leftKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'leftToe', rx: 30, ry: 9, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'leftKnee', mid: 'pelvis', rx: 70, ry: 15, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [
    { type: 'mat', at: [-0.46, 0, 0], size: [1.83, 0.61, 0.006] },   // Hark: -0.40 -> -0.46 so the resting right toe (x ~ -1.33) is on the mat,
    // loop band round both ankles: two strands (over the instep side and the heel side of each ankle)
    { type: 'band', from: { bone: 'rightFoot', offset: [0, 0.035, 0.03] }, to: { bone: 'leftFoot', offset: [0, 0.035, 0.03] }, r: 0.007, sag: 0.0, colour: '#7a4a32' },
    { type: 'band', from: { bone: 'rightFoot', offset: [0, 0.035, -0.035] }, to: { bone: 'leftFoot', offset: [0, 0.035, -0.035] }, r: 0.007, sag: 0.0, colour: '#7a4a32' },
  ],
  keyFrames: [0, 1.4, 2.4],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footL', when: 'always' }],
    jointPins: [{ j: 'leftKnee' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 176 }],
    allowContact: ['thighL|shinL'],
  },
};
