// hip-abductors-A 侧平板抬腿 (side plank hip abduction). Forearm side plank on the LEFT forearm (elbow under the shoulder,
// forearm flat on the mat pointing forward), body in one straight line, bottom foot on its outer edge; the right hand rests on
// the right hip (surface contact, no penetration); the straight top leg lifts with the toes pointing forward.
// Head points +X, front faces +Z (camera side), body left = -Y (down).
const TH = 10;                         // body incline, deg (solved further by h0)
// abducted right ankle (rest hips frame): rotate the rest leg about the hip joint around rest +Z by -a (right = rest -X)
const HIP = [-0.0815, 0.852], LEG = 0.762;
const ank = a => { const r = a * Math.PI / 180; return [+(HIP[0] - LEG * Math.sin(r)).toFixed(4), +(HIP[1] - LEG * Math.cos(r)).toFixed(4), -0.0186]; };
const A0 = -2, A1 = 36;
export default {
  id: 'hip-abductors-A', name: '侧平板抬腿', nameEn: 'Side Plank Hip Abduction',
  timeline: { duration: 6, tracks: { lift: [[0, 0], [0.3, 0], [1.3, 1], [1.9, 1], [3.0, 0], [3.3, 0], [4.3, 1], [4.9, 1]] } },
  pose: {
    base: {
      pelvis: [-0.45, 0.42, 0],
      hips: { up: [1, 0, 0], front: [0, 0, 1], rot: [[[0, 0, 1], TH], [[1, 0, 0], 0]] },
      hands: {
        left: { mode: 'floor', at: [0.0, 0.215], finger: [0.15, 1], poleUp: [0.6, 1.25, -0.15] },
        right: { mode: 'free', frame: 'hips', palmAt: [-0.165, 1.06, 0.03], finger: [0.05, -0.35, 0.94], normal: [1, 0, 0], poleUp: [-0.55, 1.15, -0.25], touch: { clear: 0.0015, from: 0.0, iters: 20 } },
      },
      feet: {
        left: { mode: 'floor', at: [-1.27, 0.0], heading: 0, pitch: 0, roll: -82 },
        right: { mode: 'free', frame: 'hips', ankle: ank(A0), rot: [[[0, 0, 1], -A0]], poleLow: [-0.12, 0.5, 0.6] },
      },
      constraints: [
        { type: 'mid', limb: 'leftArm', at: [0.0, 0.042, 0.0], weight: 1 },            // elbow on the mat, pinned
        { type: 'joint', joint: 'leftShoulder', axis: [1, 0, 0], value: 0.0, weight: 0.3 },   // shoulder stacked over the elbow
        { type: 'joint', joint: 'leftShoulder', axis: [0, 0, 1], value: 0.0, weight: 0.3 },
        { type: 'reach', limb: 'leftLeg', angle: 178, weight: 1 },
        { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 0.15 },
      ],
      solve: { vars: ['px', 'py', 'pz', 'h0', 'h1'], reg: { px: 0.5, py: 0.5, pz: 0.5, h0: 0.01, h1: 0.05 } },
    },
    deltas: { lift: { feet: { right: { ankle: ank(A1), rot: [[[0, 0, 1], -A1]] } } } },
  },
  highlight: { groups: ['hip-abductors'], side: 'right', pulseAt: [1.6, 4.6], pulseWidth: 0.5, pulseBase: 0.25 },
  camera: { dir: [-0.12, 0.30, 1], fit: ['head', 'leftPalm', 'leftElbow', 'leftToe', 'rightToe', 'pelvis', 'rightAnkle', 'rightElbow'], pad: 0.12, k: 0.75, drift: 0.9, at: 1.6 },
  frame: { mode: 'fit', width: 820, cx: 512, cy: 520 },
  stillAt: 1.6,
  shadow: { joints: ['leftPalm', 'leftElbow', 'leftAnkle', 'pelvis', 'leftShoulder'],
    blobs: [{ j: 'leftElbow', rx: 46, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 40, ry: 11, a: 0.6 }, { j: 'leftAnkle', rx: 40, ry: 10, a: 0.6 }],
    bands: [{ from: 'leftElbow', to: 'leftAnkle', mid: 'pelvis', rx: 60, ry: 14, a: 0.3, dy: 8, sag: 0.4 }] },
  props: [{ type: 'mat', at: [-0.55, 0, 0.05], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0, 0.8, 1.6],
  qa: {
    pins: [{ c: 'handL', when: 'always' }, { c: 'footL', when: 'always' }],
    jointPins: [{ j: 'leftElbow' }],
    straight: [{ j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    touch: [{ side: 'right', when: 'always' }],
    allowContact: ['handR|torso', 'forearmR|torso', 'handR|thighR', 'thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
