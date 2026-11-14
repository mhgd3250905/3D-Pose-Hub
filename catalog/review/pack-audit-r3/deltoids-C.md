# deltoids-C 地雷杆半跪单臂推举（Half-Kneeling Single-Arm Landmine Press）· 动作包核对 r3

- 类型：`rep_updown`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/batch-02.jpg 第 2 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧8 次，休息 60 秒
- 改后：3 组×每侧8 次，休息 60 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.0 s
- 相位：go 1.0s / hold 0.5s / back 1.5s

## 3. 难度
- 改前 v3 2 / ai-tags 2 → 统一 2

## 4. 指导文字（教练口吻）
- purpose：练肩膀推举力量，斜着往上推对肩更友好 → 练肩膀往上推的劲，斜着推对肩膀更友好
- 要点 改前：斜着往前上方推，直到手臂伸直；收紧臀部和肚子，上身别往后仰。；慢慢放回肩膀前面。
- 要点 改后：斜着往前上方推，推到手臂伸直；屁股夹紧、肚子绷住，上身别往后仰。；慢慢放回肩膀前面。
- 常见错误 改前：推的时候腰往后仰借力；肋骨往外翻
- 常见错误 改后：推的时候腰往后仰借劲；肋骨往外翻
- 注意事项 改前：肩前面夹着疼时，推的幅度小一点
- 注意事项 改后：肩膀前面夹着疼，就推得短一点
- 相位口令：推上去 / 停一下 / 放回来 → 推上去 / 推直 / 放回来

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 上身别往后仰 | Don't lean back | cue2, commonErrors[0] |
| 5 | 慢慢放回来 | Lower it slowly | cue3 |
| 7 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 1 分钟；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：半跪地雷杆单臂推、肩部高亮（batch-02 第 2 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.0 s（推 1.0 / 顶 0.5 / 慢放 1.5）；顶点 < 0.8 s，kind rep_hold → rep_updown
- 新增 sideSwitchSeconds 10（换跪的腿和手）
- 文字改教练口吻
- 难度 2/2 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 语音 reminders[1]：慢慢放回来 → 杆子慢慢落回肩前（Lower it slowly → Lower to your shoulder）
