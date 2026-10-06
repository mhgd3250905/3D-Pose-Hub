import { anchorIdentity } from './foot-curves.js';
import { getTrajectoryAnchors } from './trajectory-range.js';
import { segmentGuideMatches, validateSegmentGuides } from './segment-guides.js';

const clone = value => structuredClone(value);
const object = value => value && typeof value === 'object' && !Array.isArray(value);

function shortLabel(anchor) {
  return anchor.label.replace(/ · \d+(?:\.\d+)? s.*$/u, '').replace(/ · (起点|末帧)$/u, '');
}

/** Plan the selected forward window using enabled saved anchors only. Its
 * interior originals and K frames remain hard boundaries, so a wide selection
 * never creates a guide that jumps over an existing enabled pose. This reads
 * observation metadata only; it never reads a pose, draft or guide record.
 * Times may be unfolded across the loop, including negative previous cycles.
 */
export function planSegmentGuideRange(sequence, document, range) {
  const saved = getTrajectoryAnchors(sequence, document);
  const period = sequence.period;
  if (!object(range) || typeof range.startTime !== 'number' || !Number.isFinite(range.startTime) ||
    typeof range.endTime !== 'number' || !Number.isFinite(range.endTime)) {
    throw new TypeError('请选择两个已保存关键帧，作为整段调整的起点和终点。');
  }
  const { startTime, endTime } = range, duration = endTime - startTime;
  const tolerance = Number.EPSILON * Math.max(1, period, Math.abs(startTime), Math.abs(endTime)) * 16;
  if (!(duration > 0) || duration > period + tolerance ||
    !Number.isFinite(startTime / period) || Math.abs(startTime / period) > Number.MAX_SAFE_INTEGER - 2 ||
    !Number.isFinite(endTime / period) || Math.abs(endTime / period) > Number.MAX_SAFE_INTEGER - 2) {
    throw new RangeError('整段调整需要向前连接两个关键帧，范围大于零且不超过一个动画周期。');
  }

  const copies = [];
  for (let cycle = Math.floor(startTime / period) - 1; cycle <= Math.ceil(endTime / period) + 1; cycle++) {
    for (const anchor of saved) {
      let time = anchor.time + cycle * period;
      if (time < startTime - tolerance || time > endTime + tolerance) continue;
      if (Math.abs(time - startTime) <= tolerance) time = startTime;
      else if (Math.abs(time - endTime) <= tolerance) time = endTime;
      copies.push({ ...anchor, clock: anchor.time, cycle, time });
    }
  }
  copies.sort((first, second) => first.time - second.time);
  const boundary = (time, label) => {
    const candidates = copies.filter(anchor => anchor.active && anchor.time === time);
    if (!candidates.length) throw new Error(`${label}需要是启用的已保存关键帧；请先恢复此帧或选择其他关键帧。`);
    if (candidates.length > 1) throw new Error(`${label}有多个启用关键帧位于同一时刻；请先调整重复的 K 帧位置。`);
  };
  boundary(startTime, '整段起点');boundary(endTime, '整段终点');
  const active = saved.filter(anchor => anchor.active);
  if (active.length < 2) throw new Error('整段调整至少需要两个不同的启用关键帧；请先恢复或保存另一个关键帧。');

  const anchors = copies.filter(anchor => anchor.active), spans = [];
  for (let index = 1; index < anchors.length; index++) {
    const from = anchors[index - 1], to = anchors[index];
    if (to.time <= from.time || from.key === to.key) {
      throw new Error('整段调整需要时间顺序明确的不同关键帧；请检查重复或停用的关键帧。');
    }
    spans.push({ from: anchorIdentity(from), to: anchorIdentity(to), startTime: from.time, endTime: to.time,
      label: `${shortLabel(from)} → ${shortLabel(to)}` });
  }
  return { startTime, endTime, spans, anchors };
}

/** Prepare a reversible preview document. Existing directed-pair records keep
 * their identity, bends, bend angles, timing and unknown metadata. Only missing
 * adjacent pairs receive a new record. Re-plan current metadata even when the
 * caller supplies an older plan, so newly saved K frames cannot be bypassed.
 */
export function buildSegmentGuideDraft(sequence, document, range, { timing = 'linear', createId } = {}) {
  if (!object(document)) throw new TypeError('整段调整需要已有的动画记录。');
  if (document.enabled === false) throw new Error('请先启用过渡修正，再开始整段调整；停用的 K 帧不会被自动开启。');
  if (!['linear', 'smooth'].includes(timing)) throw new TypeError('整段补帧需要选择线性或平滑速度。');
  if (createId !== undefined && typeof createId !== 'function') throw new TypeError('整段路线编号生成器需要为函数。');
  const plan = planSegmentGuideRange(sequence, document, range);
  const guides = validateSegmentGuides(Object.hasOwn(document, 'segmentGuides') ? document.segmentGuides : [], sequence);
  const createdIds = [];
  for (const [index, span] of plan.spans.entries()) {
    if (guides.some(guide => segmentGuideMatches(guide, span))) continue;
    const id = createId ? createId(clone(span), index) : `segment-guide-${globalThis.crypto.randomUUID()}`;
    guides.push({ id, from: clone(span.from), to: clone(span.to), timing, bends: {}, bendAngles: {} });
    createdIds.push(id);
  }
  validateSegmentGuides(guides, sequence);
  const nextDocument = clone(document);
  nextDocument.enabled = true;nextDocument.segmentGuides = guides;
  return { ...plan, document: nextDocument, createdIds };
}
