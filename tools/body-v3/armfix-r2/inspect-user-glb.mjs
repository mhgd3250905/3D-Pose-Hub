// Read-only GLB inspection. Renders original and untextured clay views separately.
import fs from 'node:fs';import path from 'node:path';
import {REPO,imp,sha,pinnedRuntime,verifyRuntimeSelection,saveJson,saveImage} from './hand-qa-runtime.mjs';
const [file,out,runtimeFile]=process.argv.slice(2);if(!file||!out||!runtimeFile||fs.existsSync(out))throw Error('Expected source GLB, NEW output and pinned runtime');
const raw=fs.readFileSync(file),rt=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(rt);fs.mkdirSync(out,{recursive:true});
const model=await imp('drill-anim/models/training-human-v3-armfix-r2/loader.mjs'),{loadTheme}=await imp('drill-anim/lib/config.mjs'),theme=loadTheme();
const {b,p}=await model.boot({size:900,pr:1,theme});
try{
 await p.route('**/__qa_input_glb__',route=>route.fulfill({status:200,contentType:'model/gltf-binary',body:raw}));
 const result=await p.evaluate(async ({loaderUrl,expectedGpu})=>{
  const T=__toonT,v=flareInspector.viewer;v.animate=()=>{};v.playing=false;
  const renderer=v.renderer,gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),gpu=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);if(gpu!==expectedGpu)throw Error('GPU mismatch');
  const {GLTFLoader}=await import(loaderUrl),gltf=await new GLTFLoader().loadAsync('/__qa_input_glb__');
  const scene=new T.Scene();scene.background=new T.Color(0xe9edf2);scene.add(gltf.scene);gltf.scene.updateMatrixWorld(true);
  const bbox=new T.Box3().setFromObject(gltf.scene),center=bbox.getCenter(new T.Vector3()),size=bbox.getSize(new T.Vector3()),extent=Math.max(...size.toArray()),meshInfo=[],materials=[];
  gltf.scene.traverse(o=>{if(!o.isMesh)return;materials.push([o,o.material]);const g=o.geometry;meshInfo.push({name:o.name,vertices:g.attributes.position.count,triangles:(g.index?.count||g.attributes.position.count)/3,worldMatrix:o.matrixWorld.toArray(),skinned:!!o.isSkinnedMesh});});
  scene.add(new T.HemisphereLight(0xffffff,0x727a89,2));const key=new T.DirectionalLight(0xffffff,2.5);key.position.copy(center).add(new T.Vector3(-1,1.5,2).multiplyScalar(extent));scene.add(key);const fill=new T.DirectionalLight(0xffffff,1);fill.position.copy(center).add(new T.Vector3(1,.8,-2).multiplyScalar(extent));scene.add(fill);
  const clay=new T.MeshStandardMaterial({color:0xc2b7a7,roughness:.85,metalness:0,side:T.DoubleSide}),images={};
  for(const mode of ['original','clay']){
   for(const [o,m]of materials)o.material=mode==='clay'?clay:m;
   for(const [name,offset,up]of [['front',[0,0,1],[0,1,0]],['back',[0,0,-1],[0,1,0]],['left',[-1,0,0],[0,1,0]],['right',[1,0,0],[0,1,0]],['oblique',[.65,.3,1],[0,1,0]],['back-oblique',[-.65,.3,-1],[0,1,0]],['top',[0,1,0],[0,0,-1]],['base',[0,-1,0],[0,0,1]]]){
    const half=extent*.6,camera=new T.OrthographicCamera(-half,half,half,-half,extent*.01,extent*10);camera.position.copy(center).add(new T.Vector3(...offset).normalize().multiplyScalar(extent*3));camera.up.fromArray(up);camera.lookAt(center);camera.updateMatrixWorld();renderer.clear(true,true,true);renderer.render(scene,camera);images[mode+'-'+name]=renderer.domElement.toDataURL('image/png');
   }
  }
  return {images,gpu,bounds:{min:bbox.min.toArray(),max:bbox.max.toArray(),size:size.toArray()},meshes:meshInfo,animations:gltf.animations.length};
 },{loaderUrl:'/@fs/'+path.join(REPO,'node_modules/three/examples/jsm/loaders/GLTFLoader.js').replaceAll('\\','/'),expectedGpu:rt.actualWebGLRenderer});
 for(const [name,uri]of Object.entries(result.images))saveImage(path.join(out,name+'.png'),uri);
 const names=Object.keys(result.images);delete result.images;saveJson(path.join(out,'render-report.json'),{source:{file,bytes:raw.length,sha256:sha(raw)},...result,reviewed:false,releaseEligible:false});
 fs.writeFileSync(path.join(out,'views.html'),'<!doctype html><meta charset="utf-8"><title>GLB inspection</title><style>body{font:16px system-ui;margin:24px;background:#eef1f5}main{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}img{width:100%}figure{margin:0;background:white;padding:12px}</style><h1>Original material / untextured geometry</h1><main>'+names.map(n=>'<figure><img src="'+n+'.png"><figcaption>'+n+'</figcaption></figure>').join('')+'</main>',{flag:'wx'});
 console.log(JSON.stringify(result));
}finally{await b.close();}
