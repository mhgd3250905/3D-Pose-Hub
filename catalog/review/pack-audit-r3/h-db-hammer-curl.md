# h-db-hammer-curl 站姿双哑铃锤式弯举（Standing Dumbbell Hammer Curl）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/b8.jpg 第 2 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×12 次，休息 30 秒
- 改后：3 组×12 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：8.0 s → 3.0 s
- 相位：go 1.0s / hold 0.5s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：练手臂前侧和小臂 → 练大臂前面和小臂
- 要点 改前：掌心一直相对，大臂不动只弯手肘；身体站直，别前后晃。
- 要点 改后：两手心一直对着，大臂不动只弯手肘；人站直，别前后晃。；放下来慢一点，数两秒。
- 常见错误 改前：身体晃动把哑铃甩起来；手肘往前跑
- 常见错误 改后：身子晃着把哑铃甩起来；手肘往前跑
- 注意事项 改前：用轻重量，先做 1 组轻松的 6 次
- 注意事项 改后：用轻哑铃，先做 1 组轻松的 6 次
- 相位口令：弯起 / 停一下 / 慢慢放下 → 弯起来 / 停一下 / 慢慢放

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 手肘贴着别往前 | Elbows stay put | cue1, commonErrors[1] |
| 5 | 别晃，别甩 | No swinging | cue2, commonErrors[0] |
| 8 | 放下来数两秒 | Lower for two | cue3 |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好

## 6. 画面对照
- 一致：站姿双哑铃锤式弯举、大臂前/小臂高亮（b8 第 2 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 8.0 s → 3.0 s（弯 1.0 / 停 0.5 / 放 1.5）；顶点 < 0.8 s，kind rep_hold → rep_updown；r2「动画 8 秒只做 1 下」flag 与节奏脱钩，不改动画
- 补 cue3「放下来慢一点，数两秒」
- 难度 1/1 不变

## 8. 待开哥定
- 无
