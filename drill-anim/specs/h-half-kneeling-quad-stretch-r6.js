// Action-owned heel grasp; actual native hand/foot triangles fitted without changing frozen hand assets.
// Fixed forward elbow pole follows the reachable arm plane and reduces wrist bend.
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
const GRIP_WRIST=[0.08319090004811397, -0.05008423188426431, -0.027962735385693036],GRIP_FINGER=[-0.29909162831792013, -0.7673031649890378, 0.5672654085198869],GRIP_NORMAL=[-0.8484194087180081, 0.4859139132293135, 0.20993373287893283];
const footRot=(v,t)=>rot(v,[1,0,0],125-5*p(t));
const B=source.pose.base;
const P=build(D,{...B,pelvis,
 hips:{...B.hips,rot:[[[1,0,0],tilt]]},
 chest:{waist:[[[1,0,0],t=>2+2*p(t)],[[0,1,0],6]]},
 feet:{right:B.feet.right,left:{...B.feet.left,pole:[.087,-1.03445,.05],ankle,rot:[[[1,0,0],t=>125-5*p(t)]]}},
 hands:{right:B.hands.right,left:{...B.hands.left,pole:[.5,.5,.9],wrist:t=>add(ankle(t),footRot(GRIP_WRIST,t)),finger:t=>footRot(GRIP_FINGER,t),normal:t=>footRot(GRIP_NORMAL,t)}},
 constraints:[],solve:{vars:[],reg:{}}
},{open:p});
export default {...source,id:'h-half-kneeling-quad-stretch-r6',revisionOf:'h-half-kneeling-quad-stretch-r5',actionCorrective:{"id":"native-action-hand-pose-r1","version":"0.1.0-r1","required":true,"specId":"h-half-kneeling-quad-stretch-r6","basePoses":{"left":"open"},"poses":{"left":{"thumb1":[-0.20961730852931215,0.12100361434512993,0.2042628781895715,0.9485227387227227],"thumb2":[0.18882248413126554,0.0,-0.28686103817236597,0.9391787978149689],"thumb3":[0.18356659954515125,0.0,-0.27887624485803403,0.942619405478856],"index1":[-0.04007683780549796,0.0,-0.30825699405522766,0.9504585591637056],"index2":[-0.07639071043425094,0.0,-0.5875705784595379,0.8055589827492923],"index3":[-0.025300168119428,0.0,-0.1946000283614411,0.9805563372162025],"middle1":[-0.04075560802986058,0.0,-0.38756436805862726,0.9209412799008595],"middle2":[-0.053951724759018306,0.0,-0.5130524883000611,0.8566600000260562],"middle3":[-0.026644668258542198,0.0,-0.25337676248597973,0.967000660747197],"ring1":[-0.19372433531170377,0.0,-0.4750522802052559,0.8583683434166393],"ring2":[-0.19676804824240687,0.0,-0.4825160960737901,0.8534990054010507],"ring3":[-0.07769858586490619,0.0,-0.19053305989904512,0.9786010846305561],"pinky1":[-0.17097309794051566,0.0,-0.5148462323954088,0.840060448282667],"pinky2":[-0.12547317752823606,0.0,-0.3778336679584983,0.9173321105673752],"pinky3":[-0.07246144797895383,0.0,-0.2182010148687827,0.9732099751168947]}}},timeline:{duration:D,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas}};
