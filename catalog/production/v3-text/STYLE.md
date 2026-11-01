# v3 动作文案与训练节奏规范（r2，2026-11-01）

每个 `<id>.json` 是该动作文字、语音和 App 计数/计时的唯一来源。目标：**用户第一次听就懂，跟着做不会错，App 每个动作都会计数或计时。**

## 1. 一切以动画为准
- 文案只描述动画里真的发生的动作（看 spec 文件头注释和 recipe）。动画没有的细节不要写；和动画矛盾的一律改。
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
- 动画在重复做 → `mode: reps`；动画是静止保持 → `mode: time`（`seconds`）。不能混用。
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
- 顶点停留 ≥ 0.8 s 用 `rep_hold`，否则 `rep_updown`；左右轮流做、一下换一边 → `rep_alternate`（每侧算一次）；连续画圈/没有明显停顿的循环 → `rep_cycle`。
- phases 的 `cue` 把口令绑到相位：go 念 phase.start，hold（或顶点）念 phase.peak，back 念 phase.end。没有 hold 相位时 phase.peak 可不绑。
- 口令要念得完：中文约 4 字/秒、英文约 2.5 词/秒，口令长度不超过它所在相位时长能念完的量，太短的相位就用更短的口令。
- `perSide` 仅单侧动作写。

## 7. 审核记录
- 改完后 `reviewStatus` 写 `ai-reviewed-r2-needs-user-review`。
- `review`: `{"r2": {"changes": ["改了什么、为什么"], "flags": ["拿不准、需用户定的"]}}`。
