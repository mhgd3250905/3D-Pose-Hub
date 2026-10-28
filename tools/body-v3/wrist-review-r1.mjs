import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const R=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../drill-anim')+path.sep;
const out=process.argv[2]; if(!out) throw Error('Usage: node wrist-review-r1.mjs <new-output-dir>'); fs.mkdirSync(out);
const imp=f=>import(pathToFileURL(R+f).href);
const {loadTheme}=await imp('lib/config.mjs'); const L3=await imp('models/training-human-v3-wrist-r1/loader.mjs');
const spec={...structuredClone((await imp('specs/h-squat.js')).default),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'}};
const {b,p}=await L3.boot({size:420,pr:1,theme:loadTheme()});
const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try {
 await L3.applyV3(p,spec,{handDir:'hands-native-c1r2'});
 await p.addScriptTag({content:`window.__captureWristSide=(side)=>{const T=__toonT,v=flareInspector.viewer;v.motion.reset();for(const s of ['left','right'])__v2p.setHandPose(s,'relaxed');v.coach.updateMatrixWorld(true);const h=v.coach.getObjectByName(side+'Hand');h.updateMatrixWorld(true);const hf=(x,y,z)=>new T.Vector3(x,y,z).applyMatrix4(h.matrixWorld);const c=new T.PerspectiveCamera(22,1,0.02,20);const look=hf(-0.005,0,0),pos=hf(-0.005,0.32,0),up=hf(-1,0,0).sub(hf(0,0,0));c.position.copy(pos);c.up.copy(up);c.lookAt(look);c.updateProjectionMatrix();v.renderer.setClearColor(0x101318,1);v.renderer.render(v.scene,c);return v.renderer.domElement.toDataURL('image/png');};`});
 for(const phase of ['after']) {

  for(const sleeve of ['long','short']) {
   await p.evaluate(s=>__drill.selectModelProfile(s),{...spec,v2plus:{...spec.v2plus,sleeve}});
   for(const side of ['left','right']) {const u=await p.evaluate(s=>__captureWristSide(s),side);fs.writeFileSync(path.join(out,`${phase}-${sleeve}-${side}.png`),Buffer.from(u.split(',')[1],'base64'));}
   console.log(phase,sleeve,'completed');
  }
 }
 fs.writeFileSync(path.join(out,'page-errors.json'),JSON.stringify(errors,null,2));
 if(errors.length)throw Error('page errors detected: '+errors.length);
 console.log('side and sleeve captures completed');
} finally {await b.close();}
