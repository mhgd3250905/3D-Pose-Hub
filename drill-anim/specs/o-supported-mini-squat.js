// Bilateral hands on a stable non-wheeled tall chair back; shallow dynamic squat.
// Front +Z, body left +X. Chair is IN FRONT; seat projects away from the knees.
// Feet stay planted. Hips travel only 6.5 cm down and 4 cm back, with modest 15-degree lean.
// Distinct from free deep squat, static wall sit, and chair sit-to-stand: no sitting.
// Choose a sturdy chair with reachable back top about 99 cm, secured against sliding.
import {build,keys,r4} from '../lib/home-anim.mjs';
const DUR=8,p=keys([[0,0],[0.4,0],[1.9,1],[2.3,1],[3.7,0],[4.4,0],[5.9,1],[6.3,1],[7.7,0]],DUR);
const hand=s=>({mode:'free',frame:'world',palmAt:[s*0.16,0.9879,0.38],finger:[0,0,1],normal:[0,-1,0],pole:[s*0.55,1.15,0.1]});
const P=build(DUR,{pelvis:t=>r4([0,0.884-0.065*p(t),0.012-0.04*p(t)]),hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],t=>3+12*p(t)]]},chest:{waist:[[[1,0,0],0]]},hands:{left:hand(1),right:hand(-1)},feet:{left:{mode:'floor',at:[0.15,0],heading:8,pitch:0,pole:[0.35,0.6,1]},right:{mode:'floor',at:[-0.15,0],heading:-8,pitch:0,pole:[-0.35,0.6,1]}},constraints:[],solve:{vars:[],reg:{}}},{down:p});
export default{id:'o-supported-mini-squat',name:'扶椅浅蹲',nameEn:'Chair-Supported Mini Squat',modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},highlight:{groups:['quadriceps','glute-max'],side:'both',pulseTrack:'down',pulseBase:0.3},
 camera:{dir:[-1,0.18,0.3],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.18,k:1,drift:0,at:2,fitTimeline:true},
 frame:{mode:'fit',width:780,height:820,cx:512,cy:520},stillAt:2,
 props:[{type:'chair',at:[0,0,0.557],yaw:0,height:0.45,width:0.60,depth:0.42,back:0.58}],keyFrames:[0,1.9,2.3,3,4,5.9,6.3,7],
 qa:{pins:[{c:'footL',when:'always'},{c:'footR',when:'always'},{c:'handL',when:'always'},{c:'handR',when:'always'}],allowContact:[]}};
