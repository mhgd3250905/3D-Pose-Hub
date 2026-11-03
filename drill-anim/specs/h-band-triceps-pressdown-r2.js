// h-band-triceps-pressdown r2 (2026-10-31): standalone copy of the source spec with three fixes.
// 1) Grip: the source palm normal [-1,0,0] points lateral on the right hand, which turns the thumb web (hu kou) DOWN, a
//    reversed grip. Neutral pressdown grip faces the palm medial (+x) so the thumb web points UP at the start and forward at
//    lockout: normal [1,0,0]. 2) Legs: pelvis y 0.887 bent knees to ~133 deg on the v3 body; legs now reach 172 deg with py
//    solved (as h-band-shoulder-ir r2). 3) Frozen-fist D-handle (recipe fixedDHandle), lean 1 -> 0, loop on the knuckle face of the fist (toward '@fingers': the
//    fingers pass through the D, so the loop sits in front of the knuckles and the band leaves its apex for the high post).
// Single-arm band pressdown: upper arm fixed near torso, elbow extends against a high anchor.
// No shoulder swing or trunk lean. Use light resistance and secure overhead rated anchor; stop for pain.
// Distinct from triceps-A/B/C and chair dips: open-chain isolated elbow extension, not bodyweight support.
import {build,keys,armWrist,armDir,r4,DEG} from '../lib/home-anim.mjs';
const DUR=8,p=keys([[0,0],[0.5,0],[2,1],[3,1],[5,1],[6,1],[7.5,0]],DUR);
const a=t=>(70*p(t))*DEG;
const SH=[-0.188,1.37,-0.004],EL=[-0.27,1.13,.04],FA=.22805;
const POLE=EL.map((x,i)=>2*x-SH[i]);
const P=build(DUR,{
 pelvis:[0,0.887,0.025],
 hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]},
 chest:{waist:[[[1,0,0],0]]},
 hands:{right:{mode:'free',frame:'chest',relax:0,wrist:t=>[EL[0],EL[1]-FA*Math.sin(a(t)),EL[2]+FA*Math.cos(a(t))],finger:t=>[0,-Math.sin(a(t)),Math.cos(a(t))],normal:t=>[1,0,0],poleUp:POLE},
 left:{mode:'free',frame:'chest',wrist:r4(armWrist('left',6,12,0.475)),finger:r4(armDir('left',6,12)),normal:[-1,0,0],poleUp:[0.45,1.0,-0.2]}},
 feet:{left:{mode:'floor',at:[0.13,0],heading:5,pitch:0,pole:[0.13,0.6,1]},right:{mode:'floor',at:[-0.13,0],heading:-5,pitch:0,pole:[-0.13,0.6,1]}},
 constraints:[{type:'reach',limb:'leftLeg',angle:172,weight:1},{type:'reach',limb:'rightLeg',angle:172,weight:1}],solve:{vars:['py'],reg:{py:0.2}}
},{effort:t=>Math.abs(p(t))});
export default{
 id:'h-band-triceps-pressdown-r2',revisionOf:'h-band-triceps-pressdown',name:'站姿单臂弹力带下压',nameEn:'Standing Single-arm Band Triceps Pressdown',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['triceps'],side:'right',pulseTrack:'effort',pulseBase:0.3},
 camera:{dir:[-1,0.3,-0.4],fit:['head','leftToe','rightToe','pelvis','leftPalm','rightPalm','rightElbow'],pad:0.22,k:0.8,drift:0,at:2,fitTimeline:true},
 frame:{mode:'fit',width:720,height:720,cx:590,cy:485},stillAt:2,
 props:[{type:'bandPost',at:[-.5,0,.65],height:2.05,tieY:1.95},{type:'anchor',name:'post',at:[-.5,1.95,.61]},{type:'dHandle',side:'right',name:'hR',toward:'@fingers',lean:0,len:.16},{type:'band',from:[-.5,1.95,.61],to:'hR',r:.005,sag:0,colour:'#7a4a32'}],keyFrames:[0,2,3,5,6,7.5],
 qa:{pins:[{c:'footL',when:'always'},{c:'footR',when:'always'}],straight:[],allowContact:[]}
};
