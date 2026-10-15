import { OFFICIAL_FLARE_SEQUENCE, samePose, validSequence, saveOfficialSequence } from './official-poses.js';

export const V42_SELECTION_HISTORY_KEY = 'flare-demonstration-v42-selection-history';
const FORMAL = 'flare-demonstration-v1';
const UNDO = 'flare-demonstration-backup-v1';
const clone = value => structuredClone(value);
export const V42_DEFAULT_SEQUENCE = {
  ...clone(OFFICIAL_FLARE_SEQUENCE),
  // Separate playback identity keeps all v41 K frames and routes in their
  // original library entry instead of applying them to the accepted clip.
  steps: OFFICIAL_FLARE_SEQUENCE.steps.map(step => ({ ...clone(step), id: `${step.id}-v42-r12` })),
  source: { ...clone(OFFICIAL_FLARE_SEQUENCE.source), playback: 'flare-v42-r12' },
};
export function isV42Sequence(sequence) {
  return sequence?.source?.playback === 'flare-v42-r12' && sequence.period === 9 &&
    samePose(sequence.steps, V42_DEFAULT_SEQUENCE.steps) && sequence.motionModel !== 'periodic' &&
    !['corrections', 'footCurves', 'segmentGuides', 'skippedSteps'].some(key => sequence[key]?.length) &&
    sequence.interpolation !== 'linear' && sequence.legPath !== 'linear';
}
/** Existing selections, including an explicit v41 choice, are never migrated. */
export function resolveV42Sequence(storage) {
  try {
    const raw = storage?.getItem(FORMAL);
    if (raw == null) return clone(V42_DEFAULT_SEQUENCE);
    const selected = JSON.parse(raw);
    return clone(validSequence(selected) ? selected : OFFICIAL_FLARE_SEQUENCE);
  } catch { return clone(OFFICIAL_FLARE_SEQUENCE); }
}
/** Commit only after a separate, verified snapshot of all Flare data succeeds. */
export function saveV42DefaultSequence(storage) {
  if (!storage) throw new Error('本地备份不可用，请先导出你的动画。');
  const snapshot = Object.fromEntries(Array.from({ length: storage.length }, (_, i) => storage.key(i))
    .filter(key => key && key.startsWith('flare-') && key !== V42_SELECTION_HISTORY_KEY)
    .map(key => [key, storage.getItem(key)]));
  // Defaults need an undo identity even before a selection was ever persisted.
  const previous = storage.getItem(FORMAL) ?? JSON.stringify(V42_DEFAULT_SEQUENCE);
  const raw = storage.getItem(V42_SELECTION_HISTORY_KEY);
  let history;
  try { history = raw === null ? { format: 'flare-v42-selection-history', version: 1, entries: [] } : JSON.parse(raw); }
  catch { throw new Error('已有动作备份无法读取，当前动画已保留。'); }
  if (history?.format !== 'flare-v42-selection-history' || history.version !== 1 || !Array.isArray(history.entries))
    throw new Error('已有动作备份无法读取，当前动画已保留。');
  history.entries.push({ selectedAt: new Date().toISOString(), target: 'flare-v42-r12', storage: snapshot, previous });
  const backup = JSON.stringify(history);
  storage.setItem(V42_SELECTION_HISTORY_KEY, backup);
  if (storage.getItem(V42_SELECTION_HISTORY_KEY) !== backup) throw new Error('动作备份未保存成功，当前动画已保留。');
  const changed = [FORMAL, UNDO, 'flare-demonstration-loop-upgrade-20261005'];
  const before = Object.fromEntries(changed.map(key => [key, storage.getItem(key)]));
  try {
    saveOfficialSequence(V42_DEFAULT_SEQUENCE, storage);
    storage.setItem(UNDO, previous);
    if (storage.getItem(FORMAL) !== JSON.stringify(V42_DEFAULT_SEQUENCE) || storage.getItem(UNDO) !== previous)
      throw new Error('动作未保存成功。');
    return clone(V42_DEFAULT_SEQUENCE);
  } catch (error) {
    for (const key of changed) try { before[key] === null ? storage.removeItem(key) : storage.setItem(key, before[key]); } catch {}
    throw new Error('采用新版动作失败，之前动画仍保留在独立备份中。', { cause: error });
  }
}

export function createV42Clock(document) {
  const times = document?.frameTimes, sequence = document?.sequenceTime;
  if (!Array.isArray(times) || !Array.isArray(sequence) || times.length !== sequence.length || times.length < 2 ||
      times.some((v, i) => !Number.isFinite(v) || i && v <= times[i - 1]) ||
      sequence.some((v, i) => !Number.isFinite(v) || i && v <= sequence[i - 1]) ||
      Math.abs(times[0]) > 1e-8 || Math.abs(sequence[0]) > 1e-8 || Math.abs(sequence.at(-1) - 9) > 1e-6)
    throw new Error('v42 动作时间映射不完整。');
  const interpolate = (value, from, to) => {
    const t = Math.max(from[0], Math.min(from.at(-1), value));
    let lo = 0, hi = from.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1;if (from[mid] <= t) lo = mid;else hi = mid; }
    return to[lo] + (to[hi] - to[lo]) * (t - from[lo]) / (from[hi] - from[lo]);
  };
  return {
    duration: times.at(-1), toClip: time => interpolate(time, sequence, times),
    toSequence: time => interpolate(time, times, sequence),
    advance(time, seconds, range = null) {
      const startTime = range?.startTime ?? 0, endTime = range?.endTime ?? sequence.at(-1);
      if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || startTime < 0 || endTime > sequence.at(-1) || endTime <= startTime)
        throw new Error('讲解区间需要位于当前保存动画内。');
      const start = this.toClip(startTime), end = this.toClip(endTime), duration = end - start;
      const clip = start + ((this.toClip(time) - start + seconds) % duration + duration) % duration;
      return this.toSequence(clip);
    },
  };
}
