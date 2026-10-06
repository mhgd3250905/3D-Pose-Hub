import { Matrix4, Quaternion, Vector3 } from 'three';

const EPSILON = 1e-12;
const UP = new Vector3(0, 1, 0);
const FRONT = new Vector3(0, 0, 1);
const circle = 2 * Math.PI;
const wrap = value => ((value + Math.PI) % circle + circle) % circle - Math.PI;

function perpendicular(axis, hint) {
  const result = hint.clone().addScaledVector(axis, -hint.dot(axis));
  if (result.lengthSq() < EPSILON) {
    result.copy(Math.abs(axis.z) < .9 ? FRONT : UP);
    result.addScaledVector(axis, -result.dot(axis));
  }
  return result.normalize();
}

function planeFrame(axis, normal) {
  const x = axis.clone().normalize();
  const z = perpendicular(x, normal);
  const y = new Vector3().crossVectors(z, x).normalize();
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z));
}

/** A full frame has a specified bend plane, unlike an axis-only shortest swing.
 * This helper never reads the live bones, and uses the same rest axis for each
 * end and every intermediate pose. It is only used by an explicit guide.
 */
export function guidedPlaneRotation(sourceAxis, destinationAxis, sourceNormal, destinationNormal) {
  return planeFrame(destinationAxis, destinationNormal)
    .multiply(planeFrame(sourceAxis, sourceNormal).invert()).normalize();
}

export function guidedAxisTwist(base, requested, sourceAxis) {
  const relative = base.clone().invert().multiply(requested);
  const axis = sourceAxis.clone().normalize();
  return wrap(2 * Math.atan2(relative.x * axis.x + relative.y * axis.y + relative.z * axis.z, relative.w));
}

/** Transport endpoint roll relative to the continuously moving bend plane.
 * The result matches each original endpoint bone frame, including its saved
 * twist, without following the antipodal branch of setFromUnitVectors().
 */
export function interpolateGuidedRotation({ sourceAxis, sourceNormal,
  startAxis, endAxis, currentAxis, startNormal, endNormal, currentNormal,
  startRotation, endRotation, blend }) {
  const first = guidedPlaneRotation(sourceAxis, startAxis, sourceNormal, startNormal);
  const last = guidedPlaneRotation(sourceAxis, endAxis, sourceNormal, endNormal);
  const current = guidedPlaneRotation(sourceAxis, currentAxis, sourceNormal, currentNormal);
  const firstRoll = guidedAxisTwist(first, startRotation, sourceAxis);
  const lastRoll = guidedAxisTwist(last, endRotation, sourceAxis);
  const roll = firstRoll + wrap(lastRoll - firstRoll) * blend;
  return current.multiply(new Quaternion().setFromAxisAngle(sourceAxis.clone().normalize(), roll)).normalize();
}

/** Interpolate a leg's frame in pelvis space before aligning its actual axis.
 * A rotating knee plane is not a reliable roll reference for hip/thigh skin.
 */
export function interpolateGuidedLegRotation({ sourceAxis, currentAxis, startRotation, endRotation,
  startReference, endReference, currentReference, blend }) {
  const first = startReference.clone().invert().multiply(startRotation);
  const last = endReference.clone().invert().multiply(endRotation);
  const reference = currentReference.clone().multiply(first.slerp(last, blend));
  const from = sourceAxis.clone().normalize().applyQuaternion(reference);
  return new Quaternion().setFromUnitVectors(from, currentAxis.clone().normalize()).multiply(reference).normalize();
}

/** A midpoint bend-angle control changes only the limb's bend plane. The
 * endpoint and along-axis pole component remain unchanged, even when floor
 * or reach limits have already projected the endpoint to a different axis.
 */
export function rotateGuidedPole(root, end, pole, angle) {
  if (!angle) return pole.clone();
  const axis = end.clone().sub(root).normalize(), delta = pole.clone().sub(root);
  const along = delta.dot(axis), bend = perpendicular(axis, delta).applyAxisAngle(axis, angle);
  const radius = Math.max(1e-4, delta.clone().addScaledVector(axis, -along).length());
  return root.clone().addScaledVector(axis, along).addScaledVector(bend, radius);
}
