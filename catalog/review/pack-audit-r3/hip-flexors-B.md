# hip-flexors-B 弹力带站姿高抬膝（Standing Banded High Knee）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b17.jpg 第 1 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧10 次，休息 45 秒
- 改后：3 组×每侧10 次，休息 45 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 4.0 s
- 相位：go 1.0s / hold 2.0s / back 1.0s

## 3. 难度
- 改前 v3 1 / ai-tags 2 → 统一 1（扶着墙抬膝，谁都能做；ai-tags 原 2。）

## 4. 指导文字（教练口吻）
- purpose：给抬膝加上弹力带阻力，练把大腿抬高的力量 → 抬膝加上弹力带，练把大腿抬高的劲
- 要点 改前：站直扶墙，膝盖抬过髋的高度；顶端停2秒，身体别往后仰、别弯腰。；把脚放回原来的位置。
- 要点 改后：站直扶墙，膝盖抬过胯；顶上停 2 秒，身子别往后仰、别弯腰。；把脚放回原来的位置。
- 常见错误 改前：身体后仰或耸肩；膝盖没抬到髋的高度
- 常见错误 改后：身子往后仰或耸肩；膝盖没抬到胯那么高
- 注意事项 改前：髋部前面疼时膝盖抬低一点，还疼就停
- 注意事项 改后：胯前面疼就膝盖抬低点，还疼就停
- 相位口令：抬膝 / 停两秒 / 放下 → 抬膝 / 停两秒 / 放下

## 5. voiceGuide（脚本，未合成音频）
- 一下 4.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 膝盖抬过胯 | Knee above hip | cue1, commonErrors[1] |
| 5 | 身子别往后仰 | Don't lean back | cue2, commonErrors[0] |
| 8 | 脚放回原位 | Foot back to its spot | cue3 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：扶墙站姿、弹力带绑脚抬膝、胯前淡高亮（b17 第 1 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 4.0 s（抬 1.0 / 停 2.0 / 放 1.0），停 2 秒按原文
- 新增 sideSwitchSeconds 10（弹力带换到另一只脚、转身扶墙）
- 难度 v3 1 / ai-tags 2 → 统一 1
- 「髋」→「胯」

## 8. 待开哥定
- 无
