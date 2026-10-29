// Armfix-r2 template candidate, 2026-10-29. Original source retained. Low-resolution review required.
// h-standing-arm-extension-stretch 站姿双臂后伸开肩 (standing straight-arm shoulder extension stretch) · 缺口批次 1（gap-batch1-20261026，肩前侧/胸拉伸）.
// Standing tall, feet hip-width, knees soft, ribs down. Both arms hang long by the sides, palms facing the thighs. Keeping the
// elbows straight and the trunk upright (no leaning forward, no arching), both arms lift backward and slightly out to about
// 40 deg of shoulder extension while the shoulder blades draw gently back and down; hold where the front of the shoulders and
// the chest feel a mild stretch, then lower slowly. The hands do not touch or clasp each other (no finger interlock), and the
// head and neck stay still. Distinct from h-seated-reachback (seated, hands behind on the mat) and the old h-towel-behind
// (towel held behind the back, pending decision in the old-library audit): no prop, no hand contact.
// Design prescription (author, this file): 1 rep / 8 s: 0.5 s still, 1.5 s lift back, 3.5 s hold, 1.5 s lower, 1.0 s rest.
// Facing +Z, head +Y, body left = +X. Arms are straight chains in the chest frame (armWrist/armDir of lib/home-anim.mjs):
// flexion PHI(t) from -4 deg (hanging) to -40 deg (extension), abduction 8 -> 16 deg; shoulders.shift retracts the
// shoulder girdle 1.2 cm back at the hold.
import { build, keys, sg, r4, REST, armWrist, armDir } from '../lib/home-anim.mjs';
const DUR = 8;
const p = keys([[0, 0], [0.5, 0], [2.0, 1], [5.5, 1], [7.0, 0]], DUR);
const PHI = t => -4 - 36 * p(t), PSI = t => 8 + 8 * p(t);
const SHIFT = t => r4([0, -0.003 * p(t), -0.012 * p(t)]);
const hand = side => ({ mode: 'free', frame: 'chest', relax: 0.5,
  wrist: t => r4(armWrist(side, PHI(t), PSI(t), 0.482).map((x, i) => x + SHIFT(t)[i])),
  finger: t => r4(armDir(side, PHI(t), PSI(t))), normal: [-sg(side), 0, 0],
  poleUp: t => r4(REST.shoulder(side).map((v,i)=>v+.2567805323279002*armDir(side,PHI(t),PSI(t))[i]+SHIFT(t)[i])) });
const P = build(DUR, {
  pelvis: [0, 0.9519701718590191, 0.00404579831150554],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  shoulders: { shift: SHIFT },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.12, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { open: p });
export default {
  id: 'h-standing-arm-extension-stretch-r3', revisionOf: 'h-standing-arm-extension-stretch-r2', sourceBatch: 'remaining32-template-r2-20261029', name: '站姿双臂后伸开肩', nameEn: 'Standing Straight-Arm Shoulder Extension Stretch',
  modelProfile: 'training-human-v2plus-hands-native', alignClavicles: false,
  runtimeModel: {profile:'training-human-v3-armfix',version:'0.1.0-r2'}, nativeHands:{twistShare:1}, reviewed:false,releaseEligible:false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  fps: 30, size: 1080,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['deltoids', 'chest'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [-1, 0.12, 0.45], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.15, k: 0.85, drift: 0, at: 3.5, fitTimeline: true },
  frame: { mode: 'fit', width: 640, height: 900, cx: 512, cy: 505 },
  stillAt: 3.5,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [],
  keyFrames: [0.3, 2.0, 3.5, 7.5],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.left', min: 165 }, { j: 'elbow.right', min: 165 }],
    allowContact: [],
  },
};
