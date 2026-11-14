# h-quadruped-rockback 跪撑平背后坐（Hands-and-Knees Rock Back）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/b12.jpg 第 4 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×10 次，休息 20 秒
- 改后：2 组×10 次，休息 20 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.0 s
- 相位：go 1.5s / hold 0.5s / back 1.0s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：活动髋部，练习往后坐时背保持平直 → 让胯活动开，练往后坐时背不弓
- 要点 改前：背保持平直，屁股往脚跟方向坐；双手不动，手臂伸直。；背快要弯的时候就停住，再往前回。
- 要点 改后：背挺平，屁股往脚后跟坐；两手不动，手臂伸直。；背快要弓的时候就停，再往前回。
- 常见错误 改前：往后坐时弓背
- 常见错误 改后：往后坐的时候弓背
- 注意事项 改前：髋部不舒服时幅度小一点，还疼就停；手腕刺痛或发麻时停止，开始前先活动手腕
- 注意事项 改后：胯不舒服就往后少坐点，还疼就停；手腕刺疼或发麻就停，开始前先转转手腕
- 相位口令：往后坐 / 停一下 / 往前回 → 往后坐 / 停一下 / 往前回

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 背挺平，别弓 | Flat back | cue1, commonErrors[0] |
| 5 | 快弓就停 | Stop before it rounds | cue3 |
| 8 | 两手别动 | Hands stay put | cue2 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 20 秒；allDone → 很好

## 6. 画面对照
- 一致：四点跪往后坐、腰背/大腿高亮（b12 第 4 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.0 s（后坐 1.5 / 停 0.5 / 回 1.0）；顶点 < 0.8 s，kind rep_hold → rep_updown
- purpose「活动髋部」→「让胯活动开」；「幅度小一点」→「往后少坐点」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 注意事项2：手腕刺疼或发麻就停，开始前先转转手腕 → 跪撑手腕不舒服就撑拳头，膝盖下垫软（Stop if your wrists get sharp pain or go numb. Roll them out before you start. → Press on your fists if your wrists complain, and pad your knees.）
- 语音 reminders[0]：背挺平，别弓 → 往后坐，腰别弓（Flat back → Sit back, don't round）
