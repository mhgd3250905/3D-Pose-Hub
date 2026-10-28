// wrist close-ups: node wristrender.mjs <handDir> <outdir>  (v3, handScale 1.18)
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';const R='/workspace/ph/drill-anim/';const imp=f=>import(pathToFileURL(R+f).href);
const [handDir,out]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});const SZ=420;
const {loadTheme}=await imp('lib/config.mjs');const L3=await imp('models/training-human-v3/loader.mjs');
const spec0=f=>import(pathToFileURL(R+'specs/'+f).href).then(m=>({...structuredClone(m.default),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'}}));
const VP={outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'};const stand=await spec0('h-squat.js'),plank=await spec0('h-bear-plank.js');stand.v2plus={...VP,...(stand.v2plus||{})};plank.v2plus={...VP,...(plank.v2plus||{}),handPose:{left:'palm-floor',right:'palm-floor'}};
const {b,p}=await L3.boot({size:SZ,pr:1,theme:loadTheme()});
const png=(n,u)=>fs.writeFileSync(path.join(out,n+'.png'),Buffer.from(u.split(',')[1],'base64'));
const SHOT=`window.__shot=(pos,look,fov,up)=>{const T=__toonT,v=flareInspector.viewer,R=v.renderer;R.setClearColor(0x101318,1);const c=new T.PerspectiveCamera(fov,1,0.02,20);c.position.set(...pos);if(up)c.up.set(...up);c.lookAt(...look);c.updateProjectionMatrix();R.render(v.scene,c);return R.domElement.toDataURL('image/png');};
window.__hf=(s,lx,ly,lz)=>{const T=__toonT,h=flareInspector.viewer.coach.getObjectByName(s+'Hand');h.updateMatrixWorld(true);return new T.Vector3(lx,ly,lz).applyMatrix4(h.matrixWorld).toArray();};`;
try{
 await L3.applyV3(p,stand,{handDir});await p.addScriptTag({content:SHOT});await p.addScriptTag({content:fs.readFileSync(R+'tools/v2/browser-layers.js','utf8')});
 await p.evaluate(s=>__drill.selectModelProfile(s),stand);
 const o=await p.evaluate(()=>{const T=__toonT,v=flareInspector.viewer,o={};v.motion.reset();for(const s of['left','right'])__v2p.setHandPose(s,'relaxed');v.coach.updateMatrixWorld(true);
  const m=__hf('left',-0.005,0,0),D=0.32,up=__hf('left',-1,0,0).map((x,k)=>x-__hf('left',0,0,0)[k]);
  o.dorsal=__shot(__hf('left',-0.005,D,0),m,22,up);o.palmar=__shot(__hf('left',-0.005,-D,0),m,22,up);o.radial=__shot(__hf('left',-0.005,0,D),m,22,up);o.ulnar=__shot(__hf('left',-0.005,0,-D),m,22,up);
  __v2p.setHandPose('left','grip-bar');const h=v.coach.getObjectByName('leftHand');h.quaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-0.75));v.coach.updateMatrixWorld(true);
  const g=__hf('left',0,0,0);const f=v.coach.getObjectByName('leftForearm').getWorldPosition(new T.Vector3());const c=new T.Vector3(...g);const ax=c.clone().sub(f).normalize();
  o.grip=__shot(__hf('left',0,0.02,-0.34),__hf('left',-0.005,0,0),24,[-ax.x,-ax.y,-ax.z]);return o;});
 for(const k in o)png(k,o[k]);
 await p.evaluate(([s,z])=>{__setHighlight(s.highlight);__drill.setupCamera(s,z);},[plank,SZ]);await p.evaluate(s=>__drill.selectModelProfile(s),plank);
 await p.evaluate(([s])=>__v2Layers.capture(s,0,0,null,['body']),[plank]);
 png('plank',await p.evaluate(()=>{const c=__hf('left',0.0,0,0);return __shot([c[0]+0.28,c[1]+0.14,c[2]+0.22],c,30);}));
 console.log('ok',handDir);
}finally{await b.close();}
