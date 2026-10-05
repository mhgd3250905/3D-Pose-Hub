const SIDES = ['left', 'right'];
const VECTORS = ['wrist', 'elbowPole', 'ankle', 'kneePole'];
const ROTATIONS = ['handQuaternion', 'footQuaternion'];
const TWISTS = ['elbowTwist', 'kneeTwist'];
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
  const label = `Step ${index + 1}`;
  if (!pose || pose.version !== 1) throw new TypeError(`${label} needs a version 1 pose.`);
  array(pose.pelvis, 3, `${label} pelvis`);
  quaternion(pose.bodyQuaternion, `${label} bodyQuaternion`);
  if (Object.hasOwn(pose, 'torsoQuaternion')) quaternion(pose.torsoQuaternion, `${label} torsoQuaternion`);
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

/** Loop editable key poses without changing their exact saved anchor values.
 * stepAt() is the nearest keyframe index (ties advance to the approaching step).
 * Positions and shortest-arc quaternion rotations use the same smoothstep.
 * Interior hand locks retain only support shared by both ends of a transition;
 * anchors retain their original flags, and groundLock uses the previous frame.
 */
export function createFlareSequence(steps, { period = steps?.length } = {}) {
  if (!Array.isArray(steps) || !steps.length) throw new TypeError('A flare sequence needs at least one step.');
  if (typeof period !== 'number' || !Number.isFinite(period) || period <= 0) throw new TypeError('Sequence period must be positive and finite.');
  steps.forEach((step, index) => {
    validatePose(step?.pose, index);
    finiteValues(step, `Step ${index + 1}`);
  });
  const source = clone(steps), count = source.length;
  const locate = time => {
    if (typeof time !== 'number' || !Number.isFinite(time)) throw new TypeError('Sequence time must be finite.');
    let wrapped = time % period;
    if (wrapped < 0) wrapped += period;
    const coordinate = wrapped / period * count;
    const index = Math.max(0, Math.min(count - 1, Math.floor(coordinate)));
    return { index, next: (index + 1) % count, progress: coordinate - index };
  };
  return {
    steps: clone(source),
    period,
    keyframes: phaseKeyframes(source),
    stepAt(time) {
      const { index, next, progress } = locate(time);
      return progress >= 0.5 ? next : index;
    },
    sample(time) {
      const { index, next, progress } = locate(time);
      const start = source[index].pose, end = source[next].pose;
      // Do not normalize, reorder or regenerate saved values at a keyframe.
      if (progress === 0 || count === 1) return clone(start);
      const blend = progress * progress * (3 - 2 * progress);
      const pose = clone(start);
      pose.pelvis = lerp(start.pelvis, end.pelvis, blend);
      pose.bodyQuaternion = slerp(start.bodyQuaternion, end.bodyQuaternion, blend);
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
    },
  };
}
