// Single goal: knee flexion against lower-leg gravity, hip stationary. No ankle cuff.
// Ordinary stable chair provides light balance contact; not load-bearing through hand.
// 15 to 80 degree knee flexion. Foot follows shin with mild dorsiflexion.
import {build,keys,r4,armWrist,armDir} from '../lib/home-anim.mjs';
import {leg,restPtW} from '../lib/ss-geo.mjs';
const DUR=8,PEL=[0,0.8936,0],hips={up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]};
const pump=keys([[0,0],[0.4,0],[2.0,1],[3.0,1],[5.0,0],[7.6,0]],DUR);
const knee=t=>15+65*pump(t);
const foot={mode:'free',frame:'world',ankle:t=>restPtW(hips,PEL,leg('right',3,knee(t)).ankle),rot:[[[1,0,0],t=>knee(t)-18]],pole:t=>restPtW(hips,PEL,leg('right',3,knee(t)).knee)};
const P=build(DUR,{
 pelvis:PEL,hips,chest:{waist:[[[1,0,0],0]]},
 hands:{left:{mode:'free',frame:'world',palmAt:[0.35,0.9879,0.006],finger:[0,0,1],normal:[0,-1,0],pole:[0.7,1.05,-0.15]},
 right:{mode:'free',frame:'chest',wrist:r4(armWrist('right',10,20,0.47)),finger:r4(armDir('right',10,20)),normal:[1,0,0],poleUp:[-0.6,1.1,-0.2],relax:1}},
 feet:{left:{mode:'free',frame:'world',ankle:restPtW(hips,PEL,leg('left',3,6).ankle),rot:[[[1,0,0],0]],pole:restPtW(hips,PEL,leg('left',3,6).knee)},right:foot},constraints:[],solve:{vars:[],reg:{}}
},{pump,effort:t=>Math.abs(pump(t))});
export default{
 id:'o-supported-knee-curl',name:'扶椅站姿徒手屈膝',nameEn:'Chair-Supported Standing Knee Curl',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['hamstrings'],side:'right',pulseTrack:'effort',pulseBase:0.3},
 camera:{dir:[-1,0.1,-0.45],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.18,k:1,drift:0,at:2,fitTimeline:true},
 frame:{mode:'fit',width:780,height:820,cx:512,cy:520},stillAt:2,
 props:[{type:'chair',at:[0.40,0,0.183],yaw:0,height:0.45,width:0.44,depth:0.42,back:0.58}],
 keyFrames:[0,2,3,5,6],
 qa:{pins:[{c:'handL',when:'always'},{c:'footL',when:'always'}],allowContact:[]}
};
