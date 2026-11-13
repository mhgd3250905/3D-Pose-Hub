# h-db-reverse-curl 站姿哑铃反握弯举（Standing Dumbbell Reverse Curl）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/b8.jpg 第 9 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×10 次，休息 45 秒
- 改后：3 组×10 次，休息 45 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.0 s
- 相位：go 1.0s / hold 0.5s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：练前臂和上臂前侧，让握力和手腕更稳 → 练小臂和大臂前面，手腕和握力更稳
- 要点 改前：手背朝前握哑铃，手肘贴身往上弯；手腕保持平直，不要往下折。；举到胸口高度停一下。
- 要点 改后：手背朝前握哑铃，手肘贴身往上弯；手腕立直，别往下折。；弯到胸口高停一下。
- 常见错误 改前：手腕弯折；身体前后晃借力
- 常见错误 改后：手腕往下折；身子前后晃借劲
- 注意事项 改前：手腕或手肘疼时停止，先用轻哑铃
- 注意事项 改后：先用轻哑铃，手腕或手肘疼就停
- 相位口令：举起 / 停住 / 慢慢放下 → 弯起来 / 停一下 / 慢慢放

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 手腕立直 | Wrists straight | cue2, commonErrors[0] |
| 5 | 身子别晃 | Body still | commonErrors[1] |
| 8 | 手肘贴住身体 | Elbows at your sides | cue1 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好

## 6. 画面对照
- 一致：站姿反握弯举、小臂高亮（b8 第 9 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.0 s（弯 1.0 / 停 0.5 / 放 1.5）；顶点 < 0.8 s，kind rep_hold → rep_updown
- 文字改教练口吻
- 难度 1/1 不变

## 8. 待开哥定
- 无
