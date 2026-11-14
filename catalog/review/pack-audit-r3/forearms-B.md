# forearms-B 坐姿哑铃上下卷腕（Seated Full-Range Dumbbell Wrist Curl）· 动作包核对 r3

- 类型：`rep_updown`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/batch-02.jpg 第 7 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧15 次，休息 45 秒
- 改后：3 组×每侧15 次，休息 45 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.5 s
- 相位：go 1.0s / hold 0.3s / back 2.0s / rest 0.2s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：练前臂，让握力和手腕更有力 → 练前臂，让手更有劲、握得更牢
- 要点 改前：前臂平放在大腿上，只动手腕；手腕往上卷，再慢慢往下放到底。；往上约 1 秒，往下约 2 秒。
- 要点 改后：前臂平放在大腿上，只动手腕；手腕往上卷，再慢慢放到最低。；上去一秒，下来两秒。
- 常见错误 改前：甩动借力；前臂跟着抬起来
- 常见错误 改后：甩着哑铃借劲；前臂跟着抬起来
- 注意事项 改前：手腕不舒服时用更轻的哑铃、幅度小一点
- 注意事项 改后：手腕不舒服就换轻点的哑铃，动作做小点
- 相位口令：往上卷 / 停一下 / 慢慢放到底 → 往上卷 / 停一下 / 慢慢放

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 前臂别抬，只动手腕 | Only the wrist moves | cue1, commonErrors[1] |
| 5 | 慢慢放到底 | All the way down, slowly | cue2 |
| 8 | 别甩 | No swinging | commonErrors[0] |
| 11 | 前臂别抬，只动手腕 | Only the wrist moves | cue1, commonErrors[1] |
| 14 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：坐凳、前臂搭大腿、哑铃卷腕、前臂高亮（batch-02 第 7 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s，按 cue 的「上 1 秒、下 2 秒」切相位；r2 flag 的批表值不再适用
- 文字改教练口吻
- 难度 1/1 不变

## 8. 待开哥定
- 无
