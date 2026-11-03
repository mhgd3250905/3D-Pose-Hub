// h-band-stepout r2 (2026-10-31): same two-hand stacked D-handle grip as the user-approved h-band-pallof r2 (ea53a89): both hands
// are frozen fists (recipe fixedDHandle), GR/GL are the frozen shaft constants, the left fist is overhand (+A) and rolled ROLL_L
// round the shared shaft to keep the left wrist straight, the dHandle carries stackSep, and W1 is the Pallof r2 lock-out point.
// Pelvis height .844 -> .92: on the v3 body .844 bent the knees to ~119 deg; the cue asks for shallow knees (~145 deg now; .92 keeps the far leg inside its reach during the weight shift).
// Banded lateral step-out: keep extended arms and trunk facing forward while feet step away and return.
// One light band, secured chest-height anchor; choose light resistance, breathe, no forced trunk rotation.
// Use a secure home anchor, light resistance and a non-slip clear floor. Stop if posture changes or pain occurs.
// Fixed soft elbows (~165–167 deg), shallow knees; single-support force estimates are proxies, not dynamics.
// Practice both anchor sides; this clip shows one side and is not a full Flare skill progression.
// Distinct from Pallof press (fixed feet/arm extension): arms fixed, four sequential foot transfers change band length.
import {build,keys,sg} from '../lib/home-anim.mjs';
import {leg,restPtW} from '../lib/ss-geo.mjs';
const GR = { c: [-0.01174, 0.07242, 0.04765], a: [0.86945, 0.49335, -0.02561], pal: [0.39109, -0.71907, -0.57445] }, GL = { c: [0.01174, 0.07242, 0.04765], a: [-0.86945, 0.49335, -0.02561], pal: [-0.39109, -0.71907, -0.57445] };
const v3 = { add: (a, b, k = 1) => a.map((x, i) => x + k * b[i]), dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], nrm: a => { const n = Math.hypot(...a); return a.map(x => x / n); } };
const basis = (f, n) => { f = v3.nrm(f); const z = v3.nrm(v3.add(n, f, -v3.dot(n, f))); return [v3.cross(f, z), f, z]; };
const mul = (B, x) => [0, 1, 2].map(i => B[0][i] * x[0] + B[1][i] * x[1] + B[2][i] * x[2]);
const r4 = a => a.map(x => +x.toFixed(4));
const solveL = (A, C, PAL) => { const a = v3.nrm(GL.a), pa = v3.nrm(v3.add(GL.pal, a, -v3.dot(GL.pal, a))), Ml = [a, pa, v3.cross(a, pa)];
  const Aw = v3.nrm(A), Pw = v3.nrm(v3.add(PAL, Aw, -v3.dot(PAL, Aw))), Mw = [Aw, Pw, v3.cross(Aw, Pw)];
  const R = x => { const l = [v3.dot(Ml[0], x), v3.dot(Ml[1], x), v3.dot(Ml[2], x)]; return mul(Mw, l); };
  return { wrist: v3.add(C, R(GL.c), -1), finger: R([0, 1, 0]), normal: R([0, 0, 1]) }; };
const SEP = 0.115, FR = [-0.08, 0, 1], NR = [1, 0, 0];
// Left fist roll about the shared shaft (ROLL_L deg, Rodrigues about A): the shaft fixes only the thumb line, so the left fist is turned
// round the handle until its hand lines up with the left forearm (wrist flex ~110/88 deg -> ~20 deg; user review 2026-10-31: no wrist kink).
const ROLL_L = -85, rotA = (v, k, t) => { k = v3.nrm(k); const c = Math.cos(t), s = Math.sin(t), kv = v3.cross(k, v), kd = v3.dot(k, v); return v.map((x, i) => x * c + kv[i] * s + k[i] * kd * (1 - c)); };
const leftFor = w => { const B = basis(FR, NR), C = v3.add(w, mul(B, GR.c)), A = mul(B, GR.a), P = rotA(mul(B, GR.pal), A, ROLL_L * Math.PI / 180); return solveL(A, v3.add(C, A, -SEP), P); };
const W1 = [-0.062, 1.29, 0.457], W0 = [0, 1.26, 0.21];             // right wrist: locked out / at the sternum (straight-line press)
const L0 = leftFor(W0), L1 = leftFor(W1);
const right = w => ({ mode: 'free', frame: 'chest', relax: 0, wrist: w, finger: FR, normal: NR, poleUp: [-0.9, 0.9, -0.3] });
const left = L => ({ mode: 'free', frame: 'chest', relax: 0, wrist: r4(L.wrist), finger: r4(L.finger), normal: r4(L.normal), poleUp: [0.9, 0.9, -0.3] });

const D=8, hips={up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]};
const xl=keys([[0,0],[.8,0],[1.6,.16],[6.4,.16],[7.2,0]],D);
const xr=keys([[0,0],[2.2,0],[3,.16],[4.6,.16],[5.4,0]],D);
const lift=(a,b,t)=>t>a&&t<b?.045*Math.sin(Math.PI*(t-a)/(b-a))**2:0;
const yl=t=>lift(.8,1.6,t)+lift(6.4,7.2,t),yr=t=>lift(2.2,3,t)+lift(4.6,5.4,t);
const shift=keys([[0,0],[.7,-.065],[1.65,-.065],[2.1,.245],[3.1,.245],[3.6,.16],[4.5,.245],[5.45,.245],[6.3,-.065],[7.3,-.065],[7.8,0]],D);
const foot=s=>{const b=restPtW(hips,[0,.8936,0],leg(s,3,6).ankle),x=s==='left'?xl:xr,y=s==='left'?yl:yr;return {mode:'free',frame:'world',ankle:t=>[b[0]+x(t),b[1]+y(t),b[2]],rot:[[[1,0,0],0]],pole:t=>[sg(s)*.15+shift(t),.5,.5]};};
const P=build(D,{pelvis:t=>[shift(t),.92,0],hips,chest:{waist:[[[1,0,0],0]]},hands:{right:right(W1),left:left(L1)},feet:{left:foot('left'),right:foot('right')},constraints:[],solve:{vars:[],reg:{}}},{leftLift:yl,rightLift:yr,step:xl});
export default {id:'h-band-stepout-r2',revisionOf:'h-band-stepout',name:'弹力带侧向步出抗旋转',nameEn:'Banded Anti-Rotation Step-Out',modelProfile:'training-human-v2',alignClavicles:false,fps:15,
timeline:{duration:D,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},highlight:{groups:['obliques'],side:'both',pulseBase:.8,pulseTrack:'step'},
camera:{dir:[.3,.15,1],fit:['head','leftToe','rightToe','pelvis','leftPalm','rightPalm','leftElbow','rightElbow'],pad:.18,k:1.1,drift:0,at:3.6,fitTimeline:false},frame:{mode:'fit',width:850,height:780,cx:650,cy:510},stillAt:3.6,
props:[{type:'bandPost',at:[-.95,0,.33],height:1.5,tieY:1.22},{type:'anchor',name:'post',at:[-.91,1.22,.33]},
{type:'dHandle',side:'right',name:'handle',toward:'post',shift:-SEP/2,len:.32,lean:.7,stackSep:SEP},{type:'gripHand',side:'left'},
{type:'band',from:[-.91,1.22,.33],to:'handle',r:.007,sag:0,colour:'#7a4a32'}],
keyFrames:[0,1.2,1.6,2,2.6,3,3.6,4,5,5.4,6,6.8,7.2,7.933333333],qa:{pins:[],straight:[{j:"elbow.left",min:165,when:"always"},{j:"elbow.right",min:165,when:"always"}],allowContact:['handL|handR','forearmL|forearmR','handL|forearmR','handR|forearmL']}};
