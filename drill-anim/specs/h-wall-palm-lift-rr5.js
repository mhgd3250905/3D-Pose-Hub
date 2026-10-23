// R4 independent finger-contact profile; original067 objective and four-region 4mm criterion retained.
import {build,keys,armWrist,armDir,r4} from '../lib/home-anim.mjs';
const DUR=8,p=keys([[0,0],[0.5,0],[2.2,1],[5.2,1],[7.3,0]],DUR);
const a=t=>(12+20*p(t))*Math.PI/180,roll=6*Math.PI/180;
const poly=(v,u)=>v.reduceRight((s,c)=>s*u+c,0);
const Z=[.048822668100832065,.05319402253298807,.004730624877826872,-.019515544946609648,.031102940345581045,-.026605396126569553,.00880221272163401];
const DY=[1.542366847085075e-12,-.010322532311005111,-.007979592656474846,.000139368794162171,.00007317208291495386,-.0000008960323443634609,-.00000028400707145062706];
const z=t=>.4595-poly(Z,p(t));
const P=build(DUR,{
 pelvis:t=>[0,0.887,-0.01-0.025*p(t)],
 hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]},
 chest:{waist:[[[1,0,0],0]]},
 hands:{right:{mode:'free',frame:'world',relax:0,wrist:t=>[-.23,1.5380189785384235-poly(DY,p(t)),z(t)],finger:t=>[0,Math.cos(a(t)),Math.sin(a(t))],normal:t=>[Math.sin(roll),-Math.sin(a(t))*Math.cos(roll),Math.cos(a(t))*Math.cos(roll)],fingerContact:{family:"wall-distal-contact-mcp",index:p,middle:p,ring:p,pinky:p},poleUp:[-0.45,1.1,-0.1]},
 left:{mode:'free',frame:'chest',wrist:r4(armWrist('left',6,12,0.475)),finger:r4(armDir('left',6,12)),normal:[-1,0,0],poleUp:[0.45,1.0,-0.2]}},
 feet:{left:{mode:'floor',at:[0.13,0],heading:5,pitch:0,pole:[0.13,0.6,1]},right:{mode:'floor',at:[-0.13,0],heading:-5,pitch:0,pole:[-0.13,0.6,1]}},
 constraints:[],solve:{vars:[],reg:{}}
},{stretch:p});
export default{
 id:'h-wall-palm-lift-rr5',name:'墙面指端接触掌根抬起诊断',nameEn:'Wall Palm-Heel Lift Diagnostic',
 modelProfile:'training-human-v2plus-contact-wrist',wristSkinning:{version:'1.0.0-r5.1'},contact:{version:'1.0.0-r4.1'},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic',handPose:{left:'open',right:'open'}},alignClavicles:false,fps:30,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['forearms'],side:'right',pulseTrack:'stretch',pulseBase:0.3},
 camera:{dir:[-1,0.12,-.35],fit:['head','leftToe','rightToe','pelvis','leftPalm','rightPalm','rightElbow'],pad:0.17,k:0.9,drift:0,at:3.5,fitTimeline:true},
 frame:{mode:'fit',width:800,height:820,cx:512,cy:510},stillAt:3.5,
 props:[{type:'wall',at:[0,0,0.46],yaw:180,size:[1.2,2.1,0.12]}],
 keyFrames:[0,2.2,5.2,6.3],
 qa:{pins:[{c:'footL',when:'always'},{c:'footR',when:'always'},{c:'handR',when:'always'}],allowContact:[]}
};
