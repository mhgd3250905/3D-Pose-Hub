# g-cable-hip-abduction 低位绳索髋外展（Low Cable Hip Abduction）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/batch-02.jpg 第 9 行`（本机，不入库）
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
- 要点 改前：腿往外侧抬，骨盆和上身不动；一只手扶稳椅子，支撑脚踩实。；慢慢放回，别让绳子拉回去。
- 要点 改后：腿往外抬，上身和胯不动；一只手扶稳椅子，支撑脚踩实。；慢慢放回来，别让绳子把腿拽回去。；一边做完，绑带换到另一只脚，转过身再做。
- 常见错误 改前：上身往一边歪来抬腿；抬得太快，靠甩
- 常见错误 改后：上身往一边歪着抬腿；抬得太快，靠甩
- 注意事项 改前：疼时缩小幅度，还疼就停
- 注意事项 改后：疼就把动作做小点，还疼就停
- 相位口令：向外抬 / 停一下 / 放回来 → 往外抬 / 停一下 / 放回来

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 上身别歪 | Stay tall | commonErrors[0] |
| 5 | 慢慢放回来 | Bring it back slowly | cue3 |
| 8 | 别甩，慢一点 | Slow, no swinging | commonErrors[1] |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：站姿绳索侧抬腿、扶椅、臀外侧高亮（batch-02 第 9 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s
- 新增 sideSwitchSeconds 10（换绑带、转身）与换边要点
- 「骨盆和上身不动」→「上身和胯不动」，「缩小幅度」→「做小点」
- 难度 1/1 不变

## 8. 待开哥定
- 无
