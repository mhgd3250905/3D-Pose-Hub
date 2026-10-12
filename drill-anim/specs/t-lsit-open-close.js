import { floorDrill,curve,qaStd } from './_thomas.mjs';
// R11: broad opening while the chest stays compact over the fixed hand support.
const T=8,up=()=>1;
const open=curve([[0,0],[1.5,0],[2.5,1],[3,1],[4,0],[4.5,0],[5.5,1],[6,1],[7,0]],T);
export default floorDrill({
 id:'t-lsit-open-close',name:'L 撑开合腿',nameEn:'L-Sit Open & Close',T,
 hands:{left:[0.26,-0.11,[0.9,0.3]],right:[-0.26,-0.11,[-0.9,0.3]]},
 fn:t=>{const u=up(t),o=open(t),l={elev:-1+6*u,spread:2+66*o,pf:3+18*u,knee:178};
  return {pitch:-7-3*u,waist:16,py:0.138+0.025*u,pw:0.01,pz:0,pzw:3,shift:0.09+0.025*u,elbow:165+13*u,legs:{left:l,right:l}};},
 tags:{up,open},highlight:{groups:['abs','adductors'],panels:['quadRect'],side:'both',pulseTrack:'open',pulseBase:0.25},
 camera:{dir:[0.2,0.2,1],fit:['head','leftPalm','rightPalm','leftToe','rightToe','pelvis','leftKnee','rightKnee'],pad:0.2,k:1,drift:0,at:2.7},
 keyFrames:[1.5,2.7,4.2],qa:qaStd(),
});
