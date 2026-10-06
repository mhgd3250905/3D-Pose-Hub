import { createFlareSequence } from './flare-sequence.js';
import { validateFootCurves } from './foot-curves.js';
import { validateSegmentGuides } from './segment-guides.js';
import {
  OFFICIAL_FLARE_SEQUENCE, OFFICIAL_LOOP_UPGRADE_BACKUP_KEY, OFFICIAL_LOOP_UPGRADE_MARKER_KEY,
  validSequence, saveOfficialSequence, restoreOfficialSequence, samePose,
} from './official-poses.js';

export const TRANSITION_STORAGE_KEY = 'flare-transition-library-v1';
// Keep these in sync with the private keys used by the official sequence helpers.
const OFFICIAL_SEQUENCE_STORAGE_KEY = 'flare-demonstration-v1';
const OFFICIAL_SEQUENCE_BACKUP_KEY = 'flare-demonstration-backup-v1';
const officialFrameStorageKeys = [
  OFFICIAL_SEQUENCE_STORAGE_KEY, OFFICIAL_SEQUENCE_BACKUP_KEY,
  OFFICIAL_LOOP_UPGRADE_MARKER_KEY, OFFICIAL_LOOP_UPGRADE_BACKUP_KEY, TRANSITION_STORAGE_KEY,
];
const clone = value => structuredClone(value);
const canonical = value => JSON.stringify(value, (_, child) => child && typeof child === 'object' && !Array.isArray(child)
  ? Object.fromEntries(Object.keys(child).sort().map(key => [key, child[key]])) : child);
const baseOf = sequence => ({ period: sequence.period, steps: sequence.steps.map(step => ({ id: step.id, pose: clone(step.pose) })) });

export function compatibleTransitionEdits(document, sequence) {
  return canonical(document?.base) === canonical(baseOf(sequence));
}

export function createTransitionEdits(sequence) {
  return { format: 'flare-transition-edits', version: 1, base: baseOf(sequence), enabled: true, legPath: 'arc', interpolation: 'smooth', points: [] };
}

export function validateTransitionEdits(document, sequence) {
  if (document?.format !== 'flare-transition-edits' || document.version !== 1 || !Array.isArray(document.points) || document.points.length > 200) {
    throw new Error('请使用有效的过渡修正 JSON，最多保存 200 个修正点。');
  }
  if (!compatibleTransitionEdits(document, sequence)) throw new Error('这份过渡修正属于另一组关键姿势。请先恢复对应的正式展示，现有修正仍保留。');
  if (typeof document.enabled !== 'boolean' || !['arc', 'linear'].includes(document.legPath)) throw new Error('过渡设置不完整。');
  const interpolation = Object.hasOwn(document, 'interpolation') ? document.interpolation : 'smooth';
  if (!['smooth', 'linear'].includes(interpolation)) throw new Error('请选择线性或平滑补帧。');
  const footCurves = validateFootCurves(Object.hasOwn(document, 'footCurves') ? document.footCurves : []);
  const segmentGuides = validateSegmentGuides(Object.hasOwn(document, 'segmentGuides') ? document.segmentGuides : [], sequence);
  const stepIds = new Set(sequence.steps.map(step => step.id));
  for (const curve of footCurves) for (const ref of [curve.from, curve.to]) {
    if (ref.kind === 'step' && !stepIds.has(ref.id)) throw new Error('脚部弧线的原关键帧不属于当前动画。');
  }
  const skippedSteps = Object.hasOwn(document, 'skippedSteps') ? document.skippedSteps : [];
  if (!Array.isArray(skippedSteps) || skippedSteps.some(index => !Number.isInteger(index) || index < 0 || index >= sequence.steps.length) || new Set(skippedSteps).size !== skippedSteps.length) {
    throw new Error('跳过的原关键帧需要互不重复的有效位置。');
  }
  const skipped = new Set(skippedSteps), last = sequence.steps.length - 1;
  if (samePose(sequence.steps[0].pose, sequence.steps[last].pose) && (skipped.has(0) || skipped.has(last))) {
    skipped.add(0);skipped.add(last);
  }
  const ids = new Set();
  for (const point of document.points) {
    if (typeof point?.id !== 'string' || !point.id.trim() || ids.has(point.id)) throw new Error('修正点需要独立的编号。');
    ids.add(point.id);
    if (point.name !== undefined && (typeof point.name !== 'string' || point.name.length > 80)) throw new Error('修正名称需在 80 字以内。');
    if (Object.hasOwn(point, 'skipped') && typeof point.skipped !== 'boolean') throw new Error('中间关键帧的跳过状态需要为 true 或 false。');
  }
  if (sequence.steps.length === skipped.size && (!document.enabled || !document.points.some(point => !point.skipped))) {
    throw new Error('至少保留一个启用的关键帧，才能自动补帧。');
  }
  try {
    createFlareSequence(sequence.steps, { period: sequence.period, corrections: document.points, interpolation });
    if (skipped.size) createFlareSequence(sequence.steps, {
      period: sequence.period, interpolation, skippedSteps: [...skipped],
      corrections: document.enabled ? document.points.filter(point => !point.skipped) : [],
    });
    if (document.draft != null) {
      if (document.draft.name !== undefined && (typeof document.draft.name !== 'string' || document.draft.name.length > 80)) throw new Error('Invalid draft name.');
      if (!Number.isInteger(document.draft.segment) || document.draft.segment < 0 || document.draft.segment >= sequence.steps.length ||
        typeof document.draft.at !== 'number' || !Number.isFinite(document.draft.at) || document.draft.at < 0 || document.draft.at > 1) throw new Error('Invalid draft.');
      createFlareSequence([{ pose: document.draft.pose }], { period: 1 });
    }
  }
  catch { throw new Error('修正点的位置或姿势无效，请检查后重新导入。'); }
  return { ...clone(document), interpolation,
    ...(Object.hasOwn(document, 'footCurves') ? { footCurves } : {}),
    ...(Object.hasOwn(document, 'segmentGuides') ? { segmentGuides } : {}),
    ...(Object.hasOwn(document, 'skippedSteps') ? { skippedSteps: [...skipped].sort((a, b) => a - b) } : {}) };
}

export function rebaseTransitionEdits(document, previousSequence, nextSequence) {
  if (!validSequence(previousSequence) || !validSequence(nextSequence) ||
    previousSequence.period !== nextSequence.period || previousSequence.steps.length !== nextSequence.steps.length ||
    previousSequence.steps.some((step, index) => step.id !== nextSequence.steps[index].id)) {
    throw new Error('更新原姿态时需保留周期、节点数量与顺序。');
  }
  const validated = validateTransitionEdits(document, previousSequence);
  return validateTransitionEdits({ ...validated, base: baseOf(nextSequence) }, nextSequence);
}

function libraryFrom(storage) {
  const raw = storage?.getItem(TRANSITION_STORAGE_KEY);
  if (raw == null) return { format: 'flare-transition-library', version: 1, entries: [] };
  let library;
  try { library = JSON.parse(raw); } catch { throw new Error('已有过渡数据暂时无法读取，已保留原数据。'); }
  if (library?.format !== 'flare-transition-library' || library.version !== 1 || !Array.isArray(library.entries)) {
    throw new Error('已有过渡数据版本无法读取，已保留原数据。');
  }
  return library;
}

export function loadTransitionEdits(sequence, storage) {
  const document = libraryFrom(storage).entries.find(entry => compatibleTransitionEdits(entry, sequence));
  return document ? validateTransitionEdits(document, sequence) : createTransitionEdits(sequence);
}

export function saveTransitionEdits(document, sequence, storage) {
  const validated = validateTransitionEdits(document, sequence);
  if (!storage) throw new Error('浏览器保存不可用，请先导出过渡 JSON。');
  const library = libraryFrom(storage);
  const index = library.entries.findIndex(entry => compatibleTransitionEdits(entry, sequence));
  if (index >= 0) library.entries[index] = validated;
  else library.entries.push(validated);
  const raw = JSON.stringify(library);
  storage.setItem(TRANSITION_STORAGE_KEY, raw);
  if (storage.getItem(TRANSITION_STORAGE_KEY) !== raw) throw new Error('过渡修正未保存成功，请导出 JSON 备份。');
  return validated;
}

function restoreStorageSnapshot(storage, snapshot) {
  const failures = [];
  for (const [key, original] of [...snapshot].reverse()) {
    let current;
    try { current = storage.getItem(key); } catch {}
    if (current === original) continue;
    let writeError;
    try {
      if (original === null) storage.removeItem(key);
      else storage.setItem(key, original);
    } catch (error) { writeError = error; }
    try {
      if (storage.getItem(key) !== original) throw writeError ?? new Error('原始数据未恢复。');
    } catch (error) { failures.push({ key, error }); }
  }
  return failures;
}

export function saveOfficialFrameEdits(nextSequence, nextDocument, storage, { restore = false } = {}) {
  if (!validSequence(nextSequence)) throw new Error('展示姿势的数据不完整。');
  if (typeof restore !== 'boolean') throw new Error('原姿态保存方式无效。');
  const sequence = clone(nextSequence), document = validateTransitionEdits(nextDocument, sequence);
  if (!storage || ['getItem', 'setItem', 'removeItem'].some(method => typeof storage[method] !== 'function')) {
    throw new Error('浏览器保存不可用，请先导出姿势和过渡 JSON。');
  }
  const snapshot = new Map(officialFrameStorageKeys.map(key => [key, storage.getItem(key)]));
  // Reject unreadable transition data before touching the official sequence.
  libraryFrom(storage);
  const nextRaw = JSON.stringify(sequence);
  const backupRaw = restore ? null : snapshot.get(OFFICIAL_SEQUENCE_STORAGE_KEY) || JSON.stringify(OFFICIAL_FLARE_SEQUENCE);
  const revision = OFFICIAL_FLARE_SEQUENCE.source?.kind === 'saved-loop-9-16' ? OFFICIAL_FLARE_SEQUENCE.source.revision : null;
  try {
    if (restore) restoreOfficialSequence(sequence, storage);
    else saveOfficialSequence(sequence, storage);
    if (storage.getItem(OFFICIAL_SEQUENCE_STORAGE_KEY) !== nextRaw ||
      storage.getItem(OFFICIAL_SEQUENCE_BACKUP_KEY) !== backupRaw ||
      (revision && storage.getItem(OFFICIAL_LOOP_UPGRADE_MARKER_KEY) !== revision) ||
      storage.getItem(OFFICIAL_LOOP_UPGRADE_BACKUP_KEY) !== snapshot.get(OFFICIAL_LOOP_UPGRADE_BACKUP_KEY)) {
      throw new Error('原姿态未保存成功，现有数据已保留。');
    }
    return saveTransitionEdits(document, sequence, storage);
  } catch (error) {
    const rollbackFailures = restoreStorageSnapshot(storage, snapshot);
    if (rollbackFailures.length) {
      throw new Error('保存失败，浏览器同时拒绝恢复部分原数据；请保留当前页面并导出姿势和过渡 JSON。', {
        cause: { saveError: error, rollbackFailures },
      });
    }
    throw new Error('保存失败，原姿态、过渡帧与备份已恢复。' + (error instanceof Error ? ' ' + error.message : ''), { cause: error });
  }
}

export function transitionOptions(document) {
  return {
    corrections: document.enabled ? clone(document.points.filter(point => !point.skipped)) : [],
    legPath: document.enabled ? document.legPath : 'linear',
    interpolation: document.enabled ? document.interpolation ?? 'smooth' : 'smooth',
    ...(document.enabled && document.footCurves?.length ? { footCurves: clone(document.footCurves) } : {}),
    ...(document.enabled && document.segmentGuides?.length ? { segmentGuides: clone(document.segmentGuides) } : {}),
    ...(document.skippedSteps?.length ? { skippedSteps: clone(document.skippedSteps) } : {}),
  };
}
