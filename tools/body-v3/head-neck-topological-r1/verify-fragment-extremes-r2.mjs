// Head/neck fragment retest: same neck rotations and original nearest-vertex
// baseline as jointaudit + jm2, plus the new physical shared-edge measurement.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
if(process.argv.length!==3)throw Error('Usage: node verify-fragment-extremes-r1.mjs <new-output-directory>');
const out=path.resolve(process.argv[2]);fs.mkdirSync(out);
const imp=p=>import(pathToFileURL(path.join(root,p)).href);
const {loadTheme}=await imp('drill-anim/lib/config.mjs');
const L=await imp('drill-anim/models/training-human-v3/loader.mjs');
const weld=await imp('drill-anim/models/head-neck-weld-r2/loader.mjs');
const source=await imp('drill-anim/specs/h-squat.js');
const spec={...structuredClone(source.default),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'}};
const ring=JSON.parse(fs.readFileSync(path.join(root,'drill-anim/models/head-neck-weld-r2/paired-topology.json'))).headRing;
const glb=fs.readFileSync(path.join(root,'drill-anim/models/head-neck-fragment-r3/head-neck.glb')).toString('base64');
const toon=JSON.parse(fs.readFileSync(path.join(root,'drill-anim/models/head-neck-toon-r4/asset.json')));
const url=p=>'/@fs/'+path.join(root,p).replaceAll('\\','/');
const {b,p}=await L.boot({size:480,pr:1,theme:loadTheme()});
try{
 await L.applyV3(p,spec,{});await p.evaluate(s=>{__drill.selectModelProfile(s);flareInspector.viewer.motion.reset();},spec);
 const pose=async(ax,deg)=>p.evaluate(([ax,deg])=>{const T=__toonT,v=flareInspector.viewer;v.motion.reset();const nk=v.coach.getObjectByName('neck'),pv=nk.getWorldPosition(new T.Vector3());const axw=new T.Vector3(...ax).applyQuaternion(v.coach.getObjectByName('torso').getWorldQuaternion(new T.Quaternion()));for(const [n,f] of [['neck',0.5],['head',1]]){const bn=v.coach.getObjectByName(n),q=new T.Quaternion().setFromAxisAngle(axw,deg*f*Math.PI/180),wp=bn.getWorldPosition(new T.Vector3()).sub(pv).applyQuaternion(n==='head'?new T.Quaternion().setFromAxisAngle(axw,deg*0.5*Math.PI/180):q).add(pv),wq=q.clone().multiply(bn.getWorldQuaternion(new T.Quaternion())),pq=bn.parent.getWorldQuaternion(new T.Quaternion()).invert();bn.position.copy(bn.parent.worldToLocal(wp));bn.quaternion.copy(pq.multiply(wq));bn.updateMatrixWorld(true);}},[ax,deg]);
 const save=async(name,after)=>{
  const result=await p.evaluate(([ring,after])=>{
   const T=__toonT,v=flareInspector.viewer;v.coach.updateMatrixWorld(true);
   const posNorm=(m,i)=>{const pos=new T.Vector3().fromBufferAttribute(m.geometry.attributes.position,i);m.applyBoneTransform(i,pos);pos.applyMatrix4(m.matrixWorld);const end=new T.Vector3().fromBufferAttribute(m.geometry.attributes.position,i).addScaledVector(new T.Vector3().fromBufferAttribute(m.geometry.attributes.normal,i),.002);m.applyBoneTransform(i,end);end.applyMatrix4(m.matrixWorld).sub(pos).normalize();return [pos,end];};
   const pct=(a,q)=>{a.sort((x,y)=>x-y);const at=(a.length-1)*q,l=Math.floor(at),h=Math.ceil(at);return a[l]+(a[h]-a[l])*(at-l);};
   let metrics;
   if(!after){
    const head=v.coach.getObjectByName('Toon_Mannequin_Head_v5'),neck=v.coach.getObjectByName('Mesh001');
    head.skeleton.update();neck.skeleton.update();const ids=[...new Set(neck.geometry.index.array)], verts=ids.map(i=>posNorm(neck,i));const gaps=[],angles=[];
    for(const i of ring){const [a,n]=posNorm(head,i);let best=Infinity,other=null;for(const [b,m] of verts){const d=a.distanceToSquared(b);if(d<best){best=d;other=m;}}gaps.push(Math.sqrt(best)*1000);angles.push(Math.acos(Math.max(-1,Math.min(1,n.dot(other))))*180/Math.PI);}
    metrics={method:'original head opening boundary to nearest used neck vertex, same as jm2',n:ring.length,gap_p50_mm:pct(gaps,.5),gap_max_mm:Math.max(...gaps),nrm_p50_deg:pct(angles,.5),nrm_max_deg:Math.max(...angles)};
   }else{
    const m=window.__fragmentExtreme.mesh; m.skeleton.update(); const g=m.geometry, index=g.index.array, groups=g.groups, sets=groups.map(group=>new Set(index.slice(group.start,group.start+group.count)));
    const common=[...sets[0]].filter(i=>sets[1].has(i));if(common.length!==162)throw Error(`Expected 162 shared seam vertices, got ${common.length}`);
    const edges=new Map();for(const group of groups)for(let k=group.start;k<group.start+group.count;k+=3)for(const [a,b] of [[index[k],index[k+1]],[index[k+1],index[k+2]],[index[k+2],index[k]]]){if(!sets[0].has(a)||!sets[1].has(a)||!sets[0].has(b)||!sets[1].has(b))continue;const key=[Math.min(a,b),Math.max(a,b)].join(','), list=edges.get(key)||[];list.push([index[k],index[k+1],index[k+2]]);edges.set(key,list);}
    if(edges.size!==162||[...edges.values()].some(n=>n.length!==2))throw Error('Fragment seam is not 162 shared two-face edges');
    const faceAngles=[...edges.values()].map(pair=>{const normal=face=>{const [a,b,c]=face.map(i=>posNorm(m,i)[0]);return b.sub(a).cross(c.sub(a)).normalize();};return Math.acos(Math.max(-1,Math.min(1,normal(pair[0]).dot(normal(pair[1])))))*180/Math.PI;});
    // Both material sides reference the same actual indices and normals.
    const samples=common.map(i=>{const [a,n]=posNorm(m,i),[b,k]=posNorm(m,i);return [a.distanceTo(b)*1000,Math.acos(Math.max(-1,Math.min(1,n.dot(k))))*180/Math.PI];});
    metrics={method:'new head/neck material interface: matching shared vertex IDs, two-face edges; original 230-point opening is no longer an open boundary',n:common.length,sharedEdges:edges.size,gap_p50_mm:pct(samples.map(x=>x[0]),.5),gap_max_mm:Math.max(...samples.map(x=>x[0])),nrm_p50_deg:pct(samples.map(x=>x[1]),.5),nrm_max_deg:Math.max(...samples.map(x=>x[1])),adjacent_face_angle_p50_deg:pct(faceAngles,.5),adjacent_face_angle_max_deg:Math.max(...faceAngles)};
   }
   const c=v.coach.getObjectByName('neck').getWorldPosition(new T.Vector3()), pictures={};
   for(const [side,d] of [['back',[0,0,-1]],['side',[1,0,0]]]){const target=c.clone().add(new T.Vector3(0,.10,0)),camera=new T.PerspectiveCamera(35,1,.02,20);camera.position.copy(target).add(new T.Vector3(...d).multiplyScalar(.8));camera.lookAt(target);v.renderer.setClearColor(0x101318,1);v.renderer.render(v.scene,camera);pictures[side]=v.renderer.domElement.toDataURL('image/png');}
   return {metrics,pictures};
  },[ring,after]);
  for(const [side,data] of Object.entries(result.pictures))fs.writeFileSync(path.join(out,`${after?'after':'before'}-${name}-${side}.png`),Buffer.from(data.split(',')[1],'base64'),{flag:'wx'});
  console.log(JSON.stringify({name,after,...result.metrics}));return result.metrics;
 };
 const poses=[['neckflex',[1,0,0],40],['neckext',[1,0,0],-35],['neckrot',[0,1,0],65]],report={before:{},after:{},limitations:'Before uses original 230 head opening boundary; after uses 162 physically shared interface vertices, since original opening was closed by bridge topology.'};
 for(const [name,axis,deg] of poses){await pose(axis,deg);report.before[name]=await save(name,false);}
 await p.evaluate(()=>{flareInspector.viewer.motion.reset();});await weld.apply(p);
 await p.evaluate(async([data,entry,toon])=>{const v=flareInspector.viewer,raw=atob(data),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const {attachHeadNeckFragment}=await import(entry),ref=v.coach.getObjectByName('V3_Head_Neck_Topological_R1');window.__fragmentExtreme=await attachHeadNeckFragment({binary:bytes.buffer,parent:ref.parent,skeleton:v.coach.getObjectByName('Coach_Body').skeleton,toonAsset:toon,uniforms:{toon:__toonUni,muscle:__mmUni,v2p:__v2p.uni},hide:[ref]});},[glb,url('drill-anim/models/head-neck-fragment-r3/loader.mjs'),toon]);
 for(const [name,axis,deg] of poses){await pose(axis,deg);report.after[name]=await save(name,true);}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2),{flag:'wx'});
}finally{await b.close();}