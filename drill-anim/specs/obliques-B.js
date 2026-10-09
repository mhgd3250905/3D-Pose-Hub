// obliques-B 弹力带抗旋转推 (banded Pallof press). Standing tall side-on to a band post (post on the body's RIGHT, -X),
// feet a little wider than the hips, knees soft. Both hands hold the band together at the sternum; 'press' pushes the
// hands straight out in front of the chest until the arms are locked, holds 2 s while the trunk refuses to twist toward the
// post (anti-rotation, obliques), and brings the hands back. Hips and shoulders stay square. 2 reps / 8 s.
// Head points +Y, front faces +Z, body left = +X (rest frame; hands in the chest frame).
const S = sg => [sg * 0.188, 1.37, -0.004];
const UA = 0.25678, FA = 0.22805, R = Math.sqrt(UA * UA + FA * FA + 2 * UA * FA * Math.cos(2.5 * Math.PI / 180));
const HX = 0.05, HY = 1.24;
const W0 = sg => [sg * HX, 1.205, 0.175];
const W1 = sg => { const s = S(sg), dx = sg * HX - s[0], dy = HY - s[1]; return [sg * HX, HY, +(s[2] + Math.sqrt(R * R - dx * dx - dy * dy)).toFixed(4)]; };
const hand = (sg, w) => ({ mode: 'free', frame: 'chest', relax: 1, wrist: w, finger: [sg * 0.08, 0.35, 1], normal: [-sg, 0, 0], poleUp: [sg * 0.9, 0.9, -0.3] });
const PX = -0.95, PZ = 0.33, TIE = 1.22;
const rep = s => [[s + 0.3, 0], [s + 1.2, 1], [s + 3.2, 1], [s + 4.0, 0]];
export default {
  id: 'obliques-B', name: '弹力带抗旋转推', nameEn: 'Banded Pallof Press',
  timeline: { duration: 8, tracks: { press: [[0, 0], ...rep(0), ...rep(4)] } },
  pose: {
    base: {
      pelvis: [0, 0.87, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 3]] },
      chest: { body: [[[1, 0, 0], -3]] },
      hands: { right: hand(-1, W0(-1)), left: hand(1, W0(1)) },
      feet: {
        right: { mode: 'floor', at: [-0.15, 0.0], heading: -8, pitch: 0 },
        left: { mode: 'floor', at: [0.15, 0.0], heading: 8, pitch: 0 },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 172, weight: 1 }, { type: 'reach', limb: 'rightLeg', angle: 172, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
    },
    deltas: { press: { hands: { right: { wrist: W1(-1) }, left: { wrist: W1(1) } } } },
  },
  highlight: { groups: ['obliques'], side: 'both', pulseTrack: 'press', pulseBase: 0.3 },
  camera: { dir: [0.45, 0.15, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'leftPalm', 'rightElbow', 'leftElbow'], pad: 0.12, k: 1.0, drift: 2, at: 2.0 },
  frame: { mode: 'fit', width: 600, height: 860, cx: 580, cy: 520 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.65 }], bands: [] },
  props: [
    { type: 'bandPost', at: [PX, 0, PZ], height: 1.5, tieY: TIE },
    { type: 'band', from: [PX + 0.04, TIE, PZ], to: { bone: 'rightHand', offset: [0, 0.07, 0.0] }, r: 0.007, sag: 0, colour: '#7a4a32' },
    { type: 'band', from: [PX + 0.04, TIE - 0.02, PZ], to: { bone: 'leftHand', offset: [0, 0.07, 0.0] }, r: 0.007, sag: 0, colour: '#7a4a32' },
  ],
  keyFrames: [0.3, 1.2, 2.2],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176, when: 'params.press>0.999' }, { j: 'elbow.left', min: 176, when: 'params.press>0.999' }],
    allowContact: ['handL|handR'],
  },
};
