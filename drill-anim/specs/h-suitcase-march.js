// Right-hand light dumbbell marching: maintain level pelvis and upright trunk during alternating single support.
// Stand tall, breathe normally, choose a manageable load; no fixed weight or treatment promise.
// +Z front, +X left. Shift during double support, then low knee lift; mirror load side in practice.
// Distinct from static suitcase hold and chair-supported unloaded march. Use a light manageable load.
import { build, keys, sg, r4, REST } from '../lib/home-anim.mjs';
import { UA, FA, DEG, leg, restPtW } from '../lib/ss-geo.mjs';
import { gripPose, gripAttach, G as GRIP } from '../lib/grip.mjs';
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const FIST = 0.099;   // wrist -> fist centre along the forearm (gripPose geometry)
// fist round a handle at the end of forearm direction f from elbow E, thumb toward a (made perpendicular to f)
const dbGrip = (side, E, f, a) => { f = nrm(f); a = nrm(sub(a, mul(f, dot(a, f)))); return gripPose(side, add(E, mul(f, FA + FIST)), a, mul(cross(f, a), -sg(side))); };
// dumbbell through the baked fist (+22 mm along the grip axis centres it, as in forearms-B / deltoids-B)
const DB = side => { const A = gripAttach(side); return { offset: r4(A.offset.map((x, i) => x + 0.022 * GRIP[side].a[i])), rot: A.rot }; };
const DUR = 8, PLANE = 20, ELB = 15;
const th = t => 16;
const arm = (side, t) => { const S = REST.shoulder(side), down = [0, -1, 0], out = [sg(side) * Math.cos(PLANE * DEG), 0, Math.sin(PLANE * DEG)];
  const dirAt = a => add(mul(down, Math.cos(a * DEG)), mul(out, Math.sin(a * DEG)));
  const E = add(S, mul(dirAt(th(t)), UA)), f = dirAt(th(t) - ELB);   // elbow bend keeps a soft, stationary elbow without locking out
  const n = nrm(cross(down, out)).map(x => x * sg(side));            // plane normal, pointing forward for both sides
  return { S, E, f, n }; };
const hand = side => {
  const g = t => { const A = arm(side, t); return dbGrip(side, A.E, A.f, [0, 0, 1]); };
  const pole = t => { const A = arm(side, t), W = add(A.E, mul(A.f, FA)); return r4(add(A.E, mul(nrm(sub(A.E, mul(add(A.S, W), 0.5))), 0.3))); };
  return { mode: 'free', frame: 'chest', relax: 0, wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal, poleUp: pole };
};
// Shift fully onto the next support before lifting; return foot before changing support.
const R=keys([[0,0],[.8,0],[1.5,1],[2.2,1],[3,0],[8,0]],DUR);
const L=keys([[0,0],[4.8,0],[5.5,1],[6.2,1],[7,0]],DUR);
const X=keys([[0,0],[.7,.10],[3.1,.10],[3.7,0],[4,0],[4.7,-.075],[7.1,-.075],[7.7,0]],DUR);
const hips={up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]};
const foot=side=>{const lift=side==='right'?R:L, base=restPtW(hips,[0,.8936,0],leg(side,3,6).ankle);
 return {mode:'free',frame:'world',ankle:t=>{const a=restPtW(hips,[0,.8936,0],leg(side,3+37*lift(t),6+69*lift(t)).ankle);return [a[0],a[1],a[2]];},rot:[[[1,0,0],t=>17*lift(t)]],pole:t=>[sg(side)*.15+X(t),.5,.5]};};
const P=build(DUR,{
 pelvis:t=>[X(t),.884,0],hips,chest:{waist:[[[1,0,0],0]]},
 hands:{left:{...hand('left'),relax:.65},right:hand('right')},
 feet:{left:foot('left'),right:foot('right')},constraints:[],solve:{vars:[],reg:{}}
},{rightLift:R,leftLift:L,shift:X,raise:t=>Math.max(R(t),L(t))});
export default {
  id: 'h-suitcase-march', name: '单手哑铃交替踏步抗侧屈', nameEn: 'Single-Arm Suitcase March',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['obliques', 'hip-abductors'], side: 'both', pulseTrack: 'raise', pulseBase: 0.85 },
  camera: { dir: [-0.25, 0.15, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.14, k: 0.85, drift: 0, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 860, height: 880, cx: 512, cy: 505 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' },
    { type: 'dumbbell', length: 0.30, plate: 0.042, attach: 'rightHand', ...DB('right') },
  ],
  keyFrames: [0, 1.6, 2, 2.2, 3, 4, 5.6, 6, 6.2, 7, 7.9333333333],
  qa: {
    pins: [{ c: 'footL', when: 'params.leftLift<0.001' }, { c: 'footR', when: 'params.rightLift<0.001' }],
    straight: [],
    allowContact: [],
  },
};
