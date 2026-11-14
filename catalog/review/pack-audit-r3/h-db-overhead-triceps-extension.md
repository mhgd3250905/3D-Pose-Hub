# h-db-overhead-triceps-extension 单臂哑铃过头臂屈伸（One-Arm Overhead Triceps Extension）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b8.jpg 第 6 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧10 次，休息 45 秒
- 改后：3 组×每侧10 次，休息 45 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：8.0 s → 4.0 s
- 相位：go 1.0s / hold 0.5s / back 2.0s / rest 0.5s

## 3. 难度
- 改前 v3 2 / ai-tags 2 → 统一 2（要肩膀能直直举过头。）

## 4. 指导文字（教练口吻）
- purpose：练手臂后侧，让手臂伸直更有力 → 练大臂后面，让手臂伸直更有劲
- 要点 改前：大臂贴着耳朵不动，只用小臂把哑铃举直；哑铃从头后面向上举到手臂伸直。；慢慢放回头后，在底部停一会儿再举。
- 要点 改后：大臂贴着耳朵不动，只用小臂把哑铃举直；哑铃从头后面往上举，举到手臂伸直。；慢慢放回头后面，在底下停一下再举。
- 常见错误 改前：大臂往前或往外跑；腰往后仰
- 常见错误 改后：大臂往前或往外跑；腰往后仰
- 注意事项 改前：从轻重量开始，出现疼痛就停止；肩前侧夹着疼时，缩小幅度或换简单版本
- 注意事项 改后：先用轻哑铃，哪儿疼就停；肩膀前面夹着疼就往下放浅点，还疼就停
- 相位口令：伸直 / 停一下 / 慢慢放下 → 举直 / 停一下 / 慢慢放

## 5. voiceGuide（脚本，未合成音频）
- 一下 4.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 大臂贴着耳朵 | Arm by your ear | cue1, commonErrors[0] |
| 5 | 腰别往后仰 | Don't arch your back | commonErrors[1] |
| 8 | 慢慢放到头后 | Lower behind your head | cue3 |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 动作一致：站姿单臂过头哑铃臂屈伸；预览帧几乎看不到高亮（b8 第 6 行，非极端）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 8.0 s → 4.0 s（举 1.0 / 顶 0.5 / 放 2.0 / 底 0.5），慢放；顶点 < 0.8 s，kind rep_hold → rep_updown；r2「动画 8 秒只做 1 次」flag 与节奏脱钩，不改动画
- 站着原地换手，不加换边准备
- 「缩小幅度或换简单版本」→「往下放浅点」
- 难度 2/2 不变

## 8. 待开哥定
- 预览帧几乎看不到大臂后面高亮，请看视频确认

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 常见错误2：腰往后仰 → 举直的时候挺肚子、腰往后弯（Arching your lower back. → Pushing your belly out and bending your back as you press up.）
- 注意事项1：先用轻哑铃，哪儿疼就停 → 先用轻哑铃，放到脑后时手肘疼就停（Start with light dumbbells. Stop if anything hurts. → Start light. Stop if your elbow hurts when the weight is behind your head.）
- 注意事项2：肩膀前面夹着疼就往下放浅点，还疼就停 → 肩膀前面夹着疼就往脑后少放一点（If the front of your shoulder pinches, don't lower as far. Stop if it still hurts. → If the front of your shoulder pinches, don't lower as far behind your head.）
- 语音 reminders[1]：腰别往后仰 → 肋骨收住，腰别弯（Don't arch your back → Ribs down, back still）
