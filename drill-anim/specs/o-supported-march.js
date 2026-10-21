// Alternating sagittal hip-flexion march, holding a stable non-wheeled tall-back chair.
// Front +Z, body left +X. Chair is beside the LEFT hand, outside both knee paths.
// No band, hip-opening arc, seated lift, high-impact step, or floor exercise.
// Moderate 55-degree hip flexion, slow controlled return; low-load balance/hip-flexion practice.
// Chair seat 45 cm, back top about 99 cm: choose a sturdy chair with a reachable back.
// Hip-flexor surface highlight is a teaching proxy, not visualization of deep iliopsoas.
import {build,keys,r4,armWrist,armDir} from '../lib/home-anim.mjs';
import {leg,restPtW} from '../lib/ss-geo.mjs';
const DUR=8,PEL=[0,0.8936,0],hips={up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]};
const R=keys([[0,0],[0.3,0],[1.4,1],[2.5,1],[3.7,0]],DUR);
const L=keys([[0,0],[4.3,0],[5.4,1],[6.5,1],[7.7,0]],DUR);
const f=s=>s==='right'?R:L;
const foot=s=>({mode:'free',frame:'world',ankle:t=>restPtW(hips,PEL,leg(s,3+52*f(s)(t),6+69*f(s)(t)).ankle),rot:[[[1,0,0],t=>17*f(s)(t)]],pole:t=>restPtW(hips,PEL,leg(s,3+52*f(s)(t),6+69*f(s)(t)).knee)});
const P=build(DUR,{
 pelvis:PEL,hips,chest:{waist:[[[1,0,0],0]]},
 hands:{left:{mode:'free',frame:'world',palmAt:[0.35,0.9879,0.006],finger:[0,0,1],normal:[0,-1,0],pole:[0.7,1.05,-0.15]},
 right:{mode:'free',frame:'chest',wrist:r4(armWrist('right',10,20,0.47)),finger:r4(armDir('right',10,20)),normal:[1,0,0],poleUp:[-0.6,1.1,-0.2],relax:1}},
 feet:{left:foot('left'),right:foot('right')},constraints:[],solve:{vars:[],reg:{}}
},{rightLift:R,leftLift:L,lift:t=>Math.max(R(t),L(t))});
export default{
 id:'o-supported-march',name:'扶椅站姿交替抬膝',nameEn:'Chair-Supported Alternating March',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['hip-flexors'],side:'both',pulseTrack:'lift',pulseBase:0.3},
 camera:{dir:[-0.2,0.18,1],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.18,k:1,drift:0,at:2,fitTimeline:true},
 frame:{mode:'fit',width:780,height:820,cx:512,cy:520},stillAt:2,
 props:[{type:'chair',at:[0.40,0,0.183],yaw:0,height:0.45,width:0.44,depth:0.42,back:0.58}],
 keyFrames:[0,1.4,2.5,3.1,4,5.4,6.5,7.1],
 qa:{pins:[{c:'handL',when:'always'},{c:'footL',when:'params.leftLift<0.001'},{c:'footR',when:'params.rightLift<0.001'}],allowContact:[]}
};
