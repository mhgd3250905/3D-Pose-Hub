// Close-up compare (old v2plus base hand / native r3 / native r4) for one spec; few frames, CPU swiftshader.
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const R='/workspace/ph/drill-anim/';const imp=f=>import(pathToFileURL(R+f).href);
const {boot}=await imp('lib/boot.mjs');const {loadTheme}=await imp('lib/config.mjs');const {applyNativeOpen}=await imp('models/native-open-r1/loader.mjs');const {applyHumanV2plus}=await imp('lib/human-v2plus.mjs');
const [mode,specF,out,frames='0,63']=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const base=(await import(pathToFileURL(specF).href)).default;const spec=structuredClone(base);
const V2={outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'};
if(process.env.SHARE)spec.nativeHands={...(spec.nativeHands||{})};
if(mode==='old'){spec.modelProfile='training-human-v2plus';spec.v2plus=V2;delete spec.nativeHands;}else{spec.modelProfile='training-human-v2plus-hands-native';spec.nativeHands={version:{r4:'1.0.0-r4',r5:'1.0.0-r5',r6a:'1.0.0-r6a',r6b:'1.0.0-r6b'}[mode]||'1.0.0-r3',...(process.env.SHARE?{twistShare:+process.env.SHARE}:{})};}
const theme=loadTheme(),{b,p}=await boot({size:720,pr:1,theme});
try{
 if(mode==='old')await applyHumanV2plus(p,spec);else await applyNativeOpen(p,spec);
 await p.evaluate(([s,t])=>{__setHighlight(s.highlight);__drill.setupCamera(s,720);},[spec,theme]);
 await p.addScriptTag({content:fs.readFileSync(R+'tools/v2/browser-layers.js','utf8')});
 for(const f of frames.split(',').map(Number)){
  const r=await p.evaluate(([s,f])=>__v2Layers.capture(s,f/30,f,null,['body']),[spec,f]);fs.writeFileSync(path.join(out,`${mode}-full-${f}.png`),Buffer.from(r.body.split(',')[1],'base64'));
  for(const side of['left','right']){const url=await p.evaluate(side=>{const T=__toonT,v=flareInspector.viewer,hand=v.coach.getObjectByName(side+'Hand'),q=hand.getWorldQuaternion(new T.Quaternion());
   const c=new T.Vector3(side==='left'?.03:-.03,0,0).applyMatrix4(hand.matrixWorld);const dir=new T.Vector3(0,1,.25).applyQuaternion(q).normalize();
   const cam=new T.OrthographicCamera(-.16,.16,.16,-.16,.001,3);cam.up.set(side==='left'?1:-1,0,0).applyQuaternion(q);cam.position.copy(c).addScaledVector(dir,.6);cam.lookAt(c);cam.updateMatrixWorld();
   v.renderer.render(v.scene,cam);return v.renderer.domElement.toDataURL('image/png');},side);
   fs.writeFileSync(path.join(out,`${mode}-${side}-${f}.png`),Buffer.from(url.split(',')[1],'base64'));}}
 console.log('ok',mode,JSON.stringify(await p.evaluate(()=>window.__wristTwistStats||null)));
}finally{await b.close();}
