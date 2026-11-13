# o-supported-ankle-inversion 扶椅脚底向内翻（Chair-Supported Foot Turn-In）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b20.jpg 第 5 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧10 次，休息 30 秒
- 改后：2 组×每侧10 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：8.0 s → 3.5 s
- 相位：go 1.0s / hold 1.0s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：不加重量，练脚踝把脚底往里翻的控制 → 不加重量，练脚踝把脚底往里翻的劲
- 要点 改前：小腿不动，脚底慢慢向里翻；一只手轻扶椅子，这只脚悬空。；小幅度翻到位，再慢慢回正。
- 要点 改后：小腿不动，脚底慢慢往里翻；一只手轻扶椅子，这只脚悬空。；动一点就够，翻到位再慢慢回正。
- 常见错误 改前：转小腿或转髋来代替脚踝
- 常见错误 改后：转小腿或转胯代替脚踝
- 注意事项 改前：扶稳没有轮子的椅子，疼或站不稳时就停
- 注意事项 改后：用不带轮子的结实椅子，疼或站不稳就停
- 相位口令：脚底朝里 / 停住 / 慢慢回正 → 脚底朝里 / 停住 / 慢慢回正

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 小腿别转 | Shin still | cue1, commonErrors[0] |
| 5 | 慢慢回正 | Come back slowly | cue3 |
| 8 | 扶稳椅子 | Hold the chair | cue2 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：扶椅单脚悬空翻脚、小腿前/外侧高亮（b20 第 5 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 8.0 s → 3.5 s（翻 1.0 / 停 1.0 / 回 1.5），小幅动作
- 站着原地换边，不加换边准备
- purpose 去掉「控制」；「小幅度」→「动一点就够」；「转髋」→「转胯」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 注意事项1：用不带轮子的结实椅子，疼或站不稳就停 → 一手扶椅背，脚踝崴过的先翻小一点（Use a sturdy chair without wheels. Stop if it hurts or you feel wobbly. → Keep a hand on the chair. If you have rolled that ankle before, start small.）
