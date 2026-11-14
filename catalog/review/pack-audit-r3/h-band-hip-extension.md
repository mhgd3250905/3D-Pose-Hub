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

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- purpose：练屁股，让腿往后推更有劲 → 练屁股，走路爬坡往后蹬更有劲（Builds your butt for pushing your leg back. → Builds your butt for pushing off when you walk and climb.）
- 要点4：一边做完，绑带换到另一只脚，转过身再做。 → 一侧做完，绑带换到另一只脚，扶着椅子换只手。（When one side is done, move the strap to the other ankle and turn around. → When one side is done, move the band to the other ankle and switch hands on the chair.）
- 常见错误1：用腰往后弯，不是屁股在使劲 → 腿往后抬太高，上身往前趴、腰往后折（Arching your lower back instead of using your butt. → Lifting too high, so you tip forward and bend your back.）
- 语音 reminders[0]：腰别往后弯 → 抬到屁股夹紧就够（Don't arch your back → Stop when your butt squeezes）
- 语音 reminders[2]：慢慢放回来 → 脚慢慢落回地面（Bring it back slowly → Foot back down slowly）
