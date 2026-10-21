// Single goal: unloaded foot inversion and return. Hip, knee, ankle centre and tibia stay fixed.
// Right side is -X; its medial direction is +X. Positive roll turns the sole toward +X.
// Composite foot/subtalar motion represented by one foot bone, not an anatomical joint-isolation model.
// 12 degrees comfortable active control; no loaded edge-standing, forcing, or sprain treatment claim.
// Left hand is a light balance touch, not a load-bearing palm plank.
// Ordinary stable chair, office-compatible; no floor sitting. Right foot intentionally airborne.
// For people able to stand safely; not a postoperative or individual medical prescription.
import {build,keys,r4,armWrist,armDir} from '../lib/home-anim.mjs';
import {leg,restPtW} from '../lib/ss-geo.mjs';
const DUR=8,PEL=[0,0.8936,0],hips={up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]};
const inversion=keys([[0,0],[0.5,0],[2.0,1],[4.0,1],[6.0,0],[7.6,0]],DUR);
const foot={mode:'free',frame:'world',ankle:restPtW(hips,PEL,leg('right',55,75).ankle),rot:[[[1,0,0],20],[[0,-Math.sin(20*Math.PI/180),Math.cos(20*Math.PI/180)],t=>12*inversion(t)]],pole:restPtW(hips,PEL,leg('right',55,75).knee)};
const P=build(DUR,{
 pelvis:PEL,hips,chest:{waist:[[[1,0,0],0]]},
 hands:{left:{mode:'free',frame:'world',palmAt:[0.35,0.9879,0.006],finger:[0,0,1],normal:[0,-1,0],pole:[0.7,1.05,-0.15]},
 right:{mode:'free',frame:'chest',wrist:r4(armWrist('right',10,20,0.47)),finger:r4(armDir('right',10,20)),normal:[1,0,0],poleUp:[-0.6,1.1,-0.2],relax:1}},
 feet:{left:{mode:'free',frame:'world',ankle:restPtW(hips,PEL,leg('left',3,6).ankle),rot:[[[1,0,0],0]],pole:restPtW(hips,PEL,leg('left',3,6).knee)},right:foot},constraints:[],solve:{vars:[],reg:{}}
},{inversion});
export default{
 id:'o-supported-ankle-inversion',name:'扶椅悬空足内翻控制',nameEn:'Chair-Supported Active Foot Inversion',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['tibialis'],side:'right',pulseTrack:'inversion',pulseBase:0.3},
 camera:{dir:[-0.15,0.10,1],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.18,k:1,drift:0,at:2,fitTimeline:true},
 frame:{mode:'fit',width:780,height:820,cx:512,cy:520},stillAt:2,
 props:[{type:'chair',at:[0.40,0,0.183],yaw:0,height:0.45,width:0.44,depth:0.42,back:0.58}],
 keyFrames:[0,2,4,6],
 qa:{pins:[{c:'handL',when:'always'},{c:'footL',when:'always'}],allowContact:[]}
};
