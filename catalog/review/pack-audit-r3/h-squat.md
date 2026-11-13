# h-squat 徒手深蹲（Bodyweight Squat）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/b13.jpg 第 4 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×12 次，休息 45 秒
- 改后：3 组×12 次，休息 45 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.5 s
- 相位：go 1.5s / hold 0.5s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：练大腿和臀部，蹲下站起更轻松 → 练大腿和屁股，蹲下站起更轻松
- 要点 改前：屁股往后坐，膝盖对着脚尖；脚跟一直踩地，胸口抬起。；蹲到大腿差不多和地面平，再推地站起。
- 要点 改后：屁股往后坐，膝盖对着脚尖；脚后跟一直踩实，胸口抬起来，两手往前伸。；蹲到大腿差不多跟地面平，再踩地站起来。
- 常见错误 改前：膝盖往里扣；脚跟抬起，重心压到脚尖
- 常见错误 改后：膝盖往里倒；脚后跟抬起来，重心跑到脚尖
- 注意事项 改前：膝盖不舒服时蹲浅一点，还疼就停
- 注意事项 改后：膝盖不舒服就蹲浅点，还疼就停
- 相位口令：往下坐 / 稳住 / 站起 → 往下坐 / 稳住 / 站起来

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 膝盖对着脚尖 | Knees over toes | cue1, commonErrors[0] |
| 5 | 脚后跟踩实 | Heels down | cue2, commonErrors[1] |
| 8 | 胸口抬起来 | Chest up | cue2 |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好

## 6. 画面对照
- 一致：两手前伸深蹲、大腿前/屁股高亮（b13 第 4 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s（下 1.5 / 底 0.5 / 起 1.5）；顶点 < 0.8 s，kind 维持 rep_updown，r2 flag 结束
- cue2 补「两手往前伸」（画面两手前伸）
- 「往里扣」→「往里倒」；「臀部」→「屁股」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 常见错误1：膝盖往里倒 → 蹲到底时两个膝盖往里夹（Knees caving in. → Knees caving in at the bottom.）
- 注意事项1：膝盖不舒服就蹲浅点，还疼就停 → 膝盖不舒服就蹲到椅子高度，屁股往后多坐点（If your knees feel off, don't go as low. Stop if it still hurts. → If your knees complain, stop at chair height and sit back more.）
- 语音 reminders[0]：膝盖对着脚尖 → 膝盖往外顶（Knees over toes → Knees push out）
- 语音 reminders[1]：脚后跟踩实 → 重心在脚后跟（Heels down → Weight in your heels）
