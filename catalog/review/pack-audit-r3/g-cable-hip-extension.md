# g-cable-hip-extension 低位绳索髋后伸（Low Cable Hip Extension）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/batch-02.jpg 第 10 行`（本机，不入库）
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
- purpose：练臀部，让你把腿往后推得更有力 → 练屁股，让腿往后蹬更有劲
- 要点 改前：用臀部把腿往后推，上身不动；一只手扶稳椅子，支撑脚踩实。；腰别往后仰，慢慢放回。
- 要点 改后：用屁股把腿往后推，上身不动；一只手扶稳椅子，支撑脚踩实。；腰别往后仰，慢慢放回来。；一边做完，绑带换到另一只脚，转过身再做。
- 常见错误 改前：腰往后仰代替臀部发力
- 常见错误 改后：腰往后仰，不是屁股在使劲；甩腿
- 注意事项 改前：腰不舒服时幅度小一点，还疼就停
- 注意事项 改后：腰不舒服就把动作做小点，还疼就停
- 相位口令：往后推 / 夹紧臀部 / 放回来 → 往后推 / 夹紧屁股 / 放回来

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 腰别往后仰 | Don't arch your back | cue3, commonErrors[0] |
| 5 | 用屁股往后推 | Push with your butt | cue1 |
| 8 | 慢慢放回来 | Bring it back slowly | cue3 |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：站姿绳索后踢、扶椅、臀部高亮（batch-02 第 10 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s
- 新增 sideSwitchSeconds 10 与换边要点
- 常见错误补「甩腿」；文字改教练口吻
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- purpose：练屁股，让腿往后蹬更有劲 → 练屁股，跑跳时往后蹬地更有力（Builds your butt for a stronger push back with your leg. → Builds your butt so you drive off the ground harder when you run and jump.）
- 要点4：一边做完，绑带换到另一只脚，转过身再做。 → 一侧做完，把绑带挪到另一只脚踝，转身面对绳索机。（When one side is done, move the strap to the other ankle and turn around. → When one side is done, move the strap to the other ankle and face the machine again.）
- 常见错误1：腰往后仰，不是屁股在使劲 → 腿往后甩太高，腰跟着往后折（Arching your lower back instead of using your butt. → Kicking too high and bending your lower back with it.）
- 语音 reminders[0]：腰别往后仰 → 腿往后推，腰别折（Don't arch your back → Push back, don't bend your back）
- 语音 reminders[2]：慢慢放回来 → 绳子别一下弹回去（Bring it back slowly → Don't let the cable snap back）
