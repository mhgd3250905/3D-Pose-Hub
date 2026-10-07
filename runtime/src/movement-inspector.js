import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { groupById } from './data.js';
import { resolveMovementTraining } from './movement-training.js';
import { createMovementContext as createAtlasMovementContext } from './movement-context.js';
import { createFitnessMovementContext } from './fitness-movement-context.js';
import { isDeepSurfaceGroup } from './movement-surface-regions.js';
import { openMuscleViewer } from './muscle-viewer.js';
import { resolveGroup } from './muscle-map.js';
import { FLARE_SECTIONS, flareFilters, flareItems, flarePoseFilter } from './flare-muscle-groups.js';

const SLOTS = [
  { id: 'shoulder-arm-support', title: '肩臂支撑', colour: '#72d6ff', groups: ['shoulders', 'scapular', 'arms'],
    assets: ['deltoids', 'rotator-cuff', 'triceps', 'serratus', 'scapular'] },
  { id: 'core-coordination', title: '核心协调', colour: '#b49bfa', groups: ['core'], assets: ['obliques', 'erectors'] },
  { id: 'hip-leg-swing', title: '髋腿摆动', colour: '#d8ef70', groups: ['hipFlexors', 'glutes', 'adductors', 'quadriceps'],
    assets: ['hip-flexors', 'quadriceps', 'glutes', 'hip-rotators', 'adductors', 'hamstrings'] },
];
const SLOT_ALIASES = { shoulders: 0, scapular: 0, arms: 0, support: 0, core: 1, hipFlexors: 2, glutes: 2, adductors: 2, hips: 2 };
const sideName = side => side === 'left' ? '本人左侧' : side === 'right' ? '本人右侧' : '双侧 / 中线';
const supportName = hands => hands.length === 2 ? '双手支撑' : hands.length === 1 ? `${hands[0] === 'left' ? '左' : '右'}手支撑` : '换手过渡';
const text = value => typeof value === 'string' ? value : '';

function slotFor(id) {
  return SLOTS.find(slot => slot.id === id) ?? SLOTS[SLOT_ALIASES[id]] ?? null;
}

function node(document, tag, className, content) {
  const result = document.createElement(tag);result.className = className;
  if (content !== undefined) result.textContent = String(content);return result;
}

// Keep the source asset groups, names and anatomical sides. The original
// atlas has no animation rig; these are references associated with the live
// movement task, never a posed or precisely registered Snow anatomy layer.
function availableGroups(viewer, profile, slot) {
  const atlas = new Map((viewer.manifest?.groups ?? []).map(group => [group.id, group]));
  const labels = (profile.labels ?? []).filter(label => slot.groups.includes(label.group));
  const requested = [...new Set(labels.flatMap(label => label.anatomyGroups ?? []))];
  const ids = requested.length ? requested : slot.groups.flatMap(id => groupById[id]?.assetGroups ?? []);
  const order = [...slot.assets, ...ids];
  return [...new Set(order)].filter(id => ids.includes(id)).map(id => {
    const asset = atlas.get(id);if (!asset) return null;
    const elements = new Set(asset.elements ?? []), matching = labels.filter(label => label.anatomyGroups?.includes(id));
    const sides = new Set(slot.id === SLOTS[0].id ? profile.supportHands : matching.flatMap(label => label.side === 'left' || label.side === 'right' ? [label.side] : ['left', 'right']));
    const meshes = (viewer.parts ?? []).filter(mesh => {
      const part = mesh.userData?.part;
      return mesh.isMesh && part?.system === 'muscular' && elements.has(part.id) &&
        (!sides.size || !['left', 'right'].includes(part.side) || sides.has(part.side));
    });
    if (!meshes.length) return null;
    return { id, label: asset.label ?? asset.name ?? id, meshes, role: matching.map(label => text(label.role)).filter(Boolean).join(' '),
      view: ['erectors', 'scapular', 'glutes', 'triceps', 'hamstrings', 'hip-rotators', 'rotator-cuff'].includes(id) ? 'back' : 'front' };
  }).filter(Boolean);
}

const GROUP_POSITIONS = {
  deltoids: '肩部外侧', 'rotator-cuff': '肩关节周围', triceps: '上臂后侧',
  serratus: '胸廓两侧', scapular: '肩胛周围', obliques: '腰腹两侧', erectors: '脊柱两侧',
  'hip-flexors': '髋部前侧', quadriceps: '大腿前侧', glutes: '臀部后外侧',
  'hip-rotators': '髋部周围', adductors: '大腿内侧', hamstrings: '大腿后侧',
};

/** One independent renderer: a dressed mature body for region teaching, or
 * a separate intact atlas body for actual anatomical structures. */
export function createMovementInspector({ viewer, container, onClose, refreshIcons }) {
  if (!viewer || !container?.appendChild) throw new TypeError('肌群检查窗需要当前人物视图和画布容器。');
  const document = container.ownerDocument ?? globalThis.document;
  const root = node(document, 'aside', 'movement-inspector');root.hidden = true;
  root.setAttribute('role', 'dialog');root.setAttribute('aria-modal', 'false');root.setAttribute('aria-label', '当前动作的肌群解析');
  const header = node(document, 'header', 'mvi-header'), heading = node(document, 'div', 'mvi-heading');
  const stage = node(document, 'p', 'mvi-stage'), title = node(document, 'h2', 'mvi-title');heading.append(stage, title);
  const closeButton = node(document, 'button', 'mvi-close');closeButton.type = 'button';closeButton.setAttribute('aria-label', '收起肌群解析');
  closeButton.innerHTML = '<i data-lucide="x"></i>';header.append(heading, closeButton);root.appendChild(header);
  const task = node(document, 'p', 'mvi-task');root.appendChild(task);
  const tabs = node(document, 'div', 'mvi-tabs');tabs.setAttribute('role', 'tablist');tabs.setAttribute('aria-label', '部位与训练');
  const anatomyTab = node(document, 'button', 'mvi-tab', '部位与肌群'), trainingTab = node(document, 'button', 'mvi-tab', '相关训练');
  for (const button of [anatomyTab, trainingTab]) { button.type = 'button';button.setAttribute('role', 'tab');tabs.appendChild(button); }
  root.appendChild(tabs);
  const scroll = node(document, 'div', 'mvi-scroll'), anatomyPane = node(document, 'section', 'mvi-anatomy'), trainingPane = node(document, 'section', 'mvi-training');
  const paneId = 'movement-inspector-' + Math.random().toString(36).slice(2, 9);
  anatomyPane.id = paneId + '-anatomy';trainingPane.id = paneId + '-training';
  anatomyTab.id = paneId + '-anatomy-tab';trainingTab.id = paneId + '-training-tab';
  anatomyTab.setAttribute('aria-controls', anatomyPane.id);trainingTab.setAttribute('aria-controls', trainingPane.id);
  anatomyPane.setAttribute('aria-labelledby', anatomyTab.id);trainingPane.setAttribute('aria-labelledby', trainingTab.id);
  anatomyPane.setAttribute('role', 'tabpanel');trainingPane.setAttribute('role', 'tabpanel');trainingPane.hidden = true;
  scroll.append(anatomyPane, trainingPane);root.appendChild(scroll);
  const viewport = node(document, 'div', 'mvi-viewer');anatomyPane.appendChild(viewport);
  const viewControls = node(document, 'div', 'mvi-view-controls');viewControls.setAttribute('aria-label', '参考人体视角');
  const frontButton = node(document, 'button', 'mvi-view-button', '正面'), backButton = node(document, 'button', 'mvi-view-button', '背面');
  const resetButton = node(document, 'button', 'mvi-view-button mvi-view-reset');resetButton.setAttribute('aria-label', '恢复参考人体视角');
  resetButton.innerHTML = '<i data-lucide="rotate-ccw"></i>';
  for (const button of [frontButton, backButton, resetButton]) { button.type = 'button';viewControls.appendChild(button); }
  viewport.appendChild(viewControls);
  const callout = node(document, 'div', 'mvi-callout'), groupName = node(document, 'strong', 'mvi-view-name'), viewSide = node(document, 'span', 'mvi-view-side');
  callout.append(groupName, viewSide);callout.hidden = true;viewport.appendChild(callout);
  const locator = node(document, 'button', 'mvi-locator');locator.type = 'button';locator.hidden = true;
  const locatorPlot = node(document, 'span', 'mvi-locator-plot');locatorPlot.setAttribute('aria-hidden', 'true');
  const locatorCaption = node(document, 'span', 'mvi-locator-caption'), locatorIcon = node(document, 'span', 'mvi-locator-icon');
  locatorIcon.innerHTML = '<i data-lucide="search"></i>';
  const locatorText = node(document, 'span', 'mvi-locator-label', '查看全身');locatorCaption.append(locatorIcon, locatorText);locator.append(locatorPlot, locatorCaption);viewport.appendChild(locator);
  const empty = node(document, 'p', 'mvi-empty', '正在载入完整参考人体…');empty.setAttribute('role', 'status');viewport.appendChild(empty);
  const hint = node(document, 'span', 'mvi-view-hint', '拖动旋转 · 滚轮缩放');viewport.appendChild(hint);
  const fullscreenButton = node(document, 'button', 'mvi-fullscreen');fullscreenButton.type = 'button';
  fullscreenButton.setAttribute('aria-label', '全屏查看 3D 肌群位置');
  fullscreenButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><span>全屏 3D</span>';
  viewport.appendChild(fullscreenButton);
  const modelKey = node(document, 'p', 'mvi-model-key', '亮色标出肌群所在区域');modelKey.hidden = true;anatomyPane.appendChild(modelKey);
  const contextStatus = node(document, 'p', 'mvi-context-status');contextStatus.hidden = true;contextStatus.setAttribute('role', 'status');anatomyPane.appendChild(contextStatus);
  const role = node(document, 'p', 'mvi-role');anatomyPane.appendChild(role);
  const secondary = node(document, 'details', 'mvi-secondary'), secondarySummary = node(document, 'summary', 'mvi-secondary-summary', '切换肌群 · 查看原结构');
  secondary.appendChild(secondarySummary);anatomyPane.appendChild(secondary);
  secondary.appendChild(role);
  const representationControls = node(document, 'div', 'mvi-representations');representationControls.setAttribute('role', 'group');representationControls.setAttribute('aria-label', '人体展示方式');
  const surfaceButton = node(document, 'button', 'mvi-representation', '人物定位'), atlasButton = node(document, 'button', 'mvi-representation', '解剖结构');
  for (const button of [surfaceButton, atlasButton]) { button.type = 'button';representationControls.appendChild(button); }
  secondary.appendChild(representationControls);
  const representationNote = node(document, 'p', 'mvi-representation-note', '在完整人体上查看部位；深层肌群用所在区域定位。');secondary.appendChild(representationNote);
  const groupRow = node(document, 'div', 'mvi-part-row'), groupCaption = node(document, 'label', 'mvi-part-caption', '肌群');
  const groupSelect = node(document, 'select', 'mvi-group-select');groupSelect.id = paneId + '-group';groupCaption.htmlFor = groupSelect.id;groupSelect.setAttribute('aria-label', '选择真实肌群');
  groupRow.append(groupCaption, groupSelect);secondary.appendChild(groupRow);
  const partRow = node(document, 'div', 'mvi-part-row'), partCaption = node(document, 'label', 'mvi-part-caption', '结构');
  const partSelect = node(document, 'select', 'mvi-part-select');partSelect.id = paneId + '-part';partCaption.htmlFor = partSelect.id;partSelect.setAttribute('aria-label', '选择真实肌肉结构');
  partRow.append(partCaption, partSelect);secondary.appendChild(partRow);
  const structureName = node(document, 'p', 'mvi-structure-name'), missing = node(document, 'p', 'mvi-missing');secondary.append(structureName, missing);
  const trainingHeading = node(document, 'p', 'mvi-training-heading', '对应练法'), drills = node(document, 'div', 'mvi-drills');trainingPane.append(trainingHeading, drills);
  trainingPane.appendChild(node(document, 'p', 'mvi-training-note', '按动作任务选择练习，不据此诊断哪块肌肉偏弱。'));
  const drillPreview = node(document, 'button', 'mvi-drill-preview');drillPreview.type = 'button';
  const drillCopy = node(document, 'span', 'mvi-preview-copy'), drillPreviewCaption = node(document, 'span', 'mvi-preview-caption', '对应练法');
  const drillPreviewTitle = node(document, 'strong', 'mvi-preview-title');drillCopy.append(drillPreviewCaption, drillPreviewTitle);
  const drillPreviewMore = node(document, 'span', 'mvi-preview-more', '查看要点'), drillChevron = node(document, 'span', 'mvi-preview-chevron');drillChevron.innerHTML = '<i data-lucide="chevron-right"></i>';
  drillPreview.append(drillCopy, drillPreviewMore, drillChevron);root.appendChild(drillPreview);
  const footer = node(document, 'footer', 'mvi-footer'), source = node(document, 'a', 'mvi-source', 'BodyParts3D');
  source.href = '/anatomy/ATTRIBUTION.md';source.target = '_blank';source.rel = 'noopener noreferrer';footer.appendChild(source);
  footer.appendChild(node(document, 'span', 'mvi-reference-note', '原姿势结构参考'));root.appendChild(footer);container.appendChild(root);

  const scene = new THREE.Scene(), reference = new THREE.Group();reference.name = 'movement-inspector-reference';scene.add(reference);
  const camera = new THREE.PerspectiveCamera(36, 1, .001, 30), miniCamera = new THREE.PerspectiveCamera(34, 1, .001, 30);
  camera.layers.enable(1);
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), anchor = new THREE.Vector3(), projected = new THREE.Vector3();
  const renderDirection = new THREE.Vector3(), lineStart = new THREE.Vector3();
  scene.add(new THREE.HemisphereLight(0xdbe7ff, 0x22324a, 1.0));
  const key = new THREE.DirectionalLight(0xfff4e7, 1.65);key.position.set(2, 3, 4);scene.add(key);
  const fill = new THREE.DirectionalLight(0xb9d8ff, .5);fill.position.set(-3, 1, -2);scene.add(fill);
  // Studio staging: an accent rim light from behind and a soft glowing floor disc.
  const rim = new THREE.DirectionalLight(0x72d6ff, 1.25);rim.position.set(-1.5, 2.2, -3.5);scene.add(rim);
  const floorMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false,
    uniforms: { uColour: { value: new THREE.Color(0x72d6ff) }, uTime: { value: 0 }, uReveal: { value: 1 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform vec3 uColour;uniform float uTime;uniform float uReveal;varying vec2 vUv;void main(){
      float r=length(vUv-0.5)*2.0;float glow=(1.0-smoothstep(0.0,1.0,r))*0.30;
      float ring=(smoothstep(0.66,0.70,r)-smoothstep(0.70,0.75,r))*0.55;
      float wave=r<uReveal?(smoothstep(uReveal-0.18,uReveal,r)*(1.0-step(0.999,uReveal)))*0.8:0.0;
      float a=(glow+ring*(0.75+0.25*sin(uTime*1.6))+wave)*smoothstep(1.0,0.86,r);
      gl_FragColor=vec4(uColour*(0.6+glow),a);}` });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(.5, 64), floorMaterial);floor.rotation.x = -Math.PI / 2;floor.position.y = .002;floor.renderOrder = -1;reference.add(floor);
  let introStart = 0, lastLookTime = 0, closingTimer = 0, originX = .5, originY = .1;
  const INTRO_MS = 1250, reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const easeOut = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  // Remember where the user pressed, so the card unfolds out of that hotspot.
  const rememberOrigin = event => { originX = event.clientX;originY = event.clientY; };
  document.addEventListener('pointerdown', rememberOrigin, true);
  const leaderGeometry = new THREE.BufferGeometry();leaderGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const leaderMaterial = new THREE.LineBasicMaterial({ color: 0x72d6ff, transparent: true, opacity: .80, depthTest: false, depthWrite: false, toneMapped: false });
  const leader = new THREE.Line(leaderGeometry, leaderMaterial);leader.name = 'inspector-muscle-label';leader.layers.set(1);leader.renderOrder = 3;leader.frustumCulled = false;leader.visible = false;scene.add(leader);
  const listeners = [], materials = new Set(), copies = [];
  let renderer = null, controls = null, environmentTarget = null, active = false, disposed = false, frame = 0, dirty = false;
  let profile = null, slot = null, groups = [], currentGroup = null, selectedPartId = null, tab = 'anatomy', rendererFailed = false;
  let pointerDown = null, renderCount = 0, width = 1, height = 1, framedWidth = 0, returnFocus = null;
  let viewMode = 'local', viewDirection = 'front', manualDirection = null, fullBodyBounds = null, localBounds = null, pendingFrame = true;
  let representation = 'surface', overlay = null, overlayOwnsInspector = false;
  const bodyContext = createFitnessMovementContext({ reference, requestRender, onReady: () => {
    if (active && currentGroup && !disposed && representation === 'surface') { frameCurrentReference();requestRender(); }
  } });
  const atlasContext = createAtlasMovementContext({ reference, requestRender, onReady: () => {
    if (active && currentGroup && !disposed && representation === 'atlas') { frameCurrentReference();requestRender(); }
  } });
  const listen = (target, name, handler, options) => { target.addEventListener(name, handler, options);listeners.push(() => target.removeEventListener(name, handler, options)); };

  function requestRender() {
    dirty = true;
    if (!active || disposed || !renderer || frame || typeof requestAnimationFrame !== 'function') return;
    frame = requestAnimationFrame(render);
  }
  function setLocatorCaption() {
    const full = viewMode === 'full';
    locatorText.textContent = full ? '返回局部' : '查看全身';
    locator.setAttribute('aria-label', full ? '返回当前肌群的局部人体视图' : '查看高亮肌群在完整人体上的位置');
    locator.setAttribute('aria-pressed', String(full));
    locatorIcon.innerHTML = '<i data-lucide="' + (full ? 'arrow-left' : 'search') + '"></i>';refreshIcons?.();
  }
  function fitCamera(targetCamera, bounds, direction, aspect, padding = 1.16) {
    const centre = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3());
    const distance = Math.max(size.y, size.x / Math.max(.32, aspect), size.z, .10) / (2 * Math.tan(THREE.MathUtils.degToRad(targetCamera.fov / 2))) * padding;
    targetCamera.aspect = aspect;targetCamera.position.copy(centre).addScaledVector(direction, distance);targetCamera.lookAt(centre);
    targetCamera.near = Math.max(.001, distance / 100);targetCamera.far = Math.max(10, distance * 12);targetCamera.updateProjectionMatrix();targetCamera.updateMatrixWorld(true);
    return { centre, distance };
  }
  function fitMainCamera() {
    const bounds = viewMode === 'full' ? fullBodyBounds : localBounds;
    if (!bounds || bounds.isEmpty()) return;
    const direction = new THREE.Vector3(viewDirection === 'back' ? -.15 : .15, .045, viewDirection === 'back' ? -1 : 1).normalize();
    const fitted = fitCamera(camera, bounds, direction, width / height, viewMode === 'full' ? 1.14 : 1.13);
    // Reserve a little breathing room for the name to the right. This is only
    // the inspector camera; the original animation camera is never touched.
    camera.setViewOffset(width, height, Math.min(26, width * .075), 0, width, height);
    if (controls) {
      controls.target.copy(fitted.centre);controls.minDistance = Math.max(.08, fitted.distance * .60);controls.maxDistance = fitted.distance * 2.7;controls.update();
    }
    frontButton.setAttribute('aria-pressed', String(viewDirection === 'front'));backButton.setAttribute('aria-pressed', String(viewDirection === 'back'));
    pendingFrame = false;requestRender();
  }
  function updateLabel() {
    if (!currentGroup || !fullBodyBounds || !reference.visible) { callout.hidden = true;leader.visible = false;return; }
    const selected = selectedPartId ? copies.filter(mesh => mesh.userData.part.id === selectedPartId) : copies;
    const candidates = selected.length ? selected : copies;
    let best = null, bestDistance = Infinity;
    const direction = camera.position.clone().sub(controls?.target ?? fullBodyBounds.getCenter(new THREE.Vector3())).normalize();
    const locations = representation === 'surface' ? bodyContext.anchors(direction)
      : candidates.map(mesh => ({ side: mesh.userData.part.side, position: boundsFor(mesh).getCenter(new THREE.Vector3()) }));
    for (const location of locations) {
      const centre = location.position.clone();reference.localToWorld(centre);
      projected.copy(centre).project(camera);
      if (projected.z < -1 || projected.z > 1) continue;
      const distance = Math.hypot((projected.x + 1) * width / 2 - (width - 62), (1 - projected.y) * height / 2 - 95);
      if (distance < bestDistance) { bestDistance = distance;best = location;anchor.copy(centre); }
    }
    if (!best) { callout.hidden = true;leader.visible = false;return; }
    callout.hidden = false;
    const sides = new Set(candidates.map(mesh => mesh.userData.part.side).filter(side => side === 'left' || side === 'right'));
    const side = sides.size > 1 ? 'both' : best.side;
    viewSide.textContent = (side === 'left' ? '左侧' : side === 'right' ? '右侧' : side === 'both' ? '双侧' : '中线') + ' · ' + (GROUP_POSITIONS[currentGroup.id] ?? '相关部位');
    callout.setAttribute('aria-label', groupName.textContent + '，' + sideName(side) + '，' + (GROUP_POSITIONS[currentGroup.id] ?? '相关部位'));
    const rectangle = callout.getBoundingClientRect(), viewRect = viewport.getBoundingClientRect(), k = viewRect.width ? width / viewRect.width : 1;
    const x = rectangle.width ? (rectangle.left - viewRect.left) * k + 5 : width - 120, y = rectangle.height ? (rectangle.bottom - viewRect.top) * k + 3 : 90;
    projected.copy(anchor).project(camera);
    lineStart.set(x / width * 2 - 1, 1 - y / height * 2, projected.z).unproject(camera);
    const positions = leaderGeometry.attributes.position;
    positions.setXYZ(0, lineStart.x, lineStart.y, lineStart.z);positions.setXYZ(1, anchor.x, anchor.y, anchor.z);positions.needsUpdate = true;
    leaderMaterial.color.set(slot.colour);leader.visible = true;
  }
  function renderLocator() {
    if (!fullBodyBounds || !locator || locator.hidden) return;
    const viewRect = viewport.getBoundingClientRect(), rectangle = locatorPlot.getBoundingClientRect(), k = viewRect.width ? width / viewRect.width : 1;
    const plotWidth = Math.max(1, (rectangle.width || 76) * k), plotHeight = Math.max(1, (rectangle.height || 112) * k);
    const x = Math.round((rectangle.left - viewRect.left) * k), y = Math.round(height - (rectangle.bottom - viewRect.top) * k);
    renderDirection.copy(camera.position).sub(controls?.target ?? localBounds.getCenter(new THREE.Vector3())).normalize();
    fitCamera(miniCamera, fullBodyBounds, renderDirection, plotWidth / plotHeight, 1.18);
    renderer.setViewport(x, y, plotWidth, plotHeight);renderer.setScissor(x, y, plotWidth, plotHeight);renderer.setScissorTest(true);
    renderer.setClearColor(0x112132, 1);renderer.clear(true, true, false);renderer.render(scene, miniCamera);
    renderer.setScissorTest(false);renderer.setViewport(0, 0, width, height);renderer.setClearColor(0x000000, 0);
  }
  function animateLook(now) {
    const elapsed = introStart ? now - introStart : INTRO_MS;
    const reveal = reducedMotion() ? 1 : easeOut((elapsed - 180) / 950), spin = reducedMotion() ? 0 : (1 - easeOut(elapsed / INTRO_MS)) * .62;
    bodyContext.setLook?.({ time: now / 1000, reveal });
    floorMaterial.uniforms.uTime.value = now / 1000;floorMaterial.uniforms.uReveal.value = reducedMotion() ? 1 : easeOut(elapsed / 900);
    reference.rotation.y = spin;floor.visible = representation === 'surface' && viewMode === 'full' || elapsed < INTRO_MS;
    return elapsed < INTRO_MS;
  }
  function render() {
    frame = 0;if (!active || disposed || !renderer || tab !== 'anatomy' || overlayOwnsInspector) return;
    if (overlay) { frame = requestAnimationFrame(render);return; }
    const now = globalThis.performance?.now?.() ?? Date.now(), intro = animateLook(now);
    // Breathing glow: ~24 fps while the card is open; full rate during the intro.
    if (intro || now - lastLookTime > 41) { dirty = true;lastLookTime = now; }
    const changed = controls?.update() ?? false;
    if (pendingFrame && fullBodyBounds) fitMainCamera();
    if (dirty || changed) {
      scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);updateLabel();
      renderer.setScissorTest(false);renderer.setViewport(0, 0, width, height);renderer.clear();renderer.render(scene, camera);renderLocator();renderCount++;dirty = false;
    }
    if (active && !disposed) frame = requestAnimationFrame(render);
  }
  function resize() {
    if (!active || disposed) return;
    const containerRect = container.getBoundingClientRect(), toolbar = document.querySelector('#motion-toolbar'), head = document.querySelector('.movement-stage-head');
    const toolbarRect = toolbar && !toolbar.hidden ? toolbar.getBoundingClientRect() : null;
    const safeBottom = toolbarRect?.height ? toolbarRect.top - containerRect.top - 12 : containerRect.height - 104;
    const headRect = head && !head.hidden ? head.getBoundingClientRect() : null;
    const safeTop = headRect ? (containerRect.width > 700 ? headRect.top - containerRect.top + 4 : headRect.bottom - containerRect.top + 12) : 112;
    const availableHeight = Math.max(120, safeBottom - safeTop);
    root.style.maxHeight = availableHeight + 'px';
    root.style.setProperty('--mvi-hero-height', Math.max(160, Math.min(520, availableHeight - 240)) + 'px');
    if (containerRect.width <= 700) {
      root.style.left = '';root.style.right = '';root.style.width = '';root.style.top = 'auto';
      root.style.bottom = Math.max(12, containerRect.height - safeBottom) + 'px';
    } else {
      root.style.bottom = '';root.style.top = safeTop + 'px';
      if (framedWidth !== containerRect.width) {
        const bounds = viewer.projectCoach?.();
        const leftGap = bounds?.min ? (bounds.min[0] + 1) * containerRect.width / 2 : 0;
        const rightGap = bounds?.max ? (1 - bounds.max[0]) * containerRect.width / 2 : containerRect.width;
        const gap = Math.max(leftGap, rightGap), panelWidth = gap >= 350 ? Math.min(containerRect.width >= 1200 ? 480 : 400, gap - 28) : 364;
        root.style.width = Math.min(containerRect.width - 36, Math.max(340, panelWidth)) + 'px';
        root.style.left = leftGap > rightGap ? '18px' : 'auto';root.style.right = leftGap > rightGap ? 'auto' : '18px';
      }
    }
    framedWidth = containerRect.width;
    if (!renderer || tab !== 'anatomy') return;
    const rectangle = viewport.getBoundingClientRect();
    // clientWidth ignores the unfold transform, so the canvas is never sized while scaled down.
    const nextWidth = Math.max(1, viewport.clientWidth || rectangle.width || 364), nextHeight = Math.max(1, viewport.clientHeight || rectangle.height || 300);
    if (nextWidth !== width || nextHeight !== height) {
      width = nextWidth;height = nextHeight;renderer.setSize(width, height, false);camera.aspect = width / height;camera.updateProjectionMatrix();pendingFrame = true;
    }
    requestRender();
  }
  function ensureRenderer() {
    if (renderer || rendererFailed) return;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5));renderer.setClearColor(0x000000, 0);renderer.autoClear = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;renderer.toneMapping = THREE.ACESFilmicToneMapping;renderer.toneMappingExposure = 1;
      const room = new RoomEnvironment(), environment = new THREE.PMREMGenerator(renderer);
      try { environmentTarget = environment.fromScene(room, .04);scene.environment = environmentTarget.texture;scene.environmentIntensity = .35; }
      finally { room.dispose();environment.dispose(); }
      renderer.domElement.className = 'mvi-canvas';renderer.domElement.setAttribute('aria-label', '完整参考人体与当前高亮肌群，可旋转查看');viewport.insertBefore(renderer.domElement, viewControls);
      controls = new OrbitControls(camera, renderer.domElement);controls.enableDamping = true;controls.dampingFactor = .08;
      controls.enablePan = false;controls.rotateSpeed = .7;controls.zoomSpeed = .65;controls.addEventListener('change', requestRender);
      listen(renderer.domElement, 'pointerdown', event => { pointerDown = { x: event.clientX, y: event.clientY }; });
      listen(renderer.domElement, 'pointerup', event => {
        if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) >= 6) { pointerDown = null;return; }
        pointerDown = null;const rect = renderer.domElement.getBoundingClientRect();if (!rect.width || !rect.height) return;
        pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
        if (representation !== 'atlas') return;
        raycaster.setFromCamera(pointer, camera);const hit = raycaster.intersectObjects(copies, false)[0];
        if (hit) choosePart(hit.object.userData.part.id);
      });
      listen(renderer.domElement, 'pointercancel', () => { pointerDown = null; });resize();
    } catch {
      environmentTarget?.dispose();environmentTarget = null;scene.environment = null;
      controls?.dispose();controls = null;renderer?.dispose();renderer?.domElement?.remove();renderer = null;rendererFailed = true;
      empty.textContent = '当前无法显示 3D，结构名称与训练要点仍可查看。';empty.hidden = false;hint.hidden = true;locator.hidden = true;
    }
  }
  function clearCopies() {
    for (const mesh of copies) reference.remove(mesh);copies.length = 0;bodyContext.clear();atlasContext.clear();
    for (const material of materials) material.dispose();materials.clear();
    fullBodyBounds = null;localBounds = null;reference.visible = false;leader.visible = false;locator.hidden = true;callout.hidden = true;
    // All muscle geometries belong to viewer.parts. Never dispose or edit them.
  }
  function materialFor() {
    // Flat, saturated teaching colours avoid introducing anatomical fibre
    // detail while preserving every original source triangle and structure.
    const material = new THREE.MeshBasicMaterial({ color: slot.colour, transparent: true, opacity: .94,
      depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    materials.add(material);return material;
  }
  function boundsFor(mesh) {
    let box = mesh.geometry.boundingBox?.clone(), bounds = mesh.userData.part.bounds;
    if (!box && Array.isArray(bounds) && bounds.length === 2) box = new THREE.Box3(new THREE.Vector3().fromArray(bounds[0]), new THREE.Vector3().fromArray(bounds[1]));
    if (!box) {
      box = new THREE.Box3();const positions = mesh.geometry.getAttribute('position'), point = new THREE.Vector3();
      for (let index = 0; index < positions.count; index++) box.expandByPoint(point.fromBufferAttribute(positions, index));
    }
    mesh.updateMatrix();return box.applyMatrix4(mesh.matrix);
  }
  function frameCurrentReference() {
    reference.position.set(0, 0, 0);reference.updateMatrixWorld(true);
    bodyContext.clear();atlasContext.clear();
    for (const mesh of copies) mesh.visible = representation === 'atlas';
    const context = representation === 'surface' ? bodyContext : atlasContext;
    const bodyBounds = context.show(slot.id, copies, { groupId: currentGroup.id, partId: selectedPartId, colour: slot.colour });
    if (!bodyBounds || bodyBounds.isEmpty()) { reference.visible = false;empty.hidden = false;return; }
    fullBodyBounds = bodyBounds.clone();localBounds = bodyBounds.clone();
    const targetBounds = representation === 'surface' ? bodyContext.targetBounds ?? bodyBounds.clone() : new THREE.Box3();
    if (representation === 'atlas') for (const mesh of copies) targetBounds.union(boundsFor(mesh));
    const lower = slot.id === SLOTS[0].id ? .66 : slot.id === SLOTS[1].id ? .47 : .22;
    localBounds.min.y = Math.max(bodyBounds.min.y, Math.min(lower, targetBounds.min.y - .10));
    // These boxes frame a complete scene; no source vertices or faces are cut.
    reference.visible = true;empty.hidden = !rendererFailed;modelKey.hidden = false;contextStatus.hidden = true;locator.hidden = rendererFailed;
    callout.hidden = rendererFailed;hint.hidden = rendererFailed;pendingFrame = true;fitMainCamera();requestRender();
  }
  function choosePart(id) {
    const found = copies.find(mesh => mesh.userData.part.id === id);selectedPartId = found ? id : null;partSelect.value = selectedPartId ?? '';
    for (const mesh of copies) { mesh.material.opacity = !selectedPartId || mesh.userData.part.id === selectedPartId ? .94 : .16;mesh.material.color.set(slot.colour); }
    structureName.textContent = found ? sideName(found.userData.part.side) + ' · ' + found.userData.part.name
      : representation === 'surface' ? '人物色区提示肌群位置；左右指人体本人。' : '保留原结构名称；左右指人体本人。';
    if (representation === 'surface' && bodyContext.state.loaded) {
      bodyContext.show(slot.id, copies, { groupId: currentGroup.id, partId: selectedPartId, colour: slot.colour });
    }
    requestRender();
  }
  function chooseGroup(id) {
    const group = groups.find(item => item.id === id);if (!group) return;
    clearCopies();currentGroup = group;selectedPartId = null;reference.position.set(0, 0, 0);
    for (const original of group.meshes) {
      const copy = original.clone(false);copy.name = original.userData.part.name;copy.material = materialFor();copy.visible = representation === 'atlas';
      copy.userData.part = { ...original.userData.part };copy.renderOrder = 2;reference.add(copy);copies.push(copy);
    }
    groupName.textContent = group.label;groupSelect.value = id;role.textContent = group.role;role.hidden = !group.role;updateRepresentationCopy();
    viewDirection = manualDirection ?? group.view;
    partSelect.replaceChildren();const all = node(document, 'option', '', '全部结构');all.value = '';partSelect.appendChild(all);
    for (const mesh of copies) { const option = node(document, 'option', '', sideName(mesh.userData.part.side) + ' · ' + mesh.userData.part.name);option.value = mesh.userData.part.id;partSelect.appendChild(option); }
    partSelect.disabled = !copies.length;choosePart(null);resize();frameCurrentReference();requestRender();
  }
  function updateRepresentationCopy() {
    const surface = representation === 'surface';root.dataset.representation = representation;
    surfaceButton.setAttribute('aria-pressed', String(surface));atlasButton.setAttribute('aria-pressed', String(!surface));
    source.textContent = surface ? 'Blender Studio · CC0' : 'BodyParts3D';
    groupSelect.setAttribute('aria-label', '选择相关肌群');
    partSelect.setAttribute('aria-label', surface ? '按原结构定位部位' : '选择真实肌肉结构');
    root.querySelector('.mvi-reference-note').textContent = surface ? '人体部位定位' : '独立原姿势参考';
    partCaption.textContent = surface ? '定位' : '原结构';
    representationNote.textContent = surface ? '在完整人体上查看所在区域；切换解剖结构可看原始肌肉。'
      : '独立原姿势解剖参考，保留源网格和名称。';
    modelKey.textContent = surface ? (isDeepSurfaceGroup(currentGroup?.id) ? '深层肌群 · 亮色提示所在区域' : '亮色标出肌群所在区域')
      : '完整人体定位 · 亮色为原始肌肉结构';
  }
  function loadCurrentContext() {
    const mode = representation, context = mode === 'surface' ? bodyContext : atlasContext;
    empty.textContent = '正在载入完整参考人体…';empty.hidden = false;
    context.load().then(ready => {
      if (disposed || !active || representation !== mode) return;
      contextStatus.hidden = ready;modelKey.hidden = !ready;
      if (!ready) { contextStatus.textContent = '完整身体参照暂未载入，重新打开可重试。';empty.textContent = '身体参照暂未载入'; }
      else if (currentGroup && !fullBodyBounds) frameCurrentReference();
    });
  }
  function setRepresentation(next) {
    representation = next === 'atlas' ? 'atlas' : 'surface';bodyContext.clear();atlasContext.clear();
    for (const mesh of copies) mesh.visible = representation === 'atlas';
    fullBodyBounds = null;localBounds = null;updateRepresentationCopy();choosePart(selectedPartId);loadCurrentContext();
    if (currentGroup) frameCurrentReference();requestRender();
  }
  function setTab(next) {
    tab = next === 'training' ? 'training' : 'anatomy';anatomyPane.hidden = tab !== 'anatomy';trainingPane.hidden = tab !== 'training';
    anatomyTab.setAttribute('aria-selected', String(tab === 'anatomy'));trainingTab.setAttribute('aria-selected', String(tab === 'training'));
    anatomyTab.tabIndex = tab === 'anatomy' ? 0 : -1;trainingTab.tabIndex = tab === 'training' ? 0 : -1;
    scroll.scrollTop = 0;drillPreview.dataset.tab = tab;
    drillPreviewMore.textContent = tab === 'training' ? '返回部位' : '查看要点';
    drillPreview.setAttribute('aria-label', tab === 'training' ? '返回部位与肌群参考' : '查看' + drillPreviewTitle.textContent + '的训练要点');
    if (tab === 'anatomy') { resize();requestRender(); }
  }
  function addDrill(drill, primary) {
    const article = node(document, 'article', primary ? 'mvi-drill mvi-drill-primary' : 'mvi-drill');article.dataset.training = drill.id;
    article.appendChild(node(document, 'span', 'mvi-drill-tag', primary ? '当前任务 · 基础练习' : '同能力的另一练法'));
    article.appendChild(node(document, 'h3', 'mvi-drill-title', drill.title));article.appendChild(node(document, 'p', 'mvi-drill-goal', drill.goal));
    const list = node(document, 'ul', 'mvi-drill-cues');for (const cue of drill.cues.slice(0, primary ? 3 : 2)) list.appendChild(node(document, 'li', '', cue));article.appendChild(list);
    if (primary && drill.steps.length) {
      const detail = node(document, 'details', 'mvi-drill-steps');detail.appendChild(node(document, 'summary', '', '动作步骤'));
      const steps = node(document, 'ol', '');for (const step of drill.steps) steps.appendChild(node(document, 'li', '', step));detail.appendChild(steps);article.appendChild(detail);
    }
    drills.appendChild(article);
  }
  const narrow = () => (container.getBoundingClientRect?.().width || globalThis.innerWidth || 1024) < 700;
  function closeOverlay() { const current = overlay;overlay = null;current?.close(); }
  function openFullscreen(ownsInspector) {
    if (!profile || !slot) return;
    closeOverlay();overlayOwnsInspector = ownsInspector;
    // The full Flare set, one colour per group; "本帧" keeps this pose's
    // annotated groups (with their support / leg sides) lit.
    const [all, ...roles] = flareFilters(), pose = flarePoseFilter(profile);
    const handle = openMuscleViewer({ document, title: '托马斯全旋 · 核心肌群', accent: slot.colour,
      subtitle: '原 ' + String(profile.sourceStepNumber).padStart(2, '0') + ' · ' + supportName(profile.supportHands) + ' · 肌群位置',
      items: flareItems(), sections: FLARE_SECTIONS, filters: pose ? [all, pose, ...roles] : [all, ...roles], filter: 'all',
      onClose: () => {
        if (overlay === handle) overlay = null;
        if (overlayOwnsInspector && active) close();
        else requestRender();
      } });
    overlay = handle;
  }
  function open(nextProfile, slotId) {
    if (disposed) return false;
    const nextSlot = slotFor(slotId), number = Number(nextProfile?.sourceStepNumber), hands = nextProfile?.supportHands;
    if (!nextSlot || !nextProfile || typeof nextProfile !== 'object' || nextProfile.enabled === false || !Number.isInteger(number) || number < 9 || number > 16 ||
      !Array.isArray(hands) || hands.some(side => side !== 'left' && side !== 'right') || new Set(hands).size !== hands.length) return false;
    const training = resolveMovementTraining(nextProfile, nextSlot.id);
    let next;try { next = structuredClone(nextProfile); } catch { return false; }
    if (!active) returnFocus = document.activeElement;
    if (narrow()) {
      // Phones: the full-screen 3D viewer replaces the small popup.
      if (active && !overlayOwnsInspector) { root.hidden = true;if (frame) cancelAnimationFrame(frame);frame = 0; }
      profile = next;slot = nextSlot;active = true;openFullscreen(true);return true;
    }
    if (overlayOwnsInspector) { overlayOwnsInspector = false;closeOverlay(); }
    profile = next;slot = nextSlot;groups = availableGroups(viewer, profile, slot);active = true;root.hidden = false;framedWidth = 0;
    viewMode = 'local';manualDirection = null;representation = 'surface';secondary.open = false;setLocatorCaption();updateRepresentationCopy();
    root.style.setProperty('--mvi-accent', slot.colour);root.dataset.slot = slot.id;
    rim.color.set(slot.colour);floorMaterial.uniforms.uColour.value.set(slot.colour);
    clearTimeout(closingTimer);root.classList.remove('mvi-closing');
    {const host = root.getBoundingClientRect?.(), left = host?.left ?? 0, top = host?.top ?? 0;
     root.style.setProperty('--mvi-origin-x', Math.round(originX - left) + 'px');root.style.setProperty('--mvi-origin-y', Math.round(originY - top) + 'px');}
    root.classList.remove('mvi-opening');void root.offsetWidth;root.classList.add('mvi-opening');introStart = globalThis.performance?.now?.() ?? Date.now();
    title.textContent = slot.title;stage.textContent = '肌群解析 · 原 ' + String(profile.sourceStepNumber).padStart(2, '0') + ' · ' + supportName(profile.supportHands);
    const audience = profile.audienceLabels?.find(label => label.id === slot.id);
    task.textContent = text(profile.cue?.[slot.id === SLOTS[0].id ? 'support' : slot.id === SLOTS[1].id ? 'body' : 'legs']) || text(audience?.role) || text(training?.cue);
    task.title = task.textContent;
    missing.textContent = slot.id === SLOTS[1].id ? '此源模型未含腹直肌、腹内斜肌、腹横肌、背阔肌与腰方肌；当前显示腹外斜肌或竖脊肌参考。' : '';missing.hidden = !missing.textContent;
    groupSelect.replaceChildren();
    for (const group of groups) { const option = node(document, 'option', '', group.label);option.value = group.id;groupSelect.appendChild(option); }
    groupSelect.disabled = !groups.length;drills.replaceChildren();
    if (training?.primary) { addDrill(training.primary, true);training.alternatives.slice(0, 2).forEach(drill => addDrill(drill, false)); }
    else drills.appendChild(node(document, 'p', 'mvi-training-note', '这一换手过渡暂无对应训练建议，先查看肌群与当前作用。'));
    drillPreview.hidden = !training?.primary;drillPreviewTitle.textContent = training?.primary?.title ?? '';
    drillPreviewTitle.title = drillPreviewTitle.textContent;
    empty.textContent = '正在载入完整参考人体…';empty.hidden = false;setTab('anatomy');ensureRenderer();
    loadCurrentContext();
    if (groups.length) {
      const preferred = audience?.group === 'glutes' ? 'glutes' : null;chooseGroup(groups.find(group => group.id === preferred)?.id ?? groups[0].id);
    } else {
      clearCopies();currentGroup = null;partSelect.replaceChildren();partSelect.disabled = true;structureName.textContent = '';role.hidden = true;
      groupName.textContent = slot.title;viewSide.textContent = '';empty.textContent = '此处暂无已载入的独立肌群模型。';empty.hidden = false;hint.hidden = true;
    }
    refreshIcons?.();closeButton.focus?.({ preventScroll: true });requestRender();return true;
  }
  function close() {
    if (!active) return;
    const restoreFocus = root.contains(document.activeElement);active = false;pointerDown = null;
    const ownedByOverlay = overlayOwnsInspector;overlayOwnsInspector = false;closeOverlay();
    if (ownedByOverlay) { root.hidden = true;onClose?.();returnFocus = null;return; }
    root.classList.remove('mvi-opening');
    if (reducedMotion()) root.hidden = true;
    else { root.classList.add('mvi-closing');clearTimeout(closingTimer);closingTimer = setTimeout(() => { if (!active) { root.hidden = true;root.classList.remove('mvi-closing'); } }, 230); }
    if (frame) cancelAnimationFrame(frame);frame = 0;dirty = false;onClose?.();
    if (restoreFocus && returnFocus?.isConnected && returnFocus.getClientRects?.().length) returnFocus.focus?.({ preventScroll: true });returnFocus = null;
  }
  function setDirection(direction) { manualDirection = direction;viewDirection = direction;pendingFrame = true;fitMainCamera(); }
  listen(closeButton, 'click', close);listen(fullscreenButton, 'click', () => openFullscreen(false));listen(frontButton, 'click', () => setDirection('front'));listen(backButton, 'click', () => setDirection('back'));
  listen(resetButton, 'click', () => { manualDirection = null;viewDirection = currentGroup?.view ?? 'front';fitMainCamera(); });
  listen(locator, 'click', () => { viewMode = viewMode === 'full' ? 'local' : 'full';setLocatorCaption();fitMainCamera(); });
  listen(anatomyTab, 'click', () => setTab('anatomy'));listen(trainingTab, 'click', () => setTab('training'));
  listen(drillPreview, 'click', () => { setTab(tab === 'training' ? 'anatomy' : 'training');if (tab === 'training') trainingTab.focus?.({ preventScroll: true }); });
  listen(groupSelect, 'change', () => chooseGroup(groupSelect.value));listen(partSelect, 'change', () => choosePart(partSelect.value));
  listen(surfaceButton, 'click', () => setRepresentation('surface'));listen(atlasButton, 'click', () => setRepresentation('atlas'));
  listen(root, 'pointerdown', event => event.stopPropagation());listen(root, 'wheel', event => event.stopPropagation());
  listen(root, 'keydown', event => {
    if (event.key === ' ' || event.key === 'Enter') event.stopPropagation();
    if (event.target === anatomyTab || event.target === trainingTab) if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();setTab(tab === 'anatomy' ? 'training' : 'anatomy');(tab === 'anatomy' ? anatomyTab : trainingTab).focus?.({ preventScroll: true });
    }
  });
  listen(document, 'keydown', event => {
    if (!active || event.key !== 'Escape') return;
    event.preventDefault();
    if (overlay && !overlayOwnsInspector) closeOverlay();else close();
  });
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;observer?.observe(viewport);observer?.observe(container);
  function dispose() {
    if (disposed) return;close();disposed = true;observer?.disconnect();
    document.removeEventListener('pointerdown', rememberOrigin, true);clearTimeout(closingTimer);floor.geometry.dispose();floorMaterial.dispose();for (const remove of listeners) remove();controls?.removeEventListener('change', requestRender);controls?.dispose();clearCopies();bodyContext.dispose();atlasContext.dispose();
    leaderGeometry.dispose();leaderMaterial.dispose();environmentTarget?.dispose();environmentTarget = null;scene.environment = null;
    renderer?.dispose();renderer?.domElement.remove();renderer = null;controls = null;root.remove();scene.clear();profile = null;groups = [];currentGroup = null;
  }
  return { open, close, dispose,
    get active() { return active; },
    get state() { return { active, disposed, slotId: slot?.id ?? null, sourceStepNumber: profile?.sourceStepNumber ?? null, tab,
      groupId: currentGroup?.id ?? null, meshCount: copies.length, partIds: copies.map(mesh => mesh.userData.part.id),
      parts: copies.map(mesh => ({ id: mesh.userData.part.id, name: mesh.userData.part.name, side: mesh.userData.part.side })),
      selectedPartId, rendererReady: Boolean(renderer), renderCount, referencePose: true, geometryOwnership: 'borrowed', bodyContext: bodyContext.state, atlasContext: atlasContext.state,
      representation, visibleAtlasMeshes: copies.filter(mesh => mesh.visible).length, trainingMode: 'text',
      fullscreen: Boolean(overlay), fullscreenReplacesPopup: overlayOwnsInspector,
      viewMode, viewDirection, locatorRenderer: 'shared-scissor', fullBodyBounds: fullBodyBounds ? [fullBodyBounds.min.toArray(), fullBodyBounds.max.toArray()] : null,
      localBounds: localBounds ? [localBounds.min.toArray(), localBounds.max.toArray()] : null }; } };
}
