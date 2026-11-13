# h-db-overhead-shrug 双哑铃过头耸肩（Standing Dumbbell Overhead Shrug）· 动作包核对 r3

- 类型：`rep_hold`；V4 预览：`/workspace/work/v4run/b8.jpg 第 5 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×10 次，休息 60 秒
- 改后：3 组×10 次，休息 60 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.5 s
- 相位：go 1.0s / hold 1.0s / back 1.5s

## 3. 难度
- 改前 v3 2 / ai-tags 2 → 统一 2（手臂要能直直举过头，肩膀活动不开的人吃力。）

## 4. 指导文字（教练口吻）
- purpose：手臂举过头时练肩膀上方的肌肉 → 手举过头练肩膀上面
- 要点 改前：手臂伸直举过头，肩膀往耳朵耸；站直，肋骨往下收，头不动。；顶上停一下，再慢慢放下。
- 要点 改后：手臂伸直举过头，肩膀往耳朵耸；人站直，肋骨往下收，别挺肚子。；顶上停一下，再慢慢放下。
- 常见错误 改前：弯肘变成推举；往前探头或歪头
- 常见错误 改后：手肘一弯，变成了推举；往前探头或歪头
- 注意事项 改前：用轻哑铃，肩膀或脖子疼就停
- 注意事项 改后：用轻哑铃，肩膀或脖子疼就停
- 相位口令：耸肩 / 停住 / 慢放下 → 往上耸 / 停住 / 慢慢放

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 手臂伸直别弯 | Arms stay straight | cue1, commonErrors[0] |
| 5 | 头别往前探 | Head still | commonErrors[1] |
| 8 | 肋骨往下收 | Ribs down | cue2 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 1 分钟；allDone → 很好

## 6. 画面对照
- 一致：双臂过头举哑铃耸肩（背面）、上背/斜方高亮（b8 第 5 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s（耸 1.0 / 停 1.0 / 放 1.5）；顶点 ≥ 0.8 s，kind rep_updown → rep_hold
- 文字改教练口吻（「别挺肚子」）
- 难度 2/2 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点3：顶上停一下，再慢慢放下。 → 耸到顶耳朵贴肩膀停一下，再慢慢落。（Pause at the top, then lower slowly. → Hold with your shoulders up by your ears, then let them down slowly.）
- 语音 reminders[2]：肋骨往下收 → 手臂锁直别弯（Ribs down → Arms locked straight）
