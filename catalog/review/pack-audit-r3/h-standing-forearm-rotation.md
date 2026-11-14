# h-standing-forearm-rotation 站姿屈肘前臂旋转（Standing Forearm Rotation）· 动作包核对 r3

- 类型：`rep_updown`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b13.jpg 第 6 行`（本机，不入库）
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
- purpose：活动前臂，让手掌翻转更灵活、更好控制 → 活动小臂，手掌翻得更灵活
- 要点 改前：大臂不动，掌心转向上，再转向下；手肘弯着贴在身侧，手腕不弯。；转到一头算 1 次，每到头停一下，慢慢转。
- 要点 改后：大臂不动，掌心转向上，再转向下；手肘弯着贴在身边，手腕别弯。；转到一头算 1 下，到头停一下，慢慢转。
- 常见错误 改前：用肩膀带着转；手肘离开身体
- 常见错误 改后：用肩膀带着转；手肘离开身子
- 注意事项 改前：出现疼痛时减小幅度，仍痛就停止
- 注意事项 改后：疼就转小点，还疼就停
- 相位口令：转手掌 / 停一下 / 回中间 → 转手掌 / 停一下 / 回中间

## 5. voiceGuide（脚本，未合成音频）
- 一下 2.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 大臂别动 | Upper arm still | cue1, commonErrors[0] |
| 5 | 手肘贴着身子 | Elbow in | cue2, commonErrors[1] |
| 8 | 慢慢转 | Turn slowly | cue3 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 20 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：站姿屈肘转小臂、小臂高亮（b13 第 6 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 2.5 s（转 1.0 / 停 0.5 / 回 1.0），小幅活动；顶点 < 0.8 s，kind rep_hold → rep_updown
- 站着原地换手，不加换边准备
- purpose 去掉「更好控制」；「出现疼痛时减小幅度，仍痛就停止」→「疼就转小点，还疼就停」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 常见错误2：手肘离开身子 → 转手腕时大臂跟着往外甩（Elbow drifting away from your side. → Upper arm swinging out as you turn.）
- 注意事项1：疼就转小点，还疼就停 → 手肘或手腕疼就转一半，慢慢来（If it hurts, don't turn as far. Stop if it still hurts. → If your elbow or wrist hurts, turn halfway and go slower.）
