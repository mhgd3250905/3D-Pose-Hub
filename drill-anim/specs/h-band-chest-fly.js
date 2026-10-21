// Standing single-arm band chest fly: shoulder horizontal adduction with a fixed soft elbow.
// Light band anchored securely at chest height behind and outside working shoulder. Do not open arm behind torso.
// Distinct from chest-C press (elbow extension) and reverse fly (horizontal abduction).
import {build,keys,armWrist,armDir,r4,DEG} from '../lib/home-anim.mjs';
const DUR=8,p=keys([[0,0],[0.5,0],[2,1],[3,1],[5,1],[6,1],[7.5,0]],DUR);
const SH=[-.188,1.37,-.004],UA=.25678,FA=.22805;
const dir=a=>[-Math.sin(a*DEG)*Math.cos(10*DEG),-Math.sin(10*DEG),Math.cos(a*DEG)*Math.cos(10*DEG)];
const elbow=t=>SH.map((x,i)=>x+UA*dir(70-65*p(t))[i]);
const fore=t=>dir(45-65*p(t));
const P=build(DUR,{
 pelvis:[0,.887,.025],hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]},chest:{waist:[[[1,0,0],0]]},
 hands:{right:{mode:'free',frame:'chest',relax:0,wrist:t=>elbow(t).map((x,i)=>x+FA*fore(t)[i]),finger:fore,normal:t=>[Math.cos((45-65*p(t))*DEG),0,Math.sin((45-65*p(t))*DEG)],poleUp:t=>elbow(t).map((x,i)=>2*x-SH[i])},
 left:{mode:'free',frame:'chest',wrist:r4(armWrist('left',6,12,.475)),finger:r4(armDir('left',6,12)),normal:[-1,0,0],poleUp:[.45,1,-.2]}},
 feet:{left:{mode:'floor',at:[.15,.05],heading:5,pitch:0,pole:[.15,.6,1]},right:{mode:'floor',at:[-.15,-.05],heading:-5,pitch:0,pole:[-.15,.6,1]}},constraints:[],solve:{vars:[],reg:{}}
},{effort:p});
export default {id:'h-band-chest-fly',name:'站姿单臂弹力带夹胸',nameEn:'Standing Single-arm Band Chest Fly',modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},highlight:{groups:['chest'],side:'right',pulseTrack:'effort',pulseBase:.3},
 camera:{dir:[-1,.3,1.4],fit:['head','leftToe','rightToe','pelvis','leftPalm','rightPalm','rightElbow'],pad:.22,k:.8,drift:0,at:2,fitTimeline:true},frame:{mode:'fit',width:720,height:720,cx:590,cy:485},stillAt:2,
 props:[{type:'bandPost',at:[-1,0,-.65],height:1.5,tieY:1.25},{type:'anchor',name:'post',at:[-1,1.25,-.61]},{type:'dHandle',side:'right',name:'hR',toward:'post',lean:1,len:.16},{type:'band',from:[-1,1.25,-.61],to:'hR',r:.005,sag:0,colour:'#7a4a32'}],keyFrames:[0,2,3,5,6,7.5],qa:{pins:[{c:'footL',when:'always'},{c:'footR',when:'always'}],straight:[],allowContact:[]}};
