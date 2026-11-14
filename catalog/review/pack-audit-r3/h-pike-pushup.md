# h-pike-pushup 派克俯卧撑（Pike Push-Up）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/b11.jpg 第 9 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×8 次，休息 60 秒
- 改后：3 组×8 次，休息 60 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.0 s
- 相位：go 1.5s / hold 0.5s / back 1.0s

## 3. 难度
- 改前 v3 2 / ai-tags 3 → 统一 3（头朝下推起身体，入门者常做不满；ai-tags 原 3。退阶写进注意事项。）

## 4. 指导文字（教练口吻）
- purpose：练肩膀往上推的力量，为倒立做准备 → 练肩膀往上推的劲，给倒立打底子
- 要点 改前：屁股保持高，弯肘让头落到双手前面；身体成倒 V 字，双手与肩同宽，腿伸直。；手肘斜着往后弯，再撑回手臂伸直。
- 要点 改后：屁股一直顶高，弯手肘让头落到两手前面；身子成倒 V 字，两手跟肩膀一样宽，腿伸直。；手肘斜着往后弯，再撑回手臂伸直。
- 常见错误 改前：手肘往两边张开；屁股掉下来变成普通俯卧撑
- 常见错误 改后：手肘往两边张开；屁股掉下来，成了普通俯卧撑
- 注意事项 改前：手腕刺痛或发麻时停止，开始前先活动手腕；肩膀疼时下得浅一点
- 注意事项 改后：手腕刺疼或发麻就停，开始前先转转手腕；肩膀疼就下浅点；做不满就把手撑在凳子上做
- 相位口令：往下 / 停一下 / 撑起 → 往下 / 停一下 / 撑起来

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 屁股顶高 | Hips high | cue1, commonErrors[1] |
| 5 | 手肘别张开 | Elbows don't flare | cue3, commonErrors[0] |
| 7 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 1 分钟；allDone → 很好

## 6. 画面对照
- 一致：屁股朝天倒 V 俯卧撑、肩/大臂高亮（b11 第 9 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.0 s（下 1.5 / 底 0.5 / 撑 1.0）；底部短停，kind 维持 rep_updown，r2 flag 结束
- 难度 v3 2 / ai-tags 3 → 统一 3；退阶「手撑在凳子上」写进注意事项
- 文字改教练口吻

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 常见错误1：手肘往两边张开 → 手肘往外撇，头往前冲（Elbows flaring out. → Elbows flaring and head shooting forward.）
- 注意事项1：手腕刺疼或发麻就停，开始前先转转手腕 → 头朝下压在手腕上，先转转手腕；刺疼就停（Stop if your wrists get sharp pain or go numb. Roll them out before you start. → Your weight is over your wrists, so warm them up. Stop on sharp pain.）
