import { createFlareSequence } from './flare-sequence.js';
import { validSequence, samePose } from './official-poses.js';
import { rebaseTransitionEdits } from './transition-edits.js';

const clone = value => structuredClone(value);
const identity = value => typeof value === 'string' && Boolean(value.trim()) ? value : null;

function checkSequence(sequence) {
  if (!validSequence(sequence)) throw new Error('当前正式动画的数据不完整，无法恢复原帧。');
  if (sequence.source !== undefined && (!sequence.source || typeof sequence.source !== 'object' || Array.isArray(sequence.source))) {
    throw new Error('当前正式动画的来源记录不完整。');
  }
}

function backupSteps(backup) {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup) || backup.version !== 1) {
    throw new Error('请选择本项目版本 1 的姿势或动画备份。');
  }
  if (backup.format === 'flare-pose-library') {
    if (!Array.isArray(backup.steps) || !backup.steps.length || backup.steps.length > 200) {
      throw new Error('姿势备份需要包含 1–200 个步骤。');
    }
    return backup.steps;
  }
  const sequence = backup.format === 'flare-demonstration' ? backup
    : backup.format === 'flare-transition-edits' ? backup.sequence : null;
  if (!validSequence(sequence)) {
    throw new Error(backup.format === 'flare-transition-edits'
      ? '这份动画备份没有完整的原关键姿态，请选择包含原帧的动画或姿势备份。'
      : '请选择本项目导出的姿势库、正式循环或完整动画 JSON。');
  }
  return sequence.steps;
}

function linkedIndices(sequence, index) {
  const sourceId = identity(sequence.steps[index].sourceStepId);
  return sourceId ? sequence.steps.flatMap((step, at) => step.sourceStepId === sourceId ? [at] : []) : [index];
}

/** Inspect recovery choices without normalizing poses or changing a saved file.
 * An exact formal ID takes precedence over its source identity. Otherwise all
 * ID/sourceStepId matches must identify exactly one backup item. Names, file
 * names and array positions never participate in matching.
 */
export function getOfficialRecoveryFrames(sequence, backup) {
  checkSequence(sequence);
  const saved = backupSteps(backup), duplicateIds = new Set(), seenIds = new Set();
  const sourcePoses = new Map(), conflictingSources = new Set(), owners = new Map();
  for (const step of sequence.steps) {
    const group = identity(step.sourceStepId) ? 'source:' + step.sourceStepId : 'frame:' + step.id;
    for (const id of [identity(step.id), identity(step.sourceStepId)].filter(Boolean)) {
      if (!owners.has(id)) owners.set(id, new Set());
      owners.get(id).add(group);
    }
  }
  for (const step of saved) {
    const id = identity(step?.id), sourceId = identity(step?.sourceStepId);
    if (id && seenIds.has(id)) duplicateIds.add(id);
    if (id) seenIds.add(id);
    if (sourceId && sourcePoses.has(sourceId) && !samePose(sourcePoses.get(sourceId), step.pose)) conflictingSources.add(sourceId);
    if (sourceId) sourcePoses.set(sourceId, step.pose);
  }
  return sequence.steps.map((step, index) => {
    const row = { index, id: step.id, name: step.name, sourceStepId: step.sourceStepId,
      sourceStepNumber: step.sourceStepNumber, linkedIndices: linkedIndices(sequence, index),
      available: false, reason: '', backupIndex: null, backupName: '', pose: null };
    const exact = saved.flatMap((item, at) => item?.id === step.id ? [at] : []);
    const ids = new Set([identity(step.id), identity(step.sourceStepId)].filter(Boolean));
    const matches = exact.length ? exact : saved.flatMap((item, at) =>
      [identity(item?.id), identity(item?.sourceStepId)].some(id => id && ids.has(id)) ? [at] : []);
    if (!matches.length) return { ...row, reason: '这份备份没有该原帧的匹配编号。' };
    if (matches.length !== 1 || duplicateIds.has(identity(saved[matches[0]]?.id))) {
      return { ...row, reason: '备份中的匹配编号重复，无法确定该原帧。' };
    }
    const backupIndex = matches[0], item = saved[backupIndex];
    if (conflictingSources.has(identity(item.sourceStepId))) {
      return { ...row, reason: '备份中同一来源帧的姿态不一致，无法安全恢复。' };
    }
    const matchedOwners = new Set([identity(item.id), identity(item.sourceStepId)]
      .flatMap(id => [...(owners.get(id) ?? [])]));
    if (matchedOwners.size > 1) {
      return { ...row, reason: '备份的原帧编号与来源编号指向不同原帧，无法安全恢复。' };
    }
    if (exact.length && identity(step.sourceStepId) && identity(item.sourceStepId) && step.sourceStepId !== item.sourceStepId) {
      return { ...row, reason: '备份的原帧编号与来源编号不一致，无法安全恢复。' };
    }
    try { createFlareSequence([{ pose: item.pose }], { period: 1 }); }
    catch { return { ...row, reason: '备份中的姿态数据无效，请检查该步骤。' }; }
    return { ...row, available: true, backupIndex, backupName: typeof item.name === 'string' ? item.name : '', pose: clone(item.pose) };
  });
}

/** Build one atomic selective recovery. Persistence belongs to the caller's
 * existing official-frame transaction. Only the selected poses and the bound
 * transition base change; repeated source poses (including both 09 endpoints)
 * receive independent copies of the same recovered pose.
 */
export function restoreOfficialFrames(sequence, edits, backup, indices) {
  const choices = getOfficialRecoveryFrames(sequence, backup);
  if (!Array.isArray(indices) || !indices.length) throw new Error('请先选择需要恢复的原关键帧。');
  if (new Set(indices).size !== indices.length || indices.some(index => !Number.isInteger(index) || index < 0 || index >= choices.length)) {
    throw new Error('请选择互不重复的有效原关键帧。');
  }
  const replacements = new Map();
  for (const index of indices) {
    const choice = choices[index];
    if (!choice.available) throw new Error(choice.reason);
    for (const linked of choice.linkedIndices) {
      if (replacements.has(linked) && !samePose(replacements.get(linked), choice.pose)) {
        throw new Error('备份中同一来源帧的姿态不一致，请只选择要采用的那个版本。');
      }
      replacements.set(linked, choice.pose);
    }
  }
  const restoredIndices = [...replacements.keys()].sort((a, b) => a - b), nextSequence = clone(sequence);
  for (const index of restoredIndices) nextSequence.steps[index].pose = clone(replacements.get(index));
  nextSequence.source = { ...nextSequence.source, origin: 'browser-keyframe-edit' };
  const document = rebaseTransitionEdits(edits, sequence, nextSequence);
  return { sequence: nextSequence, document, restoredIndices,
    restoredStepNumbers: [...new Set(restoredIndices.map(index => sequence.steps[index].sourceStepNumber)
      .filter(Number.isInteger))].sort((a, b) => a - b) };
}
