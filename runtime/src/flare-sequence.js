import { evaluateFootCurve, footCurveMatches, validateFootCurves } from './foot-curves.js';
import { segmentGuideMatches, validateSegmentGuides } from './segment-guides.js';

const SIDES = ['left', 'right'];
const VECTORS = ['wrist', 'elbowPole', 'ankle', 'kneePole'];
const ROTATIONS = ['handQuaternion', 'footQuaternion'];
const TWISTS = ['elbowTwist', 'kneeTwist', 'upperArmTwist', 'thighTwist'];
const IDENTITY_QUATERNION = [0, 0, 0, 1];
const clone = value => structuredClone(value);

function array(value, length, label) {
  if (!Array.isArray(value) || value.length !== length || Array.from(value).some(number => typeof number !== 'number' || !Number.isFinite(number))) {
    throw new TypeError(`${label} must contain ${length} finite numbers.`);
  }
}

function quaternion(value, label) {
  array(value, 4, label);
  if (Math.max(...value.map(Math.abs)) === 0) throw new TypeError(`${label} cannot be a zero quaternion.`);
}

function finiteValues(value, label) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError(`${label} contains a non-finite number.`);
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) finiteValues(child, `${label}.${key}`);
}

function validatePose(pose, index) {
  const label = typeof index === 'number' ? `Step ${index + 1}` : index;
  if (!pose || pose.version !== 1) throw new TypeError(`${label} needs a version 1 pose.`);
  array(pose.pelvis, 3, `${label} pelvis`);
  quaternion(pose.bodyQuaternion, `${label} bodyQuaternion`);
  if (Object.hasOwn(pose, 'torsoQuaternion')) quaternion(pose.torsoQuaternion, `${label} torsoQuaternion`);
  if (Object.hasOwn(pose, 'pelvisQuaternion')) quaternion(pose.pelvisQuaternion, `${label} pelvisQuaternion`);
  if (typeof pose.groundLock !== 'boolean') throw new TypeError(`${label} groundLock must be boolean.`);
  for (const side of SIDES) {
    const limb = pose.limbs?.[side];
    if (!limb || typeof limb.handLocked !== 'boolean') throw new TypeError(`${label} ${side} handLocked must be boolean.`);
    for (const key of VECTORS) array(limb[key], 3, `${label} ${side} ${key}`);
    for (const key of ROTATIONS) quaternion(limb[key], `${label} ${side} ${key}`);
    for (const key of TWISTS) {
      if (Object.hasOwn(limb, key) && (typeof limb[key] !== 'number' || !Number.isFinite(limb[key]))) {
        throw new TypeError(`${label} ${side} ${key} must be a finite angle in radians.`);
      }
    }
  }
  finiteValues(pose, label);
}

function normalized(values) {
  // Scaling first keeps valid, finite non-unit quaternions from overflowing.
  const maximum = Math.max(...values.map(Math.abs));
  const scaled = values.map(value => value / maximum);
  const length = Math.hypot(...scaled);
  return scaled.map(value => value / length);
}

function slerp(a, b, progress) {
  const start = normalized(a), end = normalized(b);
  let dot = start.reduce((sum, value, index) => sum + value * end[index], 0);
  if (dot < 0) {
    for (let index = 0; index < 4; index++) end[index] = -end[index];
    dot = -dot;
  }
  dot = Math.min(1, Math.max(0, dot));
  if (dot > 0.9995) return normalized(start.map((value, index) => value * (1 - progress) + end[index] * progress));
  const angle = Math.acos(dot), sine = Math.sin(angle);
  const startScale = Math.sin((1 - progress) * angle) / sine;
  const endScale = Math.sin(progress * angle) / sine;
  return normalized(start.map((value, index) => value * startScale + end[index] * endScale));
}

const lerp = (a, b, progress) => a.map((value, index) => value * (1 - progress) + b[index] * progress);
function interpolateAngle(start, end, progress) {
  const circle = 2 * Math.PI;
  // Reduce each end before subtracting so finite, large angles cannot overflow.
  const delta = (((end % circle) - (start % circle) + Math.PI) % circle + circle) % circle - Math.PI;
  return start + delta * progress;
}

const smoothstep = progress => progress * progress * (3 - 2 * progress);

// This is smoothstep(end) - smoothstep(start), factored to retain precision
// when a correction is very close to either end of the original transition.
function smoothstepDifference(start, end) {
  if (start + end > 1) [start, end] = [1 - end, 1 - start];
  return (end - start) * (3 * (start + end) - 2 * (start * start + start * end + end * end));
}

function interpolatePose(start, end, blend) {
  const pose = clone(start);
  pose.pelvis = lerp(start.pelvis, end.pelvis, blend);
  pose.bodyQuaternion = slerp(start.bodyQuaternion, end.bodyQuaternion, blend);
  if (Object.hasOwn(start, 'pelvisQuaternion') || Object.hasOwn(end, 'pelvisQuaternion')) {
    pose.pelvisQuaternion = slerp(start.pelvisQuaternion ?? start.bodyQuaternion, end.pelvisQuaternion ?? end.bodyQuaternion, blend);
  }
  if (Object.hasOwn(start, 'torsoQuaternion') || Object.hasOwn(end, 'torsoQuaternion')) {
    pose.torsoQuaternion = slerp(start.torsoQuaternion ?? IDENTITY_QUATERNION, end.torsoQuaternion ?? IDENTITY_QUATERNION, blend);
  }
  for (const side of SIDES) {
    const limb = pose.limbs[side];
    for (const key of VECTORS) limb[key] = lerp(start.limbs[side][key], end.limbs[side][key], blend);
    for (const key of ROTATIONS) limb[key] = slerp(start.limbs[side][key], end.limbs[side][key], blend);
    for (const key of TWISTS) {
      if (Object.hasOwn(start.limbs[side], key) || Object.hasOwn(end.limbs[side], key)) {
        limb[key] = interpolateAngle(start.limbs[side][key] ?? 0, end.limbs[side][key] ?? 0, blend);
      }
    }
    limb.handLocked = start.limbs[side].handLocked && end.limbs[side].handLocked;
  }
  return pose;
}

function validateCorrections(corrections, count) {
  if (!Array.isArray(corrections)) throw new TypeError('Transition corrections must be an array.');
  const ids = new Set();
  for (const [index, correction] of corrections.entries()) {
    const label = `Correction ${index + 1}`;
    if (!correction || typeof correction !== 'object' || Array.isArray(correction)) throw new TypeError(`${label} must be an object.`);
    if (typeof correction.id !== 'string' || !correction.id.trim()) throw new TypeError(`${label} needs a non-empty string id.`);
    if (ids.has(correction.id)) throw new TypeError(`${label} repeats a correction id.`);
    ids.add(correction.id);
    if (!Number.isInteger(correction.segment) || correction.segment < 0 || correction.segment >= count) {
      throw new TypeError(`${label} segment must be an existing transition index.`);
    }
    if (typeof correction.at !== 'number' || !Number.isFinite(correction.at) || correction.at <= 0 || correction.at >= 1) {
      throw new TypeError(`${label} at must be strictly between 0 and 1.`);
    }
    validatePose(correction.pose, label);
    finiteValues(correction, label);
  }
  const sorted = clone(corrections).sort((a, b) => a.segment - b.segment || a.at - b.at);
  for (let index = 1; index < sorted.length; index++) {
    const previous = sorted[index - 1], current = sorted[index];
    if (previous.segment === current.segment && current.at - previous.at <= 1e-8) {
      throw new TypeError('A transition cannot have correction points at the same position.');
    }
  }
  return sorted;
}

function phaseKeyframes(steps) {
  const keyframes = { front: 0, sideA: 2, rear: 4, sideB: 6, frontRepeat: 8 };
  for (const phase of ['front', 'sideA', 'rear', 'sideB']) {
    const indices = steps.flatMap((step, index) => step.phase === phase ? [index] : []);
    if (!indices.length) continue;
    keyframes[phase] = phase.startsWith('side') ? indices[Math.floor(indices.length / 2)] : indices[0];
    if (phase === 'front') keyframes.frontRepeat = indices.at(-1);
    if (phase === 'rear' && indices.length > 1) keyframes.rearRepeat = indices.at(-1);
  }
  return keyframes;
}

function validateSkippedSteps(skippedSteps, count) {
  if (!Array.isArray(skippedSteps)) throw new TypeError('Skipped steps must be an array of original step indices.');
  const skipped = new Set();
  for (const index of skippedSteps) {
    if (!Number.isInteger(index) || index < 0 || index >= count) throw new TypeError('A skipped step must be an existing original step index.');
    if (skipped.has(index)) throw new TypeError('Skipped step indices must be unique.');
    skipped.add(index);
  }
  return skipped;
}

/** Loop editable key poses without changing their exact saved anchor values.
 * stepAt() is the nearest keyframe index (ties advance to the approaching step).
 * Positions and shortest-arc quaternion rotations share the chosen time curve.
 * Smooth mode preserves the original transition's global smoothstep across
 * corrections; linear mode uses elapsed time within each correction span.
 * Interior hand locks retain only support shared by both ends of a transition;
 * anchors retain their original flags, and groundLock uses the previous frame.
 * Skipped originals retain their index and timestamp but cease to be anchors.
 * Across a skip, smooth timing spans the neighboring enabled originals, with
 * corrections dividing that same time curve. With only corrections remaining,
 * each pair of corrections uses its own smoothstep.
 */
export function createFlareSequence(steps, { period = steps?.length, corrections = [], mapTransition, interpolation = 'smooth', skippedSteps = [], footCurves = [], resolveFootEndpoint, segmentGuides = [], mapGuidedTransition } = {}) {
  if (!Array.isArray(steps) || !steps.length) throw new TypeError('A flare sequence needs at least one step.');
  if (typeof period !== 'number' || !Number.isFinite(period) || period <= 0) throw new TypeError('Sequence period must be positive and finite.');
  if (mapTransition !== undefined && typeof mapTransition !== 'function') throw new TypeError('mapTransition must be a function.');
  if (mapGuidedTransition !== undefined && typeof mapGuidedTransition !== 'function') throw new TypeError('mapGuidedTransition must be a function.');
  if (resolveFootEndpoint !== undefined && typeof resolveFootEndpoint !== 'function') throw new TypeError('resolveFootEndpoint must be a function.');
  if (interpolation !== 'smooth' && interpolation !== 'linear') throw new TypeError('Sequence interpolation must be smooth or linear.');
  for (const [index, step] of steps.entries()) {
    validatePose(step?.pose, index);
    finiteValues(step, `Step ${index + 1}`);
  }
  const corrected = validateCorrections(corrections, steps.length);
  const skipped = validateSkippedSteps(skippedSteps, steps.length);
  const curves = validateFootCurves(footCurves);
  const guides = validateSegmentGuides(segmentGuides, steps);
  const source = clone(steps), count = source.length;
  // Query identities for unnamed legacy steps do not alter their saved data.
  const originals = source.map((step, index) => ({ kind: 'step', id: typeof step.id === 'string' && step.id.trim() ? step.id : `step-${index}`, coordinate: index, index, pose: step.pose }));
  const enabledOriginals = originals.filter((_, index) => !skipped.has(index));
  const correctionAnchors = corrected.map(point => ({ ...point, kind: 'point', coordinate: point.segment + point.at, index: point.segment }));
  const anchors = enabledOriginals.concat(correctionAnchors)
    .sort((a, b) => a.coordinate - b.coordinate);
  if (!anchors.length) throw new TypeError('A sequence needs at least one enabled original step or correction.');
  const points = Array.from({ length: count }, (_, index) => [
    { ...originals[index], at: 0 },
    ...correctionAnchors.filter(correction => correction.segment === index),
    { ...originals[(index + 1) % count], at: 1 },
  ]);
  const toleranceAt = time => Math.min(1e-8, 32 * Number.EPSILON * Math.max(1, count, Math.abs(time / period) * count));
  const locate = time => {
    if (typeof time !== 'number' || !Number.isFinite(time)) throw new TypeError('Sequence time must be finite.');
    let wrapped = time % period;
    if (wrapped < 0) wrapped += period;
    const coordinate = wrapped / period * count;
    const index = Math.max(0, Math.min(count - 1, Math.floor(coordinate)));
    const next = (index + 1) % count, progress = coordinate - index, tolerance = toleranceAt(time);
    // Snap arithmetic drift at original anchors, without hiding a correction
    // that deliberately sits close to that anchor.
    if (progress <= Math.min(tolerance, points[index][1].at / 2)) return { index, next, progress: 0 };
    if (1 - progress <= Math.min(tolerance, (1 - points[index].at(-2).at) / 2)) {
      return { index: next, next: (next + 1) % count, progress: 0 };
    }
    return { index, next, progress };
  };
  const interpolate = (start, end, blend, time) => {
    const details = guides.length ? guidedSpanDetails(time) : null;
    const guide = details && guideFor(details);
    if (guide) blend = details.blend;
    const pose = interpolatePose(start, end, blend);
    let result = pose;
    if (mapTransition) {
      const mapped = mapTransition(pose, { start: clone(start), end: clone(end), blend });
      validatePose(mapped, 'Mapped transition');
      result = clone(mapped);
    }
    if (curves.length) {
      const curveDetails = details ?? spanDetails(time);
      // Keep exactly the blend used by the sampler, including its precision-
      // preserving arithmetic near anchors and any explicit span timing.
      curveDetails.blend = blend;
      for (const side of SIDES) {
        const target = curveTarget(curveDetails, side);
        if (target) result.limbs[side].ankle = target.position;
      }
    }
    if (guide && !details.exact && mapGuidedTransition) {
      const mapped = mapGuidedTransition(result, { start: clone(start), end: clone(end), blend, time,
        span: publicSpan(details, time), guide: clone(guide) });
      validatePose(mapped, 'Guided transition');
      // The guided mapper owns this fresh pose and may attach transient
      // diagnostics through a WeakMap. Its inputs never alias saved anchors.
      result = mapped;
    }
    return result;
  };
  const coordinateAt = time => {
    // The original grid remains available to transitionAt(), but its skipped
    // positions must not snap the actual interpolation back to that grid.
    let wrapped = time % period;
    if (wrapped < 0) wrapped += period;
    return wrapped / period * count;
  };
  const surround = (values, coordinate) => {
    const rightIndex = values.findIndex(point => point.coordinate > coordinate);
    const left = values[(rightIndex <= 0 ? values.length : rightIndex) - 1];
    const right = values[rightIndex < 0 ? 0 : rightIndex];
    return {
      left, right,
      start: left.coordinate - (rightIndex === 0 ? count : 0),
      end: right.coordinate + (rightIndex < 0 ? count : 0),
    };
  };
  const skippingBlend = (span, coordinate) => {
    let blend = (coordinate - span.start) / (span.end - span.start);
    if (interpolation === 'smooth') {
      if (enabledOriginals.length) {
        const base = surround(enabledOriginals, coordinate), length = base.end - base.start;
        const left = (span.start - base.start) / length, right = (span.end - base.start) / length;
        const progress = (coordinate - base.start) / length;
        blend = smoothstepDifference(left, progress) / smoothstepDifference(left, right);
      } else blend = smoothstep(blend);
    }
    return Math.min(1, Math.max(0, blend));
  };
  const atAnchor = (anchor, coordinate, prefer) => {
    const index = anchors.indexOf(anchor);
    const exact = anchor.coordinate + Math.round((coordinate - anchor.coordinate) / count) * count;
    if (prefer === 'previous') {
      const left = anchors[(index + anchors.length - 1) % anchors.length];
      const difference = anchor.coordinate - left.coordinate;
      const distance = difference > 0 ? difference : difference + count;
      return { left, right: anchor, start: exact - distance, end: exact, blend: 1, exact: true };
    }
    const right = anchors[(index + 1) % anchors.length];
    const difference = right.coordinate - anchor.coordinate;
    const distance = difference > 0 ? difference : difference + count;
    return { left: anchor, right, start: exact, end: exact + distance, blend: 0, exact: true };
  };
  const spanDetails = (time, prefer = 'next') => {
    const { index, next, progress } = locate(time), coordinate = coordinateAt(time);
    const span = surround(anchors, coordinate), skipping = skipped.has(index) || skipped.has(next);
    if (skipping || anchors.length === 1) {
      const fromStart = coordinate - span.start, toEnd = span.end - coordinate;
      if (Math.min(fromStart, toEnd) <= Math.min(toleranceAt(time), (span.end - span.start) / 2)) {
        return atAnchor(fromStart < toEnd ? span.left : span.right, coordinate, prefer);
      }
      return { ...span, blend: skippingBlend(span, coordinate), exact: false };
    }
    if (progress === 0) return atAnchor(enabledOriginals.find(anchor => anchor.index === index), coordinate, prefer);
    const segment = points[index];
    if (segment.length === 2) return { ...span, blend: interpolation === 'linear' ? progress : smoothstep(progress), exact: false };
    const nearest = segment.reduce((closest, point) => Math.abs(progress - point.at) < Math.abs(progress - closest.at) ? point : closest);
    if (Math.abs(progress - nearest.at) <= toleranceAt(time)) {
      const anchor = anchors.find(point => point.kind === nearest.kind && (point.kind === 'step' ? point.index === nearest.index : point.id === nearest.id));
      return atAnchor(anchor, coordinate, prefer);
    }
    const rightIndex = segment.findIndex(point => point.at > progress), left = segment[rightIndex - 1], right = segment[rightIndex];
    const blend = interpolation === 'linear'
      ? (progress - left.at) / (right.at - left.at)
      : smoothstepDifference(left.at, progress) / smoothstepDifference(left.at, right.at);
    return { ...span, blend: Math.min(1, Math.max(0, blend)), exact: false };
  };
  const guideFor = details => guides.find(guide => segmentGuideMatches(guide, { from: details.left, to: details.right }));
  const guidedSpanDetails = (time, prefer = 'next') => {
    const details = spanDetails(time, prefer), guide = guideFor(details);
    if (!guide || details.exact) return details;
    const progress = Math.min(1, Math.max(0, (coordinateAt(time) - details.start) / (details.end - details.start)));
    return { ...details, blend: guide.timing === 'linear' ? progress : smoothstep(progress) };
  };
  const publicSpan = (details, time) => {
    let wrapped = time % period;
    if (wrapped < 0) wrapped += period;
    const cycleStart = time - wrapped;
    const startTime = cycleStart + details.start / count * period, endTime = cycleStart + details.end / count * period;
    return {
      from: { kind: details.left.kind, id: details.left.id, pose: clone(details.left.pose), time: startTime },
      to: { kind: details.right.kind, id: details.right.id, pose: clone(details.right.pose), time: endTime },
      startTime, endTime, blend: details.blend,
    };
  };
  const curveTarget = (details, side) => {
    const curve = curves.find(curve => footCurveMatches(curve, { from: details.left, to: details.right }, side));
    if (!curve) return null;
    const endpoint = anchor => resolveFootEndpoint ? resolveFootEndpoint(clone(anchor.pose), side) : anchor.pose.limbs[side].ankle;
    return { curve, position: evaluateFootCurve(endpoint(details.left), endpoint(details.right), curve.bend, details.blend) };
  };
  const sampleSkipping = (time, coordinate) => {
    if (anchors.length === 1) return clone(anchors[0].pose);
    const span = surround(anchors, coordinate);
    const fromStart = coordinate - span.start, toEnd = span.end - coordinate;
    const nearest = fromStart < toEnd ? span.left : span.right;
    if (Math.min(fromStart, toEnd) <= Math.min(toleranceAt(time), (span.end - span.start) / 2)) return clone(nearest.pose);
    return interpolate(span.left.pose, span.right.pose, skippingBlend(span, coordinate), time);
  };
  return {
    steps: clone(source),
    period,
    keyframes: phaseKeyframes(source),
    transitionAt(time) {
      return locate(time);
    },
    spanAt(time, options = {}) {
      if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Span options must be an object.');
      const { prefer = 'next' } = options;
      if (prefer !== 'previous' && prefer !== 'next') throw new TypeError('Span preference must be previous or next.');
      return publicSpan(guidedSpanDetails(time, prefer), time);
    },
    guideAt(time, options = {}) {
      if (typeof options === 'string') options = { prefer: options };
      if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Guide options must be an object.');
      const { prefer = 'next' } = options;
      if (prefer !== 'previous' && prefer !== 'next') throw new TypeError('Guide preference must be previous or next.');
      const details = guidedSpanDetails(time, prefer), guide = guideFor(details);
      return guide ? { guide: clone(guide), span: publicSpan(details, time) } : null;
    },
    curveAt(time, side) {
      if (!SIDES.includes(side)) throw new TypeError('Foot curve side must be left or right.');
      let details = guidedSpanDetails(time), target = curveTarget(details, side);
      if (!target && details.exact) {
        details = guidedSpanDetails(time, 'previous');target = curveTarget(details, side);
      }
      return target ? { curve: clone(target.curve), span: publicSpan(details, time), position: target.position } : null;
    },
    stepAt(time) {
      const { index, next, progress } = locate(time);
      if (skipped.size) {
        const coordinate = coordinateAt(time), span = surround(enabledOriginals.length ? enabledOriginals : anchors, coordinate);
        return coordinate - span.start >= span.end - coordinate ? span.right.index : span.left.index;
      }
      return progress >= 0.5 ? next : index;
    },
    sample(time) {
      const { index, next, progress } = locate(time);
      if (skipped.has(index) || skipped.has(next)) return sampleSkipping(time, coordinateAt(time));
      const start = source[index].pose, end = source[next].pose;
      // Do not normalize, reorder or regenerate saved values at a keyframe.
      if (progress === 0) return clone(start);
      const segment = points[index];
      if (segment.length === 2) {
        if (count === 1) return clone(start);
        return interpolate(start, end, interpolation === 'linear' ? progress : smoothstep(progress), time);
      }
      const nearest = segment.reduce((closest, point) => Math.abs(progress - point.at) < Math.abs(progress - closest.at) ? point : closest);
      if (Math.abs(progress - nearest.at) <= toleranceAt(time)) return clone(nearest.pose);
      const rightIndex = segment.findIndex(point => point.at > progress);
      const left = segment[rightIndex - 1], right = segment[rightIndex];
      // Smooth timing equals (smoothstep(progress) - smoothstep(left.at)) /
      // (smoothstep(right.at) - smoothstep(left.at)), without endpoint cancellation.
      const blend = interpolation === 'linear'
        ? (progress - left.at) / (right.at - left.at)
        : smoothstepDifference(left.at, progress) / smoothstepDifference(left.at, right.at);
      return interpolate(left.pose, right.pose, Math.min(1, Math.max(0, blend)), time);
    },
  };
}
