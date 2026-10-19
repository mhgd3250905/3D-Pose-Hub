// Single goal: unloaded wrist side-to-side deviation, fixed pronated forearm.
// Palm stays down; no axial forearm rotation and no forced stretch.
import {build,keys,armWrist,armDir,r4,DEG} from '../lib/home-anim.mjs';
const DUR=8,p=keys([[0,0],[0.5,0],[2,1],[3,1],[5,-1],[6,-1],[7.5,0]],DUR);
const a=t=>12*DEG*p(t);
const SH=[-0.188,1.37,-0.004],EL=[-0.238,1.11815,0],FA=.22805;
const POLE=EL.map((x,i)=>2*x-SH[i]);
const P=build(DUR,{
 pelvis:[0,0.887,0.025],
 hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]},
 chest:{waist:[[[1,0,0],0]]},
 hands:{right:{mode:'free',frame:'chest',wrist:[EL[0],EL[1],FA],finger:t=>[Math.sin(a(t)),0,Math.cos(a(t))],normal:[0,-1,0],elbowTwist:0,poleUp:POLE},
 left:{mode:'free',frame:'chest',wrist:r4(armWrist('left',6,12,0.475)),finger:r4(armDir('left',6,12)),normal:[-1,0,0],poleUp:[0.45,1.0,-0.2]}},
 feet:{left:{mode:'floor',at:[0.13,0],heading:5,pitch:0,pole:[0.13,0.6,1]},right:{mode:'floor',at:[-0.13,0],heading:-5,pitch:0,pole:[-0.13,0.6,1]}},
 constraints:[],solve:{vars:[],reg:{}}
},{effort:t=>Math.abs(p(t))});
export default{
 id:'h-standing-wrist-deviation',name:'站姿屈肘腕侧偏控制',nameEn:'Standing Wrist Radial and Ulnar Deviation',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['forearms'],side:'right',pulseTrack:'effort',pulseBase:0.3},
 camera:{dir:[-0.6,0.65,1],fit:['head','leftToe','rightToe','pelvis','leftPalm','rightPalm','rightElbow'],pad:0.17,k:0.9,drift:0,at:2,fitTimeline:true},
 frame:{mode:'fit',width:800,height:820,cx:512,cy:510},stillAt:2,
 props:[],keyFrames:[0,2,3,5,6,7.5],
 qa:{pins:[{c:'footL',when:'always'},{c:'footR',when:'always'}],straight:[],allowContact:[]}
};
