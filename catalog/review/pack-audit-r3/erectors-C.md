# erectors-C 45° 罗马椅背伸（45° Hyperextension）· 动作包核对 r3

- 类型：`rep_updown`；V4 预览：`/workspace/work/v4run/batch-02.jpg 第 5 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×10 次，休息 60 秒
- 改后：3 组×10 次，休息 60 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.5 s
- 相位：go 1.5s / hold 0.3s / back 1.2s / rest 0.5s

## 3. 难度
- 改前 v3 2 / ai-tags 2 → 统一 2

## 4. 指导文字（教练口吻）
- purpose：练下背、臀部和大腿后侧，让你更有力地把身体抬起 → 练下背、屁股和大腿后面，弯腰搬东西更有劲
- 要点 改前：从髋部往下弯，背保持平直；垫子顶在髋骨下面，双手交叉放胸前。；抬到身体成一条直线就停，别再往后仰。
- 要点 改后：从胯往下弯，背挺平别弓；垫子顶在胯骨下面，两手交叉抱在胸前。；起到身体一条直线就停，别再往后仰。
- 常见错误 改前：甩起来，腰往后折；弓着背快速往下放
- 常见错误 改后：甩上来，腰往后折；弓着背快速往下掉
- 注意事项 改前：腰不舒服时弯得浅一点，还疼就停
- 注意事项 改后：腰不舒服就弯浅点，还疼就停
- 相位口令：往下弯 / 到底 / 起到直线 → 往下弯 / 到底 / 起到直线

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 背挺平，别弓 | Flat back | cue1, commonErrors[1] |
| 5 | 到直线就停，别后仰 | Stop when straight | cue3, commonErrors[0] |
| 8 | 慢慢往下 | Lower slowly | commonErrors[1] |
| 9 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 1 分钟；allDone → 很好

## 6. 画面对照
- 一致：45° 罗马椅背伸、腰背高亮（batch-02 第 5 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s（往下 1.5 / 底 0.3 / 起 1.2 / 顶 0.5），r2 flag 的相位顺序（先下后起）按真实做法保留
- 「背保持平直」→「背挺平别弓」，「髋部」→「胯」
- 难度 2/2 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 注意事项1：腰不舒服就弯浅点，还疼就停 → 腰发紧就往下弯一半就起来，还疼就停（If your lower back feels off, don't go as low. Stop if it still hurts. → If your lower back tightens, only go halfway down. Stop if it still hurts.）
- 语音 reminders[0]：背挺平，别弓 → 从胯往下弯，背别弓（Flat back → Bend at the hips, back flat）
