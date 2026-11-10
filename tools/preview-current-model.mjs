// The sole entry for new previews using the user's currently approved look.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const self=fileURLToPath(import.meta.url);
export const ROOT=path.resolve(path.dirname(self),'..');
const digest=file=>createHash('sha256').update(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')).digest('hex');
export function readApproved(root=ROOT){
 const resolve=rel=>{const full=path.resolve(root,rel),relative=path.relative(root,full);if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Approval path outside checkout');return full;};
 const pointer=JSON.parse(fs.readFileSync(resolve('drill-anim/models/current-approved-look.json'),'utf8'));
 if(pointer.format!=='pose-hub-approved-look-pointer@1')throw Error('Invalid approved-look pointer');
 const file=resolve(pointer.record);
 if(digest(file)!==pointer.sha256Lf)throw Error('Approved record changed; create a new version');
 const approved=JSON.parse(fs.readFileSync(file,'utf8'));
 if(approved.status!=='visually-approved'||approved.id!==pointer.id||approved.handSelection!=='action-recipe')throw Error('Not an approved recipe-based look');
 for(const [rel,sha] of Object.entries(approved.pinnedSources)){
  const source=resolve(rel);
  if(!fs.existsSync(source))throw Error('Stale checkout: missing approved source '+rel+'; use the approved worktree. Never fall back to an old model.');
  if(digest(source)!==sha)throw Error('Approved source drift: '+rel+'; keep the approved version or create a new candidate.');
 }
 return {pointer,approved};
}
export async function checkRecipe(recipe){
 const state=readApproved();
 const {inspectModelVersion}=await import('./model-version.mjs');
 const version=await inspectModelVersion(recipe);
 if(version.model.profile!==state.approved.baseModel.profile||version.model.version!==state.approved.baseModel.version)throw Error('Recipe model is incompatible with the approved look');
 return {...state,version};
}
async function main(){
 const args=process.argv.slice(2),options={};
 for(let i=0;i<args.length;i+=2){if(!['--recipe','--out'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--')||options[args[i]])throw Error('Usage: --recipe <recipe.json> [--out <new-directory>]');options[args[i]]=args[i+1];}
 if(!options['--recipe'])throw Error('Explicit action recipe required; global defaults are not allowed');
 const state=await checkRecipe(options['--recipe']);
 console.log(JSON.stringify({approvedLook:state.approved.id,sourceCommit:state.approved.sourceCommit,model:state.version.model,hands:state.version.hands,spec:state.version.spec},null,2));
 if(!options['--out'])return;
 const entry=path.resolve(ROOT,state.approved.previewEntry);
 process.argv=[process.execPath,entry,options['--recipe'],options['--out']];
 await import(pathToFileURL(entry));
 const out=path.resolve(options['--out']);
 fs.writeFileSync(path.join(out,'approved-look.json'),JSON.stringify(state.approved,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(path.join(out,'approved-preflight.json'),JSON.stringify(state.version,null,2)+'\n',{flag:'wx'});
}
if(process.argv[1]&&path.resolve(process.argv[1])===self)main().catch(error=>{console.error(error.message);process.exitCode=1;});
