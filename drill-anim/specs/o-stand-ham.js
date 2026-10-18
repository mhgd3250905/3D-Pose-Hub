// Chair-supported RIGHT hamstring stretch. Front +Z, body left +X.
// RIGHT heel remains on the floor with toes lifted, LEFT supporting knee soft.
// LEFT palm stays on a stable chair rail; no foot on a chair and no floor sitting.
// A small hip hinge enters the stretch; neutral lumbar spine, no knee hyperextension.
import {build,keys,r4,armWrist,armDir} from '../lib/home-anim.mjs';
const DUR=8;
const p=keys([[0,0],[0.5,0],[2.2,1],[5.2,1],[7.3,0]],DUR);
const lean=t=>12+13*p(t);
const P=build(DUR,{
 pelvis:t=>[0,0.818-0.009*p(t),-0.03],hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],lean]]},
 chest:{waist:[[[1,0,0],0]]},
 hands:{left:{mode:'free',frame:'world',palmAt:[0.41,0.838,0.133],finger:[0,0,1],normal:[0,-1,0],pole:[0.65,0.95,-0.1]},
 right:{mode:'free',frame:'chest',wrist:t=>r4(armWrist('right',lean(t)+10,16,0.46)),finger:t=>r4(armDir('right',lean(t)+10,16)),normal:[1,0,0],poleUp:[-0.6,1.1,-0.2]}},
 feet:{left:{mode:'floor',at:[0.13,-0.1],heading:0,pitch:0,pole:[0.13,0.6,1]},
 right:{mode:'floor',at:[-0.13,0.29],heading:0,pitch:-25,pole:[-0.13,0.8,1]}},
 constraints:[],solve:{vars:[],reg:{}}
},{stretch:p});
export default{
 id:'o-stand-ham',name:'扶椅站姿单腿腘绳肌拉伸',nameEn:'Chair-Supported Standing Hamstring Stretch',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['hamstrings'],side:'right',pulseTrack:'stretch',pulseBase:0.3},
 camera:{dir:[-1,0.18,0.35],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.18,k:1,drift:0,at:3.5,fitTimeline:true},
 frame:{mode:'fit',width:720,height:820,cx:512,cy:520},stillAt:3.5,
 props:[{type:'chair',at:[0.46,0,0.31],yaw:0,height:0.45,width:0.44,depth:0.42}],
 keyFrames:[0,2.2,5.2,6.3],
 qa:{pins:[{c:'footL',when:'always'},{c:'footR',when:'always'},{c:'handL',when:'always'}],straight:[{j:'knee.right',min:165}],allowContact:[]}
};
