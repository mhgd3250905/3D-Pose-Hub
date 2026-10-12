import { floorDrill,curve,qaStd,dirW,reach } from './_thomas.mjs';
// R05/R01: high knees, retract the heels. The old tuck left the feet 0.605m forward.
const T=8,up=()=>1;
const ext=curve([[0,0],[1.5,0],[2.5,1],[3,1],[4,0],[4.5,0],[5.5,1],[6,1],[7,0]],T);
const mix=(a,b,u)=>a.map((x,i)=>x+(b[i]-x)*u);
const tuck=[0.05,0.02,0.36],lsit=dirW(1,5,2).map(x=>x*reach(178));
export default floorDrill({
 id:'t-lsit-tuck',name:'L 撑↔团身',nameEn:'L-Sit to Tuck',T,
 hands:{left:[0.26,-0.045],right:[-0.26,-0.045]},
 fn:t=>{const u=up(t),e=ext(t),leg=sg=>{const r=mix(tuck,lsit,e);r[0]*=sg;return {rel:r,pf:8+16*e,kneeUp:[sg*0.16,1,0.15]};};
  return {pitch:-14+4*e,waist:20-4*e,py:0.14+0.022*u,pw:0.01,pz:0,pzw:3,shift:0.09+0.025*u,elbow:165+13*u,legs:{left:leg(1),right:leg(-1)}};},
 tags:{up,ext},highlight:{groups:['abs'],panels:['quadRect'],side:'both',pulseTrack:'ext',pulseBase:0.25},
 camera:{dir:[0.9,0.18,0.5],fit:['head','leftPalm','rightPalm','leftToe','rightToe','pelvis','leftKnee','rightKnee'],pad:0.2,k:1,drift:0,at:2.8},
 keyFrames:[1.5,2.8,4.2],qa:qaStd({straightLegs:[{j:'knee.right',min:176,when:'params.ext>0.999'},{j:'knee.left',min:176,when:'params.ext>0.999'}],more:{hipFlexMax:155}}),
});
