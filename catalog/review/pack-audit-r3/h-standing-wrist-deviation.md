# h-standing-wrist-deviation 站姿手腕侧摆（Standing Wrist Side Tilt）· 动作包核对 r3

- 类型：`rep_updown`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b13.jpg 第 7 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧10 次，休息 20 秒
- 改后：2 组×每侧10 次，休息 20 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 2.5 s
- 相位：go 1.0s / hold 0.5s / back 1.0s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：活动手腕，练习手腕往两边摆的控制 → 活动手腕，往两边摆更灵活
- 要点 改前：掌心朝下，手腕先往拇指侧摆，再往小指侧摆；手肘弯着不动，前臂不转。；摆到一侧算 1 次，慢而轻，不要硬掰。
- 要点 改后：掌心朝下，手腕先往大拇指那边摆，再往小指那边摆；手肘弯着别动，小臂别转。；摆到一边算 1 下，慢慢摆，别硬掰。
- 常见错误 改前：前臂跟着转；整条手臂跟着晃
- 常见错误 改后：小臂跟着转；整条胳膊跟着晃
- 注意事项 改前：出现疼痛时减小幅度，仍痛就停止
- 注意事项 改后：疼就摆小点，还疼就停
- 相位口令：摆过去 / 停一下 / 回中间 → 摆过去 / 停一下 / 回中间

## 5. voiceGuide（脚本，未合成音频）
- 一下 2.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 小臂别转 | Forearm still | cue2, commonErrors[0] |
| 5 | 胳膊别晃 | Arm stays still | commonErrors[1] |
| 8 | 慢慢摆，别硬掰 | Slow, no forcing | cue3 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 20 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：站姿屈肘、手腕往两边摆、小臂高亮（b13 第 7 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 2.5 s（摆 1.0 / 停 0.5 / 回 1.0），小幅活动；顶点 < 0.8 s，kind rep_hold → rep_updown
- 站着原地换手，不加换边准备
- purpose「练习手腕往两边摆的控制」→「往两边摆更灵活」；「拇指侧/小指侧」→「大拇指那边/小指那边」；注意事项改短句
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 注意事项1：疼就摆小点，还疼就停 → 手腕两边卡着疼就摆一半（If it hurts, don't tilt as far. Stop if it still hurts. → If the sides of your wrist pinch, only tilt halfway.）
