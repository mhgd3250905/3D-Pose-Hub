import * as THREE from 'three';

// These marks explain a saved movement. Their size, colour and opacity never
// encode force, muscle activation or an inferred anatomical registration.
const REGION_KINDS = {
  shoulder: { label: '肩部相关肌群', anchor: 'Shoulder' },
  upperArm: { label: '上臂支撑肌群', anchor: 'Elbow', from: 'Shoulder', blend: .5 },
  scapular: { label: '肩胛控制肌群', anchor: 'Shoulder', from: 'shoulderCenter', blend: .45 },
  core: { label: '躯干控制肌群', anchor: 'waist' },
  hipFlexor: { label: '髋前侧抬腿肌群', anchor: 'Hip' },
  quad: { label: '大腿前侧肌群', anchor: 'Knee', from: 'Hip', blend: .5 },
  glute: { label: '臀部开髋肌群', anchor: 'Hip' },
  adductor: { label: '大腿内侧肌群', anchor: 'Knee', from: 'Hip', blend: .45 },
};
const MAX_REGIONS = 16;
const PALETTE = { support: 0x72d6ff, core: 0xb49bfa, hips: 0xd8ef70 };
const LOWER_KINDS = new Set(['hipFlexor', 'quad', 'glute', 'adductor']);
const FOCUS_IDS = new Set(['shoulders', 'scapular', 'arms', 'core', 'hipFlexors', 'glutes', 'adductors', 'quadriceps']);
const DEFAULT_ANNOTATIONS = {
  regions: [
    { id: 'shoulders', group: 'shoulders', side: 'both', kind: 'shoulder' },
    { id: 'upper-arms', group: 'arms', side: 'both', kind: 'upperArm' },
    { id: 'hips', group: 'hipFlexors', side: 'both', kind: 'hipFlexor' },
    { id: 'thighs', group: 'hipFlexors', side: 'both', kind: 'quad' },
    { id: 'trunk', group: 'core', side: 'both', kind: 'core' },
  ],
};
const PATHS = [
  { joint: 'leftAnkle', side: 'left', colour: 0x63b4ff },
  { joint: 'rightAnkle', side: 'right', colour: 0xffb26e },
];
const EPSILON = 1e-8;
const finitePoint = value => (Array.isArray(value) || ArrayBuffer.isView(value)) &&
  value.length === 3 && Array.from(value).every(Number.isFinite);
const noRaycast = () => {};
const clamp = THREE.MathUtils.clamp;

function copySamples(data) {
  if (!data || !Number.isFinite(data.startTime) || !Number.isFinite(data.endTime) ||
      data.endTime < data.startTime || !Array.isArray(data.frames) || data.frames.length < 1) {
    throw new TypeError('动作教学需要实际动画的起止时间和关节采样。');
  }
  let last = -Infinity;
  const frames = data.frames.map(frame => {
    if (!Number.isFinite(frame?.time) || frame.time < last ||
        (frame.time === last && data.startTime !== data.endTime) ||
        frame.time < data.startTime - EPSILON || frame.time > data.endTime + EPSILON) {
      throw new TypeError('动作教学采样时间必须在区间内连续递增。');
    }
    last = frame.time;
    for (const { joint } of PATHS) {
      if (!finitePoint(frame.joints?.[joint])) throw new TypeError(`动作教学缺少 ${joint} 的实际坐标。`);
    }
    return { time: frame.time, joints: Object.fromEntries(Object.entries(frame.joints)
      .filter(([, position]) => finitePoint(position)).map(([joint, position]) => [joint, Array.from(position)])) };
  });
  // Deliberately ignore curveTargets/guideTargets: the rendered centreline is
  // always the constrained joint route, never a second path planner.
  return { startTime: data.startTime, endTime: data.endTime, frames };
}

function annotationColour(value) {
  const colour = value ?? 0xff4242;
  if (!(typeof colour === 'number' && Number.isInteger(colour) && colour >= 0 && colour <= 0xffffff) &&
      !(typeof colour === 'string' && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(colour))) {
    throw new TypeError('功能区颜色需要十六进制颜色或 RGB 数字。');
  }
  return new THREE.Color(colour);
}

function copyAnnotations(definition) {
  const source = definition ?? DEFAULT_ANNOTATIONS;
  if (!Array.isArray(source.regions) || (source.cues !== undefined && !Array.isArray(source.cues))) {
    throw new TypeError('姿态标注需要 regions 数组和可选的 cues 数组。');
  }
  const regions = source.regions.flatMap((region, index) => {
    if (!region || !REGION_KINDS[region.kind] || !['left', 'right', 'both'].includes(region.side ?? 'both')) {
      throw new TypeError('姿态标注包含未知功能区或左右侧。');
    }
    const parentId = String(region.id ?? `${region.kind}-${index}`), group = String(region.group ?? region.kind);
    const kind = region.kind, sides = kind === 'core' ? ['both'] : region.side === 'left' || region.side === 'right' ? [region.side] : ['left', 'right'];
    const colour = annotationColour(region.color ?? (kind === 'core' ? PALETTE.core : LOWER_KINDS.has(kind) ? PALETTE.hips : PALETTE.support)), spec = REGION_KINDS[kind];
    return sides.map(side => ({ id: sides.length > 1 ? `${parentId}:${side}` : parentId, parentId, group, kind, side,
      label: region.label ?? `${side === 'left' ? '左侧 · ' : side === 'right' ? '右侧 · ' : ''}${spec.label}`,
      anchor: /^[A-Z]/.test(spec.anchor) ? side + spec.anchor : spec.anchor,
      from: spec.from ? /^[A-Z]/.test(spec.from) ? side + spec.from : spec.from : null,
      blend: spec.blend, colour: colour.clone() }));
  });
  if (regions.length > MAX_REGIONS || new Set(regions.map(region => region.id)).size !== regions.length) {
    throw new TypeError(`姿态标注最多支持 ${MAX_REGIONS} 个左右功能区，且 ID 不可重复。`);
  }
  const defaults = ['left', 'right'].map(side => ({ id: `${side}-hip-opening-cue`, side, anchor: `${side}Hip`,
    direction: [side === 'left' ? 1 : -1, .25, .12], space: 'pelvis', kind: 'arc',
    offset: [side === 'left' ? .035 : -.035, -.035, .10], color: PALETTE.hips, label: '从髋部打开 · 教学方向提示' }));
  const cues = (source.cues ?? defaults).map((cue, index) => {
    if (!cue || typeof cue.anchor !== 'string' || !finitePoint(cue.direction) ||
        Math.hypot(...cue.direction) < EPSILON || !['model', 'pelvis', 'body'].includes(cue.space ?? 'model') ||
        !['arc', 'arrow'].includes(cue.kind ?? 'arc') ||
        (cue.offset !== undefined && !finitePoint(cue.offset)) || (cue.normal !== undefined && !finitePoint(cue.normal))) {
      throw new TypeError('教学方向提示需要关节锚点、非零方向和有效的坐标空间。');
    }
    return { id: String(cue.id ?? `direction-${index}`), side: cue.side ?? null, anchor: cue.anchor,
      label: String(cue.label ?? '教学方向提示'), kind: cue.kind ?? 'arc', space: cue.space ?? 'model',
      direction: Array.from(cue.direction), normal: Array.from(cue.normal ?? [0, 0, 1]),
      offset: Array.from(cue.offset ?? [0, 0, 0]), colour: annotationColour(cue.color ?? PALETTE.hips) };
  });
  if (cues.length > 16) throw new TypeError('同一姿态的教学方向提示最多 16 个。');
  return { regions, cues };
}

export function createMovementGuide({ scene, model }) {
  if (!scene?.isObject3D || !model?.isObject3D) throw new TypeError('动作教学需要场景和已载入的 Snow 人物。');

  const root = new THREE.Group();
  root.name = 'movement-teaching-guide';
  root.userData.movementGuide = true;
  root.matrixAutoUpdate = false;
  root.visible = false;
  scene.add(root);
  const pathRoot = new THREE.Group(), supportRoot = new THREE.Group(), regionRoot = new THREE.Group(), cueRoot = new THREE.Group();
  pathRoot.name = 'actual-motion-ribbons';supportRoot.name = 'push-ground-teaching-cues';regionRoot.name = 'functional-region-markers';
  cueRoot.name = 'hip-and-body-teaching-direction-cues';
  root.add(pathRoot, supportRoot, regionRoot, cueRoot);
  const visibility = { enabled: false, paths: true, support: true, regions: true };
  const staticGeometry = new Set(), staticMaterials = new Set(), pathGeometry = new Set(), pathMaterials = new Set();
  const annotationGeometry = new Set(), annotationMaterials = new Set();
  const localMatrix = new THREE.Matrix4(), sceneInverse = new THREE.Matrix4();
  const basisMatrix = new THREE.Matrix4(), modelScale = new THREE.Vector3();
  const position = new THREE.Vector3(), tangent = new THREE.Vector3(), side = new THREE.Vector3(), normal = new THREE.Vector3();
  const cameraRotation = new THREE.Quaternion(), rootRotation = new THREE.Quaternion();
  const cameraFacing = new THREE.Vector3();
  const capsuleStarts = Array.from({ length: MAX_REGIONS }, () => new THREE.Vector3());
  const capsuleEnds = Array.from({ length: MAX_REGIONS }, () => new THREE.Vector3());
  const front = new THREE.Vector3(0, 0, 1), pelvisRotation = new THREE.Quaternion();
  const cueRotation = new THREE.Quaternion(), cueDirection = new THREE.Vector3(), cueNormal = new THREE.Vector3(), cueOffset = new THREE.Vector3();
  const surfaceUniforms = {
    uMovementStarts: { value: Array.from({ length: MAX_REGIONS }, () => new THREE.Vector4()) },
    uMovementEnds: { value: Array.from({ length: MAX_REGIONS }, () => new THREE.Vector3()) },
    uMovementColours: { value: Array.from({ length: MAX_REGIONS }, () => new THREE.Color(PALETTE.support)) },
    uMovementStrength: { value: new Float32Array(MAX_REGIONS) },
    uMovementLower: { value: new Float32Array(MAX_REGIONS) },
    uMovementAmount: { value: 0 },
  };
  let data = null, tracks = [], time = null, metrics = null, focus = null;
  let disposed = false, surfaceInstalled = false, active = false, supportHands = [];
  let progress = 0, annotations = copyAnnotations(), annotationKey = null, hotspots = [], directionCues = [];

  function ownGeometry(value) { staticGeometry.add(value);return value; }
  function ownMaterial(value) { staticMaterials.add(value);return value; }
  function decorate(object) { object.raycast = noRaycast;object.userData.movementGuide = true;return object; }
  const headGeometry = ownGeometry(new THREE.BufferGeometry());
  headGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, .035, 0, -.024, -.021, 0, 0, -.004, 0, .024, -.021, 0,
  ], 3));
  headGeometry.setIndex([0, 1, 2, 0, 2, 3]);headGeometry.computeBoundingSphere();

  const ringGeometry = ownGeometry(new THREE.RingGeometry(.010, .013, 32));

  const supportLength = .23, tipLength = .048;
  const stemGeometry = ownGeometry(new THREE.BufferGeometry());
  stemGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -.0025, 0, 0, .0025, 0, 0, -.005, supportLength - tipLength, 0, .005, supportLength - tipLength, 0,
  ], 3));stemGeometry.setIndex([0, 1, 2, 2, 1, 3]);stemGeometry.computeBoundingSphere();
  const tipGeometry = ownGeometry(new THREE.BufferGeometry());
  tipGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, -.018, tipLength, 0, 0, tipLength * .69, 0, .018, tipLength, 0,
  ], 3));tipGeometry.setIndex([0, 1, 2, 0, 2, 3]);tipGeometry.computeBoundingSphere();
  const contactGeometry = ownGeometry(new THREE.RingGeometry(.042, .0432, 64));
  const contactOuterGeometry = ownGeometry(new THREE.RingGeometry(.065, .0658, 64));
  const contactAccentGeometry = ownGeometry(new THREE.RingGeometry(.050, .0525, 16, 1, 0, Math.PI / 5));
  const contactDotGeometry = ownGeometry(new THREE.CircleGeometry(.0028, 16));
  const supportMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: PALETTE.support, transparent: true,
    opacity: .88, depthTest: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  const contactMaterial = ownMaterial(supportMaterial.clone());contactMaterial.opacity = .7;contactMaterial.side = THREE.DoubleSide;
  const outerMaterial = ownMaterial(contactMaterial.clone());outerMaterial.opacity = .28;
  const accentMaterial = ownMaterial(contactMaterial.clone());accentMaterial.opacity = .82;
  const supports = ['left', 'right'].map(hand => {
    const group = new THREE.Group();group.name = `${hand}-palm-push-ground-cue`;
    group.userData.meaning = '主动推地教学提示；固定长度，不表示力大小';group.visible = false;
    const glyph = new THREE.Group();glyph.name = `${hand}-push-direction-glyph`;
    const stem = decorate(new THREE.Mesh(stemGeometry, supportMaterial));stem.position.y = tipLength;
    const tip = decorate(new THREE.Mesh(tipGeometry, supportMaterial));
    // Keep the narrow, flat arrow legible while its direction remains exactly
    // downward in model space. This does not turn a camera-facing arrow into
    // an inferred force or a second motion path.
    stem.onBeforeRender = (_renderer, _scene, camera) => {
      camera.getWorldQuaternion(cameraRotation);root.getWorldQuaternion(rootRotation).invert();
      cameraFacing.set(0, 0, 1).applyQuaternion(rootRotation.multiply(cameraRotation));
      if (cameraFacing.x * cameraFacing.x + cameraFacing.z * cameraFacing.z > EPSILON) {
        glyph.rotation.y = Math.atan2(cameraFacing.x, cameraFacing.z);glyph.updateWorldMatrix(true, true);
      }
    };
    glyph.add(stem, tip);
    const ring = decorate(new THREE.Mesh(contactGeometry, contactMaterial));ring.rotation.x = -Math.PI / 2;ring.position.y = .002;
    const outer = decorate(new THREE.Mesh(contactOuterGeometry, outerMaterial));outer.rotation.x = -Math.PI / 2;outer.position.y = .002;
    const accents = new THREE.Group();accents.name = `${hand}-contact-dial`;
    for (let index = 0; index < 3; index++) {
      const arc = decorate(new THREE.Mesh(contactAccentGeometry, accentMaterial));
      arc.rotation.set(-Math.PI / 2, 0, index * Math.PI * 2 / 3);arc.position.y = .0022;accents.add(arc);
    }
    const dot = decorate(new THREE.Mesh(contactDotGeometry, accentMaterial));dot.rotation.x = -Math.PI / 2;dot.position.y = .0022;
    group.add(glyph, ring, outer, accents, dot);supportRoot.add(group);
    return { hand, group, glyph, stem, tip, accents, dot };
  });

  const surfaceClones = new Map(), surfaceAssignments = [];
  function surfaceMaterial(original, category) {
    if (!original?.isMeshStandardMaterial) return original;
    let variants = surfaceClones.get(original);
    if (variants?.has(category)) return variants.get(category);
    if (!variants) { variants = new Map();surfaceClones.set(original, variants); }
    const derived = original.clone(), originalHook = original.onBeforeCompile;
    const originalKey = original.customProgramCacheKey.bind(original);
    derived.name = `${original.name} · teaching region`;
    derived.onBeforeCompile = function(shader, renderer) {
      originalHook.call(this, shader, renderer);
      Object.assign(shader.uniforms, surfaceUniforms, { uMovementTop: { value: category === 'tee' ? 1 : 0 } });
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vMovementWorldPosition;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvMovementWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
varying vec3 vMovementWorldPosition;
uniform vec4 uMovementStarts[${MAX_REGIONS}];
uniform vec3 uMovementEnds[${MAX_REGIONS}];
uniform vec3 uMovementColours[${MAX_REGIONS}];
uniform float uMovementStrength[${MAX_REGIONS}];
uniform float uMovementLower[${MAX_REGIONS}];
uniform float uMovementTop;
uniform float uMovementAmount;
float movementCapsule(vec3 point, vec4 start, vec3 end) {
  if (start.w < 0.0001) return 0.0;
  vec3 axis = end - start.xyz;
  float at = clamp(dot(point - start.xyz, axis) / max(dot(axis, axis), 0.000001), 0.0, 1.0);
  float distanceToRegion = length(point - (start.xyz + axis * at));
  return (1.0 - smoothstep(start.w * 0.62, start.w * 1.35, distanceToRegion)) * step(0.0001, start.w);
}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
float movementRegion = 0.0;
vec3 movementRegionColour = vec3(0.0);
for (int movementIndex = 0; movementIndex < ${MAX_REGIONS}; movementIndex++) {
  float movementMask = movementCapsule(vMovementWorldPosition, uMovementStarts[movementIndex], uMovementEnds[movementIndex]) * uMovementStrength[movementIndex];
  // The tee belongs to shoulder/core graphics. Hip and thigh masks never
  // colour the hem; the entire shorts garment is excluded at mesh level.
  movementMask *= 1.0 - uMovementTop * uMovementLower[movementIndex];
  if (movementMask > movementRegion) { movementRegion = movementMask;movementRegionColour = uMovementColours[movementIndex]; }
}
// Flat annotation ink preserves the original cloth/skin lighting. A small
// silhouette lift below is colour, never emissive anatomy or muscle geometry.
vec3 movementInk = mix(movementRegionColour, vec3(1.0), 0.08);
diffuseColor.rgb = mix(diffuseColor.rgb, movementInk, movementRegion * uMovementAmount);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
float movementRim = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 4.0);
diffuseColor.rgb = mix(diffuseColor.rgb, movementInk, movementRegion * uMovementAmount * movementRim * 0.12);`);
    };
    derived.customProgramCacheKey = () => `${originalKey()}|snow-functional-ink-v4:${category}`;
    variants.set(category, derived);
    return derived;
  }
  model.traverse(mesh => {
    if (!mesh.isMesh) return;
    let eligible = false, category = 'body';
    for (let node = mesh; node && node !== model; node = node.parent) {
      // Preserve the whole garment, including its centre, for every region
      // and camera angle. Bright ink on these folds exaggerates the groin.
      if (/^Coach_Training_Shorts(_|$)/i.test(node.name)) return;
      if (/^Coach_(Body|Training_Tee)(_|$)/i.test(node.name)) eligible = true;
      if (/^Coach_Training_Tee(_|$)/i.test(node.name)) category = 'tee';
    }
    if (!eligible) return;
    const original = mesh.material;
    const derived = Array.isArray(original) ? original.map(value => surfaceMaterial(value, category)) : surfaceMaterial(original, category);
    if (Array.isArray(original) ? derived.some((value, index) => value !== original[index]) : derived !== original) {
      surfaceAssignments.push({ mesh, original, derived });
    }
  });
  function installSurface(enabled) {
    if (enabled === surfaceInstalled) return;
    for (const assignment of surfaceAssignments) {
      if (enabled && assignment.mesh.material === assignment.original) assignment.mesh.material = assignment.derived;
      else if (!enabled && assignment.mesh.material === assignment.derived) assignment.mesh.material = assignment.original;
    }
    surfaceInstalled = enabled;
  }

  function releaseAnnotations() {
    regionRoot.clear();cueRoot.clear();hotspots = [];directionCues = [];
    for (const geometry of annotationGeometry) geometry.dispose();
    for (const material of annotationMaterials) material.dispose();
    annotationGeometry.clear();annotationMaterials.clear();
  }
  function isFocused(region) {
    if (focus === 'shoulders' && ['shoulders', 'scapular', 'arms', 'chest'].includes(region.group)) return true;
    if (focus === 'hipFlexors' && ['hipFlexors', 'glutes', 'adductors', 'quadriceps'].includes(region.group)) return true;
    return focus === region.id || focus === region.parentId || focus === region.group;
  }
  function cueBand(curve, segments) {
    const points = new Float32Array((segments + 1) * 6), indices = [];
    const at = new THREE.Vector3(), along = new THREE.Vector3(), across = new THREE.Vector3();
    for (let index = 0; index <= segments; index++) {
      const fraction = index / segments;
      curve.getPoint(fraction, at);curve.getTangent(fraction, along);
      across.set(along.y, -along.x, 0).normalize();
      const width = .006 * (1 - fraction * .35);
      at.clone().addScaledVector(across, -width).toArray(points, index * 6);
      at.clone().addScaledVector(across, width).toArray(points, index * 6 + 3);
      if (index) { const a = (index - 1) * 2, b = index * 2;indices.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));geometry.setIndex(indices);geometry.computeBoundingSphere();
    annotationGeometry.add(geometry);return geometry;
  }
  function buildAnnotationVisuals() {
    hotspots = annotations.regions.map(definition => {
      const material = new THREE.MeshBasicMaterial({ color: definition.colour, transparent: true, opacity: .75,
        depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
      annotationMaterials.add(material);
      const marker = decorate(new THREE.Mesh(ringGeometry, material));
      marker.name = `functional-region:${definition.id}`;marker.renderOrder = 30;marker.visible = false;
      marker.onBeforeRender = (_renderer, _scene, camera) => {
        camera.getWorldQuaternion(cameraRotation);root.getWorldQuaternion(rootRotation).invert();
        marker.quaternion.copy(rootRotation).multiply(cameraRotation);
        marker.updateWorldMatrix(true, false);
      };
      regionRoot.add(marker);
      return { ...definition, marker, available: false };
    });
    // Palm cues already follow the actual support flags above. Never draw a
    // second palm arrow from a lesson profile, particularly on a released hand.
    directionCues = annotations.cues.filter(cue => !cue.anchor.endsWith('Palm')).map(definition => {
      const group = new THREE.Group();group.name = `teaching-direction:${definition.id}`;group.visible = false;
      group.userData.meaning = '动作方向教学示意，不表示真实肌力向量或大小';
      const material = new THREE.MeshBasicMaterial({ color: definition.colour, transparent: true, opacity: .88,
        depthTest: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      annotationMaterials.add(material);
      const length = .20;
      // A short tapered band and two tail ticks form one direction glyph.
      // Its little graphic bend is not a planned or sampled movement route.
      const curve = definition.kind === 'arc'
        ? new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(.055, length * .58, 0), new THREE.Vector3(0, length, 0))
        : new THREE.LineCurve3(new THREE.Vector3(), new THREE.Vector3(0, length, 0));
      const segments = definition.kind === 'arc' ? 18 : 1, geometry = cueBand(curve, segments);
      const endDirection = curve.getTangent(1);
      const shaft = decorate(new THREE.Mesh(geometry, material));shaft.renderOrder = 5;
      // The same centreline has a hairline thickness for edge-on views.
      const edgeGeometry = new THREE.TubeGeometry(curve, segments, .0012, 5, false);
      annotationGeometry.add(edgeGeometry);
      const edge = decorate(new THREE.Mesh(edgeGeometry, material));edge.renderOrder = 5;
      const head = decorate(new THREE.Mesh(headGeometry, material));head.position.y = length;
      head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endDirection);head.scale.setScalar(.8);head.renderOrder = 6;
      const tickGeometry = new THREE.PlaneGeometry(.021, .0024);annotationGeometry.add(tickGeometry);
      const tickMaterial = material.clone();tickMaterial.opacity = .56;annotationMaterials.add(tickMaterial);
      const ticks = [.08, .18].map(fraction => {
        const tick = decorate(new THREE.Mesh(tickGeometry, tickMaterial));
        curve.getPoint(fraction, tick.position);tick.position.z = .0006;
        tick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(fraction));return tick;
      });
      group.add(shaft, edge, head, ...ticks);cueRoot.add(group);
      return { ...definition, group };
    });
  }

  function updateCues() {
    for (const cue of directionCues) {
      cue.group.visible = cue.enabled !== false && joint(cue.anchor, cue.group.position);
      if (!cue.group.visible) continue;
      cueRotation.identity();
      const quaternion = cue.space === 'pelvis' ? metrics?.pelvisQuaternion ?? metrics?.bodyQuaternion
        : cue.space === 'body' ? metrics?.bodyQuaternion : null;
      if (Array.isArray(quaternion) && quaternion.length === 4 && quaternion.every(Number.isFinite)) cueRotation.fromArray(quaternion).normalize();
      cueDirection.fromArray(cue.direction).normalize().applyQuaternion(cueRotation);
      cueNormal.fromArray(cue.normal).normalize().applyQuaternion(cueRotation);
      cueOffset.fromArray(cue.offset).applyQuaternion(cueRotation);cue.group.position.add(cueOffset);
      side.crossVectors(cueDirection, cueNormal);
      if (side.lengthSq() < EPSILON ** 2) {
        cueNormal.set(Math.abs(cueDirection.y) < .9 ? 0 : 1, Math.abs(cueDirection.y) < .9 ? 1 : 0, 0);
        side.crossVectors(cueDirection, cueNormal);
      }
      side.normalize();normal.crossVectors(side, cueDirection).normalize();
      basisMatrix.makeBasis(side, cueDirection, normal);cue.group.quaternion.setFromRotationMatrix(basisMatrix);
    }
  }

  function releasePaths() {
    pathRoot.clear();
    for (const geometry of pathGeometry) geometry.dispose();
    for (const material of pathMaterials) material.dispose();
    pathGeometry.clear();pathMaterials.clear();tracks = [];
  }
  function makeDirection(track, phase, moving = false) {
    const material = new THREE.MeshBasicMaterial({ color: track.colour, transparent: true,
      opacity: moving ? .88 : .48, side: THREE.DoubleSide, depthTest: true, depthWrite: false, toneMapped: false });
    pathMaterials.add(material);
    const object = decorate(new THREE.Mesh(headGeometry, material));object.renderOrder = 4;
    object.scale.setScalar(Math.min(1, track.length / .20));track.group.add(object);
    const direction = { object, phase, moving };orientDirection(direction, track, phase);
    return direction;
  }
  function orientDirection(direction, track, phase) {
    const samples = track.samples;
    let right = 1;
    while (right < samples.length - 1 && samples[right].phase < phase) right++;
    let left = right - 1;
    // The route can contain a genuine stop: use the nearest nonzero segment
    // for its direction, rather than normalizing a zero vector into NaNs.
    while (right < samples.length - 1 && samples[right].position.distanceToSquared(samples[left].position) < EPSILON ** 2) right++;
    while (left > 0 && samples[right].position.distanceToSquared(samples[left].position) < EPSILON ** 2) left--;
    tangent.copy(samples[right].position).sub(samples[left].position);
    if (tangent.lengthSq() < EPSILON ** 2) { direction.object.visible = false;return; }
    tangent.normalize();
    const blend = samples[right].phase === samples[left].phase ? 0 :
      clamp((phase - samples[left].phase) / (samples[right].phase - samples[left].phase), 0, 1);
    position.copy(samples[left].position).lerp(samples[right].position, blend);
    side.copy(samples[left].side).addScaledVector(tangent, -samples[left].side.dot(tangent));
    if (side.lengthSq() < EPSILON ** 2) side.set(1, 0, 0).addScaledVector(tangent, -tangent.x);
    if (side.lengthSq() < EPSILON ** 2) side.set(0, 0, 1).addScaledVector(tangent, -tangent.z);
    side.normalize();normal.crossVectors(side, tangent).normalize();
    basisMatrix.makeBasis(side, tangent, normal);
    direction.object.position.copy(position);direction.object.quaternion.setFromRotationMatrix(basisMatrix);
    direction.object.visible = track.length >= .035;
  }
  function makeTrack(channel) {
    const duration = data.endTime - data.startTime;
    const samples = data.frames.map(frame => ({ position: new THREE.Vector3().fromArray(frame.joints[channel.joint]),
      phase: duration > 0 ? (frame.time - data.startTime) / duration : 0, side: new THREE.Vector3() }));
    const points = [];
    for (const sample of samples) {
      if (!points.length || sample.position.distanceToSquared(points.at(-1).position) > EPSILON ** 2) points.push(sample);
    }
    let length = 0;
    for (let index = 1; index < samples.length; index++) length += samples[index - 1].position.distanceTo(samples[index].position);
    const group = new THREE.Group();group.name = `actual-motion-ribbon:${channel.joint}`;pathRoot.add(group);
    const track = { ...channel, samples, length, group, material: null, directions: [] };
    if (points.length < 2) return track;
    const positions = new Float32Array(points.length * 6), phases = new Float32Array(points.length * 2);
    const across = new Float32Array(points.length * 2), indices = [];
    const previousSide = new THREE.Vector3();
    for (let index = 0; index < points.length; index++) {
      tangent.copy(points[Math.min(index + 1, points.length - 1)].position).sub(points[Math.max(0, index - 1)].position).normalize();
      if (index === 0) {
        normal.set(0, 1, 0);if (Math.abs(tangent.y) > .9) normal.set(0, 0, 1);
        side.crossVectors(tangent, normal).normalize();
      } else {
        side.copy(previousSide).addScaledVector(tangent, -previousSide.dot(tangent));
        if (side.lengthSq() < EPSILON ** 2) { normal.set(0, 1, 0);if (Math.abs(tangent.y) > .9) normal.set(0, 0, 1);side.crossVectors(tangent, normal); }
        side.normalize();
      }
      previousSide.copy(side);points[index].side.copy(side);
      // Width adds a visual ribbon around each sample; its centreline stays
      // exactly on the original resolved samples, without spline smoothing.
      const halfWidth = Math.min(.024, Math.max(.012, length * .055));
      for (let edge = 0; edge < 2; edge++) {
        position.copy(points[index].position).addScaledVector(side, (edge ? 1 : -1) * halfWidth);
        position.toArray(positions, index * 6 + edge * 3);
        phases[index * 2 + edge] = points[index].phase;across[index * 2 + edge] = edge;
      }
      if (index) { const a = (index - 1) * 2, b = index * 2;indices.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    // Give stationary samples the neighbouring ribbon frame as well.
    let frameIndex = 0;
    for (const sample of samples) {
      while (frameIndex < points.length - 1 && points[frameIndex + 1].phase <= sample.phase) frameIndex++;
      sample.side.copy(points[frameIndex].side);
    }
    const geometry = new THREE.BufferGeometry();pathGeometry.add(geometry);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('guidePhase', new THREE.BufferAttribute(phases, 1));geometry.setAttribute('guideAcross', new THREE.BufferAttribute(across, 1));
    geometry.setIndex(indices);geometry.computeBoundingSphere();
    const material = new THREE.ShaderMaterial({
      uniforms: { uColour: { value: new THREE.Color(channel.colour) }, uProgress: { value: 0 } },
      vertexShader: `attribute float guidePhase;attribute float guideAcross;
varying float vGuidePhase;varying float vGuideAcross;
void main() { vGuidePhase = guidePhase;vGuideAcross = guideAcross;gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 uColour;uniform float uProgress;
varying float vGuidePhase;varying float vGuideAcross;
void main() {
  float edge = smoothstep(0.0, 0.18, vGuideAcross) * (1.0 - smoothstep(0.82, 1.0, vGuideAcross));
  float endFade = smoothstep(0.0, 0.025, vGuidePhase) * (1.0 - smoothstep(0.975, 1.0, vGuidePhase));
  float trail = smoothstep(uProgress - 0.34, uProgress - 0.02, vGuidePhase) * (1.0 - smoothstep(uProgress + 0.02, uProgress + 0.13, vGuidePhase));
  float next = smoothstep(uProgress - 0.02, uProgress + 0.04, vGuidePhase) * (1.0 - smoothstep(uProgress + 0.22, uProgress + 0.42, vGuidePhase));
  float alpha = (0.26 + trail * 0.36 + next * 0.14) * edge * endFade;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(mix(uColour, vec3(1.0), trail * 0.16), alpha);
  #include <colorspace_fragment>
}`,
      transparent: true, side: THREE.DoubleSide, depthTest: true, depthWrite: false, toneMapped: false,
    });
    pathMaterials.add(material);track.material = material;
    const ribbon = decorate(new THREE.Mesh(geometry, material));ribbon.renderOrder = 3;group.add(ribbon);
    track.directions = [.32, .72].map(phase => makeDirection(track, phase));
    track.directions.push(makeDirection(track, .10, true));
    return track;
  }

  function joint(name, destination) {
    let values = metrics?.joints?.[name];
    if (!finitePoint(values) && data?.frames.length) {
      let closest = data.frames[0];
      for (const frame of data.frames) if (Math.abs(frame.time - time) < Math.abs(closest.time - time)) closest = frame;
      values = closest.joints[name];
    }
    if (!finitePoint(values)) return false;
    destination.fromArray(values);return true;
  }
  function clearCapsules() {
    for (const start of surfaceUniforms.uMovementStarts.value) start.set(0, 0, 0, 0);
    surfaceUniforms.uMovementStrength.value.fill(0);
    surfaceUniforms.uMovementLower.value.fill(0);
    surfaceUniforms.uMovementAmount.value = 0;
  }
  function setCapsule(index, region, fromJoint, toJoint, endBlend, radius, frontOffset = 0) {
    const start = capsuleStarts[index], end = capsuleEnds[index];
    if (!joint(fromJoint, start) || !joint(toJoint, end)) return;
    end.lerp(start, 1 - endBlend);
    start.addScaledVector(front, frontOffset);end.addScaledVector(front, frontOffset);
    start.applyMatrix4(model.matrixWorld);end.applyMatrix4(model.matrixWorld);
    const scale = Math.max(Math.abs(modelScale.x), Math.abs(modelScale.y), Math.abs(modelScale.z));
    surfaceUniforms.uMovementStarts.value[index].set(start.x, start.y, start.z, radius * scale);
    surfaceUniforms.uMovementEnds.value[index].copy(end);
    surfaceUniforms.uMovementColours.value[index].copy(region.colour);
    // These constants are annotation ink, not estimates of physiological load.
    const selected = isFocused(region);
    surfaceUniforms.uMovementStrength.value[index] = region.kind === 'core' ? selected ? .57 : focus ? .18 : .46
      : selected ? .78 : focus ? .28 : .67;
    surfaceUniforms.uMovementLower.value[index] = LOWER_KINDS.has(region.kind) ? 1 : 0;
  }
  function updateSurface() {
    clearCapsules();
    if (!active || !visibility.regions) return;
    front.set(0, 0, 1);
    if (Array.isArray(metrics?.pelvisQuaternion) && metrics.pelvisQuaternion.length === 4 && metrics.pelvisQuaternion.every(Number.isFinite)) {
      pelvisRotation.fromArray(metrics.pelvisQuaternion);front.applyQuaternion(pelvisRotation);
    } else if (finitePoint(metrics?.chestForward)) front.fromArray(metrics.chestForward).normalize();
    model.getWorldScale(modelScale);
    for (const [index, region] of annotations.regions.entries()) {
      const side = region.side;
      if (region.kind === 'shoulder') setCapsule(index, region, `${side}Shoulder`, `${side}Elbow`, .20, .12);
      else if (region.kind === 'upperArm') setCapsule(index, region, `${side}Shoulder`, `${side}Elbow`, .94, .087);
      else if (region.kind === 'scapular') setCapsule(index, region, `${side}Shoulder`, 'shoulderCenter', 1, .105, -.045);
      else if (region.kind === 'core') setCapsule(index, region, 'pelvis', 'shoulderCenter', .9, .13);
      else if (region.kind === 'hipFlexor') setCapsule(index, region, `${side}Hip`, `${side}Knee`, .28, .11, .045);
      else if (region.kind === 'quad') setCapsule(index, region, `${side}Hip`, `${side}Knee`, .91, .105, .035);
      else if (region.kind === 'glute') setCapsule(index, region, 'pelvis', `${side}Hip`, 1, .12, -.075);
      else if (region.kind === 'adductor') setCapsule(index, region, `${side}Hip`, `${side}Knee`, .85, .082);
    }
    surfaceUniforms.uMovementAmount.value = 1;
  }
  function update(nextTime, nextMetrics) {
    if (disposed) return;
    if (Number.isFinite(nextTime)) time = nextTime;
    if (nextMetrics !== undefined) metrics = nextMetrics;
    model.updateWorldMatrix(true, false);scene.updateWorldMatrix(true, false);
    sceneInverse.copy(scene.matrixWorld).invert();localMatrix.multiplyMatrices(sceneInverse, model.matrixWorld);
    root.matrix.copy(localMatrix);root.matrixWorldNeedsUpdate = true;
    active = visibility.enabled && Boolean(data?.frames.length) && Number.isFinite(time) &&
      time >= data.startTime - EPSILON && time <= data.endTime + EPSILON && model.visible;
    root.visible = active;pathRoot.visible = visibility.paths;supportRoot.visible = visibility.support;regionRoot.visible = visibility.regions;cueRoot.visible = visibility.support;
    installSurface(active && visibility.regions && annotations.regions.length > 0);
    if (!active) { supportHands = [];clearCapsules();return; }
    progress = data.endTime === data.startTime ? 0 : clamp((time - data.startTime) / (data.endTime - data.startTime), 0, 1);
    for (const track of tracks) {
      if (track.material) track.material.uniforms.uProgress.value = progress;
      if (visibility.paths) for (const direction of track.directions) {
        if (direction.moving) orientDirection(direction, track, clamp(progress + .10, .02, .98));
        else direction.object.material.opacity = .26 + Math.max(0, 1 - Math.abs(progress - direction.phase) / .26) * .35;
      }
    }
    supportHands = ['left', 'right'].filter(hand => metrics?.supportHands?.includes(hand) || metrics?.supports?.[hand] === true);
    for (const support of supports) {
      support.group.visible = supportHands.includes(support.hand) && joint(`${support.hand}Palm`, support.group.position);
      // Place the teaching arrow beside the palm so the hand cannot hide its
      // tip. The contact rings keep the exact saved palm anchor.
      if (support.group.visible && joint('pelvis', tangent)) {
        position.copy(support.group.position).sub(tangent);position.y = 0;
        if (position.lengthSq() < EPSILON) position.set(support.hand === 'right' ? -1 : 1, 0, 0);
        position.normalize().multiplyScalar(.095);
        support.glyph.position.x = position.x;support.glyph.position.z = position.z;
      }
      // The dial's fixed-width segments simply show that this contact is
      // current. Its decorative phase uses the original playback time only;
      // pause therefore stops it, and no size/intensity represents load.
      const phase = (Number.isFinite(time) ? time : 0) * .42 + (support.hand === 'right' ? Math.PI : 0);
      support.accents.rotation.y = phase;
      support.dot.position.x = Math.cos(phase) * .065;support.dot.position.z = Math.sin(phase) * .065;
    }
    for (const hotspot of hotspots) {
      hotspot.available = joint(hotspot.anchor, hotspot.marker.position);
      if (hotspot.available && hotspot.from && joint(hotspot.from, position)) hotspot.marker.position.lerp(position, 1 - hotspot.blend);
      // The colour blocks and the UI's leaders carry the explanation. Only a
      // selected region receives a tiny location ring; no default dot clutter.
      // Hip anchors can lie inside the protected shorts. Their labels still
      // receive exact anchors; never place a visible focus ring over the groin.
      hotspot.marker.visible = hotspot.available && Boolean(focus) && isFocused(hotspot) &&
        !['hipFlexor', 'glute', 'adductor'].includes(hotspot.kind);
    }
    updateCues();
    updateSurface();
  }
  function setData(value) {
    if (disposed) return;
    const next = value == null ? null : copySamples(value);
    releasePaths();data = next;
    if (data) tracks = PATHS.map(makeTrack);
    update(time ?? data?.startTime ?? 0, metrics);
  }
  function setVisible(options = {}) {
    if (disposed) return;
    if (typeof options === 'boolean') visibility.enabled = options;
    else for (const key of Object.keys(visibility)) if (typeof options[key] === 'boolean') visibility[key] = options[key];
    update(time ?? data?.startTime ?? 0, metrics);
  }
  function setAnnotations(definition) {
    if (disposed) return;
    const next = copyAnnotations(definition);
    const key = JSON.stringify(next);
    if (key === annotationKey) return;
    releaseAnnotations();annotations = next;annotationKey = key;buildAnnotationVisuals();
    update(time ?? data?.startTime ?? 0, metrics);
  }
  function setFocus(id) {
    if (disposed) return;
    if (id != null && !FOCUS_IDS.has(id) && !annotations.regions.some(region => [region.id, region.parentId, region.group].includes(id))) {
      throw new TypeError('未知的动作教学功能区。');
    }
    focus = id || null;update(time ?? data?.startTime ?? 0, metrics);
  }
  function setCueDirections(updates) {
    if (disposed || !Array.isArray(updates)) return;
    for (const update of updates) {
      const cue = directionCues.find(value => value.id === update.id);
      if (!cue) continue;
      if (typeof update.enabled === 'boolean') cue.enabled = update.enabled;
      if (finitePoint(update.direction) && Math.hypot(...update.direction) > EPSILON) cue.direction = Array.from(update.direction);
    }
    updateCues();
  }
  function getHotspots() {
    if (!active || !visibility.regions || disposed) return [];
    return hotspots.filter(hotspot => hotspot.available).map(hotspot => ({ id: hotspot.id, group: hotspot.group, label: hotspot.label,
      side: hotspot.side, kind: hotspot.kind, anchor: hotspot.anchor, position: hotspot.marker.position.toArray() }));
  }
  function getStatus() {
    return { ...visibility, visible: root.visible, focus, time, progress, disposed,
      startTime: data?.startTime ?? null, endTime: data?.endTime ?? null, frameCount: data?.frames.length ?? 0,
      pathCount: tracks.filter(track => track.material).length,
      supportHands: [...supportHands], supportArrowLength: supportLength,
      surfaceMeshCount: surfaceAssignments.length, surfaceInstalled,
      regionCount: annotations.regions.length, colouredRegionCount: Array.from(surfaceUniforms.uMovementStarts.value).filter(value => value.w > 0).length,
      regionIds: annotations.regions.map(region => region.id), cueCount: directionCues.length,
      visibleCueCount: active && visibility.support ? directionCues.filter(cue => cue.group.visible).length : 0,
      coordinateSpace: 'model-local', regionMeaning: 'functional-region teaching indication',
      forceMagnitude: false, measuredActivation: false, source: 'resolved saved joint samples' };
  }
  function dispose() {
    if (disposed) return;
    installSurface(false);clearCapsules();releasePaths();releaseAnnotations();root.removeFromParent();root.clear();root.visible = false;
    for (const geometry of staticGeometry) geometry.dispose();
    for (const material of staticMaterials) material.dispose();
    for (const variants of surfaceClones.values()) for (const material of variants.values()) material.dispose();
    staticGeometry.clear();staticMaterials.clear();surfaceClones.clear();supportHands = [];data = null;active = false;disposed = true;
  }
  buildAnnotationVisuals();
  return { setData, setVisible, setAnnotations, setCueDirections, setFocus, update, getHotspots, getStatus, dispose };
}
