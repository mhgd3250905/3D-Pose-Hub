// hand candidate renders: node candrender.mjs <handDir> <outdir>  (v3 body, handScale 1.18 -> ~187 mm hands)
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';const R='/workspace/ph/drill-anim/';const imp=f=>import(pathToFileURL(R+f).href);
const [handDir,out]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});const SZ=480;
const {loadTheme}=await imp('lib/config.mjs');const L3=await imp('models/training-human-v3/loader.mjs');
const spec0=f=>import(pathToFileURL(R+'specs/'+f).href).then(m=>({...structuredClone(m.default),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'}}));
const VP={outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'};const stand=await spec0('h-squat.js'),plank=await spec0('h-bear-plank.js');stand.v2plus={...VP,...(stand.v2plus||{})};plank.v2plus={...VP,...(plank.v2plus||{}),handPose:{left:'palm-floor',right:'palm-floor'}};
const {b,p}=await L3.boot({size:SZ,pr:1,theme:loadTheme()});
const png=(n,u)=>fs.writeFileSync(path.join(out,n+'.png'),Buffer.from(u.split(',')[1],'base64'));
const SHOT=`window.__shot=(pos,look,fov)=>{const T=__toonT,v=flareInspector.viewer,R=v.renderer;R.setClearColor(0x101318,1);const c=new T.PerspectiveCamera(fov,1,0.02,20);c.position.set(...pos);c.lookAt(...look);c.updateProjectionMatrix();R.render(v.scene,c);return R.domElement.toDataURL('image/png');};
window.__hf=(s,lx,ly,lz)=>{const T=__toonT,h=flareInspector.viewer.coach.getObjectByName(s+'Hand');h.updateMatrixWorld(true);return new T.Vector3(lx,ly,lz).applyMatrix4(h.matrixWorld).toArray();};`;
try{
 await L3.applyV3(p,stand,{handScale:1.18,handDir});await p.addScriptTag({content:SHOT});
 await p.addScriptTag({content:fs.readFileSync(R+'tools/v2/browser-layers.js','utf8')});
 await p.evaluate(s=>__drill.selectModelProfile(s),stand);
 const o=await p.evaluate(()=>{const v=flareInspector.viewer,o={};o.on=__v2p.hands.on;v.motion.reset();v.coach.updateMatrixWorld(true);
  for(const s of['left','right'])__v2p.setHandPose(s,'relaxed');v.coach.updateMatrixWorld(true);
  const c=__hf('left',0.02,0,0);o.stand=__shot([c[0]+0.35,c[1]+0.12,c[2]+0.75],[c[0],c[1]-0.03,c[2]],32);
  for(const s of['left','right'])__v2p.setHandPose(s,'open');v.coach.updateMatrixWorld(true);
  const m=__hf('left',0.08,0,0.02);o.back=__shot(__hf('left',0.08,0.42,0.02),m,30);o.palm=__shot(__hf('left',0.08,-0.42,0.02),m,30);return o;});
 for(const k in o)if(k!=='on')png(k,o[k]);console.log('v2p on',o.on);
 await p.evaluate(([s,z])=>{__setHighlight(s.highlight);__drill.setupCamera(s,z);},[plank,SZ]);
 await p.evaluate(s=>__drill.selectModelProfile(s),plank);await p.evaluate(([s])=>__v2Layers.capture(s,0,0,null,['body']),[plank]);
 const q=await p.evaluate(()=>{const c=__hf('left',0.06,0,0);return __shot([c[0]+0.45,c[1]+0.3,c[2]+0.55],c,34);});png('plank',q);
 console.log('ok',handDir);
}finally{await b.close();}
