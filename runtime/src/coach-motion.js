import * as THREE from 'three';
import { createFlareSequence } from './flare-sequence.js';
import { interpolateLimbArc } from './limb-arc.js';
import { OFFICIAL_FLARE_SEQUENCE } from './official-poses.js';

const SIDES = ['left', 'right'];
const UP = new THREE.Vector3(0, 1, 0);
const FRONT = new THREE.Vector3(0, 0, 1);
const UNIT = new THREE.Vector3(1, 1, 1);
const IDENTITY = new THREE.Quaternion();
const FLOOR = 0.006;
const clamp = THREE.MathUtils.clamp;
const point = value => new THREE.Vector3().fromArray(value);

function frame(finger, normal) {
  const y = finger.clone().normalize();
  const z = normal.clone().addScaledVector(y, -normal.dot(y)).normalize();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

function rotationFor(source, destination, bodyRotation = IDENTITY) {
  const from = source.clone().normalize().applyQuaternion(bodyRotation);
  const to = destination.clone().normalize();
  return new THREE.Quaternion().setFromUnitVectors(from, to).multiply(bodyRotation);
}

function twoBone(start, target, upper, lower, pole) {
  const delta = target.clone().sub(start);
  const distance = clamp(delta.length(), Math.abs(upper - lower) + 1e-7, upper + lower - 1e-7);
  const direction = delta.lengthSq() > 1e-12 ? delta.normalize() : UP.clone().negate();
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, upper * upper - along * along));
  const bend = pole.clone().sub(start);
  bend.addScaledVector(direction, -bend.dot(direction));
  if (bend.lengthSq() < 1e-10) {
    bend.copy(Math.abs(direction.z) < 0.9 ? FRONT : UP);
    bend.addScaledVector(direction, -bend.dot(direction));
  }
  bend.normalize();
  return {
    middle: start.clone().addScaledVector(direction, along).addScaledVector(bend, height),
    end: start.clone().addScaledVector(direction, distance),
  };
}

function transformBounds(source, matrix, target) {
  if (source.isEmpty()) return;
  const p = new THREE.Vector3();
  for (let corner = 0; corner < 8; corner++) {
    p.set(corner & 1 ? source.max.x : source.min.x, corner & 2 ? source.max.y : source.min.y, corner & 4 ? source.max.z : source.min.z);
    target.expandByPoint(p.applyMatrix4(matrix));
  }
}

function finiteArray(value, length, label) {
  if (!Array.isArray(value) || value.length !== length || Array.from(value).some(number => typeof number !== 'number' || !Number.isFinite(number))) {
    throw new Error(`${label}必须包含 ${length} 个有限数值。`);
  }
  if (value.some(number => Math.abs(number) > 10000)) throw new Error(`${label}超出可编辑范围。`);
  return [...value];
}

function poseQuaternion(value, label) {
  const values = finiteArray(value, 4, label);
  const length = Math.hypot(...values);
  if (length < 1e-12) throw new Error(`${label}不能是零四元数。`);
  return new THREE.Quaternion().fromArray(values.map(number => number / length));
}

function validatePose(value) {
  if (!value || typeof value !== 'object' || value.version !== 1) throw new Error('姿势文件版本无效，请使用版本 1 的姿势。');
  if (typeof value.groundLock !== 'boolean') throw new Error('姿势的地面锁定必须为 true 或 false。');
  const result = {
    pelvis: point(finiteArray(value.pelvis, 3, '骨盆位置')),
    bodyQuaternion: poseQuaternion(value.bodyQuaternion, '躯干方向'),
    groundLock: value.groundLock,
    limbs: {},
  };
  if (Object.hasOwn(value, 'torsoQuaternion')) result.torsoQuaternion = poseQuaternion(value.torsoQuaternion, '腰部方向');
  for (const side of SIDES) {
    const limb = value.limbs?.[side];
    const label = side === 'left' ? '左侧' : '右侧';
    if (!limb || typeof limb.handLocked !== 'boolean') throw new Error(`${label}手掌锁定必须为 true 或 false。`);
    result.limbs[side] = {
      wrist: point(finiteArray(limb.wrist, 3, `${label}手腕位置`)),
      elbowPole: point(finiteArray(limb.elbowPole, 3, `${label}肘部弯曲方向`)),
      handQuaternion: poseQuaternion(limb.handQuaternion, `${label}手掌方向`),
      ankle: point(finiteArray(limb.ankle, 3, `${label}脚踝位置`)),
      kneePole: point(finiteArray(limb.kneePole, 3, `${label}膝部弯曲方向`)),
      footQuaternion: poseQuaternion(limb.footQuaternion, `${label}脚掌方向`),
      handLocked: limb.handLocked,
    };
    for (const key of ['elbowTwist', 'kneeTwist']) if (Object.hasOwn(limb, key)) {
      if (typeof limb[key] !== 'number' || !Number.isFinite(limb[key])) throw new Error(`${label}关节扭转需要有限角度。`);
      result.limbs[side][key] = limb[key];
    }
  }
  return result;
}

/** Apply editable key poses to Snow's original mesh and authored weights. */
export function createCoachMotion({ model, rigData }) {
  if (!model?.isObject3D) throw new Error('Snow motion requires a loaded model.');
  if (!rigData?.landmarks) throw new Error('Snow motion requires the accompanying coach-rig.json.');

  model.updateWorldMatrix(true, false);
  model.updateMatrixWorld(true);
  const inverseModel = model.matrixWorld.clone().invert();
  const inverseModelRotation = model.getWorldQuaternion(new THREE.Quaternion()).invert();
  const bones = new Map();
  const meshes = [];
  const skeletons = new Set();
  model.traverse(object => {
    if (object.isBone) bones.set(object.name, object);
    if (object.isSkinnedMesh) {
      meshes.push(object);
      skeletons.add(object.skeleton);
      // Animated bounds are calculated below; GLTF's cached T-pose bounds are stale.
      object.frustumCulled = false;
    }
  });
  const descriptors = new Map();
  for (const { name } of rigData.bones ?? []) {
    const bone = bones.get(name);
    if (!bone) throw new Error(`Snow is missing its ${name} bone.`);
    if (bone.parent?.isBone) throw new Error('Snow motion expects parallel deform bones under the armature.');
    descriptors.set(name, {
      bone,
      rest: bone.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverseModel),
      restRotation: inverseModelRotation.clone().multiply(bone.getWorldQuaternion(new THREE.Quaternion())),
      scale: bone.scale.clone(),
      bounds: new THREE.Box3(),
      target: new THREE.Vector3(),
      rotation: new THREE.Quaternion(),
      matrix: new THREE.Matrix4(),
    });
  }
  if (descriptors.size !== 20 || !meshes.length) throw new Error('Snow requires its 20 original deform bones and skinned meshes.');
  const rest = Object.fromEntries(Object.entries(rigData.landmarks).map(([name, value]) => [name, point(value)]));
  const handPoints = { left: [], right: [] };
  const handVertices = { left: [], right: [] };
  const footBounds = { left: new THREE.Box3(), right: new THREE.Box3() };
  let weightedVertices = 0;
  for (const skeleton of skeletons) skeleton.update();
  const vertex = new THREE.Vector3();
  for (const mesh of meshes) {
    // The calf-to-ankle skin blends across Shin and Foot. Ground clearance
    // follows the rigid shoe surfaces, rather than treating blended skin
    // above the collar as if it rotated entirely with the shoe.
    const footwear = /^Coach_(Sneakers|Soles|Shoe_Details)(?:_|$)/.test(mesh.name);
    const position = mesh.geometry.getAttribute('position');
    const indices = mesh.geometry.getAttribute('skinIndex');
    const weights = mesh.geometry.getAttribute('skinWeight');
    if (!position || !indices || !weights) continue;
    weightedVertices += position.count;
    for (let i = 0; i < position.count; i++) {
      mesh.getVertexPosition(i, vertex).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverseModel);
      for (let component = 0; component < 4; component++) {
        const weight = weights.getComponent(i, component);
        if (weight <= 1e-7) continue;
        const name = mesh.skeleton.bones[indices.getComponent(i, component)]?.name;
        descriptors.get(name)?.bounds.expandByPoint(vertex);
        for (const side of SIDES) {
          if (name === side + 'Hand' && weight > 0.70) {
            handPoints[side].push(vertex.clone());
            handVertices[side].push({mesh,index:i});
          }
          if (footwear && name === side + 'Foot') footBounds[side].expandByPoint(vertex);
        }
      }
    }
  }

  const limbs = {};
  for (const side of SIDES) {
    const sign = side === 'left' ? 1 : -1;
    const finger = new THREE.Vector3(sign * 0.98253144, 0.05483374, 0.17783482).normalize();
    // The wrist/MCP palm frame was measured on the source Snow mesh. Its
    // forearm axis and bounding-box thin axis are not the palm's exact axes.
    const normal = new THREE.Vector3(sign * 0.06068526, -0.99777448, -0.02762938);
    normal.addScaledVector(finger, -normal.dot(finger)).normalize();
    const restFrame = frame(finger, normal);
    let handThickness = -Infinity;
    let handLength = 0.16;
    for (const p of handPoints[side]) {
      const offset = p.clone().sub(rest[side + 'Wrist']);
      handThickness = Math.max(handThickness, offset.dot(normal));
      handLength = Math.max(handLength, offset.dot(finger));
    }
    if (!Number.isFinite(handThickness)) handThickness = 0.025;
    const palmOffset = finger.clone().multiplyScalar(clamp(handLength * 0.30, 0.040, 0.075)).addScaledVector(normal, handThickness);
    const neutralFinger = new THREE.Vector3(sign * 0.08, -0.994, 0.08).normalize();
    const neutralNormal = new THREE.Vector3(-sign * 0.92, 0, 0.38);
    const neutralRotation = frame(neutralFinger, neutralNormal).multiply(restFrame.clone().invert());
    limbs[side] = {
      upperArm: rest[side + 'Shoulder'].distanceTo(rest[side + 'Elbow']),
      forearm: rest[side + 'Elbow'].distanceTo(rest[side + 'Wrist']),
      thigh: rest[side + 'Hip'].distanceTo(rest[side + 'Knee']),
      shin: rest[side + 'Knee'].distanceTo(rest[side + 'Ankle']),
      anchor: new THREE.Vector3(sign * 0.215, FLOOR, 0),
      playAnchor: new THREE.Vector3(sign * 0.215, FLOOR, 0),
      palmOffset, neutralRotation,
      support: false, flight: 0,
    };
  }

  const bodyRotation = new THREE.Quaternion();
  const torsoRotation = new THREE.Quaternion();
  const waistRest = rest.pelvis.clone().lerp(rest.torso, .30);
  let hasTorsoRotation = false;
  const bodyX = new THREE.Vector3(1, 0, 0);
  const bodyY = UP.clone();
  const bodyZ = FRONT.clone();
  const pelvis = rest.pelvis.clone();
  const targets = {};
  const modelRotation = new THREE.Quaternion();
  const parents = new Map();
  const posedBounds = new THREE.Box3();
  const footBox = new THREE.Box3();
  let time = 0, angle = Math.PI, mode = 'standing', layer = 'skin', selected = null;
  let boundsDirty = true, neutralBounds = null, minimumFootHeight = FLOOR;
  const resolvedNodes = new Map();
  let legPath = 'arc', interpolation = 'smooth';
  let sequence = createFlareSequence(OFFICIAL_FLARE_SEQUENCE.steps, {
    period: OFFICIAL_FLARE_SEQUENCE.period, mapTransition: mapPoseTransition,
  });
  let groundLock = true, poseWarnings = [];
  const bodyTarget = source => source.clone().sub(rest.pelvis).applyQuaternion(bodyRotation).add(pelvis);
  const isNeutralTorso = rotation => !rotation || rotation.x * rotation.x + rotation.y * rotation.y + rotation.z * rotation.z < 1e-24;
  const upperRotation = () => isNeutralTorso(torsoRotation) ? bodyRotation.clone() : bodyRotation.clone().multiply(torsoRotation);
  function upperOffset(source, body, torso) {
    // Preserve the original arithmetic for all poses without independent waist
    // rotation, including the user's previously saved formal steps.
    if (isNeutralTorso(torso)) return source.clone().sub(rest.pelvis).applyQuaternion(body);
    return waistRest.clone().sub(rest.pelvis).applyQuaternion(body)
      .add(source.clone().sub(waistRest).applyQuaternion(body.clone().multiply(torso)));
  }
  const upperTarget = source => upperOffset(source, bodyRotation, torsoRotation).add(pelvis);
  function twistAroundAxis(base, requested, sourceAxis) {
    const relative = base.clone().invert().multiply(requested);
    const axis = sourceAxis.clone().normalize();
    const projected = relative.x * axis.x + relative.y * axis.y + relative.z * axis.z;
    const angle = 2 * Math.atan2(projected, relative.w);
    return ((angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  }

  function beginPose() {
    model.updateWorldMatrix(true, false);
    model.updateMatrixWorld(true);
    model.getWorldQuaternion(modelRotation);
    parents.clear();
    for (const { bone } of descriptors.values()) {
      if (parents.has(bone.parent)) continue;
      parents.set(bone.parent, {
        inverse: bone.parent.matrixWorld.clone().invert(),
        inverseRotation: bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert(),
      });
    }
  }

  function poseBone(name, target, rotation) {
    const value = descriptors.get(name);
    const parent = parents.get(value.bone.parent);
    value.target.copy(target);
    value.rotation.copy(rotation);
    value.bone.position.copy(target).applyMatrix4(model.matrixWorld).applyMatrix4(parent.inverse);
    value.bone.quaternion.copy(parent.inverseRotation).multiply(modelRotation).multiply(rotation).multiply(value.restRotation);
    value.bone.scale.copy(value.scale);
    value.bone.updateMatrix();
    value.matrix.compose(target, rotation, UNIT).multiply(new THREE.Matrix4().makeTranslation(-value.rest.x, -value.rest.y, -value.rest.z));
  }

  function finishPose() {
    // SkinnedMesh updates its bindMatrixInverse in updateMatrixWorld(), not
    // updateWorldMatrix(). This also keeps parent transforms from applying twice.
    model.updateMatrixWorld(true);
    for (const skeleton of skeletons) skeleton.update();
    minimumFootHeight = Math.min(footFloor('left'), footFloor('right'));
    boundsDirty = true;
  }

  function footFloor(side) {
    footBox.makeEmpty();
    transformBounds(footBounds[side], descriptors.get(side + 'Foot').matrix, footBox);
    return footBox.isEmpty() ? targets[side].ankle.y - rest[side + 'Ankle'].y : footBox.min.y;
  }

  function poseBody() {
    poseBone('pelvis', bodyTarget(rest.pelvis), bodyRotation);
    const rotation = upperRotation();
    for (const name of ['torso', 'neck', 'head']) poseBone(name, upperTarget(rest[name]), rotation);
  }

  function poseArm(side, target, shoulder, elbow, wrist, handRotation) {
    const body = upperRotation();
    const armRotation = rotationFor(rest[side + 'Elbow'].clone().sub(rest[side + 'Shoulder']), elbow.clone().sub(shoulder), body);
    const foreAxis = rest[side + 'Wrist'].clone().sub(rest[side + 'Elbow']);
    const foreRotation = rotationFor(foreAxis, wrist.clone().sub(elbow), body);
    if (target.elbowTwist) foreRotation.multiply(new THREE.Quaternion().setFromAxisAngle(foreAxis.normalize(), target.elbowTwist));
    poseBone(side + 'Scapula', shoulder, body);
    poseBone(side + 'UpperArm', shoulder, armRotation);
    poseBone(side + 'Forearm', elbow, foreRotation);
    poseBone(side + 'Hand', wrist, handRotation);
    Object.assign(target, {
      shoulder, elbow, wrist,
      palm: limbs[side].palmOffset.clone().applyQuaternion(handRotation).add(wrist),
    });
  }

  function poseLeg(side, target, hip, knee, ankle, footRotation) {
    const thighRotation = rotationFor(rest[side + 'Knee'].clone().sub(rest[side + 'Hip']), knee.clone().sub(hip), bodyRotation);
    const shinAxis = rest[side + 'Ankle'].clone().sub(rest[side + 'Knee']);
    const shinRotation = rotationFor(shinAxis, ankle.clone().sub(knee), bodyRotation);
    if (target.kneeTwist) shinRotation.multiply(new THREE.Quaternion().setFromAxisAngle(shinAxis.normalize(), target.kneeTwist));
    poseBone(side + 'Thigh', hip, thighRotation);
    poseBone(side + 'Patella', knee, thighRotation.clone().slerp(shinRotation, 0.52));
    poseBone(side + 'Shin', knee, shinRotation);
    poseBone(side + 'Foot', ankle, footRotation);
    Object.assign(target, { hip, knee, ankle });
    target.toe = new THREE.Vector3(0, 0, 0.18).applyQuaternion(footRotation).add(ankle);
  }

  function reset() {
    mode = 'standing';
    groundLock = true;
    poseWarnings = [];
    time = 0;
    angle = Math.PI;
    bodyRotation.identity();
    torsoRotation.identity();hasTorsoRotation = false;
    bodyX.set(1, 0, 0);
    bodyY.copy(UP);
    bodyZ.copy(FRONT);
    const sourceFloor = Math.min(...SIDES.map(side => footBounds[side].isEmpty() ? 0 : footBounds[side].min.y));
    pelvis.copy(rest.pelvis).addScaledVector(UP, FLOOR - sourceFloor);
    beginPose();
    poseBody();
    for (const side of SIDES) {
      const value = limbs[side], sign = side === 'left' ? 1 : -1;
      value.support = false;
      value.flight = 0;
      value.anchor.copy(value.playAnchor);
      const target = targets[side] = {};
      const shoulder = bodyTarget(rest[side + 'Shoulder']);
      const elbow = shoulder.clone().addScaledVector(new THREE.Vector3(sign * 0.18, -0.978, 0.06).normalize(), value.upperArm);
      const wrist = elbow.clone().addScaledVector(new THREE.Vector3(sign * 0.08, -0.994, 0.08).normalize(), value.forearm);
      poseArm(side, target, shoulder, elbow, wrist, value.neutralRotation);
      poseLeg(side, target, bodyTarget(rest[side + 'Hip']), bodyTarget(rest[side + 'Knee']), bodyTarget(rest[side + 'Ankle']), IDENTITY);
    }
    finishPose();
    neutralBounds = calculateBounds();
    return model;
  }

  function update(inputTime = 0) {
    const nextTime = ((Number.isFinite(inputTime) ? inputTime : 0) % sequence.period + sequence.period) % sequence.period;
    applyPose(sequence.sample(nextTime));
    mode = 'flare';
    time = nextTime;
    return model;
  }

  function resolvedNode(input) {
    const key = JSON.stringify(input);
    if (!resolvedNodes.has(key)) {
      if (resolvedNodes.size >= 256) resolvedNodes.clear();
      resolvedNodes.set(key, solvePose(input));
    }
    return resolvedNodes.get(key);
  }

  function mapPoseTransition(pose, { start, end, blend }) {
    // A saved node's actual IK solution, including its fallback bend plane,
    // is the endpoint of the animation. The raw pole can be on the limb axis
    // and its raw pelvis/target can be outside the constrained region.
    const first = resolvedNode(start), last = resolvedNode(end);
    pose.pelvis = first.constrainedPelvis.clone().lerp(last.constrainedPelvis, blend).toArray();
    for (const side of SIDES) {
      pose.limbs[side].wrist = first.solved[side].arm.end.clone().lerp(last.solved[side].arm.end, blend).toArray();
    }
    const requested = validatePose(pose), constrainedPelvis = projectBody(requested);
    pose.pelvis = constrainedPelvis.toArray();
    const referenceAt = node => node.requested.bodyQuaternion.clone().multiply(node.requested.torsoQuaternion ?? IDENTITY).toArray();
    const upper = requested.bodyQuaternion.clone().multiply(requested.torsoQuaternion ?? IDENTITY);
    for (const side of SIDES) {
      const value = limbs[side], from = first.solved[side], to = last.solved[side];
      const shoulder = upperOffset(rest[side + 'Shoulder'], requested.bodyQuaternion, requested.torsoQuaternion).add(constrainedPelvis);
      const arm = interpolateLimbArc({
        startRoot: from.shoulder.toArray(), endRoot: to.shoulder.toArray(), currentRoot: shoulder.toArray(),
        startTarget: from.arm.end.toArray(), endTarget: to.arm.end.toArray(), currentTarget: pose.limbs[side].wrist,
        startMiddle: from.arm.middle.toArray(), endMiddle: to.arm.middle.toArray(),
        startReference: referenceAt(first), endReference: referenceAt(last), currentReference: upper.toArray(),
        blend, upperLength: value.upperArm, lowerLength: value.forearm, arc: !pose.limbs[side].handLocked, side,
      });
      pose.limbs[side].wrist = arm.target;pose.limbs[side].elbowPole = arm.pole;
      const hip = rest[side + 'Hip'].clone().sub(rest.pelvis).applyQuaternion(requested.bodyQuaternion).add(constrainedPelvis);
      const floorHeight = pose.groundLock ? requiredAnkleHeight(side, requested.limbs[side].footQuaternion) : -Infinity;
      const leg = interpolateLimbArc({
        startRoot: from.hip.toArray(), endRoot: to.hip.toArray(), currentRoot: hip.toArray(),
        startTarget: from.leg.end.toArray(), endTarget: to.leg.end.toArray(), currentTarget: pose.limbs[side].ankle,
        startMiddle: from.leg.middle.toArray(), endMiddle: to.leg.middle.toArray(),
        startReference: first.requested.bodyQuaternion.toArray(), endReference: last.requested.bodyQuaternion.toArray(), currentReference: requested.bodyQuaternion.toArray(),
        blend, upperLength: value.thigh, lowerLength: value.shin, floorHeight, side,
      });
      pose.limbs[side].ankle = leg.target;pose.limbs[side].kneePole = leg.pole;
    }
    return pose;
  }

  function setSequence(steps, options = {}) {
    const nextLegPath = options.legPath === 'linear' ? 'linear' : 'arc';
    const next = createFlareSequence(steps, {
      ...options, mapTransition: nextLegPath === 'arc' ? mapPoseTransition : undefined,
    });
    sequence = next;
    resolvedNodes.clear();
    legPath = nextLegPath;
    interpolation = options.interpolation ?? 'smooth';
    if (mode === 'flare') update(time);
  }

  function capturePose() {
    return {
      version: 1,
      pelvis: pelvis.toArray(),
      bodyQuaternion: bodyRotation.toArray(),
      ...(hasTorsoRotation ? { torsoQuaternion: torsoRotation.toArray() } : {}),
      limbs: Object.fromEntries(SIDES.map(side => [side, {
        wrist: targets[side].wrist.toArray(),
        elbowPole: (targets[side].elbowPole ?? targets[side].elbow).toArray(),
        handQuaternion: descriptors.get(side + 'Hand').rotation.toArray(),
        ankle: targets[side].ankle.toArray(),
        kneePole: (targets[side].kneePole ?? targets[side].knee).toArray(),
        footQuaternion: descriptors.get(side + 'Foot').rotation.toArray(),
        handLocked: limbs[side].support,
        ...(targets[side].elbowTwist !== undefined ? { elbowTwist: targets[side].elbowTwist } : {}),
        ...(targets[side].kneeTwist !== undefined ? { kneeTwist: targets[side].kneeTwist } : {}),
      }])),
      groundLock,
    };
  }

  function requiredAnkleHeight(side, rotation) {
    const box = new THREE.Box3();
    const ankle = rest[side + 'Ankle'];
    const matrix = new THREE.Matrix4().makeRotationFromQuaternion(rotation)
      .multiply(new THREE.Matrix4().makeTranslation(-ankle.x, -ankle.y, -ankle.z));
    transformBounds(footBounds[side], matrix, box);
    return FLOOR - (box.isEmpty() ? -ankle.y : box.min.y);
  }

  function getGroundHandPose(side, fingerDirection, position) {
    if (!SIDES.includes(side)) throw new Error('未知的支撑手。');
    const sign = side === 'left' ? 1 : -1;
    // Source palm landmarks were measured in Snow's editable .blend, rather
    // than inferring the palm direction from the forearm or the bone axis.
    const palmLong = new THREE.Vector3(sign * 0.98253144, 0.05483374, 0.17783482);
    const palmNormal = new THREE.Vector3(sign * 0.06068526, -0.99777448, -0.02762938);
    const finger = point(fingerDirection); finger.y = 0;
    if (finger.lengthSq() < 1e-8) throw new Error('手指方向需要有水平分量。');
    finger.normalize();
    const rotation = frame(finger, UP.clone().negate()).multiply(frame(palmLong, palmNormal).invert());
    let lowestOffset = Infinity;
    for (const source of handPoints[side]) {
      lowestOffset = Math.min(lowestOffset, source.clone().sub(rest[side + 'Wrist']).applyQuaternion(rotation).y);
    }
    const wrist = position ? point(position) : new THREE.Vector3(sign * 0.215, 0, 0);
    wrist.y = FLOOR - (Number.isFinite(lowestOffset) ? lowestOffset : -0.035);
    return { wrist: wrist.toArray(), handQuaternion: rotation.toArray(), fingerDirection: finger.toArray() };
  }

  function alignGroundHands() {
    // Retain the source wrist/forearm blend. Its sub-millimeter displacement
    // depends on the elbow pose, so refine contact using actual skinned points.
    let pose = capturePose();
    const p = new THREE.Vector3();
    for (let pass = 0; pass < 8; pass++) {
      const inverse = model.matrixWorld.clone().invert();
      let changed = false;
      for (const side of SIDES) {
        if (!pose.limbs[side].handLocked) continue;
        let lowest = Infinity;
        for (const {mesh,index} of handVertices[side]) {
          mesh.getVertexPosition(index,p).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);
          lowest = Math.min(lowest,p.y);
        }
        const offset = FLOOR-lowest;
        if (Number.isFinite(offset) && Math.abs(offset)>1e-7) {
          pose.limbs[side].wrist[1] += offset; changed = true;
        }
      }
      if (!changed) break;
      pose = applyPose(pose);
    }
    return capturePose();
  }

  function projectBody(requested) {
    const position = requested.pelvis.clone();
    const constraints = [];
    let minimumY = -Infinity;
    for (const side of SIDES) {
      const source = requested.limbs[side], value = limbs[side];
      const shoulderOffset = upperOffset(rest[side + 'Shoulder'], requested.bodyQuaternion, requested.torsoQuaternion);
      if (source.handLocked) {
        constraints.push({
          center: source.wrist.clone().sub(shoulderOffset),
          maximum: value.upperArm + value.forearm - 1e-5,
          minimum: Math.abs(value.upperArm - value.forearm) + 1e-5,
          side,
        });
      }
      if (requested.groundLock) {
        const hipOffset = rest[side + 'Hip'].clone().sub(rest.pelvis).applyQuaternion(requested.bodyQuaternion);
        minimumY = Math.max(minimumY, requiredAnkleHeight(side, source.footQuaternion) - (value.thigh + value.shin - 1e-5) - hipOffset.y);
      }
    }
    if (constraints.length === 2 && constraints[0].center.distanceTo(constraints[1].center) > constraints[0].maximum + constraints[1].maximum) {
      throw new Error('双手锁定的位置相隔过远，原始手臂长度无法同时到达。请先解锁一只手或缩短双手间距。');
    }
    // Intersect the locked wrists' reach spheres with the ground half-space.
    // The hand anchors remain fixed while a body drag is limited to this region.
    for (let pass = 0; pass < 96; pass++) {
      for (const constraint of constraints) {
        const offset = position.clone().sub(constraint.center);
        const distance = offset.length();
        if (distance > constraint.maximum) position.copy(constraint.center).addScaledVector(offset, constraint.maximum / distance);
        else if (distance < constraint.minimum) {
          if (distance < 1e-10) offset.copy(UP);
          else offset.multiplyScalar(1 / distance);
          position.copy(constraint.center).addScaledVector(offset, constraint.minimum);
        }
      }
      position.y = Math.max(position.y, minimumY);
      const satisfied = constraints.every(constraint => {
        const distance = position.distanceTo(constraint.center);
        return distance <= constraint.maximum + 1e-7 && distance >= constraint.minimum - 1e-7;
      });
      if (satisfied) return position;
    }
    throw new Error('此躯干方向无法同时保持锁定手掌和脚底高度。请先解锁手掌或调整脚掌方向。');
  }

  function reachableAnkle(hip, requested, side, floorY) {
    const value = limbs[side];
    const maximum = value.thigh + value.shin - 1e-7;
    const minimum = Math.abs(value.thigh - value.shin) + 1e-7;
    const ankle = requested.clone();
    if (Number.isFinite(floorY)) ankle.y = Math.max(ankle.y, floorY);
    const offset = ankle.clone().sub(hip);
    const distance = offset.length();
    if (distance > maximum) ankle.copy(hip).addScaledVector(offset, maximum / distance);
    if (Number.isFinite(floorY) && ankle.y < floorY) {
      const height = floorY - hip.y;
      const horizontalRadius = Math.sqrt(Math.max(0, maximum * maximum - height * height));
      const dx = requested.x - hip.x, dz = requested.z - hip.z;
      const horizontal = Math.hypot(dx, dz);
      const factor = horizontal > horizontalRadius && horizontal > 0 ? horizontalRadius / horizontal : 1;
      ankle.set(hip.x + dx * factor, floorY, hip.z + dz * factor);
    }
    if (ankle.distanceTo(hip) < minimum) ankle.copy(hip).addScaledVector(UP, minimum);
    return ankle;
  }

  function solvePose(input) {
    // Validate and solve before mutating bones, so a bad import leaves the
    // current pose intact and cannot introduce NaNs into the live skeleton.
    const requested = validatePose(input);
    const constrainedPelvis = projectBody(requested);
    const warnings = [];
    const solved = {};
    const at = name => rest[name].clone().sub(rest.pelvis).applyQuaternion(requested.bodyQuaternion).add(constrainedPelvis);
    if (constrainedPelvis.distanceTo(requested.pelvis) > 1e-5) warnings.push('躯干位置已限制，以保持锁定手掌、真实骨长和地面高度。');
    for (const side of SIDES) {
      const source = requested.limbs[side], value = limbs[side];
      const label = side === 'left' ? '左' : '右';
      const shoulder = upperOffset(rest[side + 'Shoulder'], requested.bodyQuaternion, requested.torsoQuaternion).add(constrainedPelvis);
      const arm = twoBone(shoulder, source.wrist, value.upperArm, value.forearm, source.elbowPole);
      if (source.handLocked && arm.end.distanceTo(source.wrist) > 1e-5) throw new Error(`${label}手锁定位置无法到达，请先解锁手掌。`);
      if (arm.end.distanceTo(source.wrist) > 1e-5) warnings.push(`${label}手腕已限制在原始手臂能够到达的位置。`);
      const hip = at(side + 'Hip');
      const floorY = requested.groundLock ? requiredAnkleHeight(side, source.footQuaternion) : -Infinity;
      const ankle = reachableAnkle(hip, source.ankle, side, floorY);
      const leg = twoBone(hip, ankle, value.thigh, value.shin, source.kneePole);
      if (leg.end.distanceTo(source.ankle) > 1e-5) warnings.push(`${label}脚踝已按真实腿长${requested.groundLock ? '和地面高度' : ''}限制。`);
      solved[side] = { source, shoulder, arm, hip, leg };
    }

    return { requested, constrainedPelvis, warnings, solved };
  }

  function applyPose(input) {
    const { requested, constrainedPelvis, warnings, solved } = solvePose(input);
    mode = 'manual';
    groundLock = requested.groundLock;
    poseWarnings = warnings;
    pelvis.copy(constrainedPelvis);
    bodyRotation.copy(requested.bodyQuaternion);
    torsoRotation.copy(requested.torsoQuaternion ?? IDENTITY);
    hasTorsoRotation = requested.torsoQuaternion !== undefined;
    bodyX.set(1, 0, 0).applyQuaternion(bodyRotation);
    bodyY.copy(UP).applyQuaternion(bodyRotation);
    bodyZ.copy(FRONT).applyQuaternion(bodyRotation);
    angle = (Math.atan2(bodyZ.x, bodyZ.z) + Math.PI * 2) % (Math.PI * 2);
    beginPose();
    poseBody();
    for (const side of SIDES) {
      const { source, shoulder, arm, hip, leg } = solved[side];
      const value = limbs[side];
      value.support = source.handLocked;
      value.flight = source.handLocked ? 0 : 1;
      value.anchor.copy(source.wrist).add(value.palmOffset.clone().applyQuaternion(source.handQuaternion));
      const target = targets[side] = { elbowPole: source.elbowPole.clone(), kneePole: source.kneePole.clone() };
      for (const key of ['elbowTwist', 'kneeTwist']) if (source[key] !== undefined) target[key] = source[key];
      poseArm(side, target, shoulder, arm.middle, arm.end, source.handQuaternion);
      poseLeg(side, target, hip, leg.middle, leg.end, source.footQuaternion);
    }
    finishPose();
    return capturePose();
  }

  function getEditableHandles() {
    const handles = [
      { id: 'pelvis', position: pelvis.toArray(), quaternion: bodyRotation.toArray(), canRotate: true, label: '骨盆 · 全身位置' },
      { id: 'torso', position: upperTarget(rest.torso).toArray(), quaternion: bodyRotation.toArray(), canRotate: true, label: '躯干 · 身体方向' },
      { id: 'waist', position: bodyTarget(waistRest).toArray(), quaternion: torsoRotation.toArray(), parentQuaternion: bodyRotation.toArray(), canRotate: true, label: '腰部 · 独立弯腰与扭转' },
    ];
    for (const side of SIDES) {
      const label = side === 'left' ? '左' : '右';
      for (const [suffix, key, bone, canRotate, title] of [
        ['Wrist', 'wrist', 'Hand', true, '手腕 · 手掌位置与朝向'],
        ['Elbow', 'elbow', 'Forearm', true, '肘部 · 前臂旋转与弯曲'],
        ['Ankle', 'ankle', 'Foot', true, '脚踝 · 脚掌位置与朝向'],
        ['Knee', 'knee', 'Shin', true, '膝部 · 小腿旋转与弯曲'],
      ]) handles.push({
        id: side + suffix, position: targets[side][key].toArray(),
        quaternion: descriptors.get(side + bone).rotation.toArray(),
        canRotate, label: label + title,
      });
    }
    return handles;
  }

  function editHandle(id, change) {
    const handle = getEditableHandles().find(value => value.id === id);
    if (!handle) throw new Error('未知姿势控制点。');
    if (!change || (change.position === undefined && change.quaternion === undefined)) throw new Error('请提供控制点的位置或方向。');
    const position = change.position === undefined ? null : finiteArray(change.position, 3, `${handle.label}位置`);
    const quaternion = change.quaternion === undefined ? null : poseQuaternion(change.quaternion, `${handle.label}方向`).toArray();
    if (quaternion && !handle.canRotate) throw new Error('此控制点不支持旋转。');
    const pose = capturePose();
    let endpointLimited = false;
    if (id === 'pelvis') {
      if (position) pose.pelvis = position;
      if (quaternion) pose.bodyQuaternion = quaternion;
    } else if (id === 'torso') {
      if (quaternion) pose.bodyQuaternion = quaternion;
      const torsoTarget = point(position ?? handle.position);
      const torsoOffset = upperOffset(rest.torso, new THREE.Quaternion().fromArray(pose.bodyQuaternion), pose.torsoQuaternion ? new THREE.Quaternion().fromArray(pose.torsoQuaternion) : null);
      pose.pelvis = torsoTarget.sub(torsoOffset).toArray();
    } else if (id === 'waist') {
      if (position) pose.pelvis = point(position).sub(waistRest.clone().sub(rest.pelvis).applyQuaternion(bodyRotation)).toArray();
      if (quaternion) {
        const pivot = bodyTarget(waistRest);
        const nextUpper = bodyRotation.clone().multiply(new THREE.Quaternion().fromArray(quaternion));
        const delta = nextUpper.clone().multiply(upperRotation().invert());
        pose.torsoQuaternion = quaternion;
        for (const side of SIDES) {
          const limb = pose.limbs[side];
          limb.elbowPole = point(limb.elbowPole).sub(pivot).applyQuaternion(delta).add(pivot).toArray();
          if (!limb.handLocked) {
            limb.wrist = point(limb.wrist).sub(pivot).applyQuaternion(delta).add(pivot).toArray();
            limb.handQuaternion = delta.clone().multiply(new THREE.Quaternion().fromArray(limb.handQuaternion)).normalize().toArray();
          }
        }
      }
    } else {
      const side = id.startsWith('left') ? 'left' : 'right';
      const suffix = id.slice(side.length);
      const value = pose.limbs[side];
      if (quaternion && (suffix === 'Elbow' || suffix === 'Knee')) {
        const arm = suffix === 'Elbow';
        if (arm && value.handLocked) throw new Error(`${side === 'left' ? '左' : '右'}手已固定，旋转肘部前请先取消对应手的固定。`);
        const lowerBone = side + (arm ? 'Forearm' : 'Shin');
        const rotation = new THREE.Quaternion().fromArray(quaternion);
        const delta = rotation.clone().multiply(descriptors.get(lowerBone).rotation.clone().invert());
        const pivot = targets[side][arm ? 'elbow' : 'knee'];
        const end = arm ? 'wrist' : 'ankle', pole = arm ? 'elbowPole' : 'kneePole';
        const endQuaternion = arm ? 'handQuaternion' : 'footQuaternion';
        const rotatedEnd = point(value[end]).sub(pivot).applyQuaternion(delta).add(pivot);
        value[end] = rotatedEnd.toArray();value[pole] = pivot.toArray();
        value[endQuaternion] = delta.clone().multiply(new THREE.Quaternion().fromArray(value[endQuaternion])).normalize().toArray();
        const sourceAxis = rest[side + (arm ? 'Wrist' : 'Ankle')].clone().sub(rest[side + suffix]);
        const base = rotationFor(sourceAxis, rotatedEnd.clone().sub(pivot), arm ? upperRotation() : bodyRotation);
        value[arm ? 'elbowTwist' : 'kneeTwist'] = twistAroundAxis(base, rotation, sourceAxis);
      }
      if (position && suffix === 'Wrist') {
        // A direct wrist drag repositions its anchor, even when it was locked.
        // Clamp against the current shoulder first, so dragging a locked wrist
        // far away cannot create incompatible two-hand contact constraints.
        const requested = point(position);
        const shoulder = targets[side].shoulder;
        const source = limbs[side];
        const limited = twoBone(shoulder, requested, source.upperArm, source.forearm, point(value.elbowPole)).end;
        endpointLimited = limited.distanceTo(requested) > 1e-5;
        value.wrist = limited.toArray();
      } else if (position) value[{ Elbow: 'elbowPole', Ankle: 'ankle', Knee: 'kneePole' }[suffix]] = position;
      if (quaternion && (suffix === 'Wrist' || suffix === 'Ankle')) value[suffix === 'Wrist' ? 'handQuaternion' : 'footQuaternion'] = quaternion;
    }
    const effective = applyPose(pose);
    if (endpointLimited) poseWarnings.unshift('手腕已限制在当前肩部与真实手臂长度能够到达的位置。');
    return effective;
  }

  function calculateBounds() {
    if (boundsDirty) {
      posedBounds.makeEmpty();
      for (const value of descriptors.values()) transformBounds(value.bounds, value.matrix, posedBounds);
      boundsDirty = false;
    }
    return { min: posedBounds.min.toArray(), max: posedBounds.max.toArray() };
  }

  function setLayer(value) {
    layer = value;
    model.userData.coachLayer = value;
  }

  function setHighlight(groupId) {
    selected = groupId;
    model.userData.selectedMuscle = groupId;
  }

  function getMetrics() {
    const joints = {
      pelvis: pelvis.toArray(), shoulderCenter: upperTarget(rest.torso).toArray(),
      neck: upperTarget(rest.neck).toArray(), head: upperTarget(rest.head).toArray(),
    };
    const segmentLengths = { torso: rest.pelvis.distanceTo(rest.torso) };
    const expectedLengths = { torso: rest.pelvis.distanceTo(rest.torso) };
    const supportHands = [], supportDrift = {}, supports = {};
    for (const side of SIDES) {
      const value = limbs[side], target = targets[side];
      for (const suffix of ['shoulder', 'elbow', 'wrist', 'palm', 'hip', 'knee', 'ankle', 'toe']) joints[side + suffix[0].toUpperCase() + suffix.slice(1)] = target[suffix].toArray();
      supports[side] = value.support;
      if (value.support) supportHands.push(side);
      supportDrift[side] = value.support ? target.palm.distanceTo(value.anchor) : null;
      segmentLengths[side + 'UpperArm'] = target.shoulder.distanceTo(target.elbow);
      segmentLengths[side + 'Forearm'] = target.elbow.distanceTo(target.wrist);
      segmentLengths[side + 'Thigh'] = target.hip.distanceTo(target.knee);
      segmentLengths[side + 'Shin'] = target.knee.distanceTo(target.ankle);
      for (const suffix of ['UpperArm', 'Forearm', 'Thigh', 'Shin']) expectedLengths[side + suffix] = value[suffix[0].toLowerCase() + suffix.slice(1)];
    }
    return {
      time, angle, period: sequence.period, mode, manual: mode === 'manual', layer, selected, legPath, interpolation,
      bodyQuaternion: bodyRotation.toArray(), groundLock, warnings: [...poseWarnings],
      torsoQuaternion: torsoRotation.toArray(),
      name: 'Snow 友善健身主角', source: rigData.source, license: rigData.license,
      illustrative: true, motionType: 'Flare 教学示意', automaticallyBound: false,
      keyframes: { ...sequence.keyframes },
      demonstration: { index: sequence.stepAt(time), count: sequence.steps.length, id: sequence.steps[sequence.stepAt(time)].id, phase: sequence.steps[sequence.stepAt(time)].phase },
      supportHands, supports, supportDrift, segmentLengths, expectedLengths, joints,
      minFootHeight: minimumFootHeight, chestForward: FRONT.clone().applyQuaternion(upperRotation()).toArray(),
      bounds: calculateBounds(), neutralBounds, neutralHeight: rigData.height,
      skinning: { bones: descriptors.size, batches: meshes.length, weightedVertices, originalMeshes: meshes.length, authoredWeights: true },
      supportAnchors: Object.fromEntries(SIDES.map(side => [side, limbs[side].anchor.toArray()])),
    };
  }

  model.userData.motionSource = 'Snow Rig / Blender Foundation';
  reset();
  return { group: model, update, reset, setSequence, setLayer, setHighlight, getMetrics, capturePose, applyPose, getEditableHandles, editHandle, getGroundHandPose, alignGroundHands };
}
