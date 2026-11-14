# w-fire-hydrant 四足消防栓（Quadruped Fire Hydrant）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：待 V4 补看
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧12 次，休息 30 秒
- 改后：3 组×每侧12 次，休息 30 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.5 s
- 相位：go 1.0s / hold 1.0s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：练臀部外侧，让髋更稳 → 练屁股侧面，让胯更稳
- 要点 改前：膝盖保持弯曲，腿往侧面抬起；跪撑，手在肩膀下面，膝盖在髋下面。；身体不动，停一下再慢慢放下。
- 要点 改后：膝盖一直弯着，腿往旁边抬起来；跪撑，手在肩膀下面，膝盖在胯下面。；身子别动，停一下再慢慢放下。
- 常见错误 改前：身体往另一边歪；塌腰
- 常见错误 改后：身子往另一边歪；塌腰
- 注意事项 改前：髋疼时抬低一点，还疼就停
- 注意事项 改后：胯疼就抬低点，还疼就停
- 相位口令：往侧面抬 / 停住 / 慢慢放下 → 往旁边抬 / 停住 / 慢慢放

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 身子别歪 | Body still | cue3, commonErrors[0] |
| 5 | 腰别塌 | Don't sag | commonErrors[1] |
| 8 | 慢慢放下 | Lower slowly | cue3 |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 30 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 待 V4 补看（batch-25 预览未出）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s（抬 1.0 / 停 1.0 / 放 1.5）
- 跪撑原地换腿，不加换边准备
- 「臀部外侧」→「屁股侧面」，「髋」→「胯」
- 难度 1/1 不变

## 8. 待开哥定
- V4 预览没有这一批（batch-25），画面待补看

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 注意事项1：胯疼就抬低点，还疼就停 → 胯外面卡着疼就抬低点，膝盖下面垫软（If your hip hurts, don't lift as high. Stop if it still hurts. → If the side of your hip pinches, lift lower and pad your knees.）
