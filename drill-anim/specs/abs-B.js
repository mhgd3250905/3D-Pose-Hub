import { gripPose } from '../lib/grip.mjs';
// abs-B 平行杆团身 L 撑 (parallette tuck L-sit). Head up (+Y), body faces +Z, body left = +X.
// Same parallettes + world-pinned grip as triceps-B (arms locked, shoulders pressed down the whole loop). The feet never
// touch the floor: both legs are carried in the hips frame. 'tuck' (base = full tuck hold, never below 0.75) drives the knees from hip height up to the chest while
// the pelvis tilts back (posterior tilt, lower back rounds a little, chest stays upright); 'ext' is the progression from the
// cue: the right leg straightens forward into a half-L, then tucks back. Loop 8 s.
const BX = 0.26, BH = 0.34;
const A = 65 * Math.PI / 180, GF = 0.148, GN = 0.035;   // grip fit shared with triceps-B
const fdir = sg => [sg * Math.cos(A), -Math.sin(A), 0], ndir = sg => [-sg * Math.sin(A), -Math.cos(A), 0];
const wristAt = sg => { const f = fdir(sg), n = ndir(sg); return [sg * BX - f[0] * GF - n[0] * GN, BH - f[1] * GF - n[1] * GN, 0]; };
// v2: closed power grip round the bar (baked fist, lib/grip.mjs + gripHand props): wrist over the bar, palm facing in
const hand = sg => ({ mode: 'free', frame: 'world', ...gripPose(sg < 0 ? 'right' : 'left', [sg * BX, BH, 0], [0, 0, 1], [sg, 0, 0]), poleUp: [sg * 0.25, 1.1, -0.5] });
// legs in the hips frame (rest coordinates: hip joints at (+-0.082, 0.852, 0.006)); rot pitches the foot (toes slightly down)
const lowAnk = x => [x, 0.66, 0.42], highAnk = x => [x, 0.69, 0.16];
// straight leg: hip joint (rest) + exact thigh/shin reach for a 178 deg knee, pointing straight forward (hips frame)
const TH = 0.35292, SH = 0.40981, REACH = Math.sqrt(TH * TH + SH * SH + 2 * TH * SH * Math.cos(2 * Math.PI / 180));
const longAnk = x => [Math.sign(x) * 0.081543, 0.85197, 0.00565 + REACH];
// deltas blend additively (base + w*(delta-base)); 'ext' runs while tuck sits at 0.55, so its target cancels that share
const TK = 0.75, extAnk = x => longAnk(x).map((v, i) => v - TK * (highAnk(x)[i] - lowAnk(x)[i]));
const foot = (x, side) => ({ mode: 'free', frame: 'hips', ankle: lowAnk(x), rot: [[[1, 0, 0], 20]], poleLow: [x, 1.4, 1.0] });
export default {
  id: 'abs-B', name: '平行杆团身 L 撑', nameEn: 'Parallette Tuck L-Sit',
  timeline: { duration: 8, tracks: {
    tuck: [[0, 1], [3.2, 1], [3.6, 0.75], [6.0, 0.75], [6.4, 1], [8, 1]],
    ext: [[0, 0], [3.6, 0], [4.4, 1], [5.2, 1], [6.0, 0], [8, 0]],
  } },
  pose: {
    base: {
      pelvis: [0, 0.42, -0.04],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      shoulders: { shift: [0, -0.03, 0] },
      hands: { right: hand(-1), left: hand(1) },
      feet: { right: foot(-0.083, 'right'), left: foot(0.083, 'left') },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 177.5 }, { type: 'reach', limb: 'leftArm', angle: 177.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.05, pz: 0.3 }, iters: 80 },
    },
    deltas: {
      tuck: { hips: { rot: [[[1, 0, 0], -14]] }, chest: { waist: [[[1, 0, 0], 12]] }, feet: { right: { ankle: highAnk(-0.083), rot: [[[1, 0, 0], 35]] }, left: { ankle: highAnk(0.083), rot: [[[1, 0, 0], 35]] } } },
      ext: { feet: { right: { ankle: extAnk(-0.083), rot: [[[1, 0, 0], -8]] } } },
    },
  },
  highlight: { groups: ['abs'], side: 'both', pulseTrack: 'tuck', pulseBase: 0.3 },
  camera: { dir: [0.8, 0.25, 0.75], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.22, k: 1.0, drift: 6, at: 4.5 },
  frame: { mode: 'fit', width: 800, height: 800, cx: 512, cy: 470 },
  stillAt: 4.5,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis'], blobs: [{ j: 'pelvis', rx: 120, ry: 18, a: 0.35 }], bands: [] },
  props: [{ type: 'parallettes', at: [0, 0, 0], length: 0.42, height: BH, gap: 2 * BX }, { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' }],
  qaProps: [-1, 1].map(sg => ({ a: [sg * BX, BH, -0.21], b: [sg * BX, BH, 0.21], r: 0.016 })),
  keyFrames: [0, 3.6, 4.8],
  qa: {
    // hipFlexMax: the cue is 把膝盖抬到胸前 (knees to the chest) in a tuck support - hip flexion reaches ~138.5 deg by design
    hipFlexMax: 140,
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 176, when: 'params.ext>0.999' }],
    allowContact: [],
  },
};
