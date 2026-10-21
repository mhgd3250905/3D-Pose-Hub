// Standing RIGHT wrist-extensor stretch, unloaded active version. Front +Z, left +X.
// Hold arm forward, palm down; gently drop hand at the wrist, then release.
// No opposite-hand pressure, no wall or floor weight bearing; elbow stays softly straight.
// Single goal: wrist flexion to lengthen the dorsal forearm. Not wrist-strength training.
// Eight-second demonstration loop, not a personalized treatment prescription.
import {build,keys,armWrist,armDir,r4,DEG} from '../lib/home-anim.mjs';
const DUR=8,p=keys([[0,0],[0.5,0],[2.2,1],[5.2,1],[7.3,0]],DUR);
const a=t=>40*DEG*p(t);
const P=build(DUR,{
 pelvis:[0,0.887,0.025],
 hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]},
 chest:{waist:[[[1,0,0],0]]},
 hands:{right:{mode:'free',frame:'chest',wrist:r4(armWrist('right',90,0,0.483)),finger:t=>[0,-Math.sin(a(t)),Math.cos(a(t))],normal:t=>[0,-Math.cos(a(t)),-Math.sin(a(t))],poleUp:[-0.4,-0.2,0.2]},
 left:{mode:'free',frame:'chest',wrist:r4(armWrist('left',6,12,0.475)),finger:r4(armDir('left',6,12)),normal:[-1,0,0],poleUp:[0.45,1.0,-0.2]}},
 feet:{left:{mode:'floor',at:[0.13,0],heading:5,pitch:0,pole:[0.13,0.6,1]},right:{mode:'floor',at:[-0.13,0],heading:-5,pitch:0,pole:[-0.13,0.6,1]}},
 constraints:[],solve:{vars:[],reg:{}}
},{stretch:p});
export default{
 id:'h-standing-wrist-extensor-stretch',name:'站姿主动腕伸肌拉伸',nameEn:'Standing Active Wrist Extensor Stretch',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['forearms'],side:'right',pulseTrack:'stretch',pulseBase:0.3},
 camera:{dir:[-1,0.12,0.4],fit:['head','leftToe','rightToe','pelvis','leftPalm','rightPalm','rightElbow'],pad:0.17,k:0.9,drift:0,at:3.5,fitTimeline:true},
 frame:{mode:'fit',width:800,height:820,cx:512,cy:510},stillAt:3.5,
 props:[],keyFrames:[0,2.2,5.2,6.3],
 qa:{pins:[{c:'footL',when:'always'},{c:'footR',when:'always'}],straight:[{j:'elbow.right',min:165}],allowContact:[]}
};
