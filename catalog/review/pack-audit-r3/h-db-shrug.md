# h-db-shrug 双哑铃站姿耸肩（Standing Dumbbell Shrug）· 动作包核对 r3

- 类型：`rep_hold`；V4 预览：`/workspace/work/v4run/b9.jpg 第 2 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×12 次，休息 30 秒
- 改后：3 组×12 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.0 s
- 相位：go 1.0s / hold 1.0s / back 1.0s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：练肩膀上方和脖子两侧的肌肉 → 练肩膀上面和脖子两边
- 要点 改前：手臂伸直，肩膀直直往耳朵方向耸；不弯手肘、不转肩、脖子不动。；顶端停一下。
- 要点 改后：手臂垂直，肩膀直直往耳朵耸；手肘别弯，肩膀直上直下，别画圈。；顶上停一下。
- 常见错误 改前：转肩画圈；用腿弹起借力
- 常见错误 改后：肩膀转着画圈；腿一弹借劲
- 注意事项 改前：脖子或肩膀不舒服时停止，先用轻重量
- 注意事项 改后：先用轻哑铃，脖子或肩膀不舒服就停
- 相位口令：向上耸 / 停一下 / 放下 → 往上耸 / 停一下 / 放下

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 直上直下，别画圈 | Straight up, no rolling | cue2, commonErrors[0] |
| 5 | 腿别弹 | Don't bounce | commonErrors[1] |
| 8 | 顶上停一下 | Pause at the top | cue3 |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好

## 6. 画面对照
- 动作一致：站姿双手提哑铃耸肩；预览帧几乎看不到高亮（b9 第 2 行，非极端）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.0 s（耸 1.0 / 顶上停 1.0 / 放 1.0）；顶点 ≥ 0.8 s，kind rep_updown → rep_hold
- cue2 一句三个指令拆成「手肘别弯，肩膀直上直下」
- 难度 1/1 不变

## 8. 待开哥定
- 预览帧几乎看不到肩膀上面高亮，请看视频确认

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点3：顶上停一下。 → 耸到最高停一下，像用肩膀去碰耳朵。（Pause at the top. → Hold at the top like you are touching your ears with your shoulders.）
- 语音 reminders[2]：顶上停一下 → 肩膀碰耳朵停住（Pause at the top → Shoulders to ears, hold）
