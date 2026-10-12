// hip-flexors-B 弹力带站姿高抬膝 (standing banded high knee), right leg. Standing tall, left palm flat on a wall in front
// (+Z) for balance, a band runs from a low post behind the body to the right forefoot. 'lift' drives the right knee up
// above hip height (hip flexion ~105 deg, knee ~90 deg, foot under the knee) against the band, holds 2 s, and lowers the
// foot back to its spot on the floor. The pelvis stays level and the torso tall (no lean back). Right arm hangs relaxed.
// The right foot is carried in world coordinates (standing spot = where a flat floor foot puts the ankle). 2 reps / 8 s.
// Head points +Y, front faces +Z, body left = +X.
const FR = [-0.105, 0.082, 0.005];                 // right ankle standing (flat floor foot)
const UP = [-0.095, 0.545, 0.335];                 // right ankle at the top (knee above the hip, shin hanging)
const MID = [-0.10, 0.33, 0.24];                   // swing waypoint (foot travels forward-up, not straight through the shin)
const WALLZ = 0.515, PZ = -0.50;
const rep = s => [[s + 0.2, 0], [s + 1.2, 1], [s + 3.2, 1], [s + 4.0, 0]];
const arc = s => [[s + 0.2, 0], [s + 0.7, 1], [s + 1.2, 0], [s + 3.2, 0], [s + 3.6, 1], [s + 4.0, 0]];
const relaxed = sg => ({ mode: 'free', frame: 'chest', wrist: [sg * 0.28, 0.91, -0.15], finger: [-sg * 0.05, -1, 0.1], normal: [-sg, 0, 0.1], poleUp: [sg * 0.3, 1.1, -0.5] });
const midDelta = MID.map((v, i) => +(v - (FR[i] + UP[i]) / 2 + FR[i]).toFixed(4));
export default {
  id: 'hip-flexors-B', name: '弹力带站姿高抬膝', nameEn: 'Standing Banded High Knee',
  timeline: { duration: 8, tracks: { lift: [[0, 0], ...rep(0), ...rep(4)], arc: [[0, 0], ...arc(0), ...arc(4)] } },
  pose: {
    base: {
      pelvis: [0, 0.88, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { body: [[[1, 0, 0], 0]] },
      hands: {
        left: { mode: 'free', frame: 'world', wrist: [0.215, 1.31, WALLZ - 0.035], finger: [-0.08, 1, 0], normal: [0, 0, 1], poleUp: [0.6, 1.0, 0.1] },
        right: relaxed(-1),
      },
      feet: {
        right: { mode: 'free', frame: 'world', ankle: FR, rot: [[[1, 0, 0], 0]], pole: [-0.1, 0.6, 1.2] },
        left: { mode: 'floor', at: [0.105, 0.0], heading: 4, pitch: 0 },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 178.5, weight: 1 },
        { type: 'reach', limb: 'leftArm', angle: 168, weight: 0.6 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0.0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
    },
    deltas: {
      lift: { feet: { right: { ankle: UP, rot: [[[1, 0, 0], 8]] } } },
      arc: { feet: { right: { ankle: midDelta } } },
    },
  },
  highlight: { groups: ['hip-flexors'], side: 'right', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [-1, 0.04, 0.45], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'leftPalm', 'rightPalm'], pad: 0.12, k: 1.0, drift: 4, at: 2.2 },
  frame: { mode: 'fit', width: 660, height: 840, cx: 540, cy: 500 },
  stillAt: 2.2,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }],
    bands: [] },
  props: [
    { type: 'wall', at: [0.32, 0, WALLZ], yaw: 180, size: [0.9, 2.2, 0.12] },
    { type: 'bandPost', at: [-0.10, 0, PZ], height: 0.45, tieY: 0.12 },
    { type: 'band', from: [-0.08, 0.12, PZ + 0.04], to: { bone: 'rightFoot', offset: [0.04, 0.03, 0.06] }, r: 0.007, colour: '#7a4a32' },
    { type: 'band', from: [-0.12, 0.12, PZ + 0.04], to: { bone: 'rightFoot', offset: [-0.04, 0.03, 0.06] }, r: 0.007, colour: '#7a4a32' },
    { type: 'band', from: { bone: 'rightFoot', offset: [0.04, 0.03, 0.06] }, to: { bone: 'rightFoot', offset: [-0.04, 0.03, 0.06] }, r: 0.007, sag: -0.03, colour: '#7a4a32' },
  ],
  keyFrames: [0.2, 0.7, 2.2],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'knee.left', min: 176 }],
    allowContact: ['handR|thighR'],
  },
};
