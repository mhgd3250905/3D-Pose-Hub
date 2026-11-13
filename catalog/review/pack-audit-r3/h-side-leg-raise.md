# h-side-leg-raise 站姿侧抬腿（Standing Side Leg Raise）· 动作包核对 r3

- 类型：`rep_updown`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b13.jpg 第 2 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧12 次，休息 30 秒
- 改后：3 组×每侧12 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.0 s
- 相位：go 1.0s / hold 0.5s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 2 → 统一 1（扶着椅子人人能做；退阶写进注意事项。ai-tags 原 2。）

## 4. 指导文字（教练口吻）
- purpose：练臀部外侧，单腿站得更稳 → 练屁股侧面，单腿也站得稳
- 要点 改前：腿伸直往旁边抬，脚尖朝前；双手扶腰，上身别往另一边倒。；顶上停一下，再慢慢放下。
- 要点 改后：腿伸直往旁边抬，脚尖朝前；两手叉腰，上身别往另一边倒。；顶上停一下，再慢慢放下。
- 常见错误 改前：脚尖往外转；上身往旁边倒
- 常见错误 改后：脚尖往外转；上身往旁边倒
- 注意事项 改前：髋部不舒服时幅度小一点，还疼就停
- 注意事项 改后：胯不舒服就抬低点，还疼就停；站不稳就一手扶着椅子
- 相位口令：侧抬 / 停一下 / 慢放下 → 往旁边抬 / 停一下 / 慢慢放

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 脚尖朝前 | Toes forward | cue1, commonErrors[0] |
| 5 | 上身别往旁边倒 | Stay upright | cue2, commonErrors[1] |
| 8 | 慢慢放下 | Lower slowly | cue3 |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 动作一致：站姿两手叉腰一腿往旁边抬；预览帧几乎看不到高亮（b13 第 2 行，非极端）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.0 s（抬 1.0 / 停 0.5 / 放 1.5）；顶点 < 0.8 s，kind 维持 rep_updown，r2 flag 结束
- 站着原地换腿，不加换边准备
- 难度 v3 1 / ai-tags 2 → 统一 1；退阶「一手扶着椅子」写进注意事项
- 「臀部外侧」→「屁股侧面」；「髋部…幅度小一点」→「胯不舒服就抬低点」

## 8. 待开哥定
- 预览帧几乎看不到屁股侧面高亮，请看视频确认

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点3：顶上停一下，再慢慢放下。 → 抬到胯边发酸就停一下，脚慢慢落回来。（Pause at the top, then lower slowly. → Pause when the side of your hip burns, then lower your foot slowly.）
- 注意事项1：胯不舒服就抬低点，还疼就停 → 胯外面卡着疼就抬低点，扶住椅子站稳（If your hip feels off, don't lift as high. Stop if it still hurts. → If the outside of your hip pinches, lift lower and hold a chair.）
