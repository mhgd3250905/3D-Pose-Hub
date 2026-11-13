# adductors-C 绳索站姿髋内收（Standing Cable Hip Adduction）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 left；V4 预览：`/workspace/work/v4run/b1.jpg 第 6 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧12 次，休息 45 秒
- 改后：3 组×每侧12 次，休息 45 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.5 s
- 相位：go 0.9s / hold 0.8s / back 1.5s / rest 0.3s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：练大腿内侧，让髋部更好控制 → 练大腿内侧，让腿往里并更有劲
- 要点 改前：腿伸直，往里扫到支撑腿前面；侧对器械站，靠近器械的脚踝套上绑带。；骨盆放平，慢慢放回外侧。
- 要点 改后：腿伸直，往里扫到支撑腿前面；侧对器械站，靠器械那只脚踝套上绑带。；两边胯骨一样高，慢慢放回外边。；一边做完，绑带换到另一只脚，转过身再做。
- 常见错误 改前：上身往一边歪来带腿；放回时被绳子拉回去
- 常见错误 改后：上身往一边歪着带腿；放回去时被绳子一下拽走
- 注意事项 改前：疼时缩小幅度，还疼就停
- 注意事项 改后：疼就把动作做小点，还疼就停
- 相位口令：拉进来 / 停一下 / 放回去 → 往里扫 / 停一下 / 慢慢放

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 上身别歪 | Upper body tall | commonErrors[0] |
| 5 | 慢慢放，别被拽走 | Ease it out slowly | cue3, commonErrors[1] |
| 8 | 两边胯骨一样高 | Hips level | cue3 |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好；sideDone → 换右边

## 6. 画面对照
- 一致：侧对绳索站、脚踝绑带、大腿内侧高亮
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s（扫进 0.9 / 停 0.8 / 慢放 1.5）
- 新增 sideSwitchSeconds 10（换绑带、转身）及 cue4 换边说明
- 「骨盆放平」→「两边胯骨一样高」，「缩小幅度」→「做小点」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点4：一边做完，绑带换到另一只脚，转过身再做。 → 换腿时把脚踝绑带解下来，绑到另一只脚，转身再接着做。（When one side is done, move the strap to the other ankle and turn around. → To switch, move the ankle strap to your other foot and turn to face the other way.）
- 语音 reminders[2]：两边胯骨一样高 → 胯别歪，腿慢慢回外边（Hips level → Hips level, back out slowly）
