// Single goal: active right hip internal rotation about the fixed femur axis.
// Thigh and knee centre stay still, lower leg moves outward; foot follows shin without ankle substitution.
// Unloaded 20-degree comfortable control, not a forced stretch or maximal range test.
// Stand tall, pelvis faces forward, light left-hand balance contact with a stable chair.
// 1 easy set of 4-6 repetitions per side. Stop if painful; do not force knee/ankle twisting.
// Highlight is a broad hip-abductor region, not isolated deep/internal-rotator muscle anatomy.
// Distinct from hip-gate compound motion and seated/prone/90-90 internal rotation.
import {build,keys,r4,armWrist,armDir} from '../lib/home-anim.mjs';
import {leg,restPtW,rotAbout} from '../lib/ss-geo.mjs';
const DUR=8,PEL=[0,0.8936,0],hips={up:[0,1,0],front:[0,0,1],rot:[[[1,0,0],0]]};
const ir=keys([[0,0],[0.5,0],[2.0,1],[4.0,1],[6.5,0],[7.6,0]],DUR);
const L=leg('right',55,75),H=restPtW(hips,PEL,L.hip),K=restPtW(hips,PEL,L.knee),A=restPtW(hips,PEL,L.ankle);
const ax=K.map((x,i)=>x-H[i]),unit=ax.map(x=>x/Math.hypot(...ax));
// Right thigh axis points knee-ward. Negative rotation sends the right ankle outward (-X).
const angle=t=>-20*ir(t),ank=t=>rotAbout(A,K,unit,angle(t));
const pole=t=>{const a=ank(t),m=a.map((x,i)=>(x+H[i])/2);return r4(K.map((x,i)=>x+2*(x-m[i])));};
// Preserve the shin's axial orientation relative to the thigh, not just its endpoint.
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>a.map(x=>x/Math.hypot(...a));
const turnBetween=(v,a,b)=>{a=norm(a);b=norm(b);const c=cross(a,b),sn=Math.hypot(...c);return sn<1e-8?v:rotAbout(v,[0,0,0],c,Math.atan2(sn,dot(a,b))*180/Math.PI);};
// Fixed training-human-v2 rest shin axis, recovered from its neutral segment and bone quaternion.
const sr=[-0.0008579999999999977, -0.40902589999999994, -0.02525730000000001],baseShin=sub(A,K),x0=turnBetween([1,0,0],sr,baseShin);
const shinTwist=t=>{const d=norm(sub(ank(t),K)),cur=turnBetween([1,0,0],sr,d),want=rotAbout(x0,[0,0,0],unit,angle(t)),project=v=>norm(v.map((x,i)=>x-d[i]*dot(v,d))),u=project(cur),w=project(want);return Math.atan2(dot(d,cross(u,w)),dot(u,w))*180/Math.PI;};
const foot={mode:'free',frame:'world',ankle:t=>r4(ank(t)),rot:[[[1,0,0],20],[unit,angle]],pole,thighTwist:angle,kneeTwist:shinTwist};
const P=build(DUR,{
 pelvis:PEL,hips,chest:{waist:[[[1,0,0],0]]},
 hands:{left:{mode:'free',frame:'world',palmAt:[0.35,0.9879,0.006],finger:[0,0,1],normal:[0,-1,0],pole:[0.7,1.05,-0.15]},
 right:{mode:'free',frame:'chest',wrist:r4(armWrist('right',10,20,0.47)),finger:r4(armDir('right',10,20)),normal:[1,0,0],poleUp:[-0.6,1.1,-0.2],relax:1}},
 feet:{left:{mode:'free',frame:'world',ankle:restPtW(hips,PEL,leg('left',3,6).ankle),rot:[[[1,0,0],0]],pole:restPtW(hips,PEL,leg('left',3,6).knee)},right:foot},constraints:[],solve:{vars:[],reg:{}}
},{ir});
export default{
 id:'o-supported-hip-ir',name:'扶椅屈膝髋内旋控制',nameEn:'Chair-Supported Isolated Hip Internal Rotation',
 modelProfile:'training-human-v2',alignClavicles:false,fps:15,
 timeline:{duration:DUR,tracks:P.tracks},pose:{base:P.base,deltas:P.deltas},
 highlight:{groups:['hip-abductors'],side:'right',pulseTrack:'ir',pulseBase:0.3},
 camera:{dir:[-0.75,0.2,-0.65],fit:['head','leftToe','rightToe','pelvis','leftKnee','rightKnee','leftPalm','rightPalm'],pad:0.18,k:1,drift:0,at:2,fitTimeline:true},
 frame:{mode:'fit',width:780,height:820,cx:512,cy:520},stillAt:2,
 props:[{type:'chair',at:[0.40,0,0.183],yaw:0,height:0.45,width:0.44,depth:0.42,back:0.58}],
 keyFrames:[0,2,4,6.5],
 qa:{pins:[{c:'handL',when:'always'},{c:'footL',when:'always'}],allowContact:[]}
};
