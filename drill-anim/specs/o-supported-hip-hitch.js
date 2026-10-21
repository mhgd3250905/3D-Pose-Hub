// 扶椅单腿骨盆提拉：左腿承重，右侧骨盆缓慢提起6度后回水平。
// 单一目标：额状面骨盆控制；不侧弯胸廓，不屈伸支撑膝代替提髋，不旋转开胯。
// 稳固无轮椅仅作轻扶平衡。右膝固定屈曲60度离地，非髋屈高抬腿。办公可用。
// 先每侧1组4次，舒适小幅度，不追求抬高；腰髋膝疼痛或不稳即停。
import {build,keys,r4,armWrist,armDir} from '../lib/home-anim.mjs';
import {leg,restPtW,rotAbout} from '../lib/ss-geo.mjs';
const DUR=8, P0=[.065,.89,0], neutral={up:[0,1,0],front:[0,0,1],rot:[]};
const p=keys([[0,0],[.5,0],[2,1],[3.5,1],[6.5,0],[7.7,0]],DUR), a=t=>-6*p(t);
const L=leg('left',3,6), R=leg('right',3,60), H=restPtW(neutral,P0,L.hip);
const hips={up:[0,1,0],front:[0,0,1],rot:[[[0,0,1],a]]};
const P=build(DUR,{
 pelvis:t=>rotAbout(P0,H,[0,0,1],a(t)),hips,
 chest:{waist:[[[0,0,1],t=>-a(t)]]},
 hands:{left:{mode:'free',frame:'world',palmAt:[.43,.9879,.006],finger:[0,0,1],normal:[0,-1,0],pole:[.7,1.05,-.15]},right:{mode:'free',frame:'chest',wrist:r4(armWrist('right',10,20,.47)),finger:r4(armDir('right',10,20)),normal:[1,0,0],poleUp:[-.6,1.1,-.2],relax:1}},
 feet:{left:{mode:'free',frame:'world',ankle:[.0815,.0842,-.0075],rot:[],pole:[.112,.492,.013]},right:{mode:'free',frame:'hips',ankle:R.ankle,rot:[[[1,0,0],57],[[0,0,1],a]],poleLow:R.knee}},
 constraints:[],solve:{vars:[],reg:{}}
},{hike:p});
export default {id:'o-supported-hip-hitch',name:'扶椅单腿骨盆提拉',nameEn:'Chair-Supported Hip Hitch',modelProfile:'training-human-v2',alignClavicles:false,fps:15,timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},highlight:{groups:['hip-abductors'],side:'left',pulseTrack:'hike',pulseBase:.3},camera:{dir:[.75,.2,-.65],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:.18,k:1,drift:0,at:2,fitTimeline:true},frame:{mode:'fit',width:780,height:820,cx:512,cy:520},stillAt:2,props:[{type:'chair',at:[.48,0,.183],yaw:0,height:.45,width:.44,depth:.42,back:.58}],keyFrames:[0,2,4,6.5],qa:{pins:[{c:'handL',when:'always'},{c:'footL',when:'always'}],straight:[{j:'knee.left',min:170}],allowContact:[]}};
