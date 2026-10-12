import { floorDrill,curve,qaStd } from './_thomas.mjs';
// R06/R14: hip above the chest, knees tucked under the abdomen, heels near the seat.
const T=8,up=()=>1;
export default floorDrill({
 id:'t-tuck-planche',name:'团身俄挺',nameEn:'Tuck Planche',T,
 hands:{left:[0.20,0,[0.7,0.7]],right:[-0.20,0,[-0.7,0.7]]},
 poleUp:sg=>[sg*0.6,0.3,-1],
 fn:t=>{const u=up(t),leg=sg=>({rel:[sg*0.085,-0.18,-0.12],pf:30,kneeUp:[0,-1,1]});
  return {pitch:70+5*u,waist:20+5*u,py:0.51+0.015*u,pw:0.01,pz:-0.36-0.07*u,pzw:3,shift:0.02,elbow:168+10*u,legs:{left:leg(1),right:leg(-1)}};},
 tags:{up},highlight:{groups:['deltoids','serratus'],side:'both',pulseTrack:'up',pulseBase:0.25},
 camera:{dir:[1,0.18,0.2],fit:['head','leftPalm','rightPalm','leftToe','rightToe','pelvis','leftKnee','rightKnee'],pad:0.28,k:1,drift:0,at:4},
 keyFrames:[0.3,1.2,4],qa:qaStd({straightLegs:[],more:{hipFlexMax:150}}),
});
