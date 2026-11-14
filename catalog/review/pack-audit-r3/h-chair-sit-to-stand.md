# h-chair-sit-to-stand 椅子坐下站起（Chair Sit-to-Stand）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/b6.jpg 第 9 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×10 次，休息 45 秒
- 改后：3 组×10 次，休息 45 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：8.0 s → 4.0 s
- 相位：go 1.5s / hold 0.5s / back 2.0s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：练大腿和臀部，让起身更轻松 → 练大腿和屁股，让从椅子上起身更轻松
- 要点 改前：上身前倾，双脚踩实站起来；双臂往前伸，帮助保持平衡。；坐回去时慢慢来，别一屁股坐下。
- 要点 改后：上身往前倾，两脚踩实站起来；两臂往前伸，帮你站稳。；坐回去慢慢来，别一屁股砸下去。
- 常见错误 改前：猛地坐下；膝盖往里扣
- 常见错误 改后：一屁股砸下去；膝盖往里倒
- 注意事项 改前：用结实、不带轮子的椅子，最好靠墙放；膝盖不舒服时换高一点的椅子，还疼就停
- 注意事项 改后：用结实、不带轮子的椅子，最好靠墙放；膝盖不舒服就换把高点的椅子，还疼就停
- 相位口令：前倾站起 / 站直 / 慢慢坐下 → 前倾站起 / 站直 / 慢慢坐下

## 5. voiceGuide（脚本，未合成音频）
- 一下 4.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 慢慢坐，别砸下去 | Sit slowly, no dropping | cue3, commonErrors[0] |
| 5 | 膝盖对着脚尖 | Knees over toes | commonErrors[1] |
| 8 | 两脚踩实站起来 | Push through your feet | cue1 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好

## 6. 画面对照
- 一致：椅子坐站、双臂前伸、大腿前/臀高亮（b6 第 9 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 8.0 s → 4.0 s（站起 1.5 / 站直 0.5 / 慢坐 2.0）；顶点 < 0.8 s，kind rep_hold → rep_updown；r2 flag 手算相位不再适用
- 文字改教练口吻
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 常见错误2：膝盖往里倒 → 站起来那一下膝盖往里夹（Knees caving in. → Knees pinching in as you stand.）
- 语音 reminders[1]：膝盖对着脚尖 → 站起时膝盖往外撑（Knees over toes → Push knees out as you stand）
