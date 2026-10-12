import { floorDrill, curve, qaStd } from './_thomas.mjs';
// R09: thighs fold toward the chest. A backward whole-body lean is not hip compression.
const T=8, up=()=>1;
const spec = floorDrill({
  id:'t-vsit',name:'V 撑',nameEn:'V-Sit',T,
  hands:{left:[0.235,-0.025],right:[-0.235,-0.025]},
  fn:t=>{const u=up(t),l={elev:-1+66*u,spread:2,pf:3+32*u,knee:178};
    return {pitch:-5-7*u,waist:5-7*u,py:0.138+0.022*u,pw:0.01,rootZ:0.083126,shift:0.06*u,elbow:165+13*u,legs:{left:l,right:l}};},
 // Static support depth is the original solver's settled value. A stronger reach
 // constraint meets the authored elbow angle without post-solve pelvis clipping.
 solve:{vars:['py'],reg:{py:0.3},iters:80},
 extra:()=>({'constraints.0.weight':20,'constraints.1.weight':20}),
  tags:{up},highlight:{groups:['abs'],panels:['quadRect'],side:'both',pulseTrack:'up',pulseBase:0.25},
  camera:{dir:[1,0.2,0.35],fit:['head','leftPalm','rightPalm','leftToe','rightToe','pelvis','leftKnee','rightKnee'],pad:0.16,k:1,drift:4,at:4,fitTimeline:false},
  keyFrames:[0.3,1.2,4],
  // R09 visibly requires deep pike compression; other specs retain the 135-degree default.
  qa:qaStd({more:{hipFlexMax:155}}),
});
export default { ...spec, alignClavicles: true };
