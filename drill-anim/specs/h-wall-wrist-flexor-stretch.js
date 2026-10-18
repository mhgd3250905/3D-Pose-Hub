// Standing RIGHT wrist-extension stretch. Front +Z, body left +X, head +Y.
// Palm flat on stable wall, fingers UP; feet planted. Slowly ease trunk back,
// extending the elbow without locking it; gentle wrist/front-forearm stretch only.
// No forceful pressing, no body-weight support on the wrist, no nerve-glide claim.
// 8 s is a demonstration loop, not an individual therapeutic prescription.
// Distinct from forearms-A (kneeling multi-direction wrist rocks) and forearms-B (loaded wrist curls).
import {build,keys,armWrist,armDir,r4} from '../lib/home-anim.mjs';
const DUR=8,p=keys([[0,0],[0.5,0],[2.2,1],[5.2,1],[7.3,0]],DUR);
const P=build(DUR,{
 pelvis:t=>[0,0.887,0.04-0.025*p(t)],
 hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]},
 chest:{waist:[[[1,0,0],0]]},
 hands:{right:{mode:'free',frame:'world',wrist:[-0.23,1.59,0.420],finger:[0,1,0],normal:[0,0,1],poleUp:[-0.45,1.1,-0.1]},
 left:{mode:'free',frame:'chest',wrist:r4(armWrist('left',6,12,0.475)),finger:r4(armDir('left',6,12)),normal:[-1,0,0],poleUp:[0.45,1.0,-0.2]}},
 feet:{left:{mode:'floor',at:[0.13,0],heading:5,pitch:0,pole:[0.13,0.6,1]},right:{mode:'floor',at:[-0.13,0],heading:-5,pitch:0,pole:[-0.13,0.6,1]}},
 constraints:[],solve:{vars:[],reg:{}}
},{stretch:p});
export default{
 id:'h-wall-wrist-flexor-stretch',name:'站姿扶墙腕屈肌拉伸',nameEn:'Standing Wall Wrist Flexor Stretch',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['forearms'],side:'right',pulseTrack:'stretch',pulseBase:0.3},
 camera:{dir:[-1,0.12,0.32],fit:['head','leftToe','rightToe','pelvis','leftPalm','rightPalm','rightElbow'],pad:0.17,k:0.9,drift:0,at:3.5,fitTimeline:true},
 frame:{mode:'fit',width:800,height:820,cx:512,cy:510},stillAt:3.5,
 props:[{type:'wall',at:[0,0,0.46],yaw:180,size:[1.2,2.1,0.12]}],
 keyFrames:[0,2.2,5.2,6.3],
 qa:{pins:[{c:'footL',when:'always'},{c:'footR',when:'always'},{c:'handR',when:'always'}],allowContact:[]}
};
