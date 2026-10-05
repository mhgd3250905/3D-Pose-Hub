import { OFFICIAL_FLARE_SEQUENCE } from './official-poses.js';
import { mirroredTemplate } from './pose-mirror.js';

const SIDES = ['left', 'right'];
const clone = value => JSON.parse(JSON.stringify(value));
const COACH = 'https://www.youtube.com/watch?v=Sz5rd22PCSI';
const NINJA = 'https://breakdancingninja.com/proto/how-to-flare/';
const FOOT_CUE = '膝盖保持伸长，脚背自然延长；鞋尖随整条腿扫转，不单独拧脚腕来改变腿的方向。';

// The chosen loop follows the user's right-hand support reference. VincaniTV
// demonstrates the opposite entry, so its left/right cues are mirrored here.
// Hand directions are editable authoring choices, not angles measured in video.
const TECHNIQUE = {
  'flare-front-open': {
    hands: '双掌朝下铺地，手指向各自外侧略转；右手准备接重。圆点的左右指人物本人。',
    feet: '双腿向侧后方打开，膝盖和鞋尖随髋同向转出。' + FOOT_CUE,
    body: '肩带主动推地，髋离地；这是循环中的前撑起点，起脚入门另从脚辅助分段练习开始。',
    cue: '先建立支撑和开腿空间，再把重量移到右手。',
    exercises: ['wristLoad', 'scapPush', 'supportShift'], sourceUrls: [COACH + '&t=206s', NINJA],
  },
  'flare-right-transfer': {
    hands: '右掌保持原落点与朝向，手指向右外侧略转；肩移到右手上方，左手卸载后再离地。',
    feet: '左腿开始抬向左肩，右腿伸长低扫；两条腿错开高度，低扫脚留离地间隙。',
    body: '身体向右侧倾并移髋，左臂抬起给腿让路；避免原地只抬腿。',
    cue: '右手接重 → 左手离地 → 左腿上举。',
    exercises: ['supportShift', 'trunkControl', 'flareSegments'], sourceUrls: [COACH + '&t=60s'],
  },
  'flare-right-high-v': {
    hands: '右掌朝下，手指向右外侧略转；支撑臂伸长、肩主动推地。左手完全离地，向侧上方打开。',
    feet: '左腿靠向左肩形成高腿，右腿保持长线低扫。' + FOOT_CUE,
    body: '保留你参考图的侧倾与高低 V；抬髋、开腿和侧倾一起给扫腿留出空间。',
    cue: '高腿靠肩，低腿扫长，支撑肩持续推地。',
    exercises: ['compression', 'trunkControl', 'hipControl'], sourceUrls: [COACH + '&t=70s', NINJA],
  },
  'flare-front-pass': {
    hands: '右掌继续承重；左手回到左侧落手位置，掌心先转向地面，手指向左外侧准备接地。',
    feet: '左腿经过前方后开始下扫，右腿接着上抬；不要让双腿一起掉到低位。',
    body: '胸口逐渐打开、骨盆继续绕行；给左掌落地腾出空间，接地后才换重。',
    cue: '左手找地，同时把上抬任务交给右腿。',
    exercises: ['rearSupport', 'compression', 'flareSegments'], sourceUrls: [COACH + '&t=86s'],
  },
  'flare-rear-open': {
    hands: '左掌已接地，双掌短暂承重；手指向各自外侧略转，肩在舒适的后伸范围内推地。',
    feet: '两条直腿在前方打开，上下摆腿接续而过；脚背和鞋尖跟随各自腿的方向。',
    body: '胸口打开、髋保持高度；这个后撑瞬间要能接到下一侧移重，避免坐到地上。',
    cue: '回撑接住重量，抬髋给双腿留空间。',
    exercises: ['rearSupport', 'compression', 'flareSegments'], sourceUrls: [COACH + '&t=92s', NINJA],
  },
  'flare-left-transfer': {
    hands: '重量转到左掌，左手保持落点与方向；右手先变轻再离地，准备让腿绕回前撑。',
    feet: '右腿继续上抬后向侧后方展开，左腿伸长扫出；开度由髋部带动。',
    body: '肩与骨盆绕向左侧，接续刚才的后撑；不能把这一段当作重新起脚。',
    cue: '左掌接重，右手离地，摆腿继续。',
    exercises: ['supportShift', 'rearSupport', 'flareSegments'], sourceUrls: [COACH + '&t=206s'],
  },
  'flare-left-high-v': {
    hands: '左掌朝下，手指向左外侧略转；左肩主动推地，右臂抬离地面给腿留路。',
    feet: '右腿抬高、左腿低扫，形成第二个侧撑开腿瞬间。' + FOOT_CUE,
    body: '侧撑的外形参考你的高 V，但肩、髋和摆腿要继续接回前撑。',
    cue: '左肩推地，两腿持续错开高度。',
    exercises: ['hipControl', 'trunkControl', 'flareSegments'], sourceUrls: [COACH + '&t=209s', NINJA],
  },
  'flare-front-reconnect': {
    hands: '右掌回到右侧接地，手指向右外侧略转；双掌接稳后，才开始下一次右手移重。',
    feet: '双腿保持伸长与开度绕到侧后方，脚尖随腿接回第一步，避免脚跟提前落地。',
    body: '胸口回向地面，主动推地；髋的轨迹接回起点，整圈连续。',
    cue: '接回前撑，留住下一圈的摆腿空间。',
    exercises: ['scapPush', 'hipControl', 'flareSegments'], sourceUrls: [COACH + '&t=213s'],
  },
};

const VIEW_DIRECTIONS = [[.15,.28,1],[.85,.10,.55],[0,.12,1],[.45,.2,1],[.1,.2,1],[-.45,.2,1],[0,.12,1],[-.85,.10,.55],[-.15,.28,1]];
const SOURCE_TECHNIQUE = ['flare-front-open','flare-right-transfer','flare-right-high-v','flare-front-pass','flare-rear-open','flare-front-pass','flare-right-high-v','flare-right-transfer','flare-front-reconnect'];

const SAVED_LOOP_GUIDES = {
  9: {body:'从你确认的正后侧双撑开始，保持当前髋高与开腿空间，接入左侧三个变化。',cue:'后双撑 → 左侧移重，开始这一圈。',exercises:['rearSupport','supportShift','flareSegments']},
  10: {body:'进入你定义的左侧第一个变化，肩与骨盆配合移重，空手为扫腿让路。',cue:'先接重，再离手，保留扫腿空间。',exercises:['supportShift','trunkControl','flareSegments']},
  11: {body:'保留你摆好的侧倾和高低 V 开腿，支撑肩推地，躯干连接两条腿的扫转。',cue:'高腿抬起，低腿扫长，支撑肩持续推地。',exercises:['compression','trunkControl','hipControl']},
  12: {body:'左侧第三个变化接向正前方双撑；空手朝保存的回撑落点靠近，双腿接续换高低。',cue:'换腿、找地，接向前双撑。',exercises:['supportShift','compression','flareSegments']},
  13: {body:'经过你确认的正前方双撑，保持髋部空间，准备进入另一侧三个变化。',cue:'双手接住重量，摆腿接续向右侧。',exercises:['scapPush','supportShift','flareSegments']},
  14: {body:'从前双撑进入右侧第一个变化，沿左侧第三个变化的镜像路径接续。',cue:'前撑转移，空手给腿让路。',exercises:['supportShift','compression','flareSegments']},
  15: {body:'右侧单撑保留左侧高 V 的镜像，肩、躯干和双腿继续旋回。',cue:'另一侧肩推地，长腿保持高低错开。',exercises:['compression','trunkControl','hipControl']},
  16: {body:'右侧第三个变化接回正后侧；保持保存的空手回撑方向，让下一步回到原第 09 步。',cue:'继续移重与扫腿，接回后双撑。',exercises:['supportShift','rearSupport','flareSegments']},
};

function savedLoopTechnique(step,index,count){
  const guide=clone(SAVED_LOOP_GUIDES[step.sourceStepNumber]);
  const supports=SIDES.filter(side=>step.pose.limbs[side].handLocked);
  const support=supports[0]==='left'?'左':'右',free=support==='左'?'右':'左';
  guide.hands=supports.length===2
    ? '双掌按你保存的掌面、手指方向与落点支撑；移重时保持受控推地。'
    : supports.length===1
      ? `人物${support}手保持保存的落点与手指方向，${free}手按当前姿势离地或准备回撑；承重时保持腕部稳定。`
      : '按保存的手掌方向完成换手，先找到落点再接重。';
  guide.feet='保留你摆好的腿部路径、脚踝和鞋尖朝向；脚尖随整条腿扫转，低扫脚留出离地空间。';
  guide.sourceUrls=[COACH,NINJA];
  if(step.sourceStepNumber===9&&index===count-1){
    guide.body='回到与循环起点完全相同的原第 09 步，接着进入下一圈左侧移重。';
    guide.cue='接回同一个 09 步，保持循环连续。';
  }
  return guide;
}

/** Return the user's authored key poses without regenerating their placement. */
export function createFlarePosePresets(motion, sequence=OFFICIAL_FLARE_SEQUENCE) {
  if (!motion?.capturePose || !motion?.applyPose) throw new Error('展示姿势需要完整的姿势编辑接口。');
  return sequence.steps.map((step,index)=>{
    const original={technique:clone(TECHNIQUE[SOURCE_TECHNIQUE[index]]),viewDirection:VIEW_DIRECTIONS[index]};
    const metadata=sequence.source?.kind==='saved-loop-9-16'&&Object.hasOwn(SAVED_LOOP_GUIDES,step.sourceStepNumber)
      ? {technique:savedLoopTechnique(step,index,sequence.steps.length)}
      : index>=5&&index<8?mirroredTemplate(original):original;
    return {...clone(step),summary:metadata.technique.cue,
      supportHands:SIDES.filter(side=>step.pose.limbs[side].handLocked),
      viewDirection:[...VIEW_DIRECTIONS[index]],technique:metadata.technique,pose:clone(step.pose)};
  });
}
