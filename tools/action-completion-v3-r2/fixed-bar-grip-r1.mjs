// Fixed bar grip r1: reuse the frozen webxr-dumbbell-wrist-r1 fist (32 mm shaft, the accepted dumbbell grasp) on fixed bars
// (parallettes, dip bars, pull-up bar). The old baked-fist hand targets (lib/grip.mjs G / gripHand) are inverted back to the
// bar centre, bar axis and palm side they encode, then re-solved so the frozen shaft axis lies on the bar. The dumbbell is
// hidden; the bar itself is what the fist closes on. Remote keyframe use only: no contact certification, not acceptance.
import {G as OLD} from '../../drill-anim/lib/grip.mjs';
const sub=(a,b)=>a.map((x,i)=>x-b[i]),add=(a,b)=>a.map((x,i)=>x+b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),sc=(a,k)=>a.map(x=>x*k);
const nrm=a=>sc(a,1/Math.hypot(...a)),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const basis=(a,p)=>{a=nrm(a);p=nrm(sub(p,sc(a,dot(p,a))));return [a,p,cross(a,p)];};
const apply=(Bw,Bl,v)=>{const k=Bl.map(e=>dot(e,v));return [0,1,2].map(i=>Bw.reduce((s,e,j)=>s+e[i]*k[j],0));};
const r5=v=>v.map(x=>+x.toFixed(5));
// Bone-local finger / palm-normal vectors used by E.handQ (same rig; copied from lib/grip.mjs PF).
export const PF={left:[[0.98253144,0.05483374,0.17783482],[0.06068526,-0.99777448,-0.02762938]],right:[[-0.98253144,0.05483374,0.17783482],[-0.06068526,-0.99777448,-0.02762938]]};
// Frozen shaft centre / axis in the hand bone's local frame, from recipe.neutralFrames (inv(handMatrixWorld) * canonicalToWorld)
// applied to the frozen 'shaft' primitive (radius 0.01664). Axis sign flipped to match the old G thumb convention (+Z).
// pal: the old G palmar direction projected perpendicular to the new axis, so the hand keeps the validated old orientation.
const C={left:[0.076111,-0.043131,0.000018],right:[-0.076111,-0.043131,0.000018]},A={left:[0.330218,0.01962,0.943701],right:[-0.330218,0.01962,0.943701]};
export const G=Object.fromEntries(['left','right'].map(s=>{const a=nrm(A[s]),p=OLD[s].pal,pal=nrm(sub(p,sc(a,dot(p,a))));return [s,{c:C[s],a:r5(a),pal:r5(pal)}];}));
export const SHAFT_RADIUS_M=0.016;
// world hand frame from {finger, normal}: maps PF[side] (bone-local) onto them
const handBasis=(side,finger,normal)=>[basis(finger,normal),basis(PF[side][0],PF[side][1])];
export function recoverBar(side,{wrist,finger,normal}){
  const [Bw,Bl]=handBasis(side,finger,normal),g=OLD[side];
  return {bar:r5(add(wrist,apply(Bw,Bl,g.c))),axis:r5(apply(Bw,Bl,g.a)),palm:r5(sc(apply(Bw,Bl,g.pal),-1))};
}
export function gripPoseFixed(side,bar,axis,palm){
  const g=G[side],Bw=basis(axis,sc(palm,-1)),Bl=basis(g.a,g.pal);
  return {wrist:r5(sub(bar,apply(Bw,Bl,g.c))),finger:r5(apply(Bw,Bl,PF[side][0])),normal:r5(apply(Bw,Bl,PF[side][1]))};
}
// Rewrites spec.pose.base.hands for a fixed-bar action; bars: optional explicit {left,right:{bar,axis,palm}} overriding recovery.
export function adapt(spec,bars={}){
  const hands=spec.pose?.base?.hands;if(!hands)throw Error('fixed bar grip needs pose.base.hands');
  const report={};
  for(const side of ['left','right']){
    const h=hands[side];if(!(h?.mode==='free'&&h.frame==='world'&&h.wrist&&h.finger&&h.normal))throw Error('fixed bar grip needs a world-pinned free hand: '+side);
    for(const d of Object.values(spec.pose.deltas??{}))if(d?.hands?.[side])throw Error('fixed bar grip supports static world-pinned hands only: '+side);
    const b=bars[side]??recoverBar(side,h),pose=gripPoseFixed(side,b.bar,b.axis,b.palm);
    hands[side]={...h,...pose};report[side]={source:bars[side]?'recipe':'recovered-from-old-grip',...b,old:{wrist:h.wrist},new:pose};
  }
  return report;
}
