import fs from 'node:fs';import path from 'node:path';import{pathToFileURL}from'node:url';
import{pinnedRuntime,verifyRuntimeSelection,saveJson,sha}from'./hand-qa-runtime.mjs';
const[viewer,runtimeFile]=process.argv.slice(2),info=JSON.parse(fs.readFileSync(path.join(viewer,'server-info.json'),'utf8'));
const rt=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(rt);
const{chromium}=await import(pathToFileURL(rt.playwrightModule.path).href),browser=await chromium.launch({executablePath:rt.browserExecutable.path,headless:true,args:rt.chromiumArgs});
const report={url:info.url,assets:info.assets,pageErrors:[],sides:[],reviewed:false,releaseEligible:false};
try{
 const p=await browser.newPage({viewport:{width:1100,height:900}});p.on('pageerror',e=>report.pageErrors.push(e.message));await p.goto(info.url);await p.waitForFunction(()=>window.__dumbbellReady==='right');
 report.gpu=await p.evaluate(()=>{const gl=__dumbbellPreview.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);});if(report.gpu!==rt.actualWebGLRenderer)throw Error('GPU mismatch');
 for(const side of ['left','right']){
  await p.selectOption('#side',side);await p.waitForFunction(s=>window.__dumbbellReady===s,side);
  const result=await p.evaluate(async()=>{
   const T=await import('/three/build/three.module.js'),g=__dumbbellPreview.group,originalP=g.position.clone(),originalQ=g.quaternion.clone(),meshes=[];g.traverse(o=>{if(o.isMesh)meshes.push(o);});
   const capture=()=>{g.updateMatrixWorld(true);const inv=g.matrixWorld.clone().invert();return meshes.map(m=>new T.Matrix4().multiplyMatrices(inv,m.matrixWorld).toArray());};
   const baseline=capture();let maxRelativeMatrixDelta=0;
   for(const angles of [[0,0,0],[.7,0,0],[-.7,.5,0],[.3,-.7,.4]]){g.position.set(.11,.2,-.09);g.quaternion.setFromEuler(new T.Euler(...angles));const next=capture();for(let j=0;j<next.length;j++)for(let i=0;i<16;i++)maxRelativeMatrixDelta=Math.max(maxRelativeMatrixDelta,Math.abs(next[j][i]-baseline[j][i]));}
   g.position.copy(originalP);g.quaternion.copy(originalQ);g.updateMatrixWorld(true);__dumbbellPreview.render();
   if(meshes.length!==4||maxRelativeMatrixDelta>1e-12)throw Error('Template rigid assembly mismatch');
   return{side:g.userData.side,meshNames:meshes.map(x=>x.name),maxRelativeMatrixDelta,rigidAssemblyPassed:true,root:g.name};
  });report.sides.push(result);
  for(const id of ['plates','plates','prop','prop','wire','wire','front','back','reset'])await p.click('#'+id);
  await p.screenshot({path:path.join(viewer,'template-'+side+'.png')});
 }
 const manifest=JSON.parse(fs.readFileSync(path.join(info.assets,'manifest.json'),'utf8'));for(const r of manifest.files){const raw=fs.readFileSync(path.join(info.assets,r.file));if(raw.length!==r.bytes||sha(raw)!==r.sha256)throw Error('Changed packaged asset '+r.file);}
 if(report.pageErrors.length)throw Error(report.pageErrors.join('\n'));report.packagedHashesVerified=manifest.files.length;report.viewerControlsPassed=true;saveJson(path.join(viewer,'smoke.json'),report);console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
