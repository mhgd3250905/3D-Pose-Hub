import { floorDrill, curve, qaStd } from './_thomas.mjs';
// R15: broad straddle with the knees and toes sharing the upward bend plane.
const T=8,up=()=>1;
export default floorDrill({
 id:'t-lsit-wide',name:'宽腿 L 撑',nameEn:'Wide-Leg L-Sit',T,
 hands:{left:[0.26,-0.11,[0.9,0.3]],right:[-0.26,-0.11,[-0.9,0.3]]},
 fn:t=>{const u=up(t),l={elev:-1+5*u,spread:68,pf:3+15*u,knee:178};
  return {pitch:-7-3*u,waist:16,py:0.138+0.022*u,pw:0.01,pz:0,pzw:3,shift:0.09+0.025*u,elbow:165+13*u,legs:{left:l,right:l}};},
 tags:{up},highlight:{groups:['abs'],panels:['quadRect'],side:'both',pulseTrack:'up',pulseBase:0.25},
 camera:{dir:[0.25,0.2,1],fit:['head','leftPalm','rightPalm','leftToe','rightToe','pelvis','leftKnee','rightKnee'],pad:0.2,k:1,drift:0,at:3.5},
 keyFrames:[0.3,1.2,3.5],qa:qaStd(),
});
