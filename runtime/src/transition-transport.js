import { anchorIdentity, anchorKey } from './foot-curves.js';

const object = value => value && typeof value === 'object' && !Array.isArray(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);
function boundsOf(range) {
  if (!object(range) || !finite(range.startTime) || !finite(range.endTime) || range.endTime <= range.startTime) {
    throw new TypeError('整段时间轴需要有效且向前的起止时间。');
  }
  return { startTime: range.startTime, endTime: range.endTime };
}
function validPeriod(period, bounds) {
  if (!finite(period) || period <= 0) throw new TypeError('整段时间轴需要正的有限动画周期。');
  const tolerance = Number.EPSILON * Math.max(1, period, Math.abs(bounds.startTime), Math.abs(bounds.endTime)) * 16;
  if (bounds.endTime - bounds.startTime > period + tolerance ||
    Math.max(Math.abs(bounds.startTime / period), Math.abs(bounds.endTime / period)) > Number.MAX_SAFE_INTEGER - 2) {
    throw new RangeError('整段时间轴范围不能超过一个动画周期。');
  }
  return tolerance;
}

/** Slider and frame-step input already uses unfolded time. Clamp it directly;
 * wrapping an overshoot could jump to another pose inside the range. Neither
 * playback nor editor ownership is changed by this pure time operation.
 */
export function clampGuideTime(time, range) {
  const bounds = boundsOf(range);
  if (!finite(time)) throw new TypeError('整段时间轴的位置需要为有限数值。');
  return Math.min(bounds.endTime, Math.max(bounds.startTime, time));
}

/** Legacy segment/percentage controls provide a source clock. Translate that
 * clock into the selected cycle before clamping; e.g. clock 0 in 7–9 s means
 * the next-cycle 09 at 9 s. Keep an already unfolded in-range time unchanged.
 */
export function unfoldGuideClock(clock, range, period) {
  const bounds = boundsOf(range);validPeriod(period, bounds);
  if (!finite(clock)) throw new TypeError('关键帧时间需要为有限数值。');
  let time = clock;
  if (time < bounds.startTime) {
    const cycles = Math.ceil((bounds.startTime - time) / period);
    if (!Number.isSafeInteger(cycles)) throw new RangeError('关键帧时间无法用当前动画周期表示。');
    time += cycles * period;
  } else if (time > bounds.endTime) {
    const cycles = Math.min(Math.ceil((time - bounds.endTime) / period), Math.floor((time - bounds.startTime) / period));
    if (!Number.isSafeInteger(cycles)) throw new RangeError('关键帧时间无法用当前动画周期表示。');
    time -= cycles * period;
  }
  return clampGuideTime(time, bounds);
}

/** Copy observation metadata only, including skipped/disabled saved markers.
 * Both authored 09 identities and next-cycle copies remain distinct by time.
 * Marker clicks must use this unfolded time, not only an original-frame index.
 */
export function guideTransportMarkers(anchors, range, period) {
  const bounds = boundsOf(range), tolerance = validPeriod(period, bounds);
  if (!Array.isArray(anchors)) throw new TypeError('整段时间轴的保存帧标记需要为数组。');
  const keys = new Set(), values = anchors.map(anchor => {
    if (!object(anchor)) throw new TypeError('保存帧标记需要有效的关键帧元数据。');
    const identity = anchorIdentity(anchor), key = anchorKey(identity);
    if (anchor.key !== key || keys.has(key) || !finite(anchor.time) || anchor.time < 0 || anchor.time >= period ||
      typeof anchor.label !== 'string' || ['skipped', 'disabled', 'active'].some(field => typeof anchor[field] !== 'boolean')) {
      throw new TypeError('保存帧标记的身份、时间或状态无效。');
    }
    keys.add(key);
    return { ...identity, key, time: anchor.time, label: anchor.label, skipped: anchor.skipped, disabled: anchor.disabled, active: anchor.active,
      ...(identity.kind === 'step' && Number.isInteger(anchor.index) ? { index: anchor.index } : {}),
      ...(identity.kind === 'point' && Number.isInteger(anchor.segment) ? { segment: anchor.segment } : {}),
      ...(identity.kind === 'point' && finite(anchor.at) ? { at: anchor.at } : {}) };
  });
  const markers = [];
  for (let cycle = Math.floor(bounds.startTime / period) - 1; cycle <= Math.ceil(bounds.endTime / period) + 1; cycle++) {
    for (const anchor of values) {
      let time = anchor.time + cycle * period;
      if (time < bounds.startTime - tolerance || time > bounds.endTime + tolerance) continue;
      if (Math.abs(time - bounds.startTime) <= tolerance) time = bounds.startTime;
      else if (Math.abs(time - bounds.endTime) <= tolerance) time = bounds.endTime;
      const percent = (time - bounds.startTime) / (bounds.endTime - bounds.startTime) * 100;
      markers.push({ ...anchor, clock: anchor.time, cycle, time, percent });
    }
  }
  return markers.sort((first, second) => first.time - second.time);
}
