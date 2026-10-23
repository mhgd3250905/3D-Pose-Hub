import fs from 'node:fs';import path from 'node:path';import {pathToFileURL}from'node:url';
import {boot}from'../../lib/boot.mjs';import{loadTheme}from'../../lib/config.mjs';import{applyHumanWrist}from'./loader.mjs';
const [file,out]=process.argv.slice(2);if(!file||!out)throw Error('Usage: preview.mjs spec-file output-directory');
const spec=(await import(pathToFileURL(path.resolve(file)))).default;fs.mkdirSync(out,{recursive:true});
const theme=loadTheme('themes/glow-soft.json'),{b,p}=await boot({size:1080,pr:.5,theme});
try{await applyHumanWrist(p,spec);await p.evaluate(([s,t])=>{__setHighlight(s.highlight);for(const prop of s.props||[])__props.add(t,prop);__drill.setupCamera(s,1080);},[spec,theme]);
 const frames=[0,60,90,120,135,150,165,180,204,239];for(const f of frames){const image=await p.evaluate(([s,f])=>{__drill.applyAt(s,f/30,null);__props.update();const v=flareInspector.viewer;v.renderer.render(v.scene,v.camera);return v.renderer.domElement.toDataURL();},[spec,f]);fs.writeFileSync(path.join(out,f+'.png'),Buffer.from(image.split(',')[1],'base64'));}
 fs.writeFileSync(path.join(out,'times.json'),JSON.stringify({fps:30,frames,durationSeconds:8,sparse:true,pendingFullGPU:true},null,2));
}finally{await b.close()}
