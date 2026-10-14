// h-step-jack 低冲击开合跳 (low-impact step jack) · H 居家徒手全身系列.
// The no-jump jumping jack: standing tall, feet together, arms by the sides. The RIGHT foot steps out to the side (lifting just
// a few cm, landing toes-first then flat) while both straight arms sweep out and up overhead; then the foot steps back in as the
// arms come down. Second rep with the LEFT foot. The pelvis shifts half a step toward the stepping foot so both legs share the
// weight in the wide stance. 2 reps / 8 s: 1.4 s out, 0.5 s hold, 1.4 s in, 0.7 s rest per side.
// Head +Y, front faces +Z, body left = +X. No solver: pelvis, feet and arms are functions of time.
import { build, keys, armWrist, armDir, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8, STEP = 0.27, FX = 0.085, LIFT = 0.055;
const pR = keys([[0, 0], [0.3, 0], [1.7, 1], [2.2, 1], [3.6, 0], [4.0, 0]], DUR);
const pL = t => pR(((t - 4) % DUR + DUR) % DUR);
const arms = t => Math.max(pR(t), pL(t));
// the stepping foot moves only while it is in the air (u: 0 -> 1 over the middle 76% of each transfer), so it never slides
const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const uR = t => sm((pR(t) - 0.12) / 0.76), uL = t => sm((pL(t) - 0.12) / 0.76);
const aR = t => Math.sin(Math.PI * uR(t)), aL = t => Math.sin(Math.PI * uL(t));
const PELY = 0.884;
const footX = (s, t) => sg(s) * (FX + STEP * (s === 'right' ? uR(t) : uL(t)));
const ankleOf = (s, t) => { const a = s === 'right' ? aR(t) : aL(t); return r4([footX(s, t), 0.082 + LIFT * a, 0.005 + 0.012 * a]); };
const psi = t => 6 + 152 * arms(t);
const hand = s => ({ mode: 'free', frame: 'chest', wrist: t => r4(armWrist(s, 2, psi(t), 0.481)), finger: t => r4(armDir(s, 2, psi(t))),
  poleUp: [sg(s) * 0.2, 0.3, -1] });
// palm faces the body on the way up (thumb leads): normal = toward the midline rotated with the arm
const handN = s => t => { const a = psi(t) * Math.PI / 180; return r4([-sg(s) * Math.cos(a), -Math.sin(a), 0.0]); };
const H = s => ({ ...hand(s), normal: handN(s) });
const P = build(DUR, {
  pelvis: t => r4([-STEP / 2 * pR(t) + STEP / 2 * pL(t), PELY - 0.012 * (pR(t) + pL(t)), 0.012]),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 2]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: H('left'), right: H('right') },
  feet: {
    left: { mode: 'free', frame: 'world', ankle: t => ankleOf('left', t), rot: [[[0, 1, 0], 4], [[1, 0, 0], t => 14 * aL(t)]], poleLow: [0.25, 0.6, 1] },
    right: { mode: 'free', frame: 'world', ankle: t => ankleOf('right', t), rot: [[[0, 1, 0], -4], [[1, 0, 0], t => 14 * aR(t)]], poleLow: [-0.25, 0.6, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { out: arms, uR, uL });
export default {
  id: 'h-step-jack', name: '低冲击开合跳', nameEn: 'Low-Impact Step Jack',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['deltoids', 'hip-abductors'], side: 'both', pulseTrack: 'out', pulseBase: 0.3 },
  camera: { dir: [0.2, 0.12, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm'], pad: 0.12, k: 1.0, drift: 3, at: 2.0 },
  frame: { mode: 'fit', width: 640, height: 860, cx: 512, cy: 512 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6, fade: [0.085, 0.2] }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6, fade: [0.085, 0.2] }], bands: [] },
  props: [],
  keyFrames: [0.2, 1.0, 2.0],
  qa: {
    pins: [{ c: 'footL', when: 'params.uL<0.001' }, { c: 'footL', when: 'params.uL>0.999' }, { c: 'footR', when: 'params.uR<0.001' }, { c: 'footR', when: 'params.uR>0.999' }],
    straight: [{ j: 'elbow.right', min: 163 }, { j: 'elbow.left', min: 163 }, { j: 'knee.left', min: 158, when: 'params.uL<0.001' }, { j: 'knee.right', min: 158, when: 'params.uR<0.001' }],   // the stepping knee bends in the air
    allowContact: ['thighL|thighR', 'upperArmL|torso', 'upperArmR|torso'],
  },
};
