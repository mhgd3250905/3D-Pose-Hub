import * as THREE from 'three';
import { createFlareSequence } from './flare-sequence.js';
import { interpolateLimbArc } from './limb-arc.js';
import { installSpineHelpers } from './spine-helpers.js';
import { OFFICIAL_FLARE_SEQUENCE } from './official-poses.js';
import { createPeriodicFlare } from './periodic-flare.js';
import { evaluateSegmentArc, evaluateSegmentOrbit, segmentGuideWeight } from './segment-guides.js';
import { guidedAxisTwist, interpolateGuidedLegRotation, interpolateGuidedRotation, rotateGuidedPole } from './segment-guide-motion.js';

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

function rotationForBendPlane(source, destination, sourceNormal, destinationNormal) {
  const basis = (axis, normal) => {
    const x = axis.clone().normalize(), z = normal.clone().normalize();
    const y = new THREE.Vector3().crossVectors(z, x).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  };
  return basis(destination, destinationNormal).multiply(basis(source, sourceNormal).invert()).normalize();
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
  if (Object.hasOwn(value, 'pelvisQuaternion')) result.pelvisQuaternion = poseQuaternion(value.pelvisQuaternion, '髋部方向');
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
    for (const key of ['elbowTwist', 'kneeTwist', 'upperArmTwist', 'thighTwist']) if (Object.hasOwn(limb, key)) {
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
  let spine = null;
  model.traverse(object => {
    if (object.isBone) bones.set(object.name, object);
    if (object.isSkinnedMesh) {
      meshes.push(object);
      skeletons.add(object.skeleton);
      // Animated bounds are calculated below; GLTF's cached T-pose bounds are stale.
      object.frustumCulled = false;
    }
  });
  // Hidden lower/upper spine helpers (see spine-helpers.js); ?spine=off to compare.
  // Installed while the model is still in its bind pose.
  if (!(typeof location !== 'undefined' && new URLSearchParams(location.search).get('spine') === 'off')) {
    spine = installSpineHelpers({ model, meshes, skeletons, landmarks: rigData.landmarks });
  }
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
        const raw = mesh.skeleton.bones[indices.getComponent(i, component)]?.name;
        const name = raw === 'spineLower' || raw === 'spineUpper' ? 'torso' : raw;
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
      armNormal: rest[side + 'Elbow'].clone().sub(rest[side + 'Shoulder'])
        .cross(rest[side + 'Wrist'].clone().sub(rest[side + 'Elbow'])),
      legNormal: rest[side + 'Knee'].clone().sub(rest[side + 'Hip'])
        .cross(rest[side + 'Ankle'].clone().sub(rest[side + 'Knee'])),
      anchor: new THREE.Vector3(sign * 0.215, FLOOR, 0),
      playAnchor: new THREE.Vector3(sign * 0.215, FLOOR, 0),
      palmOffset, neutralRotation,
      support: false, flight: 0,
    };
  }

  const bodyRotation = new THREE.Quaternion();
  const pelvisRotation = new THREE.Quaternion();
  const torsoRotation = new THREE.Quaternion();
  const waistRest = rest.pelvis.clone().lerp(rest.torso, .30);
  let hasTorsoRotation = false, hasPelvisRotation = false;
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
  const guidedSamples = new WeakMap();
  let legPath = 'arc', interpolation = 'smooth', activeCorrections = [], skippedSteps = [], footCurves = [], segmentGuides = [];
  let motionModel = 'saved', periodicMotion = null;
  let sequenceRevision = 0;
  let bendPlaneRotation = false;
  let sequence = createFlareSequence(OFFICIAL_FLARE_SEQUENCE.steps, {
    period: OFFICIAL_FLARE_SEQUENCE.period, mapTransition: mapPoseTransition, resolveFootEndpoint,
  });
  let groundLock = true, poseWarnings = [];
  const bodyTarget = source => source.clone().sub(rest.pelvis).applyQuaternion(bodyRotation).add(pelvis);
  const pelvisFrame = pose => pose.pelvisQuaternion ?? pose.bodyQuaternion;
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
    spine?.update();
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
    poseBone('pelvis', bodyTarget(rest.pelvis), pelvisRotation);
    const rotation = upperRotation();
    for (const name of ['torso', 'neck', 'head']) poseBone(name, upperTarget(rest[name]), rotation);
  }

  function poseArm(side, target, shoulder, elbow, wrist, handRotation) {
    const body = upperRotation();
    const normal = elbow.clone().sub(shoulder).cross(wrist.clone().sub(elbow));
    // The periodic trial has nonzero elbow/knee bends. Their planes define
    // stable roll, without the 180-degree branch of an axis-only swing.
    const rotation = (source, destination) => bendPlaneRotation
      ? rotationForBendPlane(source, destination, limbs[side].armNormal, normal)
      : rotationFor(source, destination, body);
    const armAxis = rest[side + 'Elbow'].clone().sub(rest[side + 'Shoulder']);
    const armRotation = rotation(armAxis, elbow.clone().sub(shoulder));
    if (target.upperArmTwist) armRotation.multiply(new THREE.Quaternion().setFromAxisAngle(armAxis.normalize(), target.upperArmTwist));
    const foreAxis = rest[side + 'Wrist'].clone().sub(rest[side + 'Elbow']);
    const foreRotation = rotation(foreAxis, wrist.clone().sub(elbow));
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
    const normal = knee.clone().sub(hip).cross(ankle.clone().sub(knee));
    const rotation = (source, destination) => bendPlaneRotation
      ? rotationForBendPlane(source, destination, limbs[side].legNormal, normal)
      : rotationFor(source, destination, pelvisRotation);
    const thighAxis = rest[side + 'Knee'].clone().sub(rest[side + 'Hip']);
    const thighRotation = rotation(thighAxis, knee.clone().sub(hip));
    if (target.thighTwist) thighRotation.multiply(new THREE.Quaternion().setFromAxisAngle(thighAxis.normalize(), target.thighTwist));
    const shinAxis = rest[side + 'Ankle'].clone().sub(rest[side + 'Knee']);
    const shinRotation = rotation(shinAxis, ankle.clone().sub(knee));
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
    bendPlaneRotation = false;
    groundLock = true;
    poseWarnings = [];
    time = 0;
    angle = Math.PI;
    bodyRotation.identity();
    pelvisRotation.identity();hasPelvisRotation = false;
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
    const smooth = !periodicMotion && smoothLoopActive();
    applyPose(periodicMotion ? periodicMotion.sample(nextTime) : smooth ? smoothLoopSample(nextTime) : sequence.sample(nextTime), { playback: smooth, alignBendPlanes: Boolean(periodicMotion), bodyOffset: smooth ? rawY => lateBodyOffset(nextTime, rawY) : 0 });
    mode = 'flare';
    time = nextTime;
    return model;
  }

  function resolvedNode(input, playback = false) {
    const key = `${playback ? 'playback' : 'editable'}:${JSON.stringify(input)}`;
    if (!resolvedNodes.has(key)) {
      if (resolvedNodes.size >= 256) resolvedNodes.clear();
      resolvedNodes.set(key, solvePose(input, { playback }));
    }
    return resolvedNodes.get(key);
  }

  function resolveFootEndpoint(pose, side) {
    return resolvedNode(pose).solved[side].leg.end.toArray();
  }

  // Round hip orbit: a looping sequence (last key repeats the first) moves the hips
  // along a Catmull-Rom curve through the neighbouring keys instead of straight
  // chords, so the pelvis traces one full rounded loop. ?hip=linear restores chords.
  const linearHips = typeof location !== 'undefined' && new URLSearchParams(location.search).get('hip') === 'linear';
  const samePelvisKey = (a, b) => a.pelvis.every((v, i) => Math.abs(v - b.pelvis[i]) < 1e-9)
    && a.bodyQuaternion.every((v, i) => Math.abs(v - b.bodyQuaternion[i]) < 1e-9);
  function roundHipPath(start, end, first, last, blend) {
    const steps = sequence?.steps;
    if (linearHips || !steps || steps.length < 4 || !samePelvisKey(steps[0].pose, steps[steps.length - 1].pose)) return null;
    const n = steps.length - 1; // unique keys in the loop
    const i = steps.findIndex(step => samePelvisKey(step.pose, start));
    if (i < 0 || !samePelvisKey(steps[(i + 1) % steps.length].pose, end)) return null;
    const prev = resolvedNode(steps[(i - 1 + n) % n].pose).constrainedPelvis, next = resolvedNode(steps[(i + 2) % n].pose).constrainedPelvis;
    const p1 = first.constrainedPelvis, p2 = last.constrainedPelvis, t = blend, t2 = t * t, t3 = t2 * t;
    return new THREE.Vector3(0, 0, 0)
      .addScaledVector(prev, -0.5 * t3 + t2 - 0.5 * t)
      .addScaledVector(p1, 1.5 * t3 - 2.5 * t2 + 1)
      .addScaledVector(p2, -1.5 * t3 + 2 * t2 + 0.5 * t)
      .addScaledVector(next, 0.5 * t3 - 0.5 * t2);
  }

  const PLANT_FULL = FLOOR + 0.06, PLANT_NONE = FLOOR + 0.12, ARM_STRAIGHT = 0.9985, PLANT_STRAIGHT = 0.99993; // v21: planted arms near full reach (the IK is steep at .9985)
  // An airborne hand travels on a straight arm (user, 2026-10-07: from lift-off to
  // re-plant the arm never bends). Keep the shoulder->wrist direction and extend
  // to full reach; if that would go through the floor, slide along the floor ring.
  function straightenFreeArms(requested, pelvis) {
    for (const side of SIDES) {
      const source = requested.limbs[side], value = limbs[side];
      if (source.handLocked || source.wrist.y <= PLANT_FULL) continue;
      // Fade the straightening in over the lift-off band instead of snapping the
      // forearm to full reach the frame the wrist crosses PLANT_FULL (v21 jitter).
      const fade = THREE.MathUtils.smoothstep(source.wrist.y, PLANT_FULL, PLANT_NONE);
      const shoulder = upperOffset(rest[side + 'Shoulder'], requested.bodyQuaternion, requested.torsoQuaternion).add(pelvis);
      const reach = (value.upperArm + value.forearm) * ARM_STRAIGHT, d = source.wrist.clone().sub(shoulder);
      if (d.length() < 1e-6 || d.length() >= reach) continue;
      const ext = shoulder.clone().addScaledVector(d.normalize(), reach), low = FLOOR + 0.03;
      if (ext.y < low) {
        const h = shoulder.y - low, flat = new THREE.Vector3(d.x, 0, d.z);
        if (h < reach && flat.lengthSq() > 1e-8) ext.copy(shoulder).addScaledVector(flat.normalize(), Math.sqrt(reach * reach - h * h)).setY(low);
        else ext.y = low;
      }
      source.wrist.lerp(ext, fade);
    }
  }

  // v25: a late-planting hand still in the air counts as planted on its spot for the
  // hip lift, so the hips move exactly as in v24 (poses tagged by smoothLoopSample)
  const latePlantSpots = new WeakMap();
  // v33: a hand that has just lifted off keeps capping the hip lift for a moment (its cap
  // fades out over LIFTOFF_CAP_FADE of the segment) instead of letting go in one frame:
  // with the right spot moved, releasing it at once jumped the hips ~1 cm at the seam and at key 4
  const liftOffCaps = new WeakMap();
  let liftCapFade = null;
  function liftWithLateSpots(requested, pelvis, spots, capFade = null) {
    liftCapFade = capFade;
    try { return liftWithSpots(requested, pelvis, spots); } finally { liftCapFade = null; }
  }
  function liftWithSpots(requested, pelvis, spots) {
    if (!spots?.size) return plantedArmLift(requested, pelvis);
    const saved = [...spots.keys()].map(side => [side, requested.limbs[side].wrist.clone(), requested.limbs[side].handLocked]);
    for (const [side, spot] of spots) { requested.limbs[side].wrist.copy(spot); requested.limbs[side].handLocked = true; }
    const lift = plantedArmLift(requested, pelvis);
    for (const [side, wrist, locked] of saved) { requested.limbs[side].wrist.copy(wrist); requested.limbs[side].handLocked = locked; }
    return lift;
  }
  function plantedArmLift(requested, pelvis) {
    let lift = 0;
    const capParts = [];
    for (const side of SIDES) {
      const wrist = requested.limbs[side].wrist, value = limbs[side];
      // Lift to (almost) full reach: at ARM_STRAIGHT the elbow sits on the steep
      // part of the IK curve, so a 1 mm change flipped it between 174 and 179 deg
      // (v21 jitter). Holding planted arms at ~179 deg keeps them visibly still.
      const full = value.upperArm + value.forearm - 2e-5, reach = full * PLANT_STRAIGHT;
      const shoulder = upperOffset(rest[side + 'Shoulder'], requested.bodyQuaternion, requested.torsoQuaternion).add(pelvis);
      const d = shoulder.clone().sub(wrist), flat = Math.hypot(d.x, d.z);
      // never lift a locked/low hand's shoulder out of its arm's reach
      // The cap fades in as a hand comes down (v21: switching it on at one height
      // dropped the hips 3.5 cm in one frame and buckled the support elbow).
      const capWeight = requested.limbs[side].handLocked ? 1 : smoothOff ? 1 - THREE.MathUtils.smoothstep(wrist.y, PLANT_FULL, PLANT_NONE + 0.05) : liftCapFade?.[side] ?? 0;
      if (capWeight > 0) capParts.push([capWeight, flat < full ? Math.sqrt(full * full - flat * flat) - d.y : 0]);
      const weight = THREE.MathUtils.clamp((PLANT_NONE - wrist.y) / (PLANT_NONE - PLANT_FULL), 0, 1);
      if (weight <= 0 || d.length() >= reach || flat >= reach) continue;
      lift = Math.max(lift, weight * (Math.sqrt(reach * reach - flat * flat) - d.y));
    }
    for (const [weight, limit] of capParts) lift = Math.min(lift, lift + weight * (Math.min(lift, limit) - lift));
    return Math.max(0, lift);
  }

  // v21 SMOOTH LOOP (user: the animation still judders; make the flare silky).
  // A saved loop used to play key-to-key: smoothstep time stopped every key, the
  // repeated last key was a dead second, and lerp/slerp/arc blends turned sharply
  // at each key. Playback now runs one periodic Catmull-Rom (Hermite) spline
  // through the unique keys at constant parameter speed: hips, wrists, leg
  // directions in the pelvis frame and every orientation are C1 across keys.
  // Planted hands get zero tangents, so they stay put and lift off softly.
  // ?smooth=0 restores the old key-to-key playback.
  const smoothOff = (typeof location !== 'undefined' && new URLSearchParams(location.search).get('smooth') === '0') || globalThis.__COACH_SMOOTH_OFF === true;
  const H = t => { const t2 = t * t, t3 = t2 * t; return [2 * t3 - 3 * t2 + 1, t3 - 2 * t2 + t, -2 * t3 + 3 * t2, t3 - t2]; };
  function hermiteV(p0, p1, p2, p3, t, hold1 = false, hold2 = false) {
    const [a, b, c, d] = H(t);
    const m1 = hold1 ? new THREE.Vector3() : p2.clone().sub(p0).multiplyScalar(.5);
    const m2 = hold2 ? new THREE.Vector3() : p3.clone().sub(p1).multiplyScalar(.5);
    return p1.clone().multiplyScalar(a).addScaledVector(m1, b).addScaledVector(p2, c).addScaledVector(m2, d);
  }
  function hermiteQ(q0, q1, q2, q3, t, hold1 = false, hold2 = false) {
    const v = q => new THREE.Vector4().fromArray(q);
    const a1 = v(q1), a2 = v(q2), a0 = v(q0), a3 = v(q3);
    if (a2.dot(a1) < 0) a2.negate(); if (a0.dot(a1) < 0) a0.negate(); if (a3.dot(a2) < 0) a3.negate();
    const [h1, h2, h3, h4] = H(t);
    const m1 = hold1 ? new THREE.Vector4() : a2.clone().sub(a0).multiplyScalar(.5);
    const m2 = hold2 ? new THREE.Vector4() : a3.clone().sub(a1).multiplyScalar(.5);
    const r = a1.clone().multiplyScalar(h1).add(m1.multiplyScalar(h2)).add(a2.clone().multiplyScalar(h3)).add(m2.multiplyScalar(h4)).normalize();
    return r.toArray();
  }
  function smoothLoopActive() {
    const steps = sequence?.steps;
    return !smoothOff && !periodicMotion && legPath === 'arc' && interpolation === 'smooth' && steps && steps.length >= 5 && !activeCorrections.length && !skippedSteps.length
      && !footCurves.length && !segmentGuides.length && samePelvisKey(steps[0].pose, steps[steps.length - 1].pose);
  }
  const LIFTOFF_CAP_FADE = 0.12, LATE_VERTICAL_RAISE = true, SHOULDER_GIVE = 0.03, LATE_SNAP = [0.003, 0.03];
  // v41 (user: a raised shoe looked twisted on the shin like a sprained ankle): during
  // playback a foot keeps its hook (shin-foot angle) but its yaw about the shin axis
  // follows the knee (thigh front), and its inversion/eversion roll stays small. The keys'
  // world foot orientations had drifted up to 110 deg from the knee at the sides. Both
  // are soft limits (L*tanh(x/L)), so a small natural offset stays and nothing pops.
  // ?ankle=0 (or globalThis.__COACH_ANKLE_OFF) restores v38.
  const ANKLE_ALIGN = !((typeof location !== 'undefined' && new URLSearchParams(location.search).get('ankle') === '0') || globalThis.__COACH_ANKLE_OFF === true);
  const ANKLE_TWIST_LIMIT = 8 * Math.PI / 180, ANKLE_ROLL_LIMIT = 6 * Math.PI / 180;
  function alignFootToKnee(side, footArray, hip, ankle, frame, thighTwist = 0) {
    const legAxis = ankle.clone().sub(hip);
    if (legAxis.lengthSq() < 1e-10) return footArray;
    const ax = legAxis.normalize();
    const thighRest = rest[side + 'Knee'].clone().sub(rest[side + 'Hip']);
    const thighRotation = rotationFor(thighRest, ax, frame);
    if (thighTwist) thighRotation.multiply(new THREE.Quaternion().setFromAxisAngle(thighRest.clone().normalize(), thighTwist));
    const foot = new THREE.Quaternion().fromArray(footArray);
    const perp = v => v.addScaledVector(ax, -v.dot(ax));
    const knee = perp(FRONT.clone().applyQuaternion(thighRotation)), toe = perp(FRONT.clone().applyQuaternion(foot));
    if (knee.lengthSq() < 1e-8 || toe.lengthSq() < 1e-8) return footArray;
    const twist = Math.atan2(knee.clone().cross(toe).dot(ax), knee.dot(toe));
    const keepTwist = ANKLE_TWIST_LIMIT * Math.tanh(twist / ANKLE_TWIST_LIMIT);
    foot.premultiply(new THREE.Quaternion().setFromAxisAngle(ax, keepTwist - twist));
    const f = FRONT.clone().applyQuaternion(foot), lateral = new THREE.Vector3(1, 0, 0).applyQuaternion(foot);
    const ideal = new THREE.Vector3().crossVectors(f, ax).normalize();
    lateral.addScaledVector(f, -lateral.dot(f)).normalize();
    let roll = Math.atan2(ideal.clone().cross(lateral).dot(f), ideal.dot(lateral));
    if (Math.abs(roll) > Math.PI / 2) roll -= Math.sign(roll) * Math.PI;
    const keepRoll = ANKLE_ROLL_LIMIT * Math.tanh(roll / ANKLE_ROLL_LIMIT);
    foot.premultiply(new THREE.Quaternion().setFromAxisAngle(f.normalize(), keepRoll - roll));
    return foot.normalize().toArray();
  }
  const LATE_PLANT = { right: 0.7 }, LATE_CONVERGE = 0.85, LATE_BLEND = 0.3, APPROACH_OVER = 0.6, APPROACH_FLAT_FROM = 0.0, APPROACH_FLAT_TO = 0.75, APPROACH_POW = 1.8, LATE_EASE_OUT = true, APPROACH_FLAT_TO_LATE = 0.55;
  function lowestHandOffset(side, quaternion) {
    let low = Infinity;
    const wrist = rest[side + 'Wrist'];
    for (let i = 0; i < handPoints[side].length; i += 3) low = Math.min(low, handPoints[side][i].clone().sub(wrist).applyQuaternion(quaternion).y);
    return Number.isFinite(low) ? low : -0.035;
  }
  function smoothLoopSample(sampleTime) {
    const steps = sequence.steps, n = steps.length - 1;
    // Keys 0..n-1 keep their saved times (j * period / (n + 1)), so K markers,
    // lessons and training ranges still line up; the repeated last key no longer
    // holds still: its second is folded into the closing n-1 -> 0 transition.
    const seg = sequence.period / (n + 1), wrapped = ((sampleTime % sequence.period) + sequence.period) % sequence.period;
    const u = wrapped <= (n - 1) * seg ? wrapped / seg : (n - 1) + (wrapped - (n - 1) * seg) / (2 * seg);
    const i = Math.min(n - 1, Math.floor(u)), tBody = u - i;
    let t = tBody;
    const K = j => steps[((j % n) + n) % n].pose;
    const P0 = K(i - 1), P1 = K(i), P2 = K(i + 1), P3 = K(i + 2);
    const pose = structuredClone(P1);
    const q = key => hermiteQ(P0[key] ?? P0.bodyQuaternion, P1[key] ?? P1.bodyQuaternion, P2[key] ?? P2.bodyQuaternion, P3[key] ?? P3.bodyQuaternion, t);
    pose.bodyQuaternion = q('bodyQuaternion');
    if (P1.pelvisQuaternion || P2.pelvisQuaternion) pose.pelvisQuaternion = q('pelvisQuaternion');
    if (P1.torsoQuaternion || P2.torsoQuaternion) pose.torsoQuaternion = hermiteQ(...[P0, P1, P2, P3].map(p => p.torsoQuaternion ?? [0, 0, 0, 1]), t);
    const nodes = [P0, P1, P2, P3].map(pose => resolvedNode(pose, true));
    pose.pelvis = hermiteV(...nodes.map(node => node.constrainedPelvis), t).toArray();
    const swingLater = {}, armPoleFrom = {}, lateSides = new Map(), capFade = {};
    for (const side of SIDES) {
      const LB = [P0, P1, P2, P3].map(p => p.limbs[side]), limb = pose.limbs[side];
      // v25 late plant: a hand whose shoulder is not yet over its spot at the plant key
      // keeps coming down for LATE_PLANT[side] of the next segment, so the arm lands
      // near vertical (like the other hand) instead of leaning and then rolling up.
      let L = LB, an = nodes, t = tBody, hold1 = LB[1].handLocked, hold2 = LB[2].handLocked;
      const late = LATE_PLANT[side] || 0, dur = j => (((j % n) + n) % n) === n - 1 ? 2 : 1;
      if (late && hold2 && !hold1) {
        t = tBody * dur(i) / (dur(i) + late);
        armPoleFrom[side] = { nodes: an, t, mix: 0 };
      }
      else if (late && hold1 && !LB[0].handLocked && tBody < late) {
        const Ps = [K(i - 2), K(i - 1), K(i), K(i + 1)];
        L = Ps.map(p => p.limbs[side]); an = Ps.map(pose => resolvedNode(pose, true));
        t = (dur(i - 1) + tBody) / (dur(i - 1) + late); hold1 = false; hold2 = true;
        armPoleFrom[side] = { nodes: an, t, mix: THREE.MathUtils.smootherstep(tBody, 0, late) };
        lateSides.set(side, an[2].solved[side].arm.end.clone());
      }
      limb.handLocked = hold1 && hold2;
      if (LIFTOFF_CAP_FADE && LB[1].handLocked && !LB[2].handLocked) capFade[side] = 1 - THREE.MathUtils.smoothstep(tBody, 0, LIFTOFF_CAP_FADE);
      limb.handQuaternion = hermiteQ(...L.map(l => l.handQuaternion), t, hold1, hold2);
      // v23: a hand coming in to plant flattens its palm before contact, so it
      // lands palm-first instead of touching down on the fingertips and slapping flat
      if (hold2 && !hold1) {
        const flat = THREE.MathUtils.smoothstep(t, APPROACH_FLAT_FROM, late ? APPROACH_FLAT_TO_LATE : APPROACH_FLAT_TO);
        if (flat > 0) limb.handQuaternion = new THREE.Quaternion().fromArray(limb.handQuaternion).slerp(new THREE.Quaternion().fromArray(L[2].handQuaternion), flat).toArray();
      }
      limb.footQuaternion = hermiteQ(...LB.map(l => l.footQuaternion), tBody);
      limb.wrist = hermiteV(...an.map(node => node.solved[side].arm.end), t, hold1, hold2).toArray();
      if (!limb.handLocked) {
        // An airborne hand swings round its shoulder in the upper-body frame (like the
        // old arc), so it does not cut the chord into the legs; near the floor it
        // blends back to the world path so a planting / lifting hand never slides.
        const upperOf = node => node.requested.bodyQuaternion.clone().multiply(node.requested.torsoQuaternion ?? IDENTITY);
        const lv = an.map(node => node.solved[side].arm.end.clone().sub(node.solved[side].shoulder).applyQuaternion(upperOf(node).invert()));
        // a free arm is always fully straight: aim just past full reach so the IK
        // clamps to 180 deg every frame (keys alone sit at 179, which flickered)
        const lenS = Math.max(hermiteV(...lv.map(v => new THREE.Vector3(v.length(), 0, 0)), t).x, limbs[side].upperArm + limbs[side].forearm + 1e-3);
        const pq = new THREE.Quaternion().fromArray(pose.bodyQuaternion).multiply(pose.torsoQuaternion ? new THREE.Quaternion().fromArray(pose.torsoQuaternion) : IDENTITY.clone());
        const shoulderS = upperOffset(rest[side + 'Shoulder'], new THREE.Quaternion().fromArray(pose.bodyQuaternion), pose.torsoQuaternion ? new THREE.Quaternion().fromArray(pose.torsoQuaternion) : undefined).add(new THREE.Vector3().fromArray(pose.pelvis));
        const local = hermiteV(...lv, t).setLength(lenS).applyQuaternion(pq);
        const swing = shoulderS.clone().add(local);
        const world = new THREE.Vector3().fromArray(limb.wrist);
        const w = THREE.MathUtils.smoothstep(Math.min(world.y, swing.y), PLANT_FULL, PLANT_NONE + 0.1);
        limb.wrist = world.clone().lerp(swing, w).toArray();
        swingLater[side] = { local, world, w, shoulderS, t };
        if (hold2) {
          const plantQ = new THREE.Quaternion().fromArray(L[2].handQuaternion);
          swingLater[side].approach = true;
          swingLater[side].plantWrist = an[2].solved[side].arm.end.clone();
          swingLater[side].startWrist = an[1].solved[side].arm.end.clone();
          swingLater[side].plantLow = an[2].solved[side].arm.end.y + lowestHandOffset(side, plantQ);
          swingLater[side].startLow = an[1].solved[side].arm.end.y + lowestHandOffset(side, new THREE.Quaternion().fromArray(L[1].handQuaternion));
        }
      }
      limb.elbowPole = hermiteV(...L.map(l => new THREE.Vector3().fromArray(l.elbowPole)), t).toArray();
      limb.kneePole = hermiteV(...LB.map(l => new THREE.Vector3().fromArray(l.kneePole)), tBody).toArray();
    }
    t = tBody;
    const requested = validatePose(pose), constrainedPelvis = projectBody(requested);
    const lift = liftWithLateSpots(requested, constrainedPelvis, lateSides, capFade);
    if (lift > 0) { constrainedPelvis.y += lift; requested.pelvis.y += lift; }
    pose.pelvis = constrainedPelvis.toArray();
    // re-anchor airborne hands on the final (projected + lifted) shoulders so the
    // straight arm stays straight; otherwise the lift changed its length each frame
    for (const side of SIDES) {
      const sw = swingLater[side];
      if (!sw) continue;
      const shoulder = upperOffset(rest[side + 'Shoulder'], requested.bodyQuaternion, requested.torsoQuaternion).add(constrainedPelvis);
      const swing = shoulder.clone().add(sw.local);
      pose.limbs[side].wrist = sw.world.clone().lerp(swing, sw.w).toArray();
      // v23: an incoming hand comes down steadily: its lowest point keeps a clearance
      // that shrinks to zero at contact, rather than hovering just above the floor
      if (sw.approach) {
        // v24: like the left hand, the hand gets over its spot first and then drops:
        // the horizontal gap closes ahead of the height, with the arm kept at its length
        {
          const wrist = new THREE.Vector3().fromArray(pose.limbs[side].wrist), R = THREE.MathUtils.lerp(limbs[side].upperArm + limbs[side].forearm + 1e-3, (LATE_PLANT[side] ? sw.plantWrist : wrist).distanceTo(shoulder), THREE.MathUtils.smootherstep(sw.t, LATE_PLANT[side] ? 0.85 : 0.6, 1));
          const k = 1 - APPROACH_OVER * THREE.MathUtils.smootherstep(sw.t, 0, 1);
          const target = sw.plantWrist.clone().add(new THREE.Vector3(wrist.x - sw.plantWrist.x, 0, wrist.z - sw.plantWrist.z).multiplyScalar(k));
          const h2 = (target.x - shoulder.x) ** 2 + (target.z - shoulder.z) ** 2;
          if (h2 < R * R) pose.limbs[side].wrist = target.setY(shoulder.y - Math.sqrt(R * R - h2)).toArray();
          // v26: a late-planting hand heads straight for its spot (like the left hand)
          // instead of reaching out wide and sweeping in along the floor at the end
          if (LATE_PLANT[side]) {
            const cur = new THREE.Vector3().fromArray(pose.limbs[side].wrist), P = sw.plantWrist, S = sw.startWrist;
            const u = THREE.MathUtils.clamp(sw.t / LATE_CONVERGE, 0, 1), f = LATE_EASE_OUT ? (1 - u) ** 3 * (1 + 3 * u) : 1 - THREE.MathUtils.smootherstep(sw.t, 0, LATE_CONVERGE), b = THREE.MathUtils.smoothstep(sw.t, 0, LATE_BLEND);
            let hx = THREE.MathUtils.lerp(cur.x, P.x + (S.x - P.x) * f, b), hz = THREE.MathUtils.lerp(cur.z, P.z + (S.z - P.z) * f, b);
            let g2 = (hx - shoulder.x) ** 2 + (hz - shoulder.z) ** 2;
            let y = g2 < R * R ? shoulder.y - Math.sqrt(R * R - g2) : shoulder.y;
            // v33: in the last few cm above the floor the hand is pulled onto its spot, so it
            // touches down where it stays (no slide on the floor after contact)
            const near = LATE_SNAP ? 1 - THREE.MathUtils.smoothstep(THREE.MathUtils.lerp(cur.y, y, b) - P.y, LATE_SNAP[0], LATE_SNAP[1]) : 0;
            if (near > 0) {
              hx = THREE.MathUtils.lerp(hx, P.x, near); hz = THREE.MathUtils.lerp(hz, P.z, near);
              g2 = (hx - shoulder.x) ** 2 + (hz - shoulder.z) ** 2;
              y = g2 < R * R ? shoulder.y - Math.sqrt(R * R - g2) : shoulder.y;
            }
            pose.limbs[side].wrist = [hx, THREE.MathUtils.lerp(cur.y, y, b), hz];
            // v33: while blending in (b < 1) the lerp of two points on the arm sphere cut
            // inside it, so the free arm bent to ~174 deg around raw 7.2-7.7; keep it at full length
            if (b < 1) {
              const reachV = new THREE.Vector3().fromArray(pose.limbs[side].wrist).sub(shoulder);
              if (reachV.length() > 1e-6 && reachV.length() < R) pose.limbs[side].wrist = shoulder.clone().add(reachV.setLength(R)).toArray();
            }
          }
        }
        const plantLow = sw.plantLow, q = new THREE.Quaternion().fromArray(pose.limbs[side].handQuaternion);
        const low = pose.limbs[side].wrist[1] + lowestHandOffset(side, q);
        const want = LATE_PLANT[side] ? plantLow : plantLow + Math.max(0, sw.startLow - plantLow) * Math.pow(1 - sw.t, APPROACH_POW);
        if (low < want && LATE_PLANT[side] && LATE_VERTICAL_RAISE) {
          // v33: a late-planting hand that would dip below its floor clearance is raised
          // straight up. The old raise slid it out radially on the shoulder sphere; with the
          // shoulder almost over the spot a 1 mm raise threw the hand 2-3 cm sideways
          // (floor slide, then a pop). solvePose lets the shoulder give the last few mm.
          pose.limbs[side].wrist[1] += want - low;
        } else if (low < want) {
          // raise the wrist on its own sphere round the shoulder, so the arm length is kept
          const wrist = new THREE.Vector3().fromArray(pose.limbs[side].wrist), reach = wrist.distanceTo(shoulder);
          const dy = wrist.y + want - low - shoulder.y, flat = new THREE.Vector3(wrist.x - shoulder.x, 0, wrist.z - shoulder.z);
          if (Math.abs(dy) < reach && flat.lengthSq() > 1e-10) pose.limbs[side].wrist = shoulder.clone().addScaledVector(flat.normalize(), Math.sqrt(reach * reach - dy * dy)).setY(shoulder.y + dy).toArray();
        }
      }
      requested.limbs[side].wrist.fromArray(pose.limbs[side].wrist);
    }
    const upper = requested.bodyQuaternion.clone().multiply(requested.torsoQuaternion ?? IDENTITY);
    const upperAt = node => node.requested.bodyQuaternion.clone().multiply(node.requested.torsoQuaternion ?? IDENTITY);
    const [first, last] = [nodes[1], nodes[2]];
    for (const side of SIDES) {
      const value = limbs[side], from = first.solved[side], to = last.solved[side];
      // legs: spline the hip->ankle vector in each key's pelvis frame, keep its length
      const local = node => node.solved[side].leg.end.clone().sub(node.solved[side].hip).applyQuaternion(pelvisFrame(node.requested).clone().invert());
      const lv = nodes.map(local), lenS = hermiteV(...lv.map(v => new THREE.Vector3(v.length(), 0, 0)), t).x;
      const frame = pelvisFrame(requested);
      const hip = rest[side + 'Hip'].clone().sub(rest.pelvis).applyQuaternion(frame).add(constrainedPelvis);
      const ankle = hip.clone().add(hermiteV(...lv, t).setLength(lenS).applyQuaternion(frame));
      // keep a straight leg straight near the floor: swing it up on its own sphere
      const floorHeight = pose.groundLock ? requiredAnkleHeight(side, requested.limbs[side].footQuaternion) : -Infinity;
      if (ankle.y < floorHeight && floorHeight - hip.y <= lenS) {
        const h = floorHeight - hip.y, flat = new THREE.Vector3(ankle.x - hip.x, 0, ankle.z - hip.z);
        if (flat.lengthSq() > 1e-10) ankle.copy(hip).addScaledVector(flat.normalize(), Math.sqrt(lenS * lenS - h * h)).setY(floorHeight);
      }
      const leg = interpolateLimbArc({
        startRoot: from.hip.toArray(), endRoot: to.hip.toArray(), currentRoot: hip.toArray(),
        startTarget: from.leg.end.toArray(), endTarget: to.leg.end.toArray(), currentTarget: ankle.toArray(),
        startMiddle: from.leg.middle.toArray(), endMiddle: to.leg.middle.toArray(),
        startReference: pelvisFrame(first.requested).toArray(), endReference: pelvisFrame(last.requested).toArray(), currentReference: frame.toArray(),
        blend: t, upperLength: value.thigh, lowerLength: value.shin, arc: false, side,
      });
      // Poles also follow the spline (in the pelvis / upper-body frame), so the
      // roll of a straight limb has no kink at a key (v21: forearm snapped at keys).
      const splinePole = (rootAt, middleAt, frameAt, curFrame, root) => {
        const vs = nodes.map(node => middleAt(node).clone().sub(rootAt(node)).applyQuaternion(frameAt(node).clone().invert()));
        return root.clone().add(hermiteV(...vs, t).applyQuaternion(curFrame)).toArray();
      };
      pose.limbs[side].ankle = leg.target;
      if (ANKLE_ALIGN) pose.limbs[side].footQuaternion = alignFootToKnee(side, pose.limbs[side].footQuaternion, hip, new THREE.Vector3().fromArray(leg.target), frame, pose.limbs[side].thighTwist ?? 0);
      pose.limbs[side].kneePole = splinePole(node => node.solved[side].hip, node => node.requested.limbs[side].kneePole, node => pelvisFrame(node.requested), frame, hip);
      const shoulder = upperOffset(rest[side + 'Shoulder'], requested.bodyQuaternion, requested.torsoQuaternion).add(constrainedPelvis);
      const arm = interpolateLimbArc({
        startRoot: from.shoulder.toArray(), endRoot: to.shoulder.toArray(), currentRoot: shoulder.toArray(),
        startTarget: from.arm.end.toArray(), endTarget: to.arm.end.toArray(), currentTarget: pose.limbs[side].wrist,
        startMiddle: from.arm.middle.toArray(), endMiddle: to.arm.middle.toArray(),
        startReference: upperAt(first).toArray(), endReference: upperAt(last).toArray(), currentReference: upper.toArray(),
        blend: t, upperLength: value.upperArm, lowerLength: value.forearm, arc: false, side,
      });
      pose.limbs[side].elbowPole = splinePole(node => node.solved[side].shoulder, node => node.requested.limbs[side].elbowPole, upperAt, upper, shoulder);
      const lateArm = armPoleFrom[side];
      if (lateArm) {
        const vs = lateArm.nodes.map(node => node.requested.limbs[side].elbowPole.clone().sub(node.solved[side].shoulder).applyQuaternion(upperAt(node).clone().invert()));
        const approachPole = shoulder.clone().add(hermiteV(...vs, lateArm.t).applyQuaternion(upper));
        pose.limbs[side].elbowPole = approachPole.lerp(new THREE.Vector3().fromArray(pose.limbs[side].elbowPole), lateArm.mix).toArray();
      }
    }
    if (lateSides.size) latePlantSpots.set(pose, lateSides);
    if (Object.keys(capFade).length) liftOffCaps.set(pose, capFade);
    return pose;
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
      const hip = rest[side + 'Hip'].clone().sub(rest.pelvis).applyQuaternion(pelvisFrame(requested)).add(constrainedPelvis);
      const floorHeight = pose.groundLock ? requiredAnkleHeight(side, requested.limbs[side].footQuaternion) : -Infinity;
      const leg = interpolateLimbArc({
        startRoot: from.hip.toArray(), endRoot: to.hip.toArray(), currentRoot: hip.toArray(),
        startTarget: from.leg.end.toArray(), endTarget: to.leg.end.toArray(), currentTarget: pose.limbs[side].ankle,
        startMiddle: from.leg.middle.toArray(), endMiddle: to.leg.middle.toArray(),
        startReference: pelvisFrame(first.requested).toArray(), endReference: pelvisFrame(last.requested).toArray(), currentReference: pelvisFrame(requested).toArray(),
        blend, upperLength: value.thigh, lowerLength: value.shin, floorHeight, side,
      });
      pose.limbs[side].ankle = leg.target;pose.limbs[side].kneePole = leg.pole;
    }
    return pose;
  }

  function boneRotationsFromSolved(node) {
    const { requested, solved } = node;
    const upper = requested.bodyQuaternion.clone().multiply(requested.torsoQuaternion ?? IDENTITY);
    const hips = pelvisFrame(requested);
    const rotations = { pelvis: hips.clone(), torso: upper.clone(), neck: upper.clone(), head: upper.clone() };
    for (const side of SIDES) {
      const { source, shoulder, arm, hip, leg } = solved[side];
      const definitions = [
        ['UpperArm', 'Shoulder', 'Elbow', arm.middle.clone().sub(shoulder), upper, 'upperArmTwist'],
        ['Forearm', 'Elbow', 'Wrist', arm.end.clone().sub(arm.middle), upper, 'elbowTwist'],
        ['Thigh', 'Hip', 'Knee', leg.middle.clone().sub(hip), hips, 'thighTwist'],
        ['Shin', 'Knee', 'Ankle', leg.end.clone().sub(leg.middle), hips, 'kneeTwist'],
      ];
      for (const [bone, from, to, destination, reference, twist] of definitions) {
        const axis = rest[side + to].clone().sub(rest[side + from]);
        const rotation = rotationFor(axis, destination, reference);
        if (source[twist]) rotation.multiply(new THREE.Quaternion().setFromAxisAngle(axis.normalize(), source[twist]));
        rotations[side + bone] = rotation;
      }
      rotations[side + 'Scapula'] = upper.clone();
      rotations[side + 'Patella'] = rotations[side + 'Thigh'].clone().slerp(rotations[side + 'Shin'], .52);
      rotations[side + 'Hand'] = source.handQuaternion.clone();
      rotations[side + 'Foot'] = source.footQuaternion.clone();
    }
    return rotations;
  }

  function mapGuidedTransition(pose, { start, end, blend, guide }) {
    // Guides are an opt-in layer over the already sampled route, including old
    // foot curves. Every edit remains an ordinary replayable pose; no display
    // correction is attached to the live skeleton or the saved anchors.
    const result = structuredClone(pose), baseline = solvePose(pose), weight = segmentGuideWeight(blend);
    const first = resolvedNode(start), last = resolvedNode(end), goals = {}, notes = [];
    const offset = joint => point(guide.bends?.[joint] ?? [0, 0, 0]).multiplyScalar(weight);
    const endpointAt = (node, joint) => joint === 'pelvis' ? node.constrainedPelvis
      : node.solved[joint.startsWith('left') ? 'left' : 'right'][joint.endsWith('Wrist') ? 'arm' : 'leg'].end;
    // An explicit arc replaces the selected joint's old route. Offsetting an
    // already floor-clipped path would otherwise retain its flat turns.
    const goalAt = joint => guide.orbitPaths?.[joint]
      ? evaluateSegmentOrbit(endpointAt(first, joint).toArray(), endpointAt(last, joint).toArray(), guide.orbitPaths[joint], blend)
      : guide.smoothPaths?.[joint]
        ? evaluateSegmentArc(endpointAt(first, joint).toArray(), endpointAt(last, joint).toArray(), guide.smoothPaths[joint].bend, blend)
        : endpointAt(baseline, joint).clone().add(offset(joint)).toArray();
    // Route handles are measured on the actual old IK path. An unreachable
    // legacy foot-curve goal must not add an invisible offset to a new handle.
    goals.pelvis = goalAt('pelvis');
    result.pelvis = [...goals.pelvis];
    for (const side of SIDES) {
      const limb = result.limbs[side];
      const shared = first.requested.limbs[side].handLocked && last.requested.limbs[side].handLocked;
      if (shared) {
        // A common support anchor belongs to the key poses, not the route.
        // Differing authored anchors retain their original interpolation.
        limb.wrist = first.solved[side].arm.end.clone().lerp(last.solved[side].arm.end, blend).toArray();
        if (guide.orbitPaths?.[side + 'Wrist'] || guide.smoothPaths?.[side + 'Wrist'] || offset(side + 'Wrist').lengthSq() > 1e-16) {
          notes.push(`${side === 'left' ? '左' : '右'}手在两端均为支撑手，腕部路线偏移已忽略。`);
        }
      } else {
        goals[side + 'Wrist'] = goalAt(side + 'Wrist');
        limb.wrist = [...goals[side + 'Wrist']];
      }
      goals[side + 'Ankle'] = goalAt(side + 'Ankle');
      limb.ankle = [...goals[side + 'Ankle']];
    }
    const projected = solvePose(result);
    result.pelvis = projected.constrainedPelvis.toArray();
    const upperAt = node => node.requested.bodyQuaternion.clone().multiply(node.requested.torsoQuaternion ?? IDENTITY);
    for (const side of SIDES) {
      const value = limbs[side], from = first.solved[side], to = last.solved[side], current = projected.solved[side];
      const limb = result.limbs[side];
      for (const arm of [true, false]) {
        const root = arm ? current.shoulder : current.hip;
        const endpoint = arm ? current.arm.end : current.leg.end;
        const sourceA = arm ? from.arm : from.leg, sourceB = arm ? to.arm : to.leg;
        const bend = interpolateLimbArc({
          startRoot: (arm ? from.shoulder : from.hip).toArray(),
          endRoot: (arm ? to.shoulder : to.hip).toArray(), currentRoot: root.toArray(),
          startTarget: sourceA.end.toArray(), endTarget: sourceB.end.toArray(), currentTarget: endpoint.toArray(),
          startMiddle: sourceA.middle.toArray(), endMiddle: sourceB.middle.toArray(),
          startReference: (arm ? upperAt(first) : pelvisFrame(first.requested)).toArray(),
          endReference: (arm ? upperAt(last) : pelvisFrame(last.requested)).toArray(),
          currentReference: (arm ? upperAt(projected) : pelvisFrame(projected.requested)).toArray(),
          blend, upperLength: arm ? value.upperArm : value.thigh,
          lowerLength: arm ? value.forearm : value.shin, arc: false, side,
        });
        const angle = (guide.bendAngles?.[side + (arm ? 'Elbow' : 'Knee')] ?? 0) * weight;
        limb[arm ? 'wrist' : 'ankle'] = endpoint.toArray();
        limb[arm ? 'elbowPole' : 'kneePole'] = rotateGuidedPole(root, endpoint, point(bend.pole), angle).toArray();
      }
    }
    const actual = solvePose(result), firstRotations = boneRotationsFromSolved(first), lastRotations = boneRotationsFromSolved(last);
    for (const side of SIDES) {
      const from = first.solved[side], to = last.solved[side], current = actual.solved[side];
      for (const arm of [true, false]) {
        const rootAt = node => arm ? node.shoulder : node.hip;
        const chainAt = node => arm ? node.arm : node.leg;
        const normalAt = node => chainAt(node).middle.clone().sub(rootAt(node))
          .cross(chainAt(node).end.clone().sub(chainAt(node).middle));
        const sourceNormal = arm ? limbs[side].armNormal : limbs[side].legNormal;
        for (const lower of [false, true]) {
          const bone = side + (arm ? lower ? 'Forearm' : 'UpperArm' : lower ? 'Shin' : 'Thigh');
          const twist = arm ? lower ? 'elbowTwist' : 'upperArmTwist' : lower ? 'kneeTwist' : 'thighTwist';
          const sourceAxis = rest[side + (arm ? lower ? 'Wrist' : 'Elbow' : lower ? 'Ankle' : 'Knee')].clone()
            .sub(rest[side + (arm ? lower ? 'Elbow' : 'Shoulder' : lower ? 'Knee' : 'Hip')]);
          const axisAt = node => lower ? chainAt(node).end.clone().sub(chainAt(node).middle)
            : chainAt(node).middle.clone().sub(rootAt(node));
          const desired = arm ? interpolateGuidedRotation({ sourceAxis, sourceNormal,
            startAxis: axisAt(from), endAxis: axisAt(to), currentAxis: axisAt(current),
            startNormal: normalAt(from), endNormal: normalAt(to), currentNormal: normalAt(current),
            startRotation: firstRotations[bone], endRotation: lastRotations[bone], blend })
            : interpolateGuidedLegRotation({ sourceAxis, currentAxis: axisAt(current),
              startRotation: firstRotations[bone], endRotation: lastRotations[bone],
              startReference: pelvisFrame(first.requested), endReference: pelvisFrame(last.requested),
              currentReference: pelvisFrame(actual.requested), blend });
          const reference = arm ? upperAt(actual) : pelvisFrame(actual.requested);
          const base = rotationFor(sourceAxis, axisAt(current), reference);
          result.limbs[side][twist] = guidedAxisTwist(base, desired, sourceAxis);
        }
      }
    }
    guidedSamples.set(result, { targets: goals, warnings: [...new Set([...projected.warnings, ...actual.warnings, ...notes])] });
    return result;
  }

  function setSequence(steps, options = {}) {
    const nextLegPath = options.legPath === 'linear' ? 'linear' : 'arc';
    const next = createFlareSequence(steps, {
      ...options, mapTransition: nextLegPath === 'arc' ? mapPoseTransition : undefined, resolveFootEndpoint, mapGuidedTransition,
    });
    if (options.segmentGuides?.some(guide => Object.keys(guide.orbitPaths ?? {}).length)) {
      // Orbit centers are checked against the actually solved endpoints. Do
      // this before assigning the new sequence, so an invalid center cannot
      // leave a failed preview installed in the live animation. Dormant routes
      // keep their data until their saved anchors become adjacent again.
      const times = [...new Set([
        ...steps.map((step, index) => index * next.period / steps.length),
        ...(options.corrections ?? []).map(point => (point.segment + point.at) * next.period / steps.length),
      ])].sort((a, b) => a - b);
      for (let index = 0; index < times.length; index++) {
        const middle = (times[index] + (times[index + 1] ?? next.period)) / 2;
        const match = next.guideAt(middle);
        if (match && Object.keys(match.guide.orbitPaths ?? {}).length) next.sample(middle);
      }
    }
    const nextPeriodic = options.motionModel === 'periodic' ? createPeriodicFlare({
      landmarks: rigData.landmarks, period: next.period,
      groundHands: Object.fromEntries(SIDES.map(side => [side, getGroundHandPose(side, [0, 0, 1])])),
      shoeOffsets: Object.fromEntries(SIDES.map(side => [side, Array.from({ length: 8 }, (_, corner) => {
        const box = footBounds[side];
        return new THREE.Vector3(corner & 1 ? box.max.x : box.min.x, corner & 2 ? box.max.y : box.min.y, corner & 4 ? box.max.z : box.min.z)
          .sub(rest[side + 'Ankle']).toArray();
      })])),
    }) : null;
    // Validate the entire trial before replacing a working animation.
    if (nextPeriodic) for (let i = 0; i < 180; i++) solvePose(nextPeriodic.sample(i * next.period / 180));
    const nextCorrections = structuredClone(options.corrections ?? []);
    const nextSkippedSteps = structuredClone(options.skippedSteps ?? []);
    const nextFootCurves = structuredClone(options.footCurves ?? []);
    const nextSegmentGuides = structuredClone(options.segmentGuides ?? []);
    sequence = next;
    sequenceRevision++;
    activeCorrections = nextCorrections;
    skippedSteps = nextSkippedSteps;
    footCurves = nextFootCurves;
    segmentGuides = nextSegmentGuides;
    periodicMotion = nextPeriodic;
    motionModel = nextPeriodic ? 'periodic' : 'saved';
    resolvedNodes.clear();
    legPath = nextLegPath;
    interpolation = options.interpolation ?? 'smooth';
    if (mode === 'flare') update(time);
  }

  function sequenceForPreview(options = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('动画采样选项需要为对象。');
    const path = options.legPath ?? legPath;
    if (!['arc', 'linear'].includes(path)) throw new Error('未知的轨迹路线。');
    const current = { steps: sequence.steps, corrections: activeCorrections, legPath, interpolation,
      skippedSteps, footCurves, segmentGuides };
    const overridden = Object.keys(current)
      .some(key => options[key] !== undefined && JSON.stringify(options[key]) !== JSON.stringify(current[key]));
    return overridden ? createFlareSequence(options.steps ?? sequence.steps, {
      period: options.period ?? sequence.period,
      corrections: options.corrections ?? activeCorrections,
      skippedSteps: options.skippedSteps ?? skippedSteps,
      footCurves: options.footCurves ?? footCurves, resolveFootEndpoint,
      segmentGuides: options.segmentGuides ?? segmentGuides, mapGuidedTransition,
      interpolation: options.interpolation ?? interpolation,
      mapTransition: path === 'arc' ? mapPoseTransition : undefined,
    }) : sequence;
  }

  function samplePose(sampleTime, options = {}) {
    if (!Number.isFinite(sampleTime)) throw new Error('动画采样时间需要为有限数值。');
    const preview = sequenceForPreview(options);
    return preview === sequence && smoothLoopActive() ? smoothLoopSample(sampleTime) : preview.sample(sampleTime);
  }

  function getSegmentGuideAt(sampleTime, options = {}) {
    if (typeof options === 'string') return sequence.guideAt(sampleTime, options);
    return sequenceForPreview(options).guideAt(sampleTime, { prefer: options.prefer ?? 'next' });
  }

  function sampleTrajectory(options = {}) {
    const { startTime, endTime, samples = 64, includeTimes = [] } = options;
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
      throw new Error('轨迹起止时间需要有限数值，结束时间不能早于开始时间。');
    }
    if (!Number.isInteger(samples) || samples < 2 || samples > 512) throw new Error('轨迹采样数量需要为 2–512 的整数。');
    if (!Array.isArray(includeTimes) || includeTimes.some(value => !Number.isFinite(value) || value < startTime || value > endTime)) {
      throw new Error('额外关键帧时间必须位于轨迹区间内。');
    }
    const previewSequence = sequenceForPreview(options);
    const smooth = previewSequence === sequence && smoothLoopActive();
    const uniformTimes = Array.from({ length: samples }, (_, index) => index === samples - 1
      ? endTime : startTime + (endTime - startTime) * index / (samples - 1));
    const times = includeTimes.length && endTime > startTime
      ? [...new Set([...uniformTimes, ...includeTimes])].sort((a, b) => a - b) : uniformTimes;
    // Solve the same saved animation as playback without applying any pose to
    // the live rig. Draft overrides therefore cannot move bones, time or camera.
    const frames = times.map(sampleTime => {
      const playbackTime = ((sampleTime % sequence.period) + sequence.period) % sequence.period;
      const pose = smooth ? smoothLoopSample(playbackTime) : previewSequence.sample(sampleTime);
      const node = solvePose(pose, { playback: smooth });
      if (smooth) offsetSolvedBody(node, lateBodyOffset(playbackTime, node.constrainedPelvis.y));
      const { requested, constrainedPelvis, solved } = node;
      const upper = name => upperOffset(rest[name], requested.bodyQuaternion, requested.torsoQuaternion).add(constrainedPelvis).toArray();
      const joints = { pelvis: constrainedPelvis.toArray(),
        waist: waistRest.clone().sub(rest.pelvis).applyQuaternion(requested.bodyQuaternion).add(constrainedPelvis).toArray(),
        shoulderCenter: upper('torso'), neck: upper('neck'), head: upper('head') };
      for (const side of SIDES) {
        const { source, shoulder, arm, hip, leg } = solved[side];
        const positions = {
          shoulder, elbow: arm.middle, wrist: arm.end,
          palm: limbs[side].palmOffset.clone().applyQuaternion(source.handQuaternion).add(arm.end),
          hip, knee: leg.middle, ankle: leg.end,
          toe: new THREE.Vector3(0, 0, .18).applyQuaternion(source.footQuaternion).add(leg.end),
        };
        for (const [name, position] of Object.entries(positions)) joints[side + name[0].toUpperCase() + name.slice(1)] = position.toArray();
      }
      const curveTargets = {};
      for (const side of SIDES) {
        const curve = previewSequence.curveAt(sampleTime, side);
        if (curve) curveTargets[side] = curve.position;
      }
      const guided = guidedSamples.get(pose);
      const diagnostics = guided ? {
        warnings: [...new Set([...guided.warnings, ...node.warnings])],
        goalErrors: Object.fromEntries(Object.entries(guided.targets)
          .map(([joint, goal]) => [joint, point(joints[joint]).distanceTo(point(goal))])),
      } : null;
      return { time: sampleTime, joints, ...(Object.keys(curveTargets).length ? { curveTargets } : {}),
        ...(guided ? { guideTargets: structuredClone(guided.targets), diagnostics } : {}),
        ...(options.includeBoneRotations ? { boneRotations: Object.fromEntries(Object.entries(boneRotationsFromSolved(node))
          .map(([bone, rotation]) => [bone, rotation.toArray()])) } : {}) };
    });
    return { startTime, endTime, frames };
  }

  function capturePose() {
    return {
      version: 1,
      pelvis: pelvis.toArray(),
      bodyQuaternion: bodyRotation.toArray(),
      ...(hasPelvisRotation ? { pelvisQuaternion: pelvisRotation.toArray() } : {}),
      ...(hasTorsoRotation ? { torsoQuaternion: torsoRotation.toArray() } : {}),
      limbs: Object.fromEntries(SIDES.map(side => [side, {
        wrist: targets[side].wrist.toArray(),
        elbowPole: (targets[side].elbowPole ?? targets[side].elbow).toArray(),
        handQuaternion: descriptors.get(side + 'Hand').rotation.toArray(),
        ankle: targets[side].ankle.toArray(),
        kneePole: (targets[side].kneePole ?? targets[side].knee).toArray(),
        footQuaternion: descriptors.get(side + 'Foot').rotation.toArray(),
        handLocked: limbs[side].support,
        ...Object.fromEntries(['elbowTwist', 'kneeTwist', 'upperArmTwist', 'thighTwist']
          .filter(key => targets[side][key] !== undefined).map(key => [key, targets[side][key]])),
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
        const hipOffset = rest[side + 'Hip'].clone().sub(rest.pelvis).applyQuaternion(pelvisFrame(requested));
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

  function solvePose(input, { playback = false } = {}) {
    // Validate and solve before mutating bones, so a bad import leaves the
    // current pose intact and cannot introduce NaNs into the live skeleton.
    const requested = validatePose(input);
    const constrainedPelvis = projectBody(requested);
    // Playback constraints must not straighten a user's bent-arm manual draft.
    const lift = playback ? liftWithLateSpots(requested, constrainedPelvis, latePlantSpots.get(input), liftOffCaps.get(input)) : 0;
    if (lift > 0) {
      constrainedPelvis.y += lift; requested.pelvis.y += lift;
      for (const side of SIDES) { requested.limbs[side].ankle.y += lift; if (requested.limbs[side].kneePole) requested.limbs[side].kneePole.y += lift; }
    }
    if (playback) straightenFreeArms(requested, constrainedPelvis);
    const warnings = [];
    const solved = {};
    const at = name => rest[name].clone().sub(rest.pelvis).applyQuaternion(pelvisFrame(requested)).add(constrainedPelvis);
    if (constrainedPelvis.distanceTo(requested.pelvis) > 1e-5) warnings.push('躯干位置已限制，以保持锁定手掌、真实骨长和地面高度。');
    for (const side of SIDES) {
      const source = requested.limbs[side], value = limbs[side];
      const label = side === 'left' ? '左' : '右';
      const shoulder = upperOffset(rest[side + 'Shoulder'], requested.bodyQuaternion, requested.torsoQuaternion).add(constrainedPelvis);
      // v33: a hand on (or at) the floor whose shoulder sits closer than a straight arm
      // (both hands down, the hips held by the other straight arm) keeps its arm straight:
      // the shoulder gives along the arm (a small push / shrug, <= SHOULDER_GIVE) instead of the elbow bending
      if (playback && SHOULDER_GIVE && (source.handLocked || source.wrist.y <= PLANT_FULL)) {
        const away = shoulder.clone().sub(source.wrist), d = away.length(), want = (value.upperArm + value.forearm) * PLANT_STRAIGHT;
        if (d > 1e-6 && d < want - 1e-4) shoulder.copy(source.wrist).addScaledVector(away, Math.min(want, d + SHOULDER_GIVE) / d);
      }
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

  // v27/v28 (applied to every support hand-over, right and left). v27 (user: as the right hand lands the whole body dips and pops back up): with
  // both support arms straight, the hand-over from the left to the right arm put a
  // sharp corner into the body height at the plant key. Around a late plant the body
  // (hips, torso, head, legs) follows a smoothed height instead; the arms keep their
  // exact paths, so the shoulders give the ~1 cm difference (a small shrug / push).
  const BODY_SMOOTH_SIGMA = 0.22, BODY_SMOOTH_BEFORE = 0.9, BODY_SMOOTH_AFTER = 1.2, BODY_SMOOTH_EDGE = 0.3, BODY_SMOOTH_STEP = 0.02, BODY_SMOOTH_MAX_GIVE = 0.015, BODY_MONO_BEFORE = 0.85, BODY_MONO_AFTER = 1.15, BODY_MONO_EXACT = true;
  let bodySmoothCache = null;
  function lateBodyOffset(sampleTime, rawY = null) {
    const steps = sequence?.steps, n = steps ? steps.length - 1 : 0;
    if (!n || !Object.keys(LATE_PLANT).length) return 0;
    if (bodySmoothCache?.sequence !== sequence) {
      const period = sequence.period, seg = period / (n + 1), windows = [];
      for (const side of SIDES) for (let k = 0; k < n; k++) {
        if (steps[k].pose.limbs[side].handLocked && !steps[(k - 1 + n) % n].pose.limbs[side].handLocked) windows.push({ center: k * seg, mono: side in LATE_PLANT });
      }
      const tables = windows.map(({ center, mono }) => {
        const from = center - Math.max(BODY_SMOOTH_BEFORE, BODY_MONO_BEFORE) - 3 * BODY_SMOOTH_SIGMA, count = Math.ceil((Math.max(BODY_SMOOTH_BEFORE, BODY_MONO_BEFORE) + Math.max(BODY_SMOOTH_AFTER, BODY_MONO_AFTER) + 6 * BODY_SMOOTH_SIGMA) / BODY_SMOOTH_STEP) + 1;
        const ys = Array.from({ length: count }, (_, j) => solvePose(smoothLoopSample(from + j * BODY_SMOOTH_STEP), { playback: true }).constrainedPelvis.y);
        if (mono) {
          // v30 (user: when the right hand takes the weight, the lower body drops and
          // comes back up). Across the late plant the hips follow one monotone ease from
          // the high point before it straight down toward the front, with no dip and no
          // rebound. The arms keep their paths, so the shoulders absorb the difference.
          const at = t => (t - from) / BODY_SMOOTH_STEP, ia = Math.round(at(center - BODY_MONO_BEFORE)), ib = Math.round(at(center + BODY_MONO_AFTER));
          const slope = j => (ys[j + 1] - ys[j - 1]) / (2 * BODY_SMOOTH_STEP), span = (ib - ia) * BODY_SMOOTH_STEP;
          const y0 = ys[ia], y1 = ys[ib], m0 = slope(ia) * span, m1 = slope(ib) * span;
          const offset = ys.map((y, j) => {
            if (j <= ia || j >= ib) return 0;
            const u = (j - ia) / (ib - ia), u2 = u * u, u3 = u2 * u;
            return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * m1 - y;
          });
          // v33: the ease itself is kept (not only its offsets at 0.02 s samples), so the hips
          // follow it exactly between samples even where the raw solve bends sharply
          const ease = { t0: from + ia * BODY_SMOOTH_STEP, span, y0, y1, m0, m1 };
          return { center, from, offset, period, before: BODY_MONO_BEFORE, after: BODY_MONO_AFTER, edge: 0, ease };
        }
        // widest smoothing whose shoulder give stays within BODY_SMOOTH_MAX_GIVE
        let offset = null;
        for (let sigma = BODY_SMOOTH_SIGMA; sigma > 0.03; sigma *= 0.85) {
          const radius = Math.ceil(3 * sigma / BODY_SMOOTH_STEP), weights = Array.from({ length: 2 * radius + 1 }, (_, j) => Math.exp(-0.5 * ((j - radius) * BODY_SMOOTH_STEP / sigma) ** 2));
          offset = ys.map((y, j) => {
            if (j < radius || j >= count - radius) return 0;
            let sum = 0, total = 0;
            for (let m = -radius; m <= radius; m++) { sum += ys[j + m] * weights[m + radius]; total += weights[m + radius]; }
            return sum / total - y;
          });
          if (Math.max(...offset.map(Math.abs)) <= BODY_SMOOTH_MAX_GIVE) break;
        }
        return { center, from, offset, period, before: BODY_SMOOTH_BEFORE, after: BODY_SMOOTH_AFTER, edge: BODY_SMOOTH_EDGE };
      });
      bodySmoothCache = { sequence, tables };
    }
    let result = 0;
    for (const { center, from, offset, period, before, after, edge, ease } of bodySmoothCache.tables) {
      let dt = sampleTime - center;
      dt -= Math.round(dt / period) * period;
      if (dt < -before || dt > after) continue;
      if (ease && rawY !== null && BODY_MONO_EXACT) {
        const u = THREE.MathUtils.clamp((center + dt - ease.t0) / ease.span, 0, 1), u2 = u * u, u3 = u2 * u;
        result += (2 * u3 - 3 * u2 + 1) * ease.y0 + (u3 - 2 * u2 + u) * ease.m0 + (-2 * u3 + 3 * u2) * ease.y1 + (u3 - u2) * ease.m1 - rawY;
        continue;
      }
      const w = edge ? THREE.MathUtils.smoothstep(dt, -before, -before + edge) * (1 - THREE.MathUtils.smoothstep(dt, after - edge, after)) : 1;
      const x = (center + dt - from) / BODY_SMOOTH_STEP, j = Math.floor(x), f = x - j;
      result += w * THREE.MathUtils.lerp(offset[j] ?? 0, offset[j + 1] ?? 0, f);
    }
    return result;
  }

  function offsetSolvedBody(node, bodyOffset) {
    if (!bodyOffset) return;
    node.constrainedPelvis.y += bodyOffset;
    for (const side of SIDES) for (const p of [node.solved[side].hip, node.solved[side].leg.middle, node.solved[side].leg.end]) p.y += bodyOffset;
  }

  function applyPose(input, { playback = mode === 'flare', alignBendPlanes = false, bodyOffset = 0 } = {}) {
    const node = solvePose(input, { playback });
    const { requested, constrainedPelvis, warnings, solved } = node;
    if (typeof bodyOffset === 'function') bodyOffset = bodyOffset(constrainedPelvis.y);
    offsetSolvedBody(node, bodyOffset);
    bendPlaneRotation = alignBendPlanes;
    mode = 'manual';
    groundLock = requested.groundLock;
    poseWarnings = warnings;
    pelvis.copy(constrainedPelvis);
    bodyRotation.copy(requested.bodyQuaternion);
    pelvisRotation.copy(pelvisFrame(requested));
    hasPelvisRotation = requested.pelvisQuaternion !== undefined;
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
      for (const key of ['elbowTwist', 'kneeTwist', 'upperArmTwist', 'thighTwist']) if (source[key] !== undefined) target[key] = source[key];
      poseArm(side, target, shoulder, arm.middle, arm.end, source.handQuaternion);
      poseLeg(side, target, hip, leg.middle, leg.end, source.footQuaternion);
    }
    finishPose();
    return capturePose();
  }

  function getEditableHandles() {
    const handles = [
      { id: 'pelvis', position: pelvis.toArray(), quaternion: pelvisRotation.toArray(), canRotate: true, label: '髋部 · 独立位置与旋转' },
      { id: 'torso', position: upperTarget(rest.torso).toArray(), quaternion: bodyRotation.toArray(), canRotate: true, label: '躯干 · 整体移动与转向' },
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

  function independentPelvisPose(pose, position, quaternion, baseSolved = null) {
    // Ordinary editing keeps the original live-frame arithmetic. Pure joint
    // edits can instead supply a solved input frame without touching that rig.
    const oldPelvis = baseSolved ? baseSolved.constrainedPelvis.clone() : pelvis.clone();
    const oldBody = baseSolved ? baseSolved.requested.bodyQuaternion.clone() : bodyRotation.clone();
    const oldUpper = baseSolved ? isNeutralTorso(baseSolved.requested.torsoQuaternion) ? oldBody.clone()
      : oldBody.clone().multiply(baseSolved.requested.torsoQuaternion) : upperRotation();
    const oldHipRotation = baseSolved ? pelvisFrame(baseSolved.requested).clone() : pelvisRotation.clone();
    const shoulderCenter = baseSolved
      ? upperOffset(rest.torso, oldBody, baseSolved.requested.torsoQuaternion).add(oldPelvis) : upperTarget(rest.torso);
    const oldWaist = baseSolved ? waistRest.clone().sub(rest.pelvis).applyQuaternion(oldBody).add(oldPelvis) : bodyTarget(waistRest);
    const lowerRest = waistRest.clone().sub(rest.pelvis), upperRest = rest.torso.clone().sub(waistRest);
    const lowerLength = lowerRest.length(), upperLength = upperRest.length();
    const oldAxis = shoulderCenter.clone().sub(oldPelvis).normalize();
    const bend = oldWaist.clone().sub(oldPelvis);
    bend.addScaledVector(oldAxis, -bend.dot(oldAxis));
    if (bend.lengthSq() < 1e-10) {
      bend.copy(FRONT).applyQuaternion(oldUpper);
      bend.addScaledVector(oldAxis, -bend.dot(oldAxis));
    }
    if (bend.lengthSq() < 1e-10) {
      bend.copy(FRONT).applyQuaternion(oldBody);
      bend.addScaledVector(oldAxis, -bend.dot(oldAxis));
    }
    bend.normalize();
    const requestedPosition = position ? point(position) : oldPelvis;
    const requestedRotation = quaternion ? new THREE.Quaternion().fromArray(quaternion) : oldHipRotation;
    const moves = requestedPosition.distanceToSquared(oldPelvis) > 1e-20;
    const goalPosition = requestedPosition.clone();
    if (moves) {
      // A drag must not pass through the spine's unreachable inner region and
      // reappear on the opposite side with an abrupt 180-degree upper-body flip.
      const displacement = goalPosition.clone().sub(oldPelvis);
      const origin = oldPelvis.clone().sub(shoulderCenter);
      const lengthSquared = displacement.lengthSq(), toward = origin.dot(displacement);
      const minimumSquared = (upperLength - lowerLength) ** 2;
      const closestAt = clamp(-toward / lengthSquared, 0, 1);
      if (origin.clone().addScaledVector(displacement, closestAt).lengthSq() < minimumSquared - 1e-14) {
        const discriminant = toward * toward - lengthSquared * (origin.lengthSq() - minimumSquared);
        const entry = clamp((-toward - Math.sqrt(Math.max(0, discriminant))) / lengthSquared, 0, 1);
        goalPosition.copy(oldPelvis).addScaledVector(displacement, entry);
      }
    }
    function candidate(progress, preserveUpper = false) {
      const next = structuredClone(pose);
      next.pelvisQuaternion = oldHipRotation.clone().slerp(requestedRotation, progress).toArray();
      if (!moves) return next;
      const root = oldPelvis.clone().lerp(goalPosition, progress);
      if (preserveUpper) {
        // Near-straight locked arms can forbid even a tiny shoulder tilt. Keep
        // the whole upper frame fixed and swing the pelvis around the waist,
        // instead of reducing an otherwise useful hip drag to almost zero.
        const waist = oldWaist.clone(), radial = oldPelvis.clone().sub(waist).normalize();
        const tangent = root.clone().sub(oldPelvis);
        tangent.addScaledVector(radial, -tangent.dot(radial));
        // Discard unreachable radial shortening before mapping the tangential
        // drag onto the waist sphere. Its lever never crosses zero at the pivot.
        const offset = radial.multiplyScalar(lowerLength).add(tangent).normalize();
        root.copy(waist).addScaledVector(offset, lowerLength);
        const body = rotationFor(lowerRest, waist.clone().sub(root), oldBody);
        next.pelvis = root.toArray();next.bodyQuaternion = body.toArray();
        next.torsoQuaternion = body.clone().invert().multiply(oldUpper).normalize().toArray();
        return next;
      }
      const delta = shoulderCenter.clone().sub(root);
      let distance = delta.length();
      const axis = distance > 1e-10 ? delta.multiplyScalar(1 / distance) : oldAxis.clone();
      distance = clamp(distance, Math.abs(upperLength - lowerLength), upperLength + lowerLength);
      root.copy(shoulderCenter).addScaledVector(axis, -distance);
      // Unlike limb IK, the spine permits a fully straight chain. Both lengths
      // and the shoulder anchor stay exact, including at the reach boundary.
      const along = (lowerLength * lowerLength - upperLength * upperLength + distance * distance) / (2 * distance);
      const height = Math.sqrt(Math.max(0, lowerLength * lowerLength - along * along));
      const transportedBend = bend.clone().applyQuaternion(new THREE.Quaternion().setFromUnitVectors(oldAxis, axis));
      const waist = root.clone().addScaledVector(axis, along).addScaledVector(transportedBend, height);
      const body = rotationFor(lowerRest, waist.clone().sub(root), oldBody);
      const upper = rotationFor(upperRest, shoulderCenter.clone().sub(waist), oldUpper);
      next.pelvis = root.toArray();
      next.bodyQuaternion = body.toArray();
      next.torsoQuaternion = body.clone().invert().multiply(upper).normalize().toArray();
      return next;
    }
    function acceptable(next) {
      try {
        const solved = solvePose(next);
        const center = upperOffset(rest.torso, solved.requested.bodyQuaternion, solved.requested.torsoQuaternion).add(solved.constrainedPelvis);
        return center.distanceTo(shoulderCenter) < 1e-7;
      } catch { return false; }
    }
    let next = candidate(1), limited = false;
    if (!acceptable(next)) {
      const preserveUpper = moves && SIDES.some(side => pose.limbs[side].handLocked);
      const fixedUpper = preserveUpper ? candidate(1, true) : null;
      if (fixedUpper && acceptable(fixedUpper)) next = fixedUpper;
      else {
        // Find a reachable edit without letting the general body projection drag
        // the upper body away from its anchor. An impossible edit keeps the pose.
        let start = 0, end = 1;next = pose;limited = true;
        for (let pass = 0; pass < 28; pass++) {
          const middle = (start + end) / 2, attempted = candidate(middle, preserveUpper);
          if (acceptable(attempted)) { start = middle;next = attempted; }
          else end = middle;
        }
      }
    }
    if (moves && point(next.pelvis).distanceTo(requestedPosition) > 1e-5) limited = true;
    return { pose: next, limited };
  }

  function jointsFromSolved({ requested, constrainedPelvis, solved }) {
    const upper = name => upperOffset(rest[name], requested.bodyQuaternion, requested.torsoQuaternion).add(constrainedPelvis);
    const joints = {
      pelvis: constrainedPelvis.clone(),
      waist: waistRest.clone().sub(rest.pelvis).applyQuaternion(requested.bodyQuaternion).add(constrainedPelvis),
      shoulderCenter: upper('torso'), neck: upper('neck'), head: upper('head'),
    };
    for (const side of SIDES) {
      const { source, shoulder, arm, hip, leg } = solved[side];
      const positions = {
        Shoulder: shoulder.clone(), Elbow: arm.middle.clone(), Wrist: arm.end.clone(),
        Palm: limbs[side].palmOffset.clone().applyQuaternion(source.handQuaternion).add(arm.end),
        Hip: hip.clone(), Knee: leg.middle.clone(), Ankle: leg.end.clone(),
        Toe: new THREE.Vector3(0, 0, .18).applyQuaternion(source.footQuaternion).add(leg.end),
      };
      for (const [name, position] of Object.entries(positions)) joints[side + name] = position;
    }
    return joints;
  }

  function poseFromSolved({ requested, constrainedPelvis, solved }, template) {
    const result = structuredClone(template);
    result.pelvis = constrainedPelvis.toArray();result.bodyQuaternion = requested.bodyQuaternion.toArray();
    for (const key of ['torsoQuaternion', 'pelvisQuaternion']) {
      if (requested[key]) result[key] = requested[key].toArray();else delete result[key];
    }
    for (const side of SIDES) {
      const { source, arm, leg } = solved[side], limb = result.limbs[side];
      limb.wrist = arm.end.toArray();limb.ankle = leg.end.toArray();
      limb.elbowPole = source.elbowPole.toArray();limb.kneePole = source.kneePole.toArray();
      limb.handQuaternion = source.handQuaternion.toArray();limb.footQuaternion = source.footQuaternion.toArray();
    }
    return result;
  }

  function jointSwing(from, to, reference) {
    if (from.lengthSq() < 1e-20 || to.lengthSq() < 1e-20) return IDENTITY.clone();
    const a = from.clone().normalize(), b = to.clone().normalize();
    const axis = new THREE.Vector3().crossVectors(a, b), sine = axis.length(), cosine = clamp(a.dot(b), -1, 1);
    if (sine > 1e-10) return new THREE.Quaternion().setFromAxisAngle(axis.multiplyScalar(1 / sine), Math.atan2(sine, cosine));
    if (cosine >= 0) return IDENTITY.clone();
    // Exactly opposite directions have no unique minimal swing. Use the input
    // frame's front/side plane rather than a scene-dependent arbitrary axis.
    axis.copy(FRONT).applyQuaternion(reference).addScaledVector(a, -FRONT.clone().applyQuaternion(reference).dot(a));
    if (axis.lengthSq() < 1e-10) axis.set(1, 0, 0).applyQuaternion(reference).addScaledVector(a, -new THREE.Vector3(1, 0, 0).applyQuaternion(reference).dot(a));
    return new THREE.Quaternion().setFromAxisAngle(axis.normalize(), Math.PI);
  }

  /** Reverse a displayed joint goal into a replayable pose without changing the
   * live skeleton, clock or input. Waist, palms and toes are reference points;
   * shoulders/head/hips use their existing linked rig frames, not new bones. */
  function solveJointPose(inputPose, { joint, position } = {}) {
    const requestedPosition = finiteArray(position, 3, '关节目标位置');
    const initial = solvePose(inputPose), before = jointsFromSolved(initial), goal = point(requestedPosition);
    if (typeof joint !== 'string' || !Object.hasOwn(before, joint)) throw new Error('未知关节点。');
    const base = poseFromSolved(initial, inputPose), notes = [];
    let linkedGroup = joint === 'pelvis' || joint.endsWith('Hip') ? 'pelvis'
      : joint === 'waist' || joint === 'shoulderCenter' ? 'body'
        : ['neck', 'head', 'leftShoulder', 'rightShoulder'].includes(joint) ? 'upperBody'
          : (joint.startsWith('left') ? 'left' : 'right') + (/Elbow|Wrist|Palm$/.test(joint) ? 'Arm' : 'Leg');
    let candidate;
    const upper = isNeutralTorso(initial.requested.torsoQuaternion) ? initial.requested.bodyQuaternion.clone()
      : initial.requested.bodyQuaternion.clone().multiply(initial.requested.torsoQuaternion);
    const finish = (solved, template) => {
      const pose = poseFromSolved(solved, template), replay = solvePose(pose), actual = jointsFromSolved(replay);
      const error = actual[joint].distanceTo(goal), limited = error > 1e-5;
      const warnings = [...new Set([...initial.warnings, ...solved.warnings, ...replay.warnings, ...notes,
        ...(limited ? ['目标已按现有联动关系、真实骨长和锁定约束限制；显示的是实际可达位置。'] : [])])];
      return { pose, joint, position: actual[joint].toArray(), requestedPosition: [...requestedPosition],
        error, limited, warnings, linkedGroup, beforePosition: before[joint].toArray(),
        joints: Object.fromEntries(Object.entries(actual).map(([name, value]) => [name, value.toArray()])) };
    };
    if (before[joint].distanceToSquared(goal) < 1e-24) return finish(initial, base);
    if (joint === 'pelvis') {
      linkedGroup = 'pelvis';
      const edited = independentPelvisPose(base, requestedPosition, null, initial);
      if (edited.limited) notes.push('髋部位移已限幅，上身通过原有腰部联动。');
      return finish(solvePose(edited.pose), edited.pose);
    }
    if (joint === 'waist' || joint === 'shoulderCenter') {
      linkedGroup = 'body';
      candidate = progress => {
        const next = structuredClone(base);
        next.pelvis = point(base.pelvis).add(goal.clone().sub(before[joint]).multiplyScalar(progress)).toArray();
        return next;
      };
    } else if (['neck', 'head', 'leftShoulder', 'rightShoulder'].includes(joint)) {
      linkedGroup = 'upperBody';
      const pivot = before.waist, swing = jointSwing(before[joint].clone().sub(pivot), goal.clone().sub(pivot), upper);
      candidate = progress => {
        const next = structuredClone(base), delta = IDENTITY.clone().slerp(swing, progress);
        next.torsoQuaternion = initial.requested.bodyQuaternion.clone().invert().multiply(delta.clone().multiply(upper)).normalize().toArray();
        for (const side of SIDES) {
          const limb = next.limbs[side];
          limb.elbowPole = point(limb.elbowPole).sub(pivot).applyQuaternion(delta).add(pivot).toArray();
          if (!limb.handLocked) {
            limb.wrist = point(limb.wrist).sub(pivot).applyQuaternion(delta).add(pivot).toArray();
            limb.handQuaternion = delta.clone().multiply(initial.requested.limbs[side].handQuaternion).normalize().toArray();
          }
        }
        return next;
      };
    } else {
      const side = joint.startsWith('left') ? 'left' : 'right', suffix = joint.slice(side.length);
      const limb = initial.solved[side], dimensions = limbs[side];
      if (suffix === 'Hip') {
        linkedGroup = 'pelvis';
        const hipRotation = pelvisFrame(initial.requested), pivot = before.pelvis;
        const swing = jointSwing(before[joint].clone().sub(pivot), goal.clone().sub(pivot), hipRotation);
        const rotation = swing.multiply(hipRotation).normalize();
        const edited = independentPelvisPose(base, null, rotation.toArray(), initial);
        return finish(solvePose(edited.pose), edited.pose);
      }
      if (suffix === 'Elbow' || suffix === 'Knee') {
        linkedGroup = suffix === 'Elbow' ? side + 'Arm' : side + 'Leg';
        const arm = suffix === 'Elbow', root = arm ? limb.shoulder : limb.hip, chain = arm ? limb.arm : limb.leg;
        const direction = chain.end.clone().sub(root).normalize();
        const center = root.clone().addScaledVector(direction, chain.middle.clone().sub(root).dot(direction));
        const bend = chain.middle.clone().sub(center), height = bend.length();
        const desired = goal.clone().sub(center).addScaledVector(direction, -goal.clone().sub(center).dot(direction));
        // Near extension, changing a tiny circle's azimuth can turn the mesh
        // around its axis while barely moving the joint. Preserve that plane.
        if (height < .001) notes.push('肢体接近伸直，已保留原弯曲方向。');
        else if (desired.lengthSq() < 1e-20) notes.push('目标在肢体轴线上，已保留原弯曲方向。');
        else bend.copy(desired).normalize().multiplyScalar(height);
        const next = structuredClone(base);
        next.limbs[side][arm ? 'elbowPole' : 'kneePole'] = center.add(bend).toArray();
        return finish(solvePose(next), next);
      }
      const arm = suffix === 'Wrist' || suffix === 'Palm';
      linkedGroup = arm ? side + 'Arm' : side + 'Leg';
      let target = goal.clone();
      if (suffix === 'Palm') target.sub(dimensions.palmOffset.clone().applyQuaternion(limb.source.handQuaternion));
      if (suffix === 'Toe') target.sub(new THREE.Vector3(0, 0, .18).applyQuaternion(limb.source.footQuaternion));
      if (arm) {
        // Preserve the existing explicit wrist-edit behavior: the selected hand
        // anchor can move even when handLocked, while its lock flag stays set.
        target = twoBone(limb.shoulder, target, dimensions.upperArm, dimensions.forearm, limb.source.elbowPole).end;
      }
      const key = arm ? 'wrist' : 'ankle', old = point(base.limbs[side][key]);
      candidate = progress => {
        const next = structuredClone(base);next.limbs[side][key] = old.clone().lerp(target, progress).toArray();return next;
      };
    }
    let chosen = initial, chosenPose = base, bestError = before[joint].distanceTo(goal);
    // Constraint projection can make the full linked change unreachable or
    // counterproductive. A small deterministic backtracking set keeps the best
    // measured candidate and reports residual error instead of faking success.
    for (let pass = 0; pass < 12; pass++) {
      const next = candidate(2 ** -pass);
      try {
        const solved = solvePose(next), error = jointsFromSolved(solved)[joint].distanceTo(goal);
        if (error < bestError - 1e-12) { chosen = solved;chosenPose = next;bestError = error; }
        if (error < 1e-8) break;
      } catch { /* Smaller candidates may still satisfy the unchanged locks. */ }
    }
    return finish(chosen, chosenPose);
  }

  function editHandle(id, change) {
    const handle = getEditableHandles().find(value => value.id === id);
    if (!handle) throw new Error('未知姿势控制点。');
    if (!change || (change.position === undefined && change.quaternion === undefined)) throw new Error('请提供控制点的位置或方向。');
    const position = change.position === undefined ? null : finiteArray(change.position, 3, `${handle.label}位置`);
    const quaternion = change.quaternion === undefined ? null : poseQuaternion(change.quaternion, `${handle.label}方向`).toArray();
    if (quaternion && !handle.canRotate) throw new Error('此控制点不支持旋转。');
    let pose = capturePose();
    let endpointLimited = false, pelvisLimited = false;
    if (id === 'pelvis') {
      const edited = independentPelvisPose(pose, position, quaternion);
      pose = edited.pose;pelvisLimited = edited.limited;
    } else if (id === 'torso') {
      if (quaternion) {
        if (pose.pelvisQuaternion) {
          const delta = new THREE.Quaternion().fromArray(quaternion).multiply(bodyRotation.clone().invert());
          pose.pelvisQuaternion = delta.multiply(pelvisRotation).normalize().toArray();
        }
        pose.bodyQuaternion = quaternion;
      }
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
        const base = rotationFor(sourceAxis, rotatedEnd.clone().sub(pivot), arm ? upperRotation() : pelvisRotation);
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
    if (pelvisLimited) poseWarnings.unshift('髋部调整已限制在腰部和四肢可达范围内，肩中心保持原位置。');
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
    const periodic = periodicMotion ? periodicMotion.describe(time) : null;
    const periodicIndex = periodic ? ['rear', 'right', 'front', 'left'].indexOf(periodic.section) : -1;
    const joints = {
      pelvis: pelvis.toArray(), waist: bodyTarget(waistRest).toArray(), shoulderCenter: upperTarget(rest.torso).toArray(),
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
      time, angle, period: sequence.period, mode, manual: mode === 'manual', layer, selected, legPath, interpolation, motionModel, skippedSteps: [...skippedSteps],
      periodic,
      bodyQuaternion: bodyRotation.toArray(), groundLock, warnings: [...poseWarnings],
      pelvisQuaternion: pelvisRotation.toArray(),
      torsoQuaternion: torsoRotation.toArray(),
      name: 'Snow 友善健身主角', source: rigData.source, license: rigData.license,
      illustrative: true, motionType: 'Flare 教学示意', automaticallyBound: false,
      keyframes: { ...sequence.keyframes },
      demonstration: periodic ? { index: periodicIndex, count: 4, id: `periodic-${periodic.section}`, phase: ['rear', 'sideA', 'front', 'sideB'][periodicIndex] }
        : { index: sequence.stepAt(time), count: sequence.steps.length, id: sequence.steps[sequence.stepAt(time)].id, phase: sequence.steps[sequence.stepAt(time)].phase },
      supportHands, supports, supportDrift, segmentLengths, expectedLengths, joints,
      minFootHeight: minimumFootHeight, chestForward: FRONT.clone().applyQuaternion(upperRotation()).toArray(),
      bounds: calculateBounds(), neutralBounds, neutralHeight: rigData.height,
      skinning: { bones: descriptors.size, batches: meshes.length, weightedVertices, originalMeshes: meshes.length, authoredWeights: true },
      supportAnchors: Object.fromEntries(SIDES.map(side => [side, limbs[side].anchor.toArray()])),
    };
  }

  model.userData.motionSource = 'Snow Rig / Blender Foundation';
  reset();
  // How much slower the pose advances per second of clock time at `time`: the
  // closing n-1 -> 0 transition of a smooth loop spans two clock seconds, so the
  // viewer runs its clock twice as fast there and the seam keeps full speed.
  function getLoopTimeScale(time) {
    if (!smoothLoopActive()) return 1;
    const n = sequence.steps.length - 1, seg = sequence.period / (n + 1);
    const wrapped = ((time % sequence.period) + sequence.period) % sequence.period;
    return wrapped > (n - 1) * seg ? 2 : 1;
  }
  function enterManualMode() {
    // Entering the editor keeps the exact paused surface until a control changes.
    mode = 'manual';
    return capturePose();
  }
  return { group: model, update, reset, setSequence, sampleTrajectory, samplePose, getSegmentGuideAt, getLoopTimeScale, isSmoothLoopActive: smoothLoopActive,
    getSequenceRevision: () => sequenceRevision,
    enterManualMode, getFootCurveSpan: (time, options) => sequence.spanAt(time, options),
    getFootCurveAt: (time, side) => sequence.curveAt(time, side),
    setLayer, setHighlight, getMetrics, capturePose, applyPose, getEditableHandles, editHandle, solveJointPose, getGroundHandPose, alignGroundHands };
}
