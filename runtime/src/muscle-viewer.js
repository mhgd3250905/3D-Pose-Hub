// Full-screen, phone-first 3D muscle viewer. A smooth CC0 body (Blender
// Studio base mesh; the unclothed copy built by tools/mannequin/build_mannequin.py) with a fitness-app style muscle map drawn per pixel by
// muscle-map.js. Colours show WHERE a muscle group sits — never activation,
// force or EMG. Offline: the model is served from /anatomy.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MUSCLE_BY_ID, applyMuscleMap, createMuscleUniforms, muscleAt, resolveGroup, setMuscleColour, setMuscleFocus, setMuscleSelection } from './muscle-map.js';
import './muscle-viewer.css';

const MODEL_URL = '/anatomy/mannequin-reference.glb';
const LEVELS = { primary: '主要', secondary: '辅助', deep: '深层' };
const SIDES = { left: '左侧', right: '右侧', both: '双侧' };
const ICON = {
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  spin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4.5h-4.5"/></svg>',
  reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.34-5.66"/><path d="M4 4v4.5h4.5"/></svg>',
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

let modelPromise = null;
function loadModel() {
  modelPromise ??= fetch(MODEL_URL).then(response => {
    if (!response.ok) throw new Error('本地人体模型未能载入');return response.arrayBuffer();
  }).then(buffer => new GLTFLoader().parseAsync(buffer, '/anatomy/')).catch(error => { modelPromise = null;throw error; });
  return modelPromise.then(gltf => gltf.scene.clone(true));
}
function el(document, tag, className, text) {
  const node = document.createElement(tag);if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);return node;
}

/** Normalise items: [{groupId,label,role,level,side}] -> resolved panels. */
function normalise(items) {
  const result = [];
  for (const item of items ?? []) {
    const group = resolveGroup(item?.groupId);if (!group) continue;
    const level = item.level === 'secondary' || item.level === 'deep' ? item.level : group.deep ? 'deep' : 'primary';
    const side = item.side === 'left' || item.side === 'right' ? item.side : 'both';
    const colour = typeof item.colour === 'string' && /^#[0-9a-f]{3,8}$/i.test(item.colour) ? item.colour : null;
    const view = item.view === 'front' || item.view === 'back' ? item.view : null;
    if (result.some(entry => entry.groupId === item.groupId)) continue; // one card per group
    result.push({ groupId: item.groupId, label: item.label || group.label, role: item.role || '', level, side, muscles: group.muscles, colour, section: item.section || '', view, note: item.note || '' });
  }
  return result;
}
/** Camera yaw that faces a set of panels (0 = front, PI = back). */
function viewFor(item) {
  let x = 0, y = 0, z = 0, ySpan = [Infinity, -Infinity];
  for (const id of item.muscles) {
    const m = MUSCLE_BY_ID[id];x += m.centre[0];y += m.centre[1];z += m.centre[2] - .015;
    ySpan[0] = Math.min(ySpan[0], m.centre[1] - m.radius[1]);ySpan[1] = Math.max(ySpan[1], m.centre[1] + m.radius[1]);
  }
  const n = item.muscles.length;x /= n;y /= n;z /= n;
  const sign = item.side === 'right' ? -1 : 1;
  const facing = item.view ?? (z >= -.02 ? 'front' : 'back');
  const yaw = item.side === 'both' ? (facing === 'front' ? 0 : Math.PI) : Math.atan2(sign * x * .9, z);
  return { yaw, target: new THREE.Vector3(item.side === 'both' ? 0 : sign * x * .55, y, .01), span: ySpan[1] - ySpan[0] };
}

/** Options: items [{groupId,label,role,level,side,colour,section}]. When the
 * items carry their own colours the viewer is in multi-colour mode: one colour
 * per group (which group, never effort). sections [{id,label,short}] order and
 * label the chips; filters [{id,label,groups?:[id|{id,side}]}] add a row that
 * keeps one subset lit (e.g. a role or one pose) and fades the rest. */
export function createMuscleViewer({ container, title = '目标肌群', subtitle = '', items = [], accent = '#ff5a36', sections = [], filters = [], filter: initialFilter = null, onClose, debug = false, debugTools = false } = {}) {
  if (!container?.appendChild) throw new TypeError('createMuscleViewer 需要一个容器。');
  const document = container.ownerDocument ?? globalThis.document, win = document.defaultView ?? globalThis;
  const reduced = () => win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const root = el(document, 'section', 'mv-root');root.setAttribute('aria-label', title + ' · 3D 肌群位置');
  root.style.setProperty('--mv-accent', accent);
  const stage = el(document, 'div', 'mv-stage');root.appendChild(stage);
  // header
  const header = el(document, 'header', 'mv-header'), heading = el(document, 'div', 'mv-heading');
  const kicker = el(document, 'p', 'mv-kicker', subtitle), titleNode = el(document, 'h2', 'mv-title', title);
  heading.append(kicker, titleNode);header.appendChild(heading);kicker.hidden = !subtitle;
  if (onClose) {
    const close = el(document, 'button', 'mv-icon mv-close');close.type = 'button';close.setAttribute('aria-label', '关闭 3D 肌群');
    close.innerHTML = ICON.close;close.addEventListener('click', () => onClose());header.appendChild(close);
  }
  root.appendChild(header);
  const views = el(document, 'div', 'mv-views');views.setAttribute('role', 'group');views.setAttribute('aria-label', '视角');
  const frontButton = el(document, 'button', 'mv-seg', '正面'), backButton = el(document, 'button', 'mv-seg', '背面');
  const spinButton = el(document, 'button', 'mv-seg mv-seg-spin');spinButton.innerHTML = ICON.spin + '<span>自动旋转</span>';
  for (const button of [frontButton, backButton, spinButton]) { button.type = 'button';views.appendChild(button); }
  const hint = el(document, 'p', 'mv-hint', win.matchMedia?.('(pointer: coarse)')?.matches ? '拖动旋转 · 双指缩放 · 双击复位' : '拖动旋转 · 滚轮缩放 · 双击复位');
  heading.appendChild(views);root.appendChild(hint);
  const tag = el(document, 'div', 'mv-tag');tag.hidden = true;tag.setAttribute('role', 'status');root.appendChild(tag);
  const status = el(document, 'p', 'mv-status', '正在载入人体…');root.appendChild(status);
  // bottom sheet
  const sheet = el(document, 'div', 'mv-sheet'), handle = el(document, 'button', 'mv-handle');handle.type = 'button';
  handle.setAttribute('aria-label', '收起或展开肌群列表');handle.setAttribute('aria-expanded', 'true');sheet.appendChild(handle);
  const legend = el(document, 'div', 'mv-legend');
  for (const level of ['primary', 'secondary', 'deep']) {
    const key = el(document, 'span', 'mv-key mv-key-' + level);key.append(el(document, 'i', 'mv-swatch'), el(document, 'span', '', LEVELS[level] + (level === 'deep' ? '（斜线）' : '')));legend.appendChild(key);
  }
  const multiKey = el(document, 'span', 'mv-key mv-key-multi');multiKey.append(el(document, 'i', 'mv-swatch mv-swatch-multi'), el(document, 'span', '', '一色一肌群'));
  const deepKey = el(document, 'span', 'mv-key mv-key-deepmulti');deepKey.append(el(document, 'i', 'mv-swatch mv-swatch-deepmulti'), el(document, 'span', '', '斜线＝深层'));
  legend.append(multiKey, deepKey);
  const resetButton = el(document, 'button', 'mv-icon mv-reset');resetButton.type = 'button';resetButton.setAttribute('aria-label', '复位视角');resetButton.innerHTML = ICON.reset;
  legend.appendChild(resetButton);sheet.appendChild(legend);
  const filterRow = el(document, 'div', 'mv-filters');filterRow.setAttribute('role', 'group');filterRow.setAttribute('aria-label', '筛选肌群');sheet.appendChild(filterRow);
  const chips = el(document, 'div', 'mv-chips');chips.setAttribute('role', 'listbox');chips.setAttribute('aria-label', '目标肌群');sheet.appendChild(chips);
  const detail = el(document, 'div', 'mv-detail'), detailName = el(document, 'strong', 'mv-detail-name'), detailMeta = el(document, 'span', 'mv-detail-meta');
  const detailParts = el(document, 'p', 'mv-detail-parts'), detailRole = el(document, 'p', 'mv-detail-role'), detailNote = el(document, 'p', 'mv-detail-note');
  const detailHead = el(document, 'div', 'mv-detail-head');detailHead.append(detailName, detailMeta);detail.append(detailHead, detailParts, detailRole, detailNote);detailNote.hidden = true;sheet.appendChild(detail);
  sheet.appendChild(el(document, 'p', 'mv-note', '示意位置，不代表发力大小'));
  root.appendChild(sheet);container.appendChild(root);

  // three
  const uniforms = createMuscleUniforms();uniforms.mmDebug.value = debug ? 1 : 0;
  const accentColour = new THREE.Color(accent);uniforms.mmAccent.value.copy(accentColour);
  uniforms.mmAccent2.value.copy(accentColour).offsetHSL(.045, 0, .12);setMuscleColour(uniforms, accentColour);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(28, 1, .05, 30);scene.add(camera);
  scene.add(new THREE.HemisphereLight(0xe6eeff, 0x1b2333, .6));
  const key = new THREE.DirectionalLight(0xfff3e6, 1.6);key.position.set(1.4, 1.8, 2.6);camera.add(key);key.target.position.set(0, 0, -3);camera.add(key.target);
  const fill = new THREE.DirectionalLight(0xc4d8ff, .55);fill.position.set(-2.4, .4, 1.2);camera.add(fill);fill.target.position.set(0, 0, -3);camera.add(fill.target);
  const rimA = new THREE.DirectionalLight(0x9cc4ff, 1.5);rimA.position.set(-2.2, 1.4, -3.2);camera.add(rimA);rimA.target.position.set(0, 0, -3);camera.add(rimA.target);
  const rimB = new THREE.DirectionalLight(0xffd1b8, .9);rimB.position.set(2.4, .8, -3.4);camera.add(rimB);rimB.target.position.set(0, 0, -3);camera.add(rimB.target);
  const floorMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false,
    uniforms: { uAccent: { value: accentColour.clone() } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform vec3 uAccent;varying vec2 vUv;void main(){float r=length(vUv-0.5)*2.0;
      float shadow=(1.0-smoothstep(0.0,0.55,r))*0.55;float glow=(1.0-smoothstep(0.2,1.0,r))*0.10;
      float ring=(smoothstep(0.80,0.82,r)-smoothstep(0.83,0.86,r))*0.10;
      vec3 c=mix(vec3(0.0),vec3(0.55,0.65,0.85),clamp((glow+ring)*3.0,0.0,1.0));
      gl_FragColor=vec4(c,max(shadow,glow+ring));}` });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), floorMaterial);floor.rotation.x = -Math.PI / 2;floor.position.y = .001;scene.add(floor);
  const body = new THREE.Group();scene.add(body);
  let renderer = null, environment = null, meshes = [], loaded = false, disposed = false, frame = 0, failed = false;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, 2));renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;renderer.toneMapping = THREE.ACESFilmicToneMapping;renderer.toneMappingExposure = 1.0;
    const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
    environment = pmrem.fromScene(room, .04);scene.environment = environment.texture;scene.environmentIntensity = .32;room.dispose();pmrem.dispose();
    renderer.domElement.className = 'mv-canvas';renderer.domElement.setAttribute('aria-label', '可旋转的 3D 人体，亮色为目标肌群位置');
    stage.appendChild(renderer.domElement);
  } catch {
    failed = true;renderer = null;status.textContent = '当前设备无法显示 3D，可在下方查看肌群列表。';
  }

  // state
  let list = normalise(items), selected = null, autoSpin = false, revealStart = 0, lastInteraction = 0, width = 1, height = 1;
  const cam = { yaw: 0, pitch: .06, dist: 3, target: new THREE.Vector3(0, .86, 0) };
  const goal = { yaw: 0, pitch: .06, dist: 3, target: new THREE.Vector3(0, .86, 0) };
  let fitDist = 3, homeYaw = 0, offsetY = 0, hintTimer = 0;
  const visible = { top: 0, bottom: 1 };
  let sectionList = Array.isArray(sections) ? sections : [], filterList = Array.isArray(filters) ? filters : [], filterId = null;
  const isMulti = () => list.length > 0 && list.every(item => item.colour);
  const activeFilter = () => filterList.find(entry => entry.id === filterId && Array.isArray(entry.groups)) ?? null;
  /** groupId -> side override for the active filter, or null when not filtering. */
  function filterSides() {
    const current = activeFilter();if (!current) return null;
    return new Map(current.groups.map(entry => typeof entry === 'string' ? [entry, null] : [entry.id, entry.side === 'left' || entry.side === 'right' ? entry.side : null]));
  }
  const inFilter = item => { const sides = filterSides();return !sides || sides.has(item.groupId); };
  function setSel() {
    const multi = isMulti(), sides = filterSides();
    uniforms.mmMulti.value = multi ? 1 : 0;
    if (!multi) setMuscleColour(uniforms, accentColour);
    setMuscleSelection(uniforms, list.flatMap(item => {
      const filtered = sides && !sides.has(item.groupId), side = sides?.get(item.groupId) ?? item.side;
      // a selected card fades the other groups almost to the plain body so its own panels read clearly
      const dim = filtered ? 1 : multi && selected && selected !== item ? .97 : 0;
      return item.muscles.map(muscle => ({ muscle, level: item.level, side, colour: item.colour ?? undefined, dim }));
    }));
  }

  function homeView() {
    const primaries = list.filter(item => item.level === 'primary');const pool = primaries.length ? primaries : list;
    let front = 0, back = 0;
    for (const item of pool) for (const id of item.muscles) { if ((item.view ?? (MUSCLE_BY_ID[id].centre[2] < -.02 ? 'back' : 'front')) === 'back') back++;else front++; }
    return back > front ? Math.PI : 0;
  }
  function layout() {
    const rect = root.getBoundingClientRect();width = Math.max(1, rect.width);height = Math.max(1, rect.height);
    const headerBottom = views.getBoundingClientRect().bottom - rect.top, sheetTop = sheet.getBoundingClientRect().top - rect.top;
    root.style.setProperty('--mv-sheet-h', Math.round(height - sheetTop) + 'px');
    const side = win.getComputedStyle?.(sheet).getPropertyValue('--mv-sheet-side').trim() === '1';
    visible.top = clamp(headerBottom + 6, 0, height * .4);visible.bottom = clamp(side ? height - 40 : sheetTop - 26, visible.top + 120, height);
    root.classList.toggle('mv-wide', side);
    // Fade the canvas out under the title and view controls so a zoomed body
    // (head, shoulders) never sits on top of them.
    root.style.setProperty('--mv-top-fade', Math.round(headerBottom - 8) + 'px');
    if (renderer) renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const vh = visible.bottom - visible.top, f = vh / height, t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    fitDist = Math.max(1.78 / (2 * t * f), .98 / (2 * t * camera.aspect));
    offsetY = height / 2 - (visible.top + vh / 2);
    camera.setViewOffset(width, height, 0, offsetY, width, height);camera.updateProjectionMatrix();
    if (!selected) { goal.dist = fitDist; }
    else focusCamera(selected, true);
    requestFrame();
  }
  function resetView(instant = false) {
    selected = null;tag.hidden = true;setMuscleFocus(uniforms, []);setSel();renderChips();
    goal.yaw = homeYaw + Math.round((cam.yaw - homeYaw) / (2 * Math.PI)) * 2 * Math.PI;goal.pitch = .06;goal.dist = fitDist;goal.target.set(0, .86, 0);
    if (instant) Object.assign(cam, { yaw: goal.yaw, pitch: goal.pitch, dist: goal.dist }), cam.target.copy(goal.target);
    syncViewButtons();requestFrame();
  }
  function turnTo(yaw) { goal.yaw = cam.yaw + wrapAngle(yaw - cam.yaw);syncViewButtons(yaw);requestFrame(); }
  function focusCamera(item, keepYaw = false) {
    const view = viewFor(item);
    if (!keepYaw) turnTo(view.yaw);
    goal.target.copy(view.target);goal.pitch = .04;
    goal.dist = fitDist * clamp((view.span + .45) / 1.69 * 1.45, .56, .86);requestFrame();
  }
  function select(groupId, { toggle = false } = {}) {
    const item = list.find(entry => entry.groupId === groupId);
    if (!item || (toggle && selected === item)) { resetView();return; }
    selected = item;setSpin(false);setSel();setMuscleFocus(uniforms, item.muscles);focusCamera(item);renderChips();
    lastInteraction = now();tag.hidden = true;
  }
  function renderFilters() {
    filterRow.replaceChildren();filterRow.hidden = filterList.length < 2;
    for (const entry of filterList) {
      const button = el(document, 'button', 'mv-filter', entry.label);button.type = 'button';
      button.setAttribute('aria-pressed', String((filterId ?? filterList[0]?.id) === entry.id));
      button.addEventListener('click', () => setFilter(entry.id));filterRow.appendChild(button);
    }
  }
  function setFilter(id) {
    filterId = filterList.some(entry => entry.id === id) ? id : filterList[0]?.id ?? null;
    if (selected && !inFilter(selected)) { selected = null;setMuscleFocus(uniforms, []);goal.target.set(0, .86, 0);goal.pitch = .06;goal.dist = fitDist; }
    setSel();renderFilters();renderChips();requestFrame();
  }
  function renderChips() {
    chips.replaceChildren();const multi = isMulti();root.classList.toggle('mv-multi', multi);
    for (const level of Object.keys(LEVELS)) legend.querySelector('.mv-key-' + level).hidden = multi || !list.some(item => item.level === level);
    multiKey.hidden = !multi;deepKey.hidden = !multi || !list.some(item => item.level === 'deep');
    const shownItems = list.filter(inFilter);let lastSection = null;
    for (const item of shownItems) {
      if (multi && item.section && item.section !== lastSection) {
        const section = sectionList.find(entry => entry.id === item.section);lastSection = item.section;
        if (section) chips.appendChild(el(document, 'span', 'mv-chip-section', section.label));
      }
      const chip = el(document, 'button', 'mv-chip mv-chip-' + item.level);chip.type = 'button';chip.setAttribute('role', 'option');
      chip.setAttribute('aria-selected', String(selected === item));if (item.colour) chip.style.setProperty('--mv-c', item.colour);
      chip.append(el(document, 'i', 'mv-swatch'), el(document, 'span', 'mv-chip-label', item.label));
      const side = filterSides()?.get(item.groupId) ?? item.side;
      if (side !== 'both') chip.appendChild(el(document, 'span', 'mv-chip-side', side === 'left' ? '左' : '右'));
      chip.addEventListener('click', () => select(item.groupId, { toggle: true }));chips.appendChild(chip);
    }
    const shown = selected;
    detail.hidden = !list.length;detail.style.removeProperty('--mv-c');
    if (!shown && list.length) {
      const current = activeFilter();
      detailName.textContent = (current ? current.label + ' · ' : '') + shownItems.length + ' 个相关肌群';detailMeta.textContent = '';
      if (multi && sectionList.length) {
        detailParts.textContent = sectionList.map(section => [section.short || section.label, shownItems.filter(item => item.section === section.id).length]).filter(([, n]) => n).map(([name, n]) => name + ' ' + n).join(' · ');
        detailRole.textContent = '颜色只区分肌群；点选肌群或直接点人体，查看具体位置';
      } else {
        detailParts.textContent = shownItems.map(item => item.label).join(' · ');
        detailRole.textContent = '点选下方肌群或直接点人体，查看具体位置';
      }
      detailRole.hidden = false;detailNote.hidden = true;
    }
    if (shown) {
      const side = filterSides()?.get(shown.groupId) ?? shown.side;
      if (shown.colour) detail.style.setProperty('--mv-c', shown.colour);
      const section = sectionList.find(entry => entry.id === shown.section);
      detailName.textContent = shown.label;detailMeta.textContent = (multi ? (section ? (section.short || section.label) + ' · ' : '') + (shown.level === 'deep' ? '深层 · ' : '') : LEVELS[shown.level] + ' · ') + SIDES[side];
      detailMeta.className = 'mv-detail-meta mv-meta-' + shown.level;
      detailParts.textContent = [...new Set(shown.muscles.map(id => MUSCLE_BY_ID[id].name))].join(' · ');
      detailRole.textContent = shown.role;detailRole.hidden = !detailRole.textContent;
      detailNote.textContent = shown.note ? '示意说明：' + shown.note : '';detailNote.hidden = !shown.note;
    }
    if (!shown) chips.scrollLeft = 0;
    chips.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: reduced() ? 'auto' : 'smooth' });
  }
  function syncViewButtons(yaw = goal.yaw) {
    const back = Math.cos(yaw) < 0;
    frontButton.setAttribute('aria-pressed', String(!autoSpin && !back));backButton.setAttribute('aria-pressed', String(!autoSpin && back));
    spinButton.setAttribute('aria-pressed', String(autoSpin));
  }
  function setSpin(on) { autoSpin = Boolean(on) && !reduced();syncViewButtons();requestFrame(); }
  const now = () => win.performance?.now?.() ?? Date.now();

  // interaction
  const pointers = new Map();let gesture = null, lastTap = null;
  const canvas = renderer?.domElement;
  function onDown(event) {
    canvas.setPointerCapture?.(event.pointerId);pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) gesture = { x: event.clientX, y: event.clientY, t: now(), moved: false };
    if (pointers.size === 2) { const [a, b] = [...pointers.values()];gesture = { pinch: Math.hypot(a.x - b.x, a.y - b.y), dist: goal.dist, moved: true }; }
    hint.classList.add('mv-hint-off');
  }
  function onMove(event) {
    const prev = pointers.get(event.pointerId);if (!prev || !gesture) return;
    const next = { x: event.clientX, y: event.clientY };pointers.set(event.pointerId, next);
    if (pointers.size >= 2 && gesture.pinch) {
      const [a, b] = [...pointers.values()];const d = Math.hypot(a.x - b.x, a.y - b.y);
      goal.dist = clamp(gesture.dist * gesture.pinch / Math.max(d, 1), fitDist * .32, fitDist * 1.3);cam.dist = goal.dist;requestFrame();return;
    }
    if (!gesture.moved && Math.hypot(next.x - gesture.x, next.y - gesture.y) > 6) { gesture.moved = true;setSpin(false);tag.hidden = true; }
    if (gesture.moved) {
      const dx = next.x - prev.x, dy = next.y - prev.y;
      goal.yaw -= dx * .0085;goal.pitch = clamp(goal.pitch + dy * .005, -.35, .55);cam.yaw = goal.yaw;cam.pitch = goal.pitch;
      syncViewButtons();requestFrame();
    }
  }
  function onUp(event) {
    pointers.delete(event.pointerId);
    if (gesture && !gesture.moved && !gesture.pinch && pointers.size === 0 && now() - gesture.t < 450) {
      const t = now();
      if (lastTap && t - lastTap.t < 320 && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 30) { lastTap = null;resetView(); }
      else { lastTap = { t, x: event.clientX, y: event.clientY };pick(event.clientX, event.clientY); }
    }
    if (pointers.size === 0) gesture = null;
    lastInteraction = now();
  }
  function onWheel(event) {
    event.preventDefault();goal.dist = clamp(goal.dist * Math.exp(event.deltaY * .0012), fitDist * .32, fitDist * 1.3);requestFrame();
  }
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();let tagPoint = null;
  function pick(clientX, clientY) {
    if (!loaded) return;const rect = canvas.getBoundingClientRect();
    ndc.set((clientX - rect.left) / rect.width * 2 - 1, 1 - (clientY - rect.top) / rect.height * 2);
    raycaster.setFromCamera(ndc, camera);const hit = raycaster.intersectObjects(meshes, false)[0];
    const found = hit ? muscleAt(hit.point) : null;
    if (!found) { tag.hidden = true;tagPoint = null;return; }
    const owner = list.find(item => item.muscles.includes(found.id) && (item.side === 'both' || item.side === found.side));
    const multi = isMulti();
    tag.replaceChildren(el(document, 'strong', '', found.name), el(document, 'span', '', (found.side === 'left' ? '左侧' : '右侧') + (owner ? ' · ' + (multi ? owner.label : LEVELS[owner.level]) : '')));
    tag.classList.toggle('mv-tag-hot', Boolean(owner));if (owner?.colour) tag.style.setProperty('--mv-c', owner.colour);else tag.style.removeProperty('--mv-c');tag.hidden = false;tagPoint = hit.point.clone();placeTag();
    setMuscleFocus(uniforms, owner ? owner.muscles : selected?.muscles ?? []);
  }
  const projected = new THREE.Vector3();
  function placeTag() {
    if (!tagPoint || tag.hidden) return;projected.copy(tagPoint).project(camera);
    const x = (projected.x + 1) / 2 * width, y = (1 - projected.y) / 2 * height;
    tag.style.transform = `translate(${Math.round(clamp(x, 70, width - 70))}px, ${Math.round(clamp(y, visible.top + 30, visible.bottom - 10))}px)`;
  }
  if (canvas) {
    canvas.addEventListener('pointerdown', onDown);canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);canvas.addEventListener('pointercancel', event => { pointers.delete(event.pointerId);gesture = null; });
    canvas.addEventListener('wheel', onWheel, { passive: false });
  }
  frontButton.addEventListener('click', () => { setSpin(false);turnTo(0); });
  backButton.addEventListener('click', () => { setSpin(false);turnTo(Math.PI); });
  spinButton.addEventListener('click', () => setSpin(!autoSpin));
  resetButton.addEventListener('click', () => { setSpin(false);resetView(); });
  handle.addEventListener('click', () => {
    const collapsed = root.classList.toggle('mv-collapsed');handle.setAttribute('aria-expanded', String(!collapsed));
    requestAnimationFrame(layout);setTimeout(layout, 320);
  });
  const onKey = event => {
    if (event.key === 'Escape' && onClose) onClose();
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { goal.yaw += event.key === 'ArrowLeft' ? -.3 : .3;requestFrame(); }
  };
  root.tabIndex = -1;root.addEventListener('keydown', onKey);

  // render loop (pulse ~30 fps when idle to save battery; full rate while moving)
  let lastFrame = 0, lastDraw = 0, virtual = null;
  function requestFrame() { if (!frame && renderer && !disposed) frame = requestAnimationFrame(tick); }
  function update(time, dt) {
    const r = reduced(), k = r ? 1 : 1 - Math.exp(-dt * 7.5);
    if (autoSpin) goal.yaw += dt * .55;
    cam.yaw += (goal.yaw - cam.yaw) * k;cam.pitch += (goal.pitch - cam.pitch) * k;cam.dist += (goal.dist - cam.dist) * k;cam.target.lerp(goal.target, k);
    const elapsed = (time - revealStart) / 1000;
    uniforms.mmReveal.value = r || !revealStart ? 1 : ease((elapsed - .35) / 1.1);
    uniforms.mmTime.value = r ? 0 : time / 1000;
    const settling = Math.abs(goal.yaw - cam.yaw) > 1e-4 || Math.abs(goal.dist - cam.dist) > 1e-4 || cam.target.distanceToSquared(goal.target) > 1e-8 || Math.abs(goal.pitch - cam.pitch) > 1e-4;
    return { intro: !r && elapsed < 1.6, pulse: !r && list.length > 0, moving: autoSpin || settling };
  }
  function draw() {
    const cp = Math.cos(cam.pitch);
    camera.position.set(cam.target.x + Math.sin(cam.yaw) * cp * cam.dist, cam.target.y + Math.sin(cam.pitch) * cam.dist, cam.target.z + Math.cos(cam.yaw) * cp * cam.dist);
    camera.lookAt(cam.target);renderer.render(scene, camera);placeTag();
  }
  function tick(time) {
    frame = 0;if (disposed || !renderer || virtual !== null) return;
    const dt = Math.min(.05, lastFrame ? (time - lastFrame) / 1000 : .016);lastFrame = time;
    const state = update(time, dt), busy = state.intro || state.moving || pointers.size > 0;
    if (busy || time - lastDraw > 32) { draw();lastDraw = time; }
    if ((busy || state.pulse) && !document.hidden) frame = requestAnimationFrame(tick);
  }
  /** Test hook: replay the opening on a virtual clock (deterministic captures). */
  function debugReplayTo(ms) {
    if (virtual === null) { intro();virtual = 0;revealStart = .001; }
    while (virtual < ms) { virtual += 16;update(virtual, .016); }
    draw();
  }
  function intro() {
    homeYaw = homeView();layout();
    const r = reduced();
    goal.yaw = homeYaw;goal.pitch = .06;goal.dist = fitDist;goal.target.set(0, .86, 0);
    cam.yaw = homeYaw + (r ? 0 : -.75);cam.pitch = r ? .06 : .16;cam.dist = fitDist * (r ? 1 : 1.18);cam.target.copy(goal.target);
    revealStart = r ? 0 : (win.performance?.now?.() ?? 0);syncViewButtons();requestFrame();
    clearTimeout(hintTimer);hint.classList.remove('mv-hint-off');hintTimer = setTimeout(() => hint.classList.add('mv-hint-off'), 5000);
  }

  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => layout()) : null;observer?.observe(root);
  const onVisibility = () => { if (!document.hidden) { lastFrame = 0;requestFrame(); } };document.addEventListener('visibilitychange', onVisibility);
  filterId = filterList.some(entry => entry.id === initialFilter) ? initialFilter : filterList[0]?.id ?? null;
  setSel();renderFilters();renderChips();layout();
  if (!failed) loadModel().then(model => {
    if (disposed) return;
    model.traverse(object => {
      if (!object.isMesh) return;
      const role = object.userData.partRole ?? object.userData.role;const clothing = role === 'clothing';
      const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: clothing ? .85 : .6, metalness: 0, alphaToCoverage: clothing });
      applyMuscleMap(material, uniforms, { clothing });object.material = material;meshes.push(object);
    });
    body.add(model);loaded = true;status.hidden = true;root.dataset.ready = 'true';intro();
  }).catch(error => { status.textContent = error.message || '人体模型未能载入';root.dataset.ready = 'error'; });

  function setItems(nextItems, { title: nextTitle, subtitle: nextSubtitle, sections: nextSections, filters: nextFilters, filter: nextFilter } = {}) {
    list = normalise(nextItems);selected = null;
    if (nextSections !== undefined) sectionList = Array.isArray(nextSections) ? nextSections : [];
    if (nextFilters !== undefined) filterList = Array.isArray(nextFilters) ? nextFilters : [];
    filterId = filterList.some(entry => entry.id === nextFilter) ? nextFilter : filterList[0]?.id ?? null;
    setSel();setMuscleFocus(uniforms, []);renderFilters();
    if (nextTitle !== undefined) titleNode.textContent = nextTitle;
    if (nextSubtitle !== undefined) { kicker.textContent = nextSubtitle;kicker.hidden = !nextSubtitle; }
    renderChips();if (loaded) intro();
  }
  function dispose() {
    if (disposed) return;disposed = true;if (frame) cancelAnimationFrame(frame);observer?.disconnect();clearTimeout(hintTimer);
    document.removeEventListener('visibilitychange', onVisibility);
    for (const mesh of meshes) { mesh.geometry.dispose();mesh.material.dispose(); }
    floor.geometry.dispose();floorMaterial.dispose();environment?.dispose();renderer?.dispose();root.remove();
  }
  return { root, select, setItems, setFilter, dispose, ...(debug || debugTools ? { debugMeshes: meshes, debugRender: requestFrame, debugCamera: cam, debugGoal: goal, debugReplayTo, debugLive: () => { virtual = null;lastFrame = 0;requestFrame(); } } : {}), resetView: () => resetView(), setSpin,
    setView: direction => { setSpin(false);turnTo(direction === 'back' ? Math.PI : 0); },
    get state() { return { loaded, failed, items: list.map(({ groupId, level, side, colour }) => ({ groupId, level, side, colour })), selected: selected?.groupId ?? null, filter: filterId, multiColour: isMulti(),
      yaw: cam.yaw, dist: cam.dist, fitDist, autoSpin, reveal: uniforms.mmReveal.value, purpose: 'location-only' }; } };
}

/** Full-screen overlay wrapper (fixed, above everything). Returns { close, viewer }. */
export function openMuscleViewer(options = {}) {
  const document = options.document ?? globalThis.document;
  const overlay = el(document, 'div', 'mv-overlay');overlay.setAttribute('role', 'dialog');overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', (options.title ?? '目标肌群') + ' · 全屏 3D');
  document.body.appendChild(overlay);const previousFocus = document.activeElement;
  let closed = false;
  const close = () => {
    if (closed) return;closed = true;overlay.classList.add('mv-overlay-out');
    const finish = () => { viewer.dispose();overlay.remove();previousFocus?.focus?.({ preventScroll: true });options.onClose?.(); };
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) finish();else setTimeout(finish, 220);
  };
  const viewer = createMuscleViewer({ ...options, container: overlay, onClose: close });
  requestAnimationFrame(() => viewer.root.focus?.({ preventScroll: true }));
  return { close, viewer, overlay };
}
