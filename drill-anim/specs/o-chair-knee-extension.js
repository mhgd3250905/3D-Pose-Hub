// RIGHT unloaded knee extension. Front +Z; body left +X. Stable non-wheeled chair.
// Fixed thigh slopes gently down toward the knee; hands relaxed beside the body.
// Thigh and pelvis stay on the seat; only shin rotates about a fixed knee.
// Knee extends from 90 to 162 degrees, never locks or hyperextends. LEFT foot planted.
// Low-load quadriceps control, not a substitute for progressive strength training.
// Distinct from machine quadriceps-C, standing band terminal extension, and whole-thigh seated knee lift.
import {build,keys,r4,armWrist,armDir,sg} from '../lib/home-anim.mjs';
import {restPtW,leg} from '../lib/ss-geo.mjs';
const DUR=8,PEL=[0,0.601,0.02],hips={up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]};
const p=keys([[0,0],[0.5,0],[2.2,1],[5.2,1],[7.3,0]],DUR);
const K=restPtW(hips,PEL,leg('right',80,90).knee);
const hand=s=>({mode:'free',frame:'chest',wrist:r4(armWrist(s,10,20,0.47)),finger:r4(armDir(s,10,20)),normal:[-sg(s),0,0],poleUp:[sg(s)*0.6,1.1,-0.2],relax:1});
const P=build(DUR,{
 pelvis:PEL,hips,chest:{waist:[[[1,0,0],0]]},hands:{left:hand('left'),right:hand('right')},
 feet:{left:{mode:'floor',at:[0.25,0.36],heading:8,pitch:0,pole:[0.25,0.7,1]},
 right:{mode:'free',frame:'world',ankle:t=>restPtW(hips,PEL,leg('right',80,90-72*p(t)).ankle),rot:[[[1,0,0],t=>-62*p(t)]],pole:K}},
 constraints:[],solve:{vars:[],reg:{}}
},{extend:p});
export default{
 id:'o-chair-knee-extension',name:'坐椅徒手伸膝',nameEn:'Chair-Seated Unloaded Knee Extension',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['quadriceps'],side:'right',pulseTrack:'extend',pulseBase:0.3},
 camera:{dir:[-1,0.2,0.45],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.18,k:1,drift:0,at:3.5,fitTimeline:true},
 frame:{mode:'fit',width:780,height:820,cx:512,cy:520},stillAt:3.5,
 props:[{type:'chair',at:[0,0,-0.09],yaw:0,height:0.45,width:0.44,depth:0.42}],
 keyFrames:[0,2.2,5.2,6.3],
 qa:{pins:[{c:'footL',when:'always'}],jointPins:[{j:'rightKnee'}],allowContact:[]}
};
