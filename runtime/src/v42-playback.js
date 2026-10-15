import * as THREE from 'three';
import { isV42Sequence, createV42Clock } from './v42-default.js';

/** Display the accepted clip; keep the original editable rig independent. */
export function createV42Playback({ base, gltf, clockDocument, scene, rigData }) {
  const model = gltf.scene, clock = createV42Clock(clockDocument);
  const clip = gltf.animations[0];
  if (!clip || Math.abs(clip.duration - clock.duration) > .001) throw new Error('v42 动作与时间映射不匹配。');
  const mixer = new THREE.AnimationMixer(model), action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce, 1);action.clampWhenFinished = true;action.play();
  model.name = 'Snow · Flare v42 / R12';model.visible = false;
  const bones = new Map();
  model.traverse(node => { if (node.isBone) bones.set(node.name, node);if (node.isMesh) { node.castShadow = true;node.frustumCulled = false; } });
  const jointBone = name => name === 'shoulderCenter' ? 'torso' : name === 'waist' ? 'spineLower' :
    name.replace(/Shoulder$/, 'UpperArm').replace(/Elbow$/, 'Forearm').replace(/Wrist$|Palm$/, 'Hand')
      .replace(/Hip$/, 'Thigh').replace(/Knee$/, 'Shin').replace(/Ankle$|Toe$/, 'Foot');
  base.group.updateMatrixWorld(true);
  const reference = base.getMetrics();
  const localJoints = Object.fromEntries(Object.entries(reference.joints).flatMap(([name, position]) => {
    const boneName = jointBone(name), bone = base.group.getObjectByName(boneName);
    return bone && bones.has(boneName) ? [[name, { bone: bones.get(boneName), point: new THREE.Vector3().fromArray(position).applyMatrix4(bone.matrixWorld.clone().invert()) }]] : [];
  }));
  scene.add(model);
  let selected = false, mode = 'anatomy', time = 0, manualPreview = false;
  const active = () => selected && mode === 'motion' && !manualPreview;
  const visibility = originalVisible => { model.visible = active() && originalVisible;base.group.visible = !active() && originalVisible; };
  function evaluate(value) {
    time = value;action.enabled = true;action.paused = false;mixer.setTime(clock.toClip(value));model.updateMatrixWorld(true);
  }
  function joints() {
    return Object.fromEntries(Object.entries(localJoints).map(([name, value]) => [name, value.point.clone().applyMatrix4(value.bone.matrixWorld).toArray()]));
  }
  function getMetrics() {
    const metrics = base.getMetrics();
    if (!active()) return metrics;
    const actual = joints(), bounds = new THREE.Box3();
    for (const position of Object.values(actual)) bounds.expandByPoint(new THREE.Vector3().fromArray(position));
    bounds.expandByScalar(rigData.height * .09);
    return { ...metrics, version: 'flare-v42-r12', playback: 'baked', clipTime: clock.toClip(time), time,
      joints: { ...metrics.joints, ...actual }, bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() } };
  }
  const overrides = {
    get group() { return active() ? model : base.group; },
    setDisplaySequence(sequence) { selected = isV42Sequence(sequence);manualPreview = false;visibility(true); },
    setDisplayMode(value) { mode = value;manualPreview = false;visibility(true); },
    syncDisplayVisibility: visibility,
    isV42Playback: active,
    getDisplayModel: () => active() ? model : base.group,
    advanceDisplayTime: (value, seconds, range = null) => active() ? clock.advance(value, seconds, range) : null,
    update(value) { if (manualPreview) { manualPreview = false;visibility(true); }base.update(value);if (active()) evaluate(value); },
    applyPose(...args) { manualPreview = true;const result = base.applyPose(...args);visibility(true);return result; },
    getMetrics,
    sampleTrajectory(options = {}) {
      if (!active()) return base.sampleTrajectory(options);
      const { startTime, endTime, samples = 64, includeTimes = [] } = options;
      if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime || !Number.isInteger(samples) || samples < 2 || samples > 512)
        throw new Error('轨迹采样范围无效。');
      const saved = time;
      try {
        const times = [...new Set([...Array.from({ length: samples }, (_, i) => startTime + (endTime - startTime) * i / (samples - 1)), ...includeTimes])].sort((a, b) => a - b);
        return { startTime, endTime, frames: times.map(value => { evaluate(value);return { time: value, joints: joints() }; }) };
      } finally { evaluate(saved); }
    },
  };
  return new Proxy(base, { get(target, key) { return key in overrides ? Reflect.get(overrides, key) : Reflect.get(target, key); } });
}
