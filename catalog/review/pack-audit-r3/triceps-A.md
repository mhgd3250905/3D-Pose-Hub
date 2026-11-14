# triceps-A 窄距俯卧撑（锁肘停顿）（Close-Grip Push-Up with Lockout）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/batch-24.jpg 第 9 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×8 次，休息 60 秒
- 改后：3 组×8 次，休息 60 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 4.3 s
- 相位：go 2.0s / hold 0.3s / back 1.0s / rest 1.0s

## 3. 难度
- 改前 v3 1 / ai-tags 3 → 统一 3（窄距全俯卧撑，入门者常做不满；ai-tags 原 3。退阶写进注意事项。）

## 4. 指导文字（教练口吻）
- purpose：练手臂后侧，推到顶把手肘完全伸直 → 练大臂后面，推到顶把手肘完全伸直
- 要点 改前：手肘贴着身体往后弯，推起后伸直停一下；双手与肩同宽或稍窄。；身体一条直线，把地面推远。
- 要点 改后：手肘贴着身子往后弯，推起后伸直停一下；两手跟肩膀一样宽或稍窄。；身子一条直线，把地面推远。
- 常见错误 改前：手肘往外翻；没伸直就开始下一次
- 常见错误 改后：手肘往外翻；没伸直就下一个
- 注意事项 改前：手腕不舒服时先活动一下手腕；手腕刺痛或发麻时马上停
- 注意事项 改后：开始前先转转手腕，刺疼或发麻马上停；做不满就跪着做
- 相位口令：慢慢下去 / 停 / 推起伸直 → 慢慢下去 / 停 / 推起伸直

## 5. voiceGuide（脚本，未合成音频）
- 一下 4.3 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 手肘贴着身子 | Elbows in | cue1, commonErrors[0] |
| 5 | 推到顶伸直 | Lock out at the top | cue1, commonErrors[1] |
| 7 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 1 分钟；allDone → 很好

## 6. 画面对照
- 一致：窄距俯卧撑、大臂后淡高亮（batch-24 第 9 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 4.3 s（慢下 2.0 / 底 0.3 / 推起 1.0 / 顶上伸直停 1.0），顶上锁肘停放 rest 段不念口令；r2「批表混算」flag 与节奏脱钩
- 难度 v3 1 / ai-tags 3 → 统一 3；退阶「跪着做」写进注意事项
- 「手臂后侧」→「大臂后面」；两条手腕注意事项并成一句

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 注意事项1：开始前先转转手腕，刺疼或发麻马上停 → 手撑窄了手腕更吃劲，疼就把手放宽一点（Roll out your wrists first. Stop right away if they get sharp pain or go numb. → A narrow hand position loads your wrists. If they hurt, move your hands a bit wider.）
