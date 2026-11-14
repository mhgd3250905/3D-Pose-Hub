# h-band-straight-leg-raise 扶椅弹力带直腿前抬（Standing Band Straight-Leg Raise）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b4.jpg 第 10 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧10 次，休息 45 秒
- 改后：2 组×每侧10 次，休息 45 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.2 s
- 相位：go 1.0s / hold 0.8s / back 1.2s / rest 0.2s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：练大腿根前侧和大腿前面 → 练大腿根前面和大腿前面
- 要点 改前：膝盖伸直不动，腿往前抬；上身别往后仰，椅子只用来扶稳。；慢慢放回，膝盖别绷死。
- 要点 改后：膝盖伸直不动，腿往前抬；上身别往后仰，椅子只用来扶。；慢慢放回，膝盖别绷死。；一边做完，绑带换到另一只脚，转过身再做。
- 常见错误 改前：身体后仰帮忙抬腿；膝盖弯起来变成高抬腿
- 常见错误 改后：身子往后仰帮着抬腿；膝盖弯了，变成高抬腿
- 注意事项 改前：第一次先做一组轻松的 6 次；弹力带要固定在身后牢固的低处
- 注意事项 改后：第一次先做一组轻松的 6 下；带子要拴在身后牢靠的低处
- 相位口令：往前抬 / 停一下 / 放下 → 往前抬 / 停一下 / 放下

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.2 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 膝盖伸直 | Straight knee | cue1, commonErrors[1] |
| 5 | 上身别往后仰 | Don't lean back | cue2, commonErrors[0] |
| 8 | 慢慢放下 | Lower slowly | cue3 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：扶椅站姿、弹力带绑脚踝、直腿前抬、大腿前侧高亮（b4 第 10 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.2 s
- 新增 sideSwitchSeconds 10 与换边要点
- 文字改教练口吻
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点4：一边做完，绑带换到另一只脚，转过身再做。 → 一侧做完，带子换到另一只脚踝，换手扶椅子。（When one side is done, move the strap to the other ankle and turn around. → When one side is done, move the band to the other ankle and switch hands on the chair.）
