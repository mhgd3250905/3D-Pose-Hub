# h-towel-pulldown 站姿毛巾下拉（Standing Towel Pulldown）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/b15.jpg 第 5 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×10 次，休息 30 秒
- 改后：3 组×10 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.5 s
- 相位：go 1.5s / hold 0.5s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：用毛巾练背部，让肩胛骨更会往下收 → 用毛巾练背，学会把肩胛骨往下放
- 要点 改前：毛巾往两边拉紧，手肘往下往后拉；双手宽握毛巾，从头顶 V 字开始。；推回头顶时毛巾也不松。
- 要点 改后：毛巾往两边拉紧，手肘往下往后拉；两手握宽毛巾，从头顶 V 字开始。；推回头顶时毛巾也别松。
- 常见错误 改前：毛巾松掉；腰往前拱
- 常见错误 改后：毛巾松了；腰往前挺
- 注意事项 改前：肩膀疼时减小幅度，仍痛就停止
- 注意事项 改后：肩膀疼就拉小点，还疼就停
- 相位口令：向下拉 / 夹紧 / 推回去 → 往下拉 / 夹紧 / 推回去

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 毛巾往两边拉紧 | Pull the towel apart | cue1, commonErrors[0] |
| 5 | 腰别往前挺 | Don't arch | commonErrors[1] |
| 8 | 推回去也别松 | Stay tight going up | cue3 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好

## 6. 画面对照
- 一致：两手举毛巾往下拉到头后（背面）、背阔高亮（b15 第 5 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s（拉 1.5 / 夹 0.5 / 推回 1.5）
- 「背部」→「背」，「往下收」→「往下放」；「减小幅度」→「拉小点」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 常见错误2：腰往前挺 → 往下拉时挺肚子，腰往后折（Arching your lower back. → Pushing your belly out and bending back as you pull.）
- 注意事项1：肩膀疼就拉小点，还疼就停 → 肩膀疼就别拉到脑后，拉到下巴前就够（If your shoulders hurt, don't pull as far. Stop if it still hurts. → If your shoulders hurt, pull to your chin instead of behind your head.）
- 语音 reminders[1]：腰别往前挺 → 肋骨往下收（Don't arch → Ribs down）
