import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const [out,runtimeFile]=process.argv.slice(2);if(!out||!runtimeFile||fs.existsSync(out))throw Error('New output directory and pinned runtime required');fs.mkdirSync(out,{recursive:true});
const runtime=JSON.parse(fs.readFileSync(runtimeFile,'utf8'));process.env.PLAYWRIGHT_MODULE=runtime.playwrightModule.path;process.env.CHROMIUM_ARGS=runtime.chromiumArgs.join(' ');
const {loadTheme}=await import(pathToFileURL(path.join(repo,'drill-anim/lib/config.mjs')));
for(const name of ['training-human-v3-completed-r7','training-human-v3-armfix-r2']){const model=await import(pathToFileURL(path.join(repo,'drill-anim/models/'+name+'/loader.mjs')));
const {exportGripInput}=await import('./grip-export.mjs');
const source=(await import(pathToFileURL(path.join(repo,'drill-anim/specs/h-db-reverse-curl-r2.js')))).default;
const spec={...source,runtimeModel:{profile:'training-human-v3-armfix',version:'0.1.0-r1'},v2plus:{...source.v2plus,handPose:{left:'open',right:'open'}}};
const {b,p}=await model.boot({size:640,pr:1,theme:loadTheme()});
try{
 await model.applyV3(p,spec);
 const {exportAppearanceRest}=await import(pathToFileURL(path.join(repo,'drill-anim/models/training-human-v3-armfix-r2/export-appearance.mjs')));const data=await exportAppearanceRest(p);fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(data));console.log(name+' exported');
}finally{await b.close();}
}
