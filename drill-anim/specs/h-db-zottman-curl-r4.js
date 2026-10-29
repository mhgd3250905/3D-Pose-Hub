// One slow 8-second repetition exposes both forearm turns clearly for review.
// Low-resolution template candidate: actual short-arm wrist targets and fixed WebXR grip.
// Original action and r2 remain unchanged. User action/camera acceptance is pending.
import source from './h-db-zottman-curl-r2.js';
import {build, keys, sg, armDir} from '../lib/home-anim.mjs';
const DUR=8, UA=.2567805323279002, FA=.2280465039306538;
const p=keys([[0,0],[.5,0],[2.3,1],[3.5,1],[6,0],[7.5,0]],DUR),turn=keys([[0,0],[2.3,0],[3.5,1],[6,1],[7.5,0]],DUR);
const add=(a,b)=>a.map((x,i)=>x+b[i]),mul=(a,k)=>a.map(x=>x*k);
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const norm=a=>mul(a,1/Math.hypot(...a));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function target(side,t){
 const q=p(t),theta=(30+98*q)*Math.PI/180;
 const S=[sg(side)*.187907,1.370247,-.004196];
 const E=add(S,mul(armDir(side,4+8*q,10),UA)),f=armDir(side,30+98*q,3);
 const up=[0,Math.sin(theta),Math.cos(theta)];
 const n0=norm(add(up,mul(f,-dot(up,f)))),r=Math.PI*turn(t);
 const palm=add(mul(n0,Math.cos(r)),mul(cross(f,n0),Math.sin(r)*sg(side)));
 // Fixed template canonical +Y follows forearm, +Z is palmar.
 // Bone-local +/-X -> f, -Y -> palm. Feed the legacy engine's
 // reference palm vectors through this desired orthonormal bone frame.
 const cols=[mul(f,sg(side)),mul(palm,-1),mul(cross(f,palm),-sg(side))];
 const apply=a=>[0,1,2].map(i=>cols.reduce((n,c,k)=>n+c[i]*a[k],0));
 const finger=apply([sg(side)*.98253144,.05483374,.17783482]);
 const normal=apply([sg(side)*.06068526,-.99777448,-.02762938]);
 return {wrist:add(E,mul(f,FA)),finger,normal,pole:E};
}
const hand=side=>({mode:'free',frame:'chest',relax:0,
 wrist:t=>target(side,t).wrist,finger:t=>target(side,t).finger,
 normal:t=>target(side,t).normal,poleUp:t=>target(side,t).pole});
const P=build(DUR,{
 // Preserve the original 11.555 mm standing softness relative to the new pelvis.
 pelvis:[0,.9519701718590191,.00404579831150554],
 hips:{up:[0,1,0],front:[0,0,1],rot:[]},chest:{waist:[]},
 hands:{left:hand('left'),right:hand('right')},
 feet:{left:{mode:'floor',at:[.12,0],heading:6,pitch:0,poleLow:[.2,.60,1]},
 right:{mode:'floor',at:[-.12,0],heading:-6,pitch:0,poleLow:[-.2,.60,1]}},
 constraints:[],solve:{vars:[],reg:{}}
},{curl:p,turn});
export default {
 ...source,id:'h-db-zottman-curl-r4',revisionOf:'h-db-zottman-curl-r3',
 sourceBatch:'remaining32-template-r2-20261028',
 runtimeModel:{profile:'training-human-v3-armfix',version:'0.1.0-r2'},
 nativeHands:{twistShare:.5},
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 camera:{...source.camera,dir:[.55,.12,1],pad:.13,k:.9,drift:0,orbitDegrees:0,frontSweepDegrees:0,fitTimeline:true},
 stillAt:3.5,keyFrames:[0,.5,2.3,2.9,3.5,4.8,6,6.75,7.5],
 templateHands:{left:'dumbbell-grasp',right:'dumbbell-grasp',asset:'webxr-dumbbell-wrist-r1'},
 reviewed:false,releaseEligible:false,
};

