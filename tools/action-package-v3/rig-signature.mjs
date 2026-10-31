// Capture a model's reference rig signature once (bone names + rest bone lengths).
//   node tools/action-package-v3/rig-signature.mjs --recipe <any recipe of that model> [--model profile@version] [--write]
// Without --write it prints the measurement and, when a reference exists, the comparison.
import fs from 'node:fs';
import path from 'node:path';
import {loadRecipe,openScene} from './recipe-scene.mjs';
import {measureRig,compareRig,key} from './model-adapters.mjs';
const REPO=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
const a=process.argv.slice(2),opt=k=>{const i=a.indexOf(k);return i<0?undefined:a[i+1];};
const loaded=await loadRecipe(path.resolve(opt('--recipe')),{model:opt('--model')});
const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
const report={pageErrors:[]};
const file=path.join(REPO,loaded.adapter.rigSignature),hadRef=fs.existsSync(file);
const scene=await openScene(loaded,{size:256,theme:loadTheme(),report});
try{
  const measured={...await measureRig(scene.page),model:key(loaded.adapter)};
  const ref=path.join(REPO,loaded.adapter.referenceSignature);
  const comparison=fs.existsSync(ref)?compareRig(JSON.parse(fs.readFileSync(ref,'utf8')),measured,loaded.adapter.tolerance):null;
  if(a.includes('--write')){if(hadRef)throw Error('Reference exists; signatures are immutable: '+file);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(measured,null,2)+'\n',{flag:'wx'});}
  console.log(JSON.stringify({model:measured.model,bones:measured.bones.length,comparison,written:a.includes('--write')?path.relative(REPO,file):null,pageErrors:report.pageErrors}));
}finally{await scene.browser.close();}
