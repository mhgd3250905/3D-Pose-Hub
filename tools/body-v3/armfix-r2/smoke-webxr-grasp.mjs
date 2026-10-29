import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {pinnedRuntime,verifyRuntimeSelection,saveJson} from './hand-qa-runtime.mjs';
const [viewer,runtimeFile,exportsDir]=process.argv.slice(2);
const info=JSON.parse(fs.readFileSync(path.join(viewer,'server-info.json'),'utf8'));
const rt=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(rt);
const {chromium}=await import(pathToFileURL(rt.playwrightModule.path).href);
const browser=await chromium.launch({executablePath:rt.browserExecutable.path,headless:true,args:rt.chromiumArgs});
const report={url:info.url,input:info.input,pageErrors:[],exports:[],reviewed:false,releaseEligible:false};
try{
 const page=await browser.newPage({viewport:{width:1100,height:900}});page.on('pageerror',e=>report.pageErrors.push(e.message));
 await page.goto(info.url);await page.waitForFunction(()=>window.__graspReady==='right');
 report.gpu=await page.evaluate(()=>{const gl=__graspPreview.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);});
 if(report.gpu!==rt.actualWebGLRenderer)throw Error('GPU mismatch');
 await page.selectOption('#side','left');await page.waitForFunction(()=>window.__graspReady==='left');
 for(const id of ['rod','rod','wire','wire','back','reset'])await page.click('#'+id);
 await page.screenshot({path:path.join(viewer,'viewer-left.png')});
 await page.selectOption('#side','right');await page.waitForFunction(()=>window.__graspReady==='right');
 report.title=await page.locator('#title').textContent();
 await page.screenshot({path:path.join(viewer,'viewer-right.png')});
 for(const side of ['left','right'])for(const [suffix,expectedMeshes]of [['hand-only',1],['grasp-with-separate-shaft',2]]){
  const file=path.join(exportsDir,side+'-'+suffix+'.glb'),raw=fs.readFileSync(file);
  if(raw.readUInt32LE(0)!==0x46546c67||raw.readUInt32LE(4)!==2||raw.readUInt32LE(8)!==raw.length)throw Error('Invalid GLB '+file);
  const json=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)).toString('utf8'));
  if(json.meshes.length!==expectedMeshes||json.skins?.length||json.animations?.length)throw Error('Unexpected static GLB structure '+file);
  report.exports.push({file,bytes:raw.length,meshes:json.meshes.length,static:true});
 }
 if(report.pageErrors.length)throw Error(report.pageErrors.join('\n'));
 report.viewerControlsPassed=true;saveJson(path.join(viewer,'smoke.json'),report);console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
