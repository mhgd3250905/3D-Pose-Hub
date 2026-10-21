// Shoulder internal rotation against lateral band anchor; elbow held near side at ~90 degrees.
// No forearm pronation track; hand and forearm sweep about upper arm. Light resistance, pain-free range.
// Different resistance direction and target from existing external rotation rotator-cuff-B.
import {build,keys,armWrist,armDir,r4,DEG} from '../lib/home-anim.mjs';
const DUR=8,p=keys([[0,0],[0.5,0],[2,1],[3,1],[5,1],[6,1],[7.5,0]],DUR);
const a=t=>(15-50*p(t))*DEG;
const SH=[-0.188,1.37,-0.004],EL=[-0.238,1.11815,0],FA=.22805;
const POLE=EL.map((x,i)=>2*x-SH[i]);
const P=build(DUR,{
 pelvis:[0,0.887,0.025],
 hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]},
 chest:{waist:[[[1,0,0],0]]},
 hands:{right:{mode:'free',frame:'chest',relax:0,wrist:t=>[EL[0]-FA*Math.sin(a(t)),EL[1],FA*Math.cos(a(t))],finger:t=>[-Math.sin(a(t)),0,Math.cos(a(t))],normal:t=>[Math.cos(a(t)),0,Math.sin(a(t))],poleUp:POLE},
 left:{mode:'free',frame:'chest',wrist:r4(armWrist('left',6,12,0.475)),finger:r4(armDir('left',6,12)),normal:[-1,0,0],poleUp:[0.45,1.0,-0.2]}},
 feet:{left:{mode:'floor',at:[0.13,0],heading:5,pitch:0,pole:[0.13,0.6,1]},right:{mode:'floor',at:[-0.13,0],heading:-5,pitch:0,pole:[-0.13,0.6,1]}},
 constraints:[],solve:{vars:[],reg:{}}
},{effort:t=>Math.abs(p(t))});
export default{
 id:'h-band-shoulder-ir',name:'弹力带站姿肩内旋',nameEn:'Standing Banded Shoulder Internal Rotation',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['rotator-cuff','chest'],side:'right',pulseTrack:'effort',pulseBase:0.3},
 camera:{dir:[-0.75,0.3,1],fit:['head','leftToe','rightToe','pelvis','leftPalm','rightPalm','rightElbow'],pad:0.17,k:0.9,drift:0,at:2,fitTimeline:true},
 frame:{mode:'fit',width:720,height:720,cx:590,cy:485},stillAt:2,
 props:[{type:'bandPost',at:[-.9,0,.32],height:1.3,tieY:1.13},{type:'anchor',name:'post',at:[-.86,1.13,.32]},{type:'dHandle',side:'right',name:'hR',toward:'post',lean:1,len:.16},{type:'band',from:[-.86,1.13,.32],to:'hR',r:.005,sag:0,colour:'#7a4a32'}],keyFrames:[0,2,3,5,6,7.5],
 qa:{pins:[{c:'footL',when:'always'},{c:'footR',when:'always'}],straight:[],allowContact:[]}
};
