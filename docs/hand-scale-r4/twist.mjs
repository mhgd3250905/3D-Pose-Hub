// Analytic wrist twist survey: one headless page, engine pose per spec/time, swing-twist of hand vs forearm about the forearm axis.
import fs from 'node:fs';import {pathToFileURL} from 'node:url';
const R='./drill-anim/';const {boot}=await import(pathToFileURL(R+'lib/boot.mjs').href);const {loadTheme}=await import(pathToFileURL(R+'lib/config.mjs').href);
const list=fs.readFileSync(process.argv[2],'utf8').trim().split('\n');const N=+process.argv[4]||12;
const {b,p}=await boot({size:256,pr:1,theme:loadTheme()});const out=[];
try{
 await p.evaluate(()=>{const T=__toonT,v=flareInspector.viewer;v.motion.reset();v.coach.updateMatrixWorld(true);
  window.__tw=side=>{const fa=v.coach.getObjectByName(side+'Forearm'),h=v.coach.getObjectByName(side+'Hand');v.coach.updateMatrixWorld(true);
   const qf=fa.getWorldQuaternion(new T.Quaternion()),qh=h.getWorldQuaternion(new T.Quaternion());const rel=qf.clone().invert().multiply(qh);
   const ax=h.getWorldPosition(new T.Vector3()).sub(fa.getWorldPosition(new T.Vector3())).normalize().applyQuaternion(qf.clone().invert());return [rel.x,rel.y,rel.z,rel.w,ax.x,ax.y,ax.z];};
  window.__rest={left:__tw("left"),right:__tw("right")};});
 REST=await p.evaluate(()=>window.__rest);
 for(const f of list){const spec=(await import(pathToFileURL(R+'specs/'+f).href)).default;const r={f,left:[],right:[]};
  try{for(let i=0;i<N;i++){const t=spec.timeline.duration*i/N;
    const v=await p.evaluate(([s,t])=>{__drill.pose(s,__drill.sample(s.timeline,t));const o={};for(const side of['left','right'])o[side]=__tw(side);return o;},[{...JSON.parse(JSON.stringify(spec)),modelProfile:'training-human-v2'},t]);
    for(const side of['left','right']){const [x,y,z,w,ax,ay,az]=v[side];const [rx,ry,rz,rw]=__restq(side);
      // remove bind relative: d = rest^-1 * rel
      const q=mul([-rx,-ry,-rz,rw],[x,y,z,w]);let tw=2*Math.atan2(q[0]*ax+q[1]*ay+q[2]*az,q[3])*180/Math.PI;if(tw>180)tw-=360;if(tw<-180)tw+=360;r[side].push(+tw.toFixed(1));}}}
  catch(e){r.err=String(e.message).slice(0,120);}
  out.push(r);}
}finally{await b.close();}
function mul(a,b){return[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]}
var REST;function __restq(side){return REST[side]}
fs.writeFileSync(process.argv[3],JSON.stringify(out));
