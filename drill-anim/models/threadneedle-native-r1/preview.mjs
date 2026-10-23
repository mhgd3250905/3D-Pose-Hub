import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {boot} from '../../lib/boot.mjs';
import {loadTheme} from '../../lib/config.mjs';
import {applyThreadneedle,verifyThreadneedle} from './loader.mjs';
import spec from '../../specs/h-kneeling-thread-needle-rr1.js';
const here=path.dirname(fileURLToPath(import.meta.url)),out=process.argv[2];
if(!out||fs.existsSync(out))throw Error('Fresh preview output directory required');
fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const write=(f,d)=>fs.writeFileSync(path.join(out,f),JSON.stringify(d),{flag:'wx'});
const frames=[0,30,40,50,60,70,80,90,150,174,200,210,240];
const report={id:spec.id,profile:verifyThreadneedle(),frames,reviewed:false,releaseEligible:false,complete:false,files:[]};
let b;
try{
 const opened=await boot({size:720,pr:1,theme:loadTheme('themes/glow-soft.json')});b=opened.b;const p=opened.p;
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 report.model=await applyThreadneedle(p,spec);
 fs.writeFileSync(path.join(out,'calibration.json'),await p.evaluate(()=>JSON.stringify(__threadneedle.exportCalibration())),{flag:'wx'});
 await p.evaluate(()=>{
  const v=flareInspector.viewer,T=__toonT,box=new T.Box3();v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();v.camera.fov=35;v.camera.updateProjectionMatrix();
  for(const t of [0,3]){__threadneedle.draw(t);for(const s of __threadneedle.source){const a=s.points;for(let i=0;i<a.length;i+=3)box.expandByPoint(new T.Vector3(a[i],a[i+1],a[i+2]));}}
  box.expandByScalar(.04);v.fitBounds(box,new T.Vector3(.65,.55,1.25),1.08);v.camera.updateMatrixWorld();v.renderer.setClearColor(0x101013,1);
  window.__threadneedleCamera={box:[box.min.toArray(),box.max.toArray()],position:v.camera.position.toArray(),target:v.controls.target.toArray()};
 });
 report.camera=await p.evaluate(()=>__threadneedleCamera);
 for(const f of frames){
  const r=await p.evaluate(f=>{
   const row=__threadneedle.draw(f/30),v=flareInspector.viewer;v.renderer.render(v.scene,v.camera);
   return {row,png:v.renderer.domElement.toDataURL('image/png'),geometry:JSON.stringify({row,meshes:__threadneedle.source.map(s=>({name:s.name,points:Array.from(s.mesh.geometry.attributes.position.array)}))})};
  },f);
  if(errors.length)throw Error(errors.join('; '));
  const name=`frame-${String(f).padStart(4,'0')}.png`,bytes=Buffer.from(r.png.split(',')[1],'base64');fs.writeFileSync(path.join(out,name),bytes,{flag:'wx'});report.files.push({path:name,bytes:bytes.length,sha256:hash(bytes)});
  fs.writeFileSync(path.join(out,`geometry-${String(f).padStart(4,'0')}.json`),r.geometry,{flag:'wx'});console.log('091 native preview '+f+'/240');
 }
 for(const[side,dir]of [['rear',[-.65,.55,-1.25]],['side',[1,.35,0]]]){
  const png=await p.evaluate(dir=>{const v=flareInspector.viewer,T=__toonT,box=new T.Box3(new T.Vector3(...__threadneedleCamera.box[0]),new T.Vector3(...__threadneedleCamera.box[1]));__threadneedle.draw(3);v.fitBounds(box,new T.Vector3(...dir),1.08);v.renderer.render(v.scene,v.camera);return v.renderer.domElement.toDataURL('image/png');},dir);
  fs.writeFileSync(path.join(out,'hold-'+side+'.png'),Buffer.from(png.split(',')[1],'base64'),{flag:'wx'});
 }
 report.complete=true;write('review.json',report);
}catch(e){report.error=String(e);write('failed.json',report);throw e;}
finally{if(b)await b.close();}
