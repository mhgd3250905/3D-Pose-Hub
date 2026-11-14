# h-band-hip-ir 坐姿弹力带脚向外摆（Seated Band Foot Swing-Out）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b4.jpg 第 1 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧12 次，休息 30 秒
- 改后：3 组×每侧12 次，休息 30 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.0 s
- 相位：go 1.0s / hold 0.8s / back 1.2s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：练髋部往里转的力量和控制 → 练胯往里转的劲
- 要点 改前：膝盖不动，脚往外侧摆开；坐直，大腿贴住椅面，双手放在大腿上。；外面停一下，再慢慢收回。
- 要点 改后：膝盖不动，脚往外摆；坐直，大腿贴住椅面，两手放在大腿上。；摆到外面停一下，再慢慢收回来。；一边做完，带子换到另一条腿。
- 常见错误 改前：膝盖跟着往里或往外跑；身体往一侧倒来帮忙
- 常见错误 改后：膝盖跟着往里或往外跑；身子往一边倒帮忙
- 注意事项 改前：固定点不牢时先别开始；髋或膝不舒服时摆小一点
- 注意事项 改后：带子拴不牢先别开始；胯或膝盖不舒服就摆小点
- 相位口令：往外摆 / 停一下 / 收回 → 往外摆 / 停一下 / 收回

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 膝盖别跑 | Knee stays still | cue1, commonErrors[0] |
| 5 | 身子别歪 | Sit tall | commonErrors[1] |
| 8 | 慢慢收回来 | Bring it back slowly | cue3 |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：坐椅、弹力带绑小腿、脚往外摆、髋外侧/臀高亮（b4 第 1 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.0 s
- 新增 sideSwitchSeconds 10（带子换腿）与换边要点
- 文字改教练口吻
- 难度 1/1 不变

## 8. 待开哥定
- r2 flag 沿用：tags.activeMuscles 写 abductors+glutes，动作实为大腿往里转，是否调整

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 注意事项1：带子拴不牢先别开始 → 带子绑在椅子腿或桌腿上，先拽一下确认不会滑（Don't start until the band is anchored securely. → Tie the band to a chair or table leg and tug it so it won't slip.）
- 语音 reminders[2]：慢慢收回来 → 小腿慢慢摆回来（Bring it back slowly → Shin back in slowly）
