// The Flare (托马斯全旋) key muscle groups for the full-screen 3D viewer, one
// colour per group. Colours only tell groups apart — never effort, force or
// EMG. Grounded in the app's own functional groups (src/data.js muscleGroups:
// shoulders · scapular · arms · chest · core · hipFlexors · glutes ·
// adductors), docs/flare-research.md (OpenStax 11.3–11.6; Pontillo et al.
// upper-limb weight bearing: serratus, trapezius, rotator cuff, deltoid,
// pectoralis major, triceps) and the per-pose annotations in
// movement-lessons.js. Latissimus, rectus abdominis and transversus are named
// there as participating trunk/shoulder muscles the old atlas could not show.
// Palette: three hue families (cool = support, violet/pink = core, warm =
// legs) with neighbours alternating in lightness so adjacent panels stay
// distinct, including for red–green colour vision deficiency; the chip names
// and tap-to-name always carry the meaning, never colour alone.

export const FLARE_SECTIONS = [
  { id: 'support', label: '支撑（肩臂）', short: '支撑' },
  { id: 'core', label: '核心折叠', short: '核心' },
  { id: 'legs', label: '腿部绕环', short: '腿部' },
];

export const FLARE_GROUPS = [
  // support: straight-arm planted hand, shoulder girdle pushes the floor away
  { groupId: 'deltoids', section: 'support', colour: '#4cc9f0', role: '前、中、后束协同控制承重肩，接住每一次换手。' },
  { groupId: 'rotator-cuff', section: 'support', colour: '#a29bfe', label: '肩袖肌群', role: '位于深层，帮助稳定肱骨头，支撑方向不断变化时护住肩关节。' },
  { groupId: 'triceps', section: 'support', colour: '#2f6bff', role: '伸肘锁住支撑臂，手臂保持伸直受控。' },
  { groupId: 'forearms', section: 'support', label: '前臂 · 腕屈伸肌', colour: '#9ad1e8', role: '掌根撑地时控制手腕与手指，平稳落手、卸载。' },
  { groupId: 'serratus', section: 'support', colour: '#5eead4', role: '让肩胛贴着胸廓前伸，主动把地面推远。' },
  { groupId: 'scapular', section: 'support', label: '斜方肌中下部 · 菱形肌', colour: '#86efc4', role: '协同调整肩胛位置，维持肩带与地面之间的支撑空间。' },
  { groupId: 'chest', section: 'support', colour: '#6f8dff', role: '前撑转侧撑时，配合控制上臂相对胸廓的方向。' },
  { groupId: 'lats', section: 'support', colour: '#00a896', role: '连接上臂与躯干，参与肩部下压与身体随支撑转移。' },
  // core: fold (pike) and turn the trunk so the legs can pass
  { groupId: 'abs', section: 'core', colour: '#c466ff', label: '腹直肌（含深层腹横肌）', role: '卷腹折叠躯干，与深层腹横肌一起稳住骨盆，给抬腿留出空间。' },
  { groupId: 'obliques', section: 'core', colour: '#ff6fb5', role: '参与躯干旋转与侧向控制，让肩与骨盆随摆腿转动。' },
  { groupId: 'erectors', section: 'core', colour: '#e3b3ff', role: '控制脊柱伸展与躯干位置，后撑时帮助保持髋高。' },
  { groupId: 'hip-flexors', section: 'core', colour: '#ff9ec7', role: '位于骨盆深处，主动屈髋，把长腿从身体前方抬过去。' },
  // legs: long straight legs scissoring and sweeping a circle
  { groupId: 'glute-max', section: 'legs', colour: '#ffb703', role: '髋伸展与后方扫腿（深层髋旋转肌配合调整腿的方向）。' },
  { groupId: 'hip-abductors', section: 'legs', colour: '#ff7b2e', role: '主动开腿并控制骨盆，离地后双腿不合拢。' },
  { groupId: 'adductors', section: 'legs', colour: '#b5e655', role: '控制腿向中线回收与开度变化，衔接下一段扫腿。' },
  { groupId: 'quadriceps', section: 'legs', colour: '#ffe45c', role: '保持膝部伸直，让长腿连续绕行。' },
  { groupId: 'hamstrings', section: 'legs', colour: '#e9a46a', role: '后侧长腿线条，参与髋伸与膝部控制。' },
];

export const FLARE_COLOURS = Object.fromEntries(FLARE_GROUPS.map(group => [group.groupId, group.colour]));

/** Viewer items for the full Flare set (all both sides, deep groups hatched by the viewer). */
export function flareItems() {
  return FLARE_GROUPS.map(group => ({ ...group, side: 'both' }));
}

/** Viewer filters: one per role section, plus "全部". */
export function flareFilters() {
  return [
    { id: 'all', label: '全部' },
    ...FLARE_SECTIONS.map(section => ({ id: section.id, label: section.short, groups: FLARE_GROUPS.filter(group => group.section === section.id).map(group => group.groupId) })),
  ];
}

// Pose annotation atlas ids -> Flare viewer group ids.
const ATLAS_TO_FLARE = { deltoids: 'deltoids', 'rotator-cuff': 'rotator-cuff', triceps: 'triceps', serratus: 'serratus', scapular: 'scapular',
  obliques: 'obliques', erectors: 'erectors', 'hip-flexors': 'hip-flexors', quadriceps: 'quadriceps', glutes: 'glute-max',
  'hip-rotators': 'glute-max', adductors: 'adductors' };

/** Filter for one annotated pose (movement-lessons profile): the groups that
 * pose's teaching labels point at, with their sides. Support hands also get
 * forearms, and the trunk label covers the abdominal wall. */
export function flarePoseFilter(profile, label = '本帧') {
  if (!profile || !Array.isArray(profile.labels)) return null;
  const sides = new Map();
  const add = (id, side) => {
    if (!id) return;const s = side === 'left' || side === 'right' ? side : 'both';
    const prev = sides.get(id);sides.set(id, prev && prev !== s ? 'both' : s);
  };
  for (const entry of profile.labels) for (const atlasId of entry.anatomyGroups ?? []) {
    const id = ATLAS_TO_FLARE[atlasId];if (!id) continue;
    add(id, entry.side);
  }
  const hands = Array.isArray(profile.supportHands) ? profile.supportHands : [];
  for (const hand of hands) add('forearms', hand);
  if (sides.has('obliques')) add('abs', 'both');
  if (!sides.size) return null;
  return { id: 'pose', label, groups: [...sides].map(([id, side]) => ({ id, side })) };
}
