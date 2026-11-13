# h-towel-pass 毛巾过头转肩（Towel Shoulder Pass-Through）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/b15.jpg 第 4 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×8 次，休息 20 秒
- 改后：2 组×8 次，休息 20 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：8.0 s → 4.5 s
- 相位：go 2.0s / hold 0.5s / back 2.0s

## 3. 难度
- 改前 v3 1 / ai-tags 2 → 统一 1（握宽一点谁都能做；ai-tags 原 2。）

## 4. 指导文字（教练口吻）
- purpose：打开肩膀前侧和胸口，让手臂举过头更顺 → 打开肩膀前面和胸口，手臂举过头更顺
- 要点 改前：手臂伸直，毛巾画大圈举过头再往后；两手握宽拉紧毛巾，肋骨往下收。；手肘弯了就把两手再分开些。
- 要点 改后：手臂伸直，毛巾画个大圈举过头再往后；两手握宽拉紧毛巾，肋骨往下收。；手肘一弯就把两手再分开点。
- 常见错误 改前：弯肘硬转；腰往前拱
- 常见错误 改后：弯手肘硬转；腰往前挺
- 注意事项 改前：肩膀疼时减小幅度，仍痛就停止
- 注意事项 改后：肩膀疼就转小点，还疼就停
- 相位口令：向上画弧 / 停一下 / 原路返回 → 往上画弧 / 停一下 / 原路回来

## 5. voiceGuide（脚本，未合成音频）
- 一下 4.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 手肘别弯 | Arms straight | cue1, commonErrors[0] |
| 5 | 肋骨往下收 | Ribs down | cue2, commonErrors[1] |
| 7 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 20 秒；allDone → 很好

## 6. 画面对照
- 一致：两手握毛巾举过头、肩/胸高亮（b15 第 4 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 8.0 s → 4.5 s（画弧 2.0 / 停 0.5 / 回 2.0）；r2「派生 vs 关键帧」flag 与节奏脱钩；顶点 < 0.8 s，kind rep_hold → rep_updown
- 难度 v3 1 / ai-tags 2 → 统一 1
- 「腰往前拱」→「腰往前挺」；「减小幅度」→「转小点」

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 常见错误2：腰往前挺 → 毛巾往后过头时肋骨往前顶（Arching your lower back. → Ribs popping forward as the towel goes overhead.）
- 注意事项1：肩膀疼就转小点，还疼就停 → 过不去就把毛巾握宽，别硬掰肩膀（If your shoulders hurt, don't go as far. Stop if it still hurts. → If you can't get it over, widen your grip. Don't force your shoulders.）
