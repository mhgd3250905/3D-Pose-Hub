// Anchor post represents a structurally secured low anchor, NOT a movable chair or loose stand.
// Anchor is lateral (-X); inward-moving right ankle (+X) moves AWAY from it.
// Band tension therefore opposes external rotation. Space and rated fixed anchor required.
// Chair-seated RIGHT resisted hip external-rotation control. Front +Z, body left +X.
// Thigh axis and knee centre stay still; seat supports the proximal seated region; explicit femoral axial twist
// follows the shin arc (not a sideways bending knee). The unsupported right foot swings INWARD
// through a small 20-degree arc. LEFT foot is planted, pelvis/chest do not turn.
// Start with right foot slightly off the floor; do not press the knee sideways or
// pivot a weight-bearing foot. Use a light band and comfortable range, without pain.
// Distinct from n-chair-wiper (foot planted, knee inward) and h-band-hip-ir (foot outward).
// Use only a secured, rated anchor; the post is a diagram, not proof of load capacity.
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
// Closed ankle loop, 16 straight segments fitted outside the actual ankle skin.
const cuff=Array.from({length:16},(_,i)=>{const pt=k=>({bone:'rightFoot',offset:[.043*Math.cos(k*Math.PI/8),.035,.006+.042*Math.sin(k*Math.PI/8)]});return {type:'band',from:pt(i),to:pt(i+1),r:.004,sag:0,colour:'#b5523f'};});
export default{
 id:'h-band-seated-hip-er',name:'坐椅弹力带髋外旋',nameEn:'Seated Banded Hip External Rotation',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['glute-max'],side:'right',pulseTrack:'turn',pulseBase:0.3},
 camera:{dir:[-0.25,0.22,1],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.18,k:1,drift:0,at:3.5,fitTimeline:true},
 frame:{mode:'fit',width:700,height:760,cx:512,cy:520},stillAt:3.5,
 props:[{type:'chair',at:[0,0,-0.09],yaw:0,height:0.45,width:0.44,depth:0.42},
 {type:'bandPost',at:[-0.70,0,0.3687],height:0.38,tieY:0.18},
 {type:'band',from:[-0.658,0.18,0.3687],to:{bone:'rightFoot',offset:[-0.043,0.035,0.006]},r:0.004,sag:0,colour:'#b5523f'},
 ...cuff],
 keyFrames:[0,2.2,5.2,6.3],
 qa:{pins:[{c:'footL',when:'always'}],jointPins:[{j:'rightKnee'}],allowContact:[]}
};
