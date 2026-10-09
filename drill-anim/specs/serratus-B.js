// serratus-B 泡沫轴墙面上滑 (foam-roller wall slide). Standing tall facing a wall (+Z), a foam roller held against the wall
// by the pinky side of both forearms (forearms parallel, palms facing each other). 'slide' pushes into the wall and rolls the
// roller up: the arms go from ~90 deg shoulder flexion (elbows at 90) to ~135 deg with the elbows almost straight, the roller
// rolling up the forearms toward the elbows; at the top the shoulder blades wrap forward (serratus) and hold 2 s, then the
// arms slide back down. The roller follows the forearms (props follow option) and stays against the wall. 2 reps / 8 s.
// Head points +Y, front faces +Z, body left = +X (rest frame; hands in the chest frame = rest coordinates).
const S = sg => [sg * 0.188, 1.37, -0.004];
const UA = 0.25678, FA = 0.22805;
const elbowAt = (sg, flex) => { const a = flex * Math.PI / 180, s = S(sg); return [s[0], s[1] - UA * Math.cos(a), s[2] + UA * Math.sin(a)]; };
const W0 = sg => { const e = elbowAt(sg, 90); return [sg * 0.17, +(e[1] + FA).toFixed(4), +e[2].toFixed(4)]; };
// top: elbow at 135 deg flexion; forearm mid stays at the same depth as at the start (roller against the wall)
const W1 = sg => { const e0 = elbowAt(sg, 90), e = elbowAt(sg, 135); const wz = 2 * e0[2] - e[2], dz = wz - e[2], dy = Math.sqrt(FA * FA - dz * dz);
  return [sg * 0.17, +(e[1] + dy).toFixed(4), +wz.toFixed(4)]; };
const ROLLR = 0.075, ZR = +(elbowAt(1, 90)[2] + 0.036 + ROLLR - 0.0102).toFixed(4);   // roller centre depth (world)
const WALLZ = +(ZR + ROLLR).toFixed(4);
const rep = s => [[s + 0.2, 0], [s + 1.5, 1], [s + 3.0, 1], [s + 4.0, 0]];
const hand = (sg, w) => ({ mode: 'free', frame: 'chest', wrist: w, finger: [0, 1, 0.15], normal: [-sg, 0, 0], poleUp: [sg * 0.6, 0.8, 0.6] });
export default {
  id: 'serratus-B', name: '泡沫轴墙面上滑', nameEn: 'Foam Roller Wall Slide',
  timeline: { duration: 8, tracks: { slide: [[0, 0], ...rep(0), ...rep(4)], prot: [[0, 0], [1.3, 0], [1.7, 1], [3.0, 1], [3.4, 0], [5.3, 0], [5.7, 1], [7.0, 1], [7.4, 0]] } },
  pose: {
    base: {
      pelvis: [0, 0.885, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { body: [[[1, 0, 0], 0]] },
      shoulders: { shift: [0, 0, 0] },
      hands: { right: hand(-1, W0(-1)), left: hand(1, W0(1)) },
      feet: {
        right: { mode: 'floor', at: [-0.105, -0.02], heading: -4, pitch: 0 },
        left: { mode: 'floor', at: [0.105, -0.02], heading: 4, pitch: 0 },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 178.5, weight: 1 }, { type: 'reach', limb: 'rightLeg', angle: 178.5, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 1 } },
    },
    deltas: {
      slide: { hands: { right: { wrist: W1(-1) }, left: { wrist: W1(1) } } },
      prot: { shoulders: { shift: [0, 0, 0.022] } },
    },
  },
  highlight: { groups: ['serratus'], side: 'both', pulseTrack: 'slide', pulseBase: 0.3 },
  camera: { dir: [-1, 0.12, -0.15], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'leftPalm', 'rightElbow'], pad: 0.12, k: 1.0, drift: 2, at: 2.2 },
  frame: { mode: 'fit', width: 600, height: 860, cx: 540, cy: 520 },
  stillAt: 2.2,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.65 }], bands: [] },
  props: [
    { type: 'wall', at: [0, 0, WALLZ], yaw: 180, size: [1.3, 2.3, 0.12] },
    { type: 'foamRoller', r: ROLLR, length: 0.42, follow: [{ bone: 'rightForearm' }, { bone: 'rightHand' }, { bone: 'leftForearm' }, { bone: 'leftHand' }], fixZ: ZR },
  ],
  keyFrames: [0.2, 1.0, 2.2],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'knee.left', min: 176 }, { j: 'knee.right', min: 176 }],
    allowContact: [],
  },
  qaProps: [],
};
