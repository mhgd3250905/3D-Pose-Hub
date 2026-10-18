// Standing wall-supported lat/side-back stretch. Front +Z, body left +X.
// Both palms on a stable wall at chest height, feet fixed, knees soft. Gently hinge
// 45 to 63 degrees, hips back and chest between arms; neutral waist, no forced arch.
// Wall support at 1.22 m differs from h-chair-lat's 0.87 m backrest: less trunk hinge,
// higher overhead arm line and no mobile chair. Same stretch family, real support variant.
// This is not a hamstring stretch or an isolated thoracic-extension exercise.
import {REST,restPtW} from '../lib/ss-geo.mjs';
import {build,keys,r4,sg} from '../lib/home-anim.mjs';
const DUR=8,REACH=0.482,HX=0.205,WY=1.22,WZ=0.472;
const p=keys([[0,0],[0.5,0],[2.2,1],[5.2,1],[7.3,0]],DUR);
const lean=t=>45+18*p(t);
const hipsAt=a=>({up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],a]]});
const pel=t=>{const y=0.84-0.008*p(t),s=restPtW(hipsAt(lean(t)),[0,y,0],REST.shoulder('left'));
 const dz=Math.sqrt(REACH*REACH-(HX-s[0])**2-(WY-s[1])**2);return r4([0,y,WZ-dz-s[2]]);};
const hand=s=>({mode:'free',frame:'world',wrist:[sg(s)*HX,WY,WZ],finger:[0,1,0],normal:[0,0,1],poleUp:[sg(s)*0.4,1.6,0.4],relax:0});
const P=build(DUR,{
 pelvis:pel,hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],lean]]},chest:{waist:[[[1,0,0],0]]},
 hands:{left:hand('left'),right:hand('right')},
 feet:{left:{mode:'floor',at:[0.13,-0.30],heading:3,pitch:0,pole:[0.15,0.5,0.6]},right:{mode:'floor',at:[-0.13,-0.30],heading:-3,pitch:0,pole:[-0.15,0.5,0.6]}},
 constraints:[],solve:{vars:[],reg:{}}
},{stretch:p});
export default{
 id:'o-wall-hip-hinge-stretch',name:'扶墙髋后移躯干延展',nameEn:'Standing Wall-Supported Lat Stretch',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['lats'],side:'both',pulseTrack:'stretch',pulseBase:0.3},
 camera:{dir:[-1,0.18,0.18],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.18,k:1,drift:0,at:3.5,fitTimeline:true},
 frame:{mode:'fit',width:820,height:820,cx:512,cy:520},stillAt:3.5,
 props:[{type:'wall',at:[0,0,0.5],yaw:180,size:[1.3,2.2,0.12]}],
 keyFrames:[0,2.2,5.2,6.3],
 qa:{pins:[{c:'footL',when:'always'},{c:'footR',when:'always'},{c:'handL',when:'always'},{c:'handR',when:'always'}],straight:[{j:'elbow.left',min:166},{j:'elbow.right',min:166}],allowContact:[]}
};
