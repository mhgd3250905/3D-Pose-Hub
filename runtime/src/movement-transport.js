import { resolveMovementPoseAnnotations } from './movement-lessons.js';

/** Small shortcuts on the existing transport, using its authored timebase. */
export function createMovementTransport({ viewer, toolbar, panel, onSeek, refreshIcons }) {
  const document = toolbar.ownerDocument, timeline = toolbar.querySelector('.timeline-wrap');
  const root = document.createElement('nav');root.className = 'movement-node-nav';root.setAttribute('aria-label', '托马斯关键节点');
  const title = toolbar.querySelector('.timeline-label>span:last-child');
  title.classList.add('movement-current-stage');
  timeline.append(root);
  const loop = document.createElement('button');loop.type = 'button';loop.className = 'movement-loop-control';loop.setAttribute('aria-pressed', 'false');
  loop.innerHTML = '<i data-lucide="repeat-2"></i><span>循环这段</span>';toolbar.append(loop);
  let sequence = null, nodes = [], visible = true, signature = null;
  const seek = index => {
    viewer.setPlaybackRange(null);viewer.playing = false;
    viewer.setTime(index / sequence.steps.length * sequence.period);onSeek?.();update();
  };
  function setSequence(next) {
    sequence = next;signature = null;
    const seen = new Set();nodes = [];
    sequence.steps.forEach((_, index) => {
      const profile = resolveMovementPoseAnnotations(sequence, index);
      if (!profile || seen.has(profile.sourceStepNumber)) return;
      seen.add(profile.sourceStepNumber);nodes.push(profile);
    });
    root.replaceChildren(...nodes.map(profile => {
      const button = document.createElement('button');button.type = 'button';button.dataset.movementNode = String(profile.sourceStepNumber);
      const label = document.createElement('span');label.textContent = String(profile.sourceStepNumber).padStart(2, '0');button.append(label);button.title = profile.title;
      button.style.setProperty('--at', (profile.index / sequence.steps.length).toFixed(4)); // tick position on the scrubber
      button.setAttribute('aria-label', `查看原第 ${String(profile.sourceStepNumber).padStart(2, '0')} 步`);
      button.setAttribute('aria-pressed', 'false');button.addEventListener('click', () => seek(profile.index));return button;
    }));
    update();
  }
  function update() {
    if (!sequence) return;
    const metrics = viewer.motion.getMetrics();
    const current = resolveMovementPoseAnnotations(sequence, metrics.demonstration?.index), number = current?.sourceStepNumber;
    const next = `${number}:${Boolean(viewer.playbackRange)}`;
    if (signature === next) return;signature = next;
    root.querySelectorAll('button').forEach(button => {
      const selected = Number(button.dataset.movementNode) === number;
      button.classList.toggle('active', selected);button.setAttribute('aria-pressed', String(selected));
    });
    title.textContent = current ? current.title.replace(/^原第 \d+ 步 · /, '') : '一个完整周期';
    loop.setAttribute('aria-pressed', String(Boolean(viewer.playbackRange)));
    loop.querySelector('span').textContent = viewer.playbackRange ? '恢复整圈' : '循环这段';
    loop.setAttribute('aria-label', viewer.playbackRange ? '恢复整圈播放' : '循环当前动作阶段');
  }
  function setVisible(value) { visible = Boolean(value);root.hidden = !visible;loop.hidden = !visible; }
  const toggle = () => { if (viewer.playbackRange) panel()?.clearLoop();else panel()?.loopSegment();update(); };
  loop.addEventListener('click', toggle);refreshIcons?.();
  return { setSequence, update, setVisible, get nodeCount() { return nodes.length; },
    dispose() { loop.removeEventListener('click', toggle);loop.remove();root.remove(); } };
}
