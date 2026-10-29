// New armfix-r2 template revision; preserve historical source and QA.
import priorTemplate from './h-biceps-self-r3.js';
// h-biceps-self 双手对抗弯举 (self-resisted biceps curl, no equipment) · H 居家手臂系列.
// Standing tall. The right elbow is tucked at the side, palm up. The left palm presses down on the right forearm just behind the
// wrist and resists while the right arm curls up slowly against it (about 5 s up), then the left hand pushes the forearm back down
// while the right biceps keeps resisting (slow lowering). Elbow stays pinned, shoulders down, no leaning back.
// 8 s loop: 3.8 s curl against resistance, 0.4 s top, 3.2 s resisted lowering, 0.6 s bottom.
// Facing +Z, head up (+Y), body left = +X. Hands in the chest frame (rest coordinates). The right forearm swings in the sagittal
// plane about the elbow (BETA from hanging); the left palm sits on top of it (palmAt, offset along the forearm's upper normal).
import { REST, r4 } from './_home-armfix-r1.mjs';
import { build, keys } from './_home-armfix-r1.mjs';
const DUR = 8, B0 = 70, B1 = 122, FA = 0.2281, QD = 0.13, OFF_BASE = 0.045, DEG = Math.PI / 180;
const p = keys([[0, 0], [0.3, 0], [4.1, 1], [4.5, 1], [7.7, 0]], DUR);
// Candidate calibrated against baseline's 241 actual palm/forearm surface samples.
// Smooth offset in the authored forearm-normal frame, tied to the current model recipe.
export const contactOffset = t => {const u=p(t);return OFF_BASE-(12.40491881+u*(8.85789825+u*(7.27233470-6.25826641*u)))/1000-(1.0551065279248977*(1-u)+(-0.2944252416840509)*u)/1000;};
const SR = REST.shoulder('right');
const UD = [0.06, -0.94, 0.33].map((x, i, a) => x / Math.hypot(...a));
const ER = SR.map((x, i) => x + UD[i] * 0.2567);                          // elbow by the ribs, upper arm ~20 deg forward
const beta = t => (B0 + (B1 - B0) * p(t)) * DEG;
const d = t => [0, -Math.cos(beta(t)), Math.sin(beta(t))];
const up = t => { const b = beta(t); return [0, Math.sin(b), Math.cos(b)]; };
const P = build(DUR, {
  pelvis: [0, 0.951970171859, 0.004045798312],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 1]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: {
    right: { mode: 'free', frame: 'chest', wrist: t => r4(ER.map((x, i) => x + d(t)[i] * FA)), finger: t => r4(d(t)), normal: t => r4(up(t)), poleUp: [-0.35, 0.95, -0.4] },
    left: { mode: 'free', frame: 'chest', palmAt: t => r4(ER.map((x, i) => x + d(t)[i] * QD + up(t)[i] * contactOffset(t))), finger: [-0.75, 0, -0.45], normal: t => r4(up(t).map(x => -x)), poleUp: [0.45, 0.8, 0.2] },
  },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.12, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { curl: p });
const spec = {
  id: 'h-biceps-self', name: '双手对抗弯举', nameEn: 'Self-Resisted Biceps Curl',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['biceps'], side: 'right', pulseTrack: 'curl', pulseBase: 0.55 },
  camera: { dir: [-0.45, 0.12, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'rightElbow', 'leftElbow'], pad: 0.14, k: 0.9, drift: 3, at: 2.5 },
  frame: { mode: 'fit', width: 700, height: 860, cx: 512, cy: 515 },
  stillAt: 2.5,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [],
  keyFrames: [0.2, 2.0, 4.3],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [],
    allowContact: ['handL|forearmR', 'handL|handR', 'forearmL|torso', 'upperArmR|torso', 'forearmL|forearmR', 'upperArmL|torso', 'handL|torso', 'forearmR|torso'],
  },
};

spec.id = "h-biceps-self-r8";
spec.revisionOf="h-biceps-self-r7";
spec.modelProfile="training-human-v2plus-hands-native";
spec.runtimeModel={profile:"training-human-v3-armfix",version:"0.1.0-r2"};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:"compression",torso:"base",limbs:"base",hands:"base",skin:"realistic"};
spec.camera=structuredClone(priorTemplate.camera);
spec.reviewed=false;spec.releaseEligible=false;spec.qaStatus="candidate-awaiting-gpu-and-user-review";
// Fitted against actual skin/forearm geometry; three-phase fit plus fourteen-phase CPU audit.
spec.actionCorrective={
  "id": "native-action-hand-pose-r2",
  "version": "0.1.0-r2",
  "required": true,
  "specId": "h-biceps-self-r8",
  "basePoses": {
    "left": "open"
  },
  "poses": {
    "left": {
      "thumb1": [
        -0.16210688875301274,
        -0.09473191363926697,
        0.21714539960296542,
        0.9579118417622414
      ],
      "thumb2": [
        0,
        0,
        0,
        1
      ],
      "thumb3": [
        0,
        0,
        0,
        1
      ],
      "index1": [
        0.07442889207980684,
        0.10347829248105425,
        0.12172354872022746,
        0.9843454478464013
      ],
      "index2": [
        -0.018997763961218578,
        0.0,
        -0.146124143847811,
        0.9890838283731153
      ],
      "index3": [
        -0.018619882031011534,
        0.0,
        -0.14321760844502454,
        0.9895160517265189
      ]
    }
  }
};
export default spec;
