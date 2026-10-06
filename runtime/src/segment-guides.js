import { anchorIdentity, anchorKey, sameAnchor } from './foot-curves.js';

export const SEGMENT_BEND_JOINTS = ['pelvis', 'leftAnkle', 'rightAnkle', 'leftWrist', 'rightWrist'];
export const SEGMENT_ANGLE_JOINTS = ['leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'];
const clone = value => structuredClone(value);
const object = value => value && typeof value === 'object' && !Array.isArray(value);

function vector(value, label, limit = 10) {
  if (!Array.isArray(value) || value.length !== 3 || Array.from(value).some(number =>
    typeof number !== 'number' || !Number.isFinite(number) || Math.abs(number) > limit)) {
    throw new TypeError(`${label}需要三个${limit === Infinity ? '' : `在 ±${limit} 米以内的`}有限坐标。`);
  }
}

function orbitPath(path, label) {
  if (!object(path)) throw new TypeError(`${label}需要为对象。`);
  vector(path.center, `${label}旋转中心`);
  if (Object.hasOwn(path, 'arc') && !['short', 'long'].includes(path.arc)) throw new TypeError(`${label}请选择短弧或长弧。`);
  if (Object.hasOwn(path, 'normal')) {
    vector(path.normal, `${label}备用旋转平面法向`, Infinity);
    if (Math.max(...path.normal.map(Math.abs)) === 0) throw new TypeError(`${label}备用旋转平面法向不能为零。`);
  }
}

/** Entries bind only to one directed, currently adjacent pair of saved anchors.
 * Missing K references are retained, so inserting/skipping/removing a key does
 * not delete the user's route. Original references must belong to the sequence.
 * Unknown metadata is copied unchanged; known controls are validated strictly.
 */
export function validateSegmentGuides(guides, sequence) {
  if (!Array.isArray(guides) || guides.length > 200) throw new TypeError('整段路线需要为数组，最多保存 200 条。');
  const ids = new Set(), pairs = new Set();
  const steps = Array.isArray(sequence) ? sequence : sequence?.steps;
  if (sequence !== undefined && !Array.isArray(steps)) throw new TypeError('整段路线需要有效的动画节点。');
  const stepIds = steps && new Set(steps.map((step, index) =>
    typeof step?.id === 'string' && step.id.trim() ? step.id : `step-${index}`));
  for (const [index, guide] of guides.entries()) {
    const label = `整段路线 ${index + 1}`;
    if (!object(guide)) throw new TypeError(`${label}需要为对象。`);
    if (typeof guide.id !== 'string' || !guide.id.trim() || ids.has(guide.id)) throw new TypeError(`${label}需要独立且非空的编号。`);
    ids.add(guide.id);
    const from = anchorIdentity(guide.from), to = anchorIdentity(guide.to);
    if (sameAnchor(from, to)) throw new TypeError(`${label}需要两个不同的关键帧。`);
    for (const ref of [from, to]) if (stepIds && ref.kind === 'step' && !stepIds.has(ref.id)) {
      throw new TypeError(`${label}的原关键帧不属于当前动画。`);
    }
    const pair = JSON.stringify([anchorKey(from), anchorKey(to)]);
    if (pairs.has(pair)) throw new TypeError(`${label}重复指定同一个有向关键帧区间。`);
    pairs.add(pair);
    if (!['linear', 'smooth'].includes(guide.timing)) throw new TypeError(`${label}需要选择线性或平滑补帧。`);
    if (Object.hasOwn(guide, 'bends')) {
      if (!object(guide.bends)) throw new TypeError(`${label}的位置路线需要为对象。`);
      for (const joint of SEGMENT_BEND_JOINTS) if (Object.hasOwn(guide.bends, joint)) vector(guide.bends[joint], `${label} ${joint}`);
    }
    if (Object.hasOwn(guide, 'smoothPaths')) {
      if (!object(guide.smoothPaths)) throw new TypeError(`${label}的平滑弧线需要为对象。`);
      for (const joint of SEGMENT_BEND_JOINTS) if (Object.hasOwn(guide.smoothPaths, joint)) {
        const path = guide.smoothPaths[joint];
        if (!object(path)) throw new TypeError(`${label} ${joint} 的平滑弧线需要为对象。`);
        vector(path.bend, `${label} ${joint} 平滑弧线中点偏移`);
      }
    }
    if (Object.hasOwn(guide, 'orbitPaths')) {
      if (!object(guide.orbitPaths)) throw new TypeError(`${label}的旋转中心路线需要为对象。`);
      for (const joint of SEGMENT_BEND_JOINTS) if (Object.hasOwn(guide.orbitPaths, joint)) {
        orbitPath(guide.orbitPaths[joint], `${label} ${joint} 旋转中心路线`);
      }
    }
    if (Object.hasOwn(guide, 'bendAngles')) {
      if (!object(guide.bendAngles)) throw new TypeError(`${label}的关节弯向需要为对象。`);
      for (const joint of SEGMENT_ANGLE_JOINTS) if (Object.hasOwn(guide.bendAngles, joint)) {
        const angle = guide.bendAngles[joint];
        if (typeof angle !== 'number' || !Number.isFinite(angle) || Math.abs(angle) > 2 * Math.PI) {
          throw new TypeError(`${label} ${joint}需要在 ±2π 以内的有限角度。`);
        }
      }
    }
  }
  return clone(guides);
}

export function segmentGuideMatches(guide, span) {
  return Boolean(guide && sameAnchor(guide.from, span?.from) && sameAnchor(guide.to, span?.to));
}

/** Midpoint weight is one; endpoint value and first derivative are both zero. */
export function segmentGuideWeight(progress) {
  if (typeof progress !== 'number' || !Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new TypeError('整段路线进度需要为 0–1 之间的有限数值。');
  }
  if (progress === 0 || progress === 1) return 0;
  return 16 * progress * progress * (1 - progress) * (1 - progress);
}

/** A direct quadratic arc between the two actually solved anchor positions.
 * bend is its real midpoint's displacement from the endpoint average; it is
 * never added to a sampled legacy route. Timing/reach/IK are caller concerns.
 */
export function evaluateSegmentArc(start, end, bend, progress) {
  vector(start, '整段平滑弧线起点', Infinity);
  vector(end, '整段平滑弧线终点', Infinity);
  vector(bend, '整段平滑弧线中点偏移');
  if (typeof progress !== 'number' || !Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new TypeError('整段平滑弧线进度需要为 0–1 之间的有限数值。');
  }
  if (progress === 0) return clone(start);
  if (progress === 1) return clone(end);
  const weight = 4 * progress * (1 - progress);
  return start.map((value, index) => value * (1 - progress) + end[index] * progress + weight * bend[index]);
}

const dot = (first, second) => first.reduce((sum, value, index) => sum + value * second[index], 0);
const cross = (first, second) => [first[1] * second[2] - first[2] * second[1],
  first[2] * second[0] - first[0] * second[2], first[0] * second[1] - first[1] * second[0]];
function unit(value) {
  // Scaling first handles very small or large nonzero finite normal vectors.
  const maximum = Math.max(...value.map(Math.abs));
  if (maximum === 0) return null;
  const scaled = value.map(component => component / maximum), length = Math.hypot(...scaled);
  return scaled.map(component => component / length);
}
function radial(endpoint, center) {
  const delta = endpoint.map((value, index) => value - center[index]);
  const direction = unit(delta);
  if (!direction) throw new RangeError('旋转中心不能与任一端点重合，请移动旋转中心。');
  const maximum = Math.max(...delta.map(Math.abs));
  const radius = maximum * Math.hypot(...delta.map(component => component / maximum));
  if (!Number.isFinite(radius)) throw new RangeError('端点离旋转中心过远，无法计算有限的弧线。');
  return { direction, radius };
}
function fallbackNormal(direction, normal) {
  if (normal) {
    const hint = unit(normal), along = dot(hint, direction);
    const projected = hint.map((value, index) => value - along * direction[index]);
    if (Math.hypot(...projected) > 1e-12) return unit(projected);
  }
  // Choose the least parallel model axis; ties use X, Y, Z in that order.
  let axis = 0;
  for (let index = 1; index < 3; index++) if (Math.abs(direction[index]) < Math.abs(direction[axis])) axis = index;
  const hint = [0, 0, 0];hint[axis] = 1;
  const along = dot(hint, direction);
  return unit(hint.map((value, index) => value - along * direction[index]));
}

/** Rotate between actual endpoints about an explicit center. Equal radii give
 * a circle; unequal radii interpolate radially. A long arc takes the opposite
 * rotation route. The optional normal only resolves a degenerate endpoint
 * plane; nonparallel endpoints define their own plane. No IK is applied here.
 */
export function evaluateSegmentOrbit(start, end, path, progress) {
  vector(start, '整段旋转弧线起点', Infinity);
  vector(end, '整段旋转弧线终点', Infinity);
  orbitPath(path, '整段旋转弧线');
  if (typeof progress !== 'number' || !Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new TypeError('整段旋转弧线进度需要为 0–1 之间的有限数值。');
  }
  const first = radial(start, path.center), last = radial(end, path.center);
  if (progress === 0) return clone(start);
  if (progress === 1) return clone(end);
  if (path.arc !== 'long' && start.every((value, index) => value === end[index])) return clone(start);
  const plane = cross(first.direction, last.direction);
  const cosine = Math.max(-1, Math.min(1, dot(first.direction, last.direction)));
  let normal = unit(plane);
  const angle = normal ? Math.atan2(Math.hypot(...plane), cosine) : cosine < 0 ? Math.PI : 0;
  normal ??= fallbackNormal(first.direction, path.normal);
  const rotation = (path.arc === 'long' ? angle - 2 * Math.PI : angle) * progress;
  const sine = Math.sin(rotation), cosineRotation = Math.cos(rotation), tangent = cross(normal, first.direction);
  const along = dot(normal, first.direction), radius = first.radius * (1 - progress) + last.radius * progress;
  const direction = unit(first.direction.map((value, index) => value * cosineRotation + tangent[index] * sine
    + normal[index] * along * (1 - cosineRotation)));
  return direction.map((value, index) => path.center[index] + radius * value);
}
