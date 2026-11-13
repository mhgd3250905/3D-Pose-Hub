# v3 动作文案与训练节奏规范（r2，2026-11-01）

每个 `<id>.json` 是该动作文字、语音和 App 计数/计时的唯一来源。目标：**用户第一次听就懂，跟着做不会错，App 每个动作都会计数或计时。**

## 1. 以真实做法为准（2026-11-01 最终口径）
- 每个动作按它真实怎么练来定剂量、计数和口令；动画只负责演示动作。语音和文字必须描述真实做法（例如平板类、静力支撑真实是静止保持 → 计时，即使动画为演示做了起落）。
- 动画没有的细节不要乱加；动画节奏偏慢只是演示，文案不写动画时长（不出现「8 秒做一次」这类话）。
- 拿不准的（例如动作本身是否合理、目标肌群存疑）不要硬改，写进 `review.flags`。

## 2. 会被念出来的句子（name、primary cue、phases）
- 用日常口语，听一遍就懂。不用解剖或训练术语（工具 `text.py` 会拦截）：
  - 弹震 → 删掉，或说「不要来回颠」；离心 → 「慢慢放下」；伸髋 → 「臀部发力把髋往前推/抬起」；屈髋 → 「身体前倾」「大腿抬起」
  - 内旋/外旋 → 「向内转/向外转」；内收/外展 → 「往里并/往外打开」；背屈 → 「勾脚尖」；跖屈 → 「绷脚尖/踮脚」
  - 对侧/同侧 → 「另一侧/同一侧」；胸椎 → 「上背」；腰椎 → 「腰」；中立位 → 「背保持平直」；激活、代偿、髋铰链 → 换成具体动作说法
  - 英文同理：no flexion/extension/eccentric/isometric/hinge/thoracic/lumbar/neutral spine/activate 等，用 bend、straighten、lower slowly、hold still、upper back、keep your back flat。
- phases（start/peak/end）是每一下都会念的短口令：中文 2–6 字、英文 1–4 词，动词开头，和动画的「发力 → 顶点 → 回来」一一对应。保持类动作顶点用「保持住」「稳住」等。
- primary cue 是开组前念的一句：一句话说清最关键的一个动作要领，中文 ≤ 24 字。
- 不要书面腔（「保持骨盆朝向一致」→「骨盆别歪」），不要一句里塞两个以上指令。

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
- 单侧动作的次数/时长指每侧。组数、休息合理即可（力量 3 组 8–12 次休息 45–60 s，拉伸/活动 2 组 6–10 次或 20–30 s，保持 2–3 组 15–30 s）。

## 6. 训练节奏（training，新必填，决定 App 怎么计数/计时）
```json
"training": {
  "kind": "rep_updown | rep_hold | rep_alternate | rep_cycle | hold",
  "leadSeconds": 1,
  "phases": [
    {"id": "go",   "seconds": 1.5, "cue": "phase.start"},
    {"id": "hold", "seconds": 0.4, "cue": "phase.peak"},
    {"id": "back", "seconds": 1.4, "cue": "phase.end"},
    {"id": "rest", "seconds": 0.7}
  ],
  "perSide": "each-side-separately | alternate | one-side-only",
  "source": "spec-pulse-track r2"
}
```
- 时长取自动画（`rhythm-all.json` 从 spec 主轨道导出的一下的 go/hold/back/rest 秒数），四舍五入到 0.1 s；0 秒的相位省略。各相位相加 = 动画里一下的时长。
- `mode: time` → `kind: hold`，不写 phases（App 计时）。
- 顶点停留 ≥ 0.8 s 用 `rep_hold`，否则 `rep_updown`；左右轮流做、一下换一边 → `rep_alternate`：一左一右算 1 次，剂量写「每侧 N 次」（reps=N），`perSide: alternate`，`repUnit: left+right`，phases 描述一侧的一下，`startingSide` 写先动的一侧，cue 写明「两边各做一次算 1 次」；连续画圈/没有明显停顿的循环 → `rep_cycle`。
- phases 的 `cue` 把口令绑到相位：go 念 phase.start，hold（或顶点）念 phase.peak，back 念 phase.end。没有 hold 相位时 phase.peak 可不绑。
- 口令要念得完：中文约 4 字/秒、英文约 2.5 词/秒，口令长度不超过它所在相位时长能念完的量，太短的相位就用更短的口令。
- `perSide` 仅单侧动作写。单侧非轮流动作：一侧做完所有次数再换另一侧（`each-side-separately`），`startingSide` 写先练的一侧。
- 特殊计数单位（每个方向/每圈/每个字型/每次点地）保留，但 cue 要写明 1 次是什么。

## 7. 审核记录
- 改完后 `reviewStatus` 写 `ai-reviewed-r2-needs-user-review`；r3 动作包核对（2026-11-13 起，样例 5 个）写 `ai-reviewed-r3-needs-user-review`。
- `review`: `{"r2": {"changes": ["改了什么、为什么"], "flags": ["拿不准、需用户定的"]}}`；r3 在同一对象里加 `"r3": {...}`，不删 r2。
- r3 每个动作另有核对记录 `catalog/review/pack-audit-r3/<id>.md`（改前、改后、理由、画面对照、待定点），总台账 `LEDGER.md`。

## 8. 中途语音引导 voiceGuide（r3 新增，可选）
**现状：只写脚本，未合成音频，`produce.py`/`definition.py`/`voice.py` 与 App 都还没读这个字段，接入前不影响线上。** 校验在 `text.py`（字段存在才查）。

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
- `role`：`posture` 姿势自查、`breath` 呼吸提醒、`halfway` 过半（可带一句要点）、`safety` 注意事项。≤ 20 秒的组 2 句即可（姿势 + 过半），别说太满。

**次数类**（`mode: reps`）：
```json
"voiceGuide": {
  "format": "pose-hub-voice-guide@1", "status": "script-only", "mode": "reps",
  "repSeconds": 4.0, "phaseCues": "first-2-reps", "count": {"key": "n.{rep}", "at": "rep-end"},
  "reminders": [
    {"afterRep": 2, "role": "form", "zh": "身体一条直线，别塌腰", "en": "Body in one straight line", "from": ["cue3"]},
    {"afterRep": 4, "role": "halfway", "zh": "…", "en": "…", "from": ["commonErrors[0]"]},
    {"afterRep": 7, "key": "p.last_rep"}
  ],
  "afterSet": {"moreSets": ["p.rest", "sec.60"], "allDone": ["p.nice"]}
}
```
- `repSeconds` = 计数的一下（training.phases 相加；`repUnit: left+right` 时 ×2），校验会对。
- 每一下结束报数（`n.{rep}`）。`phaseCues: first-2-reps` = 前 2 下念 phase 口令带节奏，之后只报数 + 提醒；`every-rep` = 每下都念（待开哥定统一用哪种）。
- 提醒在第 `afterRep` 下报数后开始念，占下一下的时间：一句 ≤ `repSeconds − 1` 秒能念完；最多隔 3 下必须有一句；最后一句固定 `p.last_rep`（在倒数第 2 下之后）。
- 单侧 each-side-separately：每侧按同一份脚本，一侧做完念 `afterSet.sideDone`。

**节奏字段（预留）**：若动画一下明显太快、计数跟不上，可在 `training` 加 `tempoSeconds`（建议的一下秒数），并在 `review.r3.flags` 写清与动画时长的差异；不改动画。App 未接入前只作记录。
