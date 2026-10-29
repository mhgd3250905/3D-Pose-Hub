// Fixed grip without dumbbells. Band anchors are the pinned template shaft center transformed by webCanonicalToHandLocalRowMajor.
// Armfix-r2 template candidate, 2026-10-29. Original source retained. Low-resolution review required.
// h-band-biceps-curl 站姿踩带弹力带弯举 (standing band biceps curl) · 缺口批次 1（gap-batch1-20261026，二头肌）.
// Standing tall, feet hip-width, a light resistance band stepped on under the middle of each foot, one end in each hand,
// palms facing forward (supinated) from the start. Elbows stay pinned by the ribs; both forearms curl up toward the shoulders
// together, squeeze, then lower slowly back to long arms. Shoulders and trunk still, no swinging or leaning back.
// Distinct from h-db-curl (alternating dumbbells, active supination), h-db-hammer-curl (neutral grip) and
// h-towel-isometric-curl (isometric): band resistance, bilateral, palms up the whole range.
// Design prescription (author, this file): 2 reps / 8 s, each rep 0.3 s start, 1.3 s up, 0.4 s squeeze, 1.6 s down, 0.4 s rest
// (rep 1 at 0 s, rep 2 at 4 s). Facing +Z, head +Y, body left = +X. Upper arm / forearm directions set in the chest frame (armDir),
// copied from h-db-curl; bands run from each fist (grip centre) to that foot's sole.
import { build, keys, sg, r4, REST, armDir } from '../lib/home-anim.mjs';
const UA=.2567805323279002,FA=.2280465039306538;
import { gripPose, G as GRIP } from '../lib/grip.mjs';
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const FIST = 0.099;
// Approved fixed WebXR hand canonical +Y=distal, +Z=palmar, mapped to hand bone.
const dbGrip=(side,E,f,a)=>{
 f=nrm(f);const seed=[0,Math.abs(f[2]),-f[1]],palm=nrm(sub(seed,mul(f,dot(seed,f))));
 const cols=[mul(f,sg(side)),mul(palm,-1),mul(cross(f,palm),-sg(side))];
 const apply=v=>[0,1,2].map(i=>cols.reduce((n,c,k)=>n+c[i]*v[k],0));
 return {wrist:add(E,mul(f,FA)),finger:apply([sg(side)*.98253144,.05483374,.17783482]),normal:apply([sg(side)*.06068526,-.99777448,-.02762938])};
};
const DUR = 8;
const p = keys([[0, 0], [0.3, 0], [1.6, 1], [2.0, 1], [3.6, 0], [4.3, 0], [5.6, 1], [6.0, 1], [7.6, 0]], DUR);
const arm = (side, t) => { const q = p(t), S = REST.shoulder(side);
  const E = add(S, mul(armDir(side, 4 + 8 * q, 7), UA)), f = armDir(side, 16 + 118 * q, 3);
  const a = [sg(side), 0, 0];   // thumb lateral throughout = palm forward / up (supinated)
  return { S, E, f, a }; };
const hand = side => {
  const g = t => { const A = arm(side, t); return dbGrip(side, A.E, A.f, A.a); };
  const pole = t => r4(arm(side,t).E);
  return { mode: 'free', frame: 'chest', relax: 0, wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal, poleUp: pole };
};
const P = build(DUR, {
  pelvis: [0, 0.9519701718590191, 0.00404579831150554],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.12, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { curl: p });
const SOLE = side => ({ bone: side + 'Foot', offset: [0, -0.02, 0.06] });
export default {
  id: 'h-band-biceps-curl-r5', revisionOf: 'h-band-biceps-curl-r4', sourceBatch: 'remaining32-template-r2-20261029', name: '站姿踩带弹力带弯举', nameEn: 'Standing Band Biceps Curl',
  modelProfile: 'training-human-v2plus-hands-native', alignClavicles: false,
  runtimeModel: {profile:'training-human-v3-armfix',version:'0.1.0-r2'}, nativeHands:{twistShare:1}, reviewed:false,releaseEligible:false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic', handPose:{left:'open',right:'open'} },
  fps: 30, size: 1080,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['biceps'], side: 'both', pulseTrack: 'curl', pulseBase: 0.3 },
  camera: { dir: [0.75, 0.15, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.14, k: 0.85, drift: 0, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 700, height: 880, cx: 512, cy: 505 },
  stillAt: 1.8,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'band', from: { bone: 'leftHand', offset: [.07612368052316226,-.042491777623657606,0] }, to: SOLE('left'), r: 0.008, sag: 0.0, colour: '#b5523f' },
    { type: 'band', from: { bone: 'rightHand', offset: [-.07612368052316226,-.042491777623657606,0] }, to: SOLE('right'), r: 0.008, sag: 0.0, colour: '#b5523f' },
  ],
  keyFrames: [0.2, 1.8, 3.0, 4.2],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [],
    allowContact: [],
  },
};
