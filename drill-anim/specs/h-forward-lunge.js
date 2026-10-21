// 076: forward-foot landing/load/return, not reversed reverse-lunge playback.
import {build,keys,sg,r4} from '../lib/home-anim.mjs';
const DUR=10, local=t=>((t%DUR)+DUR)%DUR, phase=t=>local(t)%5, side=t=>local(t)<5?'right':'left';
const U=keys([[0,0],[.7,0],[1.3,1],[3.85,1],[4.5,0],[5,0]],5);
const L=keys([[0,0],[.4,0],[.7,.045],[1.3,.045],[1.6,0],[3.6,0],[3.85,.045],[4.5,.045],[4.8,0],[5,0]],5);
const D=keys([[0,0],[1.6,0],[2.5,1],[2.9,1],[3.6,0],[5,0]],5);
const X=keys([[0,0],[.4,1],[1.6,1],[2,0],[3.1,0],[3.6,1],[4.8,1],[5,0]],5);
const u=t=>U(phase(t)),lift=t=>L(phase(t)),down=t=>D(phase(t));
const foot=s=>({mode:'floor',heading:0,pitch:t=>side(t)!==s?22*down(t):0,
 at:t=>{const p=(side(t)!==s?22*down(t):0)*Math.PI/180;return r4([sg(s)*.1,side(t)===s?.42*u(t):.22502937-(-.08146046*Math.sin(p)+.22502937*Math.cos(p))]);},
 lift:t=>side(t)===s?lift(t):0,pole:[sg(s)*.13,.5,1]});
const hand=s=>({mode:'free',frame:'chest',wrist:[sg(s)*.30,.94,.08],finger:[0,-1,0],normal:[0,0,1],poleUp:[sg(s)*.45,1.1,-.15]});
const P=build(DUR,{pelvis:t=>r4([-sg(side(t))*.08*X(phase(t)),.884-.084*u(t)-.10*down(t),.012+.10*u(t)+.12*down(t)]),
 hips:{up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],t=>2+6*down(t)]]},chest:{waist:[[[1,0,0],0]]},
 hands:{left:hand('left'),right:hand('right')},feet:{left:foot('left'),right:foot('right')},constraints:[],solve:{vars:[],reg:{}}},
 {down,u, liftL:t=>side(t)==='left'?lift(t):0,liftR:t=>side(t)==='right'?lift(t):0});
export default {id:'h-forward-lunge',name:'前跨步弓步蹲',nameEn:'Forward Lunge',modelProfile:'training-human-v2plus',alignClavicles:false,
 v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'},fps:30,size:1080,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},highlight:{groups:['quadriceps','glute-max'],side:'both',pulseTrack:'down',pulseBase:.3},
 camera:{dir:[1,.15,.65],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:.16,k:.86,drift:0,at:2.5,fitTimeline:true},
 frame:{mode:'fit',width:780,height:840,cx:512,cy:540},stillAt:2.5,shadow:{joints:['leftToe','rightToe'],blobs:[],bands:[]},props:[],
 keyFrames:[0,1,1.6,2.5,3.6,4.2,5,6,6.6,7.5,8.6,9.2,9.9667],qa:{pins:[],allowContact:[]}};
