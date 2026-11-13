# o-chair-knee-extension 坐椅徒手伸膝（Chair-Seated Unloaded Knee Extension）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b19.jpg 第 1 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧10 次，休息 30 秒
- 改后：2 组×每侧10 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：8.0 s → 4.0 s
- 相位：go 1.5s / hold 1.0s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：不加重量，练大腿前侧的控制 → 不加重量，练大腿前面
- 要点 改前：大腿贴住椅面，小腿慢慢抬起伸直；坐稳固、没有轮子的椅子，另一只脚踩地。；伸到快直就停，膝盖别锁死。
- 要点 改后：大腿贴住椅面，小腿慢慢抬起伸直；坐结实、没轮子的椅子，另一只脚踩地。；伸到快直就停，膝盖别锁死。
- 常见错误 改前：甩腿或猛地锁死膝盖；身体往后仰
- 常见错误 改后：甩腿或猛地锁死膝盖；身子往后仰
- 注意事项 改前：膝盖疼时幅度小一点，还疼就停
- 注意事项 改后：膝盖疼就伸少点，还疼就停
- 相位口令：慢慢伸直 / 停住 / 慢慢放回 → 慢慢伸直 / 停住 / 慢慢放回

## 5. voiceGuide（脚本，未合成音频）
- 一下 4.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 别甩腿 | No kicking | commonErrors[0] |
| 5 | 膝盖别锁死 | Soft knee | cue3 |
| 8 | 身子别往后仰 | Don't lean back | commonErrors[1] |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：坐椅一腿伸直、大腿前面高亮（b19 第 1 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 8.0 s → 4.0 s（伸 1.5 / 停 1.0 / 放 1.5）
- 坐着原地换腿，不加换边准备
- purpose 去掉「控制」；「幅度小一点」→「伸少点」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 常见错误2：身子往后仰 → 往后靠在椅背上，借身子把腿抬起来（Leaning back. → Leaning back into the chair to get the leg up.）
- 注意事项1：膝盖疼就伸少点，还疼就停 → 膝盖里面疼就伸到一半，脚尖勾着慢慢来（If your knee hurts, don't straighten as far. Stop if it still hurts. → If your knee hurts inside, only straighten halfway and go slow.）
- 语音 reminders[2]：身子别往后仰 → 背离开椅背坐直（Don't lean back → Sit tall, off the backrest）
