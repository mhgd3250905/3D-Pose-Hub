// hamstrings-B 滑盘腿弯举 (slider leg curl). Supine bridge on the mat, head -X, face up (+Y), body left = -Z (frame of
// glute-max-A). Shoulders and head on the mat, arms flat and pinned, hips held high; both feet rest flat on sliders.
// 'out' slides both heels away until the legs are nearly straight (knee ~160 deg; v2 FOUT 0.77) while the hips stay up (body in one line),
// then the hamstrings curl the heels back under the knees (knee ~90 deg) with the hips at full bridge. The sliders travel with
// the heels. 2 reps / 8 s: 1.6 s slow push out, 0.3 s, 1.2 s curl in, 0.9 s squeeze at the top.
const rep = s => [[s + 0.6, 0], [s + 2.2, 1], [s + 2.5, 1], [s + 3.7, 0]];
const FIN = 0.50, FOUT = 0.77, FZ = 0.11, PITCH_OUT = -24;   // foot flat on the slider at the curl, rolls back onto the heel as the legs extend
const ALPHA_IN = 30, ALPHA_OUT = 16;
const foot = (x, z) => ({ mode: 'floor', at: [x, z], heading: 90, pitch: 0, floor: 0.008, poleLow: [-Math.sign(z) * 0.12, 0.55, 0.6] });
export default {
  id: 'hamstrings-B', name: '滑盘腿弯举', nameEn: 'Slider Leg Curl',
  timeline: { duration: 8, tracks: { out: [[0, 0], ...rep(0), ...rep(4), [8, 0]] } },
  pose: {
    base: {
      pelvis: [0.0, 0.115, 0],
      hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], ALPHA_IN]] },
      chest: { waist: [[[0, 0, 1], -ALPHA_IN * 0.6]] },
      hands: {
        right: { mode: 'floor', at: [0.0, 0.265], finger: [1, 0.05], poleUp: [-0.35, 1.1, -0.1] },
        left: { mode: 'floor', at: [0.0, -0.265], finger: [1, -0.05], poleUp: [0.35, 1.1, -0.1] },
      },
      feet: { left: foot(FIN, -FZ), right: foot(FIN, FZ) },
      constraints: [
        { type: 'joint', joint: 'shoulderCenter', axis: [0, 1, 0], value: 0.095, weight: 0.5 },
        { type: 'joint', joint: 'head', axis: [0, 1, 0], value: 0.127, weight: 1 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: -0.47, weight: 0.1 },
        { type: 'reach', limb: 'rightArm', angle: 176, weight: 1 }, { type: 'reach', limb: 'leftArm', angle: 176, weight: 1 },
      ],
      solve: { vars: ['px', 'py'], reg: { px: 3, py: 0.5 } },
    },
    deltas: { out: { hips: { rot: [[[0, 0, 1], ALPHA_OUT]] }, chest: { waist: [[[0, 0, 1], -ALPHA_OUT * 0.6]] }, feet: { left: { at: [FOUT, -FZ], pitch: PITCH_OUT }, right: { at: [FOUT, FZ], pitch: PITCH_OUT } } } },
  },
  highlight: { groups: ['hamstrings'], side: 'both', pulseAt: [3.4, 7.4], pulseWidth: 0.9, pulseBase: 0.3 },
  camera: { dir: [0.1, 0.3, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm'], pad: 0.12, k: 0.7, drift: 3, at: 3.7 },
  frame: { mode: 'fit', width: 840, cx: 512, cy: 540 },
  stillAt: 2.3,
  shadow: { joints: ['leftToe', 'leftAnkle', 'rightAnkle', 'rightPalm', 'leftPalm', 'pelvis', 'shoulderCenter', 'head'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'shoulderCenter', rx: 90, ry: 14, a: 0.55 }, { j: 'head', rx: 55, ry: 12, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'leftAnkle', mid: 'pelvis', rx: 60, ry: 12, a: 0.25, dy: 4, sag: 0.6 }] },
  props: [
    { type: 'mat', at: [0.05, 0, 0], size: [1.83, 0.61, 0.006] },
    // sliders ride under the feet: follow the foot bone in x/z, stay flat on the floor (props attach option flat, #31)
    { type: 'sliders', colour: '#8c929c', attach: 'rightFoot', flat: true, offset: [0, -0.09, 0.02], r: 0.09 },
    { type: 'sliders', colour: '#8c929c', attach: 'leftFoot', flat: true, offset: [0, -0.09, 0.02], r: 0.09 },
  ],
  keyFrames: [0.3, 2.3, 4.6],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [],
    allowContact: ['handR|thighR', 'handL|thighL', 'forearmR|torso', 'forearmL|torso', 'upperArmR|torso', 'upperArmL|torso', 'thighR|shinR', 'thighL|shinL'],
  },
};
