// A small body on the main animation page whose muscle groups light up with
// the phase the Flare animation is in. It has no clock of its own: main.js
// hands it the viewer's (paced) sequence time on every tick, scrub and seek,
// so play, pause and scrub all show the same picture for the same time.
// Phase -> groups data lives in flare-phase-muscles.js; sides follow the saved
// support-hand locks of each key. Colours are teaching emphasis, not EMG.
//
// Cost: one extra small canvas (pixel ratio <= 1.5), front + back drawn with
// scissors in one render, and only when something changed (a crossfade, a
// tap, a resize). The 1.3 MB body is fetched lazily the first time the panel
// is shown expanded.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { applyMuscleMap, createMuscleUniforms, muscleAt, resolveGroup, setMuscleSelection } from './muscle-map.js';
import { FLARE_GROUPS, FLARE_SECTIONS } from './flare-muscle-groups.js';
import { phaseItems, phaseTimeline, samplePhase, supportLabel } from './flare-phase-muscles.js';
import './muscle-sync.css';

const MODEL_URL = '/anatomy/mannequin-reference.glb';
const STORE_KEY = 'flare-muscle-sync-v1';
const GROUP = Object.fromEntries(FLARE_GROUPS.map(group => [group.groupId, group]));
const SECTION = Object.fromEntries(FLARE_SECTIONS.map(section => [section.id, section]));
const SIDE_NAME = { left: '左侧', right: '右侧', both: '双侧' };
const ICON = {
  expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};
const smooth = t => { const x = Math.min(Math.max(t, 0), 1);return x * x * (3 - 2 * x); };

function el(document, tag, className, text) {
  const node = document.createElement(tag);if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);return node;
}

/** viewport: the main animation viewport element. toolbar: the play/scrub bar
 * the panel sits above. onReserve(): called when the space the panel takes
 * from the canvas changes (main framing). onOpenViewer(phaseInfo): the 3D
 * button (the caller pauses playback and opens the full-screen viewer). */
export function createMuscleSync({ viewport, toolbar, onReserve, onOpenViewer, storage = () => globalThis.localStorage } = {}) {
  const document = viewport.ownerDocument, win = document.defaultView;
  const root = el(document, 'section', 'msync');root.hidden = true;root.setAttribute('aria-label', '同步发力肌群');
  // header
  const head = el(document, 'header', 'msync-head');
  const titles = el(document, 'div', 'msync-titles');
  // title + one quiet subline (support · phase detail); the step number lives in the play bar
  const support = el(document, 'span', 'msync-support', '双手支撑');
  const name = el(document, 'h3', 'msync-name'), nameMain = el(document, 'span', 'msync-name-main', '后侧支撑');
  const sub = el(document, 'p', 'msync-sub'), nameDetail = el(document, 'span', 'msync-name-detail', '长腿过前方');
  name.append(nameMain);sub.append(support, el(document, 'span', 'msync-sub-sep', '·'), nameDetail);titles.append(name, sub);
  const expand = el(document, 'button', 'msync-icon msync-open');expand.type = 'button';expand.innerHTML = ICON.expand;
  expand.setAttribute('aria-label', '全屏查看当前阶段的 3D 肌群');expand.title = '全屏 3D';
  const collapse = el(document, 'button', 'msync-icon msync-collapse');collapse.type = 'button';collapse.innerHTML = ICON.down;
  head.append(titles, expand, collapse);
  // body: figure + text
  const body = el(document, 'div', 'msync-body');
  const figure = el(document, 'div', 'msync-figure');
  const labels = el(document, 'div', 'msync-view-labels');labels.setAttribute('aria-hidden', 'true');
  for (const [text, cls] of [['正面', 'front'], ['背面', 'back']]) labels.appendChild(el(document, 'span', 'msync-view msync-view-' + cls, text));
  const status = el(document, 'p', 'msync-status', '载入人体…');
  figure.append(labels, status);
  const text = el(document, 'div', 'msync-text');
  const caption = el(document, 'p', 'msync-caption');caption.setAttribute('aria-live', 'polite');
  const chips = el(document, 'div', 'msync-chips');chips.setAttribute('role', 'list');chips.setAttribute('aria-label', '本阶段主要肌群');
  text.append(caption, chips);
  body.append(figure, text);
  // card
  const card = el(document, 'div', 'msync-card');card.hidden = true;card.setAttribute('role', 'dialog');card.setAttribute('aria-label', '肌群说明');
  const cardHead = el(document, 'div', 'msync-card-head'), cardSwatch = el(document, 'i', 'msync-swatch'), cardName = el(document, 'strong', 'msync-card-name');
  const cardClose = el(document, 'button', 'msync-icon msync-card-close');cardClose.type = 'button';cardClose.innerHTML = ICON.close;cardClose.setAttribute('aria-label', '关闭肌群说明');
  cardHead.append(cardSwatch, cardName, cardClose);
  const cardMeta = el(document, 'p', 'msync-card-meta'), cardWhy = el(document, 'p', 'msync-card-why'), cardRole = el(document, 'p', 'msync-card-role'), cardNote = el(document, 'p', 'msync-card-note');
  card.append(cardHead, cardMeta, cardWhy, cardRole, cardNote);
  const foot = el(document, 'p', 'msync-foot', '颜色为教学重点，不代表肌电或发力大小');
  root.append(head, body, card, foot);viewport.appendChild(root);

  // state
  let timeline = { period: 9, keys: [] }, visible = false, collapsed = false, layout = 'inset', reserve = { right: 0, bottom: 0 };
  let sample = null, phaseKey = '', selected = null, lastStateHash = '', time = 0, renders = 0;
  try { collapsed = JSON.parse(storage()?.getItem(STORE_KEY) || '{}').collapsed === true; } catch {}

  // three (created lazily with the model)
  let renderer = null, scene = null, uniforms = null, meshes = [], loading = false, loaded = false, failed = false, frame = 0, disposed = false;
  const cameras = { front: new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10), back: new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10) };
  cameras.front.position.set(0, .8, 4);cameras.front.lookAt(0, .8, 0);
  cameras.back.position.set(0, .8, -4);cameras.back.lookAt(0, .8, 0);
  let key = null, rim = null;
  function initThree() {
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch { failed = true;status.textContent = '当前设备无法显示 3D';return false; }
    renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, 1.5));renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.className = 'msync-canvas';renderer.domElement.setAttribute('aria-label', '正面与背面人体，亮色为当前阶段的重点肌群；点按查看说明');
    figure.prepend(renderer.domElement);
    scene = new THREE.Scene();scene.add(new THREE.HemisphereLight(0xf2f2f5, 0x202024, 1.25));
    key = new THREE.DirectionalLight(0xfff3e6, 1.9);scene.add(key, key.target);
    rim = new THREE.DirectionalLight(0xdfe6ff, 1.1);scene.add(rim, rim.target);
    uniforms = createMuscleUniforms();uniforms.mmMulti.value = 1;uniforms.mmReveal.value = 1;uniforms.mmTime.value = 0;
    renderer.domElement.addEventListener('pointerup', onTap);
    return true;
  }
  function loadModel() {
    if (loading || loaded || failed) return;loading = true;
    if (!renderer && !initThree()) return;
    sizeCanvas();
    fetch(MODEL_URL).then(response => { if (!response.ok) throw new Error('人体模型未能载入');return response.arrayBuffer(); })
      .then(buffer => new GLTFLoader().parseAsync(buffer, '/anatomy/'))
      .then(gltf => {
        if (disposed) return;
        gltf.scene.traverse(object => {
          if (!object.isMesh) return;
          const clothing = (object.userData.partRole ?? object.userData.role) === 'clothing';
          if (clothing) { object.visible = false;return; }
          const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .62, metalness: 0 });
          applyMuscleMap(material, uniforms);object.material = material;meshes.push(object);
        });
        scene.add(gltf.scene);loaded = true;status.hidden = true;root.dataset.ready = 'true';lastStateHash = '';applyState();requestRender();
      })
      .catch(error => { failed = true;status.textContent = error.message || '人体模型未能载入';root.dataset.ready = 'error'; })
      .finally(() => { loading = false; });
  }
  const idle = callback => (win.requestIdleCallback ? win.requestIdleCallback(callback, { timeout: 1200 }) : win.setTimeout(callback, 250));

  // layout: corner inset when the canvas area is wide, bottom strip otherwise
  function measure() {
    if (!visible) return;
    const css = win.getComputedStyle(document.documentElement);
    const left = parseFloat(css.getPropertyValue('--canvas-left')) || 20, right = parseFloat(css.getPropertyValue('--canvas-right')) || 20;
    const vp = viewport.getBoundingClientRect(), width = vp.width - left - right;
    const next = width >= 720 ? 'inset' : 'strip';
    if (next !== layout) { layout = next;root.dataset.layout = layout; }
    // inset: the card sits beside the play bar (the bar leaves room for it via
    // --msync-reserve) with both bottoms aligned; strip: stacked above the bar
    const root_ = document.documentElement, gap = 8;
    root_.style.setProperty('--msync-reserve', layout === 'inset' ? Math.round(root.offsetWidth + 12) + 'px' : '0px');
    const bar = toolbar && !toolbar.hidden ? toolbar.getBoundingClientRect() : null;
    const bottom = bar && bar.height ? (layout === 'inset' ? vp.bottom - bar.bottom : vp.bottom - bar.top + gap) : 24;
    root.style.left = layout === 'strip' ? left + 'px' : 'auto';root.style.right = right + 'px';root.style.bottom = bottom + 'px';
    sizeCanvas();
    const rect = root.getBoundingClientRect();
    const nextReserve = layout === 'inset' ? { right: Math.round(rect.width + 16), bottom: bar && bar.height ? Math.round(vp.bottom - bar.top + 8) : 0 } : { right: 0, bottom: Math.round(vp.bottom - rect.top + 6) };
    if (nextReserve.right !== reserve.right || nextReserve.bottom !== reserve.bottom) { reserve = nextReserve;onReserve?.(); }
  }
  function sizeCanvas() {
    if (!renderer) return;
    const w = Math.max(1, Math.round(figure.clientWidth)), h = Math.max(1, Math.round(figure.clientHeight));
    const size = renderer.getSize(new THREE.Vector2());
    if (size.x !== w || size.y !== h) { renderer.setSize(w, h, true);requestRender(); }
  }

  // phase state -> panel uniforms (pure function of time + selection)
  function phaseState() {
    if (!sample) return { items: [], current: null };
    const { current, neighbour, w } = sample;
    const a = phaseItems(current.phase, current.support), b = neighbour ? phaseItems(neighbour.phase, neighbour.support) : [];
    const fade = smooth(1 - 2 * w);
    const items = a.map(item => {
      const other = b.find(entry => entry.groupId === item.groupId);
      const kept = neighbour && w > 0 ? other && other.side === item.side && other.level === item.level : true;
      return { ...item, strength: kept ? 1 : fade };
    });
    return { items, current };
  }
  function applyState() {
    if (!uniforms) return;
    const { items } = phaseState(), list = [];
    const focus = selected && !items.some(item => item.groupId === selected) ? [{ groupId: selected, level: 'primary', side: 'both', strength: 1 }] : [];
    for (const item of [...items, ...focus]) {
      if (item.strength < .002) continue;
      const group = GROUP[item.groupId], panel = resolveGroup(item.groupId);if (!group || !panel) continue;
      // an open card keeps its own group bright and fades the rest back
      const dim = 1 - item.strength * (selected && selected !== item.groupId ? .22 : 1);
      // deep groups (rotator cuff, iliopsoas) are drawn hatched, as everywhere else in the app
      const level = panel.deep && item.level === 'primary' ? 'deep' : item.level;
      for (const muscle of panel.muscles) list.push({ muscle, level, side: item.side, colour: group.colour, dim });
    }
    const hash = list.map(entry => `${entry.muscle}${entry.level}${entry.side[0]}${entry.dim.toFixed(3)}`).join('|');
    if (hash === lastStateHash) return;lastStateHash = hash;
    setMuscleSelection(uniforms, list);requestRender();
  }

  // text
  function renderText(force = false) {
    const current = sample?.current;if (!current) return;
    const id = `${current.index}:${current.support}:${current.phase.id}`;
    if (id === phaseKey && !force) return;
    const changed = id !== phaseKey;phaseKey = id;
    const phase = current.phase;
    support.textContent = supportLabel(current.support);
    support.dataset.side = current.support;nameMain.textContent = phase.name;nameDetail.textContent = phase.detail;
    caption.textContent = phase.caption;
    chips.replaceChildren();
    for (const item of phaseItems(phase, current.support).filter(entry => entry.level === 'primary')) {
      const group = GROUP[item.groupId];if (!group) continue;
      const chip = el(document, 'button', 'msync-chip');chip.type = 'button';chip.setAttribute('role', 'listitem');
      chip.style.setProperty('--c', group.colour);chip.dataset.group = item.groupId;chip.setAttribute('aria-pressed', String(selected === item.groupId));
      chip.append(el(document, 'i', 'msync-swatch'), el(document, 'span', '', shortLabel(group.label)));
      // the side is already in the subline (右手支撑); keep it for screen readers and the tooltip
      const sideName = item.side === 'both' ? '' : item.side === 'left' ? '（左侧）' : '（右侧）';
      chip.setAttribute('aria-label', shortLabel(group.label) + sideName);chip.title = group.label + sideName;
      chip.addEventListener('click', () => openCard(item.groupId, { toggle: true }));
      chips.appendChild(chip);
    }
    if (changed && !win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) { text.classList.remove('msync-swap');void text.offsetWidth;text.classList.add('msync-swap'); }
    if (selected) fillCard(selected);
    root.setAttribute('aria-label', `同步发力肌群 · ${phase.name}`);
  }
  const shortLabel = label => label.replace(/（.*?）/g, '').split(' · ')[0];

  // card
  function fillCard(groupId) {
    const group = GROUP[groupId];if (!group) return;
    const current = sample?.current, item = current ? phaseItems(current.phase, current.support).find(entry => entry.groupId === groupId) : null;
    cardName.textContent = group.label;card.style.setProperty('--c', group.colour);
    cardMeta.textContent = [SECTION[group.section]?.short, item ? (item.level === 'primary' ? '本阶段主要' : '本阶段辅助') + ' · ' + SIDE_NAME[item.side] : '本阶段不是重点'].filter(Boolean).join(' · ');
    cardWhy.textContent = item?.why ?? '';cardWhy.hidden = !cardWhy.textContent;
    cardRole.textContent = group.role;
    cardNote.textContent = group.note ? '示意说明：' + group.note : '';cardNote.hidden = !group.note;
  }
  function openCard(groupId, { toggle = false } = {}) {
    if (!GROUP[groupId] || (toggle && selected === groupId)) { closeCard();return; }
    selected = groupId;fillCard(groupId);card.hidden = false;root.classList.add('msync-card-open');
    for (const chip of chips.children) chip.setAttribute('aria-pressed', String(chip.dataset.group === groupId));
    lastStateHash = '';applyState();
  }
  function closeCard() {
    selected = null;card.hidden = true;root.classList.remove('msync-card-open');
    for (const chip of chips.children) chip.setAttribute('aria-pressed', 'false');
    lastStateHash = '';applyState();
  }
  cardClose.addEventListener('click', closeCard);

  // tap the body -> the group under the finger
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function onTap(event) {
    if (!loaded) return;
    const rect = renderer.domElement.getBoundingClientRect(), half = rect.width / 2, x = event.clientX - rect.left, y = event.clientY - rect.top;
    const view = x < half ? 'front' : 'back', lx = view === 'front' ? x : x - half;
    ndc.set(lx / half * 2 - 1, 1 - y / rect.height * 2);raycaster.setFromCamera(ndc, cameras[view]);
    const hit = raycaster.intersectObjects(meshes, false)[0], found = hit ? muscleAt(hit.point) : null;
    if (!found) { closeCard();return; }
    const ids = FLARE_GROUPS.filter(group => resolveGroup(group.groupId)?.muscles.includes(found.id)).map(group => group.groupId);
    if (!ids.length) { closeCard();return; }
    const active = sample ? phaseItems(sample.current.phase, sample.current.support).map(item => item.groupId) : [];
    openCard(ids.find(id => active.includes(id)) ?? ids[0]);
  }

  // render
  function requestRender() { if (!frame && renderer && loaded && visible && !collapsed && !disposed) frame = win.requestAnimationFrame(draw); }
  // body 0..1.69 m, hands at |x| <= .45; the bottom 8% stays clear for the 正面/背面 labels
  function fit(camera, w, h) {
    const aspect = w / h, top = 1.76, bottom = -.17, halfH = (top - bottom) / 2, centre = (top + bottom) / 2;
    const scale = Math.max(1, .5 / (halfH * aspect));
    camera.left = -halfH * aspect * scale;camera.right = halfH * aspect * scale;
    camera.top = (top - centre) * scale;camera.bottom = (bottom - centre) * scale;
    camera.position.y = centre;camera.updateProjectionMatrix();
  }
  function draw() {
    frame = 0;if (!renderer || !loaded) return;renders++;
    const size = renderer.getSize(new THREE.Vector2()), half = Math.floor(size.x / 2);
    renderer.setScissorTest(true);
    for (const [view, x, w] of [['front', 0, half], ['back', half, size.x - half]]) {
      const camera = cameras[view], sign = view === 'front' ? 1 : -1;fit(camera, w, size.y);
      key.position.set(1.2 * sign, 2.2, 2.6 * sign);rim.position.set(-1.6 * sign, 1.2, -2.4 * sign);
      renderer.setViewport(x, 0, w, size.y);renderer.setScissor(x, 0, w, size.y);renderer.render(scene, camera);
    }
    renderer.setScissorTest(false);
  }

  // controls
  function setCollapsed(value) {
    collapsed = Boolean(value);root.classList.toggle('msync-collapsed', collapsed);
    collapse.setAttribute('aria-expanded', String(!collapsed));collapse.setAttribute('aria-label', collapsed ? '展开同步肌群' : '收起同步肌群');collapse.title = collapsed ? '展开' : '收起';
    try { storage()?.setItem(STORE_KEY, JSON.stringify({ collapsed })); } catch {}
    if (!collapsed && visible) { idle(loadModel);requestRender(); }
    win.requestAnimationFrame(measure);
  }
  collapse.addEventListener('click', () => setCollapsed(!collapsed));
  head.addEventListener('click', event => { if (collapsed && !event.target.closest('button')) setCollapsed(false); });
  expand.addEventListener('click', () => {
    const current = sample?.current;if (!current) return;
    const items = phaseItems(current.phase, current.support).map(item => ({ ...GROUP[item.groupId], level: item.level, side: item.side, role: item.why || GROUP[item.groupId]?.role }))
      .filter(item => item.groupId).sort((a, b) => FLARE_SECTIONS.findIndex(x => x.id === a.section) - FLARE_SECTIONS.findIndex(x => x.id === b.section)); // one heading per role
    onOpenViewer?.({ title: `${current.phase.name} · ${current.phase.detail}`, subtitle: `${supportLabel(current.support)} · 第 ${String(current.phase.source).padStart(2, '0')} 步`, items, sections: FLARE_SECTIONS });
  });
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => measure()) : null;
  observer?.observe(viewport);if (toolbar) observer?.observe(toolbar);observer?.observe(figure);
  setCollapsed(collapsed);

  return {
    /** sequence: the merged sequence the viewer plays; motion: viewer.motion (smooth-loop detection). */
    setSequence(sequence, motion) {
      const period = Number(sequence?.period) || 9;
      const smoothLoop = (motion?.getLoopTimeScale?.(period * .995) ?? 1) > 1.5;
      timeline = phaseTimeline(sequence, { smooth: smoothLoop });phaseKey = '';this.update(time, true);
    },
    update(nextTime, force = false) {
      time = Number(nextTime) || 0;sample = samplePhase(timeline, time);
      if (!visible && !force) return;renderText(force);applyState();
    },
    setVisible(value) {
      const next = Boolean(value);if (next === visible) return;
      visible = next;root.hidden = !visible;
      if (visible) { root.dataset.layout = layout;measure();renderText(true);applyState();if (!collapsed) idle(loadModel);requestRender(); }
      else { reserve = { right: 0, bottom: 0 };document.documentElement.style.setProperty('--msync-reserve', '0px');onReserve?.(); }
    },
    reserve: () => (visible ? { ...reserve } : { right: 0, bottom: 0 }),
    relayout: () => measure(),
    getState: () => ({ visible, collapsed, layout, loaded, failed, time, selected, renders, reserve: { ...reserve },
      phase: sample?.current ? { source: sample.current.phase.source, id: sample.current.phase.id, name: sample.current.phase.name, support: sample.current.support, index: sample.current.index } : null,
      fade: sample?.neighbour ? { toward: sample.neighbour.phase.source, w: sample.w } : null,
      lit: phaseState().items.filter(item => item.strength > .002).map(item => ({ group: item.groupId, level: item.level, side: item.side, strength: +item.strength.toFixed(3) })) }),
    openCard, closeCard, setCollapsed, root,
    dispose() {
      disposed = true;observer?.disconnect();if (frame) win.cancelAnimationFrame(frame);
      for (const mesh of meshes) { mesh.geometry.dispose();mesh.material.dispose(); }
      renderer?.dispose();root.remove();
    },
  };
}
