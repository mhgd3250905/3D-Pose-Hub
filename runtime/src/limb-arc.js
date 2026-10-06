import { Matrix4, Quaternion, Vector3 } from 'three';

const EPSILON = 1e-10;
const UP = new Vector3(0, 1, 0);
const vector = values => new Vector3().fromArray(values);
const rotation = values => new Quaternion().fromArray(values).normalize();
const mix = (a, b, blend) => a * (1 - blend) + b * blend;

function perpendicular(direction, hint) {
  const result = hint.clone().addScaledVector(direction, -hint.dot(direction));
  if (result.lengthSq() < EPSILON) {
    result.copy(Math.abs(direction.z) < .9 ? new Vector3(0, 0, 1) : UP);
    result.addScaledVector(direction, -result.dot(direction));
  }
  return result.normalize();
}

function between(from, to, bend) {
  const dot = Math.max(-1, Math.min(1, from.dot(to)));
  if (dot > 1 - EPSILON) return new Quaternion();
  // A half turn has infinitely many routes. Use the saved knee's bend plane
  // as a deterministic route; intermediate user poses can choose another one.
  const axis = new Vector3().crossVectors(from, to);
  if (axis.lengthSq() < EPSILON) axis.crossVectors(from, perpendicular(from, bend));
  return new Quaternion().setFromAxisAngle(axis.normalize(), Math.acos(dot));
}

function limbFrame(direction, bend) {
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(
    bend, new Vector3().crossVectors(direction, bend).normalize(), direction,
  ));
}

function interpolatedRadius(lengthA, lengthB, blend, upper, lower) {
  if (!(upper > 0 && lower > 0)) return mix(lengthA, lengthB, blend);
  // Radius lerp gives a square-root bend at a straight limb. Interpolating the
  // actually solved bend angle instead keeps a small change small near a key.
  const angleAt = length => Math.acos(Math.max(-1, Math.min(1,
    (length * length - upper * upper - lower * lower) / (2 * upper * lower),
  )));
  const angle = mix(angleAt(lengthA), angleAt(lengthB), blend);
  return Math.sqrt(Math.max(0, upper * upper + lower * lower + 2 * upper * lower * Math.cos(angle)));
}

/** Build replayable endpoint/pole targets from two actually solved limbs.
 * References follow the pelvis for legs and the upper torso for arms. Shared
 * support targets stay in world coordinates; other endpoints follow an arc.
 * The world-space fallback matches twoBone(), including a pole on its axis.
 */
export function interpolateLimbArc({
  startRoot, endRoot, currentRoot, startTarget, endTarget, currentTarget,
  startMiddle, endMiddle, startReference, endReference, currentReference,
  blend, upperLength, lowerLength, arc = true, floorHeight = -Infinity, side = 'left',
}) {
  const startRotation = rotation(startReference), endRotation = rotation(endReference);
  const currentRotation = rotation(currentReference);
  const rootA = vector(startRoot), rootB = vector(endRoot), root = vector(currentRoot);
  const worldA = vector(startTarget).sub(rootA), worldB = vector(endTarget).sub(rootB);
  const a = worldA.clone().applyQuaternion(startRotation.clone().invert());
  const b = worldB.clone().applyQuaternion(endRotation.clone().invert());
  const lengthA = a.length(), lengthB = b.length();
  if (lengthA < 1e-8 || lengthB < 1e-8) {
    return { target: [...currentTarget], pole: vector(startMiddle).lerp(vector(endMiddle), blend).toArray() };
  }
  const directionA = a.clone().normalize(), directionB = b.clone().normalize();
  const worldPoleA = vector(startMiddle).sub(rootA), worldPoleB = vector(endMiddle).sub(rootB);
  const bendA = perpendicular(worldA.clone().normalize(), worldPoleA).applyQuaternion(startRotation.clone().invert());
  const bendB = perpendicular(worldB.clone().normalize(), worldPoleB).applyQuaternion(endRotation.clone().invert());
  const poleA = worldPoleA.clone().applyQuaternion(startRotation.clone().invert());
  const poleB = worldPoleB.clone().applyQuaternion(endRotation.clone().invert());
  const route = new Quaternion().slerp(between(directionA, directionB, bendA), blend);
  const radius = interpolatedRadius(lengthA, lengthB, blend, upperLength, lowerLength);
  const delta = arc
    ? directionA.clone().applyQuaternion(route).multiplyScalar(radius).applyQuaternion(currentRotation)
    : vector(currentTarget).sub(root);
  if (arc && Number.isFinite(floorHeight) && root.y + delta.y < floorHeight) {
    const height = floorHeight - root.y;
    if (height <= radius) {
      const horizontalRadius = Math.sqrt(Math.max(0, radius * radius - height * height));
      const horizontal = new Vector3(delta.x, 0, delta.z);
      if (horizontal.lengthSq() < EPSILON) {
        horizontal.copy(directionA).applyQuaternion(currentRotation); horizontal.y = 0;
        if (horizontal.lengthSq() < EPSILON) horizontal.set(side === 'left' ? 1 : -1, 0, 0);
      }
      horizontal.normalize().multiplyScalar(horizontalRadius);
      delta.set(horizontal.x, height, horizontal.z);
    } else {
      // A highly bent source may have a shorter radius than this floor allows.
      // Leave the existing fixed-length solver to handle that infeasible radius.
      delta.set(0, height, 0);
    }
  }

  const worldDirection = delta.lengthSq() > 1e-12 ? delta.clone().normalize() : UP.clone().negate();
  const actualDirection = worldDirection.clone().applyQuaternion(currentRotation.clone().invert());
  const frame = limbFrame(directionA, bendA).slerp(limbFrame(directionB, bendB), blend);
  const frameDirection = new Vector3(0, 0, 1).applyQuaternion(frame);
  const frameBend = new Vector3(1, 0, 0).applyQuaternion(frame);
  const bend = frameBend.applyQuaternion(between(frameDirection, actualDirection, frameBend));
  const worldBend = perpendicular(actualDirection, bend).applyQuaternion(currentRotation);
  const along = mix(poleA.dot(directionA), poleB.dot(directionB), blend);
  const poleRadius = Math.max(1e-4, mix(
    poleA.clone().addScaledVector(directionA, -poleA.dot(directionA)).length(),
    poleB.clone().addScaledVector(directionB, -poleB.dot(directionB)).length(), blend,
  ));
  return {
    target: root.clone().add(delta).toArray(),
    pole: root.clone().addScaledVector(worldDirection, along).addScaledVector(worldBend, poleRadius).toArray(),
  };
}

// Retain the simple geometry helper used by standalone diagnostics. Production
// passes the resolved middle/endpoint through interpolateLimbArc() instead.
export function interpolateLegArc({ start, end, current, side, hipOffset, blend, floorHeight = -Infinity }) {
  const rootAt = pose => vector(hipOffset).applyQuaternion(rotation(pose.pelvisQuaternion ?? pose.bodyQuaternion)).add(vector(pose.pelvis)).toArray();
  const limb = interpolateLimbArc({
    startRoot: rootAt(start), endRoot: rootAt(end), currentRoot: rootAt(current),
    startTarget: start.limbs[side].ankle, endTarget: end.limbs[side].ankle, currentTarget: current.limbs[side].ankle,
    startMiddle: start.limbs[side].kneePole, endMiddle: end.limbs[side].kneePole,
    startReference: start.pelvisQuaternion ?? start.bodyQuaternion, endReference: end.pelvisQuaternion ?? end.bodyQuaternion, currentReference: current.pelvisQuaternion ?? current.bodyQuaternion,
    blend, floorHeight, side,
  });
  return { ankle: limb.target, kneePole: limb.pole };
}
