// New armfix-r2 template revision; preserve historical source and QA.
import priorTemplate from './h-reverse-lunge-r3.js';
// h-reverse-lunge 后撤步弓步蹲 (reverse lunge) · H 居家臀腿系列.
// Standing tall, hands on the hips. One foot steps straight back (~65 cm) and lands on the ball of the foot, then both knees bend
// until the back knee hovers a few cm above the mat and the front shin is about vertical (front knee stays over the ankle, trunk
// tall with a slight forward lean); drive through the front heel to rise and step the back foot forward to standing.
// Rep 1 steps back with the RIGHT foot, rep 2 with the LEFT. Per 4 s rep: 0.9 s step back, 0.9 s lower, 0.4 s hold, 0.9 s rise,
// 0.7 s step in. Head +Y, front faces +Z, body left = +X. No solver: the pelvis and both feet (floor mode, the stepping foot
// with lift/pitch so its toe contact stays put while the heel rises) are functions of time.
import { build, keys, sg, r4 } from './_home-armfix-r1.mjs';
const DUR = 8, FX = 0.10, ZB = 0.66, LIFT = 0.05;
const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
// per-rep phases (t in 0..4): step u, depth d
const U = keys([[0, 0], [0.15, 0], [1.05, 1], [3.0, 1], [3.85, 0], [4.0, 0]], 4);
const Dp = keys([[0, 0], [0.45, 0], [1.9, 1], [2.3, 1], [3.6, 0], [4.0, 0]], 4);   // the knees start bending while the foot reaches back
const local = t => ((t % DUR) + DUR) % DUR;
const repOf = t => (local(t) < 4 ? 'right' : 'left');
const u = s => t => (repOf(t) === s ? U(local(t) % 4) : 0);
const d = t => Dp(local(t) % 4);
const uR = u('right'), uL = u('left');
const pitchOf = (uu, dd) => 46 * sm((uu - 0.55) / 0.45) + 14 * dd;
// toe-tip offset ahead of the ankle for a pitched foot (rest toe 0.16 m ahead, 0.075 m below the ankle)
const toeDz = p => -0.075 * Math.sin(p * Math.PI / 180) + 0.16 * Math.cos(p * Math.PI / 180);
const foot = s => {
  const uu = s === 'right' ? uR : uL;
  const dd = t => (repOf(t) === s ? d(t) : 0);
  const pit = t => pitchOf(uu(t), dd(t));
  // stepping foot: toe lands at z = -ZB + toeDz(46); afterwards the ankle slides so the toe stays put as the heel rises
  const z = t => { const v = uu(t); const zToeBack = -ZB + toeDz(46); const zFlat = 0.0;
    const zBack = zToeBack - toeDz(pit(t)); return zFlat + (zBack - zFlat) * sm(v / 0.92) ; };
  return { mode: 'floor', at: t => r4([sg(s) * FX, z(t)]), heading: sg(s) * 3, pitch: pit, lift: t => +(LIFT * Math.sin(Math.PI * sm(uu(t) / 0.92))).toFixed(4),
    poleLow: [sg(s) * 0.12, 0.5, 1] };
};
const back = t => (repOf(t) === 'right' ? uR(t) : uL(t));
const hipHand = s => ({ mode: 'free', frame: 'hips', palmAt: [sg(s) * 0.152, 1.108970171859, 0.033045798312], finger: [-sg(s) * 0.05, -0.35, 0.94], normal: [-sg(s), 0, 0],
  poleUp: [sg(s) * 0.6, 1.1, -0.35], touch: { clear: 0.0015, from: 0.0, solve: 'bisect', iters: 16 } });
const P = build(DUR, {
  pelvis: t => r4([0, 0.947970171859 - 0.06 * back(t) - 0.363970171859 * d(t), 0.01 - 0.22 * back(t) - 0.03 * d(t)]),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], t => 2 + 7 * back(t) + 2 * d(t)]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hipHand('left'), right: hipHand('right') },
  feet: { left: foot('left'), right: foot('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { down: d, uR, uL });
const spec = {
  id: 'h-reverse-lunge', name: '后撤步弓步蹲', nameEn: 'Reverse Lunge',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['quadriceps', 'glute-max'], side: 'both', pulseTrack: 'down', pulseBase: 0.3 },
  camera: { dir: [1, 0.15, 0.35], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'], pad: 0.14, k: 1.0, drift: 3, at: 2.1 },
  frame: { mode: 'fit', width: 900, height: 800, cx: 540, cy: 500 },
  stillAt: 0.1,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6, fade: [0.09, 0.25] }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6, fade: [0.09, 0.25] }], bands: [] },
  props: [{ type: 'mat', at: [0, 0, -0.25], size: [1.83, 0.61, 0.006], yaw: 90 }],
  keyFrames: [0.2, 1.0, 2.1],
  qa: {
    pins: [{ c: 'footL', when: 'params.uL<0.001' }, { c: 'footR', when: 'params.uR<0.001' }],
    touch: [{ side: 'right', when: 'always' }, { side: 'left', when: 'always' }],
    allowContact: ['handR|torso', 'forearmR|torso', 'handL|torso', 'forearmL|torso', 'thighL|shinL', 'thighR|shinR'],
  },
};

spec.id = "h-reverse-lunge-r4";
spec.modelProfile="training-human-v2plus-hands-native";
spec.runtimeModel={profile:"training-human-v3-armfix",version:"0.1.0-r2"};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:"compression",torso:"base",limbs:"base",hands:"base",skin:"realistic"};
spec.camera=structuredClone(priorTemplate.camera);
spec.reviewed=false;spec.releaseEligible=false;spec.qaStatus="candidate-awaiting-gpu-and-user-review";
export default spec;
