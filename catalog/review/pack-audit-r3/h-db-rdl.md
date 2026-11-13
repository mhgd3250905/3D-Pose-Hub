# h-db-rdl 哑铃罗马尼亚硬拉（Dumbbell Romanian Deadlift）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/b8.jpg 第 8 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×10 次，休息 60 秒
- 改后：3 组×10 次，休息 60 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 4.0 s
- 相位：go 2.0s / hold 0.5s / back 1.5s

## 3. 难度
- 改前 v3 2 / ai-tags 2 → 统一 2

## 4. 指导文字（教练口吻）
- purpose：练大腿后侧和臀部，学会从髋部弯腰而不弓背 → 练大腿后面和屁股，学会弯腰时背不弓
- 要点 改前：臀部往后推，背保持平直，哑铃贴腿下放；膝盖微弯，但不要往下蹲。；哑铃到膝盖下方、大腿后侧有拉伸感就停，再站直。
- 要点 改后：屁股往后推，背挺平，哑铃贴着腿往下滑；膝盖微弯，但别往下蹲。；哑铃过膝盖、大腿后面拉紧了就停，再站直。
- 常见错误 改前：弓背；变成下蹲
- 常见错误 改后：弓背；蹲下去了
- 注意事项 改前：从轻重量开始，出现疼痛就停止；腰不舒服时减小幅度，仍痛就停止
- 注意事项 改后：先用轻哑铃，哪儿疼就停；腰不舒服就往下少弯点，还疼就停
- 相位口令：臀往后推 / 停一下 / 站直 → 屁股往后 / 停一下 / 站直

## 5. voiceGuide（脚本，未合成音频）
- 一下 4.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 背挺平，别弓 | Flat back, no rounding | cue1, commonErrors[0] |
| 5 | 屁股往后，别蹲 | Hips back, don't squat | cue2, commonErrors[1] |
| 8 | 哑铃贴着腿走 | Weights close to your legs | cue1 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 1 分钟；allDone → 很好

## 6. 画面对照
- 一致：哑铃罗马尼亚硬拉俯身、大腿后面高亮（b8 第 8 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s（下 2.0 / 底 0.5 / 起 1.5），慢放
- purpose「从髋部弯腰」→「弯腰时背不弓」；「减小幅度」→「往下少弯点」
- 难度 2/2 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 注意事项1：先用轻哑铃，哪儿疼就停 → 先用轻哑铃，学会屁股往后推再加重（Start with light dumbbells. Stop if anything hurts. → Start light. Add weight once pushing your hips back feels natural.）
- 注意事项2：腰不舒服就往下少弯点，还疼就停 → 腰发紧就弯到膝盖高度就起来（If your lower back feels off, don't bend as far. Stop if it still hurts. → If your lower back tightens, only go down to your knees.）
- 语音 reminders[0]：背挺平，别弓 → 哑铃贴腿，背别弓（Flat back, no rounding → Weights on legs, flat back）
