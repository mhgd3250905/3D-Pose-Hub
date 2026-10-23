import fs from 'node:fs';
import path from 'node:path';
import {boot} from '../../../drill-anim/lib/boot.mjs';
import {loadTheme} from '../../../drill-anim/lib/config.mjs';
import {applyNativeGrip,verifyNativeGrip} from '../../../drill-anim/models/grip-native-r1/loader.mjs';
import spec from '../../../drill-anim/specs/h-fixed-bar-vertical-pull-rr7.js';
const out=process.argv[2];if(!out||fs.existsSync(out))throw Error('A new output directory is required');
fs.mkdirSync(out,{recursive:true});const frames=[0,30,60,90,120,150,180,210,239,240];
const {b,p}=await boot({size:900,pr:1,theme:loadTheme()});
try{
 const manifest=await applyNativeGrip(p,spec);
 await p.evaluate(([s,t])=>{const v=flareInspector.viewer;v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();__setHighlight(s.highlight);for(const prop of s.props)__props.add(t,prop);__drill.setupCamera(s,900);v.renderer.setClearColor(0x101013,1);},[spec,loadTheme()]);
 const rows=[];
 for(let frame=0;frame<=240;frame++){
  const result=await p.evaluate(([s,f,capture])=>{
   const motion=__drill.applyAt(s,f/30,null);__props.update();const T=__toonT,v=flareInspector.viewer;v.scene.updateMatrixWorld(true);v.coach.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update()});
   const data={frame:f,warnings:motion.warn,joints:{...v.motion.getMetrics().joints,...__drill._jo}};
   if(!capture)return data;
   data.meshes={};
   for(const key of ['hands','limbs']){const o=__v2p[key].mesh,g=o.geometry,q=new T.Vector3(),pos=[];for(let i=0;i<g.attributes.position.count;i++){o.getVertexPosition(i,q).applyMatrix4(o.matrixWorld);pos.push(...q.toArray());}data.meshes[key]={pos,index:Array.from(g.index.array),weights:Array.from(g.attributes.skinWeight.array),joints:Array.from(g.attributes.skinIndex.array),bones:o.skeleton.bones.map(b=>b.name)};}
   const rod=__props.list.find(o=>o.name==='prop_pullupBar').children[0],g=rod.geometry,pos=[];
   for(let i=0;i<g.attributes.position.count;i++)pos.push(...new T.Vector3().fromBufferAttribute(g.attributes.position,i).applyMatrix4(rod.matrixWorld).toArray());
   data.rod={pos,index:Array.from(g.index.array)};
   data.handFrames=Object.fromEntries(['left','right'].map(side=>[side,v.coach.getObjectByName(side+'Hand').matrixWorld.toArray()]));
   v.renderer.render(v.scene,v.camera);data.full=v.renderer.domElement.toDataURL('image/png');
   const hand=v.coach.getObjectByName('leftHand'),center=hand.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.08,0));
   for(const[view,dir]of [['front',[.35,.2,1]],['side',[1,.2,.2]]]){const cam=new T.OrthographicCamera(-.16,.16,.16,-.16,.001,5);cam.position.copy(center).add(new T.Vector3(...dir));cam.lookAt(center);cam.updateMatrixWorld();v.renderer.render(v.scene,cam);data[view]=v.renderer.domElement.toDataURL('image/png');}
   return data;
  },[spec,frame,frames.includes(frame)]);
  if(result.meshes){
   for(const key of ['full','front','side']){fs.writeFileSync(path.join(out,`${key}-${frame}.png`),Buffer.from(result[key].split(',')[1],'base64'));delete result[key];}
   fs.writeFileSync(path.join(out,`frame-${frame}.json`),JSON.stringify(result));delete result.meshes;delete result.rod;
  }
  rows.push(result);if(frame%30===0)console.log(frame);
 }
 verifyNativeGrip();fs.writeFileSync(path.join(out,'poses.json'),JSON.stringify({id:spec.id,profile:manifest.id,version:manifest.version,frames:rows,surfaceFrames:frames,reviewed:false,releaseEligible:false}));
}finally{await b.close();}
