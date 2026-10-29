// User correction: overhand grip at the front; 0.3mm reach correction retains original 166-degree elbow QA.
import {alignTowel} from './_fixed-towel-axis-r1.mjs';
// New armfix-r2 template revision; preserve historical source and QA.
import priorTemplate from './h-towel-pass-r3.js';
// h-towel-pass 毛巾过头转肩 (towel shoulder pass-through, partial) · H 居家开肩系列.
// Standing tall, a long bath towel (or a broomstick) held taut in both fists with a wide overhand grip, arms straight in front of
// the thighs. Keeping the elbows straight and the ribs down, raise the towel in a big arc in front of you, overhead and on back
// behind the head as far as the shoulders allow without arching the lower back; pause, then bring it back the same way. Opens
// the front of the shoulders and chest for overhead positions (handstand, flare plant). Widen the grip if the elbows bend.
// 1 rep / 8 s: 0.4 s rest, 3.0 s up and over, 0.8 s hold, 3.0 s back, 0.8 s rest.
// Facing +Z, head up (+Y), body left = +X. Fists on world paths: straight arms at PSI deg abduction swept in shoulder flexion
// 34 -> 212 deg (gripPose keeps the fist round the towel; the palm turns with the arm). No solver.
import { build, keys, r4, armDir, REST, sg } from './_home-armfix-r1.mjs';
import { gripPose, G } from '../lib/grip.mjs';
const DUR = 8, PY = 0.951970171859, DY = PY - REST.pelvis[1], PSI = 44, PH0 = 34, PH1 = 212;
const p = keys([[0, 0], [0.4, 0], [3.4, 1], [4.2, 1], [7.2, 0]], DUR);
const SHW = side => { const S = REST.shoulder(side); return [S[0], S[1] + DY, S[2]]; };
const palmOf = phi => { const a = phi * Math.PI / 180; return [0, Math.sin(a), Math.cos(a)]; };
const fistAt = (side, phi, R = 0.4823) => {
  const s = sg(side), d = armDir(side, phi, PSI), S = SHW(side); let f = 0.55;
  for (let i = 0; i < 6; i++) { const F = S.map((x, k) => x + d[k] * f); const w = gripPose(side, F, [s, 0, 0], palmOf(phi)).wrist;
    f += R - Math.hypot(...w.map((x, k) => x - S[k])); }
  return S.map((x, k) => x + d[k] * f);
};
const phi = t => PH0 + (PH1 - PH0) * p(t);

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
const hand = side => { const s=sg(side);
  const g=t=>{const S=SHW(side);S[2]+=.006-REST.pelvis[2];const pa=palmOf(phi(t)),pole=[S[0]+s*.5,S[1]-.3*pa[1],S[2]-.3*pa[2]];
    return fixedPose(side,S,gripPose(side,fistAt(side,phi(t)),[s,0,0],pa).wrist,pole,mul3(pa,-1));};
  return {mode:'free',frame:'world',wrist:t=>g(t).wrist,finger:t=>g(t).finger,normal:t=>g(t).normal,pole:t=>g(t).pole};
};
const P = build(DUR, {
  pelvis: [0, PY, 0.006],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.14, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.14, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { pass: p });
const spec = {
  id: 'h-towel-pass', name: '毛巾过头转肩', nameEn: 'Towel Shoulder Pass-Through',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['chest', 'deltoids'], side: 'both', pulseTrack: 'pass', pulseBase: 0.3 },
  camera: { dir: [1, 0.3, 0.75], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.85, drift: 3, at: 3.8, fitTimeline: true },
  frame: { mode: 'fit', width: 760, height: 900, cx: 512, cy: 500 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'band', from: { bone: 'leftHand', offset: G.left.c }, to: { bone: 'rightHand', offset: G.right.c }, r: 0.017, sag: 0.0, colour: '#b9b2a4' },
  ],
  keyFrames: [0.2, 2.0, 3.8],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.left', min: 166 }, { j: 'elbow.right', min: 166 }],
    allowContact: [],
  },
};

spec.id = "h-towel-pass-r8";
spec.modelProfile="training-human-v2plus-hands-native";
spec.runtimeModel={profile:"training-human-v3-armfix",version:"0.1.0-r2"};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:"compression",torso:"base",limbs:"base",hands:"base",skin:"realistic"};
spec.camera=structuredClone(priorTemplate.camera);
spec.reviewed=false;spec.releaseEligible=false;spec.qaStatus="candidate-awaiting-gpu-and-user-review";
// Same fixed-hand band anchor as accepted band-curl trial; retain towel geometry.
const fixedCenter=[.07612368052316226,-.042491777623657606,0];
spec.props=spec.props.filter(p=>p.type!=='gripHand').map(p=>p.type==='band'?{...p,...Object.fromEntries(['from','to'].map(key=>[key,{...p[key],offset:fixedCenter.map((x,i)=>i===0&&p[key].bone==='rightHand'?-x:x)}]))}:p);
const aligned=alignTowel(spec,'h-towel-pass-r8');aligned.gripIntent='overhand-at-front';export default aligned;
