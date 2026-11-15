# v3 动作文案与训练节奏规范（r2 2026-11-01；r3 修订 2026-11-13、11-14；voice-no-tempo-r1 2026-11-14 夜）

每个 `<id>.json` 是该动作文字、语音和 App 计数/计时的唯一来源。目标：**用户第一次听就懂，跟着做不会错，App 每个动作都会计数或计时。**

## 1. 以真实做法为准（2026-11-01 最终口径）
- 每个动作按它真实怎么练来定剂量、计数和口令；动画只负责演示动作。语音和文字必须描述真实做法（例如平板类、静力支撑真实是静止保持 → 计时，即使动画为演示做了起落）。
- 动画没有的细节不要乱加；动画节奏偏慢只是演示，文案不写动画时长（不出现「8 秒做一次」这类话）。
- 拿不准的（例如动作本身是否合理、目标肌群存疑）不要硬改，写进 `review.flags`。

## 2. 会被念出来的句子（name、primary cue、phases）
- 用日常口语，听一遍就懂。不用解剖或训练术语（工具 `text.py` 会拦截）：
  - 弹震 → 「就停在这儿，别一下一下往下压」；离心 → 「慢慢放下」；伸髋 → 「臀部发力把髋往前推/抬起」；屈髋 → 「身体前倾」「大腿抬起」
  - 内旋/外旋 → 「向内转/向外转」；内收/外展 → 「往里并/往外打开」；背屈 → 「勾脚尖」；跖屈 → 「绷脚尖/踮脚」
  - 对侧/同侧 → 「另一侧/同一侧」；胸椎 → 「上背」；腰椎 → 「腰」；中立位 → 「背挺平」；激活、代偿、髋铰链 → 换成具体动作说法
  - 英文同理：no flexion/extension/eccentric/isometric/hinge/thoracic/lumbar/neutral spine/activate 等，用 bend、straighten、lower slowly、hold still、upper back、keep your back flat。
- phases（start/peak/end）是相位短口令：中文 2–6 字、英文 1–4 词，动词开头，和动画的「发力 → 顶点 → 回来」一一对应。**voice-no-tempo-r1（开哥 2026-11-14 23:45）起训练中不再念**（见 §8「讲解不是指挥」）：文字留在 JSON 里供显示和旧流程兼容，`training.phases` 不再绑 `cue`。
- primary cue 是开组前念的一句：一句话说清最关键的一个动作要领，中文 ≤ 24 字。
- 不要书面腔（「保持骨盆朝向一致」→「两边胯骨一样高」；口吻细则见 §9），不要一句里塞两个以上指令。

## 3. 屏幕上显示的文字（purpose、其余 cues、commonErrors、cautions）
- 同样用口语、短句；可以出现「臀部」「大腿后侧」「肩胛骨」这类普通人认得的部位词，不用肌肉学名。
- purpose：一句，说练哪里 + 有什么用。中英文意思必须一致。
- cues 2–3 条：只写动画里能看到的要点，不重复 primary。
- commonErrors 1–3 条：真实常见的错误。
- cautions 1–2 条，「X 时 Y」短句，不要「部位：……」长句格式。
- 英文：name 用 Title Case；primary cue 不加句号，其余句子加句号。

## 4. 单侧动作
- `unilateral: true` 的动作不写死「左/右」，用「支撑脚」「抬起的腿」「一侧」「另一侧」。只有动作本身就只做一侧时（例如只能做一边的器械位）才保留方位词，并在 `training.perSide` 写 `one-side-only`。
- `startingSide` 写动画里先做的那侧。

## 5. 剂量（defaultDose）
- 真实做法是重复动作 → `mode: reps`；真实做法是静止保持 → `mode: time`（`seconds`），口令写进入—保持—呼吸，不写「回来/再来」。不能混用。
- 单侧动作的次数/时长指每侧。组数、休息合理即可（力量 3 组 8–12 次休息 45–60 s，拉伸/活动 2 组 6–10 次，保持 2–3 组 15–30 s）。
- **静态拉伸统一每组 30 秒**（开哥 2026-11-14 同意，含扶椅前后劈叉、鸽子式），组间休息不为此改（多为 15 秒）；动态拉伸/活动按次数。
  - 例外：手腕、前臂这类小关节拉伸可保持 20 秒（如 h-wall-wrist-flexor-stretch；开哥 2026-11-14 同意）。

## 6. 训练节奏（training，新必填，决定 App 怎么计数/计时）
```json
"training": {
  "kind": "rep_updown | rep_hold | rep_alternate | rep_cycle | hold",
  "leadSeconds": 1,
  "phases": [
    {"id": "go",   "seconds": 1.5},
    {"id": "hold", "seconds": 0.4},
    {"id": "back", "seconds": 1.4},
    {"id": "rest", "seconds": 0.7}
  ],
  "perSide": "each-side-separately | alternate | one-side-only",
  "sideSwitchSeconds": 10,
  "source": "real-tempo r3"
}
```
- **按真实训练的常规节奏定，和演示动画时长无关**（开哥 2026-11-13）。动画只教怎么做，一下多快以健身房里真实带练为准，不要求等于动画时长，也不改动画。参考一下的秒数（rep_alternate 指一侧一下）：
  - 简单、幅度小（踮脚、小幅活动、轻松拉伸往返）：2–3 s
  - 要控制或力量型（俯卧撑、深蹲、臀桥、弓步）：3–4 s
  - 难或大幅度（深幅、单腿、大范围活动）：4–6 s
  - 画圈类、单腿站（入门者）：约 5 s 一圈
- 相位切分按真实发力习惯（例如力量动作放下慢、推起稍快、顶点停 0.5–1 s），四舍五入到 0.1 s；0 秒的相位省略。`source` 写 `real-tempo r3`。
- `mode: time` → `kind: hold`，不写 phases（App 计时）。
- 顶点停留 ≥ 0.8 s 用 `rep_hold`，否则 `rep_updown`；左右轮流做、一下换一边 → `rep_alternate`：一左一右算 1 次，剂量写「每侧 N 次」（reps=N），`perSide: alternate`，`repUnit: left+right`，phases 描述一侧的一下，`startingSide` 写先动的一侧，cue 写明「两边各做一次算 1 次」；连续画圈/没有明显停顿的循环 → `rep_cycle`。
- ~~phases 的 `cue` 把口令绑到相位~~（voice-no-tempo-r1 取消）：phases 只描述节奏、决定 App 怎么计数，**不写 `cue`**（r3 动作写了 `text.py` 报错）。用户按自己的速度做，语音不在每下中间喊相位。
- `perSide` 仅单侧动作写。单侧非轮流动作：一侧做完所有次数再换另一侧（`each-side-separately`），`startingSide` 写先练的一侧。
- `sideSwitchSeconds`（r3 新增，可选，整数秒）：each-side-separately 且换边要重新摆姿势的动作（如鸽子式、侧卧、跪姿单侧）写 10，给用户换边准备时间；站着原地换手、换脚就能接着做的不写（开哥 2026-11-14 同意）。算「重新摆姿势」：要翻身或换躺/跪的方向、脚踝绑带/弹力带要换到另一只脚并转身、后脚要从椅面拿下来换腿（保加利亚分腿蹲）；不算：站姿换手（单臂推、弯举、提壶铃）、仰卧/跪撑原地换一条腿抬。**App 尚未接入此字段**，接入前只作记录；`text.py` 字段存在时检查取值 5–20。
- 特殊计数单位（每个方向/每圈/每个字型/每次点地）保留，但 cue 要写明 1 次是什么。

## 5b. 难度（r3）
- `tags.difficulty`（1–3，开哥 2026-11-14 同意先用 1–3，两边同值；以后可能改档）与 `catalog/ai-tags/actions/<id>.json` 的 `difficulty` 写**同一个值**（逐个动作重定：1 入门谁都能做，2 需要一点力量或柔韧，3 需要基础、入门者可能做不满）。改 ai-tags 后更新 `source.textSha256Lf` 并跑 `tools/ai-tags/validate.py`。
- 入门者可能做不满的动作，退阶写进 cautions 一句即可（如「做不满就跪着做」），不另开字段。

## 7. 审核记录
- 改完后 `reviewStatus` 写 `ai-reviewed-r2-needs-user-review`；r3 动作包核对（2026-11-13 起，样例 5 个）写 `ai-reviewed-r3-needs-user-review`。
- `review`: `{"r2": {"changes": ["改了什么、为什么"], "flags": ["拿不准、需用户定的"]}}`；r3 在同一对象里加 `"r3": {...}`，不删 r2。
- r3 每个动作另有核对记录 `catalog/review/pack-audit-r3/<id>.md`（改前、改后、理由、画面对照、待定点），总台账 `LEDGER.md`。

## 8. 中途语音引导 voiceGuide（r3 新增，可选）
**现状：r2-v14/r2-v15 起随包发布（约定见 `docs/voice-guide-pack-contract.md`），SDK 播放器已接入；源文件里 `status` 仍写 `script-only`，发包时改 `ready`。** 校验在 `text.py`（字段存在才查）。

**讲解不是指挥（voice-no-tempo-r1，开哥 2026-11-14 23:45/23:47；推翻 r3 的「前 2 下念相位」「超长单次每步念口令」两条）**：开哥测 SF 时，哥萨克蹲每次计数之间念「蹲过去、踩住」——用户会被语音带着节奏走，他不希望干扰用户自己的动作速度和训练节奏。所以：
1. **报数保留**：`n.{rep}`、倒数 `n.3/n.2/n.1`、「最后一次」、换边、休息这些共用词照旧。报数先按正常动作的标准节奏（§6），偏快的开哥后面再调。
2. **不念任何按节拍的动作口令**：相位口令（蹲过去/稳住/站起来/推/起/下…）、分解步骤口令，以及「慢一点」「停两秒」「呼气，再沉一点」这类指挥快慢和时机的话，一律不进 voiceGuide。`phaseCues` 统一 `none`，`training.phases` 不绑 `cue`，不再用 `steps`。
3. **只讲「这个动作怎么做对」**：说姿势、位置、发力点、范围和常见错（「重心放在蹲那侧的脚后跟，另一条腿伸直、脚尖朝上」），不说「现在做什么」。拉伸想加深用条件句（「想拉得更开，胯往外推」），不用「呼气，再往下」。
4. **别踩点**：次数组每组最多 2 句自写讲解、两句至少隔 2 下，不跟着每一下念；计时组照旧每 8–10 秒一句防冷场，但内容只能是要领/注意点。
5. **自写句子不短于中文 5 字 / 英文 3 词**：「腰别塌」「Hold」这种短句听着就是口令，改成说清楚对的样子。
6. 检查：`python3 tools/action-package-v3/text.py --tempo` 列出命中「节拍/动作指令词表」（`TEMPO_ZH`/`TEMPO_ZH_RE`/`TEMPO_EN_RE`，见 `text.py`）的句子，**必须 0**，命中即校验失败。中文词表：现在、下一下、每一下、每下、这一下、一下一下、再来、回来、回去、回到、回正、下去、上去、过去、放下、放回、落下、落回、收回、转回、摆回、并回、躺回、坐回、推起、推上、推出去、推回、推直、蹲下、蹲过去、站起来、坐起来、撑起来、顶起来、抬起来、踩住、稳住、停住、停一下、停两秒、停一秒、顿一下、保持住、顶住、换边、换腿、换手、吸气、呼气、慢（含慢慢/慢一点）、快一点、快点、越做越快、节奏、跟着数、数两秒、数到、到顶、到底、继续、夹一下、碰一下、再往/再沉/再够/再滑/再夹/再转/再松/再推/再抬/再坐/再挪、先轻后重，以及「停 N」「N 秒」。英文：now、again、next rep、exhale、inhale、breathe in/out、switch、hold、pause、slow(ly/er)、fast(er)、then、come back、back up/down/in/out/to、stand up、sit up、push up、lie back、lower（lower back 除外）、for one/two、N s/sec、at the top、all the way up/down、keep going、one more。新出现的节拍词再补，宁少勿滥。

目的：长组、计时组不冷场；次数组隔几下提醒一次要点。句子**必须来自本动作自己的** cues / commonErrors / cautions（`from` 写出处，如 `cue2`、`commonErrors[0]`、`cautions[0]`，校验会查是否存在），不说「加油」「坚持就是胜利」这类空话。共用词（开始、倒数、最后一次、换边、休息 N 秒）用 `catalog/voice-v2/script.json` 的 `common` 键，不重复写。

时长按中文约 4 字/秒、英文约 2.5 词/秒估算，中英两版都要放得下。

**计时类**（`defaultDose.mode: time` → `mode: hold`）：
```json
"voiceGuide": {
  "format": "pose-hub-voice-guide@1", "status": "script-only", "mode": "hold",
  "speechRate": {"zhCharsPerSecond": 4, "enWordsPerSecond": 2.5},
  "sharedVocabulary": "catalog/voice-v2/script.json#common",
  "set": [
    {"at": 0, "key": "p.go"},
    {"at": 5, "role": "posture", "zh": "骨盆摆正，别歪向一边", "en": "Square your hips, don't tilt", "from": ["commonErrors[0]", "cue2"]},
    {"at": 14, "role": "halfway", "zh": "…", "en": "…", "from": ["cue3"]},
    {"at": 27, "key": "n.3"}, {"at": 28, "key": "n.2"}, {"at": 29, "key": "n.1"}
  ],
  "afterSet": {"moreSetsSameSide": ["p.rest", "sec.15"], "sideDone": ["p.release", "p.switch_left"], "allDone": ["p.release", "p.nice"]},
  "sides": {"order": ["right", "left"], "perSide": "each-side-separately"}
}
```
- `at` 是组内秒数（计时从「开始」算），一组一条时间轴；单侧动作每侧同一条。
- 大约每 8–10 秒一句：相邻两次发声间隔 ≤ 10 秒；第一句不早于 3 秒；最后 4 秒只留倒数（`n.3/n.2/n.1` 放在最后 3 秒）。
- 一句念完要离下一次发声 ≥ 0.3 秒，不叠、不掐。
- `role`：`posture` 姿势自查、`breath` 呼吸提醒（「别憋气」这类，不喊「呼气/吸气」）、`halfway` 过半（可带一句要点）、`safety` 注意事项。≤ 20 秒的组 2 句即可（姿势 + 过半），别说太满。

**次数类**（`mode: reps`）：
```json
"voiceGuide": {
  "format": "pose-hub-voice-guide@1", "status": "script-only", "mode": "reps",
  "repSeconds": 4.0, "phaseCues": "none", "count": {"key": "n.{rep}", "at": "rep-end"},
  "reminders": [
    {"afterRep": 2, "role": "form", "zh": "从头到脚跟一条直线，腰不往下塌", "en": "Head to heels in one line, no sagging", "from": ["cue3"]},
    {"afterRep": 5, "role": "halfway", "zh": "…", "en": "…", "from": ["commonErrors[0]"]},
    {"afterRep": 7, "key": "p.last_rep"}
  ],
  "afterSet": {"moreSets": ["p.rest", "sec.60"], "allDone": ["p.nice"]}
}
```
- `repSeconds` = 计数的一下（training.phases 相加；`repUnit: left+right` 时 ×2），校验会对。
- 每一下结束报数（`n.{rep}`）。**`phaseCues: none`**（voice-no-tempo-r1）：任何一下都不念 phase 口令，整组只有报数 + 少量要领讲解。~~`first-2-reps`（开哥 2026-11-13）~~、`steps`、`every-rep` 停用，只留给旧稿兼容（r3 动作写了就报错）。
- 讲解在第 `afterRep` 下报数后开始念，占下一下的时间：一句 ≤ `repSeconds − 1` 秒能念完；**每组最多 2 句自写讲解，两句至少隔 2 下，第一句可以在第 1 下之后**（报数本身就不冷场，不再要求每 3 下一句）；最后一句固定 `p.last_rep`（倒数第 2 下报数后念「最后一次」）。一下太短放不下 ≥ 5 字的句子（如壶铃摆荡一下 2 秒）就不放自写句，只报数。
- 共用词已补 `sec.20`「20 秒」、`sec.45`「45 秒」，以及报数 `n.11`–`n.20`（2026-11-14，开哥同意；都只写进 `script.json`，未合成音频）。休息时间不为语音改。

**超长单次动作**（一下 ≥ 8 秒，如半程土耳其起立 deltoids-B）：~~`phaseCues: "steps"` 每一下按步骤念口令~~（开哥 2026-11-14 同意，同夜 voice-no-tempo-r1 取消）。现在和其他次数类一样 `phaseCues: none`，分解步骤写在 cues 里给屏幕看，语音只在第 1 下后用一句讲清顺序和要点（「手肘、手掌、屁股一步一步撑稳，眼睛一直看着哑铃」）。`text.py` 对一下超过 8 秒的只放行 `LONG_REP_OK` 里的动作。
- 单侧 each-side-separately：每侧按同一份脚本，一侧做完念 `afterSet.sideDone`。

**节奏**：r3 起 `training.phases` 本身就是真实节奏（§6），不再另设 `tempoSeconds`。

## 9. 教练口吻（r3，开哥 2026-11-13）
所有文字（念的、屏幕上显示的、voiceGuide）都要像真人教练在健身房当面跟你说的话：形象、生动、口语，听一遍就知道身体该怎么动。

原则：
1. 说身体哪儿怎么动、看得见摸得着，不说概念。「骨盆摆正」→「两边胯骨一样高」。
2. 用画面和比喻：「像有人从头顶往上拎你」「像把地往两边撕开」。比喻要贴切，一条一个，别堆。
3. 短句、祈使句，一句只说一件事；能说「别……」就别说「避免……」。
4. 不喊口号、不说空话（「核心收紧」「保持稳定」「注意姿势」「感受发力」都是空话）：要说就说具体怎么做——「肚子像要挨一拳那样绷住」。
5. 不用术语和书面词（下表黑名单）；部位用普通人认得的词：屁股、大腿前面/后面、胯、腰、上背、肩膀、肩胛骨。
6. 英文同理：plain gym talk（"Squeeze your butt", "Don't let your hips sag"），不用 maintain/ensure/engage/neutral。

| AI 腔 / 书面 | 教练会这么说 |
|---|---|
| 不要弹震 | 就停在这儿，别一下一下往下压 |
| 骨盆摆正 | 两边胯骨一样高 |
| 核心收紧 | 肚子绷住，像要挨一拳 |
| 保持躯干稳定 | 上身别晃 |
| 保持脊柱中立 | 背挺平，别弓也别塌 |
| 控制离心下放 | 慢慢放下来，数两秒 |
| 髋铰链前倾 | 屁股往后坐，上身跟着往前倒 |
| 激活臀部 | 夹紧屁股 |
| 避免膝关节内扣 | 膝盖别往里倒，对着脚尖 |
| 肩胛后缩下沉 | 肩膀往后往下放，离耳朵远点 |
| 保持均匀呼吸 | 别憋气，正常喘 |
| 感受目标肌群发力 | 大腿前面应该是酸的 |
| 动作幅度适度 | 能到哪儿到哪儿，别硬掰 |
| 避免代偿 | 只动这条腿，身体别跟着歪 |
| 增强髋部灵活性 | 让胯活动开 |
| 保持身体稳定性 | 站稳了，别晃 |
| 控制动作节奏 | 慢一点，别甩 |
| 足跟着地 | 脚后跟踩实 |

7. **别套话**（开哥 2026-11-14）：上表是「怎么改」的示范，不是要每个动作都照抄的句子。同一句话出现在很多动作里，一听就是模板。每个动作按它自己的身体动作和最容易错的地方说：扭转说「转到有感觉就停，别用手硬掰」，拉小腿说「后脚跟踩实，别抬起来」，不要所有拉伸都是「就停在这儿，慢慢喘气，每次呼气再松一点」。安全提醒保留意思，但要说具体部位和具体退法（「一只手撑全身，手腕疼就放下来」，而不是千篇一律的「X 疼就 Y 点，还疼就停」）。
   - 检查：`python3 tools/action-package-v3/text.py --dupes`（只报告不拦截）。目标：自写句子出现在 ≥ 4 个动作的为 0；中文 ≤ 4 字 / 英文 ≤ 3 词的口令（「停一下」「慢慢放」「别憋气」「Hold」）是现场通用喊法，单列为口令，不算套话。
   - 同一类动作的计数说明（rep_alternate「两边各一次算 1 次」）也换着说法写，意思不变。

黑名单（`text.py` 检查全部文字字段 + voiceGuide 句子）：
- **报错**（术语，见 `JARGON_ALL`）：弹震、代偿、激活、中立位、离心、向心、等长、髋铰链、募集、稳定性、核心收紧、收紧核心、脊柱、躯干、姿态、下肢、上肢、矢状面、冠状面。§2 原有的念句术语表（内旋、外展、背屈……）仍只拦念的句子。
- **警告**（书面/空泛，能换就换，见 `WEAK`）：髋部、骨盆、幅度、控制、核心、均匀、感受、稳定。英文警告：maintain、ensure、engage、core、stabil、control。
- 黑名单按 2026-11-13 全量扫描结果定（见 `catalog/review/pack-audit-r3/LEDGER.md` 顶部），宁少勿滥；新出现的高频书面词再补。
