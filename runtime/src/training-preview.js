import { Box3, Vector3 } from 'three';
import { createTrainingClip, TRAINING_CLIP_IDS } from './training-motion.js';

const supported = training => Boolean(training && TRAINING_CLIP_IDS.includes(training.animationId));
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function trainingRegions(id) {
  const paired = kinds => kinds.flatMap(([kind, group]) => ['left', 'right'].map(side => ({ id: `${kind}-${side}`, kind, group, side })));
  const core = { id: 'training-core', kind: 'core', group: 'core', side: 'both', color: 0xff968f };
  if (id === 'straddleLift') return [...paired([['hipFlexor', 'hipFlexors'], ['quad', 'hipFlexors']]), core];
  if (id === 'hipOpening') return [...paired([['glute', 'glutes'], ['adductor', 'adductors'], ['quad', 'hipFlexors']]), core];
  return [...paired([['shoulder', 'shoulders'], ['upperArm', 'arms'], ['scapular', 'scapular']]), core,
    ...(id === 'rearSupport' ? paired([['glute', 'glutes']]) : [])];
}

/** An in-canvas exercise preview with its own clock. Authored Flare data and
 * transport stay attached; returning restores the exact observing position.
 */
export function createTrainingPreview({ viewer, viewport, refreshIcons, onChanged }) {
  const document = viewport.ownerDocument;
  const root = document.createElement('section');root.className = 'movement-training-preview';root.hidden = true;
  root.setAttribute('aria-label', '当前动作的训练示范');
  root.innerHTML = `<div class="mtp-heading"><button class="mtp-return" type="button"><i data-lucide="arrow-left"></i><span>回到托马斯</span></button><span class="mtp-context"></span><h2 class="mtp-title"></h2><p class="mtp-goal"></p></div>
    <div class="mtp-bottom"><p class="mtp-live-cue" aria-live="off"></p><div class="mtp-controls"><button class="mtp-play" type="button" aria-label="暂停训练示范"><i data-lucide="pause"></i></button><input class="mtp-progress" type="range" min="0" max="1" step="0.005" value="0" aria-label="训练示范进度"><select class="mtp-speed" aria-label="训练示范速度"><option value="0.5">慢放</option><option value="1" selected>正常</option></select><button class="mtp-notes-toggle" type="button" aria-expanded="false">练习要点</button></div>
    <div class="mtp-notes" hidden><p class="mtp-description"></p><ul class="mtp-compare"></ul><ol class="mtp-steps"></ol><p class="mtp-caution">动作示意；在自己能控制的范围内练习。</p><a href="/movement-teaching.md" target="_blank" rel="noopener">查看动作与训练依据</a></div><div class="mtp-alternatives" aria-label="相关训练"></div></div>`;
  viewport.appendChild(root);
  const $ = selector => root.querySelector(selector);
  const listeners = [];
  const listen = (node, event, handler) => { node.addEventListener(event, handler);listeners.push(() => node.removeEventListener(event, handler)); };
  let active = false, original = null, clip = null, current = null, proposal = null;
  let time = 0, speed = 1, playing = true, lastCue = null, segment = null;

  function fitInterface() {
    if (!active || !original) return;
    const bounds = viewport.getBoundingClientRect(), heading = $('.mtp-heading').getBoundingClientRect(), bottom = $('.mtp-bottom').getBoundingClientRect();
    viewer.setFramingInsets({ ...viewer.framingInsets,
      top: bounds.width <= 700 ? Math.max(original.insets.top ?? 0, heading.bottom - bounds.top + 16) : original.insets.top ?? 0,
      bottom: Math.max(original.insets.bottom ?? 0, bounds.bottom - bottom.top + 16) });
  }

  function syncPlay() {
    $('.mtp-play').innerHTML = `<i data-lucide="${playing ? 'pause' : 'play'}"></i>`;
    $('.mtp-play').setAttribute('aria-label', playing ? '暂停训练示范' : '播放训练示范');refreshIcons?.();
  }
  function remember() {
    return { time: viewer.time, playing: viewer.playing, speed: viewer.speed,
      playbackRange: viewer.playbackRange ? { ...viewer.playbackRange } : null,
      position: viewer.camera.position.clone(), quaternion: viewer.camera.quaternion.clone(), up: viewer.camera.up.clone(),
      target: viewer.controls.target.clone(), frame: viewer.frame ? { box: viewer.frame.box.clone(), padding: viewer.frame.padding } : null,
      maxDistance: viewer.controls.maxDistance, minDistance: viewer.controls.minDistance,
      insets: { ...viewer.framingInsets } };
  }
  function trainingFrame() {
    if (!clip) return;
    viewer.motion.applyPose(clip.sample(time), clip.applyOptions);
    const info = clip.describe(time);
    const shortTask = { scapPush: '肘受控伸长', supportShift: '肩与髋一起移动', straddleLift: '从髋抬整条长腿',
      rearSupport: '脚辅助，保持支撑空间', hipOpening: '膝和脚随髋一起转' }[clip.id];
    const nextCue = `${info.phase} · ${shortTask}`;
    if (nextCue !== lastCue) { $('.mtp-live-cue').textContent = nextCue;lastCue = nextCue; }
    $('.mtp-progress').value = String(time / clip.period);
    viewer.dirty = true;
  }
  function frameClip() {
    fitInterface();
    const data = viewer.motion.getMetrics().bounds;
    let box = new Box3(new Vector3().fromArray(data.min), new Vector3().fromArray(data.max));
    if (clip.framingBounds?.min && clip.framingBounds?.max) box.union(new Box3(
      new Vector3().fromArray(clip.framingBounds.min), new Vector3().fromArray(clip.framingBounds.max)));
    box.expandByScalar(.05);
    // A side-oblique view makes hand contact and shoulder/hip movement visible.
    const direction = clip.id === 'straddleLift' || clip.id === 'hipOpening' ? new Vector3(.4, .65, 1)
      : new Vector3(1, .58, .85);
    viewer.fitBounds(box, direction, 1.2);
  }
  function choose(training) {
    if (!supported(training)) return false;
    clip = createTrainingClip(training.animationId, { rigData: viewer.rigData, motion: viewer.motion });
    current = training;time = 0;playing = true;lastCue = null;
    $('.mtp-title').textContent = training.title;
    $('.mtp-goal').textContent = training.goal;
    $('.mtp-description').textContent = training.description;
    $('.mtp-compare').innerHTML = (training.compare ?? proposal.compare ?? []).slice(0, 2).map(text => `<li>${escape(text)}</li>`).join('');
    $('.mtp-steps').innerHTML = (training.steps ?? []).map(text => `<li>${escape(text)}</li>`).join('');
    $('.mtp-notes').hidden = true;$('.mtp-notes-toggle').setAttribute('aria-expanded', 'false');
    $('.mtp-notes-toggle').textContent = '练习要点';$('.mtp-bottom').dataset.notesOpen = 'false';
    trainingFrame();frameClip();
    const metrics = viewer.motion.getMetrics();
    viewer.movementGuide.setData({ startTime: 0, endTime: metrics.period, frames: [
      { time: 0, joints: metrics.joints }, { time: metrics.period, joints: metrics.joints },
    ] });
    viewer.movementGuide.setAnnotations({ regions: trainingRegions(clip.id), cues: [] });
    viewer.movementGuide.setFocus(segment?.slot === 'core-coordination' ? 'core' : null);
    viewer.movementGuide.setVisible({ enabled: true, paths: false, regions: true,
      support: clip.id !== 'straddleLift' && clip.id !== 'hipOpening' });
    syncPlay();onChanged?.({ active, training, context: segment });return true;
  }
  function open(nextProposal, context = {}) {
    const options = [nextProposal?.primary, ...(nextProposal?.alternatives ?? [])].filter(supported);
    if (!options.length) return false;
    if (!active) { original = remember();active = true;viewer.playing = false; }
    proposal = nextProposal;segment = context;
    root.hidden = false;root.dataset.exercise = options[0].animationId;
    $('.mtp-context').textContent = context.profile?.title ?? nextProposal.stageTitle ?? '托马斯专项基础';
    $('.mtp-alternatives').innerHTML = options.length > 1 ? options.map((item, index) => `<button type="button" data-training-choice="${index}">${escape(item.title)}</button>`).join('') : '';
    $('.mtp-alternatives').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      const next = options[Number(button.dataset.trainingChoice)];root.dataset.exercise = next.animationId;choose(next);
    }));
    return choose(options[0]);
  }
  function close() {
    if (!active) return;
    active = false;root.hidden = true;viewer.movementGuide.setVisible(false);
    const saved = original;original = null;clip = null;current = null;
    viewer.time = saved.time;viewer.speed = saved.speed;viewer.playbackRange = saved.playbackRange;
    viewer.motion.update(saved.time);viewer.playing = saved.playing;
    viewer.setFramingInsets({ ...viewer.framingInsets, top: saved.insets.top ?? 0, bottom: saved.insets.bottom ?? 0 });
    const damping = viewer.controls.enableDamping;viewer.controls.enableDamping = false;viewer.controls.update();
    viewer.camera.up.copy(saved.up);viewer.camera.position.copy(saved.position);viewer.controls.target.copy(saved.target);viewer.controls.update();
    viewer.camera.quaternion.copy(saved.quaternion);viewer.controls.enableDamping = damping;
    viewer.controls.maxDistance = saved.maxDistance;viewer.controls.minDistance = saved.minDistance;viewer.frame = saved.frame;
    viewer.dirty = true;onChanged?.({ active: false, context: segment });
  }
  function togglePlay() { if (!active) return;playing = !playing;syncPlay(); }
  function tick(delta) {
    if (!active) return false;
    fitInterface();
    if (playing) { time = (time + Math.max(0, delta) * speed) % clip.period;trainingFrame(); }
    return true;
  }
  listen($('.mtp-return'), 'click', close);
  listen($('.mtp-play'), 'click', togglePlay);
  listen($('.mtp-progress'), 'input', event => { if (!active) return;playing = false;time = Number(event.target.value) * clip.period;trainingFrame();syncPlay(); });
  listen($('.mtp-speed'), 'change', event => { speed = Number(event.target.value); });
  listen($('.mtp-notes-toggle'), 'click', () => {
    const open = $('.mtp-notes').hidden;$('.mtp-notes').hidden = !open;$('.mtp-notes-toggle').setAttribute('aria-expanded', String(open));
    $('.mtp-notes-toggle').textContent = open ? '收起要点' : '练习要点';$('.mtp-bottom').dataset.notesOpen = String(open);
    if (open && playing) { playing = false;syncPlay(); }
    fitInterface();viewer.dirty = true;
  });
  listen(root, 'pointerdown', event => event.stopPropagation());
  listen(root, 'wheel', event => event.stopPropagation());
  return { open, close, tick, togglePlay, resetView: frameClip,
    get active() { return active; },
    getStatus: () => ({ active, animationId: clip?.id ?? null, time, playing, originalTime: original?.time ?? null }),
    dispose() { close();listeners.forEach(remove => remove());root.remove(); } };
}
