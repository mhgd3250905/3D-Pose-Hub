// t-step-jack-arm-circles 低冲击开合踏步 + 双臂大绕环 (low-impact step jack + big arm circles) · Flare 2.0 warm-up v2, r2 batch 1
// (2026-11-21). Standard: tools/flare2-moves-r2/standards/t-step-jack-arm-circles.md. NEW variant of h-step-jack (that action and its
// specs are untouched; the leg motion here is re-written from h-step-jack.js at the brief's tempo).
// No jump: one foot steps out to the side and back in, alternating, about one step per second (each foot move out or in = 1 s:
// R out, R in, L out, L in). One 16 s loop = the two halves of the 60 s dose:
//   0-8 s   arms: both straight arms sweep out and up overhead as a foot steps out, down as it steps in (the step-jack arm);
//   8-16 s  arms: big backward arm circles (straight arms, both together, one circle per 2 s), palms facing out, legs keep stepping.
// (The 60 s dose = first 30 s overhead arms, last 30 s arm circles; the loop shows both halves once, text/voice give the 30 s switch.)
// Head +Y, front faces +Z, body left = +X. No solver: pelvis, feet and arms are functions of time.
import { build, keys, armWrist, armDir, sg, r4 } from '../lib/home-anim.mjs';
import { V, win } from '../lib/flare2-r2.mjs';
const DUR = 16, STEP = 0.27, FX = 0.085, LIFT = 0.05, HALF = 8;
// one side's out/in over 4 s: out 0-1 s, in 1-2 s, rest 2-4 s (the other foot moves then); right starts
const step4 = keys([[0, 0], [1, 1], [2, 0]], 4);
const pR = t => { t = ((t % 4) + 4) % 4; return t < 2 ? step4(t) : 0; };
const pL = t => pR(t - 2);
const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
// the stepping foot moves only while it is in the air (u: 0 -> 1 over the middle 76 % of each transfer), so it never slides
const uR = t => sm((pR(t) - 0.12) / 0.76), uL = t => sm((pL(t) - 0.12) / 0.76);
const aR = t => Math.sin(Math.PI * uR(t)), aL = t => Math.sin(Math.PI * uL(t));
const PELY = 0.94;   // v3 leg (h-step-jack used 0.884 on the v2 leg; kn1 rescaled it)
const footX = (s, t) => sg(s) * (FX + STEP * (s === 'right' ? uR(t) : uL(t)));
const ankleOf = (s, t) => { const a = s === 'right' ? aR(t) : aL(t); return r4([footX(s, t), 0.0845 + LIFT * a, 0.005 + 0.012 * a]); };   // v3 shoe sole: +2.5 mm vs h-step-jack
// ---- arms
const jack = t => Math.max(pR(t), pL(t));            // 0 = arms down, 1 = overhead
const psi = t => 6 + 158 * jack(t);
const jackHand = (s, t) => { const a = psi(t) * Math.PI / 180;
  return { w: armWrist(s, 2, psi(t), 0.481), f: armDir(s, 2, psi(t)), n: [-sg(s) * Math.cos(a), -Math.sin(a), 0] }; };   // palm toward the midline on the way up
// arm circles: the straight arm sweeps a cone about a horizontal axis pointing out to the side and 20 deg forward, half-angle 76 deg;
// backward circles (up in front, down behind), one per 2 s. Palm = faces out (the cone-axis side), i.e. away from the body.
const CA = 76, CT = 2;
const coneAxis = s => V.norm([sg(s) * Math.cos(20 * Math.PI / 180), 0, Math.sin(20 * Math.PI / 180)]);
const circleDir = (s, th) => { const A = coneAxis(s), down = [0, -1, 0];
  const e1 = V.norm(V.sub(down, V.mul(A, V.dot(down, A))));            // toward down, perpendicular to the axis
  const e2 = V.norm(V.cross(A, e1));                                      // completes the frame
  const sgn = s === 'left' ? -1 : 1;                                      // mirror: both arms leave the lowest point forward (backward circle)
  const r = V.add(V.mul(e1, Math.cos(th)), V.mul(e2, sgn * Math.sin(th)));
  return V.norm(V.add(V.mul(A, Math.cos(CA * Math.PI / 180)), V.mul(r, Math.sin(CA * Math.PI / 180)))); };
const SHO = s => [sg(s) * 0.1879, 1.3702, -0.0042], AR = 0.481;
const circleHand = (s, t) => { const u = t - HALF; const amp = win(u, 0, 0.6) * (1 - win(u, 7.4, 8));   // ease in / out at the lowest point
  // theta: 0 = lowest point; backward circle = the arm goes forward-up first -> sign chosen so the first motion is toward +Z
  const th = 2 * Math.PI * Math.max(0, u - 0.3) / CT * (u > 0.3 && u < 7.7 ? 1 : 0);
  let d = circleDir(s, th); const hang = armDir(s, 2, 6); d = V.norm(V.add(V.mul(hang, 1 - amp), V.mul(d, amp)));
  const L = [sg(s), 0, 0], n = V.norm(V.sub(L, V.mul(d, V.dot(L, d))));
  return { w: V.add(SHO(s), V.mul(d, AR)), f: d, n }; };
const handAt = (s, t) => (((t % DUR) + DUR) % DUR) < HALF ? jackHand(s, t) : circleHand(s, ((t % DUR) + DUR) % DUR);
const H = s => ({ mode: 'free', frame: 'chest', wrist: t => r4(handAt(s, t).w), finger: t => r4(handAt(s, t).f), normal: t => r4(handAt(s, t).n),
  poleUp: [sg(s) * 0.2, 0.3, -1] });
const P = build(DUR, {
  pelvis: t => r4([-STEP / 2 * pR(t) + STEP / 2 * pL(t), PELY - 0.006 * (pR(t) + pL(t)), 0.012]),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 2]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: H('left'), right: H('right') },
  feet: {
    left: { mode: 'free', frame: 'world', ankle: t => ankleOf('left', t), rot: [[[0, 1, 0], 4], [[1, 0, 0], t => 14 * aL(t)]], poleLow: [0.25, 0.6, 1] },
    right: { mode: 'free', frame: 'world', ankle: t => ankleOf('right', t), rot: [[[0, 1, 0], -4], [[1, 0, 0], t => 14 * aR(t)]], poleLow: [-0.25, 0.6, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { out: t => Math.max(pR(t), pL(t)), uR, uL });
export default {
  id: 't-step-jack-arm-circles', name: '低冲击开合踏步+大绕环', nameEn: 'Low-Impact Step Jack + Big Arm Circles',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['deltoids', 'hip-abductors'], side: 'both', pulseTrack: 'out', pulseBase: 0.3 },
  camera: { dir: [0.2, 0.12, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm'], pad: 0.12, k: 1.0, drift: 0, at: 1.0 },
  frame: { mode: 'fit', width: 640, height: 860, cx: 512, cy: 512 },
  stillAt: 1.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [], bands: [] },
  props: [],
  keyFrames: [1.0, 3.0, 9.0],
  qa: {
    pins: [{ c: 'footL', when: 'params.uL<0.001' }, { c: 'footL', when: 'params.uL>0.999' }, { c: 'footR', when: 'params.uR<0.001' }, { c: 'footR', when: 'params.uR>0.999' }],
    straight: [{ j: 'elbow.right', min: 163 }, { j: 'elbow.left', min: 163 }, { j: 'knee.left', min: 158, when: 'params.uL<0.001' }, { j: 'knee.right', min: 158, when: 'params.uR<0.001' }],
    allowContact: ['thighL|thighR', 'upperArmL|torso', 'upperArmR|torso'],
  },
  flare2: { version: 'r2', batch: 1, status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
