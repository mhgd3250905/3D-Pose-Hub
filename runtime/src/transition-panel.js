import { Euler, Quaternion, MathUtils } from 'three';
import { createTransitionEdits, loadTransitionEdits, saveTransitionEdits, validateTransitionEdits, transitionOptions } from './transition-edits.js';

const clone = value => structuredClone(value);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = value => Math.min(1, Math.max(0, value));
const near = (a, b) => Math.abs(a - b) < 1e-8;

export function createTransitionPanel({ viewer, panel, shelf, sequence, storage, notify, refreshIcons, onApply, onEnter, onExit }) {
  let source = clone(sequence), document = read(source), segment = 0, at = .5;
  let active = false, previewing = false, animation = null, lastTick = null, dirty = false, applying = false;
  let poseHistory = [], documentHistory = [], dragStart = null, pointName = '', previewSpeed = .25, previewClock = 0, persisted = true;
  const $ = selector => panel.querySelector(selector);
  const global = selector => globalThis.document.querySelector(selector);
  const currentPose = () => viewer.motion.capturePose();
  const duration = () => source.period / source.steps.length;
  const segmentCount = () => source.steps.length - (JSON.stringify(source.steps[0].pose) === JSON.stringify(source.steps.at(-1).pose) ? 1 : 0);
  const number = index => String(source.steps[index]?.sourceStepNumber ?? index + 1).padStart(2, '0');
  const range = index => `${number(index)} → ${number((index + 1) % source.steps.length)}`;
  const pointAt = () => document.points.find(point => point.segment === segment && near(point.at, at));

  function read(base) {
    try { return loadTransitionEdits(base, storage()); }
    catch (error) { notify(error.message); return createTransitionEdits(base); }
  }
  function persist(next) {
    try { const saved=saveTransitionEdits(next, source, storage());persisted=true;return saved; }
    catch (error) { persisted=false;notify(`${error.message} 当前调整仍在页面中，可导出备份。`); return clone(next); }
  }
  function applyDocument(next, { remember = true } = {}) {
    const validated = validateTransitionEdits(next, source);
    onApply(transitionOptions(validated));
    if (remember) { documentHistory.push(clone(document)); if (documentHistory.length > 30) documentHistory.shift(); }
    document = persist(validated);
    renderShelf();
    refresh();
  }
  function saveDraft() {
    document = persist({ ...document, draft: { segment, at, name: pointName, pose: clone(currentPose()) } });
    if (active) renderShelf();
  }
  function checkpoint(pose = currentPose()) {
    poseHistory.push(clone(pose));
    if (poseHistory.length > 50) poseHistory.shift();
  }
  function markChanged() {
    dirty = true;
    saveDraft();
    refresh();
  }

  function refreshPosition() {
    if (!active || !$('#transition-scrub')) return;
    $('#transition-scrub').value = String(at);
    if (globalThis.document.activeElement !== $('#transition-percent')) $('#transition-percent').value = String(Number((at * 100).toFixed(2)));
    $('#transition-position-label').textContent = `${(at * 100).toFixed(1)}% · ${(segment * duration() + at * duration()).toFixed(2)} s`;
    $('#transition-title').textContent = `第 ${range(segment)} 步`;
    $('#transition-play').textContent = previewing ? '暂停这一段' : '循环预览这一段';
    $('#transition-play').setAttribute('aria-pressed', String(previewing));
    const endpoint = at <= 0 || at >= 1;
    $('#transition-save').disabled = previewing || endpoint;
    $('#transition-save').textContent = pointAt() ? '更新这个关键帧 · K' : '保存关键帧 · K';
    $('#transition-edit-state').textContent = previewing ? '预览已保存的过渡。暂停后可以继续调整。'
      : endpoint ? '这是你已保存的关键姿势。拖到两步之间再调整。'
        : dirty ? '已暂存当前调整。按 K 保存后，两侧过渡会重新生成。'
          : pointAt() ? '已保存的关键帧，两侧自动补帧。可以继续微调，再按 K 更新。' : '停在出错的画面，调整肘、膝或其他部位，然后按 K 保存。';
    for (const button of shelf.querySelectorAll('[data-transition-segment]')) {
      const selected = Number(button.dataset.transitionSegment) === segment;
      button.classList.toggle('active', selected);button.setAttribute('aria-pressed', String(selected));
    }
    for (const button of shelf.querySelectorAll('[data-transition-point]')) button.classList.toggle('active', button.dataset.transitionPoint === pointAt()?.id);
    globalThis.document.querySelector('#viewer-overline').textContent = 'TRANSITION WORKSHOP';
    globalThis.document.querySelector('#viewer-label').textContent = `${range(segment)} · ${(at * 100).toFixed(1)}%`;
    globalThis.document.querySelector('#viewer-subtitle').textContent = '原有关键姿势保留，只修正这段过渡。';
    global('#transition-global-label').textContent = `${range(segment)} · ${(segment * duration() + at * duration()).toFixed(2)} s${dirty ? ' · 当前调整已暂存' : ''}`;
    global('#transition-global-scrub').max = String(segmentCount() * duration());
    global('#transition-global-scrub').value = String((segment + at) * duration());
    global('#transition-global-play').textContent = previewing ? '暂停' : '预览';
    global('#transition-keyframe-button').disabled = previewing || endpoint;
    global('#transition-keyframe-button').textContent = pointAt() ? '更新关键帧 · K' : '保存关键帧 · K';
  }

  function samplePosition({ draft = true } = {}) {
    applying = true;
    try {
      const time = (segment + at) * duration();
      viewer.setTime(time);viewer.motion.update(time);
      const savedDraft = document.draft;
      const restore = draft && !previewing && savedDraft?.segment === segment && near(savedDraft.at, at);
      if (restore) viewer.motion.applyPose(savedDraft.pose);
      if (!previewing) pointName = restore ? savedDraft.name || '' : pointAt()?.name || '';
      dirty = Boolean(restore);
      viewer.poseEditor.refresh();viewer.poseEditor.setEnabled(!previewing && at > 0 && at < 1);viewer.dirty = true;
    } finally { applying = false; }
    refresh();
  }
  function pause() {
    previewing = false;lastTick = null;
    if (animation !== null) cancelAnimationFrame(animation);
    animation = null;
    if (active) viewer.poseEditor.setEnabled(at > 0 && at < 1);
    refresh();
  }
  function locate(index, progress = .5, { draft = true } = {}) {
    pause();segment = Math.min(segmentCount() - 1, Math.max(0, index));at = clamp(progress);
    poseHistory = [];samplePosition({ draft });renderShelf();
  }
  function previewTick(tick) {
    if (!active || !previewing) return;
    const previousSegment = segment;
    if (lastTick !== null) {
      const elapsed = Math.min(.08, (tick - lastTick) / 1000) * previewSpeed;
      if (global('#transition-preview-scope').value === 'loop') {
        previewClock = (previewClock + elapsed) % source.period;
        const coordinate = previewClock / duration();segment = Math.min(segmentCount() - 1, Math.floor(coordinate));at = clamp(coordinate - segment);
      } else at = (at + elapsed / duration()) % 1;
    }
    lastTick = tick;samplePosition({ draft: false });
    if (previousSegment !== segment) renderShelf();
    animation = requestAnimationFrame(previewTick);
  }
  function togglePreview() {
    if (previewing) { pause();return; }
    if (dirty) { saveDraft();notify('当前调整已暂存；预览采用已保存的修正点。'); }
    previewing = true;poseHistory = [];at = 0;previewClock = global('#transition-preview-scope').value === 'loop' ? 0 : segment * duration();if(global('#transition-preview-scope').value === 'loop')segment=0;lastTick = null;viewer.playing = false;
    viewer.poseEditor.setEnabled(false);refresh();
    animation = requestAnimationFrame(previewTick);
  }

  function renderShelf() {
    if (!active) return;
    const points = document.points.filter(point => point.segment === segment).sort((a, b) => a.at - b.at);
    shelf.innerHTML = `<div class="presets-heading"><h3>选择一段过渡</h3><span>${segmentCount()} 段</span></div>
      <p class="presets-copy">每个 K 帧都会参与两侧补帧，可继续添加关键姿势指定路线。</p>
      <div class="transition-segments">${Array.from({ length: segmentCount() }, (_, index) => `<button data-transition-segment="${index}" aria-pressed="${index === segment}" class="${index === segment ? 'active' : ''}"><strong>${range(index)}</strong><span>${document.points.filter(point => point.segment === index).length} 个修正点</span></button>`).join('')}</div>
      <div class="presets-heading transition-points-heading"><h3>这一段的修正点</h3><span>${points.length}</span></div>
      ${points.length ? `<div class="transition-points">${points.map(point => `<div class="transition-point"><button data-transition-point="${escape(point.id)}"><strong>${(point.at * 100).toFixed(1)}%</strong><span>${escape(point.name || '过渡修正')}</span></button><button data-transition-remove="${escape(point.id)}" aria-label="移除 ${(point.at * 100).toFixed(1)}% 修正点" title="移除修正点">×</button></div>`).join('')}</div>` : '<p class="pose-note">还没有修正点。可从 25%、50%、75% 开始检查。</p>'}
      ${document.draft ? '<button class="focus-button" id="transition-return-draft">回到暂存的调整</button>' : ''}
      <button class="focus-button" id="transition-watch-loop">查看完整循环</button>`;
    for (const button of shelf.querySelectorAll('[data-transition-segment]')) button.addEventListener('click', () => locate(Number(button.dataset.transitionSegment)));
    for (const button of shelf.querySelectorAll('[data-transition-point]')) button.addEventListener('click', () => {
      const point = document.points.find(item => item.id === button.dataset.transitionPoint);if (point) locate(point.segment, point.at);
    });
    for (const button of shelf.querySelectorAll('[data-transition-remove]')) button.addEventListener('click', () => {
      pause();const next = clone(document);next.points = next.points.filter(point => point.id !== button.dataset.transitionRemove);
      delete next.draft;applyDocument(next);samplePosition({ draft: false });notify('修正点已移除，可撤销这次修改。');
    });
    shelf.querySelector('#transition-return-draft')?.addEventListener('click', () => locate(document.draft.segment, document.draft.at));
    shelf.querySelector('#transition-watch-loop').addEventListener('click', onExit);
    renderMarkers();
    refreshPosition();
  }

  function seekTime(time) {
    if (!Number.isFinite(time)) return;
    const coordinate = Math.min(segmentCount(), Math.max(0, time / duration()));
    const index = Math.min(segmentCount() - 1, Math.floor(coordinate));locate(index, clamp(coordinate - index));
  }
  function stepFrame(direction) { seekTime((segment + at) * duration() + direction / 60); }
  function renderMarkers() {
    const endTime = segmentCount() * duration(), markers = global('#transition-global-markers');
    const fixed = source.steps.slice(0, segmentCount() + 1).map((step, index) => `<button class="transition-fixed-key" style="left:${index * duration() / endTime * 100}%" data-transition-fixed="${index}" aria-label="原第 ${number(index)} 步关键姿势" title="原第 ${number(index)} 步 · ${(index * duration()).toFixed(2)} s"></button>`);
    const edited = document.points.filter(point => point.segment < segmentCount()).map(point => `<button class="transition-edited-key" style="left:${(point.segment + point.at) * duration() / endTime * 100}%" data-transition-marker="${escape(point.id)}" aria-label="过渡关键帧 ${escape(point.name || '')}" title="${escape(point.name || '过渡关键帧')} · ${((point.segment + point.at) * duration()).toFixed(2)} s"></button>`);
    markers.innerHTML = [...fixed, ...edited].join('');
    for (const button of markers.querySelectorAll('[data-transition-fixed]')) button.addEventListener('click', () => seekTime(Number(button.dataset.transitionFixed) * duration()));
    for (const button of markers.querySelectorAll('[data-transition-marker]')) button.addEventListener('click', () => {
      const point = document.points.find(item => item.id === button.dataset.transitionMarker);if (point) locate(point.segment, point.at);
    });
  }

  function render() {
    if (!active) return;
    panel.innerHTML = `<div class="detail-kicker"><span>TRANSITION WORKSHOP</span><span>EDIT</span></div>
      <h2 id="transition-title" class="detail-title"></h2>
      <p class="detail-copy pose-intro">摆好关键姿势后按 K，前后过渡自动重建。哪里路线不对，再补一个关键姿势。</p>
      <div class="pose-field"><label for="transition-interpolation">关键帧之间自动补帧</label><select id="transition-interpolation" aria-label="关键帧补帧方式"><option value="linear">线性 · 匀速</option><option value="smooth">平滑 · 缓入缓出</option></select></div>
      <p class="pose-note">线性决定过渡速度；四肢路线在下方单独选择。</p>
      <details class="transition-time-details"><summary>精确段内位置与慢放</summary><div class="transition-timeline"><div class="timeline-label"><span>段内位置</span><output id="transition-position-label"></output></div><input id="transition-scrub" type="range" min="0" max="1" step="0.001" aria-label="过渡段内时间轴"/>
      <div class="transition-position-controls"><button id="transition-prev-frame" aria-label="过渡前一帧">← 一帧</button><label><input id="transition-percent" type="number" min="0" max="100" step="0.1" aria-label="过渡位置百分比"/> %</label><button id="transition-next-frame" aria-label="过渡后一帧">一帧 →</button></div>
      <div class="transition-preview"><button id="transition-play" aria-pressed="false">循环预览这一段</button><select id="transition-speed" aria-label="过渡预览速度"><option value="0.1">0.1×</option><option value="0.25" selected>0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option></select></div></div></details>
      <p class="pose-note" id="transition-edit-state" aria-live="polite"></p>
      <div class="pose-field"><label for="transition-handle">调整部位</label><select id="transition-handle" aria-label="过渡调整部位"></select></div>
      <p class="pose-note" id="transition-handle-note"></p>
      <fieldset class="pose-values"><legend>位置 <span>厘米</span></legend>${['左右 X', '高度 Y', '前后 Z'].map((label, i) => `<label>${label}<input type="number" step="1" id="transition-pos-${i}" aria-label="过渡${label}位置，厘米"/></label>`).join('')}</fieldset>
      <fieldset class="pose-values"><legend>角度 <span>度</span></legend>${['X', 'Y', 'Z'].map((label, i) => `<label>${label}<input type="number" step="5" id="transition-rot-${i}" aria-label="过渡${label}角度，度"/></label>`).join('')}</fieldset>
      <div class="pose-locks"><label><input id="transition-left-lock" type="checkbox"/>左手固定</label><label><input id="transition-right-lock" type="checkbox"/>右手固定</label><label><input id="transition-ground-lock" type="checkbox"/>脚不穿地</label></div>
      <div class="pose-tools"><button id="transition-undo-pose">撤销姿势调整</button><button id="transition-fit">看全身</button></div>
      <p class="pose-note" id="transition-constraint"></p>
      <div class="detail-section pose-save"><h3>保存这段的中间姿势</h3><label class="pose-field"><span>关键帧名称（可选）</span><input id="transition-name" maxlength="80" placeholder="例如：左膝向外，腿保持伸直" aria-label="过渡修正名称"/></label><button class="focus-button transition-save" id="transition-save">保存关键帧 · K</button><button class="focus-button" id="transition-undo-document">撤销过渡修改</button><p class="pose-note">保存后自动用于完整播放。原始关键姿势、个人步骤和草稿保留。</p></div>
      <details class="transition-settings"><summary>路线与启用设置</summary><label class="pose-field"><span>四肢过渡路线</span><select id="transition-leg-path" aria-label="四肢过渡路线"><option value="arc">沿关键姿态 · 推荐</option><option value="linear">原直线 · 对照</option></select></label><div class="pose-locks"><label><input id="transition-enabled" type="checkbox"/>启用过渡调整</label></div></details>
      <div class="pose-file-actions"><button id="transition-export">导出过渡 JSON</button><button id="transition-import">导入过渡 JSON</button><input id="transition-import-file" type="file" accept=".json,application/json" hidden/></div>`;
    $('#transition-handle').innerHTML = viewer.motion.getEditableHandles().map(handle => `<option value="${handle.id}">${escape(handle.label)}</option>`).join('');
    $('#transition-scrub').addEventListener('input', event => locate(segment, Number(event.target.value)));
    $('#transition-percent').addEventListener('change', event => { if (event.target.value.trim() && Number.isFinite(Number(event.target.value))) locate(segment, Number(event.target.value) / 100);else refresh(); });
    $('#transition-prev-frame').addEventListener('click', () => locate(segment, at - 1 / (60 * duration())));
    $('#transition-next-frame').addEventListener('click', () => locate(segment, at + 1 / (60 * duration())));
    $('#transition-play').addEventListener('click', togglePreview);
    $('#transition-speed').value = String(previewSpeed);
    $('#transition-speed').addEventListener('change', event => { previewSpeed=Number(event.target.value);global('#transition-global-speed').value=String(previewSpeed); });
    $('#transition-handle').addEventListener('change', event => viewer.poseEditor.select(event.target.value));
    $('#transition-name').addEventListener('input', event => { pointName = event.target.value; });
    for (let i = 0; i < 3; i++) {
      $('#transition-pos-' + i).addEventListener('change', () => edit(() => {
        const values = [0, 1, 2].map(axis => Number($('#transition-pos-' + axis).value) / 100);
        if (!values.every(Number.isFinite)) throw new Error('请输入有效位置。');
        viewer.poseEditor.setValue({ position: values });
      }));
      $('#transition-rot-' + i).addEventListener('change', () => edit(() => {
        const angles = [0, 1, 2].map(axis => MathUtils.degToRad(Number($('#transition-rot-' + axis).value)));
        if (!angles.every(Number.isFinite)) throw new Error('请输入有效角度。');
        viewer.poseEditor.setValue({ quaternion: new Quaternion().setFromEuler(new Euler(...angles, 'YXZ')).toArray() });
      }));
    }
    for (const side of ['left', 'right']) $('#transition-' + side + '-lock').addEventListener('change', event => edit(() => {
      const pose = currentPose();pose.limbs[side].handLocked = event.target.checked;viewer.motion.applyPose(pose);viewer.poseEditor.refresh();
    }));
    $('#transition-ground-lock').addEventListener('change', event => edit(() => {
      const pose = currentPose();pose.groundLock = event.target.checked;viewer.motion.applyPose(pose);viewer.poseEditor.refresh();
    }));
    $('#transition-undo-pose').addEventListener('click', undoPose);
    $('#transition-fit').addEventListener('click', () => viewer.resetView());
    $('#transition-save').addEventListener('click', savePoint);
    $('#transition-undo-document').addEventListener('click', () => {
      pause();const previous = documentHistory.pop();if (!previous) return;
      applyDocument(previous, { remember: false });samplePosition();notify('已撤销上一次过渡修改。');
    });
    $('#transition-leg-path').addEventListener('change', event => {
      const path=event.target.value;pause();const next = { ...clone(document), legPath: path, enabled: true };
      applyDocument(next);samplePosition();
    });
    $('#transition-interpolation').addEventListener('change', event => {
      const interpolation = event.target.value;pause();
      applyDocument({ ...clone(document), interpolation, enabled: true });samplePosition();
      if (persisted) notify(interpolation === 'linear' ? '已改为线性补帧，相邻关键帧之间按时间匀速过渡。' : '已改为平滑补帧，原步骤之间缓入缓出。');
    });
    $('#transition-enabled').addEventListener('change', event => {
      const enabled=event.target.checked;pause();applyDocument({ ...clone(document), enabled });samplePosition({ draft: false });
    });
    $('#transition-export').addEventListener('click', () => {
      if (dirty) saveDraft();
      const url = URL.createObjectURL(new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' }));
      const link = globalThis.document.createElement('a');link.href = url;link.download = `flare-transitions-${Date.now()}.json`;link.click();setTimeout(() => URL.revokeObjectURL(url), 30000);
      notify('过渡修正已导出，可用这份 JSON 备份或换浏览器恢复。');
    });
    $('#transition-import').addEventListener('click', () => $('#transition-import-file').click());
    $('#transition-import-file').addEventListener('change', async event => {
      const file = event.target.files[0];if (!file) return;
      try { pause();if(file.size>2*1024*1024)throw new Error('请选择 2 MB 以内的过渡 JSON。');const next = validateTransitionEdits(JSON.parse(await file.text()), source);applyDocument(next);if(active)samplePosition();if(persisted)notify('过渡修正已导入，可撤销此次导入。'); }
      catch (error) { notify(error.message); }
      finally { event.target.value = ''; }
    });
    renderShelf();refresh();refreshIcons();
  }

  function edit(action) {
    if (previewing || at <= 0 || at >= 1) return;
    const previous = currentPose();applying = true;
    try { action();checkpoint(previous);markChanged(); }
    catch (error) { viewer.motion.applyPose(previous);viewer.poseEditor.refresh();notify(error.message);refresh(); }
    finally { applying = false; }
  }
  function undoPose() {
    if (previewing || !poseHistory.length) return;
    const previous = poseHistory.pop();applying = true;
    try { viewer.motion.applyPose(previous);viewer.poseEditor.refresh();markChanged(); }
    finally { applying = false; }
  }
  function savePoint() {
    if (previewing || at <= 0 || at >= 1) return;
    const previous = pointAt();if (!previous && document.points.length >= 200) { notify('最多保存 200 个修正点，请先导出或整理。');return; }
    const next = clone(document), point = { id: previous?.id || crypto.randomUUID(), segment, at, name: pointName.trim() || `${range(segment)} · ${(at * 100).toFixed(1)}%`, pose: clone(currentPose()) };
    const index = next.points.findIndex(item => item.id === point.id);
    if (index < 0) next.points.push(point);else next.points[index] = point;
    next.enabled = true;delete next.draft;
    try{
      applyDocument(next);dirty = false;samplePosition({ draft: false });
      const points = document.points.filter(item => item.segment === segment).sort((a, b) => a.at - b.at);
      const index = points.findIndex(item => item.id === point.id);
      const from = (segment + (points[index - 1]?.at ?? 0)) * duration();
      const to = (segment + (points[index + 1]?.at ?? 1)) * duration();
      notify(persisted ? `关键帧已保存，${from.toFixed(2)}–${to.toFixed(2)} 秒的两侧过渡已更新。` : '关键帧已用于当前页面播放，浏览器保存失败，请导出 JSON 备份。');
    }
    catch(error){notify(error.message);}
  }

  function refresh() {
    if (!active || !$('#transition-handle')) return;
    const state = viewer.poseEditor.getState(), pose = currentPose(), locked = previewing || at <= 0 || at >= 1;
    $('#transition-handle').value = state.selected || 'pelvis';
    $('#transition-handle').disabled = previewing;
    $('#transition-handle-note').textContent = state.selected?.endsWith('Knee') || state.selected?.endsWith('Elbow')
      ? '先移动关节圆点调整弯曲方向；旋转会带动小腿或前臂。' : state.selected === 'waist' ? '腰部可独立弯腰、扭腰和侧弯。' : '拖动彩色轴或旋转环，也可以输入数值微调。';
    const rotation = new Euler().setFromQuaternion(new Quaternion().fromArray(state.quaternion || [0, 0, 0, 1]), 'YXZ');
    for (let i = 0; i < 3; i++) {
      const pos = $('#transition-pos-' + i), rot = $('#transition-rot-' + i);
      if (globalThis.document.activeElement !== pos) pos.value = ((state.position?.[i] || 0) * 100).toFixed(1);
      if (globalThis.document.activeElement !== rot) rot.value = MathUtils.radToDeg([rotation.x, rotation.y, rotation.z][i]).toFixed(1);
      pos.disabled = locked;rot.disabled = locked || !state.canRotate;
    }
    for (const side of ['left', 'right']) { $('#transition-' + side + '-lock').checked = pose.limbs[side].handLocked;$('#transition-' + side + '-lock').disabled = locked; }
    $('#transition-ground-lock').checked = pose.groundLock;$('#transition-ground-lock').disabled = locked;
    $('#transition-enabled').checked = document.enabled;$('#transition-leg-path').value = document.legPath;$('#transition-interpolation').value = document.interpolation;
    $('#transition-undo-pose').disabled = !poseHistory.length || previewing;
    $('#transition-undo-document').disabled = !documentHistory.length;
    $('#transition-constraint').textContent = state.error || viewer.motion.getMetrics().warnings[0] || '左右指人物本人；四肢保持原有长度。';
    for (const button of globalThis.document.querySelectorAll('[data-pose-operation]')) {
      button.classList.toggle('active', button.dataset.poseOperation === state.mode);button.disabled = locked || (button.dataset.poseOperation === 'rotate' && !state.canRotate);
    }
    if (globalThis.document.activeElement !== $('#transition-name')) $('#transition-name').value = pointName;
    refreshPosition();viewer.dirty = true;
  }
  function onChange(event = {}) {
    if (!active || applying || previewing || at <= 0 || at >= 1) return;
    if (event.phase === 'start') { dragStart = clone(currentPose());return; }
    if (event.phase === 'end' && dragStart) { checkpoint(dragStart);dragStart = null; }
    dirty = true;
    if (event.phase === 'end' || event.phase === 'commit') saveDraft();
    refresh();
  }
  function enter() {
    active = true;viewer.playing = false;
    const coordinate = viewer.time / duration();
    segment = Math.min(segmentCount() - 1, Math.floor(coordinate));at = clamp(coordinate - segment);
    poseHistory = [];render();samplePosition();onEnter?.();
  }
  function leave() { if(!active)return;pause();if (dirty) saveDraft();active = false;dirty = false; }
  function setSequence(next) {
    leave();source = clone(next);document = read(source);documentHistory = [];poseHistory = [];segment = 0;at = .5;
    onApply(transitionOptions(document));
  }
  global('#transition-global-scrub').addEventListener('input', event => seekTime(Number(event.target.value)));
  global('#transition-global-prev').addEventListener('click', () => stepFrame(-1));
  global('#transition-global-next').addEventListener('click', () => stepFrame(1));
  global('#transition-global-play').addEventListener('click', togglePreview);
  global('#transition-keyframe-button').addEventListener('click', savePoint);
  global('#transition-preview-scope').addEventListener('change', pause);
  global('#transition-global-speed').addEventListener('change', event => { previewSpeed=Number(event.target.value);if($('#transition-speed'))$('#transition-speed').value=String(previewSpeed); });
  return { enter, leave, render, refresh, onChange, togglePreview, undoPose, setSequence, savePoint, stepFrame,
    options: () => transitionOptions(document), getDocument: () => clone(document),
    getState: () => ({ active, previewing, segment, at, dirty, points: document.points.length, enabled: document.enabled, legPath: document.legPath, interpolation: document.interpolation }) };
}
