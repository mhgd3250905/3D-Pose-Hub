// Home low-anchor elastic resistance hip extension; not an ordinary office exercise.
// Light band, structurally fixed anchor in front, chair is balance support only, never an anchor.
// Start with 1 easy set of 6 reps. Keep trunk still, no back arch or forceful end range; stop for pain.
// Front +Z, left +X. Left palm rests on a stable non-wheeled chair, left foot planted.
// Two slow repetitions / 8 seconds, neutral pelvis and trunk. Single-side demo; reset equipment for other side.
// Shin-bound fitted ankle cuff (not a foot-bound band). Elastic tube length increases as the leg moves backwards; schematic, no force calibration.
import {build,keys,r4,armWrist,armDir} from '../lib/home-anim.mjs';
import {leg,restPtW} from '../lib/ss-geo.mjs';
const DUR=8,PEL=[0,0.8936,0.0102],hips={up:[0,1,0],front:[0,0,1]};
const Q=keys([[0,0],[0.4,0],[1.6,1],[2.4,1],[3.6,0],[4.4,0],[5.6,1],[6.4,1],[7.6,0]],DUR);
const L=t=>leg('right',-8-12*Q(t),12);
const P=build(DUR,{
 pelvis:PEL,hips,chest:{waist:[[[1,0,0],0]]},
 hands:{left:{mode:'free',frame:'world',palmAt:[0.35,0.9879,0.006],finger:[0,0,1],normal:[0,-1,0],pole:[0.7,1.05,-0.15]},
 right:{mode:'free',frame:'chest',wrist:r4(armWrist('right',10,20,0.47)),finger:r4(armDir('right',10,20)),normal:[1,0,0],poleUp:[-0.6,1.1,-0.2],relax:1}},
 feet:{left:{mode:'floor',at:[0.085,0],heading:0,pitch:0},
 right:{mode:'free',frame:'world',ankle:t=>restPtW(hips,PEL,L(t).ankle),pole:t=>restPtW(hips,PEL,L(t).knee),rot:[[[1,0,0],0]]}},
 constraints:[],solve:{vars:[],reg:{}}
},{work:Q});
export default {
 id:'h-band-hip-extension',name:'扶椅弹力带髋后伸',nameEn:'Standing Band Hip Extension',modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['glute-max'],side:'right',pulseTrack:'work',pulseBase:0.3},
 camera:{dir:[-1,0.15,-0.5],fit:['head','leftToe','rightToe','pelvis','leftPalm','rightPalm'],pad:0.2,k:0.9,drift:0,at:2,fitTimeline:true},
 frame:{mode:'fit',width:760,height:760,cx:512,cy:510},stillAt:2,
 props:[{type:'chair',at:[0.40,0,0.183],yaw:0,height:0.45,width:0.44,depth:0.42,back:0.58},
 {type:'bandPost',at:[-0.13,0,0.95],height:0.55,tieY:0.16,colour:'#b66b38'},
 {type:'anchor',name:'pulley',at:[-0.13,0.16,0.91]},
 {type:'ankleStrap',side:'right',name:'strap',toward:'pulley',up:0.09,width:0.045,gap:0},
 {type:'band',from:'pulley',to:'strap',r:0.007,sag:0,colour:'#b66b38'}],
 keyFrames:[0,1.6,2.4,3,4,5.6,6.4,7],
 qa:{pins:[{c:'footL',when:'always'},{c:'handL',when:'always'}],allowContact:[]}
};
