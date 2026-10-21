// Chair-seated RIGHT active hip external-rotation control. Front +Z, body left +X.
// Thigh axis and knee centre stay still on the seat; explicit femoral axial twist
// follows the shin arc (not a sideways bending knee). The unsupported right foot swings INWARD
// through a small 20-degree arc. LEFT foot is planted, pelvis/chest do not turn.
// Start with right foot slightly off the floor; do not press the knee sideways or
// pivot a weight-bearing foot. This is low-load control, not a loaded strength drill.
// Distinct from n-chair-wiper (foot planted, knee inward) and h-band-hip-ir (foot outward).
// Glute highlight is only a surface proxy for hip external-rotator activity, not an
// isolated deep-muscle map or a claim that all rotators act identically in hip flexion.
import {build,keys,r4,armWrist,armDir,sg} from '../lib/home-anim.mjs';
import {REST,restPtW,leg,rotAbout} from '../lib/ss-geo.mjs';
const DUR=8,PEL=[0,0.601,0.02],hips={up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]};
const p=keys([[0,0],[0.5,0],[2.2,1],[5.2,1],[7.3,0]],DUR);
const L=leg('right',90,90),K=restPtW(hips,PEL,L.knee),A=restPtW(hips,PEL,L.ankle);
const hand=s=>({mode:'free',frame:'chest',wrist:r4(armWrist(s,10,20,0.47)),finger:r4(armDir(s,10,20)),normal:[-sg(s),0,0],poleUp:[sg(s)*0.6,1.1,-0.2],relax:1});
const P=build(DUR,{
 pelvis:PEL,hips,chest:{waist:[[[1,0,0],0]]},hands:{left:hand('left'),right:hand('right')},
 feet:{left:{mode:'floor',at:[0.25,0.36],heading:8,pitch:0,pole:[0.25,0.7,1]},
 right:{mode:'free',frame:'world',ankle:t=>r4(rotAbout(A,K,[0,0,1],20*p(t))),rot:[[[0,0,1],t=>20*p(t)]],thighTwist:t=>20*p(t),pole:K}},
 constraints:[],solve:{vars:[],reg:{}}
},{turn:p});
export default{
 id:'o-seated-hip-er',name:'坐椅无阻力髋外旋控制',nameEn:'Seated Active Hip External Rotation',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['glute-max'],side:'right',pulseTrack:'turn',pulseBase:0.3},
 camera:{dir:[-0.35,0.22,1],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.18,k:1,drift:0,at:3.5,fitTimeline:true},
 frame:{mode:'fit',width:780,height:820,cx:512,cy:520},stillAt:3.5,
 props:[{type:'chair',at:[0,0,-0.09],yaw:0,height:0.45,width:0.44,depth:0.42}],
 keyFrames:[0,2.2,5.2,6.3],
 qa:{pins:[{c:'footL',when:'always'}],jointPins:[{j:'rightKnee'}],allowContact:[]}
};
