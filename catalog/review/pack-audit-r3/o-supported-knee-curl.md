# o-supported-knee-curl 扶椅站姿徒手屈膝（Chair-Supported Standing Knee Curl）· 动作包核对 r3

- 类型：`rep_updown`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b20.jpg 第 10 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧10 次，休息 30 秒
- 改后：2 组×每侧10 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：8.0 s → 3.0 s
- 相位：go 1.0s / hold 0.5s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：不加重量，练大腿后侧弯膝的控制 → 不加重量，练大腿后面弯膝盖的劲
- 要点 改前：大腿不动，脚跟慢慢往臀部方向抬；站直，一只手轻扶稳固的椅子。；顶端稍停，再慢慢放下。
- 要点 改后：大腿不动，脚后跟慢慢往屁股抬；站直，一只手轻扶结实的椅子。；顶上稍停，再慢慢放下。
- 常见错误 改前：大腿往前跑或弯腰
- 常见错误 改后：大腿往前跑或弯腰
- 注意事项 改前：扶稳没有轮子的椅子，疼或站不稳时就停
- 注意事项 改后：用不带轮子的结实椅子，疼或站不稳就停
- 相位口令：脚跟上抬 / 停住 / 慢慢放下 → 脚跟上抬 / 停住 / 慢慢放

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 大腿别动 | Thigh still | cue1, commonErrors[0] |
| 5 | 人站直 | Stand tall | cue2 |
| 8 | 慢慢放下 | Lower slowly | cue3 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：扶椅站、小腿往后弯、大腿后面高亮（b20 第 10 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 8.0 s → 3.0 s（抬 1.0 / 稍停 0.5 / 放 1.5）；顶点 < 0.8 s，kind rep_hold → rep_updown
- 站着原地换边，不加换边准备
- purpose 去掉「控制」；「臀部」→「屁股」
- 难度 1/1 不变

## 8. 待开哥定
- 无
