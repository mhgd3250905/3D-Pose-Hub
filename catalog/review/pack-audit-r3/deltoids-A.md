# deltoids-A 直臂侧平板沉髋（Straight-Arm Side Plank Hip Dip）· 动作包核对 r3

- 类型：`rep_updown`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b1.jpg 第 10 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧8 次，休息 45 秒
- 改后：3 组×每侧8 次，休息 45 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.0 s
- 相位：go 1.2s / hold 0.3s / back 1.2s / rest 0.3s

## 3. 难度
- 改前 v3 1 / ai-tags 3 → 统一 2（直臂侧撑要一点肩和侧腰力量；v3 原 1 偏低、ai-tags 原 3 偏高；退阶跪姿写进注意事项。）

## 4. 指导文字（教练口吻）
- purpose：练肩膀和侧腰，让单手撑地更稳 → 练肩膀和侧腰，一只手撑地也撑得住
- 要点 改前：手撑在肩膀正下方，把地推远；髋慢慢往下沉，再抬回身体成一条直线。；另一只手放在髋上，肩和脚不动。
- 要点 改后：手撑在肩膀正下方，把地推远；屁股慢慢往下沉，再顶回成一条直线。；另一只手叉腰，肩膀和脚不动。
- 常见错误 改前：肩膀往耳朵方向塌；髋抬不回直线
- 常见错误 改后：撑地那边肩膀往耳朵塌；屁股顶不回一条线
- 注意事项 改前：手腕疼或发麻时停下；先活动手腕再做
- 注意事项 改后：手腕疼或发麻就停，做之前先转转手腕；撑不住就下面那条腿跪着做
- 相位口令：髋往下沉 / 到底 / 抬回直线 → 往下沉 / 到底 / 顶回来

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.0 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 把地推远，肩别塌 | Push the floor away | cue1, commonErrors[0] |
| 5 | 顶回一条直线 | Back to a straight line | cue2, commonErrors[1] |
| 7 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 45 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 动作一致：直臂侧撑、一手叉腰；肩部高亮在预览帧里不明显（非极端）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.0 s（沉 1.2 / 顶 1.2，两端短停）
- 新增 sideSwitchSeconds 10（侧撑换边要翻身）
- 难度 v3 1 / ai-tags 3 → 统一 2；退阶跪姿
- 文字改教练口吻

## 8. 待开哥定
- 预览帧肩部高亮不明显，请看视频确认

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 注意事项1：手腕疼或发麻就停，做之前先转转手腕 → 一只手撑全身，手腕疼或发麻就放下来（Stop if your wrists hurt or go numb. Loosen them up first. → One hand holds you up. Come down if that wrist hurts or goes numb.）
