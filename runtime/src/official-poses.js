import bundled from '../public/coach/flare-sequence.json' with {type:'json'};
import beforeWebV41 from '../public/coach/flare-sequence-before-web-v41.json' with {type:'json'};
import { createFlareSequence } from './flare-sequence.js';

export const OFFICIAL_FLARE_SEQUENCE=bundled;
export const OFFICIAL_LOOP_UPGRADE_BACKUP_KEY='flare-demonstration-before-loop-20261005';
export const OFFICIAL_LOOP_UPGRADE_MARKER_KEY='flare-demonstration-loop-upgrade-20261005';
export const MOTION_V41_UPGRADE_MARKER_KEY='flare-demonstration-motion-v41-upgrade';
export const MOTION_V41_UPGRADE_BACKUP_KEY='flare-demonstration-before-motion-v41';
export const MOTION_V41_SELECTION_BACKUP_KEY='flare-demonstration-v41-selection-history';
const KEY='flare-demonstration-v1';
const BACKUP='flare-demonstration-backup-v1';
const LOOP_NUMBERS=[9,10,11,12,13,14,15,16,9];
const PHASES=new Set(['front','sideA','rear','sideB']);
const clone=value=>JSON.parse(JSON.stringify(value));
const parse=raw=>{try{return JSON.parse(raw||'null');}catch{return null;}};
const loopRevision=()=>bundled.source?.kind==='saved-loop-9-16'?bundled.source.revision:null;

export function sequenceFromSavedSteps(steps){
  if(!Array.isArray(steps)||(steps.length!==9&&steps.length<16))throw new Error('请保存至少 16 个步骤，或准备完整的 9 步循环，再用于正式展示。');
  const fromLoop=steps.length>=16;
  let selected=steps;
  if(fromLoop){
    const sourceIds=bundled.source?.stepIds;
    const matching=Array.isArray(sourceIds)&&sourceIds.length===9&&sourceIds.every(id=>steps.some(step=>step?.id===id));
    selected=matching?sourceIds.map(id=>steps.find(step=>step?.id===id)):LOOP_NUMBERS.map(number=>steps[number-1]);
  }
  createFlareSequence(selected,{period:9});
  if(selected.some(step=>typeof step.name!=='string'||!step.name.trim()))throw new Error('每个展示步骤都需要名称。');
  const source=fromLoop?
    {...clone(bundled.source),origin:'browser-saved-steps',stepNumbers:[...LOOP_NUMBERS],stepIds:selected.map(step=>step.id)}:
    {kind:'saved-browser-steps',revision:loopRevision(),stepNumbers:steps.map((_,index)=>index+1),stepIds:steps.map(step=>step.id)};
  return {...clone(bundled),source,steps:selected.map((step,index)=>{
    const template=clone(bundled.steps[index]);
    return {...template,name:fromLoop?template.name:step.name,
      phase:!fromLoop&&PHASES.has(step.phase)?step.phase:template.phase,
      sourceStepId:step.id,sourceStepNumber:fromLoop?LOOP_NUMBERS[index]:index+1,
      sourceStepName:step.name,pose:clone(step.pose),mirrored:step.mirrored===true};
  })};
}

export function validSequence(value){
  if(value?.format!=='flare-demonstration'||value.version!==1||value.period!==9||!Array.isArray(value.steps)||value.steps.length!==9)return false;
  const ids=new Set();
  for(const step of value.steps){
    if(typeof step?.id!=='string'||!step.id.trim()||ids.has(step.id)||typeof step.name!=='string'||!step.name.trim()||!PHASES.has(step.phase))return false;
    ids.add(step.id);
  }
  try{createFlareSequence(value.steps,{period:value.period});return true;}catch{return false;}
}

// Saved JSON object key order has no effect on pose identity or loop closure.
export function samePose(a,b){
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  const keys=Object.keys(a);
  return keys.length===Object.keys(b).length&&keys.every(key=>Object.hasOwn(b,key)&&samePose(a[key],b[key]));
}

/** Replace an existing formal keyframe without creating or renaming steps.
 * source.sha256 remains the hash of the original exported source file.
 * When the original end poses match, editing either end keeps that loop closed.
 * The returned sequence and poses are independent copies; nothing is persisted.
 */
export function updateOfficialFrame(sequence,index,pose){
  if(!validSequence(sequence))throw new Error('展示姿势的数据不完整。');
  if(!Number.isInteger(index)||index<0||index>=sequence.steps.length)throw new RangeError('请选择有效的原固定帧。');
  if(sequence.source!==undefined&&(!sequence.source||typeof sequence.source!=='object'||Array.isArray(sequence.source)))throw new TypeError('展示姿势的来源记录不完整。');
  // Validate before cloning: JSON serialization must not hide invalid numbers.
  createFlareSequence([{pose}],{period:1});
  const last=sequence.steps.length-1;
  const linkedEnds=(index===0||index===last)&&samePose(sequence.steps[0].pose,sequence.steps[last].pose);
  const result=structuredClone(sequence);
  result.steps[index].pose=structuredClone(pose);
  if(linkedEnds)result.steps[index===0?last:0].pose=structuredClone(pose);
  result.source={...result.source,origin:'browser-keyframe-edit'};
  return result;
}

export function resolveOfficialSequence(storage){
  if(!storage)return clone(bundled);
  let published=null, snapshot=null;
  try{
    const raw=storage.getItem(KEY);published=parse(raw);
    const validPublished=validSequence(published);
    if(storage.getItem(MOTION_V41_UPGRADE_MARKER_KEY)==='v41')return validPublished?clone(published):clone(bundled);
    const keys=[KEY,BACKUP,'flare-transition-library-v1',OFFICIAL_LOOP_UPGRADE_MARKER_KEY,OFFICIAL_LOOP_UPGRADE_BACKUP_KEY];
    snapshot=Object.fromEntries(keys.map(key=>[key,storage.getItem(key)]));
    // Preserve exact bytes of the selected animation, undo slot and K/routes.
    // Personal pose libraries and drafts are never written during this upgrade.
    if(storage.getItem(MOTION_V41_UPGRADE_BACKUP_KEY)===null){
      const backup=JSON.stringify({format:'flare-motion-upgrade-backup',version:1,target:'v41',storage:snapshot,defaultSequence:beforeWebV41});
      storage.setItem(MOTION_V41_UPGRADE_BACKUP_KEY,backup);
      if(storage.getItem(MOTION_V41_UPGRADE_BACKUP_KEY)!==backup)throw new Error('Motion backup was not stored.');
    }
    // Corrupt state and explicitly authored selections remain recoverable in place.
    if(raw!==null&&!validPublished)return clone(bundled);
    // Timing, routes, phase labels and metadata can be authored without moving
    // a key pose. Only the entire unchanged bundled default is auto-upgraded.
    const isOldDefault=validPublished&&samePose(published,beforeWebV41);
    if(validPublished&&!isOldDefault){
      storage.setItem(MOTION_V41_UPGRADE_MARKER_KEY,'v41');
      return clone(published);
    }
    const undoRaw=raw??JSON.stringify(beforeWebV41),nextRaw=JSON.stringify(bundled);
    storage.setItem(BACKUP,undoRaw);
    if(storage.getItem(BACKUP)!==undoRaw)throw new Error('Motion undo was not stored.');
    storage.setItem(KEY,nextRaw);
    if(storage.getItem(KEY)!==nextRaw)throw new Error('Motion sequence was not stored.');
    storage.setItem(MOTION_V41_UPGRADE_MARKER_KEY,'v41');
    return clone(bundled);
  }catch{
    // A rejected backup or write must not turn a failed migration into data loss.
    if(snapshot)for(const key of [KEY,BACKUP])try{
      if(storage.getItem(key)!==snapshot[key]){
        if(snapshot[key]===null)storage.removeItem(key);else storage.setItem(key,snapshot[key]);
      }
    }catch{}
    return validSequence(published)?clone(published):clone(bundled);
  }
}

export function saveOfficialSequence(sequence,storage){
  if(!validSequence(sequence))throw new Error('展示姿势的数据不完整。');
  if(!storage)throw new Error('本地保存不可用，请先导出你的步骤。');
  const previous=storage.getItem(KEY)||JSON.stringify(bundled);
  const revision=loopRevision();
  if(revision)storage.setItem(OFFICIAL_LOOP_UPGRADE_MARKER_KEY,revision);
  storage.setItem(BACKUP,previous);
  storage.setItem(KEY,JSON.stringify(sequence));
}

/** Explicitly choose the new default, preserving the previous animation and K library. */
export function saveV41DefaultSequence(storage){
  if(!storage)throw new Error('本地备份不可用，请先导出你的动画。');
  const keys=[KEY,BACKUP,OFFICIAL_LOOP_UPGRADE_MARKER_KEY,MOTION_V41_UPGRADE_MARKER_KEY,'flare-transition-library-v1'];
  const snapshot=Object.fromEntries(keys.map(key=>[key,storage.getItem(key)]));
  const historyRaw=storage.getItem(MOTION_V41_SELECTION_BACKUP_KEY);
  const history=historyRaw===null?{format:'flare-motion-selection-history',version:1,entries:[]}:parse(historyRaw);
  if(history?.format!=='flare-motion-selection-history'||history.version!==1||!Array.isArray(history.entries))throw new Error('已有动作备份无法读取，当前动画已保留。');
  history.entries.push({selectedAt:new Date().toISOString(),target:'v41',storage:snapshot});
  const raw=JSON.stringify(history);
  storage.setItem(MOTION_V41_SELECTION_BACKUP_KEY,raw);
  if(storage.getItem(MOTION_V41_SELECTION_BACKUP_KEY)!==raw)throw new Error('动作备份未保存成功，当前动画已保留。');
  try{
    saveOfficialSequence(bundled,storage);
    if(storage.getItem(KEY)!==JSON.stringify(bundled)||storage.getItem(BACKUP)!==(snapshot[KEY]||JSON.stringify(bundled)))throw new Error('动作未保存成功。');
    storage.setItem(MOTION_V41_UPGRADE_MARKER_KEY,'v41');
    return clone(bundled);
  }catch(error){
    for(const key of keys)try{
      if(storage.getItem(key)!==snapshot[key]){
        if(snapshot[key]===null)storage.removeItem(key);else storage.setItem(key,snapshot[key]);
      }
    }catch{}
    throw new Error('采用新版动作失败，之前动画仍保留在独立备份中。',{cause:error});
  }
}

export function previousOfficialSequence(storage){
  try{const sequence=parse(storage?.getItem(BACKUP));return validSequence(sequence)?sequence:null;}catch{return null;}
}

export function restoreOfficialSequence(sequence,storage){
  if(!validSequence(sequence))throw new Error('此前展示的备份不完整。');
  if(!storage)throw new Error('本地保存不可用，请先导出你的步骤。');
  const revision=loopRevision();
  if(revision)storage.setItem(OFFICIAL_LOOP_UPGRADE_MARKER_KEY,revision);
  storage.setItem(KEY,JSON.stringify(sequence));storage.removeItem(BACKUP);
}
