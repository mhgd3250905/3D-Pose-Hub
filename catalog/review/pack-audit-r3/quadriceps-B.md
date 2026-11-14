# quadriceps-B 弹力带锁直膝盖（Band Knee Lockout）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b21.jpg 第 10 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧15 次，休息 45 秒
- 改后：3 组×每侧15 次，休息 45 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 4.0 s
- 相位：go 0.8s / hold 2.0s / back 1.2s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：专练膝盖最后伸直的那一下 → 专练膝盖最后伸直的那一下
- 要点 改前：把膝盖用力伸直，大腿前侧绷紧；弹力带套在膝盖后面，膝盖微弯开始。；伸直后停两秒，脚跟不离地。
- 要点 改后：把膝盖使劲伸直，大腿前面绷紧；弹力带套在膝盖后面，膝盖微弯开始。；伸直后停 2 秒，脚后跟别离地。
- 常见错误 改前：只把髋往前顶，膝盖没伸直
- 常见错误 改后：只把胯往前顶，膝盖没伸直
- 注意事项 改前：膝盖疼时换更轻的弹力带，还疼就停
- 注意事项 改后：膝盖疼就换根轻点的弹力带，还疼就停
- 相位口令：伸直 / 停两秒 / 放松 → 伸直 / 停两秒 / 放松

## 5. voiceGuide（脚本，未合成音频）
- 一下 4.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 膝盖伸直 | Lock it straight | cue1, commonErrors[0] |
| 5 | 脚后跟别离地 | Heel down | cue3 |
| 8 | 大腿前面绷紧 | Tighten your thigh | cue1 |
| 11 | 膝盖伸直 | Lock it straight | cue1, commonErrors[0] |
| 14 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：站姿弹力带套膝后伸膝、大腿前面高亮（b21 第 10 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 4.0 s（伸 0.8 / 停 2.0 / 松 1.2），停 2 秒按原文
- 新增 sideSwitchSeconds 10（弹力带换到另一条腿、转身）
- 「大腿前侧」→「大腿前面」，「髋」→「胯」
- 难度 1/1 不变

## 8. 待开哥定
- 无
