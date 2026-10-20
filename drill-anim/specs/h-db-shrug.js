// Single objective: loaded scapular elevation, no elbow curl, neck motion, rolling or leg drive.
// Home small equipment; light dumbbells, 1 easy set of 6-8 slow reps; stop for discomfort.
// Upper trapezius highlighted via the raw muscle-map panel trapUpper (not the scapular mid/lower panel). Elevation 5 cm (was 3.5 cm, read as static in review).
import { build, keys, sg, r4, REST, armDir } from '../lib/home-anim.mjs';
import { UA, FA } from '../lib/ss-geo.mjs';
import { gripPose, gripAttach, G as GRIP } from '../lib/grip.mjs';
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const FIST = 0.097;   // target reach allowance for soft elbows; gripPose still determines the actual fist centre
// fist round a handle at the end of forearm direction f from elbow E, thumb toward a (made perpendicular to f)
const dbGrip = (side, E, f, a) => { f = nrm(f); a = nrm(sub(a, mul(f, dot(a, f)))); return gripPose(side, add(E, mul(f, FA + FIST)), a, mul(cross(f, a), -sg(side))); };
// dumbbell through the baked fist (+22 mm along the grip axis centres it, as in forearms-B / deltoids-B)
const DB = side => { const A = gripAttach(side); return { offset: r4(A.offset.map((x, i) => x + 0.022 * GRIP[side].a[i])), rot: A.rot }; };
const hand = side => {
 const E = add(REST.shoulder(side), mul(armDir(side, 2, 12), UA));
 const g = dbGrip(side, E, armDir(side, 10, 8), [0,0,1]);
 return {mode:'free', frame:'chest', relax:0, ...g, wrist:t=>g.wrist.map((v,i)=>v+(i===1?.05*p(t):0)), poleUp:t=>r4(add(E,[sg(side)*0.06,.05*p(t),-0.3]))};
};
const DUR=8;
const p=keys([[0,0],[0.4,0],[2,1],[2.3,1],[3.7,0],[4.4,0],[6,1],[6.3,1],[7.7,0]],DUR);
const P=build(DUR,{
pelvis:[0,0.889,0.006], shoulders:{shift:t=>[0,.05*p(t),0]},
 hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]},
 chest:{waist:[[[1,0,0],0]]}, hands:{left:hand('left'),right:hand('right')},
 feet:{left:{mode:'floor',at:[0.12,0],heading:0,pitch:0,pole:[0.12,0.5,1]},
 right:{mode:'floor',at:[-0.12,0],heading:0,pitch:0,pole:[-0.12,0.5,1]}},
constraints:[],solve:{vars:[],reg:{}}},{work:p});
export default {
 id:'h-db-shrug', name:'双哑铃站姿耸肩', nameEn:'Standing Dumbbell Shrug',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['trapUpper'],side:'both',pulseTrack:'work',pulseBase:0.3},
 camera:{dir:[0.65,0.15,1],fit:['head','leftToe','rightToe','leftAnkle','rightAnkle','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.15,k:0.9,drift:0,at:2,fitTimeline:true},
 frame:{mode:'fit',width:800,height:800,cx:512,cy:510},stillAt:2,
 shadow:{joints:['leftToe','rightToe','leftAnkle','rightAnkle','pelvis'],blobs:[{j:'leftToe',rx:38,ry:10,a:0.6},{j:'rightToe',rx:38,ry:10,a:0.6}],bands:[]},
 props:[{type:'gripHand',side:'right'},{type:'gripHand',side:'left'},
 {type:'dumbbell',length:0.30,plate:0.042,attach:'rightHand',...DB('right')},
 {type:'dumbbell',length:0.30,plate:0.042,attach:'leftHand',...DB('left')}],
 keyFrames:[0,1,2,3,4,5,6,7],qa:{pins:[{c:'footL',when:'always'},{c:'footR',when:'always'}],
 straight:[{j:'knee.left',min:166},{j:'knee.right',min:166}],allowContact:[]},
};
