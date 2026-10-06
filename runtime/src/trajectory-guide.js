import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export const TRAJECTORY_JOINTS = Object.freeze([
  { joint: 'pelvis', label: '骨盆', category: 'pelvis', color: 0x54d6cc },
  { joint: 'waist', label: '腰部控制点', category: 'body', color: 0x7bdb9a, reference: true },
  { joint: 'shoulderCenter', label: '肩中心', category: 'body', color: 0x79d8ee },
  { joint: 'neck', label: '颈', category: 'body', color: 0xbbadff },
  { joint: 'head', label: '头', category: 'body', color: 0xd7b8ff },
  ...['left', 'right'].flatMap(side => [
    ['Shoulder', '肩', 'arms'], ['Elbow', '肘', 'arms'],
    ['Wrist', '腕', 'arms'], ['Palm', '手掌接触点', 'arms'],
    ['Hip', '髋', 'legs'], ['Knee', '膝', 'knees'],
    ['Ankle', '踝', 'feet'], ['Toe', '脚尖参考点', 'legs'],
  ].map(([suffix, label, category]) => ({
    joint: side + suffix, label: (side === 'left' ? '左' : '右') + label,
    category, color: side === 'left' ? 0x56aaff : 0xffad58,
    ...(suffix === 'Knee' || suffix === 'Elbow' ? { dashed: true } : {}),
    ...(suffix === 'Palm' || suffix === 'Toe' ? { reference: true } : {}),
  }))),
].map(channel => Object.freeze(channel)));
const CHANNELS = ['leftAnkle', 'rightAnkle', 'leftKnee', 'rightKnee', 'pelvis']
  .map(joint => TRAJECTORY_JOINTS.find(channel => channel.joint === joint));
const CHANNEL_BY_ID = new Map(TRAJECTORY_JOINTS.map(channel => [channel.joint, channel]));
const LEGACY_JOINTS = new Set(CHANNELS.map(channel => channel.joint));
const ignoreRaycast = () => {};
const EPSILON = 1e-8;

function finitePoint(value) {
  return (Array.isArray(value) || ArrayBuffer.isView(value)) && value.length === 3 &&
    Array.from(value).every(Number.isFinite);
}

function copyData(data) {
  if (!data || !Number.isFinite(data.startTime) || !Number.isFinite(data.endTime) ||
      data.endTime < data.startTime || !Array.isArray(data.frames)) {
    throw new TypeError('轨迹需要有效的起止时间和关节采样。');
  }
  let previousTime = -Infinity;
  const frames = data.frames.map(frame => {
    if (!Number.isFinite(frame?.time) || frame.time <= previousTime ||
        frame.time < data.startTime - EPSILON || frame.time > data.endTime + EPSILON) {
      throw new TypeError('轨迹采样时间必须在所选区间内递增。');
    }
    previousTime = frame.time;
    const joints = {};
    for (const { joint } of CHANNELS) {
      if (!finitePoint(frame.joints?.[joint])) throw new TypeError(`轨迹缺少有效的 ${joint} 坐标。`);
      joints[joint] = Array.from(frame.joints[joint]);
    }
    for (const [joint, position] of Object.entries(frame.joints)) {
      if (finitePoint(position)) joints[joint] = Array.from(position);
    }
    const curveTargets = {};
    for (const side of ['left', 'right']) if (frame.curveTargets?.[side] !== undefined) {
      if (!finitePoint(frame.curveTargets[side])) throw new TypeError('自绘路线包含无效坐标。');
      curveTargets[side] = Array.from(frame.curveTargets[side]);
    }
    const guideTargets = {};
    for (const [joint, position] of Object.entries(frame.guideTargets ?? {})) {
      if (!Object.hasOwn(joints, joint) || !finitePoint(position)) throw new TypeError('整段路线包含无效目标坐标。');
      guideTargets[joint] = Array.from(position);
    }
    return { time: frame.time, joints, ...(Object.keys(curveTargets).length ? { curveTargets } : {}), ...(Object.keys(guideTargets).length ? { guideTargets } : {}) };
  });
  if (data.keyframeTimes !== undefined && (!Array.isArray(data.keyframeTimes) ||
      !data.keyframeTimes.every(Number.isFinite))) {
    throw new TypeError('姿态锚点时间必须是有限数值数组。');
  }
  const keyframeTimes = [...new Set(data.keyframeTimes ?? [])]
    .filter(time => time >= data.startTime - EPSILON && time <= data.endTime + EPSILON)
    .sort((a, b) => a - b);
  let baselineFrames = null;
  if (data.baselineFrames !== undefined) {
    if (!Array.isArray(data.baselineFrames) || data.baselineFrames.length !== frames.length) {
      throw new TypeError('对照轨迹必须与当前轨迹使用相同的采样时间和关节。');
    }
    baselineFrames = copyData({ startTime: data.startTime, endTime: data.endTime,
      frames: data.baselineFrames }).frames;
    for (const [index, frame] of frames.entries()) {
      const baseline = baselineFrames[index];
      const joints = Object.keys(frame.joints), baselineJoints = Object.keys(baseline.joints);
      if (Math.abs(frame.time - baseline.time) > EPSILON || joints.length !== baselineJoints.length ||
          !joints.every(joint => Object.hasOwn(baseline.joints, joint))) {
        throw new TypeError('对照轨迹必须与当前轨迹使用相同的采样时间和关节。');
      }
    }
  }
  return { startTime: data.startTime, endTime: data.endTime, frames,
    keyframeTimes, baselineFrames, pending: Boolean(data.pending) };
}

/**
 * Render already-resolved world-space joint samples. This helper never samples
 * or edits the motion rig; its lines and markers also opt out of selection.
 */
export function createTrajectoryGuide({ scene }) {
  if (!scene?.isObject3D) throw new TypeError('轨迹辅助线需要 Three.js 场景。');
  const root = new THREE.Group();
  root.name = 'trajectory-guide';
  root.userData.trajectoryGuide = true;
  root.raycast = ignoreRaycast;
  root.visible = false;
  scene.add(root);

  const visibility = { enabled: true, feet: true, knees: true, pelvis: true,
    allJoints: false, selectedJoint: null, baseline: true };
  const resolution = new THREE.Vector2(1, 1);
  const geometries = new Set();
  const materials = new Set();
  const lineMaterials = new Set();
  let source = null;
  let tracks = [], plannedPathCount = 0;
  let currentTime = null;
  let disposed = false;

  function geometry(value) { geometries.add(value); return value; }
  function material(value) { materials.add(value); return value; }
  function addObject(parent, object) {
    object.raycast = ignoreRaycast;
    object.userData.trajectoryGuide = true;
    parent.add(object);
    return object;
  }

  function line(parent, points, channel, arrow = false) {
    if (points.length < 2) return null;
    const lineMaterial = material(new LineMaterial({
      color: channel.color,
      linewidth: channel.baseline ? 1 : channel.planned ? 1.1 : channel.dashed ? 1.3 : 2,
      worldUnits: false,
      dashed: Boolean(channel.dashed && !arrow),
      dashSize: .045,
      gapSize: .035,
      transparent: true,
      opacity: channel.baseline ? .3 : channel.planned ? .3 : channel.dashed ? .36 : (arrow ? .95 : .78),
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
      resolution,
    }));
    lineMaterials.add(lineMaterial);
    lineMaterial.userData.trajectoryOpacity = lineMaterial.opacity;
    lineMaterial.userData.trajectoryWidth = lineMaterial.linewidth;
    const lineGeometry = geometry(new LineGeometry().setPositions(points.flatMap(point => point.toArray())));
    const object = addObject(parent, new Line2(lineGeometry, lineMaterial));
    if (lineMaterial.dashed) object.computeLineDistances();
    return object;
  }

  // Round screen-sized dots keep the current sample readable from any camera.
  // Hollow endpoint dots distinguish the end from the solid start; the moving
  // dot has a white core. Depth testing still lets the character occlude them.
  function marker(parent, pointGeometry, channel, kind) {
    const pixels = kind === 'current' ? 9 : (kind === 'authored' ? 9 : (kind === 'end' ? 8 : 6));
    const markerMaterial = material(new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(channel.color) },
        pointSize: { value: pixels },
        opacity: { value: channel.dashed ? .5 : .95 },
        hollow: { value: kind === 'end' ? 1 : 0 },
        whiteCore: { value: kind === 'current' ? 1 : 0 },
      },
      vertexShader: `
        uniform float pointSize;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = pointSize;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        uniform float hollow;
        uniform float whiteCore;
        void main() {
          float radius = length(gl_PointCoord - vec2(0.5)) * 2.0;
          float alpha = (1.0 - smoothstep(0.86, 1.0, radius)) * opacity;
          alpha *= mix(1.0, smoothstep(0.55, 0.72, radius), hollow);
          if (alpha < 0.01) discard;
          vec3 ink = mix(color, vec3(1.0), whiteCore * (1.0 - smoothstep(0.38, 0.55, radius)));
          gl_FragColor = vec4(ink, alpha);
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
    }));
    const object = addObject(parent, new THREE.Points(pointGeometry, markerMaterial));
    markerMaterial.userData.trajectoryOpacity = markerMaterial.uniforms.opacity.value;
    markerMaterial.userData.trajectoryScale = 1;
    object.onBeforeRender = renderer => {
      markerMaterial.uniforms.pointSize.value = pixels * markerMaterial.userData.trajectoryScale * renderer.getPixelRatio();
    };
    return object;
  }

  function addDirections(parent, points, channel) {
    const lengths = [0];
    for (let index = 1; index < points.length; index++) {
      lengths.push(lengths[index - 1] + points[index - 1].distanceTo(points[index]));
    }
    const total = lengths.at(-1);
    if (total < .04) return;
    const fractions = channel.dashed ? [.5] : [.3, .7];
    const size = Math.min(.035, total * .12);
    for (const fraction of fractions) {
      const distance = total * fraction;
      const endIndex = lengths.findIndex(length => length >= distance);
      const start = points[endIndex - 1];
      const end = points[endIndex];
      const at = (distance - lengths[endIndex - 1]) / (lengths[endIndex] - lengths[endIndex - 1]);
      const center = start.clone().lerp(end, at);
      const tangent = end.clone().sub(start).normalize();
      const reference = Math.abs(tangent.y) < .9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const wing = new THREE.Vector3().crossVectors(tangent, reference).normalize().multiplyScalar(size * .4);
      const tail = center.clone().addScaledVector(tangent, -size * .5);
      const tip = center.clone().addScaledVector(tangent, size * .5);
      line(parent, [tail.clone().add(wing), tip, tail.clone().sub(wing)], channel, true);
    }
  }

  function syncVisibility() {
    root.visible = !disposed && visibility.enabled && Boolean(source?.frames.length);
    const hasFocus = tracks.some(track => track.joint === visibility.selectedJoint &&
      (visibility.allJoints || (LEGACY_JOINTS.has(track.joint) && visibility[track.category])));
    for (const track of tracks) {
      track.group.visible = visibility.allJoints ||
        (LEGACY_JOINTS.has(track.joint) && visibility[track.category]);
      if (track.baselineGroup) track.baselineGroup.visible = visibility.baseline;
      const focused = hasFocus && track.joint === visibility.selectedJoint;
      const opacityScale = hasFocus && !focused ? .18 : 1;
      track.group.traverse(object => {
        const value = object.material;
        if (!value) return;
        if (value.isLineMaterial) {
          value.opacity = value.userData.trajectoryOpacity * opacityScale;
          value.linewidth = focused && !value.dashed ? Math.max(3, value.userData.trajectoryWidth)
            : value.userData.trajectoryWidth;
        } else if (value.uniforms?.opacity) {
          value.uniforms.opacity.value = value.userData.trajectoryOpacity * opacityScale;
          value.userData.trajectoryScale = focused ? 1.2 : 1;
        }
      });
    }
  }

  function releaseData() {
    root.clear();
    for (const value of geometries) value.dispose();
    for (const value of materials) value.dispose();
    geometries.clear();
    materials.clear();
    lineMaterials.clear();
    tracks = [];
    plannedPathCount = 0;
    source = null;
    currentTime = null;
    root.visible = false;
  }

  function setData(data) {
    if (disposed) return;
    if (data == null) { clear(); return; }
    // Validate first so malformed replacement data cannot erase a valid guide.
    const next = copyData(data);
    const previousTime = currentTime;
    releaseData();
    source = next;
    if (source.frames.length) {
      const pointGeometry = geometry(new THREE.BufferGeometry());
      pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
      const jointIds = new Set(source.frames.flatMap(frame => Object.keys(frame.joints)));
      const channels = [...CHANNELS,
        ...TRAJECTORY_JOINTS.filter(channel => !LEGACY_JOINTS.has(channel.joint) && jointIds.has(channel.joint)),
        ...[...jointIds].filter(joint => !CHANNEL_BY_ID.has(joint)).map(joint => ({
          joint, category: 'other', color: 0xbed0e6,
        }))];
      for (const channel of channels) {
        const group = addObject(root, new THREE.Group());
        group.name = `trajectory-guide:${channel.joint}`;
        const samples = [], paths = [];
        let points = [];
        const finishPath = () => {
          const path = line(group, points, channel);
          if (path) paths.push(path);
          addDirections(group, points, channel);
          points = [];
        };
        for (const [index, frame] of source.frames.entries()) {
          if (!finitePoint(frame.joints[channel.joint])) { finishPath();continue; }
          const point = new THREE.Vector3().fromArray(frame.joints[channel.joint]);
          samples.push({ time: frame.time, position: frame.joints[channel.joint], index });
          // Stationary support samples must not produce zero-length Line2 segments.
          if (!points.length || points.at(-1).distanceToSquared(point) > EPSILON ** 2) points.push(point);
        }
        finishPath();
        const start = marker(group, pointGeometry, channel, 'start');
        const end = marker(group, pointGeometry, channel, 'end');
        const current = marker(group, pointGeometry, channel, 'current');
        start.position.fromArray(samples[0].position);
        end.position.fromArray(samples.at(-1).position);
        const authored = samples.filter(sample => source.keyframeTimes.some(time => Math.abs(time - sample.time) <= EPSILON));
        if (authored.length) {
          const authoredGeometry = geometry(new THREE.BufferGeometry());
          authoredGeometry.setAttribute('position', new THREE.Float32BufferAttribute(authored.flatMap(sample => sample.position), 3));
          const anchors = marker(group, authoredGeometry, channel, 'authored');
          anchors.name = `trajectory-authored:${channel.joint}`;
        }
        let baselineGroup = null;
        const baselinePaths = [];
        if (source.baselineFrames) {
          baselineGroup = addObject(group, new THREE.Group());
          baselineGroup.name = `trajectory-baseline:${channel.joint}`;
          const baselineChannel = { ...channel, color: 0x9ca8b5, dashed: true, baseline: true };
          let baselinePoints = [];
          const finishBaseline = () => {
            const path = line(baselineGroup, baselinePoints, baselineChannel);
            if (path) baselinePaths.push(path);
            baselinePoints = [];
          };
          for (const frame of source.baselineFrames) {
            if (!finitePoint(frame.joints[channel.joint])) { finishBaseline();continue; }
            const point = new THREE.Vector3().fromArray(frame.joints[channel.joint]);
            if (!baselinePoints.length || baselinePoints.at(-1).distanceToSquared(point) > EPSILON ** 2) {
              baselinePoints.push(point);
            }
          }
          finishBaseline();
        }
        tracks.push({ ...channel, group, path: paths[0] ?? null, paths, current, samples,
          baselineGroup, baselinePaths });
        const guided = source.frames.some(frame => Object.hasOwn(frame.guideTargets ?? {}, channel.joint));
        if (channel.category === 'feet' || guided) {
          const side = channel.joint.startsWith('left') ? 'left' : 'right';
          let planned = [], constrained = false;
          const flush = () => {
            if (planned.length > 1 && constrained) {
              line(group, planned, { ...channel, dashed: true, planned: true });plannedPathCount++;
            }
            planned = [];constrained = false;
          };
          for (const frame of source.frames) {
            const requested = guided ? frame.guideTargets?.[channel.joint] ?? frame.joints[channel.joint] : frame.curveTargets?.[side];
            if (!requested) { flush();continue; }
            const point = new THREE.Vector3().fromArray(requested);
            constrained ||= point.distanceTo(new THREE.Vector3().fromArray(frame.joints[channel.joint])) > .001;
            if (!planned.length || planned.at(-1).distanceToSquared(point) > EPSILON ** 2) planned.push(point);
          }
          flush();
        }
      }
      setProgress(previousTime ?? source.startTime);
    }
    syncVisibility();
  }

  function setProgress(time, poseJoints) {
    if (disposed || !Number.isFinite(time)) return;
    currentTime = time;
    if (!source?.frames.length) return;
    const inRange = time >= source.startTime - EPSILON && time <= source.endTime + EPSILON;
    for (const track of tracks) {
      const samples = track.samples;
      let low = 0, high = samples.length - 1;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (samples[middle].time < time) low = middle + 1;
        else high = middle;
      }
      const right = samples[low];
      const left = samples[Math.max(0, low - 1)];
      const blend = right.time === left.time ? 0 : THREE.MathUtils.clamp((time - left.time) / (right.time - left.time), 0, 1);
      const sampledRange = time >= samples[0].time - EPSILON && time <= samples.at(-1).time + EPSILON;
      const continuous = right.index - left.index <= 1 ||
        Math.abs(time - left.time) <= EPSILON || Math.abs(time - right.time) <= EPSILON;
      track.current.visible = inRange && (finitePoint(poseJoints?.[track.joint]) || (sampledRange && continuous));
      if (finitePoint(poseJoints?.[track.joint])) {
        track.current.position.fromArray(poseJoints[track.joint]);
      } else {
        track.current.position.fromArray(left.position);
        track.current.position.lerp(new THREE.Vector3().fromArray(right.position), blend);
      }
    }
  }

  function setVisible(value) {
    if (disposed) return;
    if (typeof value === 'boolean') visibility.enabled = value;
    else if (value && typeof value === 'object') {
      for (const key of Object.keys(visibility)) {
        if (key !== 'selectedJoint' && typeof value[key] === 'boolean') visibility[key] = value[key];
      }
      if (value.selectedJoint === null || typeof value.selectedJoint === 'string') {
        visibility.selectedJoint = value.selectedJoint || null;
      }
    }
    syncVisibility();
  }

  function pickSample({ camera, x, y, width, height, joint = visibility.selectedJoint, radius = 14, times } = {}) {
    if (disposed || !root.visible || !camera?.isCamera || ![x, y, width, height, radius].every(Number.isFinite) ||
        width <= 0 || height <= 0 || radius < 0 || x < 0 || x > width || y < 0 || y > height ||
        (times !== undefined && (!Array.isArray(times) || !times.every(Number.isFinite)))) return null;
    let closest = null, closestSquared = radius * radius;
    const point = new THREE.Vector3();
    for (const track of tracks) {
      if (!track.group.visible || (joint != null && track.joint !== joint)) continue;
      for (const sample of track.samples) {
        if (times && !times.some(time => Math.abs(sample.time - time) <= EPSILON)) continue;
        point.fromArray(sample.position).project(camera);
        if (point.z < -1 || point.z > 1 || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
        const dx = (point.x + 1) * width / 2 - x, dy = (1 - point.y) * height / 2 - y;
        const squared = dx * dx + dy * dy;
        if (squared > closestSquared) continue;
        if (closest && Math.abs(squared - closestSquared) < 1e-8 && currentTime !== null &&
            Math.abs(sample.time - currentTime) >= Math.abs(closest.time - currentTime)) continue;
        closestSquared = squared;
        closest = { joint: track.joint, time: sample.time, position: [...sample.position] };
      }
    }
    return closest;
  }

  function resize(width, height) {
    if (disposed || !Number.isFinite(width) || !Number.isFinite(height)) return;
    resolution.set(Math.max(1, width), Math.max(1, height));
    for (const value of lineMaterials) value.resolution.copy(resolution);
  }

  function clear() { if (!disposed) releaseData(); }
  function dispose() {
    if (disposed) return;
    releaseData();
    root.removeFromParent();
    disposed = true;
  }

  function getStatus() {
    return {
      ...visibility,
      visible: root.visible,
      pending: source?.pending ?? false,
      frameCount: source?.frames.length ?? 0,
      pathCount: tracks.filter(track => track.path && track.group.visible).length,
      totalPathCount: tracks.filter(track => track.path).length,
      plannedPathCount,
      baselinePathCount: tracks.filter(track => track.baselinePaths.length && track.group.visible &&
        track.baselineGroup.visible).length,
      jointIds: tracks.map(track => track.joint),
      keyframeTimes: [...(source?.keyframeTimes ?? [])],
      startTime: source?.startTime ?? null,
      endTime: source?.endTime ?? null,
      currentTime,
      disposed,
    };
  }

  return { setData, setVisible, setProgress, pickSample, resize, clear, dispose, getStatus };
}
