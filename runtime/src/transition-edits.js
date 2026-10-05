import { createFlareSequence } from './flare-sequence.js';

export const TRANSITION_STORAGE_KEY = 'flare-transition-library-v1';
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
  const ids = new Set();
  for (const point of document.points) {
    if (typeof point?.id !== 'string' || !point.id.trim() || ids.has(point.id)) throw new Error('修正点需要独立的编号。');
    ids.add(point.id);
    if (point.name !== undefined && (typeof point.name !== 'string' || point.name.length > 80)) throw new Error('修正名称需在 80 字以内。');
  }
  try {
    createFlareSequence(sequence.steps, { period: sequence.period, corrections: document.points, interpolation });
    if (document.draft != null) {
      if (document.draft.name !== undefined && (typeof document.draft.name !== 'string' || document.draft.name.length > 80)) throw new Error('Invalid draft name.');
      if (!Number.isInteger(document.draft.segment) || document.draft.segment < 0 || document.draft.segment >= sequence.steps.length ||
        typeof document.draft.at !== 'number' || !Number.isFinite(document.draft.at) || document.draft.at < 0 || document.draft.at > 1) throw new Error('Invalid draft.');
      createFlareSequence([{ pose: document.draft.pose }], { period: 1 });
    }
  }
  catch { throw new Error('修正点的位置或姿势无效，请检查后重新导入。'); }
  return { ...clone(document), interpolation };
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

export function transitionOptions(document) {
  return {
    corrections: document.enabled ? clone(document.points) : [],
    legPath: document.enabled ? document.legPath : 'linear',
    interpolation: document.enabled ? document.interpolation ?? 'smooth' : 'smooth',
  };
}
