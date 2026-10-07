// Muscle roles are teaching links to anatomy, not measured Flare activation.
export const MOVEMENT_LESSON = Object.freeze({
  id: 'flare-09-to-10',
  fromSourceStep: 9,
  toSourceStep: 10,
  title: '09 → 10 · 后双撑转右手支撑',
  cue: Object.freeze({
    trajectory: '左腿抬起，右腿沿弧线扫过。',
    support: '支撑交给右手，左手变轻后让开。',
    body: '肩与骨盆随摆腿协调移动。',
  }),
  groups: Object.freeze([
    { id: 'shoulders', label: '右肩 · 关节控制', role: '稳定承重肩',
      description: '肩袖与三角肌协同控制承重肩，接住单手转换。',
      anchor: 'rightShoulder', bodySide: 'right' },
    { id: 'scapular', label: '右侧肩带', role: '主动推地',
      description: '前锯肌与斜方肌协同调整肩胛，维持支撑空间。',
      anchor: 'shoulderCenter', bodySide: 'right' },
    { id: 'arms', label: '右臂与手腕', role: '伸肘 · 控腕',
      description: '肱三头肌帮助伸肘；前臂与手部肌群帮助控制腕和手掌。',
      anchor: 'rightElbow', bodySide: 'right' },
    { id: 'core', label: '躯干控制', role: '肩髋协调',
      description: '躯干肌群控制胸廓与骨盆的相对运动，让移重和摆腿衔接。',
      anchor: 'waist', bodySide: 'both' },
    { id: 'hipFlexors', label: '左髋 · 抬腿', role: '主动屈髋',
      description: '髂腰肌与股直肌参与屈髋，股四头肌协助保持伸膝。',
      anchor: 'leftHip', bodySide: 'left' },
  ].map(group => Object.freeze(group))),
  teachingNote: '肌群颜色表示功能关联。',
  anatomyNote: '真实肌肉在独立解剖视图中展示；人物上的功能区域为教学示意。',
  missingAnatomyNote: '解剖源缺少腹直肌、腹内斜肌、腹横肌、背阔肌与腰方肌独立网格。',
  evidenceNote: '固定姿态与插值不能确定受力大小或肌肉激活强度。',
});

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const stepId = step => typeof step?.id === 'string' && step.id.trim() ? step.id : null;

function sourceNumber(step, sequence, index) {
  if (!object(step)) return null;
  // Only source metadata identifies a saved step. Its display name, ID and
  // position in the current list cannot establish an original step number.
  const values = [step.sourceStepNumber, step.source?.stepNumber,
    step.stepNumber, sequence.source?.stepNumbers?.[index]]
    .filter(value => value !== undefined && value !== null);
  if (!values.length) return null;
  const parsed = values.map(value => typeof value === 'string' && /^\d+$/.test(value.trim())
    ? Number(value.trim()) : value);
  if (parsed.some(value => !Number.isSafeInteger(value) || value <= 0) ||
      parsed.some(value => value !== parsed[0])) return null;
  return parsed[0];
}

function enabled(step, index, skipped) {
  return !skipped.has(index) && step.skipped !== true && step.disabled !== true &&
    step.enabled !== false && step.active !== false;
}

function matchingSupport(from, to) {
  // Metadata-only callers may resolve a range without attaching poses. When
  // poses are present, changed hand contacts invalidate this particular cue.
  if (from.pose === undefined && to.pose === undefined) return true;
  return from.pose?.limbs?.left?.handLocked === true &&
    from.pose?.limbs?.right?.handLocked === true &&
    to.pose?.limbs?.left?.handLocked === false &&
    to.pose?.limbs?.right?.handLocked === true;
}

/** Resolve the 09 -> 10 lesson against the current saved animation.
 * Input: { period, steps, source?, skippedSteps? }, with current transition
 * options merged in. skippedSteps uses original array indices, like the motion
 * sampler. K frames and authored routes remain part of that same range.
 * Output: { id, fromIndex, toIndex, fromStepId, toStepId, startTime, endTime,
 * duration, period, wraps }, or null if the original pair is unavailable.
 * Times use createFlareSequence's index / step count * period convention;
 * wrapped endTime is unfolded into the next cycle. No animation is changed.
 */
export function resolveMovementLesson(sequence) {
  if (!object(sequence) || !Array.isArray(sequence.steps) || sequence.steps.length < 2 ||
      typeof sequence.period !== 'number' || !Number.isFinite(sequence.period) || sequence.period <= 0) return null;
  const { steps, period } = sequence, count = steps.length;
  const skippedSteps = sequence.skippedSteps ?? [];
  if (!Array.isArray(skippedSteps) || skippedSteps.some(index => !Number.isInteger(index) || index < 0 || index >= count) ||
      new Set(skippedSteps).size !== skippedSteps.length) return null;
  const skipped = new Set(skippedSteps);
  const numbers = steps.map((step, index) => sourceNumber(step, sequence, index));
  const pairs = [];
  for (let fromIndex = 0; fromIndex < count; fromIndex++) {
    const toIndex = (fromIndex + 1) % count;
    if (numbers[fromIndex] === MOVEMENT_LESSON.fromSourceStep &&
        numbers[toIndex] === MOVEMENT_LESSON.toSourceStep) pairs.push({ fromIndex, toIndex });
  }
  // Multiple copies of the same transition have no unambiguous teaching range.
  if (pairs.length !== 1) return null;
  const { fromIndex, toIndex } = pairs[0], from = steps[fromIndex], to = steps[toIndex];
  const fromStepId = stepId(from), toStepId = stepId(to);
  if (!fromStepId || !toStepId || fromStepId === toStepId ||
      !enabled(from, fromIndex, skipped) || !enabled(to, toIndex, skipped) || !matchingSupport(from, to)) return null;
  const wraps = toIndex <= fromIndex;
  const startTime = fromIndex / count * period;
  const endTime = toIndex / count * period + (wraps ? period : 0);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return null;
  return { id: MOVEMENT_LESSON.id, fromIndex, toIndex, fromStepId, toStepId,
    startTime, endTime, duration: endTime - startTime, period, wraps };
}

// Profiles name teaching tasks for the user's original nodes. They neither
// determine muscle contractions from a pose nor rank the muscles by activity.
export const MOVEMENT_POSE_PROFILES = Object.freeze({
  9: Object.freeze({ title: '后侧支撑 · 长腿过前方', legMode: 'front',
    legs: '保持开腿，从髋控制长腿过前方，膝部保持受控伸展。',
    body: '肩与骨盆配合下一次移重，为双腿绕行留出空间。' }),
  10: Object.freeze({ title: '第一侧移重 · 腾出摆腿空间', legMode: 'side', liftSide: 'left',
    legs: '双腿保持开立和伸长，沿已保存的弧线继续绕行。',
    body: '肩与骨盆配合摆腿移动，先交接支撑，再让空手让开。' }),
  11: Object.freeze({ title: '第一侧支撑 · 高低腿绕行', legMode: 'side', liftSide: 'left',
    legs: '控制高低腿的位置，保持开立的长腿继续绕行。',
    body: '躯干控制侧倾，让支撑与双腿绕行保持连贯。' }),
  12: Object.freeze({ title: '第一侧换腿 · 准备回撑', legMode: 'side', liftSide: 'left',
    legs: '延续长腿扫弧，准备高低腿交替和下一只手回撑。',
    body: '肩与骨盆协调转入下一支撑，保持腿部通过的空间。' }),
  13: Object.freeze({ title: '前侧支撑 · 开腿扫后方', legMode: 'rear',
    legs: '保持开腿与伸膝，髋部控制双腿继续扫过后方。',
    body: '主动维持支撑空间，肩与骨盆准备接向另一侧。' }),
  14: Object.freeze({ title: '第二侧移重 · 腾出摆腿空间', legMode: 'side', liftSide: 'right',
    legs: '双腿保持开立和伸长，沿已保存的弧线继续绕行。',
    body: '肩与骨盆配合摆腿移动，先交接支撑，再让空手让开。' }),
  15: Object.freeze({ title: '第二侧支撑 · 高低腿绕行', legMode: 'side', liftSide: 'right',
    legs: '控制高低腿的位置，保持开立的长腿继续绕行。',
    body: '躯干控制侧倾，让支撑与双腿绕行保持连贯。' }),
  16: Object.freeze({ title: '第二侧换腿 · 准备接圈', legMode: 'side', liftSide: 'right',
    legs: '延续长腿扫弧，准备高低腿交替并接回后侧支撑。',
    body: '肩与骨盆协调旋回，把摆腿和回撑接入下一圈。' }),
});

const POSE_COLOR = 0xff4242;
const ANNOTATION_SIDES = ['left', 'right'];
const sideName = side => side === 'left' ? '左' : side === 'right' ? '右' : '双侧';
const regionDefinitions = {
  shoulder: { group: 'shoulders', label: '肩部 · 三角肌与肩袖', anatomyGroups: ['deltoids', 'rotator-cuff'] },
  upperArm: { group: 'arms', label: '上臂 · 肱三头肌', anatomyGroups: ['triceps'] },
  scapular: { group: 'scapular', label: '肩带 · 前锯肌与斜方肌', anatomyGroups: ['serratus', 'scapular'] },
  core: { group: 'core', label: '躯干 · 腹壁与背部控制肌群', anatomyGroups: ['obliques', 'erectors'] },
  hipFlexor: { group: 'hipFlexors', label: '髋前侧 · 髂腰肌与股直肌', anatomyGroups: ['hip-flexors', 'quadriceps'] },
  quad: { group: 'hipFlexors', label: '大腿前侧 · 股四头肌', anatomyGroups: ['quadriceps'] },
  glute: { group: 'glutes', label: '臀部 · 臀肌与髋旋转肌', anatomyGroups: ['glutes', 'hip-rotators'] },
  adductor: { group: 'adductors', label: '大腿内侧 · 髋内收肌', anatomyGroups: ['adductors'] },
};

/** Annotate one enabled original pose without changing animation or storage.
 * Input is the current sequence with transitionOptions merged in, as above.
 * The original source number selects a teaching profile; handLocked on this
 * pose alone selects its support sides. Names such as "左侧" do not do that.
 * Output contains split left/right regions, named muscle labels with existing
 * rig anchors, and fixed-size downward push cues. time follows the sampler.
 * group is an existing functional navigation ID. anatomyGroups preserves the
 * exact atlas groups: a quad region remains quadriceps, not iliopsoas geometry.
 * Skipped/disabled or unidentified originals return null. Repeated original
 * 09 uses the same profile at its own index/time. K points are not originals.
 */
export function resolveMovementPoseAnnotations(sequence, index) {
  if (!object(sequence) || !Array.isArray(sequence.steps) || !sequence.steps.length ||
      typeof sequence.period !== 'number' || !Number.isFinite(sequence.period) || sequence.period <= 0 ||
      !Number.isInteger(index) || index < 0 || index >= sequence.steps.length) return null;
  const step = sequence.steps[index], id = stepId(step);
  const sourceStepNumber = sourceNumber(step, sequence, index);
  const profile = MOVEMENT_POSE_PROFILES[sourceStepNumber];
  if (!profile || !id) return null;
  const skippedSteps = sequence.skippedSteps ?? [];
  if (!Array.isArray(skippedSteps) || skippedSteps.some(value => !Number.isInteger(value) || value < 0 || value >= sequence.steps.length) ||
      new Set(skippedSteps).size !== skippedSteps.length || !enabled(step, index, new Set(skippedSteps))) return null;
  if (ANNOTATION_SIDES.some(side => typeof step.pose?.limbs?.[side]?.handLocked !== 'boolean')) return null;
  const supportHands = ANNOTATION_SIDES.filter(side => step.pose.limbs[side].handLocked);
  const regions = [], labels = [];
  const addRegion = (kind, sides) => {
    const definition = regionDefinitions[kind];
    for (const side of sides) regions.push({ id: `${kind}-${side}`, group: definition.group,
      side, kind, color: POSE_COLOR, label: `${side === 'both' ? '' : sideName(side)}${definition.label}`,
      anatomyGroups: [...definition.anatomyGroups] });
  };
  const addLabel = ({ id, group, label, muscles, role, side, anchor, anchors, anatomyGroups }) => {
    labels.push({ id, group, label, muscles, role, side, anchor,
      anchors: [...anchors], anatomyGroups: [...anatomyGroups] });
  };
  if (supportHands.length) {
    for (const kind of ['shoulder', 'upperArm', 'scapular']) addRegion(kind, supportHands);
    const side = supportHands.length === 2 ? 'both' : supportHands[0];
    const paired = side === 'both', prefix = paired ? '双' : sideName(side);
    addLabel({ id: 'support-shoulders', group: 'shoulders', label: `${prefix}肩 · 三角肌与肩袖`,
      muscles: '三角肌 · 肩袖', role: '协同控制承重肩，接住支撑转换。', side,
      anchor: paired ? 'shoulderCenter' : `${side}Shoulder`,
      anchors: supportHands.map(value => `${value}Shoulder`), anatomyGroups: regionDefinitions.shoulder.anatomyGroups });
    addLabel({ id: 'support-arms', group: 'arms', label: `${prefix}上臂 · 肱三头肌`,
      muscles: '肱三头肌', role: '受控伸肘，支撑手主动推地。', side,
      anchor: paired ? 'shoulderCenter' : `${side}Elbow`,
      anchors: supportHands.map(value => `${value}Elbow`), anatomyGroups: regionDefinitions.upperArm.anatomyGroups });
    addLabel({ id: 'support-scapular', group: 'scapular', label: `${paired ? '双侧' : prefix + '侧'}肩带 · 前锯肌与斜方肌`,
      muscles: '前锯肌 · 斜方肌', role: '协同调整肩胛，维持身体与地面之间的支撑空间。', side,
      anchor: paired ? 'shoulderCenter' : `${side}Shoulder`,
      anchors: supportHands.map(value => `${value}Shoulder`), anatomyGroups: regionDefinitions.scapular.anatomyGroups });
  }
  addRegion('core', ['both']);
  addLabel({ id: 'trunk-control', group: 'core', label: '躯干 · 腹壁与背部控制肌群',
    muscles: '腹壁肌群 · 竖脊肌群', role: '腹直肌、腹斜肌、腹横肌等与背部肌群配合，控制胸廓和骨盆的相对运动。',
    side: 'both', anchor: 'waist', anchors: ['waist'], anatomyGroups: regionDefinitions.core.anatomyGroups });

  addRegion('quad', ANNOTATION_SIDES);
  addLabel({ id: 'long-legs', group: 'hipFlexors', label: '双大腿前侧 · 股四头肌',
    muscles: '股四头肌（含股直肌）', role: '协助保持膝部受控伸展，让长腿连续绕行。',
    side: 'both', anchor: 'pelvis', anchors: ['leftKnee', 'rightKnee'], anatomyGroups: regionDefinitions.quad.anatomyGroups });
  if (profile.legMode === 'front') {
    addRegion('hipFlexor', ANNOTATION_SIDES);
    addLabel({ id: 'front-hips', group: 'hipFlexors', label: '双髋前侧 · 髂腰肌与股直肌',
      muscles: '髂腰肌 · 股直肌', role: '屈髋与抬腿配合，让开立的长腿通过身体前方。',
      side: 'both', anchor: 'pelvis', anchors: ['leftHip', 'rightHip'], anatomyGroups: regionDefinitions.hipFlexor.anatomyGroups });
  } else {
    const sweepSides = profile.legMode === 'rear' ? ANNOTATION_SIDES : ANNOTATION_SIDES.filter(side => side !== profile.liftSide);
    if (profile.liftSide) {
      const side = profile.liftSide;
      addRegion('hipFlexor', [side]);
      addLabel({ id: 'lifting-hip', group: 'hipFlexors', label: `${sideName(side)}髋前侧 · 髂腰肌与股直肌`,
        muscles: '髂腰肌 · 股直肌', role: '参与屈髋与抬腿控制，为另一条扫行的腿腾出空间。',
        side, anchor: `${side}Hip`, anchors: [`${side}Hip`], anatomyGroups: regionDefinitions.hipFlexor.anatomyGroups });
    }
    for (const kind of ['glute', 'adductor']) addRegion(kind, sweepSides);
    const side = sweepSides.length === 2 ? 'both' : sweepSides[0], paired = side === 'both';
    const prefix = paired ? '双侧' : sideName(side);
    addLabel({ id: 'sweeping-hips', group: 'glutes', label: `${prefix}臀部 · 臀肌与髋旋转肌`,
      muscles: '臀肌群 · 髋旋转肌', role: '配合开髋与髋部旋转，控制长腿扫行。', side,
      anchor: paired ? 'pelvis' : `${side}Hip`, anchors: sweepSides.map(value => `${value}Hip`),
      anatomyGroups: regionDefinitions.glute.anatomyGroups });
    addLabel({ id: 'leg-opening', group: 'adductors', label: `${prefix}大腿内侧 · 髋内收肌`,
      muscles: '髋内收肌群', role: '参与腿向中线回收与开度变化的控制，衔接下一段扫腿。', side,
      anchor: paired ? 'pelvis' : `${side}Hip`, anchors: sweepSides.map(value => `${value}Hip`),
      anatomyGroups: regionDefinitions.adductor.anatomyGroups });
  }
  const support = supportHands.length === 2 ? '双手主动推地，肩带与伸肘控制共同维持支撑空间。'
    : supportHands.length === 1 ? `${sideName(supportHands[0])}手主动推地，承重肩与肘部保持受控；另一只手让出摆腿空间。`
      : '当前关键帧没有锁定的支撑手，请核对该帧的支撑设置。';
  const cues = supportHands.map(side => ({ id: `push-${side}`, side, anchor: `${side}Palm`,
    direction: [0, -1, 0], space: 'model', kind: 'arrow', color: POSE_COLOR, label: '主动推地 · 教学提示' }));
  const supportSide = supportHands.length === 1 ? supportHands[0] : 'both';
  const audienceLabels = [
    { id: 'shoulder-arm-support', group: 'shoulders', label: '肩臂支撑',
      muscles: '三角肌 · 肩袖 · 前锯肌 · 斜方肌 · 肱三头肌',
      role: supportHands.length === 2 ? '双手推地，肩臂配合给摆腿留出空间。'
        : supportHands.length === 1 ? `${sideName(supportHands[0])}手推地，另一只手让出摆腿空间。`
          : '当前帧没有锁定的支撑手，请核对支撑设置。',
      side: supportSide, anchors: supportHands.flatMap(side => [`${side}Shoulder`, `${side}Elbow`]) },
    { id: 'core-coordination', group: 'core', label: '核心协调',
      muscles: '腹壁肌群 · 竖脊肌群', role: '肩和髋配合移动，把支撑与摆腿接起来。',
      side: 'both', anchors: ['waist'] },
    { id: 'hip-leg-swing', group: profile.legMode === 'rear' ? 'glutes' : 'hipFlexors', label: '髋腿摆动',
      muscles: '髋部肌群 · 股四头肌', role: '双腿保持开立和伸长，沿弧线连续绕行。',
      side: 'both', anchors: ['leftHip', 'rightHip', 'leftKnee', 'rightKnee'] },
  ];
  return { sourceStepNumber, index, stepId: id, time: index / sequence.steps.length * sequence.period,
    title: `原第 ${String(sourceStepNumber).padStart(2, '0')} 步 · ${profile.title}`,
    supportHands, enabled: true, regions, labels, audienceLabels,
    cue: { support, legs: profile.legs, body: profile.body }, cues,
    teachingNote: '红色表示本姿态讲解的重要相关肌群；颜色不表示力量或实测激活强度。',
    anatomyNote: MOVEMENT_LESSON.anatomyNote,
    missingAnatomyNote: MOVEMENT_LESSON.missingAnatomyNote };
}
