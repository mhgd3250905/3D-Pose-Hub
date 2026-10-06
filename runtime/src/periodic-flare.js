import * as THREE from 'three';

const TAU = Math.PI * 2;
const DOWN = new THREE.Vector3(0, -1, 0);
const FRONT = new THREE.Vector3(0, 0, 1);
const SIDES = ['left', 'right'];
const radians = THREE.MathUtils.degToRad;
const point = value => new THREE.Vector3().fromArray(value);

function smoothMaximum(a, b, softness) {
  const maximum = Math.max(a, b);
  return maximum + softness * Math.log1p(Math.exp(-Math.abs(a - b) / softness));
}
const smoothMinimum = (a, b, softness) => -smoothMaximum(-a, -b, softness);

// The swing joins stance with zero first and second derivatives. A held palm
// has one fixed position AND orientation for its whole contact interval.
function handFlight(phase, side) {
  const [start, end] = side === 'left' ? [.07, .42] : [.58, .93];
  if (phase <= start || phase >= end) return { locked: true, lift: 0, at: 0 };
  const at = (phase - start) / (end - start);
  return { locked: false, lift: 64 * at ** 3 * (1 - at) ** 3, at };
}

/**
 * A kinematic trial for Snow, independent of saved poses and correction keys.
 * Harmonics describe orbit, lean and hip swing; IK keeps actual bone lengths.
 * This is an authored periodic motion, not a dynamics or mocap reconstruction.
 */
export function createPeriodicFlare({ landmarks, groundHands, shoeOffsets, period = 9 }) {
  if (!Number.isFinite(period) || period <= 0) throw new Error('数学动画需要有效的循环时长。');
  const rest = Object.fromEntries(Object.entries(landmarks).map(([name, value]) => [name, point(value)]));
  const dimensions = Object.fromEntries(SIDES.map(side => {
    const thigh = rest[side + 'Hip'].distanceTo(rest[side + 'Knee']);
    const shin = rest[side + 'Knee'].distanceTo(rest[side + 'Ankle']);
    return [side, {
      shoulderOffset: rest[side + 'Shoulder'].clone().sub(rest.pelvis),
      hipOffset: rest[side + 'Hip'].clone().sub(rest.pelvis),
      armReach: rest[side + 'Shoulder'].distanceTo(rest[side + 'Elbow'])
        + rest[side + 'Elbow'].distanceTo(rest[side + 'Wrist']) - .003,
      // Eight degrees of knee flexion keeps the IK away from its straight-leg
      // singularity without changing the rig's thigh or shin lengths.
      legReach: Math.sqrt(thigh ** 2 + shin ** 2 + 2 * thigh * shin * Math.cos(radians(8))),
      groundWrist: point(groundHands[side].wrist),
      groundRotation: new THREE.Quaternion().fromArray(groundHands[side].handQuaternion),
      shoeCorners: shoeOffsets[side].map(point),
    }];
  }));

  function sample(inputTime) {
    const phase = (((Number.isFinite(inputTime) ? inputTime : 0) % period + period) % period) / period;
    const theta = phase * TAU;
    const sin = Math.sin(theta), cos = Math.cos(theta);
    // A normalized, periodic quaternion curve avoids Euler wrapping and the
    // antipodal branches of independently interpolated saved orientations.
    const body = new THREE.Quaternion(
      .15 + .75 * cos, .10 * Math.sin(2 * theta), .576 * sin,
      .71825 - .1805 * cos - .09875 * Math.cos(2 * theta),
    ).normalize();
    const pelvis = new THREE.Vector3(.22 * sin, 0, .06 - .34 * cos);
    const shoulders = {}, wrists = {}, flights = {}, heightCaps = [];
    for (const side of SIDES) {
      const sign = side === 'left' ? 1 : -1, value = dimensions[side];
      const offset = value.shoulderOffset.clone().applyQuaternion(body);
      const shoulder = offset.clone().add(pelvis);
      const flight = handFlight(phase, side);
      const wrist = value.groundWrist.clone();
      wrist.x += flight.lift * (shoulder.x + sign * .30 - wrist.x);
      wrist.z += flight.lift * (shoulder.z + .10 - wrist.z);
      wrist.y += .72 * flight.lift;
      const horizontalSquared = (shoulder.x - wrist.x) ** 2 + (shoulder.z - wrist.z) ** 2;
      if (horizontalSquared >= value.armReach ** 2) throw new Error('数学轨迹超出手臂的水平可达范围。');
      heightCaps.push(wrist.y - offset.y + Math.sqrt(value.armReach ** 2 - horizontalSquared));
      shoulders[side] = shoulder;wrists[side] = wrist;flights[side] = flight;
    }
    // Smooth intersection of both reach spheres, including the flight hand.
    // A hard min or per-frame ground projection would create velocity corners.
    pelvis.y = smoothMinimum(heightCaps[0], heightCaps[1], .012) - .003;
    const bodyFront = FRONT.clone().applyQuaternion(body);
    const limbs = {};
    for (const side of SIDES) {
      const sign = side === 'left' ? 1 : -1, value = dimensions[side], flight = flights[side];
      const hip = value.hipOffset.clone().applyQuaternion(body).add(pelvis);
      const shoulder = shoulders[side].clone();shoulder.y += pelvis.y;
      // Opposite opening rhythms allow one leg to sweep low while the other
      // kicks high; strict 180-degree foot phase would lose the front V shape.
      const opening = radians(48 + sign * 36 * sin);
      const flexion = radians(50 + 25 * cos + 30 * Math.cos(2 * theta));
      const localDirection = new THREE.Vector3(sign * Math.sin(opening),
        -Math.cos(opening) * Math.cos(flexion), Math.cos(opening) * Math.sin(flexion));
      const footRotation = body.clone().multiply(new THREE.Quaternion().setFromUnitVectors(DOWN, localDirection));
      const direction = localDirection.clone().applyQuaternion(body);
      // A smooth upper bound on the actual rotated shoe box clears the floor.
      // Raising the direction, rather than stretching a leg or clamping ankle
      // position, preserves length and continuous velocity through the low arc.
      let shoeClearance = -Infinity;
      for (const corner of value.shoeCorners) {
        const height = -corner.clone().applyQuaternion(footRotation).y;
        shoeClearance = Number.isFinite(shoeClearance) ? smoothMaximum(shoeClearance, height, .002) : height;
      }
      const minimumY = (.006 + .012 + shoeClearance - hip.y) / value.legReach;
      const y = smoothMaximum(direction.y, minimumY, .012);
      if (Math.abs(y) >= .9999) throw new Error('数学轨迹无法保持脚底和真实腿长。');
      const horizontal = Math.hypot(direction.x, direction.z);
      direction.x *= Math.sqrt(1 - y * y) / horizontal;
      direction.z *= Math.sqrt(1 - y * y) / horizontal;
      direction.y = y;
      const ankle = hip.clone().addScaledVector(direction, value.legReach);
      const handRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), radians(-30) * flight.lift)
        .multiply(value.groundRotation);
      limbs[side] = {
        wrist: wrists[side].toArray(),
        // A stable rear/outside elbow guide stays transverse to the supporting
        // forearm, including the low rear phase where body-front is parallel
        // to it. Rotating that guide with the torso caused a rapid arm roll.
        elbowPole: shoulder.clone().add(new THREE.Vector3(sign * .18, -.05, -.5)).toArray(),
        handQuaternion: handRotation.toArray(), handLocked: flight.locked,
        ankle: ankle.toArray(), kneePole: hip.clone().addScaledVector(bodyFront, .5).toArray(),
        footQuaternion: footRotation.toArray(),
      };
    }
    return { version: 1, pelvis: pelvis.toArray(), bodyQuaternion: body.toArray(), groundLock: true, limbs };
  }

  function describe(inputTime) {
    const phase = (((Number.isFinite(inputTime) ? inputTime : 0) % period + period) % period) / period;
    const supportHands = SIDES.filter(side => handFlight(phase, side).locked);
    const section = phase < .07 || phase >= .93 ? 'rear' : phase < .42 ? 'right' : phase <= .58 ? 'front' : 'left';
    return { phase, section, supportHands, period, kneeFlexionDegrees: 8 };
  }
  return { sample, describe, period };
}
