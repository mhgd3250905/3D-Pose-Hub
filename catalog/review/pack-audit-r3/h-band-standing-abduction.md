# h-band-standing-abduction 扶椅弹力带侧抬腿（Standing Band Side Leg Raise）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b4.jpg 第 7 行`（本机，不入库）
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
- purpose：练臀部外侧，让髋部更稳 → 练屁股外侧，让胯站得更稳
- 要点 改前：腿往侧面抬，上身保持不动；弹力带固定在牢固的低处，椅子只用来扶稳。；慢慢放回，在不疼的范围里做。
- 要点 改后：腿往旁边抬，上身不动；带子拴在牢靠的低处，椅子只用来扶。；慢慢放回来，在不疼的范围里做。；一边做完，绑带换到另一只脚，转过身再做。
- 常见错误 改前：上身往一侧歪来帮忙抬腿
- 常见错误 改后：上身往一边歪着帮忙抬
- 注意事项 改前：别把弹力带绑在椅子上；髋部疼时停下
- 注意事项 改后：别把带子拴在椅子上；胯疼就停
- 相位口令：往外抬 / 停一下 / 放回 → 往外抬 / 停一下 / 放回

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 上身别歪 | Stay tall | cue1, commonErrors[0] |
| 5 | 慢慢放回来 | Bring it back slowly | cue3 |
| 8 | 别甩，慢慢抬 | Slow, no swinging | cue3 |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：扶椅站姿、弹力带绑脚踝侧抬、臀外侧高亮（b4 第 7 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s
- 新增 sideSwitchSeconds 10（换绑带、转身）与换边要点
- 文字改教练口吻
- 难度 1/1 不变

## 8. 待开哥定
- 计到 12，共用词只到 n.10
