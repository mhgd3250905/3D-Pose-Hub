import { scrubCheckpoint } from './scrub-fields.js';
import { Euler, Quaternion, MathUtils } from 'three';
import { createTransitionEdits, loadTransitionEdits, saveTransitionEdits, validateTransitionEdits, transitionOptions, TRANSITION_STORAGE_KEY } from './transition-edits.js';
import { samePose, OFFICIAL_FLARE_SEQUENCE } from './official-poses.js';
import { getOfficialRecoveryFrames, restoreOfficialFrames } from './official-frame-recovery.js';
import { anchorIdentity, sameAnchor, footCurveMatches, validateFootCurves } from './foot-curves.js';
import { getTrajectoryAnchors, resolveTrajectoryRange } from './trajectory-range.js';
import { TRAJECTORY_JOINTS } from './trajectory-guide.js';
import { solveTrajectoryPose } from './trajectory-pose-edit.js';
import { createSegmentGuideEditor, segmentGuideMarkup } from './segment-guide-editor.js';
import { planSegmentGuideRange } from './segment-guide-range.js';
import { clampGuideTime, unfoldGuideClock, guideTransportMarkers } from './transition-transport.js';

const clone = value => structuredClone(value);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = value => Math.min(1, Math.max(0, value));
const near = (a, b) => Math.abs(a - b) < 1e-8;
const TRAJECTORY_STORAGE_KEY = 'flare-trajectory-guide-v1';
const RECOVERY_STORAGE_KEY = 'flare-animation-recovery-history-v1';

export function createTransitionPanel({ viewer, panel, shelf, sequence, storage, notify, refreshIcons, onApply, onEnter, onExit, onUpdateFrame, onRestoreFrames, onImportFrames, hasPreviousFrameUpdate }) {
  let source = clone(sequence), document = read(source), segment = 0, at = .5;
  let active = false, previewing = false, animation = null, lastTick = null, dirty = false, applying = false;
  let poseHistory = [], documentHistory = [], dragStart = null, pointName = '', previewSpeed = .25, previewClock = 0, persisted = true;
  let trajectoryRevision = 0, trajectoryAnimation = null, trajectoryKey = null, trajectoryRange = null, trajectoryError = '';
  let curveEdit = null, curveDragStart = null, curveDeviation = 0;
  let trajectorySelection = null, trajectoryJoint = 'all';
  let trajectoryProbe = null, trajectoryPoseEdit = null, trajectoryPoseHistory = [], trajectoryPoseDrag = null;
  let recoveryBackup = OFFICIAL_FLARE_SEQUENCE, recoveryLabel = '初始保存姿态（原始导出）';
  let recoveryIndices = new Set(), recoveryMessage = '';
  let guidedClock = null, guidedScope = null;
  let markerSource = null, markerDocument = null, markerPlan = undefined;
  const trajectoryPreferences = { enabled: true, feet: true, knees: true, pelvis: true, allJoints: true, baseline: true };
  try {
    const saved = JSON.parse(storage()?.getItem(TRAJECTORY_STORAGE_KEY) || 'null');
    if (saved?.version === 1) for (const key of Object.keys(trajectoryPreferences)) {
      if (typeof saved[key] === 'boolean') trajectoryPreferences[key] = saved[key];
    }
  } catch { /* Display preferences can fall back without affecting animation data. */ }
  const $ = selector => panel.querySelector(selector);
  const global = selector => globalThis.document.querySelector(selector);
  const currentPose = () => viewer.motion.capturePose();
  const duration = () => source.period / source.steps.length;
  const linkedEnds = () => samePose(source.steps[0].pose, source.steps.at(-1).pose);
  const segmentCount = () => source.steps.length - (linkedEnds() ? 1 : 0);
  const number = index => String(source.steps[index]?.sourceStepNumber ?? index + 1).padStart(2, '0');
  const range = index => `${number(index)} → ${number((index + 1) % source.steps.length)}`;
  const pointAt = () => document.points.find(point => point.segment === segment && near(point.at, at));
  const fixedIndex = () => at <= 0 ? segment : at >= 1 ? (segment + 1) % source.steps.length : null;
  const linkedIndices = index => linkedEnds() && (index === 0 || index === source.steps.length - 1) ? [0, source.steps.length - 1] : [index];
  const stepSkipped = (index, edits = document) => edits.skippedSteps?.includes(index) === true;
  const currentSkipped = () => fixedIndex() !== null ? stepSkipped(fixedIndex()) : pointAt()?.skipped === true;
  const positionTime = () => guideEditor.active()
    ? previewing ? previewClock : guidedClock ?? unfoldGuideClock((segment + at) * duration(), guideEditor.range(), source.period)
    : previewing && (curveEdit || trajectorySelection || global('#transition-preview-scope').value === 'loop') ? previewClock : (segment + at) * duration();
  function restoreStep(edits, index) {
    if (edits.skippedSteps?.length) edits.skippedSteps = edits.skippedSteps.filter(value => !linkedIndices(index).includes(value));
  }
  const snapshot = () => ({ sequence: clone(source), document: clone(document) });
  function rememberDocument() { documentHistory.push(snapshot());if (documentHistory.length > 30) documentHistory.shift(); }
  const guideEditor = createSegmentGuideEditor({ viewer, panel, getSequence: () => source, getDocument: () => document,
    getRange: () => {
      const range = selectedTrajectoryRange() ?? curveSpan();
      return planSegmentGuideRange(source, document, { startTime: range.startTime, endTime: range.endTime });
    },
    beforeBegin: () => {
      pause();if (trajectoryPoseEdit) endTrajectoryPose();if (curveEdit) endCurveEdit();
      if (dirty) { saveDraft();if (!persisted) throw new Error('当前姿态未能暂存，请先导出动画备份。'); }
      dirty = false;poseHistory = [];guidedClock = null;trajectoryPreferences.enabled = true;trajectoryPreferences.allJoints = true;
    },
    onPreview: next => {
      applying = true;
      try {
        viewer.motion.setSequence(source.steps, { period: source.period, ...transitionOptions(next) });
        viewer.motion.update(positionTime());viewer.poseEditor.refresh();viewer.dirty = true;trajectoryRevision++;
      } finally { applying = false; }
      refresh();
    },
    onApply: next => {
      const previous = snapshot(), store = storage(), before = store?.getItem(TRANSITION_STORAGE_KEY);
      try {
        const saved = saveTransitionEdits(next, source, store);
        onApply(transitionOptions(saved));rememberDocument();document = saved;persisted = true;dirty = false;
        trajectoryRevision++;renderShelf();samplePosition({ draft: false });return true;
      } catch (error) {
        try { if (store && store.getItem(TRANSITION_STORAGE_KEY) !== before) { if (before === null) store.removeItem(TRANSITION_STORAGE_KEY);else store.setItem(TRANSITION_STORAGE_KEY, before); } }
        catch { notify('保存失败，浏览器也拒绝恢复原数据，请保留此页并导出动画备份。'); }
        document = previous.document;
        try { onApply(transitionOptions(guideEditor.active() ? guideEditor.document() : document)); } catch { onApply(transitionOptions(document)); }
        notify(`${error.message} 整段预览仍可继续调整，尚未应用。`);return false;
      }
    },
    onCancel: ({ resample }) => { pause();guidedClock = null;onApply(transitionOptions(document));trajectoryRevision++;if (resample && active) samplePosition({ draft: false });else refresh(); },
    onSeek: time => seekTime(time), notify, isPlaying: () => previewing,
  });

  function recoveryHistory() {
    const raw = storage()?.getItem(RECOVERY_STORAGE_KEY);
    if (raw == null) return { version: 1, entries: [] };
    const history = JSON.parse(raw);
    if (history?.version !== 1 || !Array.isArray(history.entries)) throw new Error('恢复备份暂时无法读取，原数据已保留。请先导出动画 JSON。');
    return history;
  }
  function backupBeforeRecovery(previous, restoredStepNumbers) {
    const store = storage();
    if (!store) throw new Error('浏览器无法保存恢复前备份，请先导出动画 JSON。');
    const history = recoveryHistory();
    history.entries.push({ savedAt: new Date().toISOString(), restoredStepNumbers, animation: { ...clone(previous.document), sequence: clone(previous.sequence) } });
    const raw = JSON.stringify(history);
    store.setItem(RECOVERY_STORAGE_KEY, raw);
    if (store.getItem(RECOVERY_STORAGE_KEY) !== raw) throw new Error('恢复前备份未保存成功，当前动画保留。');
  }
  function downloadAnimation(animation, prefix = 'flare-transitions') {
    const url = URL.createObjectURL(new Blob([JSON.stringify(animation, null, 2)], { type: 'application/json' }));
    const link = globalThis.document.createElement('a');link.href = url;link.download = `${prefix}-${Date.now()}.json`;link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function animationBackup() {
    if (guideEditor.active()) throw new Error('请先应用或取消整段预览，再备份已保存的动画。');
    if (trajectoryPoseEdit?.result?.improved) { saveTrajectoryPose();if (trajectoryPoseEdit) throw new Error('姿态修正尚未保存。'); }
    if (curveEdit && curvePending()) saveCurve();
    if (dirty) { saveDraft();if (!persisted) throw new Error('当前调整尚未暂存成功，请保留此页。'); }
    return { ...clone(document), sequence: clone(source) };
  }
  function importAnimationText(text, label = '粘贴的姿态备份') {
    if (new Blob([text]).size > 2 * 1024 * 1024) throw new Error('请选择 2 MB 以内的动画 JSON。');
    const imported = JSON.parse(text);
    pause();if (guideEditor.active()) guideEditor.cancel({ resample: false });if (trajectoryPoseEdit) endTrajectoryPose({ resample: false });if (curveEdit) endCurveEdit({ resample: false });
    if (['flare-pose-library', 'flare-demonstration'].includes(imported?.format)) { loadRecoveryBackup(imported, label);return; }
    const { sequence: importedSequence, ...edits } = imported;
    if (importedSequence && onImportFrames && JSON.stringify(importedSequence) !== JSON.stringify(source)) {
      const previous = snapshot(), result = onImportFrames(importedSequence, edits);
      documentHistory.push(previous);if (documentHistory.length > 30) documentHistory.shift();acceptFrames(result);
    } else { const next = validateTransitionEdits(edits, source);applyDocument(next);if (active) samplePosition(); }
    if (persisted) notify('动画备份已导入，可撤销此次导入。');
  }
  function refreshRecovery() {
    if (!$('#transition-recovery-frames')) return;
    try {
      const frames = getOfficialRecoveryFrames(source, recoveryBackup);
      const firstBySource = new Set();
      const visible = frames.filter(frame => {
        const identity = frame.sourceStepId || frame.id;
        if (firstBySource.has(identity)) return false;
        firstBySource.add(identity);return true;
      });
      recoveryIndices = new Set([...recoveryIndices].filter(index => visible.some(frame => frame.index === index && frame.available)));
      $('#transition-recovery-source').textContent = recoveryLabel;
      $('#transition-recovery-frames').innerHTML = visible.map(frame => `<label title="${escape(frame.reason || frame.name)}"><input type="checkbox" data-recovery-index="${frame.index}" ${recoveryIndices.has(frame.index) ? 'checked' : ''} ${!frame.available || previewing ? 'disabled' : ''}/>原第 ${number(frame.index)} 步${!frame.available ? ' · 备份未匹配' : ''}</label>`).join('');
      for (const input of panel.querySelectorAll('[data-recovery-index]')) input.addEventListener('change', event => {
        const index = Number(input.dataset.recoveryIndex);
        if (event.target.checked) recoveryIndices.add(index);else recoveryIndices.delete(index);
        $('#transition-recovery-apply').disabled = !recoveryIndices.size || previewing;
      });
      $('#transition-recovery-apply').disabled = !recoveryIndices.size || previewing;
      $('#transition-recovery-note').textContent = recoveryMessage || '勾选需要恢复的原帧，再恢复。首尾第 09 步同步，其他原帧、中间 K 帧和路线设置保留。';
      let hasBackup = false;try { hasBackup = recoveryHistory().entries.length > 0; } catch { /* Applying recovery will report a damaged backup without overwriting it. */ }
      $('#transition-recovery-download').hidden = !hasBackup;
    } catch (error) {
      $('#transition-recovery-frames').textContent = '';
      $('#transition-recovery-apply').disabled = true;
      $('#transition-recovery-note').textContent = error.message;
    }
  }
  function loadRecoveryBackup(backup, label) {
    const frames = getOfficialRecoveryFrames(source, backup);
    if (!frames.some(frame => frame.available)) throw new Error('这份备份没有与当前原帧身份匹配的姿态，当前动画保留。');
    recoveryBackup = clone(backup);recoveryLabel = label;recoveryMessage = '';
    if (!recoveryIndices.size) {
      const fixed = fixedIndex(), index = fixed === source.steps.length - 1 && source.steps[fixed].sourceStepId === source.steps[0].sourceStepId ? 0 : fixed;
      if (frames.some(frame => frame.index === index && frame.available)) recoveryIndices.add(index);
    }
    refreshRecovery();$('#transition-recovery').open = true;
    $('#transition-recovery').scrollIntoView({ block: 'nearest' });
    notify('姿态备份已读取。勾选需要恢复的原帧，再点“恢复勾选的原帧”。');
  }
  function recoverFrames() {
    try {
      if (!onImportFrames) throw new Error('当前页面无法更新原关键帧。');
      pause();if (guideEditor.active()) guideEditor.cancel({ resample: false });if (trajectoryPoseEdit) endTrajectoryPose({ resample: false });if (curveEdit) endCurveEdit({ resample: false });
      if (dirty) { saveDraft();if (!persisted) throw new Error('当前调整暂存失败，动画尚未恢复。请先导出动画 JSON。'); }
      const previous = snapshot(), recovered = restoreOfficialFrames(source, document, recoveryBackup, [...recoveryIndices]);
      backupBeforeRecovery(previous, recovered.restoredStepNumbers);
      const result = onImportFrames(recovered.sequence, recovered.document);
      documentHistory.push(previous);if (documentHistory.length > 30) documentHistory.shift();
      acceptFrames(result);poseHistory = [];
      recoveryMessage = `已恢复原第 ${recovered.restoredStepNumbers.map(value => String(value).padStart(2, '0')).join('、')} 步。恢复前动画已备份，可撤销此次恢复。`;
      refreshRecovery();notify(recoveryMessage);
    } catch (error) { notify(error.message);refreshRecovery(); }
  }

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
    if (remember) rememberDocument();
    document = persist(validated);
    trajectoryRevision++;
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

  const curveLabel = side => side === 'left' ? '左脚' : '右脚';
  function selectedTrajectoryRange() {
    if (!trajectorySelection) return null;
    const anchors = getTrajectoryAnchors(source, document);
    if (!anchors.some(anchor => anchor.key === trajectorySelection.fromKey) || !anchors.some(anchor => anchor.key === trajectorySelection.toKey)) {
      trajectorySelection = null;return null;
    }
    return resolveTrajectoryRange(anchors, trajectorySelection, source.period);
  }
  function refreshTrajectorySelectors() {
    if (!$('#trajectory-from')) return;
    const anchors = getTrajectoryAnchors(source, document), selected = selectedTrajectoryRange();
    const span = curveSpan(), keyOf = ref => anchors.find(anchor => sameAnchor(anchor, ref))?.key;
    const fromKey = selected?.from.key ?? keyOf(span?.from) ?? anchors[0]?.key;
    const toKey = selected?.to.key ?? keyOf(span?.to) ?? anchors[1]?.key;
    const options = anchors.map(anchor => `<option value="${escape(anchor.key)}">${escape(anchor.label)}</option>`).join('');
    for (const [id, key] of [['from', fromKey], ['to', toKey]]) {
      const select = $('#trajectory-' + id);
      if (select.innerHTML !== options) select.innerHTML = options;
      select.value = key;select.disabled = previewing || Boolean(curveEdit) || Boolean(trajectoryPoseEdit) || guideEditor.active();
    }
    $('#trajectory-auto-range').disabled = previewing || Boolean(trajectoryPoseEdit) || guideEditor.active() || !selected;
    $('#trajectory-joint').value = trajectoryJoint;$('#trajectory-joint').disabled = previewing || Boolean(trajectoryPoseEdit) || guideEditor.active();
    $('#trajectory-range-note').textContent = selected
      ? '显示所选范围的实际播放。范围内已有关键帧继续参与补帧。'
      : '自由选择起点与终点，例如原第 09 步到原第 11 步。';
    const option = global('#transition-preview-scope').querySelector('option[value="segment"]');
    if (option) option.textContent = guideEditor.active() ? '智能调节区间循环' : selected ? '所选范围循环' : '当前段循环';
  }
  function rangeProgress(time, startTime, endTime) {
    let candidate = time;
    while (candidate < startTime) candidate += source.period;
    while (candidate > endTime && candidate - source.period >= startTime) candidate -= source.period;
    return candidate;
  }
  const jointLabel = joint => TRAJECTORY_JOINTS.find(channel => channel.joint === joint)?.label ?? joint;
  function poseEditAnchors(time) {
    const span = viewer.motion.getFootCurveSpan(time), all = getTrajectoryAnchors(source, document);
    const refs = span.blend <= 1e-10 ? [span.from] : span.blend >= 1 - 1e-10 ? [span.to] : [span.from, span.to];
    return refs.map(ref => all.find(anchor => sameAnchor(anchor, ref))).filter(anchor => anchor?.active);
  }
  function probeTrajectory(point) {
    if (!point || previewing || trajectoryPoseEdit) return;
    if (curveEdit) endCurveEdit();
    trajectoryJoint = point.joint;trajectoryPreferences.allJoints = true;
    seekTime(((point.time % source.period) + source.period) % source.period);trajectoryProbe = clone(point);
    refresh();
  }
  function poseEditSnapshot() {
    return { goal: clone(trajectoryPoseEdit.goal), result: trajectoryPoseEdit.result ? clone(trajectoryPoseEdit.result) : null };
  }
  function previewTrajectoryPose() {
    const previousApplying = applying;applying = true;
    try {
      const result = trajectoryPoseEdit?.result;
      viewer.motion.setSequence(result?.sequence.steps ?? source.steps, { period: source.period, ...transitionOptions(result?.document ?? document) });
      viewer.motion.update(positionTime());viewer.poseEditor.refresh();viewer.dirty = true;trajectoryRevision++;
    } finally { applying = previousApplying; }
    refresh();
  }
  function setPoseEditSnapshot(value) {
    trajectoryPoseEdit.goal = clone(value.goal);trajectoryPoseEdit.result = value.result ? clone(value.result) : null;
    previewTrajectoryPose();return poseEditSnapshot();
  }
  function beginTrajectoryPose() {
    if (previewing || trajectoryPoseEdit || trajectoryJoint === 'all') return;
    if (curveEdit) endCurveEdit();
    if (guideEditor.active()) guideEditor.cancel();
    if (dirty) saveDraft();
    const time = trajectoryProbe?.joint === trajectoryJoint ? trajectoryProbe.time : positionTime();
    const candidates = poseEditAnchors(time), key = $('#trajectory-pose-frame').value;
    const anchor = candidates.find(item => item.key === key) ?? candidates[0];
    if (!anchor) { notify('这个位置没有可修正的启用关键帧。');return; }
    const actual = viewer.motion.sampleTrajectory({ ...transitionOptions(document), startTime: time, endTime: time, samples: 2 }).frames[0].joints[trajectoryJoint];
    seekTime(((time % source.period) + source.period) % source.period);
    trajectoryProbe = { joint: trajectoryJoint, time, position: clone(actual) };
    trajectoryPoseEdit = { joint: trajectoryJoint, time, anchor: clone(anchor), goal: clone(actual), result: null };
    dirty = false;trajectoryPoseHistory = [];trajectoryPoseDrag = null;
    const adapter = {
      kind: 'trajectoryPose', group: viewer.motion.group,
      getEditableHandles: () => [{ id: 'trajectoryPosePoint', label: `${jointLabel(trajectoryPoseEdit.joint)} · 轨迹修姿态`,
        position: clone(trajectoryPoseEdit.result?.position ?? trajectoryProbe.position), quaternion: [0, 0, 0, 1], canRotate: false }],
      capturePose: poseEditSnapshot, applyPose: setPoseEditSnapshot,
      editHandle: (id, change) => {
        if (id !== 'trajectoryPosePoint' || !change.position) throw new Error('请移动选中的实际轨迹点。');
        const result = solveTrajectoryPose({ motion: viewer.motion, sequence: source, edits: document,
          anchor: trajectoryPoseEdit.anchor, time: trajectoryPoseEdit.time, joint: trajectoryPoseEdit.joint, target: change.position });
        trajectoryPoseEdit.goal = clone(change.position);trajectoryPoseEdit.result = result;
        previewTrajectoryPose();return poseEditSnapshot();
      },
    };
    viewer.poseEditor.setTarget(adapter);viewer.poseEditor.setTransformMode('translate');refresh();
  }
  function endTrajectoryPose({ restore = true, resample = true } = {}) {
    if (!trajectoryPoseEdit) return;
    const previousApplying = applying;applying = true;
    try { viewer.poseEditor.setTarget(null);trajectoryPoseEdit = null;trajectoryPoseHistory = [];trajectoryPoseDrag = null;
      if (restore) onApply(transitionOptions(document));
    } finally { applying = previousApplying; }
    if (resample && active) samplePosition({ draft: false });
  }
  function saveTrajectoryPose() {
    if (!trajectoryPoseEdit?.result?.improved || previewing) return;
    const edit = trajectoryPoseEdit, result = edit.result, anchor = edit.anchor;
    try {
      if (anchor.kind === 'step') {
        const previous = snapshot(), saved = onUpdateFrame(anchor.index, clone(result.pose), clone(document));
        documentHistory.push(previous);if (documentHistory.length > 30) documentHistory.shift();
        endTrajectoryPose({ restore: false, resample: false });acceptFrames(saved);
      } else {
        const next = clone(document), point = next.points.find(item => item.id === anchor.id);
        if (!point) throw new Error('要修正的 K 帧已不存在。');
        point.pose = clone(result.pose);applyDocument(next);
        endTrajectoryPose({ restore: false, resample: false });samplePosition({ draft: false });
      }
      trajectoryProbe = { joint: edit.joint, time: edit.time, position: clone(result.position) };
      notify(persisted ? `已由${jointLabel(edit.joint)}轨迹修正${anchorLabel(anchor)}，前后过渡已重算，帧数量保留。`
        : '修正已用于本页播放，浏览器保存失败，请导出动画 JSON。');refresh();
    } catch (error) { notify(`${error.message} 修正仍为预览，可继续调整。`);refresh(); }
  }
  function trajectoryPoseChanged(event) {
    if (!trajectoryPoseEdit) return;
    if (event.phase === 'start') trajectoryPoseDrag = poseEditSnapshot();
    if (event.phase === 'end' && trajectoryPoseDrag) {
      if (!samePose(trajectoryPoseDrag, poseEditSnapshot())) trajectoryPoseHistory.push(trajectoryPoseDrag);
      trajectoryPoseDrag = null;
    }
    refresh();
  }
  function refreshTrajectoryPoseControls() {
    if (!$('#trajectory-pose-frame')) return;
    const time = trajectoryPoseEdit?.time ?? (trajectoryProbe?.joint === trajectoryJoint ? trajectoryProbe.time : positionTime());
    const anchors = poseEditAnchors(time), select = $('#trajectory-pose-frame');
    const previous = select.value, options = anchors.map(anchor => `<option value="${escape(anchor.key)}">${escape(anchor.label)}</option>`).join('');
    if (select.innerHTML !== options) select.innerHTML = options;
    const span = viewer.motion.getFootCurveSpan(time), nearest = anchors.find(anchor => sameAnchor(anchor, span.blend < .5 ? span.from : span.to)) ?? anchors[0];
    select.value = trajectoryPoseEdit?.anchor.key ?? (anchors.some(anchor => anchor.key === previous) ? previous : nearest?.key);
    select.disabled = previewing || Boolean(trajectoryPoseEdit) || trajectoryJoint === 'all';
    $('#trajectory-pose-begin').hidden = Boolean(trajectoryPoseEdit);
    $('#trajectory-pose-begin').disabled = previewing || trajectoryJoint === 'all' || !anchors.length;
    $('#trajectory-pose-apply').hidden = !trajectoryPoseEdit;
    $('#trajectory-pose-apply').disabled = previewing || !trajectoryPoseEdit?.result?.improved;
    $('#trajectory-pose-cancel').hidden = !trajectoryPoseEdit;$('#trajectory-pose-cancel').disabled = previewing;
    $('#trajectory-pose-time').textContent = `${time.toFixed(2)} s`;
    const result = trajectoryPoseEdit?.result;
    $('#trajectory-pose-note').textContent = trajectoryPoseEdit
      ? `拖动${jointLabel(trajectoryPoseEdit.joint)}轨迹点，反求${anchorLabel(trajectoryPoseEdit.anchor)}的姿态。松手只预览，K 应用。${result ? `目标偏差 ${(result.error * 100).toFixed(1)} cm。` : ''}该帧前后两侧过渡都会变化。`
      : trajectoryJoint === 'all' ? '选择一个关节重点检查，再点它的轨迹，或停在问题时间。'
        : `可点${jointLabel(trajectoryJoint)}轨迹定位问题，选择要纠正的已有帧。修正保留帧数量。`;
  }
  const curvePending = () => curveEdit && !samePose(curveEdit.curve, document.footCurves?.find(curve => curve.id === curveEdit.curve.id));
  function curveDocument() {
    if (guideEditor.active()) return guideEditor.document();
    if (!curveEdit) return document;
    return { ...document, footCurves: (document.footCurves ?? []).filter(curve => curve.id !== curveEdit.curve.id).concat(clone(curveEdit.curve)) };
  }
  function curveSpan() {
    return viewer.motion.getFootCurveSpan(positionTime(), { prefer: positionTime() >= segmentCount() * duration() ? 'previous' : 'next' });
  }
  function anchorLabel(ref) {
    if (ref.kind === 'step') return `原第 ${number(source.steps.findIndex(step => step.id === ref.id))} 步`;
    const point = document.points.find(point => point.id === ref.id);
    return point ? `K 帧 ${((point.segment + point.at) * duration()).toFixed(2)} s` : 'K 帧';
  }
  function previewCurve() {
    const previousApplying = applying;applying = true;
    try {
      viewer.motion.setSequence(source.steps, { period: source.period, ...transitionOptions(curveDocument()) });
      viewer.motion.update(positionTime());trajectoryRevision++;
      viewer.poseEditor.refresh();viewer.dirty = true;
    } finally { applying = previousApplying; }
    refresh();
  }
  function saveCurve() {
    if (!curveEdit || previewing || (!curvePending() && persisted)) return;
    try {
      applyDocument(curveDocument(), { remember: Boolean(curvePending()) });
      samplePosition({ draft: false });
      notify(persisted ? `${curveLabel(curveEdit.side)}弧线已保存，前后关键帧保留，播放已更新。` : '弧线已用于本页播放，浏览器保存失败，请导出动画 JSON。');
    } catch (error) { notify(error.message);refresh(); }
  }
  function endCurveEdit({ resample = true } = {}) {
    if (!curveEdit) return;
    viewer.poseEditor.setTarget(null);curveEdit = null;curveDragStart = null;
    onApply(transitionOptions(document));
    if (resample && active) samplePosition({ draft: false });
  }
  function beginCurveEdit(side) {
    if (!active || previewing || !document.enabled) return;
    if (trajectoryPoseEdit) endTrajectoryPose();
    if (guideEditor.active()) guideEditor.cancel();
    if (curveEdit?.side === side) return;
    if (curveEdit) endCurveEdit();
    if (dirty) saveDraft();
    let span = curveSpan();
    if (!span || sameAnchor(span.from, span.to)) { notify('至少保留两个启用的关键帧，才能拉弧线。');return; }
    const middleTime = (span.startTime + span.endTime) / 2;
    const visibleTime = Math.min(segmentCount() * duration(), ((middleTime % source.period) + source.period) % source.period);
    seekTime(visibleTime);span = curveSpan();
    const data = viewer.motion.sampleTrajectory({ ...transitionOptions(document), startTime: span.startTime, endTime: span.endTime, samples: 3 });
    const joint = side + 'Ankle', start = data.frames[0].joints[joint], end = data.frames.at(-1).joints[joint];
    const midpoint = start.map((value, index) => (value + end[index]) / 2);
    const saved = document.footCurves?.find(curve => footCurveMatches(curve, span, side));
    const blend = viewer.motion.getFootCurveSpan((span.startTime + span.endTime) / 2).blend;
    const curve = saved ? clone(saved) : { id: crypto.randomUUID(), side, from: anchorIdentity(span.from), to: anchorIdentity(span.to),
      bend: data.frames[1].joints[joint].map((value, index) => (value - (start[index] * (1 - blend) + end[index] * blend)) / (4 * blend * (1 - blend))) };
    curveEdit = { side, span, curve, midpoint };dirty = false;poseHistory = [];
    trajectoryPreferences.enabled = true;trajectoryPreferences.feet = true;curveDeviation = 0;
    const setCurve = next => {
      const validated = validateFootCurves([next])[0], previous = curveEdit.curve;
      curveEdit.curve = validated;
      try { previewCurve(); }
      catch (error) { curveEdit.curve = previous;previewCurve();throw error; }
      return clone(curveEdit.curve);
    };
    const adapter = {
      kind: 'footCurve', group: viewer.motion.group,
      getEditableHandles: () => [{ id: side + 'FootCurve', label: `${curveLabel(side)}弧线中点`, canRotate: false,
        position: curveEdit.midpoint.map((value, index) => value + curveEdit.curve.bend[index]), quaternion: [0, 0, 0, 1] }],
      capturePose: () => clone(curveEdit.curve), applyPose: setCurve,
      editHandle: (id, change) => {
        if (id !== side + 'FootCurve' || !change.position) throw new Error('请移动弧线中点。');
        return setCurve({ ...curveEdit.curve, bend: change.position.map((value, index) => value - curveEdit.midpoint[index]) });
      },
    };
    viewer.poseEditor.setTarget(adapter);viewer.poseEditor.setTransformMode('translate');
    previewCurve();refresh();
  }
  function curveChanged(event) {
    if (!curveEdit) return;
    if (event.phase === 'start') { curveDragStart = clone(curveEdit.curve);return; }
    const changed = curveDragStart && curveEdit.curve.bend.some((value, index) => Math.abs(value - curveDragStart.bend[index]) > 1e-8);
    if (event.phase === 'commit' || (event.phase === 'end' && changed)) saveCurve();
    if (event.phase === 'end') curveDragStart = null;
    refresh();
  }
  function resetCurve() {
    if (!curveEdit || previewing) return;
    const id = curveEdit.curve.id, next = clone(document);
    next.footCurves = (next.footCurves ?? []).filter(curve => curve.id !== id);
    endCurveEdit({ resample: false });
    applyDocument(next);samplePosition({ draft: false });notify('已恢复系统自动路线，可撤销此次修改。');
  }
  function refreshCurveControls() {
    if (!active || !$('#transition-curve-note')) return;
    const span = curveEdit?.span ?? curveSpan();
    const valid = span && !sameAnchor(span.from, span.to);
    for (const button of panel.querySelectorAll('[data-foot-curve]')) {
      button.disabled = previewing || !document.enabled || !valid;
      const side = button.dataset.footCurve;
      const saved = valid && document.footCurves?.some(curve => footCurveMatches(curve, span, side));
      button.textContent = `拉${curveLabel(side)}弧线${saved ? ' · 已保存' : ''}`;
      button.classList.toggle('active', curveEdit?.side === side);button.setAttribute('aria-pressed', String(curveEdit?.side === side));
    }
    $('#transition-curve-return').hidden = !curveEdit;
    $('#transition-curve-return').disabled = previewing;
    $('#transition-curve-reset').hidden = !curveEdit;
    $('#transition-curve-reset').disabled = previewing || !curveEdit || !document.footCurves?.some(curve => curve.id === curveEdit.curve.id);
    const constrained = curveDeviation > .001 ? ` 实线路线按腿长或地面调整，最大约 ${(curveDeviation * 100).toFixed(1)} cm；淡虚线是自绘目标。` : '';
    $('#transition-curve-note').textContent = curveEdit ? `${anchorLabel(span.from)} → ${anchorLabel(span.to)}。拖动中点，松手保存；可用下方厘米数值微调。${constrained}`
      : !document.enabled ? '启用过渡调整后，可以拉脚部弧线。' : !valid ? '至少需要两个启用的关键帧。' : '选择左脚或右脚，拉动弧线中点；两端姿态保留，不新增 K 帧。';
  }

  function clearTrajectory() {
    if (trajectoryAnimation !== null) cancelAnimationFrame(trajectoryAnimation);
    trajectoryAnimation = null;trajectoryKey = null;trajectoryRange = null;trajectoryError = '';
    viewer.clearTrajectory();
  }
  function refreshTrajectory(pose) {
    if (!active || !$('#trajectory-enabled')) return;
    for (const [key, value] of Object.entries(trajectoryPreferences)) {
      $('#trajectory-' + key).checked = value;
      if (key !== 'enabled') $('#trajectory-' + key).disabled = !trajectoryPreferences.enabled
        || (['feet', 'knees', 'pelvis'].includes(key) && trajectoryPreferences.allJoints)
        || (key === 'baseline' && !trajectoryPoseEdit?.result?.improved && !guideEditor.active());
    }
    const focused = guideEditor.active() ? viewer.poseEditor.getState().selected || 'pelvis' : trajectoryJoint === 'all' ? null : trajectoryJoint;
    viewer.setTrajectoryVisible({ ...trajectoryPreferences, selectedJoint: focused });
    if (!trajectoryPreferences.enabled) {
      clearTrajectory();$('#trajectory-range').textContent = '';
      $('#trajectory-state').textContent = '辅助线已关闭。';return;
    }
    const selectedRange = selectedTrajectoryRange();
    const currentTime = positionTime(), posePending = Boolean(trajectoryPoseEdit?.result?.improved), guidePending = guideEditor.active();
    const pending = dirty && !previewing && !curveEdit && !trajectoryPoseEdit && !guidePending && !selectedRange, fixed = fixedIndex();
    const previous = pointAt();
    // A new/updated intermediate K enables the correction document on save.
    // Its preview must predict that same behavior even when corrections were off.
    const corrections = document.enabled || (pending && fixed === null) ? document.points.filter(point => !point.skipped) : [];
    const effectiveCorrections = pending && fixed === null
      ? corrections.filter(point => point.id !== previous?.id).concat({ segment, at }) : corrections;
    const skipped = (document.skippedSteps ?? []).filter(index => !(pending && fixed !== null && linkedIndices(fixed).includes(index)));
    const baseAnchors = Array.from({ length: source.steps.length }, (_, index) => ({
      time: index * duration(), label: `原第 ${number(index % source.steps.length)} 步`,
    })).filter((_, index) => !skipped.includes(index)).concat(effectiveCorrections.map(point => ({
      time: (point.segment + point.at) * duration(), label: `K 帧 ${((point.segment + point.at) * duration()).toFixed(2)} s`,
    }))).sort((a, b) => a.time - b.time);
    const anchors = baseAnchors.flatMap(anchor => [-source.period, 0, source.period].map(offset => ({ ...anchor, time: anchor.time + offset, clock: anchor.time })))
      .sort((a, b) => a.time - b.time);
    // Original-node snapping is already handled by locate(). A broad epsilon
    // here would swallow an authored K deliberately placed near an endpoint.
    let start = anchors.findLast(anchor => anchor.time < currentTime) ?? anchors[0];
    let end = anchors.find(anchor => anchor.time > currentTime) ?? anchors.at(-1);
    const endTime = segmentCount() * duration();
    if (linkedEnds() && !skipped.includes(0) && !skipped.includes(source.steps.length - 1)) {
      if (currentTime === 0) start = anchors.find(anchor => anchor.time === 0);
      if (currentTime === endTime) end = anchors.find(anchor => anchor.time === endTime);
    }
    if (curveEdit) {
      start = { time: curveEdit.span.startTime, clock: ((curveEdit.span.startTime % source.period) + source.period) % source.period, label: anchorLabel(curveEdit.span.from) };
      end = { time: curveEdit.span.endTime, clock: ((curveEdit.span.endTime % source.period) + source.period) % source.period, label: anchorLabel(curveEdit.span.to) };
    } else if (guidePending) {
      const inspected = guideEditor.range();
      start = { time: inspected.startTime, clock: ((inspected.startTime % source.period) + source.period) % source.period, label: anchorLabel(inspected.spans[0].from) };
      end = { time: inspected.endTime, clock: ((inspected.endTime % source.period) + source.period) % source.period, label: anchorLabel(inspected.spans.at(-1).to) };
    } else if (selectedRange) {
      start = { time: selectedRange.startTime, clock: selectedRange.from.clock, label: selectedRange.from.label };
      end = { time: selectedRange.endTime, clock: selectedRange.to.clock, label: selectedRange.to.label };
    }
    const wraps = start.time < 0 || end.time > endTime;
    const range = { startTime: start.time, endTime: end.time, startLabel: start.label, endLabel: end.label, pending: pending || posePending || guidePending || Boolean(curvePending()) };
    $('#trajectory-range').textContent = `${start.label} → ${end.label} · ${wraps ? `${start.clock.toFixed(2)}→${end.clock.toFixed(2)} s · 跨循环` : `${start.time.toFixed(2)}–${end.time.toFixed(2)} s`}`;
    const key = JSON.stringify([trajectoryRevision, start.time, end.time, pending ? [currentTime, fixed, pose] : null]);
    viewer.setTrajectoryProgress(rangeProgress(currentTime, start.time, end.time), viewer.motion.getMetrics().joints);
    if (key === trajectoryKey) {
      $('#trajectory-state').textContent = trajectoryError ? `轨迹无法预览：${trajectoryError}` : trajectoryAnimation !== null
        ? '正在更新轨迹…' : guidePending ? '整段过渡预览 · 按 K 应用' : posePending ? '姿态修正预览 · 按 K 应用到已有帧' : curveEdit ? curvePending() ? '弧线预览 · 松手或按 K 保存' : '已保存弧线 · 脚部沿路线补帧' : pending ? '未保存调整预览 · 按 K 后应用' : '实际保存动画轨迹 · 拖动时间轴检查';
      return;
    }
    if (trajectoryAnimation !== null) cancelAnimationFrame(trajectoryAnimation);
    trajectoryKey = key;trajectoryRange = range;trajectoryError = '';
    viewer.clearTrajectory();$('#trajectory-state').textContent = '正在更新轨迹…';
    const sampleOptions = {
      ...transitionOptions(curveDocument()), startTime: start.time, endTime: end.time, samples: 65,
      footCurves: document.enabled || (pending && fixed === null) ? clone(curveDocument().footCurves ?? []) : [],
      skippedSteps: skipped,
      includeTimes: selectedRange?.includeTimes ?? anchors.map(anchor => anchor.time).filter(time => time >= start.time && time <= end.time),
    };
    if (trajectoryPoseEdit?.result) {
      Object.assign(sampleOptions, transitionOptions(trajectoryPoseEdit.result.document), { steps: clone(trajectoryPoseEdit.result.sequence.steps) });
    }
    if (pending && fixed !== null) {
      sampleOptions.steps = clone(source.steps);sampleOptions.steps[fixed].pose = clone(pose);
      const last = source.steps.length - 1;
      if (linkedEnds() && (fixed === 0 || fixed === last)) {
        sampleOptions.steps[0].pose = clone(pose);sampleOptions.steps[last].pose = clone(pose);
      }
    } else if (pending) {
      let id = previous?.id ?? 'trajectory-draft';
      while (!previous && document.points.some(point => point.id === id)) id += '-preview';
      const point = { id, segment, at, pose: clone(pose) };
      sampleOptions.corrections = document.points.filter(item => !item.skipped && item.id !== previous?.id).map(clone).concat(point);
      sampleOptions.legPath = document.legPath;sampleOptions.interpolation = document.interpolation;
    }
    // Coalesce drag events into one pure sample. Neither the rig nor saved
    // frames are advanced or replaced while these display paths are generated.
    trajectoryAnimation = requestAnimationFrame(() => {
      trajectoryAnimation = null;
      if (!active || !trajectoryPreferences.enabled || trajectoryKey !== key) return;
      try {
        const data = viewer.motion.sampleTrajectory(sampleOptions);
        curveDeviation = Math.max(0, ...data.frames.flatMap(frame => Object.entries(frame.curveTargets ?? {}).map(([side, target]) => Math.hypot(...target.map((value, index) => value - frame.joints[side + 'Ankle'][index])))));
        const keyframeTimes = selectedRange?.includeTimes ?? getTrajectoryAnchors(source, document).flatMap(anchor => [-source.period, 0, source.period].map(offset => anchor.time + offset)).filter(time => time >= start.time && time <= end.time);
        const baselineFrames = posePending || guidePending ? viewer.motion.sampleTrajectory({ ...sampleOptions, ...transitionOptions(document),
          steps: clone(source.steps), segmentGuides: clone(document.enabled ? document.segmentGuides ?? [] : []), footCurves: clone(document.enabled ? document.footCurves ?? [] : []) }).frames : undefined;
        viewer.setTrajectoryData({ ...data, keyframeTimes, ...(baselineFrames ? { baselineFrames } : {}), pending: pending || posePending || guidePending || Boolean(curvePending()) });
        viewer.setTrajectoryVisible({ ...trajectoryPreferences, selectedJoint: guideEditor.active() ? viewer.poseEditor.getState().selected || 'pelvis' : trajectoryJoint === 'all' ? null : trajectoryJoint });
        viewer.setTrajectoryProgress(rangeProgress(positionTime(), start.time, end.time), viewer.motion.getMetrics().joints);
        $('#trajectory-state').textContent = guidePending ? '整段过渡预览 · 按 K 应用' : posePending ? '姿态修正预览 · 按 K 应用到已有帧' : curveEdit ? curvePending() ? '弧线预览 · 松手或按 K 保存' : '已保存弧线 · 脚部沿路线补帧' : pending ? '未保存调整预览 · 按 K 后应用' : '实际保存动画轨迹 · 拖动时间轴检查';
        refreshCurveControls();
      } catch (error) {
        trajectoryError = error.message;viewer.clearTrajectory();
        $('#trajectory-state').textContent = `轨迹无法预览：${trajectoryError}`;
      }
    });
  }

  function refreshPosition() {
    if (!active || !$('#transition-scrub')) return;
    $('#transition-scrub').value = String(at);
    if (globalThis.document.activeElement !== $('#transition-percent')) $('#transition-percent').value = String(Number((at * 100).toFixed(2)));
    $('#transition-position-label').textContent = `${(at * 100).toFixed(1)}% · ${positionTime().toFixed(2)} s`;
    const fixed = fixedIndex();
    const skipped = currentSkipped();
    $('#transition-title').textContent = fixed !== null ? `原第 ${number(fixed)} 步 · ${skipped ? '已跳过' : '固定关键帧'}` : `第 ${range(segment)} 步${skipped ? ' · 此 K 已跳过' : ''}`;
    $('#transition-play').textContent = previewing ? '暂停这一段' : '循环预览这一段';
    $('#transition-play').setAttribute('aria-pressed', String(previewing));
    const endpoint = fixed !== null;
    $('#transition-save').disabled = previewing || (endpoint && !dirty);
    $('#transition-save').textContent = skipped ? '更新并恢复此帧 · K' : endpoint ? '更新原关键帧 · K' : pointAt() ? '更新这个关键帧 · K' : '保存关键帧 · K';
    $('#transition-edit-state').textContent = previewing ? '预览已保存的过渡。暂停后可以继续调整。'
      : skipped ? dirty ? '当前调整已暂存。按 K 更新并恢复此帧，或先用恢复按钮还原保存姿态。' : '此帧已跳过 · 当前显示自动补帧。原姿态保留，点“恢复此帧”即可还原。'
        : endpoint ? dirty ? '原姿态调整已暂存。按 K 更新原位置，保留中间 K 帧并重新补帧。' : '可以直接调整这个原姿态，再按 K 更新。原位置与编号保留。'
        : dirty ? '已暂存当前调整。按 K 保存后，两侧过渡会重新生成。'
          : pointAt() ? '已保存的关键帧，两侧自动补帧。可以继续微调，再按 K 更新。' : '停在出错的画面，调整肘、膝或其他部位，然后按 K 保存。';
    for (const button of shelf.querySelectorAll('[data-transition-segment]')) {
      const selected = Number(button.dataset.transitionSegment) === segment;
      button.classList.toggle('active', selected);button.setAttribute('aria-pressed', String(selected));
    }
    for (const button of shelf.querySelectorAll('[data-transition-point]')) button.classList.toggle('active', button.dataset.transitionPoint === pointAt()?.id);
    globalThis.document.querySelector('#viewer-overline').textContent = 'TRANSITION WORKSHOP';
    globalThis.document.querySelector('#viewer-label').textContent = `${range(segment)} · ${(at * 100).toFixed(1)}%`;
    globalThis.document.querySelector('#viewer-subtitle').textContent = endpoint ? '直接修改原姿态，按 K 更新；首尾第 09 步同步。' : '调整后按 K 保存，前后相邻区间自动补帧。';
    global('#transition-global-label').textContent = `${range(segment)} · ${positionTime().toFixed(2)} s${skipped ? ' · 此帧已跳过' : ''}${dirty ? ' · 当前调整已暂存' : ''}`;
    const inspected = guideEditor.range(), scrub = global('#transition-global-scrub');
    scrub.min = String(inspected?.startTime ?? 0);scrub.max = String(inspected?.endTime ?? segmentCount() * duration());
    // A selected K can be off the millisecond grid. Native range validation
    // must not round that exact endpoint back into the segment.
    scrub.step = inspected ? 'any' : '0.001';
    scrub.value = String(inspected ? clampGuideTime(positionTime(), inspected) : (segment + at) * duration());
    scrub.setAttribute('aria-label', inspected ? '智能调节区间时间轴' : '动画编辑完整时间轴');
    global('#transition-transport').classList.toggle('is-range-locked', Boolean(inspected));
    global('#transition-transport-help').textContent = inspected ? '区间已锁定 · 拖动不会退出 · K 应用' : '← / → 逐帧 · 空格预览 · K 保存';
    const scope = global('#transition-preview-scope');
    if (inspected) {
      guidedScope ??= scope.value;scope.value = 'segment';scope.disabled = true;
    } else {
      if (guidedScope !== null) { scope.value = guidedScope;guidedScope = null; }
      scope.disabled = false;
    }
    global('#transition-global-prev').disabled = Boolean(inspected) && positionTime() <= inspected.startTime;
    global('#transition-global-next').disabled = Boolean(inspected) && positionTime() >= inspected.endTime;
    renderMarkers();
    global('#transition-global-play').textContent = previewing ? '暂停' : '预览';
    global('#transition-keyframe-button').disabled = previewing || (endpoint && !dirty);
    global('#transition-keyframe-button').textContent = skipped ? '更新并恢复 · K' : endpoint ? '更新原关键帧 · K' : pointAt() ? '更新关键帧 · K' : '保存关键帧 · K';
    for (const button of [global('#transition-skip-button'), $('#transition-skip-current')]) {
      button.disabled = previewing || Boolean(curveEdit) || Boolean(trajectoryPoseEdit) || guideEditor.active() || (fixed === null && !pointAt());
      button.textContent = skipped ? '恢复此帧' : '跳过此帧';
      button.setAttribute('aria-pressed', String(skipped));
      button.title = fixed !== null && linkedIndices(fixed).length === 2 ? '首尾第 09 步同步跳过或恢复，原姿态保留' : '保留姿态，切换此帧是否参与自动补帧';
    }
    if (curveEdit) {
      $('#transition-title').textContent = `${curveLabel(curveEdit.side)} · 拉弧线`;
      for (const button of [$('#transition-save'), global('#transition-keyframe-button')]) {
        button.textContent = '保存弧线 · K';button.disabled = previewing || (!curvePending() && persisted);
      }
      $('#transition-edit-state').textContent = '移动弧线中点改变路线，松手自动保存；不新增姿态帧。Esc 返回摆姿。';
      global('#transition-global-label').textContent = `${curveLabel(curveEdit.side)}弧线 · ${positionTime().toFixed(2)} s`;
      global('#viewer-label').textContent = `${curveLabel(curveEdit.side)} · 轨迹调整`;
      global('#viewer-subtitle').textContent = '拖动弧线中点；松手保存路线，两端关键帧保持原姿态。';
    }
    if (trajectoryPoseEdit) {
      const label = `${jointLabel(trajectoryPoseEdit.joint)}轨迹 · 修正${anchorLabel(trajectoryPoseEdit.anchor)}`;
      $('#transition-title').textContent = label;
      for (const button of [$('#transition-save'), global('#transition-keyframe-button')]) {
        button.textContent = '应用姿态修正 · K';button.disabled = previewing || !trajectoryPoseEdit.result?.improved;
      }
      $('#transition-edit-state').textContent = '松手只预览，K 更新所选已有关键帧。Esc 取消修正并返回检查。';
      global('#transition-global-label').textContent = `${label} · ${trajectoryPoseEdit.time.toFixed(2)} s`;
      global('#viewer-label').textContent = label;global('#viewer-subtitle').textContent = '从真实轨迹反求姿态，前后过渡重新生成。';
    }
    if (guideEditor.active()) {
      const bounds = guideEditor.range(), progress = clamp((positionTime() - bounds.startTime) / (bounds.endTime - bounds.startTime));
      $('#transition-title').textContent = '整段过渡 · 路线预览';
      for (const button of [$('#transition-save'), global('#transition-keyframe-button')]) { button.textContent = '应用整段过渡 · K';button.disabled = previewing; }
      $('#transition-edit-state').textContent = '时间轴锁在所选范围内，拖动和逐帧不会退出或丢失预览。K 应用，取消／Esc 退出。';
      global('#transition-global-label').textContent = `智能调节 · ${anchorLabel(bounds.anchors[0])} → ${anchorLabel(bounds.anchors.at(-1))} · ${bounds.startTime.toFixed(2)}–${bounds.endTime.toFixed(2)} s · ${(progress * 100).toFixed(1)}%`;
      global('#viewer-label').textContent = '整段过渡 · 智能调整';global('#viewer-subtitle').textContent = '两端及范围内保存姿态保留，系统协调中间的路线与转向。';
    }
  }

  function samplePosition({ draft = true } = {}) {
    applying = true;
    try {
      const time = positionTime(), clock = ((time % source.period) + source.period) % source.period;
      viewer.setTime(clock);viewer.motion.update(time);
      const savedDraft = document.draft;
      const restore = draft && !previewing && !curveEdit && !trajectoryPoseEdit && !guideEditor.active() && savedDraft?.segment === segment && near(savedDraft.at, at);
      if (restore) viewer.motion.applyPose(savedDraft.pose);
      if (!previewing) pointName = restore ? savedDraft.name || '' : pointAt()?.name || '';
      dirty = Boolean(restore);
      viewer.poseEditor.refresh();viewer.poseEditor.setEnabled(!previewing);viewer.dirty = true;
    } finally { applying = false; }
    refresh();
  }
  function pause() {
    const guided = guideEditor.range();
    if (previewing && guided) guidedClock = clampGuideTime(previewClock, guided);
    const outsideEditor = previewing && !guided && viewer.time > segmentCount() * duration();
    previewing = false;lastTick = null;
    if (animation !== null) cancelAnimationFrame(animation);
    animation = null;
    if (active) viewer.poseEditor.setEnabled(true);
    if (outsideEditor) { segment = segmentCount() - 1;at = 1;samplePosition({ draft: false });return; }
    if (curveEdit) {
      const span = curveSpan();if (span && sameAnchor(span.from, curveEdit.span.from) && sameAnchor(span.to, curveEdit.span.to)) curveEdit.span = span;
    }
    refresh();
  }
  function locate(index, progress = .5, { draft = true, transportTime } = {}) {
    pause();if (curveEdit) endCurveEdit({ resample: false });
    const guided = guideEditor.range();
    if (guided) {
      guidedClock = transportTime === undefined
        ? unfoldGuideClock((index + clamp(progress)) * duration(), guided, source.period)
        : clampGuideTime(transportTime, guided);
      const clock = ((guidedClock % source.period) + source.period) % source.period, coordinate = clock / duration();
      segment = Math.min(segmentCount() - 1, Math.floor(coordinate));at = clamp(coordinate - segment);
    } else { segment = Math.min(segmentCount() - 1, Math.max(0, index));at = clamp(progress); }
    if (!trajectoryPoseEdit) trajectoryProbe = null;
    // Match the sampler's arithmetic tolerance without swallowing a saved K
    // deliberately placed very close to an original node.
    const tolerance = 32 * Number.EPSILON * Math.max(1, source.steps.length);
    const points = document.points.filter(point => point.segment === segment);
    const first = Math.min(1, ...points.map(point => point.at)), last = Math.max(0, ...points.map(point => point.at));
    if (!guided && at <= Math.min(tolerance, first / 2)) at = 0;
    else if (!guided && 1 - at <= Math.min(tolerance, (1 - last) / 2)) at = 1;
    poseHistory = [];samplePosition({ draft });renderShelf();
  }
  function previewTick(tick) {
    if (!active || !previewing) return;
    const previousSegment = segment;
    if (lastTick !== null) {
      const elapsed = Math.min(.08, (tick - lastTick) / 1000) * previewSpeed;
      const inspectedRange = guideEditor.range() ?? selectedTrajectoryRange();
      if (guideEditor.active() || (curveEdit || inspectedRange) && global('#transition-preview-scope').value !== 'loop') {
        const { startTime, endTime } = curveEdit?.span ?? inspectedRange;
        previewClock = startTime + (previewClock - startTime + elapsed) % (endTime - startTime);
        const coordinate = (((previewClock % source.period) + source.period) % source.period) / duration();
        segment = Math.min(segmentCount() - 1, Math.floor(coordinate));at = clamp(coordinate - segment);
      } else if (global('#transition-preview-scope').value === 'loop') {
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
    if (curveEdit && curvePending()) { saveCurve();if (!persisted || curvePending()) return; }
    const inspectedRange = guideEditor.range() ?? selectedTrajectoryRange();
    previewing = true;poseHistory = [];at = 0;previewClock = guideEditor.active() ? inspectedRange.startTime : global('#transition-preview-scope').value === 'loop' ? 0 : curveEdit ? curveEdit.span.startTime : inspectedRange ? inspectedRange.startTime : segment * duration();if(!guideEditor.active() && global('#transition-preview-scope').value === 'loop')segment=0;lastTick = null;viewer.playing = false;
    viewer.poseEditor.setEnabled(false);refresh();
    animation = requestAnimationFrame(previewTick);
  }

  function renderShelf() {
    if (!active) return;
    const points = document.points.filter(point => point.segment === segment).sort((a, b) => a.at - b.at);
    shelf.innerHTML = `<div class="presets-heading"><h3>选择一段过渡</h3><span>${segmentCount()} 段</span></div>
      <p class="presets-copy">启用的帧参与补帧。可跳过一帧比较路线，再恢复原姿态。</p>
      <div class="transition-segments">${Array.from({ length: segmentCount() }, (_, index) => `<button data-transition-segment="${index}" aria-pressed="${index === segment}" class="${index === segment ? 'active' : ''}"><strong>${range(index)}</strong><span>${document.points.filter(point => point.segment === index).length} 个修正点</span></button>`).join('')}</div>
      <div class="transition-preview"><button data-transition-endpoint="0">编辑原第 ${number(segment)} 步${stepSkipped(segment) ? ' · 已跳过' : ''}</button><button data-transition-endpoint="1">编辑原第 ${number((segment + 1) % source.steps.length)} 步${stepSkipped((segment + 1) % source.steps.length) ? ' · 已跳过' : ''}</button></div>
      <div class="presets-heading transition-points-heading"><h3>这一段的修正点</h3><span>${points.length}</span></div>
      ${points.length ? `<div class="transition-points">${points.map(point => `<div class="transition-point ${point.skipped ? 'is-skipped' : ''}"><button data-transition-point="${escape(point.id)}"><strong>${(point.at * 100).toFixed(1)}%</strong><span>${escape(point.name || '过渡修正')}${point.skipped ? ' · 已跳过' : ''}</span></button><button data-transition-remove="${escape(point.id)}" aria-label="移除 ${(point.at * 100).toFixed(1)}% 修正点" title="移除修正点">×</button></div>`).join('')}</div>` : '<p class="pose-note">还没有修正点。可从 25%、50%、75% 开始检查。</p>'}
      ${document.draft ? '<button class="focus-button" id="transition-return-draft">回到暂存的调整</button>' : ''}
      <button class="focus-button" id="transition-watch-loop">查看完整循环</button>`;
    for (const button of shelf.querySelectorAll('[data-transition-segment]')) button.addEventListener('click', () => locate(Number(button.dataset.transitionSegment)));
    for (const button of shelf.querySelectorAll('[data-transition-endpoint]')) button.addEventListener('click', () => locate(segment, Number(button.dataset.transitionEndpoint)));
    for (const button of shelf.querySelectorAll('[data-transition-point]')) button.addEventListener('click', () => {
      const point = document.points.find(item => item.id === button.dataset.transitionPoint);if (point) locate(point.segment, point.at);
    });
    for (const button of shelf.querySelectorAll('[data-transition-remove]')) button.addEventListener('click', () => {
      pause();if (guideEditor.active()) guideEditor.cancel({ resample: false });if (trajectoryPoseEdit) endTrajectoryPose({ resample: false });if (curveEdit) endCurveEdit({ resample: false });const next = clone(document);next.points = next.points.filter(point => point.id !== button.dataset.transitionRemove);
      try { delete next.draft;applyDocument(next);samplePosition({ draft: false });notify('修正点已移除，可撤销这次修改。'); }
      catch (error) { notify(error.message);refresh(); }
    });
    shelf.querySelector('#transition-return-draft')?.addEventListener('click', () => locate(document.draft.segment, document.draft.at));
    shelf.querySelector('#transition-watch-loop').addEventListener('click', onExit);
    renderMarkers();
    refreshPosition();
  }

  function seekTime(time) {
    if (!Number.isFinite(time)) return;
    if (guideEditor.active()) { locate(0, .5, { transportTime: clampGuideTime(time, guideEditor.range()) });return; }
    const coordinate = Math.min(segmentCount(), Math.max(0, time / duration()));
    const index = Math.min(segmentCount() - 1, Math.floor(coordinate));locate(index, clamp(coordinate - index));
  }
  function stepFrame(direction) {
    const frames = positionTime() * 60, grid = Math.round(frames);
    const stable = Math.abs(frames - grid) <= 32 * Number.EPSILON * Math.max(1, Math.abs(frames)) ? grid : frames;
    seekTime((stable + direction) / 60);
  }
  function renderMarkers() {
    const inspected = guideEditor.range();
    // Route handle changes do not change the timeline's anchor metadata.
    // Keep its DOM stable during scrubbing and playback.
    if (markerSource === source && markerDocument === document && markerPlan === inspected) return;
    const endTime = segmentCount() * duration(), markers = global('#transition-global-markers');
    if (inspected) {
      const anchors = guideTransportMarkers(getTrajectoryAnchors(source, guideEditor.document()), inspected, source.period);
      markers.innerHTML = anchors.map(anchor => `<button class="${anchor.kind === 'step' ? 'transition-fixed-key' : 'transition-edited-key'} ${anchor.active ? '' : 'is-skipped'}" style="left:${anchor.percent}%" data-transition-time="${anchor.time}" aria-label="${escape(anchor.label)}，区间 ${anchor.time.toFixed(2)} 秒" title="${escape(anchor.label)} · ${anchor.time.toFixed(2)} s"></button>`).join('');
      for (const button of markers.querySelectorAll('[data-transition-time]')) button.addEventListener('click', () => seekTime(Number(button.dataset.transitionTime)));
      markerSource = source;markerDocument = document;markerPlan = inspected;return;
    }
    const fixed = source.steps.slice(0, segmentCount() + 1).map((step, index) => `<button class="transition-fixed-key ${stepSkipped(index) ? 'is-skipped' : ''}" style="left:${index * duration() / endTime * 100}%" data-transition-fixed="${index}" aria-label="原第 ${number(index)} 步关键姿势${stepSkipped(index) ? '，已跳过' : ''}" title="原第 ${number(index)} 步 · ${(index * duration()).toFixed(2)} s${stepSkipped(index) ? ' · 已跳过' : ''}"></button>`);
    const edited = document.points.filter(point => point.segment < segmentCount()).map(point => `<button class="transition-edited-key ${point.skipped ? 'is-skipped' : ''}" style="left:${(point.segment + point.at) * duration() / endTime * 100}%" data-transition-marker="${escape(point.id)}" aria-label="过渡关键帧 ${escape(point.name || '')}${point.skipped ? '，已跳过' : ''}" title="${escape(point.name || '过渡关键帧')} · ${((point.segment + point.at) * duration()).toFixed(2)} s${point.skipped ? ' · 已跳过' : ''}"></button>`);
    markers.innerHTML = [...fixed, ...edited].join('');
    for (const button of markers.querySelectorAll('[data-transition-fixed]')) button.addEventListener('click', () => seekTime(Number(button.dataset.transitionFixed) * duration()));
    for (const button of markers.querySelectorAll('[data-transition-marker]')) button.addEventListener('click', () => {
      const point = document.points.find(item => item.id === button.dataset.transitionMarker);if (point) locate(point.segment, point.at);
    });
    markerSource = source;markerDocument = document;markerPlan = inspected;
  }

  function render() {
    if (!active) return;
    panel.innerHTML = `<div class="detail-kicker"><span>TRANSITION WORKSHOP</span><span>EDIT</span></div>
      <h2 id="transition-title" class="detail-title"></h2>
      <p class="detail-copy pose-intro">选择两个关键帧，检查实际关节轨迹，再从轨迹纠正对应姿态。</p>
      <div class="trajectory-controls">
        <div class="trajectory-heading"><strong>轨迹辅助线</strong><label><input id="trajectory-enabled" type="checkbox"/>显示</label></div>
        <div class="trajectory-range-picker"><label>起点<select id="trajectory-from" aria-label="轨迹范围起点"></select></label><label>终点<select id="trajectory-to" aria-label="轨迹范围终点"></select></label><button id="trajectory-auto-range">跟随当前相邻帧</button></div>
        <p id="trajectory-range-note"></p>
        <div class="trajectory-toggles"><label><input id="trajectory-allJoints" type="checkbox"/>全关节</label><label><input id="trajectory-feet" type="checkbox"/>脚踝</label><label><input id="trajectory-knees" type="checkbox"/>膝盖</label><label><input id="trajectory-pelvis" type="checkbox"/>骨盆</label><label><input id="trajectory-baseline" type="checkbox"/>原路线对照</label></div>
        <label class="trajectory-joint-picker">重点检查<select id="trajectory-joint" aria-label="轨迹关节"><option value="all">全部关节轨迹</option>${TRAJECTORY_JOINTS.map(channel => `<option value="${escape(channel.joint)}">${escape(channel.label)}</option>`).join('')}</select></label>
        <div class="trajectory-legend"><span class="trajectory-left">左侧蓝</span><span class="trajectory-right">右侧橙</span><span class="trajectory-pelvis">骨盆青</span></div>
        <p>来自当前保存动画的实际骨架。箭头表示方向，大圆点标出已有关键帧。</p>
        <output id="trajectory-range"></output><span id="trajectory-state" role="status"></span>
      </div>
      ${segmentGuideMarkup}
      <details class="trajectory-legacy-pose"><summary>从轨迹修正关键帧</summary><div class="trajectory-pose-controls"><div class="trajectory-probe-heading"><strong>从轨迹纠正姿态</strong><output id="trajectory-pose-time"></output></div><label class="trajectory-joint-picker">将修正的已有关键帧<select id="trajectory-pose-frame" aria-label="轨迹要修正的已有帧"></select></label><div class="trajectory-pose-actions"><button id="trajectory-pose-begin">选中轨迹点 · 开始修正</button><button id="trajectory-pose-apply" hidden>应用姿态修正 · K</button><button id="trajectory-pose-cancel" hidden>取消预览 · 返回检查</button></div><p id="trajectory-pose-note" class="pose-note"></p></div></details>
      <details class="trajectory-legacy-curves"><summary>脚踝目标弧线</summary><div class="foot-curve-controls"><strong>拉脚部弧线</strong><div class="foot-curve-actions"><button data-foot-curve="left" aria-pressed="false">拉左脚弧线</button><button data-foot-curve="right" aria-pressed="false">拉右脚弧线</button><button id="transition-curve-return" hidden>返回摆姿</button><button id="transition-curve-reset" hidden>恢复自动路线</button></div><p id="transition-curve-note" class="pose-note"></p></div></details>
      <div class="pose-field"><label for="transition-interpolation">关键帧之间自动补帧</label><select id="transition-interpolation" aria-label="关键帧补帧方式"><option value="linear">线性 · 匀速</option><option value="smooth">平滑 · 缓入缓出</option></select></div>
      <p class="pose-note">线性决定过渡速度；四肢路线在下方单独选择。</p>
      <details class="transition-time-details"><summary>精确段内位置与慢放</summary><div class="transition-timeline"><div class="timeline-label"><span>段内位置</span><output id="transition-position-label"></output></div><input id="transition-scrub" type="range" min="0" max="1" step="0.001" aria-label="过渡段内时间轴"/>
      <div class="transition-position-controls"><button id="transition-prev-frame" aria-label="过渡前一帧">← 一帧</button><label><input id="transition-percent" type="number" min="0" max="100" step="0.1" aria-label="过渡位置百分比"/> %</label><button id="transition-next-frame" aria-label="过渡后一帧">一帧 →</button></div>
      <div class="transition-preview"><button id="transition-play" aria-pressed="false">循环预览这一段</button><select id="transition-speed" aria-label="过渡预览速度"><option value="0.1">0.1×</option><option value="0.25" selected>0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option></select></div></div></details>
      <p class="pose-note" id="transition-edit-state" aria-live="polite"></p>
      <button class="focus-button transition-skip" id="transition-skip-current" aria-pressed="false">跳过此帧</button>
      <p class="pose-note">跳过后由前后启用帧自动补全，原姿态保留，可随时恢复。</p>
      <div class="pose-field"><label for="transition-handle">调整部位</label><select id="transition-handle" aria-label="过渡调整部位"></select></div>
      <p class="pose-note" id="transition-handle-note"></p>
      <fieldset class="pose-values"><legend id="transition-position-legend">位置 <span>厘米</span></legend>${['左右 X', '高度 Y', '前后 Z'].map((label, i) => `<label>${label}<input type="number" step="1" id="transition-pos-${i}" aria-label="过渡${label}位置，厘米"/></label>`).join('')}</fieldset>
      <fieldset class="pose-values"><legend id="transition-rotation-legend">角度 <span>度</span></legend>${['X', 'Y', 'Z'].map((label, i) => `<label>${label}<input type="number" step="5" id="transition-rot-${i}" aria-label="过渡${label}角度，度"/></label>`).join('')}</fieldset>
      <div class="pose-locks"><label><input id="transition-left-lock" type="checkbox"/>左手固定</label><label><input id="transition-right-lock" type="checkbox"/>右手固定</label><label><input id="transition-ground-lock" type="checkbox"/>脚不穿地</label></div>
      <div class="pose-tools"><button id="transition-undo-pose">撤销姿势调整</button><button id="transition-fit">看全身</button></div>
      <p class="pose-note" id="transition-constraint"></p>
      <div class="detail-section pose-save"><h3>保存当前关键姿势</h3><label class="pose-field"><span>中间关键帧名称（可选）</span><input id="transition-name" maxlength="80" placeholder="例如：左膝向外，腿保持伸直" aria-label="过渡修正名称"/></label><button class="focus-button transition-save" id="transition-save">保存关键帧 · K</button><button class="focus-button" id="transition-undo-document">撤销动画修改</button><p class="pose-note">白色帧更新原姿态，蓝色帧更新中间姿态。保存后用于完整播放，不新增个人步骤。</p></div>
      <details class="transition-settings"><summary>路线与启用设置</summary><label class="pose-field"><span>四肢过渡路线</span><select id="transition-leg-path" aria-label="四肢过渡路线"><option value="arc">沿关键姿态 · 推荐</option><option value="linear">原直线 · 对照</option></select></label><div class="pose-locks"><label><input id="transition-enabled" type="checkbox"/>启用过渡调整</label></div></details>
      <details id="transition-recovery" class="transition-recovery"><summary>恢复原关键帧</summary><p class="pose-note">恢复来源：<strong id="transition-recovery-source"></strong></p><div class="pose-tools"><button id="transition-recovery-original">使用初始保存姿态</button><button id="transition-recovery-import">读取姿态备份 JSON</button></div><input id="transition-recovery-file" type="file" accept=".json,application/json" hidden/><fieldset id="transition-recovery-frames" aria-label="选择需要恢复的原帧"></fieldset><button class="focus-button" id="transition-recovery-apply" disabled>恢复勾选的原帧</button><p id="transition-recovery-note" class="pose-note" role="status"></p><button id="transition-recovery-download" class="focus-button" hidden>下载恢复前备份</button></details>
      <div class="pose-file-actions"><button id="transition-export">导出动画 JSON</button><button id="transition-import">导入动画 JSON</button><input id="transition-import-file" type="file" accept=".json,application/json" hidden/></div>
      <details class="transition-json-backup" id="transition-json-backup"><summary>复制／粘贴动画备份</summary><p class="pose-note">完整备份包含原姿态、K 帧、曲线与暂存。也可粘贴之前的完整动画 JSON 恢复，载入后可撤销。</p><button id="transition-json-generate">生成完整备份</button><textarea id="transition-json-text" aria-label="完整动画备份 JSON" spellcheck="false" placeholder="生成备份，或在这里粘贴完整动画 JSON"></textarea><div class="pose-file-actions"><button id="transition-json-copy">复制 JSON</button><button id="transition-json-import">载入这份备份</button></div><p class="pose-note" id="transition-json-note" role="status"></p></details>`;
    $('#transition-handle').innerHTML = viewer.motion.getEditableHandles().map(handle => `<option value="${handle.id}">${escape(handle.label)}</option>`).join('');
    for (const id of ['from', 'to']) $('#trajectory-' + id).addEventListener('change', () => {
      try {
        const next = { fromKey: $('#trajectory-from').value, toKey: $('#trajectory-to').value };
        const range = resolveTrajectoryRange(getTrajectoryAnchors(source, document), next, source.period);
        pause();if (curveEdit) endCurveEdit({ resample: false });trajectorySelection = next;
        trajectoryPreferences.enabled = true;trajectoryPreferences.allJoints = true;trajectoryRevision++;
        seekTime(range.from.clock ?? range.from.time);refresh();
      } catch (error) { notify(error.message);refreshTrajectorySelectors(); }
    });
    $('#trajectory-auto-range').addEventListener('click', () => { pause();trajectorySelection = null;trajectoryRevision++;refresh(); });
    $('#trajectory-joint').addEventListener('change', event => {
      trajectoryJoint = event.target.value;trajectoryProbe = null;trajectoryPreferences.enabled = true;trajectoryPreferences.allJoints = true;refresh();
    });
    $('#trajectory-pose-begin').addEventListener('click', () => { try { beginTrajectoryPose(); } catch (error) { notify(error.message);refresh(); } });
    $('#trajectory-pose-apply').addEventListener('click', saveTrajectoryPose);
    $('#trajectory-pose-cancel').addEventListener('click', () => endTrajectoryPose());
    for (const button of panel.querySelectorAll('[data-foot-curve]')) button.addEventListener('click', () => {
      try { beginCurveEdit(button.dataset.footCurve); } catch (error) { if (curveEdit) endCurveEdit();notify(error.message); }
    });
    $('#transition-curve-return').addEventListener('click', () => endCurveEdit());
    $('#transition-curve-reset').addEventListener('click', resetCurve);
    for (const key of Object.keys(trajectoryPreferences)) $('#trajectory-' + key).addEventListener('change', event => {
      if (trajectoryPoseEdit && key === 'enabled' && !event.target.checked) endTrajectoryPose();
      if (curveEdit && (key === 'enabled' || key === 'feet') && !event.target.checked) endCurveEdit();
      trajectoryPreferences[key] = event.target.checked;
      try { storage()?.setItem(TRAJECTORY_STORAGE_KEY, JSON.stringify({ version: 1, ...trajectoryPreferences })); }
      catch { notify('轨迹显示设置仅用于当前页面，浏览器未能保存设置。'); }
      refresh();
    });
    $('#transition-scrub').addEventListener('input', event => locate(segment, Number(event.target.value)));
    $('#transition-percent').addEventListener('change', event => { if (event.target.value.trim() && Number.isFinite(Number(event.target.value))) locate(segment, Number(event.target.value) / 100);else refresh(); });
    $('#transition-prev-frame').addEventListener('click', () => stepFrame(-1));
    $('#transition-next-frame').addEventListener('click', () => stepFrame(1));
    $('#transition-play').addEventListener('click', togglePreview);
    $('#transition-skip-current').addEventListener('click', toggleSkipCurrent);
    $('#transition-speed').value = String(previewSpeed);
    $('#transition-speed').addEventListener('change', event => { previewSpeed=Number(event.target.value);global('#transition-global-speed').value=String(previewSpeed); });
    $('#transition-handle').addEventListener('change', event => viewer.poseEditor.select(event.target.value));
    $('#transition-name').addEventListener('input', event => { pointName = event.target.value; });
    for (let i = 0; i < 3; i++) {
      $('#transition-pos-' + i).addEventListener('change', () => edit(() => {
        const values = trajectoryPoseEdit || guideEditor.active() ? clone(viewer.poseEditor.getState().position) : [0, 1, 2].map(axis => Number($('#transition-pos-' + axis).value) / 100);
        if (trajectoryPoseEdit || guideEditor.active()) values[i] = Number($('#transition-pos-' + i).value) / 100;
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
      pause();if (guideEditor.active()) guideEditor.cancel({ resample: false });if (trajectoryPoseEdit) endTrajectoryPose({ resample: false });if (curveEdit) endCurveEdit({ resample: false });const previous = documentHistory.at(-1);
      try {
        if (previous && JSON.stringify(previous.sequence) === JSON.stringify(source)) {
          applyDocument(previous.document, { remember: false });samplePosition({ draft: false });
          if (!persisted) { notify('撤销已用于当前页面，浏览器保存失败；可重试或导出动画 JSON。');return; }
        } else if (onRestoreFrames && (previous || hasPreviousFrameUpdate?.())) {
          acceptFrames(onRestoreFrames(previous));
        } else return;
        if (previous) documentHistory.pop();refresh();notify('已撤销上一次动画修改。');
      } catch (error) { notify(error.message); }
    });
    $('#transition-leg-path').addEventListener('change', event => {
      const path=event.target.value;pause();if (guideEditor.active()) guideEditor.cancel({ resample: false });if (trajectoryPoseEdit) endTrajectoryPose({ resample: false });if (curveEdit) endCurveEdit({ resample: false });const next = { ...clone(document), legPath: path, enabled: true };
      applyDocument(next);samplePosition();
    });
    $('#transition-interpolation').addEventListener('change', event => {
      const interpolation = event.target.value;pause();if (guideEditor.active()) guideEditor.cancel({ resample: false });if (trajectoryPoseEdit) endTrajectoryPose({ resample: false });if (curveEdit) endCurveEdit({ resample: false });
      applyDocument({ ...clone(document), interpolation, enabled: true });samplePosition();
      if (persisted) notify(interpolation === 'linear' ? '已改为线性补帧，相邻关键帧之间按时间匀速过渡。' : '已改为平滑补帧，原步骤之间缓入缓出。');
    });
    $('#transition-enabled').addEventListener('change', event => {
      const enabled=event.target.checked;pause();if (guideEditor.active()) guideEditor.cancel({ resample: false });if (trajectoryPoseEdit) endTrajectoryPose({ resample: false });if (curveEdit) endCurveEdit({ resample: false });
      try { applyDocument({ ...clone(document), enabled });samplePosition({ draft: false }); }
      catch (error) { notify(error.message);refresh(); }
    });
    $('#transition-export').addEventListener('click', () => {
      try { downloadAnimation(animationBackup());notify('动画备份已导出，包含原关键姿态、过渡帧和设置。'); }
      catch (error) { notify(error.message); }
    });
    $('#transition-json-generate').addEventListener('click', () => {
      try {
        const backup = animationBackup();$('#transition-json-text').value = JSON.stringify(backup);
        $('#transition-json-note').textContent = `已生成 ${backup.sequence.steps.length} 个原帧、${backup.points.length} 个 K 帧、${backup.segmentGuides?.length ?? 0} 段智能路线的完整备份。`;
      } catch (error) { notify(error.message); }
    });
    $('#transition-json-copy').addEventListener('click', async () => {
      const text = $('#transition-json-text').value;
      if (!text.trim()) { notify('请先生成备份，或粘贴动画 JSON。');return; }
      try { await navigator.clipboard.writeText(text);$('#transition-json-note').textContent = '完整 JSON 已复制。'; }
      catch { $('#transition-json-text').focus();$('#transition-json-text').select();notify('请按 Ctrl+C 复制选中的完整 JSON。'); }
    });
    $('#transition-json-import').addEventListener('click', () => {
      try { importAnimationText($('#transition-json-text').value); }
      catch (error) { notify(error.message); }
    });
    $('#transition-recovery-original').addEventListener('click', () => loadRecoveryBackup(OFFICIAL_FLARE_SEQUENCE, '初始保存姿态（原始导出）'));
    $('#transition-recovery-import').addEventListener('click', () => $('#transition-recovery-file').click());
    $('#transition-recovery-file').addEventListener('change', async event => {
      const file = event.target.files[0];if (!file) return;
      try {
        if (file.size > 2 * 1024 * 1024) throw new Error('请选择 2 MB 以内的姿态备份 JSON。');
        loadRecoveryBackup(JSON.parse(await file.text()), file.name);
      } catch (error) { notify(error.message); }
      finally { event.target.value = ''; }
    });
    $('#transition-recovery-apply').addEventListener('click', recoverFrames);
    $('#transition-recovery-download').addEventListener('click', () => {
      try {
        const backup = recoveryHistory().entries.at(-1);
        if (backup) { downloadAnimation(backup.animation, 'flare-before-recovery');notify('恢复前的完整动画备份已导出。'); }
      } catch (error) { notify(error.message); }
    });
    $('#transition-import').addEventListener('click', () => $('#transition-import-file').click());
    $('#transition-import-file').addEventListener('change', async event => {
      const file = event.target.files[0];if (!file) return;
      try {
        if (file.size > 2 * 1024 * 1024) throw new Error('请选择 2 MB 以内的动画 JSON。');
        importAnimationText(await file.text(), file.name);
      }
      catch (error) { notify(error.message); }
      finally { event.target.value = ''; }
    });
    guideEditor.bind();renderShelf();refresh();refreshRecovery();refreshIcons();
  }

  function edit(action) {
    if (previewing) return;
    if (guideEditor.active()) { try { action();refresh(); } catch (error) { notify(error.message);refresh(); }return; }
    if (trajectoryPoseEdit) {
      const previous = poseEditSnapshot();
      try { action();if (scrubCheckpoint() && !samePose(previous, poseEditSnapshot())) trajectoryPoseHistory.push(previous);refresh(); }
      catch (error) { setPoseEditSnapshot(previous);notify(error.message);refresh(); }return;
    }
    if (curveEdit) { try { action(); } catch (error) { notify(error.message);refresh(); }return; }
    const previous = currentPose();applying = true;
    try { action();if (scrubCheckpoint()) checkpoint(previous);markChanged(); }
    catch (error) { viewer.motion.applyPose(previous);viewer.poseEditor.refresh();notify(error.message);refresh(); }
    finally { applying = false; }
  }
  function undoPose() {
    if (guideEditor.active()) { guideEditor.undo();return; }
    if (trajectoryPoseEdit && !previewing) {
      const previous = trajectoryPoseHistory.pop();if (previous) setPoseEditSnapshot(previous);refresh();return;
    }
    if (curveEdit && !previewing) { $('#transition-undo-document').click();return; }
    if (previewing || !poseHistory.length) return;
    const previous = poseHistory.pop();applying = true;
    try { viewer.motion.applyPose(previous);viewer.poseEditor.refresh();markChanged(); }
    finally { applying = false; }
  }
  function savePoint() {
    if (previewing) return;
    if (guideEditor.active()) { guideEditor.apply();return; }
    if (trajectoryPoseEdit) { saveTrajectoryPose();return; }
    if (curveEdit) { saveCurve();return; }
    if (fixedIndex() !== null) { saveFixedFrame();return; }
    const previous = pointAt();if (!previous && document.points.length >= 200) { notify('最多保存 200 个修正点，请先导出或整理。');return; }
    const next = clone(document), point = { id: previous?.id || crypto.randomUUID(), segment, at, name: pointName.trim() || `${range(segment)} · ${(at * 100).toFixed(1)}%`, pose: clone(currentPose()) };
    const index = next.points.findIndex(item => item.id === point.id);
    if (index < 0) next.points.push(point);else next.points[index] = point;
    next.enabled = true;
    if (next.draft?.segment === segment && near(next.draft.at, at)) delete next.draft;
    try{
      applyDocument(next);dirty = false;samplePosition({ draft: false });
      const span = trajectoryRange;
      notify(persisted ? span ? `关键帧已保存，${span.startTime.toFixed(2)}–${span.endTime.toFixed(2)} 秒的两侧过渡已更新。` : '关键帧已保存，两侧过渡已重新补帧。' : '关键帧已用于当前页面播放，浏览器保存失败，请导出 JSON 备份。');
    }
    catch(error){notify(error.message);}
  }

  function toggleSkipCurrent() {
    if (previewing || curveEdit || trajectoryPoseEdit || guideEditor.active()) return;
    const fixed = fixedIndex(), point = pointAt();
    if (fixed === null && !point) return;
    pause();
    if (dirty) saveDraft();
    const next = clone(document), restore = currentSkipped();
    if (fixed !== null) {
      const skipped = new Set(next.skippedSteps ?? []);
      for (const index of linkedIndices(fixed)) { if (restore) skipped.delete(index);else skipped.add(index); }
      next.skippedSteps = [...skipped].sort((a, b) => a - b);
    } else next.points.find(item => item.id === point.id).skipped = !restore;
    try {
      applyDocument(next);poseHistory = [];samplePosition({ draft: false });
      notify(persisted ? restore ? '已恢复此帧的保存姿态，前后过渡已重建。' : `已跳过此帧，由前后启用帧自动补全。${fixed !== null && linkedIndices(fixed).length === 2 ? '首尾第 09 步已同步跳过。' : ''}` : '已用于当前页面，浏览器保存失败，请导出动画 JSON 备份。');
    } catch (error) { notify(error.message);refresh(); }
  }

  function acceptFrames(result) {
    if (guideEditor.active()) guideEditor.cancel({ resample: false });
    if (trajectoryPoseEdit) endTrajectoryPose({ restore: false, resample: false });
    if (curveEdit) endCurveEdit({ resample: false });
    source = clone(result.sequence);document = validateTransitionEdits(result.document, source);persisted = true;dirty = false;
    trajectoryRevision++;
    onApply(transitionOptions(document));if (active) { renderShelf();samplePosition({ draft: false }); }
    refreshRecovery();
  }
  function saveFixedFrame() {
    if (!dirty || !onUpdateFrame) return;
    const index = fixedIndex(), previous = snapshot(), next = clone(document);delete next.draft;restoreStep(next, index);
    try {
      const result = onUpdateFrame(index, clone(currentPose()), next);
      documentHistory.push(previous);if (documentHistory.length > 30) documentHistory.shift();
      acceptFrames(result);poseHistory = [];
      notify(`原第 ${number(index)} 步已更新，前后过渡已重新生成，中间 K 帧保留。${index === 0 || index === source.steps.length - 1 ? '首尾闭环姿态已同步。' : ''}`);
    } catch (error) { notify(`${error.message} 当前调整仍在页面中，可继续编辑或导出备份。`); }
  }

  function refresh() {
    if (!active || !$('#transition-handle')) return;
    const state = viewer.poseEditor.getState(), pose = currentPose(), locked = previewing, guided = guideEditor.active();
    panel.classList.toggle('editing-segment-guide', guided);
    const handles = state.handles;
    if (Array.from($('#transition-handle').options).map(option => option.value).join(',') !== handles.map(handle => handle.id).join(',')) {
      $('#transition-handle').innerHTML = handles.map(handle => `<option value="${handle.id}">${escape(handle.label)}</option>`).join('');
    }
    $('#transition-handle').value = state.selected || 'pelvis';
    $('#transition-handle').disabled = previewing || Boolean(curveEdit) || Boolean(trajectoryPoseEdit);
    $('#transition-handle-note').textContent = trajectoryPoseEdit ? '拖动实际轨迹点或彩色轴，反求已有关键帧。松手只预览，K 应用姿态修正。' : curveEdit ? '拖动弧线中点或彩色轴改变路线；松手保存，K 也保存路线。' : state.selected?.endsWith('Knee') || state.selected?.endsWith('Elbow')
      ? '先移动关节圆点调整弯曲方向；旋转会带动小腿或前臂。' : state.selected === 'waist' ? '腰部可独立弯腰、扭腰和侧弯。' : state.selected === 'pelvis'
      ? '髋部独立移动与旋转。移动时上身不再整体平移，腰部配合弯曲；旋转保留上身方向。整体移动或转身请选择躯干。' : state.selected === 'torso'
      ? '整体移动或转向，带动髋部和上身。单独摆髋请选择髋部。' : '拖动彩色轴或旋转环，也可以输入数值微调。';
    $('#transition-rotation-legend').firstChild.textContent = state.selected === 'pelvis' ? '髋部角度 ' : state.selected === 'waist' ? '腰部角度 ' : '角度 ';
    $('#transition-position-legend').firstChild.textContent = trajectoryPoseEdit ? '实际轨迹点 ' : curveEdit ? '弧线中点 ' : '位置 ';
    const rotation = new Euler().setFromQuaternion(new Quaternion().fromArray(state.quaternion || [0, 0, 0, 1]), 'YXZ');
    for (let i = 0; i < 3; i++) {
      const pos = $('#transition-pos-' + i), rot = $('#transition-rot-' + i);
      if (globalThis.document.activeElement !== pos) pos.value = ((state.position?.[i] || 0) * 100).toFixed(1);
      if (globalThis.document.activeElement !== rot) rot.value = MathUtils.radToDeg([rotation.x, rotation.y, rotation.z][i]).toFixed(1);
      pos.disabled = locked;rot.disabled = locked || !state.canRotate;
    }
    for (const side of ['left', 'right']) { $('#transition-' + side + '-lock').checked = pose.limbs[side].handLocked;$('#transition-' + side + '-lock').disabled = locked || Boolean(curveEdit) || Boolean(trajectoryPoseEdit) || guided; }
    $('#transition-ground-lock').checked = pose.groundLock;$('#transition-ground-lock').disabled = locked || Boolean(curveEdit) || Boolean(trajectoryPoseEdit) || guided;
    $('#transition-enabled').checked = document.enabled;$('#transition-leg-path').value = document.legPath;$('#transition-interpolation').value = document.interpolation;
    $('#transition-undo-pose').textContent = trajectoryPoseEdit ? '撤销修正预览' : curveEdit ? '撤销路线调整' : '撤销姿势调整';
    $('#transition-undo-pose').disabled = (trajectoryPoseEdit ? !trajectoryPoseHistory.length : curveEdit ? !documentHistory.length : !poseHistory.length) || previewing;
    $('#transition-interpolation').disabled = guided;$('#transition-enabled').disabled = guided;$('#transition-leg-path').disabled = guided;
    $('#transition-undo-document').disabled = guided || (!documentHistory.length && !hasPreviousFrameUpdate?.());
    $('#transition-recovery-apply').disabled = !recoveryIndices.size || previewing;
    $('#transition-constraint').textContent = state.error || viewer.motion.getMetrics().warnings[0] || '左右指人物本人；四肢保持原有长度。';
    for (const button of globalThis.document.querySelectorAll('[data-pose-operation]')) {
      button.classList.toggle('active', button.dataset.poseOperation === state.mode);button.disabled = locked || (button.dataset.poseOperation === 'rotate' && !state.canRotate);
    }
    if (globalThis.document.activeElement !== $('#transition-name')) $('#transition-name').value = pointName;
    $('#transition-name').disabled = Boolean(curveEdit) || Boolean(trajectoryPoseEdit) || fixedIndex() !== null;
    global('#part-count').textContent = `${state.handles.length} 个${state.target === 'pose' ? '' : '轨迹'}控制点`;
    refreshPosition();refreshTrajectorySelectors();refreshTrajectoryPoseControls();refreshCurveControls();refreshTrajectory(pose);guideEditor.refresh();viewer.dirty = true;
  }
  function onChange(event = {}) {
    if (!active || applying || previewing) return;
    if (event.state?.target === 'footCurve') { curveChanged(event);return; }
    if (event.state?.target === 'trajectoryPose') { trajectoryPoseChanged(event);return; }
    if (event.state?.target === 'segmentGuide') { guideEditor.changed(event);return; }
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
  function leave() { if(!active)return;pause();if (guideEditor.active()) guideEditor.cancel({ resample: false });if (trajectoryPoseEdit) endTrajectoryPose({ resample: false });if (curveEdit) endCurveEdit({ resample: false });if (dirty) saveDraft();active = false;dirty = false;panel.classList.remove('editing-segment-guide');clearTrajectory();viewer.setTrajectoryVisible(false); }
  function setSequence(next) {
    leave();source = clone(next);document = read(source);documentHistory = [];poseHistory = [];trajectorySelection = null;trajectoryProbe = null;segment = 0;at = .5;
    trajectoryRevision++;
    onApply(transitionOptions(document));
  }
  global('#transition-global-scrub').addEventListener('input', event => seekTime(Number(event.target.value)));
  global('#transition-global-prev').addEventListener('click', () => stepFrame(-1));
  global('#transition-global-next').addEventListener('click', () => stepFrame(1));
  global('#transition-global-play').addEventListener('click', togglePreview);
  global('#transition-keyframe-button').addEventListener('click', savePoint);
  global('#transition-skip-button').addEventListener('click', toggleSkipCurrent);
  global('#transition-preview-scope').addEventListener('change', pause);
  global('#transition-global-speed').addEventListener('change', event => { previewSpeed=Number(event.target.value);if($('#transition-speed'))$('#transition-speed').value=String(previewSpeed); });
  let trajectoryPointer = null;
  const canvas = viewer.renderer.domElement;
  canvas.addEventListener('pointerdown', event => { trajectoryPointer = { x: event.clientX, y: event.clientY }; }, true);
  canvas.addEventListener('pointerup', event => {
    const pointer = trajectoryPointer;trajectoryPointer = null;
    if (!active || !pointer || previewing || curveEdit || trajectoryPoseEdit || guideEditor.active() || viewer.poseEditor.getState().dragging || Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 4) return;
    const point = viewer.pickTrajectoryPoint(event, { joint: trajectoryJoint === 'all' ? undefined : trajectoryJoint });
    if (point) { event.preventDefault();event.trajectoryHandled = true;probeTrajectory(point); }
  }, true);
  return { enter, leave, render, refresh, onChange, togglePreview, undoPose, setSequence, savePoint, stepFrame,
    cancelCurveEdit: () => { if (guideEditor.active()) guideEditor.cancel();else if (trajectoryPoseEdit) endTrajectoryPose();else endCurveEdit(); },
    options: () => transitionOptions(document), getDocument: () => clone(document),
    getTrajectoryState: () => ({ preferences: clone(trajectoryPreferences), selection: trajectorySelection ? clone(trajectorySelection) : null, joint: trajectoryJoint, range: trajectoryRange ? clone(trajectoryRange) : null, scheduled: trajectoryAnimation !== null, error: trajectoryError, curveDeviation }),
    getState: () => ({ active, previewing, segment, at, time: positionTime(), fixedIndex: fixedIndex(), currentSkipped: currentSkipped(), dirty, points: document.points.length, enabled: document.enabled, legPath: document.legPath, interpolation: document.interpolation,
      trajectoryProbe: trajectoryProbe ? clone(trajectoryProbe) : null, segmentGuideEditing: guideEditor.state(),
      poseTrajectoryEditing: trajectoryPoseEdit ? { joint: trajectoryPoseEdit.joint, time: trajectoryPoseEdit.time, anchor: clone(trajectoryPoseEdit.anchor),
        pending: Boolean(trajectoryPoseEdit.result?.improved), goal: clone(trajectoryPoseEdit.goal), position: clone(trajectoryPoseEdit.result?.position ?? trajectoryProbe.position),
        error: trajectoryPoseEdit.result?.error ?? 0, initialError: trajectoryPoseEdit.result?.initialError ?? 0 } : null,
      curveEditing: curveEdit ? { side: curveEdit.side, span: clone(curveEdit.span), curve: clone(curveEdit.curve), pending: Boolean(curvePending()) } : null }) };
}
