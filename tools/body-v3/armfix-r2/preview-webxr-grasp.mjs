// Real, static WebXR grip candidates and separate reference shafts.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import{pathToFileURL}from'node:url';
import{REPO,pinnedRuntime,verifyRuntimeSelection,saveImage,saveJson,sha}from'./hand-qa-runtime.mjs';
const [input,out,runtimeFile,url,propMode='shaft']=process.argv.slice(2);if(!input||!out||!runtimeFile||!url||fs.existsSync(out)||!['shaft','dumbbell'].includes(propMode))throw Error('Expected input, NEW output, runtime, local official-preview URL and optional dumbbell mode');
const rt=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(rt);fs.mkdirSync(out,{recursive:true});
let shellServer,renderUrl=url;if(url==='local'){
 const threeRoot=path.join(REPO,'node_modules/three');
 shellServer=http.createServer((req,res)=>{try{const rel=new URL(req.url,'http://127.0.0.1').pathname;if(rel==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<script type="importmap">{"imports":{"three":"/three/build/three.module.js"}}</script><script type="module">import * as T from "three";const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(innerWidth,innerHeight);document.body.style.margin="0";document.body.appendChild(renderer.domElement);window.__preview={renderer};window.__previewReady=true;</script>');return;}if(!rel.startsWith('/three/'))throw Error('Route');const file=path.resolve(threeRoot,decodeURIComponent(rel.slice(7)));if(!file.startsWith(threeRoot+path.sep))throw Error('Path');res.writeHead(200,{'Content-Type':'text/javascript'});res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>shellServer.listen(0,'127.0.0.1',resolve));renderUrl='http://127.0.0.1:'+shellServer.address().port+'/';
}
const{chromium}=await import(pathToFileURL(rt.playwrightModule.path).href),b=await chromium.launch({executablePath:rt.browserExecutable.path,headless:true,args:rt.chromiumArgs});
const report={format:'pose-hub-webxr-grasp-preview@1',reviewed:false,releaseEligible:false,models:[]};
try{const p=await b.newPage({viewport:{width:900,height:900}});await p.goto(renderUrl);await p.waitForFunction(()=>window.__previewReady);
 for(const side of ['left','right'].filter(side=>fs.existsSync(path.join(input,side+'-grasp.json')))){const file=path.join(input,side+'-grasp.json'),raw=fs.readFileSync(file),data=JSON.parse(raw);
  const result=await p.evaluate(async({data,side,expectedGpu,propMode})=>{
   const T=await import('/three/build/three.module.js'),{GLTFExporter}=await import('/three/examples/jsm/exporters/GLTFExporter.js'),renderer=__preview.renderer,gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),gpu=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);if(gpu!==expectedGpu)throw Error('GPU mismatch');
   const scene=new T.Scene();scene.background=new T.Color(0xe9edf2);scene.add(new T.HemisphereLight(0xffffff,0x6d7786,2));for(const[pos,power]of[[[2,3,4],2.5],[[-3,1,-3],1.2]]){const l=new T.DirectionalLight(0xffffff,power);l.position.fromArray(pos);scene.add(l);}
   const group=new T.Group();group.name=propMode==='dumbbell'?'wrist_anchor':'WebXR_'+side+'_fixed_grasp_candidate';group.userData={side,units:'metres',sourceWristOrigin:[0,0,0],fixedAssembly:true,reviewed:false,releaseEligible:false};scene.add(group);
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));g.setIndex(data.indices||data.index);if(data.normals)g.setAttribute('normal',new T.Float32BufferAttribute(data.normals,3));else g.computeVertexNormals();
   const hand=new T.Mesh(g,new T.MeshStandardMaterial({color:0xc2b7a7,roughness:.85,metalness:0,side:T.DoubleSide}));hand.name=side+'_hand_fixed';group.add(hand);
   const c=data.cylinder,held=new T.Group();held.name=propMode==='dumbbell'?'fixed_project_dumbbell':'separate_reference_shaft';group.add(held);
   const propMaterial=new T.MeshStandardMaterial({color:0x586575,roughness:.6,metalness:.1}),rod=new T.Mesh(new T.CylinderGeometry(c.radius,c.radius,2*c.halfLength,propMode==='dumbbell'?16:64),propMaterial);rod.name='shaft';rod.position.fromArray(c.center);rod.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...c.axis).normalize());held.add(rod);
   if(propMode==='dumbbell'){
    if(Math.abs(c.radius-.016)>1e-9||Math.abs(c.halfLength-.0825)>1e-9)throw Error('Project dumbbell requires 32mm x165mm handle');
    for(const sign of [-1,1]){const plate=new T.Mesh(new T.CylinderGeometry(.042,.042,.060,6),propMaterial);plate.name=sign<0?'plate_minus':'plate_plus';plate.quaternion.copy(rod.quaternion);plate.position.copy(rod.position).addScaledVector(new T.Vector3(...c.axis).normalize(),sign*.111);held.add(plate);}
   }
   group.updateMatrixWorld(true);const propSurfaces=held.children.map(mesh=>{const positions=[],p=new T.Vector3(),a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i++)positions.push(...p.fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld).toArray());return{name:mesh.name,positions,indices:Array.from(mesh.geometry.index.array)};});
   const bounds=new T.Box3().setFromObject(group),target=bounds.getCenter(new T.Vector3()),images={},half=Math.max(...bounds.getSize(new T.Vector3()).toArray())*.6;
   for(const shot of (propMode==='dumbbell'?['dumbbell','handle','hand']:['shaft','hand'])){held.visible=shot!=='hand';for(const mesh of held.children)if(mesh.name.startsWith('plate_'))mesh.visible=shot==='dumbbell';for(const[name,d]of[['palm',[0,.08,1]],['back',[0,.08,-1]],['thumb',[side==='right'?1:-1,0,.05]],['oblique',[side==='right'?.75:-.75,.35,1]]]){const camera=new T.OrthographicCamera(-half,half,half,-half,.001,5);camera.position.copy(target).add(new T.Vector3(...d));camera.up.set(0,1,0);camera.lookAt(target);camera.updateMatrixWorld();renderer.clear(true,true,true);renderer.render(scene,camera);images[shot+'-'+name]=renderer.domElement.toDataURL('image/png');}}
   const exportGlb=async object=>{const bytes=new Uint8Array(await new GLTFExporter().parseAsync(object,{binary:true}));let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(binary);};
   held.visible=true;for(const mesh of held.children)mesh.visible=true;const glb=await exportGlb(group),handGlb=await exportGlb(hand);
   return{images,glb,handGlb,propSurfaces,gpu,vertices:data.positions.length/3,triangles:(data.indices||data.index).length/3,cylinder:c,propMode};
  },{data,side,expectedGpu:rt.actualWebGLRenderer,propMode});
  for(const[name,uri]of Object.entries(result.images))saveImage(path.join(out,side+'-'+name+'.png'),uri);
  const exported=[];for(const[name,payload]of [[side+(propMode==='dumbbell'?'-hand-with-dumbbell.glb':'-grasp-with-separate-shaft.glb'),result.glb],[side+'-hand-only.glb',result.handGlb]]){const bytes=Buffer.from(payload,'base64');fs.writeFileSync(path.join(out,name),bytes,{flag:'wx'});exported.push({file:name,bytes:bytes.length,sha256:sha(bytes)});}
  saveJson(path.join(out,side+'-prop-surfaces.json'),{source:file,sourceSha256:sha(raw),propMode,cylinder:result.cylinder,meshes:result.propSurfaces});delete result.propSurfaces;
  delete result.images;delete result.glb;delete result.handGlb;report.models.push({side,source:file,sha256:sha(raw),exported,...result});console.log(side+' captured');
 }
 saveJson(path.join(out,'report.json'),report);
}finally{await b.close();if(shellServer)await new Promise(resolve=>shellServer.close(resolve));}
