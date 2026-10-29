import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const [out,runtimeFile]=process.argv.slice(2);if(!out||!runtimeFile||fs.existsSync(out))throw Error('New output directory and pinned runtime required');fs.mkdirSync(out,{recursive:true});
const runtime=JSON.parse(fs.readFileSync(runtimeFile,'utf8'));process.env.PLAYWRIGHT_MODULE=runtime.playwrightModule.path;process.env.CHROMIUM_ARGS=runtime.chromiumArgs.join(' ');
const {loadTheme}=await import(pathToFileURL(path.join(repo,'drill-anim/lib/config.mjs')));
const model=await import(pathToFileURL(path.join(repo,'drill-anim/models/training-human-v3-armfix-r1/loader.mjs')));
const {exportGripInput}=await import('./grip-export.mjs');
const source=(await import(pathToFileURL(path.join(repo,'drill-anim/specs/h-db-reverse-curl-r2.js')))).default;
const spec={...source,runtimeModel:{profile:'training-human-v3-armfix',version:'0.1.0-r1'},v2plus:{...source.v2plus,handPose:{left:'open',right:'open'}}};
const {b,p}=await model.boot({size:640,pr:1,theme:loadTheme()});
try{
 await model.applyV3(p,spec);
 await p.evaluate(([s,th])=>{__drill.selectModelProfile(s);for(const prop of s.props)__props.add(th,prop);__drill.applyAt(s,0,null);__props.update();},[spec,loadTheme()]);
 const data=await exportGripInput(p,spec,{frame:0});fs.writeFileSync(path.join(out,'input.json'),JSON.stringify(data));console.log(JSON.stringify({bones:data.mesh.bones.length,vertices:data.mesh.positions.length/3,targets:data.targets.map(t=>({side:t.side,kind:t.kind,radius:t.radius}))}));
}finally{await b.close();}
