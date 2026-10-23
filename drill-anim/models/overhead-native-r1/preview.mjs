import fs from 'node:fs';
import path from 'node:path';
import {boot} from '../../lib/boot.mjs';
import {loadTheme} from '../../lib/config.mjs';
import {applyOverheadNative,verifyOverheadNative} from './loader.mjs';
import spec from '../../specs/h-db-overhead-triceps-extension-rr3.js';
const out=process.argv[2];if(!out||fs.existsSync(out))throw Error('Provide a fresh output directory');
fs.mkdirSync(out,{recursive:true});
const frames=[0,30,60,90,120,150,180,210,239,240],theme=loadTheme();
const {b,p}=await boot({size:900,pr:1,theme});
try{
 const manifest=await applyOverheadNative(p,spec);
 await p.evaluate(([s,t])=>{const v=flareInspector.viewer;v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();__setHighlight(s.highlight);for(const prop of s.props)__props.add(t,prop);__drill.setupCamera(s,900);v.renderer.setClearColor(0x101013,1);},[spec,theme]);
 const rows=[];
 for(let frame=0;frame<=240;frame++){
  const result=await p.evaluate(([s,f,capture])=>{
   const r=__drill.applyAt(s,f/30,null);__props.update();
   const T=__toonT,v=flareInspector.viewer;v.scene.updateMatrixWorld(true);v.coach.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
   const data={frame:f,warnings:r.warn,joints:{...v.motion.getMetrics().joints,...__drill._jo}};
   if(!capture)return data;
   const mesh=o=>{const g=o.geometry,pos=[],q=new T.Vector3();for(let i=0;i<g.attributes.position.count;i++){o.getVertexPosition(i,q).applyMatrix4(o.matrixWorld);pos.push(q.x,q.y,q.z);}return {pos,index:Array.from(g.index.array),bones:o.skeleton.bones.map(b=>b.name),joints:Array.from(g.attributes.skinIndex.array),weights:Array.from(g.attributes.skinWeight.array)};};
   data.meshes={hands:mesh(__v2p.hands.mesh),limbs:mesh(__v2p.limbs.mesh)};
   data.handFrames=Object.fromEntries(['left','right'].map(side=>[side,v.coach.getObjectByName(side+'Hand').matrixWorld.toArray()]));
   const prop=__props.list.find(o=>o.name==='prop_dumbbell');
   const solids=prop.children.map(o=>{
    const g=o.geometry,idx=g.index.array,pos=g.attributes.position,planes=[],world=[];
    for(let i=0;i<pos.count;i++)world.push(...new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld).toArray());
    for(let i=0;i<idx.length;i+=3){const a=new T.Vector3().fromBufferAttribute(pos,idx[i]),b=new T.Vector3().fromBufferAttribute(pos,idx[i+1]),c=new T.Vector3().fromBufferAttribute(pos,idx[i+2]),n=b.sub(a).cross(c.sub(a)).normalize();if(n.lengthSq()>.5)planes.push([n,n.dot(a)]);}
    return {inverse:o.matrixWorld.clone().invert(),planes,mesh:{pos:world,index:Array.from(idx)}};
   });
   data.rod=solids[0].mesh;data.endPlates=solids.slice(1).map(x=>x.mesh);data.propScans=[];
   v.coach.traverse(o=>{
    if(!o.isSkinnedMesh||!o.visible)return;
    const g=o.geometry,maxDepthMm=[0,0,0],over2Mm=[0,0,0],inside=[0,0,0],near2Mm=[0,0,0],contactGroups={};
    const used=new Set(g.index?.array||Array.from({length:g.attributes.position.count},(_,i)=>i));
    for(const i of used){
     const world=o.getVertexPosition(i,new T.Vector3()).applyMatrix4(o.matrixWorld);
     solids.forEach((solid,k)=>{
      const q=world.clone().applyMatrix4(solid.inverse);let distance=-Infinity;
      for(const[n,d]of solid.planes)distance=Math.max(distance,n.dot(q)-d);
      if(distance<0){inside[k]++;maxDepthMm[k]=Math.max(maxDepthMm[k],-distance*1000);if(distance<-.002)over2Mm[k]++;}
      if(Math.abs(distance)<=.002){near2Mm[k]++;if(k===0&&o===__v2p.hands.mesh){let bone='',w=-1;for(let j=0;j<4;j++)if(g.attributes.skinWeight.getComponent(i,j)>w){w=g.attributes.skinWeight.getComponent(i,j);bone=o.skeleton.bones[g.attributes.skinIndex.getComponent(i,j)].name;}contactGroups[bone]=(contactGroups[bone]||0)+1;}}
     });
    }data.propScans.push({mesh:o.name,vertices:used.size,maxDepthMm,over2Mm,inside,near2Mm,contactGroups});
   });
   v.renderer.render(v.scene,v.camera);data.full=v.renderer.domElement.toDataURL('image/png');
   for(const side of ['left','right']){
    const hand=v.coach.getObjectByName(side+'Hand'),q=hand.getWorldQuaternion(new T.Quaternion()),center=new T.Vector3(side==='left'?.085:-.085,0,0).applyMatrix4(hand.matrixWorld),direction=new T.Vector3(0,1,.25).applyQuaternion(q).normalize();
    const camera=new T.OrthographicCamera(-.17,.17,.17,-.17,.001,3);camera.up.set(side==='left'?1:-1,0,0).applyQuaternion(q);camera.position.copy(center).addScaledVector(direction,.55);camera.lookAt(center);camera.updateMatrixWorld();v.renderer.render(v.scene,camera);data[side]=v.renderer.domElement.toDataURL('image/png');
   }
   return data;
  },[spec,frame,frames.includes(frame)]);
  if(result.meshes){
   for(const key of ['full','left','right']){fs.writeFileSync(path.join(out,`${key}-${frame}.png`),Buffer.from(result[key].split(',')[1],'base64'));delete result[key];}
   fs.writeFileSync(path.join(out,`frame-${frame}.json`),JSON.stringify(result));delete result.meshes;delete result.rod;delete result.endPlates;
  }
  rows.push(result);if(frame%30===0)console.log('actual',frame);
 }
 verifyOverheadNative();fs.writeFileSync(path.join(out,'poses.json'),JSON.stringify({id:spec.id,profile:manifest.id,version:manifest.version,frames:rows,surfaceFrames:frames,reviewed:false,releaseEligible:false}));
}finally{await b.close();}
