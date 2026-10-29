// Real fixed-grasp frame: WebXR palmar +Z maps to hand-local -Y; signed shaft and palm define overhand.
// Keep the original straight-elbow QA and timing; 18deg arm abduction gives a wider-than-shoulder, reachable grip.
import prior from './h-towel-pass-r8.js';
import {build,keys,armDir,REST,sg} from './_home-armfix-r1.mjs';
const D=8,PY=.951970171859,REACH=.4823,PSI=18;
const p=keys([[0,0],[.4,0],[3.4,1],[4.2,1],[7.2,0]],D),phi=t=>34+178*p(t);
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,k)=>a.map(x=>x*k),dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),unit=a=>mul(a,1/Math.hypot(...a));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const frame=(a,n)=>{a=unit(a);const b=unit(sub(n,mul(a,dot(n,a))));return [a,b,cross(a,b)];};
const hand=side=>{const s=sg(side),S=REST.shoulder(side);S[1]+=PY-REST.pelvis[1];S[2]+=.006-REST.pelvis[2];
 const src=frame([-s*.33021816355948425,-.01961983360331667,-.9437007081616395],[0,-1,0]);
 const g=t=>{const a=phi(t)*Math.PI/180,pa=[0,Math.sin(a),Math.cos(a)],dst=frame([s,0,0],mul(pa,-1)),apply=v=>[0,1,2].map(i=>dst.reduce((n,c,k)=>n+c[i]*dot(src[k],v),0));
  return {wrist:add(S,mul(armDir(side,phi(t),PSI),REACH)),pole:[S[0]+s*.5,S[1]-.3*pa[1],S[2]-.3*pa[2]],finger:apply([s*.98253144,.05483374,.17783482]),normal:apply([s*.06068526,-.99777448,-.02762938])};};
 return {mode:'free',frame:'world',wrist:t=>g(t).wrist,pole:t=>g(t).pole,finger:t=>g(t).finger,normal:t=>g(t).normal};
};
const P=build(D,{...prior.pose.base,hands:{left:hand('left'),right:hand('right')}},{pass:p});
export default {...prior,id:'h-towel-pass-r10',revisionOf:'h-towel-pass-r8',pose:{base:P.base,deltas:P.deltas},timeline:{duration:D,tracks:P.tracks},gripIntent:'overhand-real-fixed-palm',fixedTowelGrip:{profile:'fixed-towel-real-palm-r1',fixedHandUnchanged:true,wristElbowPathsUnchanged:false,armAbductionDegrees:PSI,shoulderWristReachM:REACH,clothDiameterMm:34,status:'candidate-awaiting-cpu-gpu-and-user-review'}};
