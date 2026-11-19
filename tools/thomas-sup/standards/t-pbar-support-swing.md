# 双杠支撑摆动（t-pbar-support-swing）动作标准 · 托马斯补充 r2

机器可读版：`tools/thomas-sup/standards/t-pbar-support-swing.json`（`precision.py` 逐条量 V5 身体）。本文件是给人看的同一份标准。
对应托马斯制作说明 PDF 第 11 项（9 后侧支撑 / 13 前侧支撑；肱三头肌、肩部稳定肌群；3 组 × 10–20 次，一来一回 1 次；机位正侧面）。

## 阶段（8 s 循环 = 2 次，每次 4 s：前摆 2 s、后摆 2 s，正弦）
| 阶段 | 时间窗（s） | 要求 |
|---|---|---|
| front 前摆最高 | 0.7–1.3、4.7–5.3 | 脚在前，身体仍是一根直线（不折髋），肩在手正上方 |
| back 后摆最高 | 2.7–3.3、6.7–7.3 | 脚在后，不塌腰，前后同高 |

## 数值范围（要点）
- 手肘全程 ≥ 172°；膝 ≥ 170°；两踝间距 ≤ 20 cm（并腿）。
- 摆幅（胸廓→踝与竖直）：前 15–35°、后 −35…−15°；脚尖最高点不超过杠面（1150 mm）。
- 身体一根棍：胸廓–髋–踝 ≥ 170°；微空心 0–8°（胸廓相对骨盆屈曲，不塌腰）。
- 肩下沉：肩关节相对胸廓 ≤ −10 mm，全程上下变化 ≤ 3 mm（不耸）。
- 以肩为轴：肩相对手前后移动 ≤ 3 cm，偏离手正上方 ≤ 5 cm。
- 头中立 ≤ 15°；身体不穿杠（≥ 0 mm）；手不滑（≤ 5 mm）；每 8 s 2 次。

## 常见错误（制作时逐条对照）
- 屈肘或耸肩（PDF；Leverage 支撑摆动「Arms locked straight」「Shoulders pushed down, away from the ears」）。
- 塌腰甩腿：前摆折髋、后摆塌腰（PDF；drillsandskills「Do not pike in the forward swing, and do not arch in the rearward swing」）。
- 幅度过大失控（PDF）。
- r1 的问题：每一帧都有求解器警告「左/右脚踝已按真实腿长限制」——沿用 lats-C 的脚踝目标离髋 0.8269 m，比 armfix 直腿最大长度 0.8265 m 长 0.4 mm，每帧都被截；肩胛没有下沉（肩相对胸廓 0 mm）；摆动中心偏前 2.2°（前 +26° / 后 −22°）。

## 依据
- 托马斯动作库补充制作说明 PDF，第 11 项（步骤、常见错误、剂量、机位）。
- drillsandskills（Roger Harrell）, The Swing - 1：支撑摆动从肩到脚尖保持直线，前摆不折髋、后摆不塌腰；目标不是脚有多高，而是整个身体作为一个整体摆。https://www.drillsandskills.com/article/20
- Leverage, Dips（support hold 段）：支撑时手臂伸直、肩下沉、胸挺、并腿微空心不晃；纯支撑时肩全程下沉。https://leverage.fit/skills/parallel-bar-support-swing/（该地址现重定向到 Dips 页；支撑摆动要点「Arms locked」「Shoulders pushed down」「straight body or slight hollow」「same height in front and behind」「Hands that stay where you put them」来自搜索摘要）
- flashmavi, Parallel Bars – Support Swing：肘膝踝伸直、肩下压、肩相对不动、不塌髋。https://www.flashmavi.com/learn/parallel-bars-support-swing
- 参考示范（只用于理解动作）：https://www.youtube.com/watch?v=qm2EfUTZlfE

## 制作参数（r2）
- 脚踝目标沿 lats-C 原方向缩到 178° 膝的腿长（`reach(178)`），腿不再被截：**脚踝警告 60/60 帧 → 0**。
- `shoulders.shift` [0, −15, 0] mm（肩胛下沉），V5 用 `v5.scapulaShift` 画出；随之 hub 报「手腕已限制在原始手臂能够到达的位置」（每帧，同 t-pushup-plus / t-planche-lean r2）：hub 的度量手腕点不随 shoulders.shift 移动（高 15 mm），V5 实际画的手骨与 r1 完全同一位置（漂移 0、离地高度同 r1）。若要求零警告，只能去掉肩胛下沉，二者不可兼得——需开哥定。
- 微空心：腰 +4°；摆动中心校正：髋俯仰基准 +2.2°（前 +23.1° / 后 −24.9°）。
- 参考比对（MediaPipe）：未做（示范是 YouTube 视频，拿不到轻量单张示范图）。

## 需开哥/教练判断
- 体操进阶摆动里，教练会让肩在最低点放松/微耸、两端再压下（drillsandskills「Through the bottom of the swing shrug your shoulders; then extend them at the top」，用于摆幅接近水平之后）。本动作按 PDF「肩不耸」做成全程下沉的基础版。
- PDF「幅度从小到大」：本循环每次同幅（±23–25°），由小到大建议放在语音/文案里讲。

## r1 → r2 数值对比（同一套 V5 测量；r1 用 r2 的阶段窗口量）
| 检查 | 标准 | r1 | r2 |
|---|---|---|---|
| 全程锁肘（两肘最小角） | ≥ 172 ° | 178.5 | 178.5 |
| 腿伸直（两膝最小角） | ≥ 170 ° | 179.94 | 176.8 |
| 前摆幅度（胸廓→踝与竖直夹角，最大） | 15 … 35 ° | 26.0 | 23.1 |
| 后摆幅度（最小，负 = 脚在后） | -35 … -15 ° | -21.7 | -24.9 |
| 前后摆脚都不超过杠面（脚尖最高点，杠面 1150 mm） | ≤ 1150 mm | 573.5 | 554.8 |
| 身体直：胸廓–髋–踝夹角（最小，不折髋不塌腰） | ≥ 170 ° | 178.2 | 175.7 |
| 微空心不塌腰：胸廓相对骨盆屈曲 | 0 … 8 ° | 0.0 | 4.0 |
| 微空心不塌腰：胸廓相对骨盆屈曲（最大） | 0 … 8 ° | 0.0 | 4.0 |
| 肩下沉：肩关节相对胸廓（最高处） | ≤ -10 mm | 0.0 ✗ | -15.0 |
| 肩不耸：肩关节相对胸廓上下变化 | ≤ 3 mm | 0.0 | 0.0 |
| 以肩为轴：肩相对手前后移动 | ≤ 3 cm | 0.0 | 1.21 |
| 以肩为轴：肩在手正上方（最大偏离） | -5 … 5 cm | 1.25 | 1.71 |
| 两腿并拢（两踝间距最大） | ≤ 20 cm | 11.1 | 11.1 |
| 头中立（头与胸廓夹角） | ≤ 15 ° | 0.0 | 0.0 |
| 身体不穿杠（身体与杠最近距离） | ≥ 0 mm | 77.5 | 80.2 |
| 每 8 s 前后摆次数（每次 4 s） | 2 … 2 次 | 2 | 2 |
| 手在杠上不滑（V5 手骨漂移） | ≤ 5 mm | 0 | 0 |
| V5 身体与求解姿态一致（最大关节偏差） | ≤ 2 mm | 0 | 0 |
| 求解器警告帧（stride 4 / 2 采样） | — | 60/60（脚踝被截） | 120/120（手腕度量点，见上；脚踝 0） |
