import * as THREE from 'three';

// A deliberately separate, articulated teaching illustration. These poses are
// constructed for explaining support changes, not measured motion capture.
const PERIOD = 8;
const SKIN = '#ad8a75';
const ACTIVE = '#c5e5a0';
const Y = new THREE.Vector3(0, 1, 0);
const LENGTH = Object.freeze({ torso: 0.48, upperArm: 0.325, forearm: 0.30, thigh: 0.465, shin: 0.435 });
const TIMES = [0, 1.6, 4, 6.2, 8];
const ANGLES = [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI * 2];
const ANGULAR_SPEEDS = TIMES.slice(1).map((t, i) => (ANGLES[i + 1] - ANGLES[i]) / (t - TIMES[i]));
const TANGENTS = [
  (ANGULAR_SPEEDS[3] + ANGULAR_SPEEDS[0]) / 2,
  (ANGULAR_SPEEDS[0] + ANGULAR_SPEEDS[1]) / 2,
  (ANGULAR_SPEEDS[1] + ANGULAR_SPEEDS[2]) / 2,
  (ANGULAR_SPEEDS[2] + ANGULAR_SPEEDS[3]) / 2,
  (ANGULAR_SPEEDS[3] + ANGULAR_SPEEDS[0]) / 2,
];

function phaseFor(time) {
  const t = ((time % PERIOD) + PERIOD) % PERIOD;
  let index = 0;
  while (index < TIMES.length - 2 && t > TIMES[index + 1]) index++;
  const span = TIMES[index + 1] - TIMES[index];
  const u = (t - TIMES[index]) / span;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * ANGLES[index]
    + (u3 - 2 * u2 + u) * span * TANGENTS[index]
    + (-2 * u3 + 3 * u2) * ANGLES[index + 1]
    + (u3 - u2) * span * TANGENTS[index + 1];
}

function handLift(angle, side) {
  const start = side === 'right' ? 0.30 : Math.PI + 0.30;
  const end = side === 'right' ? Math.PI - 0.30 : Math.PI * 2 - 0.30;
  if (angle <= start || angle >= end) return 0;
  return Math.sin(Math.PI * (angle - start) / (end - start)) ** 2;
}

function twoBone(start, target, upperLength, lowerLength, pole) {
  const delta = target.clone().sub(start);
  const requestedDistance = delta.length();
  const direction = delta.normalize();
  const distance = THREE.MathUtils.clamp(requestedDistance, Math.abs(upperLength - lowerLength) + 0.0001, upperLength + lowerLength - 0.0001);
  const along = (upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance);
  const height = Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2));
  const bend = pole.clone().sub(start);
  bend.addScaledVector(direction, -bend.dot(direction));
  if (bend.lengthSq() < 1e-8) bend.set(0, 0, 1).addScaledVector(direction, -direction.z);
  bend.normalize();
  return {
    elbow: start.clone().addScaledVector(direction, along).addScaledVector(bend, height),
    wrist: start.clone().addScaledVector(direction, distance),
  };
}

export function createFlareRig() {
  const group = new THREE.Group();
  group.name = 'Flare teaching illustration';
  group.userData.illustrative = true;
  group.userData.neutralHeight = 1.75;
  const sphere = new THREE.SphereGeometry(1, 24, 18);
  const materials = new Map();
  for (const id of ['shoulders', 'scapular', 'arms', 'chest', 'core', 'hipFlexors', 'glutes', 'adductors']) {
    materials.set(id, new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.64, metalness: 0.015 }));
  }
  const skinMaterial = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.70 });
  const creaseMaterial = new THREE.MeshStandardMaterial({ color: '#9b7b67', roughness: 0.82 });
  const hairMaterial = new THREE.MeshStandardMaterial({ color: '#554b41', roughness: 0.88 });
  const faceMaterial = new THREE.MeshStandardMaterial({ color: '#665346', roughness: 0.9 });

  const addMesh = (parent, geometry, material, position, scale) => {
    const mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.fromArray(position);
    if (scale) mesh.scale.fromArray(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const oval = (parent, id, position, scale) => {
    const mesh = addMesh(parent, sphere, materials.get(id) ?? skinMaterial, position, scale);
    mesh.userData.groupId = id;
    return mesh;
  };

  const torso = new THREE.Group();
  group.add(torso);
  oval(torso, 'glutes', [0, 0.016, 0], [0.153, 0.107, 0.103]);
  oval(torso, 'core', [0, 0.165, 0], [0.124, 0.158, 0.083]);
  oval(torso, 'chest', [0, 0.345, 0], [0.181, 0.168, 0.106]);
  for (const sign of [-1, 1]) {
    const pectoral = oval(torso, 'chest', [sign * 0.084, 0.352, 0.087], [0.091, 0.102, 0.035]);
    pectoral.rotation.z = sign * -0.12;
    const oblique = oval(torso, 'core', [sign * 0.103, 0.155, 0.035], [0.030, 0.115, 0.048]);
    oblique.rotation.z = sign * 0.24;
    oval(torso, 'glutes', [sign * 0.071, -0.004, -0.079], [0.077, 0.096, 0.045]);
    oval(torso, 'hipFlexors', [sign * 0.059, 0.050, 0.087], [0.045, 0.077, 0.023]).rotation.z = sign * 0.35;
    const trap = oval(torso, 'scapular', [sign * 0.067, 0.408, -0.079], [0.084, 0.10, 0.035]);
    trap.rotation.z = sign * 0.27;
    oval(torso, 'scapular', [sign * 0.095, 0.305, -0.087], [0.061, 0.102, 0.030]);
    for (let row = 0; row < 3; row++) {
      oval(torso, 'core', [sign * 0.031, 0.128 + row * 0.064, 0.079], [0.027, 0.029, 0.018]);
    }
  }
  addMesh(torso, sphere, creaseMaterial, [0, 0.204, 0.086], [0.003, 0.115, 0.003]);
  oval(torso, null, [0, 0.534, 0], [0.045, 0.076, 0.043]);

  const head = new THREE.Group();
  head.position.set(0, 0.655, 0.008);
  torso.add(head);
  oval(head, null, [0, 0, 0], [0.079, 0.110, 0.085]);
  oval(head, null, [0, -0.048, 0.018], [0.064, 0.064, 0.064]);
  oval(head, null, [0, -0.012, 0.087], [0.017, 0.025, 0.025]);
  for (const sign of [-1, 1]) {
    oval(head, null, [sign * 0.078, -0.01, 0], [0.011, 0.024, 0.017]);
    addMesh(head, sphere, faceMaterial, [sign * 0.030, 0.016, 0.079], [0.010, 0.0036, 0.0025]);
    addMesh(head, sphere, hairMaterial, [sign * 0.029, 0.035, 0.078], [0.018, 0.003, 0.003]);
  }
  addMesh(head, sphere, faceMaterial, [0, -0.050, 0.077], [0.022, 0.0021, 0.002]);
  addMesh(head, new THREE.SphereGeometry(1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), hairMaterial, [0, 0.008, -0.006], [0.082, 0.107, 0.085]);

  const segments = {};
  function segment(name, id, length, radiusStart, radiusEnd) {
    const meshGroup = new THREE.Group();
    meshGroup.name = name;
    const material = materials.get(id) ?? skinMaterial;
    addMesh(meshGroup, new THREE.CylinderGeometry(radiusEnd, radiusStart, length * 0.82, 20, 1), material);
    addMesh(meshGroup, sphere, material, [0, -length * 0.385, 0], [radiusStart, length * 0.15, radiusStart * 0.94]);
    addMesh(meshGroup, sphere, material, [0, length * 0.385, 0], [radiusEnd, length * 0.13, radiusEnd * 0.94]);
    addMesh(meshGroup, sphere, material, [0, -length * 0.04, 0], [(radiusStart + radiusEnd) * 0.53, length * 0.455, (radiusStart + radiusEnd) * 0.49]);
    group.add(meshGroup);
    segments[name] = { mesh: meshGroup, length, start: new THREE.Vector3(), end: new THREE.Vector3() };
    return meshGroup;
  }
  function placeSegment(name, a, b) {
    const value = segments[name];
    value.start.copy(a);
    value.end.copy(b);
    value.mesh.position.copy(a).add(b).multiplyScalar(0.5);
    value.mesh.quaternion.setFromUnitVectors(Y, b.clone().sub(a).normalize());
  }

  const arms = {};
  const legs = {};
  const contactMaterial = new THREE.MeshBasicMaterial({ color: ACTIVE, transparent: true, opacity: 0.24, depthWrite: false });
  const contacts = {};
  const anchors = {
    left: new THREE.Vector3(0.25, 0.04, 0),
    right: new THREE.Vector3(-0.25, 0.04, 0),
  };
  const fixedHandQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));

  function finger(parent, points, radius) {
    for (let index = 0; index < points.length - 1; index++) {
      const a = new THREE.Vector3().fromArray(points[index]);
      const b = new THREE.Vector3().fromArray(points[index + 1]);
      const length = a.distanceTo(b);
      const part = new THREE.Mesh(new THREE.CapsuleGeometry(radius * (1 - index * 0.12), Math.max(0.001, length - radius * 2), 4, 8), materials.get('arms'));
      part.position.copy(a).add(b).multiplyScalar(0.5);
      part.quaternion.setFromUnitVectors(Y, b.sub(a).normalize());
      part.castShadow = true;
      parent.add(part);
    }
  }

  for (const side of ['left', 'right']) {
    const sign = side === 'left' ? 1 : -1;
    segment(`${side}UpperArm`, 'arms', LENGTH.upperArm, 0.059, 0.039);
    segment(`${side}Forearm`, 'arms', LENGTH.forearm, 0.047, 0.026);
    const shoulder = oval(group, 'shoulders', null, [0.068, 0.066, 0.068]);
    const elbow = addMesh(group, sphere, creaseMaterial, null, [0.039, 0.040, 0.039]);
    const wrist = oval(group, 'arms', null, [0.027, 0.028, 0.024]);
    const hand = new THREE.Group();
    hand.name = `${side} hand with individual fingers`;
    oval(hand, 'arms', [0, 0, 0], [0.040, 0.053, 0.030]);
    oval(hand, 'arms', [sign * 0.023, -0.021, 0.006], [0.019, 0.032, 0.014]);
    for (const [index, x] of [-0.027, -0.009, 0.010, 0.028].entries()) {
      const spread = x * 0.28;
      const length = [0.065, 0.077, 0.072, 0.055][index];
      finger(hand, [[x, 0.041, 0.021], [x + spread * 0.4, 0.041 + length * 0.43, 0.024], [x + spread * 0.8, 0.041 + length * 0.77, 0.026], [x + spread, 0.041 + length, 0.026]], 0.0064);
    }
    finger(hand, [[sign * 0.031, -0.021, 0.014], [sign * 0.051, 0.004, 0.023], [sign * 0.058, 0.031, 0.025]], 0.008);
    group.add(hand);
    const contact = addMesh(group, new THREE.RingGeometry(0.039, 0.049, 40), contactMaterial, [sign * 0.25, 0.006, 0]);
    contact.rotation.x = -Math.PI / 2;
    contacts[side] = contact;
    arms[side] = { shoulder, elbow, wrist, hand, palm: new THREE.Vector3(), wristPoint: new THREE.Vector3(), lift: 0, support: true };

    const thigh = segment(`${side}Thigh`, null, LENGTH.thigh, 0.084, 0.056);
    oval(thigh, 'adductors', [-sign * 0.047, -0.06, 0.024], [0.043, 0.175, 0.039]);
    oval(thigh, 'hipFlexors', [0, -0.140, 0.054], [0.048, 0.086, 0.024]);
    segment(`${side}Shin`, null, LENGTH.shin, 0.059, 0.024);
    const hip = oval(group, 'glutes', null, [0.077, 0.078, 0.073]);
    const knee = addMesh(group, sphere, creaseMaterial, null, [0.051, 0.051, 0.045]);
    const ankle = oval(group, null, null, [0.027, 0.031, 0.027]);
    const foot = new THREE.Group();
    foot.name = `${side} shaped foot`;
    oval(foot, null, [0, -0.046, 0], [0.035, 0.053, 0.029]);
    oval(foot, null, [0, 0.032, 0], [0.046, 0.075, 0.027]);
    for (let toe = 0; toe < 5; toe++) {
      const x = (toe - 2) * 0.016;
      oval(foot, null, [x, 0.092 + (2 - Math.abs(toe - 1)) * 0.004, 0], [0.011, 0.025 - toe * 0.0016, 0.017 - toe * 0.0007]);
    }
    group.add(foot);
    legs[side] = { hip, knee, ankle, foot, hipPoint: new THREE.Vector3(), kneePoint: new THREE.Vector3(), anklePoint: new THREE.Vector3(), toePoint: new THREE.Vector3() };
  }

  const pelvis = new THREE.Vector3();
  const shoulderCenter = new THREE.Vector3();
  const frameX = new THREE.Vector3();
  const frameY = new THREE.Vector3();
  const frameZ = new THREE.Vector3();
  const frameQuaternion = new THREE.Quaternion();
  const basis = new THREE.Matrix4();
  const localWrist = new THREE.Vector3(0, -0.062, -0.025);
  let currentTime = 0;
  let currentAngle = 0;
  let minimumFootHeight = 0;

  function update(time = 0) {
    currentTime = ((Number.isFinite(time) ? time : 0) % PERIOD + PERIOD) % PERIOD;
    // Front support faces the floor; rear support opens the chest upward.
    // Offset the constructed circular poses by half a turn so the teaching
    // labels and the visible support orientation describe the same movement.
    const angle = (phaseFor(currentTime) + Math.PI) % (Math.PI * 2);
    currentAngle = angle;
    const sine = Math.sin(angle), cosine = Math.cos(angle);
    frameY.set(0.76 * sine, 0.53 + 0.12 * sine * sine, -0.85 * cosine).normalize();
    frameX.set(1, 0, 0).addScaledVector(frameY, -frameY.x).normalize();
    frameZ.crossVectors(frameX, frameY).normalize();
    basis.makeBasis(frameX, frameY, frameZ);
    frameQuaternion.setFromRotationMatrix(basis);
    pelvis.set(-0.23 * sine, 0.40 + 0.10 * sine * sine + 0.0125 * (1 - cosine), 0.25 * cosine);

    // Hand paths move only in flight. At each two-hand keyframe both palms and
    // all five fingertips return to precisely the same floor anchors.
    for (const side of ['left', 'right']) {
      const arm = arms[side];
      const sign = side === 'left' ? 1 : -1;
      const rawLift = handLift(angle, side);
      const lift = rawLift < 0.0001 ? 0 : rawLift;
      arm.lift = lift;
      arm.support = lift === 0;
      arm.palm.copy(anchors[side]).add(new THREE.Vector3(sign * 0.12 * lift, 0.45 * lift, -0.08 * lift));
      const freeQuaternion = frameQuaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, sign * 0.14)));
      arm.hand.quaternion.slerpQuaternions(fixedHandQuaternion, freeQuaternion, lift);
      arm.wristPoint.copy(localWrist).applyQuaternion(arm.hand.quaternion).add(arm.palm);
    }

    // Lower the whole torso by at most a few centimetres if a transition asks
    // a support arm to overreach. This preserves every bone length and palm
    // contact rather than detaching a hand or stretching a cylinder.
    const maximumReach = LENGTH.upperArm + LENGTH.forearm - 0.003;
    let lower = 0;
    for (const side of ['left', 'right']) {
      // Fade the departing hand's influence continuously: immediately dropping
      // its floor constraint at lift-off would make the pelvis jump upward.
      const contactWeight = 1 - THREE.MathUtils.smoothstep(arms[side].lift, 0, 0.14);
      if (contactWeight === 0) continue;
      const sign = side === 'left' ? 1 : -1;
      const shoulder = pelvis.clone().addScaledVector(frameY, LENGTH.torso).addScaledVector(frameX, sign * 0.185);
      const wrist = arms[side].wristPoint;
      const horizontalSquared = (shoulder.x - wrist.x) ** 2 + (shoulder.z - wrist.z) ** 2;
      const allowableY = wrist.y + Math.sqrt(Math.max(0.01, maximumReach ** 2 - horizontalSquared));
      lower = Math.max(lower, (shoulder.y - allowableY) * contactWeight);
    }
    pelvis.y -= Math.max(0, lower);
    torso.position.copy(pelvis);
    torso.quaternion.copy(frameQuaternion);
    shoulderCenter.copy(pelvis).addScaledVector(frameY, LENGTH.torso);

    for (const side of ['left', 'right']) {
      const sign = side === 'left' ? 1 : -1;
      const arm = arms[side];
      const shoulderPoint = shoulderCenter.clone().addScaledVector(frameX, sign * 0.185);
      const pole = shoulderPoint.clone().addScaledVector(frameX, sign * 0.23).addScaledVector(frameZ, 0.20);
      const solution = twoBone(shoulderPoint, arm.wristPoint, LENGTH.upperArm, LENGTH.forearm, pole);
      // A non-supporting hand may safely adapt its free path to elbow reach.
      const correction = solution.wrist.clone().sub(arm.wristPoint);
      arm.palm.add(correction);
      arm.wristPoint.copy(solution.wrist);
      arm.hand.position.copy(arm.palm);
      arm.shoulder.position.copy(shoulderPoint);
      arm.elbow.position.copy(solution.elbow);
      arm.wrist.position.copy(solution.wrist);
      placeSegment(`${side}UpperArm`, shoulderPoint, solution.elbow);
      placeSegment(`${side}Forearm`, solution.elbow, solution.wrist);
      contacts[side].visible = arm.support;

      const leg = legs[side];
      const hipPoint = pelvis.clone().addScaledVector(frameX, sign * 0.112);
      const yaw = angle + sign * 1.19;
      const flex = 0.085 + 0.085 * Math.sin(angle + sign * 0.35) ** 2;
      const halfFlex = flex / 2;
      const pitchRequested = sign * 0.36 * sine - 0.17;
      const legLength = (LENGTH.thigh + LENGTH.shin) * Math.cos(halfFlex);
      const pitch = Math.max(pitchRequested, (0.092 - hipPoint.y) / legLength);
      const planar = Math.sqrt(Math.max(0.001, 1 - pitch ** 2));
      const direction = new THREE.Vector3(Math.sin(yaw) * planar, pitch, Math.cos(yaw) * planar).normalize();
      const bend = Y.clone().addScaledVector(direction, -direction.y).normalize();
      const thighDirection = direction.clone().multiplyScalar(Math.cos(halfFlex)).addScaledVector(bend, Math.sin(halfFlex));
      const shinDirection = direction.clone().multiplyScalar(Math.cos(halfFlex)).addScaledVector(bend, -Math.sin(halfFlex));
      const kneePoint = hipPoint.clone().addScaledVector(thighDirection, LENGTH.thigh);
      const anklePoint = kneePoint.clone().addScaledVector(shinDirection, LENGTH.shin);
      leg.hipPoint.copy(hipPoint);
      leg.kneePoint.copy(kneePoint);
      leg.anklePoint.copy(anklePoint);
      leg.hip.position.copy(hipPoint);
      leg.knee.position.copy(kneePoint);
      leg.ankle.position.copy(anklePoint);
      placeSegment(`${side}Thigh`, hipPoint, kneePoint);
      placeSegment(`${side}Shin`, kneePoint, anklePoint);
      const toeDirection = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const footX = new THREE.Vector3().crossVectors(toeDirection, Y).normalize();
      leg.foot.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(footX, toeDirection, Y));
      leg.foot.position.copy(anklePoint).addScaledVector(toeDirection, 0.055).addScaledVector(Y, -0.026);
      leg.toePoint.copy(anklePoint).addScaledVector(toeDirection, 0.19).addScaledVector(Y, -0.026);
    }
    minimumFootHeight = Math.min(legs.left.anklePoint.y, legs.right.anklePoint.y) - 0.055;
    group.updateMatrixWorld(true);
  }

  function setHighlight(groupId) {
    for (const [id, material] of materials) {
      const active = groupId === id;
      material.color.set(active ? ACTIVE : SKIN);
      material.emissive.set(active ? '#263719' : '#000000');
      material.emissiveIntensity = active ? 0.15 : 0;
    }
  }

  function getMetrics() {
    const joints = {
      pelvis: pelvis.toArray(), shoulderCenter: shoulderCenter.toArray(),
      neck: new THREE.Vector3(0, 0.534, 0).applyQuaternion(frameQuaternion).add(pelvis).toArray(),
      head: new THREE.Vector3(0, 0.655, 0.008).applyQuaternion(frameQuaternion).add(pelvis).toArray(),
    };
    const supportHands = [];
    const supportDrift = {};
    const segmentLengths = { torso: pelvis.distanceTo(shoulderCenter) };
    for (const side of ['left', 'right']) {
      const arm = arms[side], leg = legs[side];
      joints[`${side}Shoulder`] = arm.shoulder.position.toArray();
      joints[`${side}Elbow`] = arm.elbow.position.toArray();
      joints[`${side}Wrist`] = arm.wristPoint.toArray();
      joints[`${side}Palm`] = arm.palm.toArray();
      joints[`${side}Hip`] = leg.hipPoint.toArray();
      joints[`${side}Knee`] = leg.kneePoint.toArray();
      joints[`${side}Ankle`] = leg.anklePoint.toArray();
      joints[`${side}Toe`] = leg.toePoint.toArray();
      if (arm.support) supportHands.push(side);
      supportDrift[side] = arm.support ? arm.palm.distanceTo(anchors[side]) : null;
    }
    for (const [name, segment] of Object.entries(segments)) {
      segmentLengths[name] = segment.start.distanceTo(segment.end);
    }
    const bounds = new THREE.Box3().setFromObject(group);
    return {
      time: currentTime, angle: currentAngle, period: PERIOD,
      keyframes: { front: 0, sideA: 1.6, rear: 4, sideB: 6.2, frontRepeat: 8 },
      supportHands, supports: { left: arms.left.support, right: arms.right.support }, supportDrift, minFootHeight: minimumFootHeight,
      chestForward: torso.getWorldDirection(new THREE.Vector3()).toArray(),
      joints, segmentLengths, expectedLengths: { ...LENGTH },
      neutralHeight: 1.75, illustrative: true,
      bounds: [bounds.min.toArray(), bounds.max.toArray()],
    };
  }

  update(0);
  return { group, update, setHighlight, getMetrics };
}
