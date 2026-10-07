import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';

const finitePoint = value => (Array.isArray(value) || ArrayBuffer.isView(value)) && value.length === 3 && Array.from(value).every(Number.isFinite);
const SUPPORT_GROUPS = new Set(['shoulders', 'scapular', 'arms', 'chest']);
const LEG_GROUPS = new Set(['hipFlexors', 'glutes', 'adductors', 'quadriceps']);
const SLOT_DEFINITIONS = [
  { id: 'shoulder-arm-support', title: '肩臂支撑', group: 'shoulders', groups: SUPPORT_GROUPS, colour: '#72d6ff', number: '01', icon: 'arrow-up-right' },
  { id: 'core-coordination', title: '核心协调', group: 'core', groups: new Set(['core']), colour: '#b49bfa', number: '02', icon: 'activity' },
  { id: 'hip-leg-swing', title: '髋腿摆动', group: 'hipFlexors', groups: LEG_GROUPS, colour: '#d8ef70', number: '03', icon: 'move-up-right' },
];
const clamp = THREE.MathUtils.clamp;
const COMPACT_WIDTH = 192, COMPACT_HEIGHT = 66, EXPANDED_WIDTH = 256, EXPANDED_HEADER = 66;
const MIN_SCREEN_SCALE = .95, MAX_SCREEN_SCALE = 1.04, DETAIL_HEIGHT = 264;
let instanceCount = 0;

function element(document, tag, className, text) {
  const node = document.createElement(tag);node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function writeText(node, text) { if (node.textContent !== text) node.textContent = text; }
function intersects(a, b) { return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
function compactPrompt(slot, annotation, supportHands) {
  const hands = Array.isArray(supportHands) ? supportHands.filter(hand => hand === 'left' || hand === 'right') : [];
  if (slot === 0) return {
    badge: hands.length === 2 ? '双手支撑' : hands.length === 1 ? `${hands[0] === 'left' ? '左' : '右'}手支撑` : '换手过渡',
    brief: hands.length === 2 ? '双手推地' : hands.length === 1 ? `${hands[0] === 'left' ? '左' : '右'}手推地` : '接续支撑',
  };
  const number = Number(annotation?.sourceStepNumber);
  const hipTask = number === 9 ? '抬腿过前方' : number === 13 ? '开腿扫后方'
    : number === 11 || number === 15 ? '高低腿绕行' : number === 12 || number === 16 ? '扫弧接下一撑' : '开腿腾空间';
  const brief = slot === 1 ? number === 9 || number === 13 ? '稳住肩髋' : '肩髋配合' : hipTask;
  return { badge: slot === 1 ? '躯干控制' : '摆腿路径', brief };
}
function defaultObservations(slot, annotation) {
  if (slot === 0) return ['看承重侧肩肘的受控支撑', '看另一只手如何接续撑地'];
  if (slot === 1) return ['看肩与髋的相对朝向', '看移重与换手的衔接'];
  const number = Number(annotation?.sourceStepNumber);
  const route = number === 9 ? '看长腿从身体前方通过' : number === 13 ? '看开腿从身体后方扫过' : '看高低腿沿弧线交替绕行';
  return [route, '看膝部伸展与双腿开度'];
}

/** Inspect one highlighted body region in the existing animation.
 * The caller renders WebGL after update(), so its leaders and the CSS3D cards
 * use the same scene, camera and view offset. No model or animation is edited.
 */
export function createMovementCards({ scene, model, camera, container, onHover, onInspect, onTogglePlay, onTrain, onLoopSegment, refreshIcons }) {
  if (!scene?.isObject3D || !model?.isObject3D || !camera?.isCamera || !container?.appendChild) {
    throw new TypeError('空间动作卡需要当前场景、人物、镜头和画布容器。');
  }
  const document = container.ownerDocument ?? globalThis.document;
  const instanceId = `movement-world-${++instanceCount}`;
  const renderer = new CSS3DRenderer();renderer.domElement.className = 'movement-cards-layer';
  renderer.domElement.setAttribute('aria-label', '随动作展开的肌群说明');
  // CSS3D has a large transformed layout box. Hidden overflow is scrollable
  // on focus and would shift every anchor when a button receives focus.
  Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', overflow: 'clip', pointerEvents: 'none', zIndex: '5', display: 'none' });
  container.appendChild(renderer.domElement);
  const root = new THREE.Group();root.name = 'movement-world-cards';root.matrixAutoUpdate = false;root.visible = false;scene.add(root);
  const inverseScene = new THREE.Matrix4(), cameraQuaternion = new THREE.Quaternion(), targetQuaternion = new THREE.Quaternion();
  const cameraRight = new THREE.Vector3(), cameraUp = new THREE.Vector3(), bodyRight = new THREE.Vector3(), bodyUp = new THREE.Vector3();
  const bodyFront = new THREE.Vector3(), actorCentre = new THREE.Vector3(), point = new THREE.Vector3(), second = new THREE.Vector3();
  const actorScale = new THREE.Vector3();
  const projected = new THREE.Vector3(), cameraPoint = new THREE.Vector3(), unprojected = new THREE.Vector3();
  const edgeRight = new THREE.Vector3(), edgeUp = new THREE.Vector3(), edgePoint = new THREE.Vector3(), bendPoint = new THREE.Vector3();
  const lineMaterials = [], lineGeometry = [], listeners = [];
  const drawers = [...document.querySelectorAll('#library-drawer, #details-drawer')];
  const transport = document.querySelectorAll('#motion-toolbar')[0] ?? null;
  const canvas = document.querySelectorAll('#scene')[0] ?? null;
  const originalCanvasCursor = canvas?.style?.cursor ?? '';
  let pointerDown = null;
  let stageHead = null;
  let profile = null, enabled = false, disposed = false, lastMetrics = null, lastTime = null, playing = null;
  let inspectingSlot = null;
  let width = 1, height = 1, dirty = true, settling = false, scaleReady = false, worldScale = .0025;
  let hasRendererSize = false;
  let updating = false, settingAnnotations = false;
  let lastStamp = 0, activeGroup = null, interactionOrder = 0, iconsReady = false, obstructed = false;
  const safeArea = { left: 14, right: 1, top: 112, bottom: 1 };
  const exclusion = { left: 0, right: 0, top: 0, bottom: 0, valid: false };
  const bodyObstacles = [];
  const observedSizes = new Map();
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
    for (const entry of entries) {
      const next = `${Math.round(entry.contentRect.width)}:${Math.round(entry.contentRect.height)}`;
      if (observedSizes.get(entry.target) !== next) { observedSizes.set(entry.target, next);dirty = true; }
    }
  }) : null;
  // On narrow screens drawers do not change camera insets or element sizes.
  // Their visibility still changes the safe area while playback is paused.
  const drawerObserver = typeof MutationObserver === 'function' ? new MutationObserver(() => { dirty = true; }) : null;
  for (const drawer of drawers) drawerObserver?.observe(drawer, { attributes: true, attributeFilter: ['hidden'] });

  function listen(node, name, handler, options) { node.addEventListener(name, handler, options);listeners.push(() => node.removeEventListener(name, handler, options)); }
  function cardExpanded(card) { return card.hovered || card.focused || card.touchOpen || card.pinHovered || card.pinFocused || card.regionHovered; }
  function cancelClose(card) { if (card.leaveTimer !== null) clearTimeout(card.leaveTimer);card.leaveTimer = null; }
  function scheduleClose(card) {
    cancelClose(card);
    // The body and the floating explanation form one interaction area. Give
    // the pointer enough time to cross the gap and enter the explanation.
    card.leaveTimer = setTimeout(() => {
      card.leaveTimer = null;card.hovered = false;card.pinHovered = false;card.regionHovered = false;setExpanded(card);
    }, 550);
  }
  function activateCard(card, reason) {
    if (inspectingSlot) return;
    const reading = cards.find(other => other.touchOpen || other.focused || other.pinFocused);
    if ((reason === 'regionHovered' || reason === 'pinHovered') && reading && reading !== card) return;
    for (const other of cards) if (other !== card) closeCard(other);
    cancelClose(card);card[reason] = true;card.order = ++interactionOrder;setExpanded(card);
  }
  function reconcileHover() {
    const active = cards.filter(card => card.available && cardExpanded(card)).sort((a, b) => b.order - a.order)[0];
    const next = enabled && !obstructed ? active?.record?.group ?? null : null;
    if (next !== activeGroup) { activeGroup = next;onHover?.(next); }
  }
  function setExpanded(card) {
    const next = cardExpanded(card);
    if (next !== card.expanded) {
      card.expanded = next;card.details.hidden = !next;
      card.expansionPending = next;
      card.object.element.dataset.expanded = String(next);card.toggle.setAttribute('aria-expanded', String(next));
      card.cssWidth = next ? EXPANDED_WIDTH : COMPACT_WIDTH;card.object.element.style.width = `${card.cssWidth}px`;
      if (next && card.initialized) card.heldPosition.copy(card.object.position);
      if (!next) { card.initialized = false;card.pointerScreen = null;showCard(card, false); }
      dirty = true;
      // Finish the CSS3D placement before focus/hover returns. Otherwise the
      // next RAF could move a measured training button onto the loop button.
      if (next && enabled && lastMetrics && !updating && !settingAnnotations) update(lastTime, lastMetrics);
    }
    reconcileHover();
  }
  function closeCard(card) {
    cancelClose(card);card.hovered = false;card.focused = false;card.touchOpen = false;
    card.pinHovered = false;card.pinFocused = false;card.regionHovered = false;setExpanded(card);
  }

  const cards = SLOT_DEFINITIONS.map((definition, slot) => {
    const outer = element(document, 'section', 'movement-world-card');outer.dataset.slot = definition.id;
    outer.style.setProperty?.('--mwc-accent', definition.colour);
    const surface = element(document, 'div', 'mwc-surface');outer.appendChild(surface);
    const toggle = element(document, 'button', 'mwc-summary');toggle.type = 'button';toggle.setAttribute('aria-expanded', 'false');
    const icon = element(document, 'span', 'mwc-region-pin', definition.number);icon.setAttribute('aria-hidden', 'true');
    const heading = element(document, 'span', 'mwc-heading');
    const title = element(document, 'strong', 'mwc-title', definition.title), badge = element(document, 'span', 'mwc-badge', '动作提示');
    const kicker = element(document, 'span', 'mwc-kicker'), number = element(document, 'span', 'mwc-number', definition.number);
    kicker.append(number, badge);heading.append(kicker, title);
    const chevron = element(document, 'span', 'mwc-chevron');chevron.setAttribute('aria-hidden', 'true');chevron.innerHTML = '<i data-lucide="chevron-down"></i>';
    toggle.append(icon, heading, chevron);surface.appendChild(toggle);
    const brief = element(document, 'p', 'mwc-brief');surface.appendChild(brief);
    const details = element(document, 'div', 'mwc-details');details.id = `${instanceId}-${slot}-details`;details.hidden = true;
    toggle.setAttribute('aria-controls', details.id);
    const actions = element(document, 'div', 'mwc-card-actions');details.appendChild(actions);
    const muscleCaption = element(document, 'p', 'mwc-caption', '相关肌群');actions.appendChild(muscleCaption);
    const relatedMuscles = element(document, 'p', 'mwc-related-muscles');relatedMuscles.setAttribute('aria-label', '相关肌群');actions.appendChild(relatedMuscles);
    const actionCaption = element(document, 'p', 'mwc-caption', '此刻的作用');details.appendChild(actionCaption);
    const action = element(document, 'p', 'mwc-action');details.appendChild(action);
    const compareCaption = element(document, 'p', 'mwc-caption mwc-compare-caption', '看这两点');details.appendChild(compareCaption);
    const compare = element(document, 'ol', 'mwc-compare');compare.hidden = true;
    const compareItems = Array.from({ length: 2 }, () => { const item = element(document, 'li', 'mwc-compare-item');compare.appendChild(item);return item; });
    details.appendChild(compare);
    const footer = element(document, 'div', 'mwc-footer');details.appendChild(footer);
    const exactDetails = element(document, 'details', 'mwc-exact-details'), exactSummary = element(document, 'summary', 'mwc-exact-summary', '肌群分工');
    exactDetails.appendChild(exactSummary);details.appendChild(exactDetails);
    const rows = Array.from({ length: 4 }, () => {
      const row = element(document, 'div', 'mwc-muscle-row'), name = element(document, 'strong', 'mwc-muscle-name'), role = element(document, 'span', 'mwc-muscle-role');
      row.append(name, role);exactDetails.appendChild(row);return { row, name, role };
    });
    const training = element(document, 'div', 'mwc-training');training.hidden = true;
    const trainingGoal = element(document, 'p', 'mwc-training-goal');training.appendChild(trainingGoal);
    const trainButton = element(document, 'button', 'mwc-train');trainButton.type = 'button';
    const trainIcon = element(document, 'span', 'mwc-action-icon');trainIcon.setAttribute('aria-hidden', 'true');trainIcon.innerHTML = '<i data-lucide="dumbbell"></i>';
    const trainCopy = element(document, 'span', 'mwc-train-copy'), trainPrompt = element(document, 'span', 'mwc-train-prompt', '看训练示范');
    const trainTitle = element(document, 'strong', 'mwc-train-title');trainCopy.append(trainPrompt, trainTitle);trainButton.append(trainIcon, trainCopy);training.appendChild(trainButton);details.appendChild(training);
    const playButton = element(document, 'button', 'mwc-play');playButton.type = 'button';playButton.setAttribute('aria-label', '暂停或继续动画');
    const playIcon = element(document, 'span', 'mwc-play-icon');playIcon.setAttribute('aria-hidden', 'true');playIcon.innerHTML = '<i data-lucide="play"></i>';
    const playText = element(document, 'span', 'mwc-play-label', '播放');playButton.append(playIcon, playText);
    const loopButton = element(document, 'button', 'mwc-loop');loopButton.type = 'button';loopButton.hidden = typeof onLoopSegment !== 'function';
    loopButton.setAttribute('aria-label', '反复看这一段');
    const loopIcon = element(document, 'span', 'mwc-action-icon');loopIcon.setAttribute('aria-hidden', 'true');loopIcon.innerHTML = '<i data-lucide="repeat-2"></i>';
    const loopLabel = element(document, 'span', 'mwc-loop-label', '反复看');loopButton.append(loopIcon, loopLabel);
    footer.append(playButton, loopButton);surface.appendChild(details);
    const object = new CSS3DObject(outer);object.name = `movement-card:${definition.id}`;object.visible = false;
    object.userData.movementCard = true;root.add(object);
    const leaders = Array.from({ length: slot === 1 ? 1 : 2 }, (_, index) => {
      const geometry = new THREE.BufferGeometry();geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));lineGeometry.push(geometry);
      const material = new THREE.LineBasicMaterial({ color: definition.colour, transparent: true, opacity: .4, depthTest: true, depthWrite: false, toneMapped: false });lineMaterials.push(material);
      const line = new THREE.Line(geometry, material);line.name = `movement-card-leader:${definition.id}:${index}`;line.frustumCulled = false;line.raycast = () => {};root.add(line);
      return { line, anchor: new THREE.Vector3(), available: false };
    });
    // Matching numbers establish the association without asking viewers to
    // follow several crossing wires. Only the current card gets one leader.
    const pinElement = element(document, 'button', 'movement-body-pin', definition.number);pinElement.type = 'button';
    pinElement.style.setProperty?.('--mwc-accent', definition.colour);
    pinElement.setAttribute('aria-label', `查看${definition.title}发力介绍`);pinElement.setAttribute('aria-expanded', 'false');
    pinElement.setAttribute('aria-controls', details.id);
    const pin = new CSS3DObject(pinElement);pinElement.style.pointerEvents = 'auto';
    pin.name = `movement-body-pin:${definition.id}`;pin.visible = false;root.add(pin);
    const card = { ...definition, slot, object, toggle, title, badge, brief, details, action, rows, playButton, playText, playIcon, leaders,
      pin, primaryLeader: null,
      actions, relatedMuscles, actionCaption, compareCaption, exactDetails, training, trainingGoal, compare, compareItems, trainButton, trainTitle, loopButton,
      anchor: new THREE.Vector3(), target: new THREE.Vector3(), heldPosition: new THREE.Vector3(), tilt: new THREE.Quaternion().setFromEuler(new THREE.Euler(-.02, slot === 1 ? -.03 : .03, 0)),
      record: null, available: false, initialized: false, hovered: false, focused: false, touchOpen: false, pinHovered: false, pinFocused: false, regionHovered: false, expanded: false, expansionPending: false, lastPointerType: 'mouse', leaveTimer: null, order: 0,
      cssWidth: COMPACT_WIDTH, cssDetailHeight: DETAIL_HEIGHT, pixelWidth: COMPACT_WIDTH, pixelHeight: COMPACT_HEIGHT, compact: false, pointerScreen: null, relaxed: false, edgeOverlay: false,
      primaryHeights: new Map(),
      rectangle: { left: 0, right: 0, top: 0, bottom: 0 }, layoutPocket: null };
    listen(outer, 'pointerenter', event => {
      if (event.pointerType === 'touch' || !enabled) return;
      cancelClose(card);
      if (Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
        const viewport = container.getBoundingClientRect();card.pointerScreen = { x: event.clientX - viewport.left, y: event.clientY - viewport.top };
      }
      activateCard(card, 'hovered');
    });
    listen(outer, 'pointermove', event => {
      if (event.pointerType === 'touch' || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
      const viewport = container.getBoundingClientRect();card.pointerScreen = { x: event.clientX - viewport.left, y: event.clientY - viewport.top };
    });
    listen(outer, 'pointerleave', event => {
      if (event.pointerType === 'touch') return;
      card.hovered = false;scheduleClose(card);
    });
    listen(outer, 'focusin', () => { if (enabled) activateCard(card, 'focused'); });
    listen(outer, 'focusout', event => { if (!outer.contains(event.relatedTarget)) { card.focused = false;scheduleClose(card); } });
    listen(outer, 'pointerdown', event => { card.lastPointerType = event.pointerType ?? 'mouse';event.stopPropagation(); });
    listen(outer, 'wheel', event => event.stopPropagation());
    listen(outer, 'keydown', event => {
      if ([' ', 'Enter', 'Escape'].includes(event.key)) event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault();closeCard(card);if (outer.contains(document.activeElement)) document.activeElement?.blur?.(); }
    });
    listen(toggle, 'click', event => {
      event.stopPropagation();if (!enabled) return;
      closeCard(card);if (outer.contains(document.activeElement)) document.activeElement?.blur?.();
    });
    listen(pinElement, 'pointerenter', event => { if (enabled && event.pointerType !== 'touch') activateCard(card, 'pinHovered'); });
    listen(pinElement, 'pointerleave', event => { if (event.pointerType !== 'touch') { card.pinHovered = false;scheduleClose(card); } });
    listen(pinElement, 'pointerdown', event => {
      event.stopPropagation();
      if (event.button !== 0) return;
      card.pinPointerDown = { x: event.clientX, y: event.clientY };card.pinClickMoved = false;
      // A live body anchor can move between press and release. Keep that
      // press on the same hotspot without capturing the main scene canvas.
      pinElement.setPointerCapture?.(event.pointerId);
    });
    listen(pinElement, 'pointerup', event => {
      if (card.pinPointerDown) card.pinClickMoved = Math.hypot(event.clientX - card.pinPointerDown.x, event.clientY - card.pinPointerDown.y) >= 6;
      card.pinPointerDown = null;
    });
    listen(pinElement, 'pointercancel', () => { card.pinPointerDown = null;card.pinClickMoved = true; });
    listen(pinElement, 'focusin', () => { if (enabled) activateCard(card, 'pinFocused'); });
    listen(pinElement, 'focusout', () => { card.pinFocused = false;scheduleClose(card); });
    listen(pinElement, 'click', event => {
      event.stopPropagation();if (!enabled || (event.detail !== 0 && card.pinClickMoved)) return;
      if (typeof onInspect === 'function') { closeCard(card);onInspect(card.id);return; }
      if (card.touchOpen) { closeCard(card);pinElement.blur?.(); }
      else activateCard(card, 'touchOpen');
    });
    listen(pinElement, 'keydown', event => {
      if ([' ', 'Enter', 'Escape'].includes(event.key)) event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault();closeCard(card);pinElement.blur?.(); }
    });
    listen(playButton, 'click', event => { event.stopPropagation();if (enabled) onTogglePlay?.(); });
    listen(trainButton, 'click', event => { event.stopPropagation();if (enabled && card.record?.training) onTrain?.(card.id); });
    listen(loopButton, 'click', event => { event.stopPropagation();if (enabled) onLoopSegment?.(); });
    listen(exactDetails, 'toggle', () => { dirty = true; });
    observer?.observe(outer);
    return card;
  });
  listen(document, 'pointerdown', event => {
    if (cards.some(card => card.object.element.contains(event.target) || card.pin.element.contains(event.target))) return;
    for (const card of cards) closeCard(card);
  }, true);
  // These invisible hit regions follow the original projected joints. They
  // are interaction guides, not replacement geometry or measured anatomy.
  function bodyRegionAt(clientX, clientY) {
    if (!enabled || obstructed || !model.visible || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
    const viewport = container.getBoundingClientRect(), x = clientX - viewport.left, y = clientY - viewport.top;
    const scale = Math.max(Math.abs(actorScale.x), Math.abs(actorScale.y), Math.abs(actorScale.z));
    let best = null, bestScore = Infinity;
    const capsule = (slot, from, to, radius, start = 0, end = 1) => {
      if (!cards[slot].available || !joint(from, point) || !joint(to, second)) return;
      const a = point.clone().lerp(second, start), b = point.clone().lerp(second, end);
      const pixels = Math.max(7, radius * scale * worldPixelsAt(a.clone().lerp(b, .5)) + 3);
      a.project(camera);b.project(camera);if (a.z < -1 || a.z > 1 || b.z < -1 || b.z > 1) return;
      const ax = (a.x + 1) * width / 2, ay = (1 - a.y) * height / 2, bx = (b.x + 1) * width / 2, by = (1 - b.y) * height / 2;
      const dx = bx - ax, dy = by - ay;
      const t = clamp(((x - ax) * dx + (y - ay) * dy) / Math.max(1, dx * dx + dy * dy), 0, 1);
      const score = Math.hypot(x - ax - dx * t, y - ay - dy * t) / pixels;
      if (score <= 1 && score < bestScore) { best = cards[slot];bestScore = score; }
    };
    capsule(1, 'waist', 'shoulderCenter', .13, .05, .8);
    const hands = lastMetrics?.supportHands?.length ? lastMetrics.supportHands : ['left', 'right'];
    for (const side of hands) {
      capsule(0, side + 'Shoulder', side + 'Elbow', .065);
      capsule(0, side + 'Elbow', side + 'Wrist', .05);
    }
    for (const side of ['left', 'right']) capsule(2, side + 'Hip', side + 'Knee', .08, .5, 1);
    return best;
  }
  function leaveBodyRegions() {
    for (const card of cards) if (card.regionHovered) { card.regionHovered = false;scheduleClose(card); }
    if (canvas?.style) canvas.style.cursor = originalCanvasCursor;
  }
  if (canvas) {
    listen(canvas, 'pointermove', event => {
      if (event.pointerType === 'touch' || event.buttons || !enabled) { leaveBodyRegions();return; }
      const card = bodyRegionAt(event.clientX, event.clientY);
      if (!card) { leaveBodyRegions();return; }
      canvas.style.cursor = 'pointer';
      if (!card.regionHovered) activateCard(card, 'regionHovered');
    });
    listen(canvas, 'pointerleave', leaveBodyRegions);
    listen(canvas, 'pointerdown', event => { pointerDown = enabled ? { x: event.clientX, y: event.clientY } : null; });
    listen(canvas, 'pointerup', event => {
      if (pointerDown && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) < 6) {
        const card = bodyRegionAt(event.clientX, event.clientY);
        if (card) {
          if (typeof onInspect === 'function') { closeCard(card);onInspect(card.id); }
          else activateCard(card, 'touchOpen');
        }
      }
      pointerDown = null;
    });
    listen(canvas, 'pointercancel', () => { pointerDown = null; });
  }
  listen(document, 'keydown', event => {
    if (enabled && event.key === 'Escape') {
      for (const card of cards) closeCard(card);
      if (cards.some(card => card.pin.element === document.activeElement)) document.activeElement?.blur?.();
    }
  });

  function dataForSlots() {
    if (!profile || profile.enabled === false) return [];
    const audience = Array.isArray(profile.audienceLabels) ? profile.audienceLabels : [];
    const labels = Array.isArray(profile.labels) ? profile.labels : [];
    return SLOT_DEFINITIONS.map((slot, index) => {
      const item = audience.find(label => label.id === slot.id) ?? audience[index];
      const entries = labels.filter(label => slot.groups.has(label.group)).slice(0, 4);
      if (!item && !entries.length) return null;
      const candidate = profile.trainingBySlot?.[slot.id];
      const training = candidate && typeof candidate === 'object' && (typeof candidate.title === 'string' && candidate.title.trim() || candidate.id || candidate.animationId)
        ? { title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title.trim() : '训练示范',
          goal: typeof candidate.goal === 'string' ? candidate.goal : '', compare: Array.isArray(candidate.compare) ? candidate.compare.filter(value => typeof value === 'string' && value.trim()).slice(0, 2) : [] }
        : null;
      const observed = profile.observationsBySlot?.[slot.id] ?? candidate?.compare;
      const observations = Array.isArray(observed) ? observed.filter(value => typeof value === 'string' && value.trim()).slice(0, 2) : [];
      return { id: slot.id, group: item?.group ?? entries[0]?.group ?? slot.group,
        title: String(item?.label ?? slot.title), role: String(item?.role ?? entries[0]?.role ?? ''),
        muscles: String(item?.muscles ?? ''), anchors: [...(item?.anchors ?? entries[0]?.anchors ?? [])], training,
        observations: observations.length ? observations : defaultObservations(index, profile),
        entries: entries.map(entry => ({ muscles: String(entry.muscles ?? entry.label ?? ''), role: String(entry.role ?? '') })) };
    });
  }
  function setAnnotations(value) {
    if (disposed) return;
    settingAnnotations = true;
    try {
    profile = value == null ? null : structuredClone(value);
    const records = dataForSlots();
    for (const card of cards) {
      card.record = records[card.slot] ?? null;
      if (!card.record) { closeCard(card);card.available = false;showCard(card, false);continue; }
      const record = card.record;
      card.primaryHeights.clear();
      writeText(card.title, record.title);card.object.element.setAttribute('aria-label', `${record.title} · 悬浮或点按展开`);
      const prompt = compactPrompt(card.slot, profile, profile.supportHands ?? lastMetrics?.supportHands);
      writeText(card.brief, prompt.brief);writeText(card.badge, prompt.badge);
      writeText(card.action, String(profile.cue?.[card.slot === 0 ? 'support' : card.slot === 1 ? 'body' : 'legs'] ?? record.role));
      const entries = record.entries.length ? record.entries : [{ muscles: record.muscles, role: record.role }];
      const muscleNames = [...new Set(entries.map(entry => entry.muscles.trim()).filter(Boolean))].join(' · ');
      writeText(card.relatedMuscles, muscleNames);card.relatedMuscles.hidden = !muscleNames;
      for (const [index, row] of card.rows.entries()) {
        const entry = entries[index];row.row.hidden = !entry;
        if (entry) { writeText(row.name, entry.muscles);writeText(row.role, entry.role); }
      }
      // Training assets/data remain available to their existing controller,
      // but this presentation concentrates on understanding the saved move.
      card.training.hidden = true;card.trainButton.hidden = true;
      card.trainButton.disabled = typeof onTrain !== 'function';
      if (record.training) {
        writeText(card.trainTitle, record.training.title);writeText(card.trainingGoal, record.training.goal);card.trainingGoal.hidden = !record.training.goal;
        card.trainTitle.setAttribute('title', record.training.title);card.trainButton.setAttribute('aria-label', `看训练示范：${record.training.title}`);
      } else {
        writeText(card.trainTitle, '');writeText(card.trainingGoal, '');
        card.trainTitle.setAttribute('title', '');card.trainButton.setAttribute('aria-label', '看训练示范');
      }
      card.compare.hidden = !record.observations.length;card.compareCaption.hidden = !record.observations.length;
      for (const [index, item] of card.compareItems.entries()) { item.hidden = !record.observations[index];writeText(item, record.observations[index] ?? ''); }
    }
    } finally { settingAnnotations = false; }
    dirty = true;reconcileHover();
  }
  function setEnabled(value) {
    if (disposed) return;
    const next = Boolean(value);if (next === enabled) return;
    enabled = next;root.visible = next;renderer.domElement.style.display = next ? '' : 'none';
    for (const card of cards) {
      card.toggle.disabled = !next;card.playButton.disabled = !next;
      if (!next) { closeCard(card);card.available = false;card.initialized = false;showCard(card, false); }
    }
    if (!next && canvas?.style) { canvas.style.cursor = originalCanvasCursor;pointerDown = null; }
    if (next) scaleReady = false;
    dirty = true;reconcileHover();
  }
  function setPlaying(value) {
    if (disposed || typeof value !== 'boolean' || value === playing) return;
    playing = value;
    for (const card of cards) {
      writeText(card.playText, playing ? '暂停' : '继续');
      card.playButton.setAttribute('aria-label', playing ? '暂停动画，仔细查看这张卡' : '继续播放动画');
      card.playButton.dataset.playing = String(playing);
      // The button keeps a stable DOM node during profile/transport changes.
      card.playIcon.innerHTML = `<i data-lucide="${playing ? 'pause' : 'play'}"></i>`;
    }
    refreshIcons?.();
    dirty = true;
  }
  function joint(name, destination) {
    const values = lastMetrics?.joints?.[name];
    if (!finitePoint(values)) return false;
    destination.fromArray(values).applyMatrix4(model.matrixWorld);return true;
  }
  function averageAnchors(names, destination) {
    destination.set(0, 0, 0);let count = 0;
    for (const name of names) if (joint(name, point)) { destination.add(point);count++; }
    if (count) destination.multiplyScalar(1 / count);
    return count > 0;
  }
  function updateRegionAnchors(card, hands) {
    for (const leader of card.leaders) leader.available = false;
    if (card.slot === 1) card.leaders[0].available = joint('waist', card.leaders[0].anchor);
    else {
      const sides = card.slot === 0 && hands.length ? hands : ['left', 'right'];
      for (const [index, side] of sides.entries()) {
        const from = card.slot === 0 ? `${side}Shoulder` : `${side}Hip`, to = card.slot === 0 ? `${side}Elbow` : `${side}Knee`;
        const leader = card.leaders[index];
        leader.available = joint(from, leader.anchor) && joint(to, point);
        if (leader.available) leader.anchor.lerp(point, card.slot === 0 ? .5 : .7);
      }
    }
  }
  function showCard(card, visible) {
    card.object.visible = visible;
    if (!card.available) card.pin.visible = false;
    card.pin.element.setAttribute('aria-expanded', String(visible));
    for (const leader of card.leaders) leader.line.visible = false;
  }
  function measureSafeArea() {
    safeArea.left = 14;safeArea.right = width - 14;safeArea.top = 112;safeArea.bottom = height - 100;
    const viewport = container.getBoundingClientRect();
    if (!stageHead) {
      stageHead = document.querySelectorAll('.movement-stage-head')[0] ?? null;
      if (stageHead) { observer?.observe(stageHead);drawerObserver?.observe(stageHead, { attributes: true, attributeFilter: ['hidden'] }); }
    }
    if (stageHead && !stageHead.hidden) {
      const rect = stageHead.getBoundingClientRect();
      if (rect.width && rect.height) safeArea.top = Math.max(safeArea.top, rect.bottom - viewport.top + 12);
    }
    if (transport && !transport.hidden) {
      const rect = transport.getBoundingClientRect();
      if (rect.width && rect.height && rect.bottom > viewport.top && rect.top < viewport.bottom) {
        safeArea.bottom = Math.min(safeArea.bottom, rect.top - viewport.top - 12);
      }
    }
    for (const drawer of drawers) {
      if (drawer.hidden) continue;
      const rect = drawer.getBoundingClientRect();if (!rect.width || !rect.height) continue;
      const left = rect.left - viewport.left, right = rect.right - viewport.left;
      if (right <= 0 || left >= width) continue;
      if (left < width / 2) safeArea.left = Math.max(safeArea.left, right + 14);
      else safeArea.right = Math.min(safeArea.right, left - 14);
    }
    obstructed = safeArea.right - safeArea.left < 136 || safeArea.bottom - safeArea.top < 58;
  }
  function measureExclusion() {
    exclusion.left = Infinity;exclusion.right = -Infinity;exclusion.top = Infinity;exclusion.bottom = -Infinity;exclusion.valid = false;
    const addPoint = value => {
      projected.copy(value).project(camera);if (projected.z < -1 || projected.z > 1) return;
      const x = (projected.x + 1) * width / 2, y = (1 - projected.y) * height / 2;
      exclusion.left = Math.min(exclusion.left, x);exclusion.right = Math.max(exclusion.right, x);
      exclusion.top = Math.min(exclusion.top, y);exclusion.bottom = Math.max(exclusion.bottom, y);exclusion.valid = true;
    };
    // Protect the whole visible athlete, including the head, hands and feet.
    // The former torso-only box allowed cards to sit on the head and upper arm.
    for (const name of ['pelvis', 'waist', 'shoulderCenter', 'neck', 'head',
      ...['left', 'right'].flatMap(side => ['Shoulder', 'Elbow', 'Wrist', 'Palm', 'Hip', 'Knee', 'Ankle', 'Toe'].map(suffix => side + suffix))]) {
      if (joint(name, point)) addPoint(point);
    }
    // Projected corners of the 3D whole-body AABB include empty space around
    // diagonal limbs. Use the real joint contour and limb capsules instead.
    if (exclusion.valid) { exclusion.left -= 20;exclusion.right += 20;exclusion.top -= 24;exclusion.bottom += 22; }
    // The full box is preferred. If a diagonal limb spans most of the screen,
    // use protected projected limb capsules to retain free corners instead.
    // These are layout maths only: no substitute anatomy is drawn.
    bodyObstacles.length = 0;model.getWorldScale(actorScale);
    const scale = Math.max(Math.abs(actorScale.x), Math.abs(actorScale.y), Math.abs(actorScale.z));
    const protect = (from, to, radius) => {
      if (!joint(from, point) || !joint(to, second)) return;
      cameraPoint.copy(point).applyMatrix4(camera.matrixWorldInverse);const firstDepth = -cameraPoint.z;
      cameraPoint.copy(second).applyMatrix4(camera.matrixWorldInverse);const secondDepth = -cameraPoint.z;
      if (firstDepth <= 0 || secondDepth <= 0) return;
      projected.copy(point).project(camera);
      const x1 = (projected.x + 1) * width / 2, y1 = (1 - projected.y) * height / 2;
      projected.copy(second).project(camera);
      const x2 = (projected.x + 1) * width / 2, y2 = (1 - projected.y) * height / 2;
      const pixels = radius * scale * camera.projectionMatrix.elements[5] * height / 2 / Math.max(.1, Math.min(firstDepth, secondDepth)) + 8;
      bodyObstacles.push({ x1, y1, x2, y2, radius: pixels,
        left: Math.min(x1, x2) - pixels, right: Math.max(x1, x2) + pixels, top: Math.min(y1, y2) - pixels, bottom: Math.max(y1, y2) + pixels });
    };
    protect('neck', 'head', .15);protect('pelvis', 'shoulderCenter', .17);protect('leftShoulder', 'rightShoulder', .075);
    protect('leftHip', 'rightHip', .12);
    for (const side of ['left', 'right']) {
      protect(side + 'Shoulder', side + 'Elbow', .065);protect(side + 'Elbow', side + 'Palm', .055);
      protect(side + 'Hip', side + 'Knee', .095);protect(side + 'Knee', side + 'Ankle', .075);protect(side + 'Ankle', side + 'Toe', .085);
    }
  }
  function worldPixelsAt(target) {
    cameraPoint.copy(target).applyMatrix4(camera.matrixWorldInverse);
    return camera.projectionMatrix.elements[5] * height / 2 / Math.max(.1, -cameraPoint.z);
  }
  function pixelsPerUnitAt(target) {
    return clamp(worldScale * worldPixelsAt(target), MIN_SCREEN_SCALE, MAX_SCREEN_SCALE);
  }
  function screenRectangle(card, target, pixelWidth = card.pixelWidth, pixelHeight = card.pixelHeight) {
    projected.copy(target).project(camera);
    const factor = pixelsPerUnitAt(target);
    const halfWidth = pixelWidth * factor / 2 + 3, halfHeight = pixelHeight * factor / 2 + 3;
    const x = (projected.x + 1) * width / 2, y = (1 - projected.y) * height / 2;
    return { x, y, halfWidth, halfHeight, z: projected.z,
      left: x - halfWidth, right: x + halfWidth, top: y - halfHeight, bottom: y + halfHeight };
  }
  function freePockets() {
    if (!exclusion.valid || !intersects(exclusion, safeArea)) return [{ id: 'clear', ...safeArea }];
    return [
      { id: 'left', left: safeArea.left, right: Math.min(safeArea.right, exclusion.left - 12), top: safeArea.top, bottom: safeArea.bottom },
      { id: 'right', left: Math.max(safeArea.left, exclusion.right + 12), right: safeArea.right, top: safeArea.top, bottom: safeArea.bottom },
      { id: 'above', left: safeArea.left, right: safeArea.right, top: safeArea.top, bottom: Math.min(safeArea.bottom, exclusion.top - 12) },
      { id: 'below', left: safeArea.left, right: safeArea.right, top: Math.max(safeArea.top, exclusion.bottom + 12), bottom: safeArea.bottom },
      { id: 'contour', ...safeArea, relaxed: true },
      // Extreme zoom can leave no empty silhouette space. Only then retain
      // small interactive labels at the viewport edges, leaving its centre.
      { id: 'edge', ...safeArea, edgeOverlay: true },
    ].filter(pocket => pocket.right - pocket.left > 30 && pocket.bottom - pocket.top > 28);
  }
  function overlapsBody(rectangle, obstacle) {
    if (!intersects(rectangle, obstacle)) return false;
    let low = 0, high = 1;
    for (const [start, end, min, max] of [[obstacle.x1, obstacle.x2, rectangle.left - obstacle.radius, rectangle.right + obstacle.radius],
      [obstacle.y1, obstacle.y2, rectangle.top - obstacle.radius, rectangle.bottom + obstacle.radius]]) {
      const delta = end - start;
      if (Math.abs(delta) < 1e-7) { if (start < min || start > max) return false; }
      else {
        const a = (min - start) / delta, b = (max - start) / delta;
        low = Math.max(low, Math.min(a, b));high = Math.min(high, Math.max(a, b));if (low > high) return false;
      }
    }
    return true;
  }
  function rectangleClear(rectangle, occupied, relaxed = false, edgeOverlay = false) {
    return rectangle.left >= safeArea.left && rectangle.right <= safeArea.right && rectangle.top >= safeArea.top && rectangle.bottom <= safeArea.bottom &&
      !(edgeOverlay ? false : relaxed ? bodyObstacles.some(obstacle => overlapsBody(rectangle, obstacle)) : exclusion.valid && intersects(rectangle, exclusion)) &&
      !occupied.some(value => intersects(rectangle, value));
  }
  function measurePrimaryHeight(card, cssWidth) {
    if (card.expanded) {
      const key = cssWidth.toFixed(1), cached = card.primaryHeights.get(key);
      if (cached !== undefined) return cached;
      const style = card.object.element.style, previousWidth = style.width;
      style.width = `${cssWidth}px`;
      const measured = card.actions.offsetHeight;
      style.width = previousWidth;
      if (measured) { card.primaryHeights.set(key, measured + 30);return measured + 30; }
    }
    // Hidden panels cannot be measured. Reserve the accurate names and a
    // visible line of the current role; observations remain first in reading.
    const textWidth = [...card.relatedMuscles.textContent].reduce((total, character) => total + (/[^\x00-\x7f]/.test(character) ? 11 : 6), 0);
    const namesHeight = textWidth ? Math.ceil(textWidth / Math.max(70, cssWidth - 26)) * 17 + 5 : 0;
    return namesHeight + 43;
  }
  function placeInSafeArea(card, occupied) {
    const screen = screenRectangle(card, card.target);
    if (screen.z < -1 || screen.z > 1) return false;
    const factor = pixelsPerUnitAt(card.target), contentHeight = card.details.scrollHeight ||
      160 + card.record.entries.length * 44;
    const held = card.expanded && card.initialized ? card.pointerScreen ?? screenRectangle(card, card.heldPosition) : null;
    const bodyTop = bodyObstacles.length ? Math.min(...bodyObstacles.map(value => value.top)) : safeArea.bottom;
    const mobileAboveHeight = width < 560 ? bodyTop - safeArea.top - 12 : 0;
    let best = null;
    for (const compact of card.expanded ? [false] : [false, true]) {
      for (const pocket of freePockets()) {
        if (pocket.edgeOverlay && !card.expanded && !compact) continue;
        const cssWidth = card.expanded ? Math.min(EXPANDED_WIDTH, (pocket.right - pocket.left - 14) / factor)
          : compact ? Math.min(150, (pocket.right - pocket.left - 14) / factor) : COMPACT_WIDTH;
        if (!card.expanded && cssWidth < 132) continue;
        if (card.expanded && cssWidth < 184) continue;
        const actionsHeight = measurePrimaryHeight(card, cssWidth);
        const mobileCap = mobileAboveHeight >= (EXPANDED_HEADER + actionsHeight) * factor + 8
          ? mobileAboveHeight / factor - EXPANDED_HEADER - 8 : DETAIL_HEIGHT;
        const detailHeight = card.expanded ? Math.min(pocket.edgeOverlay ? 172 : DETAIL_HEIGHT, mobileCap, contentHeight,
          (pocket.bottom - pocket.top - 14) / factor - EXPANDED_HEADER) : 0;
        if (card.expanded && detailHeight < actionsHeight) continue;
        const possibleExpandedWidth = Math.min(EXPANDED_WIDTH, (pocket.right - pocket.left - 14) / factor);
        const possibleActionsHeight = measurePrimaryHeight(card, possibleExpandedWidth);
        const expansionFits = possibleExpandedWidth >= 184 && pocket.bottom - pocket.top >= (EXPANDED_HEADER + possibleActionsHeight) * factor + 14;
        const cssHeight = card.expanded ? EXPANDED_HEADER + detailHeight : compact ? 44 : COMPACT_HEIGHT;
        const hw = cssWidth * factor / 2 + 4, hh = cssHeight * factor / 2 + 4;
        const minX = pocket.left + hw, maxX = pocket.right - hw, minY = pocket.top + hh, maxY = pocket.bottom - hh;
        if (minX > maxX || minY > maxY) continue;
        const desiredX = clamp(screen.x, minX, maxX), desiredY = clamp(screen.y, minY, maxY);
        const points = [
          ...(pocket.edgeOverlay ? [] : [{ x: desiredX, y: desiredY }]), { x: minX, y: minY }, { x: maxX, y: minY },
          { x: minX, y: maxY }, { x: maxX, y: maxY },
        ];
        for (const block of pocket.edgeOverlay ? [] : pocket.relaxed ? [...occupied, ...bodyObstacles] : occupied) {
          points.push({ x: desiredX, y: clamp(block.top - hh - 12, minY, maxY) },
            { x: desiredX, y: clamp(block.bottom + hh + 12, minY, maxY) },
            { x: clamp(block.left - hw - 12, minX, maxX), y: desiredY },
            { x: clamp(block.right + hw + 12, minX, maxX), y: desiredY });
        }
        for (const candidate of points) {
          const rectangle = { left: candidate.x - hw, right: candidate.x + hw, top: candidate.y - hh, bottom: candidate.y + hh };
          if (!rectangleClear(rectangle, occupied, pocket.relaxed, pocket.edgeOverlay)) continue;
          // A hover expansion keeps the old label centre inside its panel,
          // rather than jumping away from the pointer to another side.
          if (held && card.hovered && !card.focused && !card.touchOpen &&
              (held.x < rectangle.left || held.x > rectangle.right || held.y < rectangle.top || held.y > rectangle.bottom)) continue;
          const score = Math.hypot(candidate.x - screen.x, candidate.y - screen.y) +
            (pocket.id === card.layoutPocket ? 0 : 22) + (compact ? 180 : 0) + (!card.expanded && !expansionFits ? 240 : 0) + (pocket.relaxed ? 320 : 0) + (pocket.edgeOverlay ? 1600 : 0);
          if (!best || score < best.score) best = { ...candidate, rectangle, score, cssWidth, cssHeight, detailHeight, compact, pocket: pocket.id,
            relaxed: Boolean(pocket.relaxed), edgeOverlay: Boolean(pocket.edgeOverlay) };
        }
      }
      if (best) break;
    }
    if (!best) return false;
    card.cssWidth = best.cssWidth;card.cssDetailHeight = best.detailHeight;card.compact = best.compact;card.layoutPocket = best.pocket;card.relaxed = best.relaxed;card.edgeOverlay = best.edgeOverlay;
    const nextWidth = `${best.cssWidth.toFixed(1)}px`, detailCap = `${best.detailHeight.toFixed(1)}px`;
    if (card.object.element.style.width !== nextWidth) card.object.element.style.width = nextWidth;
    if (card.expanded && card.details.style.maxHeight !== detailCap) card.details.style.maxHeight = detailCap;
    card.object.element.dataset.tight = String(best.compact);
    card.object.element.dataset.edge = String(best.edgeOverlay);
    card.pixelWidth = card.object.element.offsetWidth || best.cssWidth;
    card.pixelHeight = card.object.element.offsetHeight || best.cssHeight;
    // Changing a card's layout still preserves its genuine perspective depth.
    unprojected.set(best.x / width * 2 - 1, 1 - best.y / height * 2, screen.z).unproject(camera);
    card.target.copy(unprojected);Object.assign(card.rectangle, best.rectangle);return true;
  }
  function updateLeaders(card, focusedCard) {
    const centre = screenRectangle(card, card.object.visible ? card.object.position : card.target);
    const distanceToCard = leader => {
      projected.copy(leader.anchor).project(camera);
      if (projected.z < -1 || projected.z > 1) return Infinity;
      return Math.hypot((projected.x + 1) * width / 2 - centre.x, (1 - projected.y) * height / 2 - centre.y);
    };
    const available = card.leaders.filter(leader => leader.available);
    const nearest = available.reduce((best, leader) => !best || distanceToCard(leader) < distanceToCard(best) ? leader : best, null);
    // Keep a bilateral anchor stable until the other side is clearly closer.
    // This prevents the numbered pin flickering as legs pass one another.
    const pinHeld = card.pinHovered || card.pinFocused || Boolean(card.pinPointerDown) || inspectingSlot === card.id;
    if (!card.primaryLeader?.available || !nearest || (!pinHeld && distanceToCard(nearest) + 28 < distanceToCard(card.primaryLeader))) card.primaryLeader = nearest;
    const primary = card.primaryLeader;
    card.pin.visible = Boolean(primary && card.available && enabled && distanceToCard(primary) < Infinity);
    const active = card === focusedCard && card.object.visible;
    card.pin.element.dataset.active = String(active || inspectingSlot === card.id);
    card.object.element.dataset.muted = String(Boolean(focusedCard) && !active);
    if (card.pin.visible) {
      card.pin.position.copy(primary.anchor);card.pin.quaternion.copy(cameraQuaternion);
      card.pin.scale.setScalar(1 / worldPixelsAt(primary.anchor));
    }
    edgeRight.set(1, 0, 0).applyQuaternion(card.object.quaternion);edgeUp.set(0, 1, 0).applyQuaternion(card.object.quaternion);
    const halfWidth = card.pixelWidth * card.object.scale.x / 2, halfHeight = card.pixelHeight * card.object.scale.x / 2;
    for (const leader of card.leaders) {
      leader.line.visible = active && leader === primary && card.pin.visible;
      if (!leader.line.visible) continue;
      second.copy(leader.anchor).sub(card.object.position);
      const horizontal = second.dot(edgeRight), vertical = second.dot(edgeUp);
      edgePoint.copy(card.object.position);
      if (Math.abs(horizontal) / halfWidth >= Math.abs(vertical) / halfHeight) {
        edgePoint.addScaledVector(edgeRight, Math.sign(horizontal || 1) * halfWidth);
        edgePoint.addScaledVector(edgeUp, clamp(vertical, -halfHeight * .65, halfHeight * .65));
      } else {
        edgePoint.addScaledVector(edgeUp, Math.sign(vertical || 1) * halfHeight);
        edgePoint.addScaledVector(edgeRight, clamp(horizontal, -halfWidth * .7, halfWidth * .7));
      }
      bendPoint.copy(leader.anchor).lerp(edgePoint, .65).addScaledVector(cameraUp, .018);
      const values = leader.line.geometry.attributes.position.array;
      leader.anchor.toArray(values, 0);bendPoint.toArray(values, 3);edgePoint.toArray(values, 6);leader.line.geometry.attributes.position.needsUpdate = true;
      leader.line.material.opacity = .78;
    }
  }
  function fitRenderedCard(card) {
    if (!card?.object.visible) return;
    const viewport = container.getBoundingClientRect();
    // Hidden cards cannot be measured on their first open. Validate the one
    // rendered panel as well, including its true CSS perspective and tilt.
    for (let pass = 0; pass < 2; pass++) {
      let actual = card.object.element.getBoundingClientRect();
      if (!actual.width || !actual.height) return;
      const factor = pixelsPerUnitAt(card.object.position), availableHeight = safeArea.bottom - safeArea.top;
      const bodyTop = bodyObstacles.length ? Math.min(...bodyObstacles.map(value => value.top)) : safeArea.bottom;
      const aboveHeight = bodyTop - safeArea.top - 12;
      const mobileAbove = width < 560 && aboveHeight >= (EXPANDED_HEADER + measurePrimaryHeight(card, card.cssWidth)) * factor + 8;
      const heightCap = mobileAbove ? Math.min(availableHeight, aboveHeight) : availableHeight;
      if (actual.height > heightCap) {
        const limit = Math.max(measurePrimaryHeight(card, card.cssWidth), heightCap / factor - EXPANDED_HEADER - 8);
        card.cssDetailHeight = Math.min(card.cssDetailHeight, limit);card.details.style.maxHeight = `${card.cssDetailHeight.toFixed(1)}px`;
        card.pixelHeight = card.object.element.offsetHeight || EXPANDED_HEADER + card.cssDetailHeight;
        actual = card.object.element.getBoundingClientRect();
      }
      const left = actual.left - viewport.left, top = actual.top - viewport.top;
      const nextLeft = clamp(left, safeArea.left, Math.max(safeArea.left, safeArea.right - actual.width));
      const nextTop = mobileAbove && actual.height <= aboveHeight ? safeArea.top
        : clamp(top, safeArea.top, Math.max(safeArea.top, safeArea.bottom - actual.height));
      const dx = nextLeft - left, dy = nextTop - top;
      Object.assign(card.rectangle, { left, right: left + actual.width, top, bottom: top + actual.height,
        x: left + actual.width / 2, y: top + actual.height / 2, halfWidth: actual.width / 2, halfHeight: actual.height / 2 });
      if (Math.abs(dx) + Math.abs(dy) < .5) break;
      projected.copy(card.object.position).project(camera);
      projected.x += dx * 2 / width;projected.y -= dy * 2 / height;projected.unproject(camera);
      card.object.position.copy(projected);card.target.copy(projected);card.heldPosition.copy(projected);
      updateLeaders(card, card);root.updateMatrixWorld(true);renderer.render(scene, camera);
    }
    const final = card.object.element.getBoundingClientRect();
    Object.assign(card.rectangle, { left: final.left - viewport.left, right: final.right - viewport.left,
      top: final.top - viewport.top, bottom: final.bottom - viewport.top,
      x: final.left - viewport.left + final.width / 2, y: final.top - viewport.top + final.height / 2,
      halfWidth: final.width / 2, halfHeight: final.height / 2 });
    if (card.rectangle.bottom > safeArea.bottom + 2 || card.rectangle.top < safeArea.top - 2 ||
      card.rectangle.left < safeArea.left - 2 || card.rectangle.right > safeArea.right + 2) {
      showCard(card, false);for (const leader of card.leaders) leader.line.visible = false;
      root.updateMatrixWorld(true);renderer.render(scene, camera);
    }
  }
  function update(time, metrics) {
    if (disposed || updating || settingAnnotations) return;
    updating = true;
    try {
    if (Number.isFinite(time)) lastTime = time;
    if (metrics !== undefined) lastMetrics = metrics;
    if (typeof metrics?.playing === 'boolean') setPlaying(metrics.playing);
    if (!enabled) { settling = false;dirty = false;return; }
    model.updateWorldMatrix(true, false);scene.updateWorldMatrix(true, false);camera.updateWorldMatrix(true, false);
    inverseScene.copy(scene.matrixWorld).invert();root.matrix.copy(inverseScene);root.matrixWorldNeedsUpdate = true;
    camera.getWorldQuaternion(cameraQuaternion);cameraRight.set(1, 0, 0).applyQuaternion(cameraQuaternion);cameraUp.set(0, 1, 0).applyQuaternion(cameraQuaternion);
    measureSafeArea();measureExclusion();
    const hands = Array.isArray(lastMetrics?.supportHands) ? lastMetrics.supportHands.filter(hand => ['left', 'right'].includes(hand)) : [];
    if (!joint('pelvis', actorCentre)) actorCentre.set(0, .7, 0).applyMatrix4(model.matrixWorld);
    if (joint('shoulderCenter', second)) { bodyUp.copy(second).sub(actorCentre).normalize();actorCentre.lerp(second, .5); } else bodyUp.set(0, 1, 0);
    if (joint('leftShoulder', point) && joint('rightShoulder', second)) bodyRight.copy(point).sub(second).normalize();else bodyRight.set(1, 0, 0);
    if (bodyRight.lengthSq() < 1e-8) bodyRight.copy(cameraRight);if (bodyUp.lengthSq() < 1e-8) bodyUp.copy(cameraUp);
    bodyFront.crossVectors(bodyRight, bodyUp).normalize();
    if (finitePoint(lastMetrics?.chestForward)) { bodyFront.fromArray(lastMetrics.chestForward).transformDirection(model.matrixWorld); }
    if (!scaleReady && !obstructed) {
      cameraPoint.copy(actorCentre).applyMatrix4(camera.matrixWorldInverse);
      const focal = camera.projectionMatrix.elements[5] * height / 2;
      const targetPixels = Math.min(COMPACT_WIDTH, Math.max(145, (safeArea.right - safeArea.left - 135) / 2));
      worldScale = Math.max(.0003, -cameraPoint.z / Math.max(1, focal) * targetPixels / COMPACT_WIDTH);scaleReady = true;
    }
    const stamp = performance.now(), delta = lastStamp ? clamp((stamp - lastStamp) / 1000, .008, .1) : .016;
    lastStamp = stamp;const blend = 1 - Math.exp(-14 * delta);settling = false;
    const supportSign = hands.length === 1 && hands[0] === 'left' ? 1 : -1;
    const occupied = [];
    const ordered = [...cards].sort((a, b) => Number(b.expanded) - Number(a.expanded));
    const requestedCard = cards.filter(card => cardExpanded(card)).sort((a, b) => b.order - a.order)[0] ?? null;
    for (const card of ordered) {
      card.available = Boolean(card.record) && !obstructed && model.visible;
      const anchors = card.slot === 0 ? hands.length ? hands.flatMap(hand => [`${hand}Shoulder`, `${hand}Elbow`]) : ['leftShoulder', 'rightShoulder']
        : card.slot === 1 ? ['waist'] : card.record?.anchors.length ? card.record.anchors : ['leftHip', 'rightHip', 'leftKnee', 'rightKnee'];
      card.available &&= averageAnchors(anchors, card.anchor);
      updateRegionAnchors(card, hands);
      if (card.record) {
        const prompt = compactPrompt(card.slot, profile, hands);writeText(card.badge, prompt.badge);writeText(card.brief, prompt.brief);
      }
      if (card.slot === 0 && card.record) {
        writeText(card.action, hands.length === 2 ? '双手主动推地，肩带与伸肘控制共同维持支撑空间。' : hands.length === 1 ? `${hands[0] === 'left' ? '左' : '右'}手主动推地，承重肩与肘部保持受控；另一只手让出摆腿空间。` : '当前正在换手，肩臂调整位置并接续支撑。');
      }
      if (!card.available) { showCard(card, false);continue; }
      card.pixelWidth = card.object.element.offsetWidth || card.cssWidth;
      card.pixelHeight = card.object.element.offsetHeight || (card.expanded ? EXPANDED_HEADER + card.cssDetailHeight : card.compact ? 44 : COMPACT_HEIGHT);
      card.target.copy(card.anchor);
      if (card.slot === 0) card.target.addScaledVector(bodyRight, supportSign * .46).addScaledVector(bodyUp, .22);
      else if (card.slot === 1) card.target.addScaledVector(bodyRight, -supportSign * .49).addScaledVector(bodyUp, .035);
      else card.target.addScaledVector(bodyRight, supportSign * .38).addScaledVector(bodyUp, -.25);
      card.target.addScaledVector(bodyFront, .12);
      if (card !== requestedCard) { showCard(card, false);card.initialized = false;continue; }
      if (card.expanded && card.initialized) card.target.copy(card.heldPosition);
      const placed = placeInSafeArea(card, occupied);
      showCard(card, placed);
      if (!placed) continue;
      targetQuaternion.copy(cameraQuaternion).multiply(card.tilt);
      if (!card.initialized || card.expansionPending) { card.object.position.copy(card.target);card.object.quaternion.copy(targetQuaternion);card.initialized = true; }
      else { card.object.position.lerp(card.target, blend);card.object.quaternion.slerp(targetQuaternion, blend); }
      card.object.scale.setScalar(pixelsPerUnitAt(card.object.position) / worldPixelsAt(card.object.position));
      // Damping must never slide a label across the athlete while it moves
      // between free spaces. A new safe pocket may require one direct move.
      let actual = screenRectangle(card, card.object.position);
      if (!rectangleClear(actual, occupied, card.relaxed, card.edgeOverlay)) {
        card.object.position.copy(card.target);card.object.scale.setScalar(pixelsPerUnitAt(card.object.position) / worldPixelsAt(card.object.position));
        actual = screenRectangle(card, card.object.position);
      }
      if (card.expanded) card.heldPosition.copy(card.object.position);
      card.expansionPending = false;
      Object.assign(card.rectangle, actual);occupied.push({ ...actual });
      if (card.object.position.distanceToSquared(card.target) > 1e-7 || card.object.quaternion.angleTo(targetQuaternion) > .001) settling = true;
    }
    const focusedCard = requestedCard?.object.visible ? requestedCard : null;
    for (const card of cards) if (card.available) updateLeaders(card, focusedCard);
    root.updateMatrixWorld(true);renderer.render(scene, camera);fitRenderedCard(focusedCard);
    if (!iconsReady && cards.some(card => card.object.visible)) { refreshIcons?.();iconsReady = true; }
    dirty = false;reconcileHover();
    } finally { updating = false; }
  }
  function resize(nextWidth, nextHeight) {
    if (disposed || !Number.isFinite(nextWidth) || !Number.isFinite(nextHeight) || nextWidth <= 0 || nextHeight <= 0) return;
    if (hasRendererSize && nextWidth === width && nextHeight === height) return;
    width = nextWidth;height = nextHeight;renderer.setSize(width, height);hasRendererSize = true;scaleReady = false;dirty = true;
    for (const card of cards) card.primaryHeights.clear();
  }
  function getStatus() {
    return { enabled, disposed, time: lastTime, playing, hoverGroup: activeGroup, settling, obstructed, renderer: 'CSS3DRenderer',
      inspectingSlot,
      cardCount: cards.filter(card => card.record).length, visibleCount: cards.filter(card => card.object.visible).length,
      expanded: cards.filter(card => card.expanded).map(card => card.id), safeArea: { ...safeArea }, exclusion: { ...exclusion }, worldScale,
      visibleLeaderCount: cards.reduce((count, card) => count + card.leaders.filter(leader => leader.line.visible).length, 0),
      cards: cards.map(card => ({ id: card.id, group: card.record?.group ?? card.group, visible: card.object.visible, expanded: card.expanded,
        position: card.object.position.toArray(), anchor: card.anchor.toArray(), scale: card.object.scale.x,
        compact: card.compact, screenRect: { ...card.rectangle }, trainingVisible: false, colour: card.colour,
        screenScale: pixelsPerUnitAt(card.object.position), layout: card.edgeOverlay ? 'edge' : card.relaxed ? 'contour' : 'outside',
        number: card.number, pinVisible: card.pin.visible, leaderVisible: card.leaders.some(leader => leader.line.visible),
        leaderAnchors: card.leaders.filter(leader => leader.available).map(leader => leader.anchor.toArray()) })) };
  }
  function dispose() {
    if (disposed) return;
    setEnabled(false);observer?.disconnect();drawerObserver?.disconnect();
    for (const card of cards) if (card.leaveTimer !== null) clearTimeout(card.leaveTimer);
    for (const remove of listeners) remove();
    if (canvas?.style) canvas.style.cursor = originalCanvasCursor;
    root.clear();root.removeFromParent();renderer.domElement.remove();
    for (const geometry of lineGeometry) geometry.dispose();for (const material of lineMaterials) material.dispose();
    disposed = true;profile = null;lastMetrics = null;
  }
  const bounds = container.getBoundingClientRect();resize(Math.max(1, bounds.width), Math.max(1, bounds.height));
  function setInspecting(slot) {
    inspectingSlot = SLOT_DEFINITIONS.some(value => value.id === slot) ? slot : null;
    for (const card of cards) closeCard(card);dirty = true;
  }
  return { setAnnotations, setEnabled, setPlaying, setInspecting, update, resize, needsRender: () => !disposed && enabled && (dirty || settling), getStatus, dispose };
}
