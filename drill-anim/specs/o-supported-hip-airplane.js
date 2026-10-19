// Supported shallow hip airplane, front +X; left stance foot fixed.
// Single target: pelvis/trunk en-bloc axial rotation over the stance hip.
// Not a lumbar twist, end-range stretch or repetition of the sagittal single-leg RDL.
// Stable non-wheeled chair, light right-hand support. Conservative 20-degree opening.
import {build,keys} from '../lib/home-anim.mjs';
import {rotAbout} from '../lib/ss-geo.mjs';
const DUR=8, a=keys([[0,0],[.5,0],[2,-20],[3.5,-20],[6,0],[7.8,0]],DUR);
const axis=[Math.sin(40*Math.PI/180),Math.cos(40*Math.PI/180),0];
const H=[-.0940625,.836729116,-.081543], P0=[-.06,.870272389,0];
// Fixed-rig counter-roll sampled from the uncorrected trajectory; preserves stance thigh/shin orientations, not only knee position.
const stanceRoll=[[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,-0.024236,-0.218463,-0.601687,-1.169468,-1.907302,-2.80156,-3.838098,-4.992025,-6.243905,-7.570269,-8.94089,-10.332609,-11.719342,-13.070176,-14.360845,-15.568565,-16.665759,-17.632398,-18.451994,-19.105706,-19.581852,-19.871586,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.968694,-19.960426,-19.889768,-19.750615,-19.54292,-19.26807,-18.927869,-18.524257,-18.062352,-17.54261,-16.969697,-16.34884,-15.682988,-14.976067,-14.235384,-13.465411,-12.668919,-11.855713,-11.028895,-10.193154,-9.35777,-8.526603,-7.704298,-6.899053,-6.116058,-5.358819,-4.634741,-3.948486,-3.303737,-2.705962,-2.159833,-1.668257,-1.23516,-0.863498,-0.555267,-0.313408,-0.139844,-0.034762,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,-0.025014,-0.223695,-0.617133,-1.198589,-1.955026,-2.872505,-3.934802,-5.118056,-6.400765,-7.759988,-9.165237,-10.591101,-12.01197,-13.395945,-14.718236,-15.955004,-17.078469,-18.068712,-18.907787,-19.576859,-20.064229,-20.360963,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.460364,-20.45136,-20.379788,-20.237104,-20.024053,-19.74272,-19.394764,-18.981956,-18.508458,-17.976968,-17.390285,-16.75431,-16.072559,-15.348776,-14.59012,-13.800918,-12.98541,-12.151745,-11.304585,-10.448583,-9.592294,-8.740445,-7.897762,-7.07267,-6.269696,-5.493347,-4.751361,-4.047798,-3.386608,-2.774419,-2.214525,-1.710106,-1.266215,-0.885206,-0.569278,-0.321608,-0.143435,-0.035877,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]];
const roll=(i,t)=>{const f=(t%8)*15,k=Math.floor(f);return stanceRoll[i][k]+(stanceRoll[i][k+1]-stanceRoll[i][k])*(f-k);};
const P=build(DUR,{
 pelvis:t=>rotAbout(P0,H,axis,a(t)),
 hips:{up:[0,1,0],front:[1,0,0],rot:[[[0,0,1],-40],[axis,a]]},
 hands:{
  left:{mode:'free',frame:'chest',wrist:[.205,1.0063,.3011],finger:[0,-.766044,.642788],normal:[-1,0,.15],poleUp:[.3,1.2,-.5]},
  right:{mode:'free',frame:'world',palmAt:[.417,.9849,.205],finger:[1,0,0],normal:[0,-1,0],pole:[.1,1.1,.5]}
 },
 feet:{
  left:{mode:'floor',at:[0,-.085],heading:90,pitch:0,thighTwist:t=>roll(0,t),kneeTwist:t=>roll(1,t),pole:[-.011243486,.493667237,-.082946612]},
  right:{mode:'free',frame:'hips',ankle:[-.083,.0898,-.0186],rot:[],poleLow:[-.09,.5,.6]}
 },
 constraints:[],solve:{vars:[],reg:{}}
},{open:t=>a(t)/-20});
export default {
 id:'o-supported-hip-airplane',name:'扶椅单腿髋飞机',nameEn:'Chair-Supported Hip Airplane',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['hip-abductors','glute-max','obliques'],side:'left',pulseTrack:'open',pulseBase:.3},
 camera:{dir:[-.3,.22,-1],fit:['head','leftToe','rightToe','pelvis','leftPalm','rightPalm'],pad:.14,k:.9,drift:0,at:0,fitTimeline:true},
 frame:{mode:'fit',width:800,height:760,cx:512,cy:550},stillAt:2,
 props:[{type:'chair',at:[.60,0,.205],yaw:90,height:.45,width:.60,depth:.42,back:.58}],
 keyFrames:[0,1,2,3,4,5,6,7.933333],
 qa:{pins:[{c:'footL',when:'always'},{c:'handR',when:'always'}],straight:[{j:'knee.left',min:160},{j:'knee.right',min:170}],allowContact:[]}
};
