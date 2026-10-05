import savedUpdate from '../public/coach/saved-right-mirrors-2026-10-05.json' with { type: 'json' };

export const SAVED_RIGHT_MIRROR_BACKUP_KEY='flare-saved-right-mirror-backup-20261005';
const LIBRARY_KEY='flare-pose-library-v1';
const clone=value=>JSON.parse(JSON.stringify(value));

function sameStructure(a,b){
  if(typeof a==='number'||typeof b==='number')return typeof a==='number'&&typeof b==='number'&&Number.isFinite(a)&&Number.isFinite(b)&&a===b;
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  if(Array.isArray(a))return a.length===b.length&&a.every((value,index)=>sameStructure(value,b[index]));
  const keys=Object.keys(a);
  return keys.length===Object.keys(b).length&&keys.every(key=>Object.hasOwn(b,key)&&sameStructure(a[key],b[key]));
}

/** Append the bundled mirrors only to the matching saved user library.
 * The raw prior library is backed up before any library write. Failed writes
 * never return an applied update, so the editor retains its existing data.
 */
export function applySavedMirrorUpdate(storage,{libraryKey=LIBRARY_KEY,update=savedUpdate}={}){
  let library=null;
  const skipped=reason=>({applied:false,addedCount:0,library,reason});
  try{
    const raw=storage.getItem(libraryKey);
    if(raw===null)return skipped('no-library');
    library=JSON.parse(raw);
    if(library?.version!==1||!Array.isArray(library.steps))return skipped('invalid-library');
    if(update?.format!=='flare-saved-mirror-update'||update.version!==1||typeof update.id!=='string'||!update.id||
       !Array.isArray(update.requiredStepIds)||update.requiredStepIds.length!==13||new Set(update.requiredStepIds).size!==13||
       !update.requiredStepIds.every(id=>typeof id==='string'&&id)||
       !Array.isArray(update.sourceSteps)||update.sourceSteps.length!==3||
       !Array.isArray(update.steps)||update.steps.length!==3)return skipped('invalid-update');
    const markers=library.projectMirrorUpdates??[];
    if(!Array.isArray(markers))return skipped('invalid-marker');
    if(markers.includes(update.id))return skipped('already-applied');
    const ids=new Set(library.steps.map(step=>step?.id));
    if(!update.requiredStepIds.every(id=>ids.has(id)))return skipped('missing-steps');
    for(const source of update.sourceSteps){
      if(!source?.id||!update.requiredStepIds.includes(source.id)||!source.pose)return skipped('invalid-source');
      const original=library.steps.find(step=>step?.id===source.id);
      if(!sameStructure(original?.pose,source.pose))return skipped('source-changed');
    }
    const additions=[];
    for(const step of update.steps){
      if(typeof step?.id!=='string'||!step.id||typeof step.name!=='string'||!step.pose)return skipped('invalid-step');
      if(ids.has(step.id))continue;
      ids.add(step.id);additions.push(clone(step));
    }
    if(additions.length===0)return skipped('mirrors-already-present');
    const updated={...library,steps:[...library.steps,...additions],projectMirrorUpdates:[...markers,update.id]};
    const nextRaw=JSON.stringify(updated);
    if(storage.getItem(SAVED_RIGHT_MIRROR_BACKUP_KEY)===null){
      storage.setItem(SAVED_RIGHT_MIRROR_BACKUP_KEY,raw);
      if(storage.getItem(SAVED_RIGHT_MIRROR_BACKUP_KEY)!==raw)return skipped('backup-failed');
    }
    storage.setItem(libraryKey,nextRaw);
    if(storage.getItem(libraryKey)!==nextRaw)return skipped('library-write-failed');
    return {applied:true,addedCount:additions.length,library:updated,updateId:update.id};
  }catch{return skipped('storage-or-data-error');}
}
