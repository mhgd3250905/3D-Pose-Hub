import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {boot} from '../../lib/boot.mjs';
import {loadTheme} from '../../lib/config.mjs';
import {applyHandsNative,verifyHandsNative} from './loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const [file,out,frameList='0,60,120,180,239,240']=process.argv.slice(2);
if(!file||!out)throw Error('Usage: preview.mjs spec-file new-output-directory [comma-separated-frames]');
if(fs.existsSync(out))throw Error('Output exists; select a new revision directory');
const spec=(await import(pathToFileURL(path.resolve(file)))).default;
const frames=frameList.split(',').map(Number);if(frames.some(f=>!Number.isInteger(f)||f<0||f>240))throw Error('Frames must be 0..240');
fs.mkdirSync(out,{recursive:true});const theme=loadTheme(),{b,p}=await boot({size:1080,pr:1,theme});
const save=(name,url)=>fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
try{
 const manifest=await applyHandsNative(p,spec);
 await p.evaluate(([s,t])=>{__setHighlight(s.highlight);for(const prop of s.props||[])__props.add(t,prop);__drill.setupCamera(s,1080);},[spec,theme]);
 await p.addScriptTag({content:fs.readFileSync(path.join(here,'../../tools/v2/browser-layers.js'),'utf8')});
 const reports=[];
 for(const f of frames){
  const result=await p.evaluate(([s,f])=>__v2Layers.capture(s,f/30,f,null,['body']),[spec,f]);save('full-'+f,result.body);reports.push({frame:f,...result.metrics});
  if(f!==60&&f!==120)continue;
  for(const side of ['left','right']){
   const shot=await p.evaluate(side=>{
    const T=__toonT,v=flareInspector.viewer,hand=v.coach.getObjectByName(side+'Hand'),q=hand.getWorldQuaternion(new T.Quaternion());
    const center=new T.Vector3(side==='left'?.085:-.085,0,0).applyMatrix4(hand.matrixWorld);
    const direction=new T.Vector3(0,1,.25).applyQuaternion(q).normalize();
    const camera=new T.OrthographicCamera(-.15,.15,.15,-.15,.001,3);camera.up.set(side==='left'?1:-1,0,0).applyQuaternion(q);
    camera.position.copy(center).addScaledVector(direction,.55);camera.lookAt(center);camera.updateMatrixWorld();
    v.renderer.render(v.scene,camera);return v.renderer.domElement.toDataURL('image/png');
   },side);save(`${side}-${f}`,shot);
  }
 }
 const finalManifest=verifyHandsNative();
 if(JSON.stringify(finalManifest.sourceSha256)!==JSON.stringify(manifest.sourceSha256))throw Error('Model sources changed during preview; use a new output directory');
 fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({profile:manifest.id,version:manifest.version,frames,sparse:frames.length!==241,reviewed:false,releaseEligible:false,metrics:reports},null,2)+'\n');
 console.log(out);
}finally{await b.close();}
