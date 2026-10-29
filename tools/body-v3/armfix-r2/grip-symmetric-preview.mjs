import fs from 'node:fs';import path from 'node:path';
import {imp,pinnedRuntime,verifyRuntimeSelection,saveJson,saveImage,handPictures,initView} from './hand-qa-runtime.mjs';
import {makeGripPreset,installGrip,prepareGripSpec} from './grip-symmetric-install.mjs';
import {exportGripInput} from './grip-symmetric-export.mjs';
const [out,runtimeFile,corrective='off']=process.argv.slice(2);if(!out||!runtimeFile||fs.existsSync(out))throw Error('Fresh output directory required');
const rt=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(rt);fs.mkdirSync(out,{recursive:true});
const {loadTheme}=await imp('drill-anim/lib/config.mjs'),model=await imp('drill-anim/models/training-human-v3-armfix-r2/loader.mjs');
const spec=prepareGripSpec((await imp('drill-anim/specs/h-db-reverse-curl-r2.js')).default),theme=loadTheme(),fit=makeGripPreset();
const {b,p}=await model.boot({size:640,pr:1,theme});
try{
 await model.applyV3(p,spec);await initView(p);await installGrip(p,fit);
 if(corrective==='on'){const fix=await imp('drill-anim/models/hand-wrist-corrective-r1/loader.mjs');await fix.install(p);}
 await p.evaluate(([s,theme])=>{for(const prop of s.props)__props.add(theme,prop);},[spec,theme]);
 const cycle=path.join(out,'grip-cycle');fs.mkdirSync(cycle);saveJson(path.join(out,'grasp-fixed.json'),fit);
 for(let k=0;k<=16;k++){
  const t=k*.5;await p.evaluate(([s,t])=>{__drill.applyAt(s,t,null);__props.update();},[spec,t]);
  const data=await exportGripInput(p,spec,{frame:Math.round(t*30)});saveJson(path.join(cycle,'input-'+t+'.json'),data);
  if([0,4,16].includes(k)&&corrective==='off')for(const side of ['left','right']){const images=await handPictures(p,{pose:'grasp',side,prop:true});for(const [view,uri]of Object.entries(images))saveImage(path.join(out,'grasp-'+t+'-'+side+'-'+view+'.png'),uri);}
 }
 saveJson(path.join(out,'report.json'),{samples:17,renderTime:true,corrective,reviewed:false,releaseEligible:false});console.log(JSON.stringify({out,samples:17,corrective}));
}finally{await b.close();}
