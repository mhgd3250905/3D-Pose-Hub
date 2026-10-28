// Projected (screen) hand vs face vs forearm lengths in the squat-bottom view, for one hand version.
import fs from 'node:fs';import {pathToFileURL} from 'node:url';const R='/workspace/ph/drill-anim/';
const {boot}=await import(pathToFileURL(R+'lib/boot.mjs').href);const {loadTheme}=await import(pathToFileURL(R+'lib/config.mjs').href);const {applyNativeOpen}=await import(pathToFileURL(R+'models/native-open-r1/loader.mjs').href);
const [ver,frame='63']=process.argv.slice(2);const base=(await import(pathToFileURL(R+'specs/h-squat.js').href)).default;
const spec={...structuredClone(base),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:ver}};
const rig=JSON.parse(fs.readFileSync(R+`models/hands-native-${ver.split('-')[1]}/hands-rig.json`,'utf8'));const tip=rig.fingers.middle.joints[3];
const theme=loadTheme(),{b,p}=await boot({size:720,pr:1,theme});
try{await applyNativeOpen(p,spec);
 const rest=await p.evaluate(()=>{const v=flareInspector.viewer;v.motion.reset();v.coach.updateMatrixWorld(true);return v.coach.getObjectByName('head').matrixWorld.toArray();});
 await p.evaluate(([s,t])=>{__setHighlight(s.highlight);__drill.setupCamera(s,720);},[spec,theme]);
 await p.addScriptTag({content:fs.readFileSync(R+'tools/v2/browser-layers.js','utf8')});
 await p.evaluate(([s,f])=>__v2Layers.capture(s,f/30,f,null,['body']),[spec,+frame]);
 console.log(JSON.stringify(await p.evaluate(([rest,tip])=>{const T=__toonT,v=flareInspector.viewer,c=v.camera,W=720;v.coach.updateMatrixWorld(true);
  const pr=x=>{const q=x.clone().project(c);return [(q.x+1)*W/2,(1-q.y)*W/2];},d=(a,b)=>{const A=pr(a),B=pr(b);return Math.hypot(A[0]-B[0],A[1]-B[1]);};
  const g=n=>v.coach.getObjectByName(n),P=n=>g(n).getWorldPosition(new T.Vector3());
  const H=g('head'),M=H.matrixWorld.clone().multiply(new T.Matrix4().fromArray(rest).invert());
  const chin=new T.Vector3(0,1.497,0.105).applyMatrix4(M),hair=new T.Vector3(0,1.692,0.125).applyMatrix4(M);
  const o={face_px:d(chin,hair),face_m:chin.distanceTo(hair)};
  for(const s of['left','right']){const h=g(s+'Hand');const t=new T.Vector3(s==='left'?tip[0]:-tip[0],tip[1],tip[2]).applyMatrix4(h.matrixWorld);const w=P(s+'Hand');
   o[s]={hand_px:d(w,t),hand_m:w.distanceTo(t),forearm_px:d(P(s+'Forearm'),w),forearm_m:P(s+'Forearm').distanceTo(w)};}
  return o;},[rest,tip])));}finally{await b.close();}
