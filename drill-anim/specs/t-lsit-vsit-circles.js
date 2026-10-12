import { floorDrill,curve,qaStd,smooth } from './_thomas.mjs';
// R12/R13 are opposite circle directions. Each direction is demonstrated once.
// Elevation and abduction are thigh directions in WORLD space, not screen paths.
const T=10,up=()=>1;
const phase=t=>t<1.2||t>=8.8?0:((t-1.2)/3.8)%1;
const reverse=t=>t>=5;
const shape=p=>{let e=0,s=0;
 if(p<0.25)s=smooth(p/0.25);
 else if(p<0.5){const u=smooth((p-0.25)/0.25);s=1-u;e=u;}
 else if(p<0.75)e=1-smooth((p-0.5)/0.25);
 return {e,s};};
export default floorDrill({
 id:'t-lsit-vsit-circles',name:'L 撑到 V 撑画圈',nameEn:'L-Sit to V-Sit Circles',T,
 hands:{left:[0.26,-0.11,[0.9,0.3]],right:[-0.26,-0.11,[-0.9,0.3]]},
 fn:t=>{const u=up(t),p=phase(t),{e,s}=shape(reverse(t)?(1-p)%1:p),l={elev:-1+6*u+72*e*u,spread:2+66*s*u,pf:3+23*u,knee:178};
  return {pitch:-10-3*e,waist:16-16*e,py:0.14+0.022*u,pw:0.01,pz:0,pzw:3,shift:0.09+0.025*u,elbow:165+13*u,legs:{left:l,right:l}};},
 tags:{up,reverse:t=>reverse(t)?1:0},highlight:{groups:['abs'],panels:['quadRect'],side:'both',pulseTrack:'up',pulseBase:0.25},
 camera:{dir:[0.16,0.16,1],fit:['head','leftPalm','rightPalm','leftToe','rightToe','pelvis','leftKnee','rightKnee'],pad:0.25,k:1,drift:0,at:3.1},
 keyFrames:[1.3,2.15,3.1,5.1,6.9],
 // High circle point is a deep pike seen in R12/R13, not the default standing limit.
 qa:qaStd({more:{hipFlexMax:165}}),
});
