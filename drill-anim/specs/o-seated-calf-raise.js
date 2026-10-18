// Chair-seated bilateral heel raise. Front +Z; body left +X.
// Stable non-wheeled 45 cm chair carries pelvis and posterior thighs throughout.
// Bent knees, forefoot support, controlled 22-degree plantarflexion; no added load.
// Low-load ankle/calf control entry, not a hypertrophy promise or standing calf raise.
// Pelvis settles at most 20 mm as soft thigh/seat contact changes; no rising off chair.
// Shoe forefoot anchor uses training-human-v2 sole vertex; both sides independently checked.
// Calves highlight is a surface region, not an isolated soleus visualization.
import {build,keys,r4,armWrist,armDir,sg} from '../lib/home-anim.mjs';
const DUR=8,PEL=[0,0.601,0.02];
const p=keys([[0,0],[0.4,0],[1.7,1],[2.4,1],[3.7,0],[4.4,0],[5.7,1],[6.4,1],[7.7,0]],DUR);
const th=t=>22*p(t)*Math.PI/180;
const az=t=>0.22614274-(-0.08179858*Math.sin(th(t))+0.22614274*Math.cos(th(t)));
const hand=s=>({mode:'free',frame:'chest',wrist:r4(armWrist(s,10,20,0.47)),finger:r4(armDir(s,10,20)),normal:[-sg(s),0,0],poleUp:[sg(s)*0.6,1.1,-0.2],relax:1});
const foot=s=>({mode:'floor',at:t=>r4([s*0.17,0.36+az(t)]),heading:0,pitch:t=>22*p(t),pole:[s*0.17,0.7,1]});
const P=build(DUR,{pelvis:t=>[0,0.601-0.020*p(t)-0.014*p(t)*(1-p(t)),0.02],hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]},chest:{waist:[[[1,0,0],0]]},hands:{left:hand('left'),right:hand('right')},feet:{left:foot(1),right:foot(-1)},constraints:[],solve:{vars:[],reg:{}}},{up:p});
export default{id:'o-seated-calf-raise',name:'坐椅提踵',nameEn:'Chair-Seated Heel Raise',modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['calves'],side:'both',pulseTrack:'up',pulseBase:0.3},
 camera:{dir:[-1,0.12,0.35],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.18,k:1,drift:0,at:2,fitTimeline:true},
 frame:{mode:'fit',width:780,height:820,cx:512,cy:520},stillAt:2,
 props:[{type:'chair',at:[0,0,-0.09],yaw:0,height:0.45,width:0.44,depth:0.42}],
 keyFrames:[0,1.7,2.4,3,4,5.7,6.4,7],qa:{allowContact:[]}};
