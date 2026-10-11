// chest-C 绳索单臂站姿推胸 (single-arm standing cable press). Split stance (left foot forward, right foot back on the ball),
// torso tall with a slight forward lean, hips and shoulders square (anti-rotation). The RIGHT hand holds a single D-handle
// (neutral grip) on a cable from a pulley BEHIND the body at just below shoulder height, set ~0.17 m outside the right shoulder so the
// cable runs below the armpit and outside the arm instead of lying on it (cable >= 60 mm from the body and arm all cycle).
// D-handle: 19 cm grip, loop swung toward the back of the hand / the cable (lean 0.6) so the frame stays clear of the fist (>= 4 mm).
// 'press' 0 = hand beside the right chest in front of the armpit, elbow ~55 deg, back and down; 1 = arm locked straight directly in front
// of the right shoulder (never crosses the midline).
// 2 reps / 8 s: 1.1 s press, 0.7 s squeeze, 1.5 s controlled return (slower eccentric on purpose), 0.7 s pause.
// Camera from the right side, slightly in front (like the reference): arm extension, the cable line and the right pec are all in view.
// Head points +Y, front faces +Z, body left = +X (rest frame). Cable column behind the body at -Z.
const DEG = Math.PI / 180;
const SH = [-0.188, 1.37, -0.004];                        // rest right shoulder
const UA = 0.25678, FA = 0.22805;
const reach = ang => Math.sqrt(UA * UA + FA * FA - 2 * UA * FA * Math.cos(ang * DEG));
const wristAt = (dir, ang) => { const n = Math.hypot(...dir), L = reach(ang); return dir.map((d, i) => +(SH[i] + d / n * L).toFixed(4)); };
const W0 = [-0.25, 1.22, 0.14];                           // handle beside the right chest, in front of the armpit
const W1 = wristAt([0, -0.06, 1], 178.5);                 // arm locked straight in front of the right shoulder
const rep = s => [[s + 0.4, 0], [s + 1.5, 1], [s + 2.2, 1], [s + 3.7, 0]];
export default {
  id: 'chest-C', name: '绳索单臂站姿推胸', nameEn: 'Single-Arm Standing Cable Press',
  timeline: { duration: 8, tracks: { press: [[0, 0], ...rep(0), ...rep(4)] } },
  pose: {
    base: {
      pelvis: [0, 0.87, -0.05],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 4]] },
      chest: { body: [[[1, 0, 0], 3]] },
      hands: {
        right: { mode: 'free', frame: 'chest', relax: 0, wrist: W0, finger: [0.05, 0.0, 1], normal: [1, 0, 0], poleUp: [-0.5, -0.5, -0.8] },
        left: { mode: 'free', frame: 'chest', wrist: [0.262, 0.905, 0.05], finger: [-0.05, -1, 0.12], normal: [-1, 0, 0.1], poleUp: [0.3, 1.1, -0.5] },
      },
      feet: {
        left: { mode: 'floor', at: [0.115, 0.30], heading: 2, pitch: 0 },
        right: { mode: 'floor', at: [-0.115, -0.46], heading: -4, pitch: 38 },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 162, weight: 1 },
        { type: 'reach', limb: 'rightLeg', angle: 171, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
    },
    deltas: { press: { hands: { right: { wrist: W1, finger: [0.02, 0.0, 1], poleUp: [-0.6, -0.8, 0] } } } },
  },
  highlight: { groups: ['chest'], side: 'right', pulseTrack: 'press', pulseBase: 0.3 },
  camera: { dir: [-1, 0.14, 0.32], fit: ['head', 'leftToe', 'rightToe', 'rightAnkle', 'pelvis', 'rightPalm', 'rightElbow'], pad: 0.14, k: 1.0, drift: 0.9, at: 1.5 },
  frame: { mode: 'fit', width: 520, height: 700, cx: 640, cy: 560 },
  stillAt: 1.5,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'rightToe', rx: 36, ry: 10, a: 0.6 }],
    bands: [{ from: 'rightToe', to: 'leftAnkle', mid: 'pelvis', rx: 60, ry: 14, a: 0.28, dy: 4, sag: 0.0 }] },
  props: [
    { type: 'cableStack', name: 'pulley', at: [-0.5, 0, -1.0], yaw: 0, height: 2.15, pulleyY: 1.15 },
    { type: 'dHandle', side: 'right', name: 'handle', toward: 'pulley', shift: 0.01, len: 0.19, depth: 0.12, lean: 0.6 },
    { type: 'cable', from: 'pulley', to: 'handle' },
  ],
  keyFrames: [0.4, 1.5, 3.0],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176, when: 'params.press>0.999' }],
    allowContact: ['handL|thighL'],
  },
};
