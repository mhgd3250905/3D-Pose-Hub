# o-supported-star-reach 扶椅单腿三向点地（Chair-Supported Three-Direction Reach）· 动作包核对 r3

- 类型：`rep_updown`，单侧 each-side-separately，先做 left；V4 预览：`/workspace/work/v4run/b21.jpg 第 4 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧6 次，休息 30 秒
- 改后：2 组×每侧6 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：2.7 s → 2.5 s
- 相位：go 1.0s / hold 0.5s / back 1.0s

## 3. 难度
- 改前 v3 2 / ai-tags 2 → 统一 1（扶着椅子，比不扶版容易；ai-tags 原 2。）

## 4. 指导文字（教练口吻）
- purpose：单腿微蹲时练稳定和控制 → 单腿微蹲着练站稳
- 要点 改前：支撑腿微蹲，另一只脚轮流向前、侧、后点地；骨盆放平朝前，一只手轻扶椅子。；点地要轻，别把体重放到点地的脚上。；每点一次地算 1 次。
- 要点 改后：站着那条腿微蹲，另一只脚轮流往前、旁边、后面点地；两边胯放平朝前，一只手轻扶椅子。；点地要轻，别把体重放到点地那只脚上。；点一次算 1 下。
- 常见错误 改前：支撑腿膝盖往里扣；体重压到点地的脚上
- 常见错误 改后：站着那条腿膝盖往里倒；体重压到点地那只脚上
- 注意事项 改前：用不带轮子的稳固椅子，站不稳就停
- 注意事项 改后：用不带轮子的结实椅子，疼或站不稳就停
- 相位口令：点地 / 稳住 / 收回 → 点地 / 稳住 / 收回

## 5. voiceGuide（脚本，未合成音频）
- 一下 2.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 膝盖对着脚尖 | Knee over toes | commonErrors[0] |
| 5 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好；sideDone → 换右边

## 6. 画面对照
- 一致：扶椅单腿微蹲、另一脚往外点地、大腿前/内侧高亮（b21 第 4 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 2.0 s → 2.5 s（点 1.0 / 停 0.5 / 收 1.0），点一次算 1 下
- 站着原地换边，不加换边准备
- 难度 v3 2 / ai-tags 2 → 统一 1（扶椅版比 h-unsupported-star-reach-native 的 2 低一档）
- purpose 去掉「稳定和控制」；「骨盆」→「胯」

## 8. 待开哥定
- 难度从 2 降到 1（扶椅、比不扶版容易），请确认

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 常见错误1：站着那条腿膝盖往里倒 → 往旁边、往后点地时站着的膝盖往里歪（Standing knee caving in. → Standing knee falling in as you tap to the side and back.）
- 注意事项1：用不带轮子的结实椅子，疼或站不稳就停 → 扶稳椅背，点得近一点也行，别为了远站不稳（Use a sturdy chair without wheels. Stop if it hurts or you feel wobbly. → Hold the chair. Tap closer if you need to. Don't wobble just to reach far.）
- 语音 reminders[0]：膝盖对着脚尖 → 膝盖别往里歪（Knee over toes → Knee doesn't cave）
