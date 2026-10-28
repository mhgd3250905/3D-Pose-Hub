// review renders: node v3render.mjs <v2|v3|v3h> <outdir>   (v2 = v2plus + r3 hands; v3 = training-human-v3 + r8; v3h = v3 + r8 x1.18)
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';const R='/workspace/ph/drill-anim/';const imp=f=>import(pathToFileURL(R+f).href);
const [mode,out]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});const SZ=640;
const {loadTheme}=await imp('lib/config.mjs');const theme=loadTheme();
const L3=mode!=='v2'?await imp('models/training-human-v3/loader.mjs'):null;const {boot}=mode==='v2'?await imp('lib/boot.mjs'):L3;
const spec0=f=>import(pathToFileURL(R+'specs/'+f).href).then(m=>({...structuredClone(m.default),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'}}));
const specs={squat:[await spec0('h-squat.js'),63],plank:[await spec0('h-bear-plank.js'),0],grip:[await spec0('chest-B.js'),0]};
const {b,p}=await boot({size:SZ,pr:1,theme});
const png=(n,u)=>fs.writeFileSync(path.join(out,n+'.png'),Buffer.from(u.split(',')[1],'base64'));
try{
 if(mode==='v2'){const {applyNativeOpen}=await imp('models/native-open-r1/loader.mjs');await applyNativeOpen(p,specs.squat[0]);}
 else await L3.applyV3(p,specs.squat[0],{handScale:mode==='v3h'?1.18:1});
 await p.addScriptTag({content:fs.readFileSync(R+'tools/v2/browser-layers.js','utf8')});
 // static views from the reset pose (fixed cameras)
 const stat=await p.evaluate(()=>{const T=__toonT,v=flareInspector.viewer,o={};v.motion.reset();v.coach.updateMatrixWorld(true);window.__setRelax?.(0,0);
  for(const s of['left','right'])try{__v2p.setHandPose&&__v2p.setHandPose(s,'relaxed');}catch(e){}
  const R=v.renderer;R.setClearColor(0x101318,1);
  const shot=(pos,look,fov=30,ortho=null)=>{let c;if(ortho){c=new T.OrthographicCamera(-ortho,ortho,ortho,-ortho,0.01,20);}else c=new T.PerspectiveCamera(fov,1,0.05,20);c.position.set(...pos);c.lookAt(...look);c.updateProjectionMatrix();R.render(v.scene,c);return R.domElement.toDataURL('image/png');};
  o.front=shot([0,0.9,3.6],[0,0.9,0]);o.side=shot([3.6,0.9,0],[0,0.9,0]);
  const P=n=>v.coach.getObjectByName(n).getWorldPosition(new T.Vector3()).toArray();
  for(const [k,n] of [['shoulder','leftUpperArm'],['elbow','leftForearm'],['wrist','leftHand'],['hip','leftThigh'],['knee','leftShin']]){const c=P(n);o['seam-'+k]=shot([c[0]+0.55,c[1]+0.1,c[2]+0.75],c,30,0.11);}
  // T-pose: swing each arm (upper arm world rotation) so shoulder->wrist points straight out
  for(const s of['left','right']){const sh=new T.Vector3(...P(s+'UpperArm')),wr=new T.Vector3(...P(s+'Hand'));const q=new T.Quaternion().setFromUnitVectors(wr.clone().sub(sh).normalize(),new T.Vector3(s==='left'?1:-1,0,0));
   for(const n of['UpperArm','Forearm','Hand']){const bn=v.coach.getObjectByName(s+n),wp=bn.getWorldPosition(new T.Vector3()),wq=bn.getWorldQuaternion(new T.Quaternion());
    const np=wp.sub(sh).applyQuaternion(q).add(sh),nq=q.clone().multiply(wq),pq=bn.parent.getWorldQuaternion(new T.Quaternion()).invert();bn.position.copy(bn.parent.worldToLocal(np));bn.quaternion.copy(pq.multiply(nq));bn.updateMatrixWorld(true);}}
  v.coach.updateMatrixWorld(true);o.tpose=shot([0,1.0,4.2],[0,1.0,0]);
  const H=n=>P(n)[1];o.metrics={wristY:H('leftHand'),hipY:H('leftThigh'),kneeY:H('leftShin')};return o;});
 for(const k of Object.keys(stat))if(k!=='metrics')png(k,stat[k]);
 for(const [k,[s,f]] of Object.entries(specs)){await p.evaluate(([s,z])=>{__setHighlight(s.highlight);__drill.setupCamera(s,z);},[s,SZ]);
  const r=await p.evaluate(([s,f])=>__v2Layers.capture(s,f/30,f,null,['body']),[s,f]);png(k,r.body);}
 console.log('ok',mode,JSON.stringify(stat.metrics));
}finally{await b.close();}
