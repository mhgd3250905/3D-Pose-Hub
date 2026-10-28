// usage: node v3probe.mjs <v2|v3> <out.png>  bind/reset pose front render of the bare glb body + joints
import fs from 'node:fs';import {pathToFileURL} from 'node:url';const R='/workspace/ph/drill-anim/';
const [ver,out]=process.argv.slice(2);
const {boot}=await import(pathToFileURL(ver==='v3'?R+'models/training-human-v3/boot-v3.mjs':R+'lib/boot.mjs').href);const {loadTheme}=await import(pathToFileURL(R+'lib/config.mjs').href);
const {b,p}=await boot({size:700,pr:1,theme:loadTheme()});
try{const r=await p.evaluate(()=>{const T=__toonT,v=flareInspector.viewer;v.motion.reset();v.coach.updateMatrixWorld(true);
  const c=new T.PerspectiveCamera(30,1,0.05,20);c.position.set(0,0.9,3.6);c.lookAt(0,0.9,0);v.renderer.setClearColor(0,1);v.renderer.render(v.scene,c);
  const P=n=>v.coach.getObjectByName(n)?.getWorldPosition(new T.Vector3()).toArray().map(x=>+x.toFixed(3));const o={warp:v.bodyV3||null};
  for(const n of['pelvis','torso','head','leftUpperArm','leftForearm','leftHand','leftThigh','leftShin','leftFoot'])o[n]=P(n);
  const bb=new T.Box3().setFromObject(v.coach);o.bbox=[bb.min.y.toFixed(3),bb.max.y.toFixed(3)];return {o,url:v.renderer.domElement.toDataURL('image/png')};});
 fs.writeFileSync(out,Buffer.from(r.url.split(',')[1],'base64'));console.log(ver,JSON.stringify(r.o));}finally{await b.close();}
