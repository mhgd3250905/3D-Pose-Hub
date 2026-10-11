// quadriceps-B 弹力带终末伸膝 (banded terminal knee extension), right leg. Standing tall, facing a low band post (+Z), the
// band loops round the back of the right knee and pulls it forward into a slight bend; 'lock' drives the knee fully straight
// against the band (quadriceps squeeze), holds 2 s, then lets the band pull it back to ~22 deg of bend. Both feet flat and
// pinned (right foot half a step ahead); hips stay level, the heel never lifts. Arms hang relaxed. 2 reps / 8 s.
// Head points +Y, front faces +Z, body left = +X (rest frame).
const PX = -0.11, PZ = 0.78, TIE = 0.47;
const rep = s => [[s + 0.3, 0], [s + 1.1, 1], [s + 3.1, 1], [s + 4.0, 0]];
const relaxed = sg => ({ mode: 'free', frame: 'chest', wrist: [sg * 0.275, 0.905, -0.035], finger: [-sg * 0.05, -1, 0.1], normal: [-sg, 0, 0.1], poleUp: [sg * 0.3, 1.1, -0.5] });
export default {
  id: 'quadriceps-B', name: '弹力带终末伸膝', nameEn: 'Banded Terminal Knee Extension',
  timeline: { duration: 8, tracks: { lock: [[0, 0], ...rep(0), ...rep(4)] } },
  pose: {
    base: {
      pelvis: [0, 0.88, -0.02],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 2]] },
      chest: { body: [[[1, 0, 0], -2]] },
      hands: { right: relaxed(-1), left: relaxed(1) },
      feet: {
        right: { mode: 'floor', at: [-0.105, 0.13], heading: -6, pitch: 0 },
        left: { mode: 'floor', at: [0.105, -0.07], heading: 6, pitch: 0 },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 178.5, weight: 1 },
        { type: 'reach', limb: 'rightLeg', angle: 158, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
    },
    deltas: { lock: { constraints: [{}, { angle: 179.5 }, {}] } },
  },
  highlight: { groups: ['quadriceps'], side: 'right', pulseTrack: 'lock', pulseBase: 0.3 },
  camera: { dir: [-1, 0.14, 0.32], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightKnee', 'rightPalm'], pad: 0.12, k: 1.0, drift: 4, at: 2.0 },
  frame: { mode: 'fit', width: 640, height: 820, cx: 560, cy: 540 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.65 }],
    bands: [{ from: 'rightToe', to: 'leftAnkle', mid: 'pelvis', rx: 60, ry: 14, a: 0.28, dy: 4, sag: 0.0 }] },
  props: [
    { type: 'bandPost', at: [PX, 0, PZ], height: 0.62, tieY: TIE },
    // loop band: two strands from the post to either side of the knee, closed by the strand behind the knee
    { type: 'band', from: [PX + 0.02, TIE, PZ - 0.04], to: { bone: 'rightShin', offset: [0.055, 0.03, -0.02] }, r: 0.007, colour: '#7a4a32' },
    { type: 'band', from: [PX - 0.02, TIE, PZ - 0.04], to: { bone: 'rightShin', offset: [-0.055, 0.03, -0.02] }, r: 0.007, colour: '#7a4a32' },
    { type: 'band', from: { bone: 'rightShin', offset: [0.055, 0.03, -0.02] }, to: { bone: 'rightShin', offset: [0, 0.03, -0.068] }, r: 0.007, sag: 0, colour: '#7a4a32' },
    { type: 'band', from: { bone: 'rightShin', offset: [0, 0.03, -0.068] }, to: { bone: 'rightShin', offset: [-0.055, 0.03, -0.02] }, r: 0.007, sag: 0, colour: '#7a4a32' },
  ],
  keyFrames: [0.3, 1.1, 2.0],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'knee.left', min: 176 }, { j: 'knee.right', min: 176, when: 'params.lock>0.999' }],
    allowContact: ['handL|thighL', 'handR|thighR'],
  },
};
