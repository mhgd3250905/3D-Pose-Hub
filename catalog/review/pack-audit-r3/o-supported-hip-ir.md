# o-supported-hip-ir 扶椅小腿向外摆（Chair-Supported Outward Shin Swing）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b20.jpg 第 9 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：1 组×每侧6 次，休息 30 秒
- 改后：2 组×每侧8 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：8.0 s → 3.5 s
- 相位：go 1.0s / hold 1.0s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：不加重量，练髋部向内转的控制 → 不加重量，练胯往里转的劲
- 要点 改前：大腿和膝盖不动，小腿慢慢向外摆；站直，骨盆朝前，一只手轻扶椅子。；在舒服的范围内摆，别硬扭膝盖和脚踝。
- 要点 改后：大腿和膝盖不动，小腿慢慢往外摆；站直，胯朝前，一只手轻扶椅子。；在舒服的范围里摆，别硬扭膝盖和脚踝。
- 常见错误 改前：骨盆跟着转；硬扭膝盖或脚踝
- 常见错误 改后：胯跟着转；硬扭膝盖或脚踝
- 注意事项 改前：刚开始时每侧先做 1 组 4–6 次，疼就停
- 注意事项 改后：入门先做 1 组、每侧 4–6 次，熟了再做满 2 组 8 次；疼就停
- 相位口令：小腿外摆 / 停住 / 慢慢回来 → 小腿外摆 / 停住 / 慢慢回来

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 胯朝前别转 | Hips forward | cue2, commonErrors[0] |
| 5 | 别硬扭膝盖 | Easy on that knee | cue3, commonErrors[1] |
| 7 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：扶椅单腿站、抬起的腿小腿往外摆、屁股侧面高亮（b20 第 9 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 8.0 s → 3.5 s（摆 1.0 / 停 1.0 / 回 1.5）
- 站着原地换边，不加换边准备
- purpose 去掉「控制」；「髋部」「骨盆」→「胯」
- 难度 1/1 不变
- 剂量 1 组 → 2 组×每侧 8 次（开哥 2026-11-14 同意）；入门少做写进注意事项；voiceGuide 提醒按 8 次重排

## 8. 待开哥定
- r2 flag 沿用：tags.activeMuscles 为 glutes+abductors（只是胯部大致区域），请定

## r3 第二遍（2026-11-14）

- 剂量（开哥 2026-11-14 同意）：1 组×每侧6 次，休息 30 秒 → 2 组×每侧8 次，休息 30 秒；入门少做写进注意事项 1；voiceGuide 提醒改为第 2、5 下后，第 7 下后念「最后一次」
- 注意事项1：刚开始每侧先做 1 组 4–6 次，疼就停 → 入门先做 1 组、每侧 4–6 次，熟了再做满 2 组 8 次；疼就停（When starting out, do one easy set of 4–6 per side. Stop if it hurts. → Beginners: one set of 4–6 per side, building to 2 sets of 8. Stop if it hurts.）
