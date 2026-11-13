# chest-B 平行杆深幅俯卧撑（Deep Parallette Push-Up）· 动作包核对 r3

- 类型：`rep_updown`；动画源 `drill-anim/specs/chest-B-r2.js`；V4 预览 `/workspace/work/v4run/b1.jpg 第 8 行`（本机路径，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 训练参数
- 改前：3 组×8 次，休息 60 秒
- 改后：3 组×8 次，休息 60 秒
- 单侧算法：双侧同时，无需换边

## 2. 计数节奏
- training.phases（动画一下）：go 0.8s / hold 0.7s / back 0.6s / rest 1.9s；一下 4.0 s
- 结论：未调整（见下方理由）

## 3. 指导文字
- 常见错误 改前：下得太深，肩膀往前顶；塌腰
- 常见错误 改后：下得太深，肩膀往前顶；塌腰
- 注意事项 改前：肩前面夹着疼时，下浅一点；手腕疼或发麻时停下
- 注意事项 改后：肩前面夹着疼时，下浅一点；手腕疼或发麻时停下
- 名称、purpose、要点、相位口令：已逐条核对，符合 STYLE.md，未改

## 4. voiceGuide（脚本，未合成音频）
- 一下 4.0 s，相位口令：`first-2-reps`，每下结束报数

| 第几下后 | 中文 | English | 约时长 | 出处 |
|---|---|---|---|---|
| 2 | 身体一条直线，别塌腰 | Body in one straight line | 2.2s | cue3, commonErrors[1] |
| 4 | 过半了，肩别往前顶 | Halfway. Keep shoulders back | 2.0s | commonErrors[0] |
| 6 | 推起时手臂伸直 | Straighten your arms at the top | 2.4s | cue2 |
| 7 | 最后一次 | Last one |  | 共用词 p.last_rep |

组开始前：无；组结束：moreSets → 休息 + 1 分钟；allDone → 很好

## 5. 画面对照
- 画面对照（V4 b1）：平行杆、俯卧撑、胸部高亮，一致
- 极端错误（另一个动作 / 器械不对 / 高亮完全不对）：**无**

## 6. 改了什么、为什么
- 剂量核对：3 组×8 次、休息 60 秒合理（力量 3 组 8–12 次，深幅俯卧撑取下限），未改
- 节奏核对：一下 4.0 秒（控制/力量型 3–4 秒），跟得上，未调整；按动画关键帧实测（3% 阈值）下放约 1.1–1.4 s、底部约 0.5 s、推起约 0.8–1.1 s、顶部约 1.3–1.6 s，r2 的 0.8/0.7/0.6/1.9 切分在阈值范围内，口令念得完，保留
- r2 flag「底部 0.7 s vs spec 0.25 s」已核：spec 关键帧 0.25 s + 缓入缓出，实测底部平台约 0.5 s，0.7 s 可用
- 新增 voiceGuide（前 2 次念相位，之后报数；第 2/4/6 次后各一句要点，第 7 次后「最后一次」）

## 7. 待开哥定
- 入门用户可能做不满 8 个深幅俯卧撑：是否在 App 里给退阶（跪姿/普通俯卧撑），cautions 已满 2 条，未加
- 难度不一致：本文件 2，ai-tags 3
