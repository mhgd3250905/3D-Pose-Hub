# h-good-morning 徒手早安式（Bodyweight Good Morning）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/b10.jpg 第 4 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×12 次，休息 30 秒
- 改后：3 组×12 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 4.0 s
- 相位：go 2.0s / hold 0.5s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 2 → 统一 1（徒手入门可做；ai-tags 原 2。）

## 4. 指导文字（教练口吻）
- purpose：练大腿后侧和下背，学会从髋部弯腰而不弓背 → 练大腿后面和腰背，学会弯腰时背不弓
- 要点 改前：臀部往后推，上身像木板一样往前倾；双手交叉放胸前，膝盖微弯。；上身接近水平、大腿后侧有拉伸感就停。
- 要点 改后：屁股往后推，上身像一块木板往前倒；两手轻放在脑后，手肘打开，膝盖微弯。；上身快到水平、大腿后面拉紧了就停，再站直。
- 常见错误 改前：弓背；变成下蹲
- 常见错误 改后：弓背；蹲下去了
- 注意事项 改前：腰不舒服时减小幅度，仍痛就停止
- 注意事项 改后：腰不舒服就往下少弯点，还疼就停；手别使劲压脑袋
- 相位口令：臀往后推 / 停一下 / 站直 → 屁股往后 / 停一下 / 站直

## 5. voiceGuide（脚本，未合成音频）
- 一下 4.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 背挺平，别弓 | Flat back, no rounding | cue1, commonErrors[0] |
| 5 | 屁股往后，别蹲 | Hips back, don't squat | cue1, commonErrors[1] |
| 8 | 拉紧了就停 | Stop at the pull | cue3 |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好

## 6. 画面对照
- 动作一致：俯身早安式、大腿后/屁股高亮；画面两手放脑后，原文写「双手交叉放胸前」，已按画面改（b10 第 4 行，非极端）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s（下 2.0 / 底 0.5 / 起 1.5），慢放
- 手位按画面改成「两手轻放在脑后」，补注意事项「手别使劲压脑袋」
- 难度 v3 1 / ai-tags 2 → 统一 1
- purpose「从髋部弯腰」→「弯腰时背不弓」；「减小幅度」→「往下少弯点」
- 开哥 2026-11-14 按推荐：保持按画面「两手放脑后」，不改动画

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 注意事项1：腰不舒服就往下少弯点，还疼就停 → 腰发紧就倒到一半就起来，大腿后面有拉就够（If your lower back feels off, don't bend as far. Stop if it still hurts. → If your back tightens, only tip halfway. A pull in your hamstrings is enough.）
- 语音 reminders[0]：背挺平，别弓 → 上身像块木板（Flat back, no rounding → Body like a plank）
