// Recommendations match observable movement tasks. They are neither muscle
// weakness diagnoses nor claims about measured Flare activation or efficacy.
const freezeRecord = record => Object.freeze({ ...record,
  cues: Object.freeze([...record.cues]), compare: Object.freeze([...record.compare]),
  steps: Object.freeze([...record.steps]), sourceIds: Object.freeze([...record.sourceIds]),
});

export const MOVEMENT_TRAINING_SOURCES = Object.freeze({
  upper: Object.freeze({ label: 'OpenStax · 肩带、上肢与手部解剖', kind: 'anatomy',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs' }),
  abdominal: Object.freeze({ label: 'OpenStax · 腹壁与躯干解剖', kind: 'anatomy',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax' }),
  back: Object.freeze({ label: 'OpenStax · 背部与脊柱肌解剖', kind: 'anatomy',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back' }),
  lower: Object.freeze({ label: 'OpenStax · 髋、腿与足部解剖', kind: 'anatomy',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs' }),
  support: Object.freeze({ label: 'Pontillo 等 · 上肢承重原始研究', kind: 'study',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2953292/' }),
  timing: Object.freeze({ label: 'Prassas 等 · 地面与鞍马 Flare 时序', kind: 'study',
    url: 'https://ojs.ub.uni-konstanz.de/cpa/article/view/3328/3128' }),
  vincanity: Object.freeze({ label: 'VincaniTV · 地面 Flare 本人教学', kind: 'coach',
    url: 'https://www.youtube.com/watch?v=Sz5rd22PCSI' }),
  chiki: Object.freeze({ label: 'Chiki Skills · 地面 Flare 分步教学', kind: 'coach',
    url: 'https://www.youtube.com/watch?v=2fFBaFV9Ugk' }),
  circleCoach: Object.freeze({ label: 'Matt Action × VincaniTV · Circle Flare 协作教学', kind: 'coach',
    url: 'https://www.spincontrol.co/blogs/news/spin-control-x-vincanitv-virgin-flare-tutorial' }),
});

export const MOVEMENT_TRAINING = Object.freeze([
  { id: 'shoulder-support', title: '左右移重 · 支撑交接', group: 'shoulders', exerciseId: 'supportShift',
    goal: '把身体受控地移向支撑侧，为另一只手和摆腿腾出空间。',
    description: '先保留双手和脚部帮助，练小幅左右移重；稳定后再尝试轻手，而不是直接延长单手悬停。',
    cues: ['先移动身体，再让另一手变轻。', '承重肘受控伸直，支撑手持续推地。', '先做小幅度，左右都练。'],
    compare: ['肩与骨盆一起移，没有突然塌向地面。', '另一只手离开前已经开始交接支撑。', '回撑落点受控，没有靠猛拍地面补救。'],
    steps: ['双手、双膝或双脚保留地面支持，选舒适的掌面方向。', '肩与骨盆小幅移向一侧，另一手先变轻，再回到中间。', '两侧都受控后再尝试轻手短暂离地、回撑，并接入小范围摆腿。'],
    sourceIds: ['upper', 'support', 'vincanity'], animationId: 'supportShift',
    animationNote: '动画先展示双手支撑下的左右移重；轻手离地是后续练法，未表示掌上力值。' },
  { id: 'shoulder-push', title: '直臂推地 · 肩带控制', group: 'scapular', exerciseId: 'scapPush',
    goal: '肘部伸直时仍主动维持肩带支撑空间。',
    description: '用低负荷前撑练小幅推地与受控返回，观察胸廓与地面的距离，避免用屈肘或大幅弓背代替肩带控制。',
    cues: ['把地面推远，肘部仍受控伸直。', '肩胛随胸廓与手臂的关系调整。', '胸廓只做受控的小幅变化。'],
    compare: ['推起与返回时肘部没有反复屈伸。', '胸廓与髋没有突然一起落向地面。', '没有靠抬头或夸张弓背凑幅度。'],
    steps: ['从跪姿或脚辅助前撑开始，双手保持舒适接触。', '肘部受控伸直，主动推开地面，再小幅受控返回。', '能维持支撑空间后，把推地感觉接入左右移重。'],
    sourceIds: ['upper', 'support'], animationId: 'scapPush',
    animationNote: '这是整体直臂支撑变化的基础示意；当前骨架不独立模拟肩胛在胸廓上的滑动或孤立肌肉收缩。' },
  { id: 'rear-support', title: '脚辅助后撑 · 保留过腿空间', group: 'shoulders', exerciseId: 'rearSupport',
    goal: '在舒适的肩后伸范围内接住后侧支撑，并给前方长腿留下空间。',
    description: '双脚先分担重量，练小幅后撑抬髋和受控返回，再逐步接单腿抬起与回撑。',
    cues: ['脚先帮忙，肩腕在舒适范围内承重。', '先建立身体离地的空间，再加抬腿。', '回撑接住身体，避免猛拍地面。'],
    compare: ['抬髋与返回都受控，没有突然坐落。', '掌面与肘部受控，手没有离身体过远。', '抬起一条腿时，另一脚仍能提供帮助。'],
    steps: ['坐姿屈膝，双脚留地；双手放在身后舒适位置。', '脚部辅助小幅抬髋，肘部受控，再缓慢返回。', '稳定后尝试伸长一条腿、少量抬起、放下，再换侧；最后接入受控回撑。'],
    sourceIds: ['upper', 'lower', 'vincanity'], animationId: 'rearSupport',
    animationNote: '动画是脚辅助后撑的基础示范；完整 Flare 的离手、摆腿和回撑仍需接回原动作分段练习。' },
  { id: 'core-control', title: '支撑移重 · 肩髋协调', group: 'core', exerciseId: 'supportShift',
    goal: '肩与骨盆在移重中保持可控的相对关系。',
    description: '复用双手支撑左右移重，把观察点放在躯干和骨盆；练习控制身体位置，而不是把腰部全程锁死。',
    cues: ['肩和髋一起移，躯干保持受控。', '减少突然塌腰或只甩骨盆。', '脚或膝保留帮助，正常呼吸。'],
    compare: ['肩部开始移动时，骨盆能够协调跟随。', '移到两侧都没有突然塌腰或掉髋。', '返回中间时不依赖快速甩身。'],
    steps: ['双手与脚或膝保留地面支持，先建立舒适的躯干位置。', '肩与骨盆一起向一侧小幅移动，再受控返回。', '两侧都顺畅后再接轻手或脚辅助转髋，逐步接回 Flare。'],
    sourceIds: ['abdominal', 'back', 'upper', 'vincanity'], animationId: 'supportShift',
    animationNote: '与肩臂练习共用左右移重动画，观察任务改为肩髋关系；不冒充已经示范侧撑旋转。' },
  { id: 'hip-swing', title: '坐姿分腿抬腿 · 长腿控制', group: 'hipFlexors', exerciseId: 'compression',
    goal: '在舒适开度和受控伸膝下主动抬起长腿，准备前方过腿。',
    description: '单腿小幅离地后放下、换侧；先把抬腿和伸膝做清楚，再扩大幅度或尝试双腿。',
    cues: ['从髋抬起整条腿，膝保持伸长。', '先练小幅度，缓慢落下。', '不靠猛后仰或屈膝甩起腿。'],
    compare: ['抬腿时膝部仍受控伸展。', '两侧都能抬起、放下，而不是只追求高度。', '躯干没有突然后仰来替代主动抬腿。'],
    steps: ['舒适开腿坐姿，手在身侧或腿旁提供帮助。', '单腿小幅离地，膝部保持受控伸展，缓慢落下并换侧。', '单腿稳定后再尝试双腿小幅抬起，或接到脚辅助后撑抬腿。'],
    sourceIds: ['lower', 'abdominal', 'chiki'], animationId: 'straddleLift',
    animationNote: '动画示范前方过腿的屈髋与长腿基础；不把坐姿抬腿说成完整后方扫腿示范。' },
  { id: 'hip-opening', title: '主动开合 · 扫弧基础', group: 'glutes', exerciseId: 'hipControl',
    goal: '把主动开度、伸膝与髋部带动的扫弧连起来。',
    description: '脚保留帮助，另一条伸长的腿先扫小弧；按控制情况扩大绕行范围，避免只靠被动开度。',
    cues: ['腿从髋打开，膝和脚尖协调转向。', '先控制小弧，再接前后方向。', '需要时让辅助脚留地。'],
    compare: ['开度变化可控，没有腿刚离地就突然合上。', '扫腿保持长腿形态，不只扭脚尖或屈膝绕手。', '骨盆能够配合绕行，双侧都能做受控的小弧。'],
    steps: ['坐姿双手辅助，足跟留地；在舒适范围内主动小幅开腿、回收，躯干保持受控。', '再用手和一只脚保留支持，另一条长腿扫小弧，换侧重复。', '把前侧和侧后的小弧连起来，逐步减少脚部帮助。'],
    sourceIds: ['lower', 'vincanity', 'chiki'], animationId: 'hipOpening',
    animationNote: '动画先示范坐姿、足跟留地的小幅主动开合；脚辅助扫弧是后续练法，不把开合动画说成完整后方扫腿或被动劈叉。' },
  { id: 'core-turn', title: '脚辅助侧撑转髋', group: 'core', exerciseId: 'trunkControl',
    goal: '把肩髋协调接到支撑方向变化，而不是只练静态坚持。',
    description: '脚分担重量，慢速练前撑到侧撑再返回，观察肩、胸廓与骨盆能否配合。',
    cues: ['脚先帮忙，肩与骨盆一起转。', '转入和回撑都保持受控。', '先做小转角，不靠塌腰甩身。'],
    compare: ['支撑方向改变时，骨盆没有卡住或突然下落。', '回撑能接住身体，而不是最后猛拍手。', '左右转入与返回都能保持可控空间。'],
    steps: ['双脚留地建立前撑，需要时缩短腿部杠杆。', '向一手小幅移重，另一手变轻后抬起，脚随身体调整到侧撑。', '空手受控回撑并返回前撑，再换侧；随后接入小范围扫腿。'],
    sourceIds: ['abdominal', 'back', 'upper', 'vincanity'], animationId: null,
    animationNote: '双手左右移重是这项练习的基础；当前动画不宣称已经示范侧撑旋转。' },
  { id: 'flare-connect', title: '脚辅助半圈 · 接回下一圈', group: 'core', exerciseId: 'flareSegments',
    goal: '把移重、腾手、长腿扫行与回撑按旋向连接。',
    description: '先用脚分担重量，把卡住的半圈和回撑分开练，再把受控的前后半圈接起来。',
    cues: ['腿继续绕行，手为腿腾出空间。', '回撑接住身体，再准备下一次移重。', '先控制单段和单圈，再尝试连续连接。'],
    compare: ['换手与过腿之间仍保留连贯路线。', '回到前撑或后撑时髋没有突然坐落。', '接下一圈时没有仅靠更快踢腿或拍手补救。'],
    steps: ['用脚辅助练前撑到侧撑再到后撑，单独检查难接的落手。', '再练后撑到另一侧再回前撑，让长腿继续扫弧。', '两半圈都受控后连成一圈，再尝试接下一圈。'],
    sourceIds: ['vincanity', 'chiki', 'timing', 'circleCoach'], animationId: null,
    animationNote: '原托马斯动画可以回看路线；它展示完整动作，不冒充这项脚辅助降阶练习。' },
].map(freezeRecord));

const trainingById = new Map(MOVEMENT_TRAINING.map(record => [record.id, record]));
const slotAliases = new Map([
  ['shoulder-arm-support', 'support'], ['shoulder-support', 'support'], ['shoulders', 'support'], ['arms', 'support'], ['scapular', 'support'], ['support', 'support'],
  ['core-coordination', 'core'], ['core-control', 'core'], ['core', 'core'],
  ['hip-leg-swing', 'hips'], ['hip-swing', 'hips'], ['hipFlexors', 'hips'], ['glutes', 'hips'], ['adductors', 'hips'], ['hips', 'hips'],
]);
const stageTitles = { rear: '后侧支撑', front: '前侧支撑', sideA: '第一侧支撑与移重', sideB: '第二侧支撑与移重' };

/** Read-only task recommendation from a live movement annotation.
 * profile supplies sourceStepNumber and actual supportHands, as emitted by
 * resolveMovementPoseAnnotations/currentProfile. slotId accepts the three
 * audience card IDs and existing group aliases. Unknown context returns null.
 * primary/alternatives are immutable records; compare describes the original
 * movement to observe, while primary.compare describes its auxiliary drill.
 * Runtime must check animationId against the actual available clip registry.
 */
export function resolveMovementTraining(profile, slotId) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile) || profile.enabled === false) return null;
  const number = typeof profile.sourceStepNumber === 'string' && /^\d+$/.test(profile.sourceStepNumber.trim())
    ? Number(profile.sourceStepNumber) : profile.sourceStepNumber;
  const slot = slotAliases.get(slotId);
  if (!Number.isInteger(number) || number < 9 || number > 16 || !slot || !Array.isArray(profile.supportHands) ||
      profile.supportHands.some(side => side !== 'left' && side !== 'right') || new Set(profile.supportHands).size !== profile.supportHands.length) return null;
  const supportHands = [...profile.supportHands], single = supportHands.length === 1;
  const stageId = number === 9 ? 'rear' : number === 13 ? 'front' : number < 13 ? 'sideA' : 'sideB';
  const hand = single ? supportHands[0] === 'left' ? '左手' : '右手' : '双手';
  let primaryId, alternativeIds, compare, cue;
  if (slot === 'support') {
    if (!supportHands.length) return null;
    primaryId = single ? 'shoulder-support' : stageId === 'rear' ? 'rear-support' : 'shoulder-push';
    alternativeIds = ['shoulder-support', 'shoulder-push', 'rear-support'];
    compare = [single ? `以本人${hand}为支点，观察另一手让开前身体是否已经开始移向支撑侧。` : '观察双手回撑的落点和肘部控制，避免靠猛拍地面补救。',
      '肘部受控伸展时，胸廓和髋没有突然一起下沉。',
      stageId === 'rear' ? '后侧肩腕在可控范围内承重，前方双腿仍有通过空间。' : '换手与摆腿衔接，手为长腿绕行留出空间。'];
    cue = single ? `${hand}持续推地，身体先移重，再让另一手变轻。`
      : stageId === 'rear' ? '受控接住后撑，为前方长腿保留空间。' : '双手主动推地，肩与骨盆准备下一次移重。';
  } else if (slot === 'core') {
    primaryId = 'core-control';alternativeIds = ['core-turn', 'flare-connect'];
    compare = ['肩与骨盆能够配合移动，而不是只甩腰或让骨盆卡住。',
      '换手与过腿时身体没有突然塌腰、掉髋。', '回撑后还能把同一路线接到下一段。'];
    cue = '肩和髋配合移动，让支撑转换与双腿绕行接起来。';
  } else {
    primaryId = stageId === 'front' || number === 12 || number === 16 ? 'hip-opening' : 'hip-swing';
    alternativeIds = ['hip-swing', 'hip-opening', 'flare-connect'];
    compare = ['双腿保持可控开度和长腿形态，经过手臂旁时仍有空间。',
      '膝与脚尖随髋协调转向，没有只扭脚尖或屈膝绕手。',
      stageId === 'rear' ? '腿到身体前方时仍能主动抬起，不依赖猛后仰甩腿。' : '扫腿与骨盆的移动配合，绕行能继续接向下一段。'];
    cue = stageId === 'rear' ? '从髋抬起伸长的腿，给前方过腿留空间。' : '保持开腿和伸膝，让髋部带动长腿连续扫弧。';
  }
  return { primary: trainingById.get(primaryId),
    alternatives: alternativeIds.filter(id => id !== primaryId).map(id => trainingById.get(id)),
    stageTitle: `原第 ${String(number).padStart(2, '0')} 步 · ${stageTitles[stageId]}`,
    stageId, sourceStepNumber: number, supportHands, slotId: slot,
    compare, cue, recommendationNote: '按当前动作任务选择基础练习，不据此诊断某块肌肉偏弱或承诺训练效果。' };
}
