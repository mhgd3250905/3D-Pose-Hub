# h-goblet-squat 壶铃高脚杯深蹲（Kettlebell Goblet Squat）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/b10.jpg 第 3 行`（本机，不入库）
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
- purpose：负重练大腿和臀部，让下蹲更稳 → 抱着壶铃练大腿和屁股，蹲得更稳
- 要点 改前：壶铃抱在胸前，臀部往后往下坐；膝盖对着脚尖，脚跟踩地。；胸口保持抬起，壶铃贴身。
- 要点 改后：壶铃抱在胸前，屁股往后往下坐；膝盖对着脚尖，脚后跟踩实。；胸口一直挺着，壶铃贴着身子。
- 常见错误 改前：膝盖往里扣；弓背、壶铃离开身体
- 常见错误 改后：膝盖往里倒；弓背，壶铃离开身子
- 注意事项 改前：膝盖不舒服时蹲浅一点，仍痛就停止；从轻重量开始，出现疼痛就停止
- 注意事项 改后：膝盖不舒服就蹲浅点，还疼就停；先用轻壶铃，哪儿疼就停
- 相位口令：向下坐 / 稳住 / 站起 → 往下坐 / 稳住 / 站起来

## 5. voiceGuide（脚本，未合成音频）
- 一下 4.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 膝盖对着脚尖 | Knees over toes | cue2, commonErrors[0] |
| 5 | 胸口挺着 | Chest up | cue3, commonErrors[1] |
| 8 | 脚后跟踩实 | Heels down | cue2 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 1 分钟；allDone → 很好

## 6. 画面对照
- 一致：胸前抱壶铃深蹲、大腿前面高亮（b10 第 3 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s（下 2.0 / 底 0.5 / 起 1.5），慢蹲
- 文字改教练口吻
- 难度 2/2 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 常见错误1：膝盖往里倒 → 站起来时两个膝盖往中间夹（Knees caving in. → Knees squeezing together as you stand up.）
- 注意事项1：膝盖不舒服就蹲浅点，还疼就停 → 膝盖不舒服就蹲到椅子高度就起来（If your knees feel off, don't go as low. Stop if it still hurts. → If your knees complain, only squat to chair height.）
- 注意事项2：先用轻壶铃，哪儿疼就停 → 先用轻壶铃，抱不住胸口就换轻的（Start with a light kettlebell. Stop if anything hurts. → Start with a light kettlebell. If it pulls you forward, go lighter.）
- 语音 reminders[0]：膝盖对着脚尖 → 站起时膝盖别夹（Knees over toes → Knees don't squeeze in）
- 语音 reminders[2]：脚后跟踩实 → 全脚掌踩地（Heels down → Whole foot on the floor）
