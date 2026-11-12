// Current verified skin repair is separate from the user's approved geometry/look.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {checkRecipe} from './preview-current-model.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [flag,recipe,outFlag,out,...extra]=process.argv.slice(2);
if(flag!=='--recipe'||!recipe||(outFlag&&(outFlag!=='--out'||!out))||extra.length)throw Error('Usage: --recipe <recipe.json> [--out <new-directory>]');
const pointer=JSON.parse(fs.readFileSync(path.join(root,'drill-anim/models/current-skin-coverage.json'),'utf8'));
const resolve=rel=>{const f=path.resolve(root,rel),r=path.relative(root,f);if(r.startsWith('..')||path.isAbsolute(r))throw Error('Version entry outside checkout');return f;};
const manifestFile=resolve(pointer.manifest);
if(!fs.existsSync(manifestFile))throw Error('Stale checkout: current skin repair sources missing; use the documented model worktree. Never fall back to old skins.');
const digest=createHash('sha256').update(fs.readFileSync(manifestFile,'utf8').replace(/\r\n/g,'\n')).digest('hex');
if(digest!==pointer.sha256Lf)throw Error('Skin repair manifest changed; create a new version');
const {verify}=await import(pathToFileURL(resolve(pointer.verifyEntry)));
const state=await checkRecipe(recipe),{manifest}=verify();
if(pointer.id!==manifest.id||pointer.version!==manifest.version)throw Error('Skin repair identity mismatch');
console.log(JSON.stringify({skinRepair:pointer.id+'@'+pointer.version,approvedBase:state.approved.id,model:state.version.model,hands:state.version.hands}));
if(out){process.argv=[process.execPath,resolve(manifest.previewEntry),recipe,out];await import(pathToFileURL(resolve(manifest.previewEntry)));}
