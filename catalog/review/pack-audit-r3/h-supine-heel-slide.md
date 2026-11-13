# h-supine-heel-slide 仰卧脚跟滑（Lying Heel Slide）· 动作包核对 r3

- 类型：`rep_updown`，单侧 each-side-separately，先做 left；V4 预览：`/workspace/work/v4run/b14.jpg 第 7 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧10 次，休息 20 秒
- 改后：2 组×每侧10 次，休息 20 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：8.0 s → 3.5 s
- 相位：go 1.5s / hold 0.5s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：活动髋和膝盖，同时练肚子稳住 → 让胯和膝盖活动开，顺便练肚子把腰稳住
- 要点 改前：脚跟贴着地面慢慢滑远，再滑回来；腰贴住垫子，骨盆不动。；另一只脚踩稳地面。
- 要点 改后：脚后跟贴着地慢慢滑远，再滑回来；腰贴住垫子，胯别动。；另一只脚踩稳地。
- 常见错误 改前：腰拱起来；骨盆跟着歪
- 常见错误 改后：腰拱起来；胯跟着歪
- 注意事项 改前：出现疼痛时减小幅度，仍痛就停止
- 注意事项 改后：疼就滑短点，还疼就停
- 相位口令：脚跟滑出 / 停一下 / 滑回 → 脚跟滑出 / 停一下 / 滑回来

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 腰贴住垫子 | Back stays down | cue2, commonErrors[0] |
| 5 | 胯别歪 | Hips still | commonErrors[1] |
| 8 | 慢慢滑 | Slide slowly | cue1 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 20 秒；allDone → 很好；sideDone → 换右边

## 6. 画面对照
- 一致：仰卧屈膝滑脚跟、膝盖/大腿前淡高亮（b14 第 7 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 8.0 s → 3.5 s（滑出 1.5 / 停 0.5 / 滑回 1.5）；r2「动画 8 秒只做 1 次」与节奏脱钩；顶点 < 0.8 s，kind rep_hold → rep_updown
- 仰卧原地换一条腿，不加换边准备
- purpose 去掉「躯干」类说法；「骨盆」→「胯」；注意事项改短句
- 难度 1/1 不变

## 8. 待开哥定
- r2 flag 沿用：动画高亮在大腿，tags 主练写 core，是否改主练肌群请定（只报告）

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 注意事项1：疼就滑短点，还疼就停 → 膝盖或胯卡着疼就滑短点（If it hurts, don't slide as far. Stop if it still hurts. → If your knee or hip pinches, slide a shorter distance.）
