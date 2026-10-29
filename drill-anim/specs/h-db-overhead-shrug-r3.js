// Armfix-r2 template candidate, 2026-10-29. Original source retained. Low-resolution review required.
// h-db-overhead-shrug 双哑铃过头耸肩 (standing dumbbell overhead shrug) · 缺口批次 1（gap-batch1-20261026，上斜方）.
// Standing tall, feet hip-width, ribs down. Both arms are held almost straight overhead with light dumbbells (the top position of
// h-db-press: scapular plane ~25 deg forward, palms forward). Without bending the elbows, lift the shoulders straight up toward
// the ears (shoulder-girdle elevation with the shoulder blades upwardly rotated), pause, then lower slowly back to the start.
// The head and neck do not move (no chin poke, no tilt). Single objective: loaded scapular elevation in the overhead position.
// Distinct from h-db-shrug (arms hanging by the sides) and h-pike-scapular-elevation (inverted bodyweight pike): here the
// arms stay overhead the whole time, so the upper trapezius works together with upward rotation; no elbow press is performed.
// Design prescription (author, this file): 2 reps / 8 s, same tempo as h-db-shrug: 0.4 s still, 1.6 s up, 0.3 s top pause,
// 1.4 s down, 0.3 s rest (rep 2 starts at 4.4 s). Elevation 4 cm. Highlight: group 'traps' (v2plus regions traps-upper + scapular; v2plus has no upper-only group id, and the raw panel trapUpper used by h-db-shrug is not mapped by page/human-v2plus.js V2P.GROUPS).
// Facing +Z, head +Y, body left = +X. Arms are the planar two-bone chain of h-db-press frozen near the top (shoulder angle
// 164 deg, elbow 8 deg), carried up with the shoulder shift.
import { build, keys, sg, r4, REST } from '../lib/home-anim.mjs';
import { DEG } from '../lib/ss-geo.mjs';
const UA=.2567805323279002,FA=.2280465039306538;
import { gripPose, gripAttach, G as GRIP } from '../lib/grip.mjs';
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const FIST = 0.099;
function dbGrip(side,E,f,a){
  f=nrm(f);const seed=[0,0,1],palm=nrm(sub(seed,mul(f,dot(seed,f))));
  const cols=[mul(f,sg(side)),mul(palm,-1),mul(cross(f,palm),-sg(side))];
  const apply=v=>[0,1,2].map(i=>cols.reduce((n,c,k)=>n+c[i]*v[k],0));
  return {wrist:add(E,mul(f,FA)),finger:apply([sg(side)*.98253144,.05483374,.17783482]),normal:apply([sg(side)*.06068526,-.99777448,-.02762938])};
}
const DB = side => { const A = gripAttach(side); return { offset: r4(A.offset.map((x, i) => x + 0.022 * GRIP[side].a[i])), rot: A.rot }; };
const DUR = 8, PLANE = 25, TH = 164, EL = 8, LIFT = 0.04;
const p = keys([[0, 0], [0.4, 0], [2, 1], [2.3, 1], [3.7, 0], [4.4, 0], [6, 1], [6.3, 1], [7.7, 0]], DUR);
const SHIFT = t => [0, LIFT * p(t), 0];
const arm = (side, t) => { const S = add(REST.shoulder(side), SHIFT(t)), down = [0, -1, 0], out = [sg(side) * Math.cos(PLANE * DEG), 0, Math.sin(PLANE * DEG)];
  const dirAt = a => add(mul(down, Math.cos(a * DEG)), mul(out, Math.sin(a * DEG)));
  return { S, E: add(S, mul(dirAt(TH), UA)), f: dirAt(TH + EL), med: [-sg(side), 0, 0] }; };
const hand = side => {
  const g = t => { const A = arm(side, t); return dbGrip(side, A.E, A.f, A.med); };
  const pole = t => r4(arm(side,t).E);
  return { mode: 'free', frame: 'chest', relax: 0, wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal, poleUp: pole };
};
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
}, { work: p });
export default {
  id: 'h-db-overhead-shrug-r3', revisionOf: 'h-db-overhead-shrug-r2', sourceBatch: 'remaining32-template-r2-20261029', name: '双哑铃过头耸肩', nameEn: 'Standing Dumbbell Overhead Shrug',
  modelProfile: 'training-human-v2plus-hands-native', alignClavicles: false,
  runtimeModel: {profile:'training-human-v3-armfix',version:'0.1.0-r2'}, nativeHands:{twistShare:1}, reviewed:false,releaseEligible:false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  fps: 30, size: 1080,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['traps'], side: 'both', pulseTrack: 'work', pulseBase: 0.3 },
  camera: { dir: [0.55, 0.12, -1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.14, k: 0.85, drift: 0, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 760, height: 900, cx: 512, cy: 505 },
  stillAt: 2.1,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'rightHand', ...DB('right') },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'leftHand', ...DB('left') },
  ],
  keyFrames: [0.2, 2.1, 3.0, 6.1],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.left', min: 168 }, { j: 'elbow.right', min: 168 }, { j: 'knee.left', min: 166 }, { j: 'knee.right', min: 166 }],
    allowContact: [],
  },
};
