# n-seated-knee-lift 坐姿抬膝悬停（Seated Knee Lift Hover）· 动作包核对 r3

- 类型：`rep_alternate`，单侧 alternate，先做 right；V4 预览：`/workspace/work/v4run/b18.jpg 第 3 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧8 次，休息 30 秒
- 改后：2 组×每侧8 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s/侧（一左一右 8.0 s） → 3.0 s/侧（一左一右 6.0 s）
- 相位：go 0.8s / hold 1.5s / back 0.7s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：坐在椅子上练抬腿的力量 → 坐在椅子上练抬腿的劲
- 要点 改前：身体不往后仰，大腿抬离座面几厘米；坐直，膝盖90度，双脚踩地。；停住一会儿再放下，换另一侧。；两边各做一次算 1 次。
- 要点 改后：身子别往后仰，大腿抬离椅面几厘米；坐直，膝盖 90 度，两脚踩地。；停一会儿再放下，换另一边。；两边各做一次算 1 下。
- 常见错误 改前：身体往后仰去抬腿
- 常见错误 改后：身子往后仰去抬腿
- 注意事项 改前：髋部前面疼时抬低一点，还疼就停
- 注意事项 改后：胯前面疼就抬低点，还疼就停
- 相位口令：抬膝 / 停住 / 放下 → 抬膝 / 停住 / 放下

## 5. voiceGuide（脚本，未合成音频）
- 一下 6.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 身子别往后仰 | Don't lean back | cue1, commonErrors[0] |
| 5 | 坐直 | Sit tall | cue2 |
| 7 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好

## 6. 画面对照
- 一致：坐椅抬膝、大腿前/胯前高亮（b18 第 3 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一侧一下 4.0 s → 3.0 s（抬 0.8 / 悬停 1.5 / 放 0.7），一左一右 6 s 计 1 下
- 「座面」→「椅面」；「髋部前面」→「胯前面」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点4：两边各做一次算 1 下。 → 左腿抬一次、右腿抬一次，合起来记 1 下。（One on each side counts as one. → One lift with each leg makes one.）
- 常见错误1：身子往后仰去抬腿 → 上身往后靠椅背，借着倒腿才抬起来（Leaning back to lift your leg. → Leaning back into the chair to get the leg up.）
- 注意事项1：胯前面疼就抬低点，还疼就停 → 胯前面抽筋就放下歇一下（If the front of your hip hurts, don't lift as high. Stop if it still hurts. → If the front of your hip cramps, put it down and rest.）
- 语音 reminders[0]：身子别往后仰 → 坐直，上身别后靠（Don't lean back → Sit tall, no leaning）
