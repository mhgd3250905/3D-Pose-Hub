# h-band-hip-extension 扶椅弹力带后抬腿（Standing Band Leg Kickback）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b3.jpg 第 10 行`（本机，不入库）
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
- purpose：练臀部，让腿往后推更有力 → 练屁股，让腿往后推更有劲
- 要点 改前：用臀部把腿往后推，身体不动；弹力带固定在前方低处，椅子只用来扶稳。；腰别往后弯，慢慢放回。
- 要点 改后：用屁股把腿往后推，身子不动；带子拴在前面低处，椅子只用来扶。；腰别往后弯，慢慢放回来。；一边做完，绑带换到另一只脚，转过身再做。
- 常见错误 改前：用腰往后弯代替臀部发力
- 常见错误 改后：用腰往后弯，不是屁股在使劲
- 注意事项 改前：第一次先做一组轻松的 6 次；别把弹力带绑在椅子上
- 注意事项 改后：第一次先做一组轻松的 6 下；别把带子拴在椅子上
- 相位口令：往后推 / 夹臀 / 放回 → 往后推 / 夹屁股 / 放回

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.2 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 腰别往后弯 | Don't arch your back | cue3, commonErrors[0] |
| 5 | 用屁股往后推 | Push with your butt | cue1 |
| 8 | 慢慢放回来 | Bring it back slowly | cue3 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：扶椅站姿、弹力带绑脚踝后伸、臀部高亮（b3 第 10 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.2 s
- 新增 sideSwitchSeconds 10（换绑带、转身）与换边要点
- 文字改教练口吻
- 难度 1/1 不变

## 8. 待开哥定
- 无
