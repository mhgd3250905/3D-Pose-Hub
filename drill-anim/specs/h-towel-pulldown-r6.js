// New armfix-r2 template revision; preserve historical source and QA.
import priorTemplate from './h-towel-pulldown-r3.js';
// h-towel-pulldown 站姿毛巾下拉 (standing towel lat pulldown) · H 居家背部系列.
// Standing tall, a bath towel held in both fists about 80 cm apart with an overhand grip, arms reaching up in a wide V. Pull the
// towel hard outward so it stays taut the whole time, then drive the elbows down and back as if pulling a bar to the upper chest,
// squeezing the shoulder blades down and together; press back up overhead without letting the towel go slack. Ribs down, no
// arching. 2 reps / 8 s: 1.4 s pull down, 0.6 s squeeze, 1.6 s return, 0.4 s top.
// Facing +Z, head up (+Y), body left = +X. Hands world-fixed paths (fists keep the towel width), power grip (gripPose + gripHand);
// the towel is a soft band between the two fists. No solver.
import { build, keys, r4 } from './_home-armfix-r1.mjs';
import { gripPose, G } from '../lib/grip.mjs';
const DUR = 8, HX = 0.39;
const p = keys([[0, 0], [0.4, 0], [1.8, 1], [2.4, 1], [4.0, 0], [4.4, 0], [5.8, 1], [6.4, 1], [8.0, 0]], DUR);
const fist = (s, t) => { const q = p(t); return [s * HX, 1.68 - 0.29 * q, 0.07 + 0.11 * q + 0.09 * Math.sin(Math.PI * q)]; };
const palm = t => { const q = p(t); return [0, -0.25 + 0.55 * q, -1]; };     // palms face forward; at the bottom the fists tip back a little

// Current two-bone elbow plus the fixed WebXR hand basis used by band-curl-r5.
// Distal hand axis follows the actual forearm rather than legacy baked-fist axes.
const add3=(a,b)=>a.map((x,i)=>x+b[i]),sub3=(a,b)=>a.map((x,i)=>x-b[i]),mul3=(a,k)=>a.map(x=>x*k);
const dot3=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),unit3=a=>mul3(a,1/Math.hypot(...a));
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function fixedPose(side,S,W,pole,palmSeed){
 const UA=.2567805323279002,FA=.2280465039306538,s=side==='left'?1:-1,u=unit3(sub3(W,S)),D=Math.min(Math.hypot(...sub3(W,S)),UA+FA-1e-6);
 const along=(UA*UA-FA*FA+D*D)/(2*D),height=Math.sqrt(Math.max(0,UA*UA-along*along)),v=sub3(pole,S),bend=unit3(sub3(v,mul3(u,dot3(v,u))));
 const E=add3(add3(S,mul3(u,along)),mul3(bend,height)),f=unit3(sub3(W,E)),palm=unit3(sub3(palmSeed,mul3(f,dot3(palmSeed,f))));
 const cols=[mul3(f,s),mul3(palm,-1),mul3(cross3(f,palm),-s)],apply=v=>[0,1,2].map(i=>cols.reduce((n,c,k)=>n+c[i]*v[k],0));
 return {wrist:W,pole:E,finger:apply([s*.98253144,.05483374,.17783482]),normal:apply([s*.06068526,-.99777448,-.02762938])};
}
const hand = (s, side) => {
  const g=t=>fixedPose(side,[s*.1879072,1.35884686707312,-.0012787351855060788],gripPose(side,fist(s,t),[s,0,0],palm(t)).wrist,[s*.75,1.15,-.25],[0,0,1]);
  return {mode:'free',frame:'world',wrist:t=>g(t).wrist,finger:t=>g(t).finger,normal:t=>g(t).normal,pole:t=>g(t).pole};
};
const P = build(DUR, {
  pelvis: [0, 0.951970171859, 0.004045798312],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 1]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand(1, 'left'), right: hand(-1, 'right') },
  feet: {
    left: { mode: 'floor', at: [0.13, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.13, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { pull: p });
const spec = {
  id: 'h-towel-pulldown', name: '站姿毛巾下拉', nameEn: 'Standing Towel Lat Pulldown',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['lats', 'scapular'], side: 'both', pulseTrack: 'pull', pulseBase: 0.3 },
  camera: { dir: [0.75, 0.2, -0.85], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.14, k: 0.85, drift: 3, at: 2.1 },
  frame: { mode: 'fit', width: 700, height: 880, cx: 512, cy: 505 },
  stillAt: 2.1,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'band', from: { bone: 'leftHand', offset: G.left.c }, to: { bone: 'rightHand', offset: G.right.c }, r: 0.016, sag: 0.0, colour: '#b9b2a4' },
  ],
  keyFrames: [0.2, 1.1, 2.1],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [],
    allowContact: [],
  },
};

spec.id = "h-towel-pulldown-r6";
spec.modelProfile="training-human-v2plus-hands-native";
spec.runtimeModel={profile:"training-human-v3-armfix",version:"0.1.0-r2"};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:"compression",torso:"base",limbs:"base",hands:"base",skin:"realistic"};
spec.camera=structuredClone(priorTemplate.camera);
spec.reviewed=false;spec.releaseEligible=false;spec.qaStatus="candidate-awaiting-gpu-and-user-review";
// Same fixed-hand band anchor as accepted band-curl trial; retain towel geometry.
const fixedCenter=[.07612368052316226,-.042491777623657606,0];
spec.props=spec.props.filter(p=>p.type!=='gripHand').map(p=>p.type==='band'?{...p,...Object.fromEntries(['from','to'].map(key=>[key,{...p[key],offset:fixedCenter.map((x,i)=>i===0&&p[key].bone==='rightHand'?-x:x)}]))}:p);
export default spec;
