import { anchorIdentity, anchorKey } from './foot-curves.js';

const object = value => value && typeof value === 'object' && !Array.isArray(value);
function validPeriod(period) {
  if (typeof period !== 'number' || !Number.isFinite(period) || period <= 0) throw new TypeError('轨迹周期需要为正的有限数值。');
}
function skippedState(value) {
  if (value !== undefined && typeof value !== 'boolean') throw new TypeError('关键帧的跳过状态需要为 true 或 false。');
  return value === true;
}
function suffix(skipped, disabled) { return (skipped ? ' · 已跳过' : '') + (disabled ? ' · 已停用' : ''); }

/** All saved frames are observation boundaries, including skipped originals and
 * disabled/skipped K frames. No pose or draft is read, cloned or returned.
 * Keys reuse the sampler's kind+id identity, never the original export source ID.
 */
export function getTrajectoryAnchors(sequence, document = {}) {
  if (!object(sequence) || !Array.isArray(sequence.steps) || !sequence.steps.length) throw new TypeError('轨迹需要已有的保存关键帧。');
  validPeriod(sequence.period);
  if (!object(document)) throw new TypeError('轨迹的过渡记录需要为对象。');
  const count = sequence.steps.length, timeOf = coordinate => coordinate / count * sequence.period;
  const points = document.points === undefined ? [] : document.points;
  const skippedSteps = document.skippedSteps === undefined ? [] : document.skippedSteps;
  if (!Array.isArray(points) || !Array.isArray(skippedSteps)) throw new TypeError('保存帧与跳过位置需要为数组。');
  if (document.enabled !== undefined && typeof document.enabled !== 'boolean') throw new TypeError('过渡启用状态需要为 true 或 false。');
  const skipped = new Set();
  for (const index of skippedSteps) {
    if (!Number.isInteger(index) || index < 0 || index >= count || skipped.has(index)) throw new TypeError('跳过位置需要互不重复的有效原帧编号。');
    skipped.add(index);
  }
  const keys = new Set(), anchors = [];
  const add = value => {
    if (keys.has(value.key)) throw new TypeError('保存关键帧的身份不能重复。');
    keys.add(value.key);anchors.push(value);
  };
  for (const [index, step] of sequence.steps.entries()) {
    if (!object(step)) throw new TypeError('原关键帧记录需要为对象。');
    const identity = anchorIdentity({ kind: 'step', id: step.id }), time = timeOf(index), isSkipped = skipped.has(index);
    const number = String(Number.isInteger(step.sourceStepNumber) && step.sourceStepNumber > 0 ? step.sourceStepNumber : index + 1).padStart(2, '0');
    const edge = index === 0 ? ' · 起点' : index === count - 1 ? ' · 末帧' : '';
    add({ ...identity, key: anchorKey(identity), index, time,
      label: `原第 ${number} 步${edge} · ${time.toFixed(2)} s${suffix(isSkipped, false)}`,
      skipped: isSkipped, disabled: false, active: !isSkipped });
  }
  for (const point of points) {
    if (!object(point) || !Number.isInteger(point.segment) || point.segment < 0 || point.segment >= count ||
      typeof point.at !== 'number' || !Number.isFinite(point.at) || point.at <= 0 || point.at >= 1) throw new TypeError('K 帧位置需要在有效原帧区间内部。');
    const identity = anchorIdentity({ kind: 'point', id: point.id }), time = timeOf(point.segment + point.at);
    const isSkipped = skippedState(point.skipped), disabled = document.enabled === false;
    const name = typeof point.name === 'string' && point.name.trim() ? ` · ${point.name}` : '';
    add({ ...identity, key: anchorKey(identity), segment: point.segment, at: point.at, time,
      label: `K 帧${name} · ${time.toFixed(2)} s${suffix(isSkipped, disabled)}`,
      skipped: isSkipped, disabled, active: !isSkipped && !disabled });
  }
  return anchors.sort((first, second) => first.time - second.time);
}

function metadata(anchor, period) {
  if (!object(anchor)) throw new TypeError('请选择有效的轨迹关键帧。');
  const identity = anchorIdentity(anchor), key = anchorKey(identity);
  if (anchor.key !== key || typeof anchor.time !== 'number' || !Number.isFinite(anchor.time) || anchor.time < 0 || anchor.time >= period ||
    typeof anchor.label !== 'string' || ['skipped', 'disabled', 'active'].some(field => typeof anchor[field] !== 'boolean')) {
    throw new TypeError('轨迹关键帧的身份、时间或状态无效。');
  }
  // Copy only observation metadata, even if a caller attached an unrelated pose.
  return { ...identity, key, time: anchor.time, label: anchor.label, skipped: anchor.skipped, disabled: anchor.disabled, active: anchor.active,
    ...(identity.kind === 'step' && Number.isInteger(anchor.index) ? { index: anchor.index } : {}),
    ...(identity.kind === 'point' && Number.isInteger(anchor.segment) ? { segment: anchor.segment } : {}),
    ...(identity.kind === 'point' && typeof anchor.at === 'number' ? { at: anchor.at } : {}) };
}

/** Resolve a forward observation window, without filtering or rebuilding the
 * playback anchors. from/to.time are unfolded; clock retains the saved time.
 * includeTimes includes every saved original/K in that window, active or not,
 * including its next-cycle copy when necessary. Pass these times directly to
 * sampleTrajectory alongside the unchanged current animation options.
 */
export function resolveTrajectoryRange(anchors, selection, period) {
  validPeriod(period);
  if (!Array.isArray(anchors) || !anchors.length || !object(selection) ||
    typeof selection.fromKey !== 'string' || typeof selection.toKey !== 'string') throw new TypeError('请选择轨迹的起点和终点关键帧。');
  if (selection.fromKey === selection.toKey) throw new Error('轨迹起点和终点需要选择不同的关键帧。');
  const values = anchors.map(anchor => metadata(anchor, period)), keys = new Set();
  for (const anchor of values) { if (keys.has(anchor.key)) throw new TypeError('轨迹关键帧身份不能重复。');keys.add(anchor.key); }
  const from = values.find(anchor => anchor.key === selection.fromKey), to = values.find(anchor => anchor.key === selection.toKey);
  if (!from || !to) throw new Error('选择的关键帧已不存在，请重新选择轨迹范围。');
  const startTime = from.time, wraps = to.time <= startTime, endTime = to.time + (wraps ? period : 0);
  if (!Number.isFinite(endTime) || endTime <= startTime) throw new RangeError('轨迹范围无法用当前周期表示。');
  const includeTimes = [...new Set([startTime, endTime, ...values.flatMap(anchor => [anchor.time, anchor.time + period])
    .filter(time => time >= startTime && time <= endTime)])].sort((first, second) => first - second);
  return { from: { ...from, clock: from.time, time: startTime }, to: { ...to, clock: to.time, time: endTime }, startTime, endTime, wraps, includeTimes };
}
