import { Vector3 } from 'three';
import { anchorKey, sameAnchor } from './foot-curves.js';
import { buildSegmentGuideDraft, planSegmentGuideRange } from './segment-guide-range.js';
import { validateSegmentGuides, segmentGuideMatches } from './segment-guides.js';
import { transitionOptions } from './transition-edits.js';

const clone = value => structuredClone(value);
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const CHANNELS = [['pelvis', '骨盆路线'], ['leftAnkle', '左脚路线'], ['rightAnkle', '右脚路线'], ['leftWrist', '左手路线'], ['rightWrist', '右手路线']];
const ANGLES = [['leftKnee', '左膝弯向'], ['rightKnee', '右膝弯向'], ['leftElbow', '左肘弯向'], ['rightElbow', '右肘弯向']];

export const segmentGuideMarkup = `<section class="segment-guide-controls" aria-label="整段过渡智能调整">
  <h3>整段过渡 · 智能调整</h3><p class="pose-note">先选上面的起点／终点，再预览整段路线。两端及范围内保存帧保持原姿态。</p>
  <label class="segment-guide-skip-choice"><input id="segment-guide-skip-k" type="checkbox"/>暂时跳过范围内中间 K（保留姿态）</label>
  <button class="focus-button" id="segment-guide-begin">生成连贯过渡 · 预览</button>
  <div id="segment-guide-edit" hidden>
    <label class="pose-field"><span>调整这一小段</span><select id="segment-guide-span" aria-label="整段调整区间"></select></label>
    <label class="pose-field"><span>调整部位</span><select id="segment-guide-joint" aria-label="整段路线控制点"></select></label>
    <div class="segment-guide-route-tools"><button class="focus-button" id="segment-guide-smooth">重绘平滑弧线</button><button class="focus-button" id="segment-guide-orbit">使用旋转中心</button><button id="segment-guide-original" hidden>返回原路线</button></div>
    <p class="pose-note" id="segment-guide-path-note"></p>
    <div id="segment-guide-orbit-controls" hidden>
      <label class="pose-field"><span>绕行方式</span><select id="segment-guide-orbit-arc" aria-label="旋转中心绕行方式"><option value="short">短弧 · 直接绕行</option><option value="long">长弧 · 反向绕行</option></select></label>
      <p class="pose-note" id="segment-guide-orbit-note"></p>
    </div>
    <fieldset class="segment-guide-values"><legend><strong id="segment-guide-position-label">路线控制点</strong> <span>厘米</span></legend>${['X', 'Y', 'Z'].map((axis, index) => `<label>${axis}<input id="segment-guide-pos-${index}" type="number" step="1" aria-label="整段路线${axis}位置，厘米"/></label>`).join('')}</fieldset>
    <p class="pose-note" id="segment-guide-handle-note">拖动场景中点的彩色轴，或用厘米微调。松手只预览。</p>
    <div class="segment-guide-bend"><label>关节弯向<select id="segment-guide-angle-joint" aria-label="整段关节弯向">${ANGLES.map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label><label>调整角度<input id="segment-guide-angle" type="number" min="-360" max="360" step="5" value="0" aria-label="整段弯向偏转角度"/> 度</label></div>
    <label class="pose-field"><span>本范围的过渡速度</span><select id="segment-guide-timing" aria-label="整段过渡速度"><option value="linear">匀速进度</option><option value="smooth">平滑起停</option></select></label>
    <div class="pose-tools"><button id="segment-guide-undo">撤销预览调整</button><button id="segment-guide-neutral">还原这段路线调整</button></div>
    <div class="segment-guide-actions"><button class="focus-button" id="segment-guide-apply">应用整段过渡 · K</button><button id="segment-guide-cancel">取消预览</button></div>
  </div>
  <button id="segment-guide-remove" class="focus-button" hidden>恢复本范围原补帧</button><p id="segment-guide-note" class="pose-note" role="status"></p>
</section>`;

// A local seed puts the circle center on the chord's perpendicular bisector.
// The user then owns its XYZ position; no authored endpoint is moved to fit it.
function orbitSeed(first, last, midpoint, joint) {
  const start = new Vector3().fromArray(first), end = new Vector3().fromArray(last);
  const average = start.clone().add(end).multiplyScalar(.5), chord = end.clone().sub(start);
  const sweep = new Vector3().fromArray(midpoint).sub(average);
  sweep.y = Math.max(sweep.y, joint.endsWith('Ankle') ? .08 : .02);
  const axis = chord.clone().normalize();
  sweep.addScaledVector(axis, -sweep.dot(axis));
  if (sweep.lengthSq() < 1e-10 || sweep.y < .01) {
    sweep.set(0, 1, 0).addScaledVector(axis, -axis.y);
    if (sweep.lengthSq() < 1e-10) sweep.set(1, 0, 0).addScaledVector(axis, -axis.x);
  }
  sweep.normalize();
  const center = average.clone().addScaledVector(sweep, -Math.max(.2, chord.length() / 2));
  const normal = new Vector3().crossVectors(chord, sweep);
  if (normal.lengthSq() < 1e-10) normal.crossVectors(sweep, Math.abs(sweep.z) < .9 ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0));
  return { center: center.toArray(), normal: normal.normalize().toArray() };
}

/** A temporary document owns the entire range; no K or original pose is made.
 * Every hard anchor partitions the range into a separately editable guide.
 * Scene handles expose midpoint targets, while the lines show actual IK.
 */
export function createSegmentGuideEditor({ viewer, panel, getSequence, getDocument, getRange, beforeBegin, onPreview, onApply, onCancel, onSeek, notify, isPlaying }) {
  let draft = null, plan = null, selected = 0, angleJoint = 'leftKnee', history = [], dragStart = null;
  let trajectoryData = null, maximumError = 0, lastMessage = '';
  const $ = selector => panel.querySelector(selector);
  const span = () => plan?.spans[selected];
  const guide = () => draft?.segmentGuides.find(value => segmentGuideMatches(value, span()));
  const options = () => ({ ...transitionOptions(draft), segmentGuides: clone(draft.segmentGuides), footCurves: clone(draft.footCurves ?? []), skippedSteps: clone(draft.skippedSteps ?? []) });
  const poseOf = ref => ref?.kind === 'step' ? getSequence().steps.find(step => step.id === ref.id)?.pose : getDocument().points.find(point => point.id === ref?.id)?.pose;
  const sharedHand = joint => joint.endsWith('Wrist') && [span()?.from, span()?.to].every(ref => poseOf(ref)?.limbs[joint.startsWith('left') ? 'left' : 'right']?.handLocked);
  const jointPosition = (frame, joint) => frame.guideTargets?.[joint] ?? frame.joints[joint];
  const selectedJoint = () => viewer.poseEditor.getState().selected || 'pelvis';
  function midpointFrame() {
    const time = (span().startTime + span().endTime) / 2;
    return viewer.motion.sampleTrajectory({ ...options(), steps: getSequence().steps, startTime: time, endTime: time, samples: 2 }).frames[0];
  }
  function endpointFrames() {
    const pair = span();
    return viewer.motion.sampleTrajectory({ ...options(), steps: getSequence().steps,
      startTime: pair.startTime, endTime: pair.endTime, samples: 2 }).frames;
  }
  function snapshot() { return { segmentGuides: clone(draft.segmentGuides), selected }; }
  function redrawSmoothPath() {
    const joint = selectedJoint();
    if (!draft || isPlaying() || sharedHand(joint)) return;
    const midpoint = jointPosition(midpointFrame(), joint), ends = endpointFrames();
    const first = ends[0].joints[joint], last = ends.at(-1).joints[joint];
    const average = first.map((value, axis) => (value + last[axis]) / 2);
    const bend = midpoint.map((value, axis) => value - average[axis]);
    // Start above the chord so a foot does not inherit the old floor-clipped
    // valley. This is an editable seed, never a relaxation of the ground lock.
    bend[1] = Math.max(bend[1], joint.endsWith('Ankle') ? .08 : .02);
    update(() => {
      delete guide().orbitPaths?.[joint];
      (guide().smoothPaths ??= {})[joint] = { ...guide().smoothPaths?.[joint], bend };
    });
    viewer.poseEditor.refresh();refresh();
    notify('已重绘选中部位的平滑弧线。拖弧线中点调整弧度，按 K 才应用。');
  }
  function redrawOrbitPath() {
    const joint = selectedJoint();
    if (!draft || isPlaying() || sharedHand(joint)) return;
    const midpoint = jointPosition(midpointFrame(), joint), ends = endpointFrames();
    const seed = orbitSeed(ends[0].joints[joint], ends.at(-1).joints[joint], midpoint, joint);
    update(() => {
      const previous = guide().orbitPaths?.[joint];
      (guide().orbitPaths ??= {})[joint] = { ...previous, ...seed, arc: previous?.arc ?? 'short' };
    });
    viewer.poseEditor.refresh();refresh();
    notify('已启用旋转中心。拖中心彩色轴，选择短弧或长弧；按 K 才应用。');
  }
  function remember() { history.push(snapshot());if (history.length > 30) history.shift(); }
  function preview() {
    const previous = trajectoryData;
    try {
      trajectoryData = viewer.motion.sampleTrajectory({ ...options(), steps: getSequence().steps, startTime: plan.startTime, endTime: plan.endTime, samples: 65, includeTimes: plan.anchors.map(anchor => anchor.time) });
      maximumError = Math.max(0, ...trajectoryData.frames.flatMap(frame => Object.entries(frame.guideTargets ?? {}).map(([joint, goal]) =>
        Math.hypot(...goal.map((value, axis) => value - frame.joints[joint][axis])))));
      onPreview(draft);lastMessage = '';refresh();
    } catch (error) { trajectoryData = previous;throw error; }
  }
  function update(action) {
    const previous = snapshot();
    try { if (!dragStart) remember();action();draft.segmentGuides = validateSegmentGuides(draft.segmentGuides);preview(); }
    catch (error) { draft.segmentGuides = previous.segmentGuides;selected = previous.selected;if (!dragStart) history.pop();preview();throw error; }
    return snapshot();
  }
  function selectSpan(index) {
    selected = index;
    if (sharedHand(viewer.poseEditor.getState().selected || 'pelvis')) viewer.poseEditor.select('pelvis');
    onSeek((span().startTime + span().endTime) / 2);
    viewer.poseEditor.refresh();refresh();
  }
  const adapter = {
    kind: 'segmentGuide', group: viewer.motion.group,
    getEditableHandles: () => {
      const frame = midpointFrame();
      return CHANNELS.filter(([joint]) => !sharedHand(joint)).map(([id, label]) => {
        const orbit = guide().orbitPaths?.[id];
        return { id, label: orbit ? `${label} · 旋转中心` : label, canRotate: false,
          position: [...(orbit?.center ?? jointPosition(frame, id))], quaternion: [0, 0, 0, 1] };
      });
    },
    capturePose: snapshot,
    applyPose: saved => {
      const previous = snapshot();draft.segmentGuides = validateSegmentGuides(saved.segmentGuides);selected = saved.selected;
      try { preview(); } catch (error) { draft.segmentGuides = previous.segmentGuides;selected = previous.selected;preview();throw error; }
      return snapshot();
    },
    editHandle: (id, change) => {
      if (!CHANNELS.some(([joint]) => joint === id) || !change.position || sharedHand(id)) throw new Error('固定支撑手保持原锚点，请调整骨盆或非支撑肢体的路线。');
      if (guide().orbitPaths?.[id]) return update(() => { guide().orbitPaths[id].center = [...change.position]; });
      const frame = midpointFrame(), path = guide().smoothPaths?.[id];
      const previous = path?.bend ?? guide().bends?.[id] ?? [0, 0, 0];
      const base = jointPosition(frame, id).map((value, axis) => value - previous[axis]);
      return update(() => {
        const bend = change.position.map((value, axis) => value - base[axis]);
        if (path) guide().smoothPaths[id].bend = bend;
        else (guide().bends ??= {})[id] = bend;
      });
    },
  };
  function begin() {
    if (isPlaying()) return;
    beforeBegin();
    const bounds = getRange(), editable = clone(getDocument()), skip = $('#segment-guide-skip-k').checked;
    if (skip) {
      const duration = getSequence().period / getSequence().steps.length;
      for (const point of editable.points) {
        const ref = { kind: 'point', id: point.id };
        if (sameAnchor(ref, bounds.spans[0].from) || sameAnchor(ref, bounds.spans.at(-1).to)) continue;
        const clock = (point.segment + point.at) * duration;
        const time = clock + Math.ceil((bounds.startTime - clock) / getSequence().period) * getSequence().period;
        if (time > bounds.startTime && time < bounds.endTime) point.skipped = true;
      }
    }
    const candidate = buildSegmentGuideDraft(getSequence(), editable, bounds);
    draft = candidate.document;plan = candidate;selected = 0;history = [];dragStart = null;
    try {
      preview();viewer.poseEditor.setTarget(adapter);viewer.poseEditor.select('pelvis');viewer.poseEditor.setTransformMode('translate');selectSpan(0);
      notify(`已生成 ${plan.spans.length} 段连贯过渡预览。拖路线点或调整关节弯向，应用后才保存。`);
    } catch (error) { cancel();throw error; }
  }
  function cancel({ resample = true } = {}) {
    if (!draft) return;
    viewer.poseEditor.setTarget(null);draft = null;plan = null;history = [];dragStart = null;trajectoryData = null;maximumError = 0;
    onCancel({ resample });refresh();
  }
  function apply() {
    if (!draft || isPlaying()) return;
    const current = clone(draft), count = plan.spans.length;
    if (onApply(current) === false) return;
    cancel();lastMessage = `已应用 ${count} 段过渡。原帧与 K 帧保持原姿态，可撤销此次应用。`;refresh();notify(lastMessage);
  }
  function undo() {
    if (!draft || isPlaying() || !history.length) return;
    const previous = history.at(-1);adapter.applyPose(previous);history.pop();viewer.poseEditor.refresh();refresh();
  }
  function changed(event) {
    if (!draft) return;
    if (event.phase === 'start') dragStart = snapshot();
    else if (event.phase === 'end') {
      if (dragStart && JSON.stringify(dragStart.segmentGuides) !== JSON.stringify(draft.segmentGuides)) {
        history.push(dragStart);if (history.length > 30) history.shift();
      }
      dragStart = null;
    }
    refresh();
  }
  function refresh() {
    if (!$('#segment-guide-begin')) return;
    const playing = isPlaying();
    $('#segment-guide-begin').hidden = Boolean(draft);$('#segment-guide-begin').disabled = playing;
    $('#segment-guide-skip-k').disabled = playing || Boolean(draft);
    $('#segment-guide-edit').hidden = !draft;
    let saved = false;
    try {
      const range = getRange();
      const identityMatches = record => { const from = anchorKey(record.from), to = anchorKey(record.to);return range.spans?.some(pair => from === anchorKey(pair.from) && to === anchorKey(pair.to)); };
      saved = Boolean(getDocument().segmentGuides?.some(identityMatches));
    } catch { /* Choosing or enabling endpoints resolves the explanatory error on begin. */ }
    $('#segment-guide-remove').hidden = Boolean(draft) || !saved;$('#segment-guide-remove').disabled = playing;
    if (!draft) { $('#segment-guide-note').textContent = lastMessage || '用少量路线控制点协调整段过渡，无需逐帧增加 K。';return; }
    const select = $('#segment-guide-span'), html = plan.spans.map((value, index) => `<option value="${index}">${escape(value.label)} · ${value.startTime.toFixed(2)}–${value.endTime.toFixed(2)} s</option>`).join('');
    if (select.innerHTML !== html) select.innerHTML = html;select.value = String(selected);select.disabled = playing;
    const jointSelect = $('#segment-guide-joint'), joint = viewer.poseEditor.getState().selected || 'pelvis';
    const joints = CHANNELS.map(([id, label]) => `<option value="${id}" ${sharedHand(id) ? 'disabled' : ''}>${label}${sharedHand(id) ? ' · 固定支撑' : ''}</option>`).join('');
    if (jointSelect.innerHTML !== joints) jointSelect.innerHTML = joints;jointSelect.value = joint;jointSelect.disabled = playing;
    const orbit = guide().orbitPaths?.[joint], smooth = Boolean(guide().smoothPaths?.[joint]);
    $('#segment-guide-smooth').textContent = orbit ? '改用中点弧线' : smooth ? '重新整理平滑弧线' : '重绘平滑弧线';
    $('#segment-guide-smooth').disabled = playing || sharedHand(joint);
    $('#segment-guide-orbit').textContent = orbit ? '重新设置中心' : '使用旋转中心';
    $('#segment-guide-orbit').disabled = playing || sharedHand(joint);
    $('#segment-guide-original').hidden = !smooth && !orbit;$('#segment-guide-original').disabled = playing;
    $('#segment-guide-orbit-controls').hidden = !orbit;
    $('#segment-guide-orbit-arc').disabled = playing || !orbit;
    if (orbit) {
      $('#segment-guide-orbit-arc').value = orbit.arc ?? 'short';
      const ends = endpointFrames(), center = new Vector3().fromArray(orbit.center);
      const radius = [ends[0], ends.at(-1)].map(frame => new Vector3().fromArray(frame.joints[joint]).distanceTo(center));
      $('#segment-guide-orbit-note').textContent = Math.abs(radius[0] - radius[1]) < .0001
        ? `圆弧 · 半径 ${(radius[0] * 100).toFixed(1)} cm。两端保持原位置。`
        : `起点半径 ${(radius[0] * 100).toFixed(1)} → 终点半径 ${(radius[1] * 100).toFixed(1)} cm，半径自动连续变化。`;
    }
    $('#segment-guide-position-label').textContent = orbit ? '旋转中心（球心）' : '路线控制点';
    $('#segment-guide-handle-note').textContent = orbit
      ? '彩色轴现在位于旋转中心。拖动中心或输入 XYZ，整条弧线随之改变；两端姿态保留。'
      : '拖动场景中点的彩色轴，或用厘米微调。松手只预览。';
    $('#segment-guide-path-note').textContent = orbit
      ? '围绕你指定的中心旋转。短弧直接连接，长弧向另一侧绕行；实线是实际运动，淡虚线显示受骨长或地面限制的目标。'
      : smooth
      ? '两端固定，拖弧线中点改变整条弧度。绿轴／Y 调高度，X、Z 调侧摆和前后绕行。实线是实际路线，淡虚线是无法完全到达的目标。'
      : '当前沿已有路线微调。遇到贴地平段或折弯，可重绘成平滑弧线，再拖中点调整；过渡速度只控制播放进度。';
    const position = viewer.poseEditor.getState().position;
    for (let index = 0; index < 3; index++) {
      const input = $('#segment-guide-pos-' + index);if (globalThis.document.activeElement !== input) input.value = ((position?.[index] ?? 0) * 100).toFixed(1);input.disabled = playing;
      input.ariaLabel = `${orbit ? '旋转中心' : '整段路线'}${['X', 'Y', 'Z'][index]}位置，厘米`;
    }
    $('#segment-guide-angle-joint').value = angleJoint;$('#segment-guide-angle-joint').disabled = playing;
    const angle = $('#segment-guide-angle');if (globalThis.document.activeElement !== angle) angle.value = ((guide().bendAngles?.[angleJoint] ?? 0) * 180 / Math.PI).toFixed(1);angle.disabled = playing;
    $('#segment-guide-timing').value = guide().timing;$('#segment-guide-timing').disabled = playing;
    $('#segment-guide-undo').disabled = playing || !history.length;$('#segment-guide-neutral').disabled = playing;
    $('#segment-guide-apply').disabled = playing;$('#segment-guide-cancel').disabled = playing;
    $('#segment-guide-note').textContent = `${plan.spans.length} 段预览，保存帧与支撑锚点保留。关节弯向与骨骼转向由系统协调。${maximumError > .001 ? `目标受骨长、锁手或地面限制，最大偏差 ${(maximumError * 100).toFixed(1)} cm；实线显示实际运动。` : '当前目标在约束范围内。'} 松手只预览，K 应用整段。`;
  }
  function bind() {
    const safe = action => { try { action(); } catch (error) { notify(error.message);refresh(); } };
    $('#segment-guide-begin').addEventListener('click', () => safe(begin));
    $('#segment-guide-smooth').addEventListener('click', () => safe(redrawSmoothPath));
    $('#segment-guide-orbit').addEventListener('click', () => safe(redrawOrbitPath));
    $('#segment-guide-orbit-arc').addEventListener('change', event => safe(() => {
      if (!draft || isPlaying() || !guide().orbitPaths?.[selectedJoint()]) return;
      update(() => { guide().orbitPaths[selectedJoint()].arc = event.target.value; });viewer.poseEditor.refresh();refresh();
    }));
    $('#segment-guide-original').addEventListener('click', () => safe(() => {
      if (!draft || isPlaying()) return;
      update(() => { delete guide().orbitPaths?.[selectedJoint()];delete guide().smoothPaths?.[selectedJoint()]; });viewer.poseEditor.refresh();refresh();
    }));
    $('#segment-guide-span').addEventListener('change', event => safe(() => selectSpan(Number(event.target.value))));
    $('#segment-guide-joint').addEventListener('change', event => { viewer.poseEditor.select(event.target.value);refresh(); });
    for (let index = 0; index < 3; index++) $('#segment-guide-pos-' + index).addEventListener('change', event => safe(() => {
      const state = viewer.poseEditor.getState(), position = [...state.position];position[index] = Number(event.target.value) / 100;
      adapter.editHandle(state.selected, { position });viewer.poseEditor.refresh();refresh();
    }));
    $('#segment-guide-angle-joint').addEventListener('change', event => { angleJoint = event.target.value;refresh(); });
    $('#segment-guide-angle').addEventListener('change', event => safe(() => { const angle = Number(event.target.value) * Math.PI / 180;update(() => { (guide().bendAngles ??= {})[angleJoint] = angle; });viewer.poseEditor.refresh(); }));
    $('#segment-guide-timing').addEventListener('change', event => safe(() => update(() => { for (const pair of plan.spans) draft.segmentGuides.find(record => segmentGuideMatches(record, pair)).timing = event.target.value; })));
    $('#segment-guide-neutral').addEventListener('click', () => safe(() => { update(() => { guide().bends = {};guide().bendAngles = {};guide().smoothPaths = {};guide().orbitPaths = {}; });viewer.poseEditor.refresh(); }));
    $('#segment-guide-undo').addEventListener('click', () => safe(undo));
    $('#segment-guide-apply').addEventListener('click', () => safe(apply));
    $('#segment-guide-cancel').addEventListener('click', () => cancel());
    $('#segment-guide-remove').addEventListener('click', () => safe(() => {
      const range = planSegmentGuideRange(getSequence(), getDocument(), getRange()), next = clone(getDocument());
      next.segmentGuides = (next.segmentGuides ?? []).filter(record => !range.spans.some(pair => segmentGuideMatches(record, pair)));
      if (onApply(next) !== false) { lastMessage = '本范围已恢复原补帧，保存姿态保留。';refresh();notify(lastMessage); }
    }));
    refresh();
  }
  return { bind, refresh, begin, cancel, apply, undo, changed, active: () => Boolean(draft), document: () => draft ? clone(draft) : getDocument(),
    data: () => trajectoryData, range: () => plan, state: () => draft ? { spans: clone(plan.spans), selected, guides: clone(draft.segmentGuides), maximumError } : null };
}
