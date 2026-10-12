import { floorDrill, curve, qaStd } from './_thomas.mjs';
// R09: thighs fold toward the chest. A backward whole-body lean is not hip compression.
const T=8, up=()=>1;
export default floorDrill({
  id:'t-vsit',name:'V 撑',nameEn:'V-Sit',T,
  hands:{left:[0.235,-0.025],right:[-0.235,-0.025]},
  fn:t=>{const u=up(t),l={elev:-1+66*u,spread:2,pf:3+32*u,knee:178};
    return {pitch:-5-7*u,waist:5-7*u,py:0.138+0.022*u,pw:0.01,shift:0.08+0.025*u,elbow:165+13*u,legs:{left:l,right:l}};},
  tags:{up},highlight:{groups:['abs'],panels:['quadRect'],side:'both',pulseTrack:'up',pulseBase:0.25},
  camera:{dir:[1,0.16,0.4],fit:['head','leftPalm','rightPalm','leftToe','rightToe','pelvis','leftKnee','rightKnee'],pad:0.22,k:1,drift:0,at:4},
  keyFrames:[0.3,1.2,4],
  // R09 visibly requires deep pike compression; other specs retain the 135-degree default.
  qa:qaStd({more:{hipFlexMax:155}}),
});
