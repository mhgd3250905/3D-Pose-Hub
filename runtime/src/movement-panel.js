import { Vector3 } from 'three';
import { resolveMovementPoseAnnotations } from './movement-lessons.js';
import { createMovementCards } from './movement-cards.js';
import { resolveMovementTraining } from './movement-training.js';
import { createMovementStage, MOVEMENT_PALETTE, movementRegionColour } from './movement-stage.js';

export const MOVEMENT_CARD_SLOTS = ['shoulder-arm-support', 'core-coordination', 'hip-leg-swing'];

/** The next enabled original, including the authored closing 09. */
export function resolveTeachingSegment(sequence, profile) {
  if (!profile || !sequence?.steps?.length) return null;
  let index = profile.index;
  // The closing original 09 is a held copy of the opening original. Its
  // teaching transition is the opening 09 -> 10, rather than a still interval.
  const earlier = sequence.steps.findIndex((_, at) => at < index &&
    resolveMovementPoseAnnotations(sequence, at)?.sourceStepNumber === profile.sourceStepNumber);
  if (index === sequence.steps.length - 1 && earlier >= 0) index = earlier;
  const next = sequence.steps.findIndex((_, at) => at > index && resolveMovementPoseAnnotations(sequence, at));
  const startTime = index / sequence.steps.length * sequence.period;
  const endTime = next < 0 ? sequence.period : next / sequence.steps.length * sequence.period;
  return endTime > startTime ? { index, next, startTime, endTime } : null;
}

/** Teaching cards attached to normal playback; no separate view or timeline. */
export function createMovementPanel({ viewer, viewport, onChanged, onTrain, onInspect, refreshIcons, cardsFactory = createMovementCards }) {
  // The main motion view shows a clean flare only: the teaching layer (support
  // arrows, swing arcs, joint rings, cards, heading and legend) stays off.
  let enabled = false, suspended = false, mode = null, sequence = null, annotation = null, signature = null, mounted = false;
  let directionData = null;
  let inspectionSlot = null;
  const sampled = new Map();
  const stage = createMovementStage({ container: viewport });
  const cards = cardsFactory({ scene: viewer.scene, model: viewer.coach, camera: viewer.camera, container: viewport, refreshIcons,
    onHover: group => { if (!inspectionSlot) viewer.movementGuide.setFocus(group);viewer.dirty = true; },
    onInspect: typeof onInspect === 'function' ? slot => onInspect(getAnnotations(), slot) : undefined,
    onTogglePlay: () => togglePlay(), onTrain: slot => onTrain?.(getTraining(slot), annotation, slot),
    onLoopSegment: () => loopSegment() });
  const eligible = () => mode === 'motion' && sequence?.motionModel !== 'periodic';
  const active = () => enabled && !suspended && eligible();

  function sampleSegment(profile) {
    if (sampled.has(profile.index)) return sampled.get(profile.index);
    const span = resolveTeachingSegment(sequence, profile);
    const data = viewer.motion.sampleTrajectory({ startTime: span?.startTime ?? profile.time,
      endTime: span?.endTime ?? sequence.period, samples: 12 });
    sampled.set(profile.index, data);return data;
  }
  function hipCues(profile) {
    const data = sampleSegment(profile), first = data.frames[0];
    const next = data.frames.find(frame => frame.time >= first.time + Math.min(.12, (data.endTime - data.startTime) * .2));
    if (!next) return [];
    return ['left', 'right'].flatMap(side => {
      const hip = side + 'Hip', ankle = side + 'Ankle';
      const direction = new Vector3().fromArray(next.joints[ankle]).sub(new Vector3().fromArray(next.joints[hip]))
        .sub(new Vector3().fromArray(first.joints[ankle]).sub(new Vector3().fromArray(first.joints[hip])));
      if (direction.lengthSq() < 1e-8) direction.set(0, 1, 0);
      return [{ id: 'swing-' + side, side, anchor: hip, direction: direction.normalize().toArray(),
        space: 'model', kind: 'arc', color: MOVEMENT_PALETTE.hips, offset: [0, .06, .12], label: '从髋带腿 · 摆动方向示意' }];
    });
  }
  function currentProfile(index, metrics) {
    const saved = resolveMovementPoseAnnotations(sequence, index);
    if (!saved) return null;
    const supports = metrics.supportHands ?? [];
    // Reuse the anatomical teaching data with live contact flags. Copy only
    // this input record; never apply it to the saved sequence or the rig.
    const steps = [...sequence.steps], original = steps[index];
    steps[index] = { ...original, pose: { ...original.pose, limbs: {
      ...original.pose.limbs,
      left: { ...original.pose.limbs.left, handLocked: supports.includes('left') },
      right: { ...original.pose.limbs.right, handLocked: supports.includes('right') },
    } } };
    return resolveMovementPoseAnnotations({ ...sequence, steps }, index);
  }
  function setVisible(value) {
    cards.setEnabled(value);
    stage.setVisible(value);
    viewer.movementGuide.setVisible({ enabled: value, paths: false, support: true, regions: true });
    viewer.dirty = true;
  }
  function mount() {
    if (mounted || !active() || !sequence) return;
    // Only endpoints are needed for the guide's lifetime. Animated anchors
    // always come from live metrics; the original editor retains route tools.
    directionData = viewer.motion.sampleTrajectory({ startTime: 0, endTime: sequence.period,
      samples: Math.max(96, Math.min(768, sequence.steps.length * 40)) });
    viewer.movementGuide.setData({ ...directionData, frames: [directionData.frames[0], directionData.frames.at(-1)] });
    mounted = true;
  }
  function setSequence(next) {
    sequence = next;signature = null;annotation = null;sampled.clear();directionData = null;mounted = false;
    update(viewer.time);onChanged?.();
  }
  function setMode(next) {
    mode = next;signature = null;
    if (!active()) { setVisible(false);viewer.movementGuide.setFocus(null); }
    else update(viewer.time);
    onChanged?.();
  }
  function toggle() {
    enabled = !enabled;signature = null;update(viewer.time);onChanged?.();
  }
  function update(time) {
    if (!active() || !sequence) { setVisible(false);return; }
    mount();
    const metrics = viewer.motion.getMetrics(), index = metrics.demonstration?.index;
    const contact = [...(metrics.supportHands ?? [])].sort().join(',');
    const key = String(index) + ':' + contact;
    if (key !== signature) {
      annotation = currentProfile(index, metrics);signature = key;
      if (annotation) {
        annotation.trainingBySlot = Object.fromEntries(MOVEMENT_CARD_SLOTS.map(slot => {
          const training = resolveMovementTraining(annotation, slot);
          return [slot, training?.primary ? { ...training.primary, compare: training.compare } : null];
        }));
        viewer.movementGuide.setAnnotations({ regions: annotation.regions.map(region => ({ ...region, color: movementRegionColour(region) })),
          cues: [...annotation.cues, ...hipCues(annotation)] });
        viewer.movementGuide.setFocus(null);cards.setAnnotations(annotation);
        const focus = inspectionSlot ? annotation.audienceLabels?.find(value => value.id === inspectionSlot)?.group : cards.getStatus?.().hoverGroup;
        if (focus) viewer.movementGuide.setFocus(focus);
      } else cards.setAnnotations(null);
      setVisible(Boolean(annotation));
    }
    cards.setPlaying?.(viewer.playing);
    stage.update(annotation, metrics, viewer.playing);
  }
  function renderFrame() {
    if (!active() || !annotation) return;
    const rect = viewport.getBoundingClientRect();cards.resize(rect.width, rect.height);
    cards.setPlaying?.(viewer.playing);
    stage.update(annotation, viewer.motion.getMetrics(), viewer.playing);
    cards.update(viewer.time, viewer.motion.getMetrics());
    if (directionData && viewer.movementGuide.setCueDirections) {
      const frames = directionData.frames;
      const at = Math.min(frames.length - 1, Math.max(0, Math.round(viewer.time / sequence.period * (frames.length - 1))));
      const before = frames[Math.max(0, at - 1)], after = frames[Math.min(frames.length - 1, at + 1)];
      viewer.movementGuide.setCueDirections(['left', 'right'].map(side => {
        const relative = frame => new Vector3().fromArray(frame.joints[side + 'Ankle']).sub(new Vector3().fromArray(frame.joints[side + 'Hip']));
        const direction = relative(after).sub(relative(before));
        return { id: 'swing-' + side, enabled: direction.lengthSq() > 1e-8, direction: direction.normalize().toArray() };
      }));
    }
  }
  function togglePlay() {
    if (mode !== 'motion') return;
    viewer.playing = !viewer.playing;
    viewer.dirty = true;cards.setPlaying?.(viewer.playing);onChanged?.();
  }
  function setSuspended(value) {
    suspended = Boolean(value);signature = null;mounted = false;
    update(viewer.time);onChanged?.();
  }
  function getTraining(slot) { return annotation ? resolveMovementTraining(annotation, slot) : null; }
  function loopSegment() {
    if (mode !== 'motion' || suspended) return;
    const metrics = viewer.motion.getMetrics();
    const span = resolveTeachingSegment(sequence, currentProfile(metrics.demonstration?.index, metrics));
    if (!span) return;
    viewer.setPlaybackRange(span);
    if (viewer.time < span.startTime || viewer.time >= span.endTime) viewer.setTime(span.startTime);
    viewer.playing = true;viewer.dirty = true;cards.setPlaying?.(true);onChanged?.();
  }
  function clearLoop() { viewer.setPlaybackRange(null);viewer.dirty = true;onChanged?.(); }
  function getAnnotations() { return annotation ? structuredClone(annotation) : null; }
  function setInspectionSlot(slot = null) {
    inspectionSlot = MOVEMENT_CARD_SLOTS.includes(slot) ? slot : null;cards.setInspecting?.(inspectionSlot);
    const group = annotation?.audienceLabels?.find(value => value.id === inspectionSlot)?.group;
    viewer.movementGuide.setFocus(group ?? null);viewer.dirty = true;
  }
  function dispose() { cards.dispose();stage.dispose();viewer.movementGuide.setVisible({ enabled: false }); }
  return { setSequence, setMode, toggle, update, renderFrame, togglePlay, loopSegment, clearLoop, setSuspended, setInspectionSlot, getTraining, dispose,
    getAnnotations,
    needsRender: () => active() && Boolean(annotation) && Boolean(cards.needsRender?.()),
    get active() { return active(); },
    getState: () => ({ enabled, suspended, active: active(), mode,
      annotation: annotation ? { sourceStepNumber: annotation.sourceStepNumber, index: annotation.index, supportHands: [...annotation.supportHands] } : null,
      cards: cards.getStatus() }) };
}
