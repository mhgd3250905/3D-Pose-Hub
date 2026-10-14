// h-banana 仰卧香蕉式侧伸 (supine banana stretch, bananasana) · H 居家核心拉伸系列 (replaces h-thread-needle, whose under-chest
// threading the rig could not do without the head and arms intersecting).
// Supine, legs long and together, arms overhead on the mat. The feet walk to the RIGHT and the arms and chest drift RIGHT too, so
// the body curves into a crescent (banana) and the whole LEFT side lengthens - obliques and lats; both shoulders and the pelvis
// stay on the mat. Hold and breathe, return through the centre, then curve to the LEFT. One cycle (both sides) / 8 s.
// Head points -X, face up (+Y), body right = +Z (frame of h-supine-twist). No solver: the hips turn about the vertical through
// the pelvis (legs swing right), the waist side-bends the chest the other way round (head and arms swing right as well).
import { build, keys, armDir, armWrist, sg, r4 } from '../lib/home-anim.mjs';
import { leg, REST } from '../lib/ss-geo.mjs';
const DUR = 8, AL = 17, AC = 19, FLEX = 186, ABD = 14;
const s = keys([[0, 0], [0.3, 0], [1.8, 1], [3.0, 1], [4.0, 0], [4.3, 0], [5.8, -1], [7.0, -1]], DUR);   // +1 = crescent to the right
const hipsYaw = t => -AL * s(t), waistYaw = t => (AL + AC) * s(t);
const legPose = side => ({ mode: 'free', frame: 'hips', ankle: leg(side, -2.5, 3).ankle, rot: [], poleLow: [sg(side) * 0.1, 0.5, 0.7] });
const hand = side => ({ mode: 'free', frame: 'chest', wrist: r4(armWrist(side, FLEX, ABD, 0.4838)), finger: r4(armDir(side, FLEX, ABD)), normal: [0, 0, 1],
  poleUp: r4([REST.shoulder(side)[0] + sg(side) * 0.35, 1.55, -0.25]), relax: 0.5 });
const P = build(DUR, {
  pelvis: [0, 0.118, 0],
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 1, 0], hipsYaw]] },
  chest: { waist: [[[0, 1, 0], waistYaw]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: legPose('left'), right: legPose('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { side: t => Math.abs(s(t)) });
export default {
  id: 'h-banana', name: '仰卧香蕉式侧伸', nameEn: 'Supine Banana Stretch',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['obliques', 'lats'], side: 'both', pulseTrack: 'side', pulseBase: 0.35 },
  camera: { dir: [0.6, 1.6, 0.05], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm'], pad: 0.08, k: 0.8, drift: 2, at: 2.4, fitTimeline: true },
  frame: { mode: 'fit', width: 820, height: 760, cx: 512, cy: 520 },
  stillAt: 2.4,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftPalm', 'rightPalm'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.6 }, { j: 'shoulderCenter', rx: 85, ry: 16, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 },
      { j: 'leftPalm', rx: 34, ry: 10, a: 0.4 }, { j: 'rightPalm', rx: 34, ry: 10, a: 0.4 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 14, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.2, 0, 0], size: [2.1, 0.8, 0.006] }],
  keyFrames: [0.15, 2.4, 6.4],
  qa: {
    pins: [],
    straight: [{ j: 'elbow.right', min: 165 }, { j: 'elbow.left', min: 165 }, { j: 'knee.right', min: 168 }, { j: 'knee.left', min: 168 }],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR', 'kneeL|kneeR'],
  },
};
