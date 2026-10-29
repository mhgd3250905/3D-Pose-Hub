// CPU knee calibration candidate; action-specific rear-foot grip still under adaptation.
// Shift rear knee/leg/body by 34.45 mm; front foot stays planted.
// Deterministic half-kneeling template: fixed knee and measured leg lengths, no warm-solver branch.
import source from './h-half-kneeling-quad-stretch-r3.js';
import {build,keys} from '../lib/home-anim.mjs';
import {rot} from '../lib/ss-geo.mjs';
const D=8,TH=.409739814,SH=.416772719,K=[.087,.01435,-.04];
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]);
const p=keys([[0,0],[.6,0],[2.2,.85],[3.8,1],[5.6,.85],[7.2,0]],D);
const tilt=t=>8-14*p(t);
const ankle=t=>{const v=[.003,.4007+.0075*p(t),-.115+.03*p(t)],n=Math.hypot(...v);return add(K,v.map(x=>SH*x/n));};
const pelvis=t=>{
 const z=.015+.020*p(t),x=.081543;
 const hip=[x,K[1]+Math.sqrt(TH*TH-(x-K[0])**2-(z-K[2])**2),z];
 const localHip=rot([.081543,-.0475906,-.0045312],[1,0,0],tilt(t));
 return sub(hip,localHip);
};
const B=source.pose.base;
const P=build(D,{...B,pelvis,
 hips:{...B.hips,rot:[[[1,0,0],tilt]]},
 chest:{waist:[[[1,0,0],t=>2+2*p(t)],[[0,1,0],6]]},
 feet:{right:B.feet.right,left:{...B.feet.left,pole:[.087,-1.03445,.05],ankle,rot:[[[1,0,0],t=>125-5*p(t)]]}},
 hands:{right:B.hands.right,left:{...B.hands.left,pole:[.6,.86555,-.3],wrist:t=>add(ankle(t),[.073,.060,.030])}},
 constraints:[],solve:{vars:[],reg:{}}
},{open:p});
export default {...source,id:'h-half-kneeling-quad-stretch-r5',revisionOf:'h-half-kneeling-quad-stretch-r4',timeline:{duration:D,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas}};
