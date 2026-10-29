// Armfix-r2 template candidate, 2026-10-29. Original source retained. Low-resolution review required.
// h-supine-cactus-chest 仰卧仙人掌开胸 (supine cactus-arm chest stretch) · 缺口批次 1（gap-batch1-20261026，胸/肩前侧拉伸）.
// Lying on the back on a mat, knees bent and feet flat hip-width apart (hook lying), lower back relaxed. Both arms rest on the mat,
// elbows bent ~90 deg with the backs of the upper arms and forearms on the mat, palms up. From a low "W" (upper arms ~45 deg
// from the body) both arms slide along the mat up to the "cactus" position (upper arms at shoulder height, forearms pointing
// toward the head), the chest opens and the front of the shoulders sink toward the mat; hold, then slide back down. Gentle,
// passive end range only: stop where a mild stretch is felt across the chest; elbows and backs of the hands stay on the mat.
// No hand bears weight and the palms never press the floor (palms face up), so it does not depend on the palm-on-floor fix.
// Distinct from h-doorframe-forearms-pec-native-r3 (standing, doorframe) and h-seated-reachback (seated shoulder extension).
// Design prescription (author, this file): 1 rep / 8 s: 0.5 s still in W, 1.5 s slide up, 4.0 s hold in cactus, 1.5 s slide
// down, 0.5 s rest. Head -X, face up (+Y), body left = -Z (frame of h-supine-twist / h-bridge-march).
// Arms in the chest frame (rest coordinates): upper arm abducted ABD(t) and tipped TIP deg back toward the mat, forearm
// perpendicular to it in the same plane pointing head-ward (2-D rotation of the upper arm by 90 deg).
import { build, keys, sg, r4, REST, DEG } from '../lib/home-anim.mjs';
const UA=.2567805323279002,FA=.2280465039306538;
const add = (a, b) => a.map((x, i) => x + b[i]), mul = (a, k) => a.map(x => x * k), nrm = a => mul(a, 1 / Math.hypot(...a));
const DUR = 8, A0 = 45, A1 = 88, TIP = 0.16;
const p = keys([[0, 0], [0.5, 0], [2.0, 1], [6.0, 1], [7.5, 0]], DUR);
const arm = (side, t) => { const a = (A0 + (A1 - A0) * p(t)) * DEG, s = sg(side), S = REST.shoulder(side);
  const u = nrm([s * Math.sin(a), -Math.cos(a), -TIP]), f = nrm([s * Math.cos(a), Math.sin(a), -TIP * 0.6]);
  const E = add(S, mul(u, UA)); return { S, E, u, f, W: add(E, mul(f, FA)) }; };
const hand = side => ({ mode: 'free', frame: 'chest', relax: 0.6,
  wrist: t => r4(arm(side, t).W), finger: t => r4(arm(side, t).f), normal: [0, 0, 1],
  poleUp: t => r4(arm(side,t).E) }); // Keep IK elbow in the authored arm plane.

const foot = s => ({ mode: 'floor', at: [0.57, -sg(s) * 0.11], heading: 90, pitch: 0 });
const P = build(DUR, {
  pelvis: [-0.0639701718590191, 0.12004579831150554, 0],
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[1, 0, 0], 0]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: foot('left'), right: foot('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { open: p });
export default {
  id: 'h-supine-cactus-chest-r3', revisionOf: 'h-supine-cactus-chest-r2', sourceBatch: 'remaining32-template-r2-20261029', name: '仰卧仙人掌开胸', nameEn: 'Supine Cactus-Arm Chest Stretch',
  modelProfile: 'training-human-v2plus-hands-native', alignClavicles: false,
  runtimeModel: {profile:'training-human-v3-armfix',version:'0.1.0-r2'}, nativeHands:{twistShare:1}, reviewed:false,releaseEligible:false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  fps: 30, size: 1080,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['chest', 'deltoids'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [0.3, 0.75, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.8, drift: 0, at: 3.0, fitTimeline: true },
  frame: { mode: 'fit', width: 860, cx: 512, cy: 540 },
  stillAt: 4.0,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftAnkle', 'rightAnkle', 'leftElbow', 'rightElbow'],
    blobs: [{ j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 }, { j: 'pelvis', rx: 80, ry: 15, a: 0.5 },
      { j: 'leftAnkle', rx: 40, ry: 11, a: 0.55 }, { j: 'rightAnkle', rx: 40, ry: 11, a: 0.55 }, { j: 'leftElbow', rx: 36, ry: 10, a: 0.4 }, { j: 'rightElbow', rx: 36, ry: 10, a: 0.4 }],
    bands: [] },
  props: [{ type: 'mat', at: [-0.15, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.3, 2.0, 4.0, 6.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [],
    allowContact: ['upperArmL|torso', 'upperArmR|torso'],
  },
};
