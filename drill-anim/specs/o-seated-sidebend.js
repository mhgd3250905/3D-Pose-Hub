// Ordinary-chair RIGHT overhead side stretch. Front +Z, body left +X.
// Pelvis stays seated, feet planted. RIGHT arm comfortably raised, LEFT arm relaxed
// beside the chair without claiming hand support/contact. Bend 0-16 deg to LEFT,
// hold 3 s, return slowly. No twisting, forward collapse or deliberate pelvic lift.
// Different support/position from standing o-stand-sidebend and supine h-banana.
// Oblique highlight denotes the side-trunk region, not isolated quadratus lumborum.
import {build,keys,armWrist,armDir,r4,sg} from '../lib/home-anim.mjs';
const DUR=8;
const p=keys([[0,0],[0.5,0],[2.2,1],[5.2,1],[7.3,0]],DUR);
const hand=(s,flex,abd,reach)=>({mode:'free',frame:'chest',wrist:r4(armWrist(s,flex,abd,reach)),finger:r4(armDir(s,flex,abd)),normal:[-sg(s),0,0],poleUp:[sg(s)*0.6,s==='right'?1.7:1.1,-0.25]});
const P=build(DUR,{
 pelvis:[0,0.588,0.02],hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]},
 chest:{waist:[[[0,0,1],t=>-16*p(t)]]},
 hands:{right:hand('right',170,8,0.48),left:hand('left',15,25,0.48)},
 feet:{left:{mode:'floor',at:[0.14,0.36],heading:4,pitch:0,pole:[0.14,0.7,1]},right:{mode:'floor',at:[-0.14,0.36],heading:-4,pitch:0,pole:[-0.14,0.7,1]}},
 constraints:[],solve:{vars:[],reg:{}}
},{stretch:p});
export default{
 id:'o-seated-sidebend',name:'坐椅单臂侧伸',nameEn:'Seated Overhead Side Stretch',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['obliques'],side:'right',pulseTrack:'stretch',pulseBase:0.3},
 camera:{dir:[-0.25,0.16,1],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.18,k:1,drift:0,at:3.5,fitTimeline:true},
 frame:{mode:'fit',width:720,height:820,cx:512,cy:520},stillAt:3.5,
 props:[{type:'chair',at:[0,0,-0.03],yaw:0,height:0.45,width:0.44,depth:0.42}],
 keyFrames:[0,2.2,5.2,6.3],
 qa:{pins:[{c:'footL',when:'always'},{c:'footR',when:'always'}],allowContact:[]}
};
