# h-supported-single-leg-calf 扶墙单腿提踵（Supported Single-Leg Calf Raise）· 动作包核对 r3

- 类型：`rep_updown`，单侧 each-side-separately，先做 left；V4 预览：`/workspace/work/v4run/b14.jpg 第 9 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧10 次，休息 30 秒
- 改后：3 组×每侧10 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.0 s
- 相位：go 1.0s / hold 0.5s / back 1.5s

## 3. 难度
- 改前 v3 2 / ai-tags 2 → 统一 2（单腿撑全身体重，入门者常做不满；ai-tags 原 2。退阶写进注意事项。）

## 4. 指导文字（教练口吻）
- purpose：练单腿小腿力量 → 一条腿一条腿地练小腿
- 要点 改前：单脚站，脚跟抬起踮到前脚掌；手扶墙保持平衡，骨盆别歪。；顶端停一下，再慢慢放下。
- 要点 改后：单脚站，脚后跟往上抬，踮到前脚掌；手扶墙站稳，胯别歪。；顶上停一下，再慢慢放下。
- 常见错误 改前：脚踝往外翻；骨盆往一边掉
- 常见错误 改后：脚踝往外翻；一边胯往下掉
- 注意事项 改前：脚踝或脚后跟不舒服时减小幅度，仍痛就停止
- 注意事项 改后：脚踝或脚后跟不舒服就踮低点，还疼就停；做不满就两只脚一起踮
- 相位口令：踮起脚 / 停一下 / 放下 → 踮起来 / 停一下 / 慢慢放

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 脚踝别往外翻 | Ankle straight | commonErrors[0] |
| 5 | 胯别歪 | Hips level | cue2, commonErrors[1] |
| 8 | 慢慢放下 | Lower slowly | cue3 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好；sideDone → 换右边

## 6. 画面对照
- 一致：扶墙单腿踮脚、小腿高亮（b14 第 9 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.0 s（踮 1.0 / 停 0.5 / 放 1.5）
- 站着原地换脚，不加换边准备
- 「骨盆」→「胯」；「减小幅度」→「踮低点」；退阶「两只脚一起踮」写进注意事项
- 难度 2/2 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点3：顶上停一下，再慢慢放下。 → 踮到最高停一下，脚后跟慢慢落到底。（Pause at the top, then lower slowly. → Pause on your tiptoe, then let your heel all the way down slowly.）
- 常见错误1：脚踝往外翻 → 单脚踮起来往小脚趾那边歪（Ankle rolling out. → Rolling onto your little toe as you rise.）
- 语音 reminders[0]：脚踝别往外翻 → 大脚趾压实（Ankle straight → Big toe pressing）
