// Which muscle groups carry each phase of the saved Flare loop: the data for
// the small synced body on the main animation page. One entry per original key
// (source steps 09–16; the loop's closing repeat of 09 reuses phase 09).
//
// Teaching emphasis, not EMG: "primary" = the groups a coach would point at
// first for that moment, "secondary" = groups that clearly help. Reasoning is
// functional (closed-chain straight-arm support, hip flexion / abduction /
// extension of the long legs, trunk fold and rotation) and follows the
// research notes in docs/flare-research.md; it never claims force or %MVC.
//
// Group ids are the 17 cards of flare-muscle-groups.js. `side` is relative to
// the support hand, resolved at runtime from the saved handLocked flags of the
// key (the same rule the rest of the app uses; names such as "左侧" never
// decide the side):
//   'support' -> the planted arm's side (both sides when both hands are down)
//   'free'    -> the other side (also both when both hands are down)
//   'both'    -> both sides (midline groups, both legs)
// Edit freely: the panel reads everything below at runtime.

export const FLARE_PHASES = [
  {
    source: 9, id: 'rear-support', name: '后侧支撑', detail: '长腿过前方',
    caption: '双手推地撑住身体，屈髋把开立的长腿抬过身体前方；腹部卷紧，臀中肌保持开腿。',
    primary: [
      { id: 'triceps', side: 'support', why: '双臂伸直锁肘，把身体撑离地面。' },
      { id: 'deltoids', side: 'support', why: '肩前倾在手的上方，控制承重肩。' },
      { id: 'hip-flexors', side: 'both', why: '主动屈髋，把长腿抬过身体前方。' },
      { id: 'abs', side: 'both', why: '卷腹折叠躯干，给抬腿留出空间。' },
      { id: 'hip-abductors', side: 'both', why: '双腿保持大开度，过前方时不合拢。' },
    ],
    secondary: [
      { id: 'serratus', side: 'support' }, { id: 'forearms', side: 'support' },
      { id: 'adductors', side: 'both' }, { id: 'quadriceps', side: 'both' },
    ],
  },
  {
    source: 10, id: 'first-transfer', name: '第一侧移重', detail: '单手接重',
    caption: '重量从双手移到单手：支撑侧三角肌、肱三头肌和前锯肌一起接住体重，腕屈肌稳住掌根；腹斜肌把骨盆转向侧面。',
    primary: [
      { id: 'deltoids', side: 'support', why: '整个上身的重量转到这一侧肩上。' },
      { id: 'triceps', side: 'support', why: '支撑臂伸肘锁住，不让手肘弯塌。' },
      { id: 'serratus', side: 'support', why: '肩胛贴住胸廓前伸，主动把地面推远。' },
      { id: 'forearms', side: 'support', why: '掌根刚接住体重，腕屈肌控制手腕不塌。' },
      { id: 'obliques', side: 'both', why: '转动躯干，让骨盆跟着摆腿转向侧面。' },
    ],
    secondary: [
      { id: 'rotator-cuff', side: 'support' }, { id: 'hip-abductors', side: 'free' }, { id: 'glute-max', side: 'support' },
    ],
  },
  {
    source: 11, id: 'first-support', name: '第一侧支撑', detail: '高 V 开腿',
    caption: '单手撑起全身、身体侧立：支撑肩最吃力，肩袖护住肩关节；腹斜肌把髋撑高，臀中肌打开高 V 字腿。',
    primary: [
      { id: 'deltoids', side: 'support', why: '单臂承担全身重量，肩部负荷最大的时刻。' },
      { id: 'triceps', side: 'support', why: '手臂保持笔直，身体才能侧立撑高。' },
      { id: 'rotator-cuff', side: 'support', why: '手臂举过头承重，肩袖把肱骨头稳在关节里。' },
      { id: 'obliques', side: 'both', why: '侧面核心把骨盆撑高，身体不往下塌。' },
      { id: 'hip-abductors', side: 'both', why: '臀中肌外展双腿，撑开高 V 字。' },
    ],
    secondary: [
      { id: 'serratus', side: 'support' }, { id: 'forearms', side: 'support' }, { id: 'lats', side: 'support' }, { id: 'adductors', side: 'both' },
    ],
  },
  {
    source: 12, id: 'first-pass', name: '第一侧换腿', detail: '准备回撑',
    caption: '身体转向正面，双腿像剪刀一样换位过前：屈髋肌和腹直肌把腿带到前方，内收肌控制两腿交错；另一只手准备回撑。',
    primary: [
      { id: 'triceps', side: 'support', why: '仍是单手支撑，伸肘把身体顶住。' },
      { id: 'deltoids', side: 'support', why: '身体转向正面，承重肩随之转动控制。' },
      { id: 'hip-flexors', side: 'both', why: '屈髋把扫行的腿带到身体前方。' },
      { id: 'abs', side: 'both', why: '收腹折叠，骨盆抬住，给腿让出通道。' },
      { id: 'adductors', side: 'both', why: '两腿剪刀式交错，内收肌控制开合。' },
    ],
    secondary: [
      { id: 'obliques', side: 'both' }, { id: 'quadriceps', side: 'both' }, { id: 'serratus', side: 'support' }, { id: 'forearms', side: 'support' },
    ],
  },
  {
    source: 13, id: 'front-support', name: '前侧支撑', detail: '开腿扫后方',
    caption: '双手在身后撑地、胸口朝上：肱三头肌、三角肌和胸大肌像做臂屈伸一样顶住身体；双腿保持大开度，准备向后扫。',
    primary: [
      { id: 'triceps', side: 'support', why: '双手在身后推地，伸肘把身体顶起。' },
      { id: 'deltoids', side: 'support', why: '肩在后伸位承重，前束最吃力。' },
      { id: 'chest', side: 'support', why: '胸大肌协助肩部在后伸位推地。' },
      { id: 'hip-abductors', side: 'both', why: '双腿抬高大开度，准备向后扫。' },
    ],
    secondary: [
      { id: 'scapular', side: 'support' }, { id: 'hip-flexors', side: 'both' }, { id: 'abs', side: 'both' },
      { id: 'forearms', side: 'support' }, { id: 'glute-max', side: 'both' },
    ],
  },
  {
    source: 14, id: 'second-transfer', name: '第二侧移重', detail: '换手接重',
    caption: '换到另一只手单撑：支撑侧肩臂和前锯肌重新接住体重，腕屈肌稳住掌根；臀大肌带长腿从前方扫向后方。',
    primary: [
      { id: 'deltoids', side: 'support', why: '体重换到这一侧肩上，重新接住。' },
      { id: 'triceps', side: 'support', why: '新的支撑臂伸肘锁住。' },
      { id: 'serratus', side: 'support', why: '肩胛前伸推地，肩不往下沉。' },
      { id: 'forearms', side: 'support', why: '掌根刚接重，腕屈肌控制手腕。' },
      { id: 'glute-max', side: 'both', why: '伸髋发力，把长腿从前方扫向后方。' },
    ],
    secondary: [
      { id: 'rotator-cuff', side: 'support' }, { id: 'obliques', side: 'both' }, { id: 'hip-abductors', side: 'free' }, { id: 'hamstrings', side: 'both' },
    ],
  },
  {
    source: 15, id: 'second-support', name: '第二侧支撑', detail: '高 V 开腿',
    caption: '另一侧单手侧撑：支撑肩与肩袖承担全身重量；腹斜肌撑高骨盆，臀中肌保持高 V 开腿。',
    primary: [
      { id: 'deltoids', side: 'support', why: '单臂承担全身重量，肩部负荷最大的时刻。' },
      { id: 'triceps', side: 'support', why: '手臂保持笔直，身体才能侧立撑高。' },
      { id: 'rotator-cuff', side: 'support', why: '手臂举过头承重，肩袖把肱骨头稳在关节里。' },
      { id: 'obliques', side: 'both', why: '侧面核心把骨盆撑高，身体不往下塌。' },
      { id: 'hip-abductors', side: 'both', why: '臀中肌外展双腿，撑开高 V 字。' },
    ],
    secondary: [
      { id: 'serratus', side: 'support' }, { id: 'forearms', side: 'support' }, { id: 'lats', side: 'support' }, { id: 'adductors', side: 'both' },
    ],
  },
  {
    source: 16, id: 'second-pass', name: '第二侧换腿', detail: '准备接圈',
    caption: '身体转回朝下，双腿扫过后方：臀大肌伸髋带腿，竖脊肌保持髋部高度，腹斜肌把身体旋回；另一只手准备落地接回下一圈。',
    primary: [
      { id: 'deltoids', side: 'support', why: '单手支撑中身体旋回，承重肩随之控制。' },
      { id: 'triceps', side: 'support', why: '伸肘撑住，直到另一只手落地。' },
      { id: 'glute-max', side: 'both', why: '伸髋把长腿扫过身体后方。' },
      { id: 'erectors', side: 'both', why: '背部伸展肌群保持髋部高度，不塌腰。' },
      { id: 'obliques', side: 'both', why: '躯干旋回，把身体接回后侧支撑。' },
    ],
    secondary: [
      { id: 'hamstrings', side: 'both' }, { id: 'serratus', side: 'support' }, { id: 'forearms', side: 'support' }, { id: 'hip-abductors', side: 'both' },
    ],
  },
];

export const PHASE_BY_SOURCE = Object.fromEntries(FLARE_PHASES.map(phase => [phase.source, phase]));
// fallback when a saved step carries no source number: its coarse phase tag
const PHASE_BY_TAG = { rear: 9, sideA: 11, front: 13, sideB: 15 };

const sourceOf = step => {
  const value = Number(step?.sourceStepNumber ?? step?.source?.stepNumber);
  return Number.isSafeInteger(value) ? value : null;
};
/** Phase entry for one saved step. */
export function phaseForStep(step) {
  return PHASE_BY_SOURCE[sourceOf(step)] ?? PHASE_BY_SOURCE[PHASE_BY_TAG[step?.phase]] ?? FLARE_PHASES[0];
}
/** 'left' | 'right' | 'both' from the step's saved hand locks. */
export function supportOfStep(step) {
  const limbs = step?.pose?.limbs;const left = limbs?.left?.handLocked === true, right = limbs?.right?.handLocked === true;
  return left && !right ? 'left' : right && !left ? 'right' : 'both';
}

/** Key timeline of the current sequence: { period, keys: [{time, index, phase, support}] }.
 * smooth: the loop's closing key (a repeat of the first) is merged into the
 * last transition, which then spans two segments (coach-motion smooth loop). */
export function phaseTimeline(sequence, { smooth = false } = {}) {
  const steps = Array.isArray(sequence?.steps) ? sequence.steps : [], period = Number(sequence?.period) || 9;
  if (!steps.length) return { period, keys: [] };
  const skipped = new Set(sequence.skippedSteps ?? []);
  const n = smooth ? steps.length - 1 : steps.length, seg = smooth ? period / (n + 1) : period / steps.length;
  const keys = [];
  for (let i = 0; i < n; i++) {
    if (skipped.has(i)) continue;
    keys.push({ time: i * seg, index: i, phase: phaseForStep(steps[i]), support: supportOfStep(steps[i]) });
  }
  return { period, keys };
}

/** Where `time` sits: the active key, the neighbour it is fading toward and
 * how far (w: 0 = fully current, .5 = at the boundary). Windows are centred on
 * each key and split halfway between neighbours; `fade` is the half-width of
 * the crossfade in seconds of sequence time. Pure function of time, so play,
 * pause and scrub all land on the same picture. */
export function samplePhase(timeline, time, fade = 0.16) {
  const { keys, period } = timeline;if (!keys?.length) return null;
  const t = ((time % period) + period) % period, K = keys.length;
  // keys continue one period either side, so the windows wrap
  const at = i => { const k = ((i % K) + K) % K;return { ...keys[k], t: keys[k].time + Math.floor(i / K) * period }; };
  let i = -1;while (i < K - 1 && keys[i + 1].time <= t) i++;
  const a = at(i), b = at(i + 1), mid = (a.t + b.t) / 2, ci = t < mid ? i : i + 1;
  const current = at(ci), prev = at(ci - 1), next = at(ci + 1);
  const start = (prev.t + current.t) / 2, end = (current.t + next.t) / 2;
  let neighbour = null, w = 0;
  if (end - t < fade) { neighbour = next;w = .5 * (1 - (end - t) / fade); }
  else if (t - start < fade) { neighbour = prev;w = .5 * (1 - (t - start) / fade); }
  return { current, neighbour, w, t };
}

/** Panel items of one phase with sides resolved: [{groupId, level, side, why}]. */
export function phaseItems(phase, support) {
  const resolve = token => token === 'both' || support === 'both' ? 'both'
    : token === 'support' ? support : token === 'free' ? (support === 'left' ? 'right' : 'left')
      : token === 'left' || token === 'right' ? token : 'both';
  return [
    ...phase.primary.map(entry => ({ groupId: entry.id, level: 'primary', side: resolve(entry.side), why: entry.why ?? '' })),
    ...phase.secondary.map(entry => ({ groupId: entry.id, level: 'secondary', side: resolve(entry.side), why: entry.why ?? '' })),
  ];
}

export const supportLabel = support => support === 'both' ? '双手支撑' : support === 'left' ? '左手支撑' : '右手支撑';
