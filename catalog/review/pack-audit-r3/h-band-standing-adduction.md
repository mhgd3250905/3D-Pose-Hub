# h-band-standing-adduction 扶椅弹力带向里并腿（Standing Band Leg Pull-In）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b4.jpg 第 8 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧12 次，休息 45 秒
- 改后：3 组×每侧12 次，休息 45 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.5 s
- 相位：go 1.0s / hold 0.8s / back 1.5s / rest 0.2s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：练大腿内侧，让髋部更好控制 → 练大腿内侧，让腿往里并更有劲
- 要点 改前：腿伸直，往里并向支撑腿；弹力带固定在牢固的低处，椅子只用来扶稳。；慢慢放回，骨盆别歪。
- 要点 改后：腿伸直，往里并向支撑腿；带子拴在牢靠的低处，椅子只用来扶。；慢慢放回去，两边胯骨一样高。；一边做完，绑带换到另一只脚，转过身再做。
- 常见错误 改前：用上身侧倒带动腿
- 常见错误 改后：上身往一边倒着带腿
- 注意事项 改前：别把弹力带绑在椅子上；大腿根疼时停下
- 注意事项 改后：别把带子拴在椅子上；大腿根疼就停
- 相位口令：往里并 / 停一下 / 放回 → 往里并 / 停一下 / 放回

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 上身别歪 | Stay tall | commonErrors[0] |
| 5 | 慢慢放回去 | Ease it back out | cue3 |
| 8 | 两边胯骨一样高 | Hips level | cue3 |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：扶椅站姿、弹力带从外侧拉、大腿内侧高亮（b4 第 8 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s
- 新增 sideSwitchSeconds 10 与换边要点
- 「骨盆别歪」→「两边胯骨一样高」；purpose 去掉「控制」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点4：一边做完，绑带换到另一只脚，转过身再做。 → 一侧做完，带子换到另一只脚踝，转身让带子还从外侧拉。（When one side is done, move the strap to the other ankle and turn around. → When one side is done, switch ankles and turn so the band still pulls from the outside.）
- 语音 reminders[2]：两边胯骨一样高 → 慢慢放回外边（Hips level → Back out slowly）
