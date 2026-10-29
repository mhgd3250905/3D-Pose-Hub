// Render baked external hand candidates in identical scale, cameras and material.
import fs from 'node:fs';import path from 'node:path';
import {imp,pinnedRuntime,verifyRuntimeSelection,saveJson,saveImage} from './hand-qa-runtime.mjs';
const [out,runtimeFile,...files]=process.argv.slice(2);if(!out||!runtimeFile||!files.length||fs.existsSync(out))throw Error('Usage: hand-asset-preview <NEW out> <runtime> <baked JSON>...');
const rt=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(rt);fs.mkdirSync(out,{recursive:true});
const model=await imp('drill-anim/models/training-human-v3-armfix-r2/loader.mjs'),{loadTheme}=await imp('drill-anim/lib/config.mjs'),theme=loadTheme();
const {b,p}=await model.boot({size:640,pr:1,theme});
try{
 await model.applyV3(p,{modelProfile:'training-human-v2plus-hands-native',nativeHands:{},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'},props:[]});
 const report=[];
 for(const file of files){
  const data=JSON.parse(fs.readFileSync(file,'utf8')),name=path.basename(file,'.json');
  const result=await p.evaluate(d=>{
   const T=__toonT,renderer=flareInspector.viewer.renderer,scene=new T.Scene();scene.background=new T.Color(0xf0f2f4);
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(d.positions,3));if(d.normals)geometry.setAttribute('normal',new T.Float32BufferAttribute(d.normals,3));geometry.setIndex(d.indices||d.index);if(!d.normals)geometry.computeVertexNormals();
   geometry.computeBoundingBox();const box=geometry.boundingBox,size=box.getSize(new T.Vector3());if(size.length()>1||size.length()<.05)throw Error('Expected metres hand geometry');
   const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0xcba887,roughness:.73,metalness:0,side:T.DoubleSide}));scene.add(mesh);
   scene.add(new T.HemisphereLight(0xffffff,0x68717f,2));const light=new T.DirectionalLight(0xffffff,3);light.position.set(-1,2,-3);scene.add(light);
   const images={},target=new T.Vector3(0,.045,0),half=.135;
   for(const [name,offset]of [['palm',[0,0,-.6]],['back',[0,0,.6]],['edge',[.6,0,0]],['oblique',[.4,.22,-.5]]]){const camera=new T.OrthographicCamera(-half,half,half,-half,.01,4);camera.position.copy(target).add(new T.Vector3(...offset));camera.up.set(0,1,0);camera.lookAt(target);camera.updateMatrixWorld();renderer.clear(true,true,true);renderer.render(scene,camera);images[name]=renderer.domElement.toDataURL('image/png');}
   const bounds={min:box.min.toArray(),max:box.max.toArray(),size:size.toArray()};geometry.dispose();mesh.material.dispose();return {images,bounds,vertices:d.positions.length/3,triangles:(d.indices||d.index).length/3};
  },data);
  for(const [view,uri]of Object.entries(result.images))saveImage(path.join(out,name+'-'+view+'.png'),uri);
  report.push({file,name,bounds:result.bounds,vertices:result.vertices,triangles:result.triangles});console.log(name);
 }
 saveJson(path.join(out,'report.json'),{reviewed:false,releaseEligible:false,sameCameraMaterial:true,candidates:report});
 const html='<!doctype html><meta charset="utf-8"><title>Hand candidates</title><style>body{font:16px system-ui;background:#eef0f3;color:#242931;margin:30px}article{background:white;padding:20px;margin-bottom:24px;border-radius:12px}.views{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}img{width:100%}h1{font-size:24px}h2{font-size:18px}p{color:#56606b}</style><h1>Scene-specific hand candidates</h1><p>Identical scale, cameras and material. Candidate appearance review only; wrist attachment and shaft clearance remain separate checks.</p>'+report.map(r=>'<article><h2>'+r.name+'</h2><div class="views">'+['palm','back','edge','oblique'].map(v=>'<div><img src="'+r.name+'-'+v+'.png"><p>'+v+'</p></div>').join('')+'</div></article>').join('');
 fs.writeFileSync(path.join(out,'comparison.html'),html,{flag:'wx'});
}finally{await b.close();}
