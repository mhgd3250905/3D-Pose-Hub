// Reproducible local QA: actual posed joints at all frames and conservative
// dumbbell vertex penetration against native convex meshes at keyframes.
import fs from 'node:fs';
import path from 'node:path';
import {boot} from '../lib/boot.mjs';
import {loadTheme} from '../lib/config.mjs';
import {applyHumanV2plus} from '../lib/human-v2plus.mjs';
import spec from '../specs/h-db-overhead-triceps-extension-rr2.js';
const out=process.argv[2];
if(!out || fs.existsSync(out))throw Error('Provide a fresh QA output directory');
fs.mkdirSync(out,{recursive:true});
const theme=loadTheme(),{b,p}=await boot({size:720,pr:1,theme});
try {
 await applyHumanV2plus(p,spec);
 await p.evaluate(([s,th])=>{for(const prop of s.props)__props.add(th,prop);__setHighlight(s.highlight);},[spec,theme]);
 const rows=[];
 for(let frame=0;frame<=240;frame++) {
  const row=await p.evaluate(([s,f])=>{
   const r=__drill.applyAt(s,f/30,null),v=flareInspector.viewer,T=__toonT;
   __props.update();v.scene.updateMatrixWorld(true);
   const J={...v.motion.getMetrics().joints,...__drill._jo};
   const hand=v.coach.getObjectByName('rightHand');
   const result={frame:f,joints:J,warnings:r.warn,handWorld:hand.matrixWorld.toArray()};
   if([0,15,30,45,60,90,120,135,150,180,239,240].includes(f)) {
    const prop=__props.list.find(o=>o.name==='prop_dumbbell');
    const solids=prop.children.map(o=>{
     o.geometry.computeBoundingSphere();
     const g=o.geometry,idx=g.index.array,pos=g.attributes.position,planes=[];
     for(let j=0;j<idx.length;j+=3) {
      const a=new T.Vector3().fromBufferAttribute(pos,idx[j]),bb=new T.Vector3().fromBufferAttribute(pos,idx[j+1]),c=new T.Vector3().fromBufferAttribute(pos,idx[j+2]);
      const n=bb.sub(a).cross(c.sub(a)).normalize();
      if(n.lengthSq()>.5)planes.push([n,n.dot(a)]);
     }
     return {inverse:o.matrixWorld.clone().invert(),planes};
    });
    const scans=[];
    v.coach.traverse(o=>{
     if(!o.isSkinnedMesh||!o.visible)return;
     o.skeleton.update();const maxDepth=[0,0,0],over2=[0,0,0],inside=[0,0,0],near=[0,0,0];
     const used=new Set(o.geometry.index?.array || Array.from({length:o.geometry.attributes.position.count},(_,i)=>i));
     for(const i of used) {
      const world=o.getVertexPosition(i,new T.Vector3()).applyMatrix4(o.matrixWorld);
      solids.forEach((solid,k)=>{
       const point=world.clone().applyMatrix4(solid.inverse);
       let distance=-Infinity;for(const[n,d]of solid.planes)distance=Math.max(distance,n.dot(point)-d);
       if(distance<0){inside[k]++;maxDepth[k]=Math.max(maxDepth[k],-distance*1000);if(distance<-.002)over2[k]++;}
       if(Math.abs(distance)<=.002)near[k]++;
      });
     }
     scans.push({mesh:o.name,vertices:used.size,maxDepthMm:maxDepth,inside,over2Mm:over2,near2Mm:near});
    });result.propScans=scans;
   }
   return result;
  },[spec,frame]);rows.push(row);
  if(frame%30===0)console.log('actual frame',frame);
 }
 fs.writeFileSync(path.join(out,'actual-poses.json'),JSON.stringify({id:spec.id,frames:rows}));
 console.log(out);
} finally {await b.close();}
