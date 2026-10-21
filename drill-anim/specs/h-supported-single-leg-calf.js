// h-supported-single-leg-calf; front +Z, left +X, head +Y. Stable wall is balance support.
// Left foot bears weight; right foot held clear, pelvis level. Mirror for other side. Stable wall and basic single-leg control required.
// Conservative 24 degree plantarflexion; actual mesh sole pivot, not toe bone. Two slow reps, 8 seconds.
import { build, keys, sg, r4, REST, armDir, armWrist } from '../lib/home-anim.mjs';
import { UA, FA, DEG } from '../lib/ss-geo.mjs';
import { gripPose, gripAttach, G as GRIP } from '../lib/grip.mjs';
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = a => mul(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const FIST = 0.092;   // target reach allowance for soft elbows; gripPose still determines the actual fist centre
// fist round a handle at the end of forearm direction f from elbow E, thumb toward a (made perpendicular to f)
const dbGrip = (side, E, f, a) => { f = nrm(f); a = nrm(sub(a, mul(f, dot(a, f)))); return gripPose(side, add(E, mul(f, FA + FIST)), a, mul(cross(f, a), -sg(side))); };
// dumbbell through the baked fist (+22 mm along the grip axis centres it, as in forearms-B / deltoids-B)
const DB = side => { const A = gripAttach(side); return { offset: r4(A.offset.map((x, i) => x + 0.022 * GRIP[side].a[i])), rot: A.rot }; };
const hand = side => {
 const E = add(REST.shoulder(side), mul(armDir(side, 2, 12), UA));
 const g = dbGrip(side, E, armDir(side, 10, 8), [0,0,1]);
 return {mode:'free', frame:'chest', relax:0, ...g, poleUp:r4(add(E,[sg(side)*0.06,0,-0.3]))};
};
const wallHand={mode:'free',frame:'world',wrist:[0.24,1.27,0.420],finger:[0,1,0],normal:[0,0,1],poleUp:[0.55,0.95,-0.1]};
const DUR=8;
const p=keys([[0,0],[0.4,0],[2,1],[2.3,1],[3.7,0],[4.4,0],[6,1],[6.3,1],[7.7,0]],DUR);
// Rest sole toe-tip is z=0.22536, y=-0.08107 relative to ankle.
// Rotate about this actual mesh support; floor mode supplies the lowest sole height.
const az=t=>0.22536*(1-Math.cos(24*p(t)*DEG))+0.08107*Math.sin(24*p(t)*DEG);
const P=build(DUR,{
pelvis:t=>r4([0.08,0.889+0.22536*Math.sin(24*p(t)*DEG)+0.08107*(Math.cos(24*p(t)*DEG)-1),0.006+az(t)]),
 hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]},
 chest:{waist:[[[1,0,0],0]]}, hands:{left:wallHand,right:{mode:'free',frame:'chest',wrist:r4(armWrist('right',10,20,0.47)),finger:r4(armDir('right',10,20)),normal:[1,0,0],poleUp:[-0.6,1.1,-0.2],relax:1}},
 feet:{left:{mode:'floor',at:t=>r4([0.12,az(t)]),heading:0,pitch:t=>24*p(t),pole:[0.12,0.5,1]},
 right:{mode:'free',frame:'world',ankle:t=>r4([-0.10,0.26+0.22536*Math.sin(24*p(t)*DEG)+0.08107*(Math.cos(24*p(t)*DEG)-1),-0.24+az(t)]),pole:[-0.10,0.5,0.65],rot:[[[1,0,0],0]]}},
constraints:[],solve:{vars:[],reg:{}}},{work:p});
export default {
 id:'h-supported-single-leg-calf', name:'扶墙单腿提踵', nameEn:'Supported Single-Leg Calf Raise',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['calves'],side:'left',pulseTrack:'work',pulseBase:0.3},
 camera:{dir:[1,0.12,-0.6],fit:['head','leftToe','rightToe','leftAnkle','rightAnkle','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.15,k:0.9,drift:0,at:2,fitTimeline:true},
 frame:{mode:'fit',width:800,height:800,cx:512,cy:510},stillAt:2,
 shadow:{joints:['leftToe','rightToe','leftAnkle','rightAnkle','pelvis'],blobs:[{j:'leftToe',rx:38,ry:10,a:0.6},{j:'rightToe',rx:38,ry:10,a:0.6}],bands:[]},
 props:[{type:'wall',at:[0,0,0.46],yaw:180,size:[1.3,2.2,0.12]}],
 keyFrames:[0,1,2,3,4,5,6,7],qa:{// Toe joint is 18 cm forward at ankle height, not the mesh contact. QA contact probe locks actual sole toe-tip instead.
 pins:[{c:'handL',when:'always'}],straight:[{j:'knee.left',min:166}],allowContact:[]},
};
