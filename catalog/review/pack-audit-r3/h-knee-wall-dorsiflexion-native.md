# h-knee-wall-dorsiflexion-native 膝盖碰墙脚踝活动（Knee-to-Wall Ankle Mobility）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 left；V4 预览：`/workspace/work/v4run/b11.jpg 第 1 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧10 次，休息 20 秒
- 改后：2 组×每侧10 次，休息 20 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：8.0 s → 3.0 s
- 相位：go 1.0s / hold 1.0s / back 1.0s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：让脚踝往前弯得更多，下蹲和走路更轻松 → 让脚踝往前弯得更多，蹲下和走路更轻松
- 要点 改前：前脚跟踩住地，膝盖往前碰墙；膝盖朝第二、三个脚趾的方向走。；双手自然垂在身体两侧，身体跟着膝盖往前。
- 要点 改后：前脚后跟踩住地，膝盖往前碰墙；膝盖对着第二、三个脚趾走。；两手自然垂着，身子跟着膝盖往前。
- 常见错误 改前：前脚跟抬起来；膝盖往里倒
- 常见错误 改后：前脚后跟抬起来；膝盖往里倒
- 注意事项 改前：脚踝前面夹着疼时幅度小一点，还疼就停
- 注意事项 改后：脚踝前面夹着疼就膝盖往前少走点，还疼就停
- 相位口令：膝盖往前 / 碰墙停住 / 慢慢退回 → 膝盖往前 / 碰墙停住 / 慢慢退回

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 脚后跟踩住 | Heel stays down | cue1, commonErrors[0] |
| 5 | 膝盖对着脚趾 | Knee over your toes | cue2, commonErrors[1] |
| 8 | 碰到墙停一下 | Touch and hold | cue1 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 20 秒；allDone → 很好；sideDone → 换右边

## 6. 画面对照
- 一致：面墙前后脚、前膝往前碰墙、小腿高亮（b11 第 1 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 8.0 s → 3.0 s（往前 1.0 / 碰墙停 1.0 / 退回 1.0），活动类不用等动画
- 站着原地换脚，不加换边准备
- 「幅度小一点」→「膝盖往前少走点」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 常见错误2：膝盖往里倒 → 膝盖往大脚趾里面偏着去碰墙（Knee drifting inward. → Knee heading inside your big toe to reach the wall.）
- 语音 reminders[1]：膝盖对着脚趾 → 膝盖朝第二个脚趾（Knee over your toes → Knee over your second toe）
