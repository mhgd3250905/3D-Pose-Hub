import { floorDrill,curve,qaStd } from './_thomas.mjs';
// R17: hands between the thighs; retain the deliberate forward compression of this drill.
const T=8,up=()=>1;
export default floorDrill({
 id:'t-straddle-hold',name:'分腿支撑',nameEn:'Straddle Support Hold',T,
 hands:{left:[0.075,0.24],right:[-0.075,0.24]},
 fn:t=>{const u=up(t),l={elev:-1+5*u,spread:68,pf:3+12*u,knee:178};
  return {pitch:4+6*u,waist:14+4*u,py:0.138+0.025*u,pw:0.01,pz:0,pzw:3,shift:0.065+0.025*u,elbow:165+13*u,legs:{left:l,right:l}};},
 tags:{up},highlight:{groups:['abs'],panels:['quadRect'],side:'both',pulseTrack:'up',pulseBase:0.25},
 camera:{dir:[0.16,0.17,1],fit:['head','leftPalm','rightPalm','leftToe','rightToe','pelvis','leftKnee','rightKnee'],pad:0.2,k:1,drift:0,at:3.5},
 keyFrames:[0.3,1.2,3.5],qa:qaStd(),
});
