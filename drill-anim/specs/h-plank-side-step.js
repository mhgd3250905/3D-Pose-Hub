// Fixed-palm high plank, one foot at a time steps laterally and returns. No jumping.
// Single teaching goal: keep pelvis facing floor while the support base changes laterally.
// Swing knee may bend naturally; this is not pure straight-leg hip abduction.
// Mat under palms only. Rigid shoe contact is a narrow toe patch, not anatomical toe deformation.
// Use only within comfortable wrist/shoulder tolerance; this is not an individual rehabilitation prescription.
import {build,keys} from '../lib/home-anim.mjs';
const DUR=8;
const phase=keys([[0,0],[.4,0],[1.4,1],[1.9,1],[3,0],[4,0]],4);
const local=t=>((t%8)+8)%8;
const r=t=>local(t)<4?phase(local(t)):0,l=t=>local(t)>=4?phase(local(t)-4):0;
const sm=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
const u=p=>t=>sm((p(t)-.15)/.70),ur=u(r),ul=u(l);
const H=z=>({mode:'floor',at:[0,z],finger:[-1,0],poleUp:[0,.9,.05]});
const F=(s,u)=>({mode:'floor',at:t=>[1.21-.08*u(t),s*(.16+.14*u(t))],heading:-90,pitch:42,lift:t=>.045*Math.sin(Math.PI*u(t)),floor:0,pole:[-.3,.05,s*.1]});
const P=build(DUR,{pelvis:t=>[.42,.40,0],hips:{up:[-1,0,0],front:[0,-1,0],rot:[[[0,0,1],-17]]},hands:{left:H(.22),right:H(-.22)},feet:{left:F(1,ul),right:F(-1,ur)},constraints:[{type:'reach',limb:'rightArm',angle:174},{type:'reach',limb:'leftArm',angle:174},{type:'reach',limb:'rightLeg',angle:174,weight:t=>Math.max(0,1-6*r(t))},{type:'reach',limb:'leftLeg',angle:174,weight:t=>Math.max(0,1-6*l(t))}],solve:{vars:['px','py','h0'],reg:{px:.1,py:.1,h0:.01},iters:80}},{ur,ul,step:t=>Math.max(r(t),l(t))});
export default{id:'h-plank-side-step',name:'直臂俯撑交替侧点地',nameEn:'High Plank Alternating Side Toe Tap',modelProfile:'training-human-v2',alignClavicles:false,fps:15,timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},highlight:{groups:['abs','obliques','hip-abductors'],side:'both',pulseTrack:'step',pulseBase:.3},camera:{dir:[-.35,.65,1],fit:['head','leftPalm','rightPalm','leftToe','rightToe','pelvis','leftElbow','rightElbow'],pad:.15,k:.8,drift:0,at:1.6},frame:{mode:'fit',width:840,height:800,cx:512,cy:520},stillAt:1.6,props:[{type:'mat',at:[-.1,0,0],size:[.6,.7,.006]}],keyFrames:[0,.9,1.6,2.5,4.9,5.6],qa:{pins:[{c:'handR',when:'always'},{c:'handL',when:'always'}],straight:[{j:'elbow.right',min:170},{j:'elbow.left',min:170}],allowContact:[]}};
