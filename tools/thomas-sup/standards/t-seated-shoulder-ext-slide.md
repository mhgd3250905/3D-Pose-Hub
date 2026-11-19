# 后撑肩伸展滑行（t-seated-shoulder-ext-slide）动作标准 · 托马斯补充 r2

机器可读版：`tools/thomas-sup/standards/t-seated-shoulder-ext-slide.json`（`precision.py` 逐条量 V5 身体）。本文件是给人看的同一份标准。
对应托马斯制作说明 PDF 第 5 项垫上版（13 前侧支撑；肩后伸位下的三角肌、胸大肌、肱二头肌；3 组 × 6–8 次滑行，休 60–90 秒；机位正侧面看肩后伸角度）。

## 阶段（8 s 循环 = 1 下）
| 阶段 | 时间窗（s） | 要求 |
|---|---|---|
| start 起始 | 0–0.3、6.2–8.0 | 坐姿屈膝脚踩垫，手在臀后撑地、指尖朝后，手臂伸直 |
| 前滑 | 0.3–2.5 | 手掌不动，臀部慢慢往前滑，肩被带进后伸 |
| hold 末端 | 2.6–3.9（2.5–4.0 停住） | 到肩前侧拉紧处主动撑住：手压地、肩下沉、胸口挺起 |
| 滑回 | 4.0–6.2 | 手推地，臀部慢慢滑回 |

## 数值范围（要点）
- 手肘全程锁直 ≥ 172°。
- 肩后伸角（上臂相对胸廓，矢状面）：起始 25–45°；末端 50–65°（成人常模 AAOS 60°、AMA ≥ 50°、Boone & Azen 62°），比起始多 ≥ 20°。
- 末端保持（在最大值 1° 内）1.2–2.5 s；肩后伸 10%→90% 至少 1.2 s（不弹不冲）；每 8 s 1 下。
- 主动肩：肩关节相对胸廓下沉 ≥ 5 mm（全程），上下变化 ≤ 5 mm（不耸）；胸口挺起：胸廓相对骨盆不弓背（屈曲 ≤ 0°）。
- 头：下巴微收（头相对胸廓前屈 10–25°），视线高于水平 ≤ 20°、低于水平 ≤ 10°（不仰头看天花板，也不低头）。
- 手掌、脚不滑 ≤ 5 mm；手、脚不穿垫（≥ −2 mm）；臀/大腿后侧坐在垫上（最低点 −2…+4 mm）。

## 常见错误（制作时逐条对照）
- 肩完全放松「挂」在韧带上（PDF；Beyond Movement German hang「Sagging into the position passively」；Calixpert German hang「keeping your shoulders active, not just hanging passively on the ligaments」）。
- 动作太快、一下一下往前冲（PDF；Beyond Movement「Stop at tension - this joint does not respond to force」；kovofitness「Avoid bouncing or forcing the range」）。
- 耸肩或腰往前拱来凑幅度（Beyond Movement：「the compensations for it - shrugging or arching the lower back」）。
- 头后仰 / 往前探（calistree German hang「Maintain a neutral head position」；r1 的问题：视线高于水平 21–36°）。
- 肩前侧刺痛还继续（PDF）。

## 依据
- 托马斯动作库补充制作说明 PDF，第 5 项垫上版（步骤、常见错误、剂量、机位）。
- Beyond Movement, Shoulder Extension：坐姿手在身后、指尖朝后，手掌不动臀部慢慢前滑，到拉紧处停；「Chest stays lifted, shoulders down」；代偿是耸肩和腰拱。https://beyondmovement.com.au/skills/shoulder-extension
- Norkin & White, Measurement of Joint Motion（常模表 A.1）：肩后伸 AAOS 60°、AMA ≥ 50°、Boone & Azen 62°。https://fadavispt.mhmedical.com/content.aspx?bookid=3621&sectionid=303386712
- Simple Calisthenics, Seated German Hang：手在髋后、指尖朝后、手臂锁直、肩胛后缩下沉。https://www.simple-calisthenics.com/exercises/germanHangStretches
- 参考示范（只用于理解动作）：https://www.gymnasticbodies.com/exercises/german-hang

## 制作参数（r2）
- 头：hub 骨架头颈与胸廓刚性相连，躯干后仰时脸朝天花板。V5 新增按动作开启的 `spec.v5.headFlexDeg`（本动作 18°，头骨绕自身枢轴前屈，头枢轴及其他骨骼位置不变；默认 0 不进入代码路径）。老动作验证：h-seated-reachback 帧 0/60/120 用 main 94ff057 的 v5-hub.js 与本分支的 v5-hub.js 各量一遍，V5 全部关节位置、世界四元数、各部位最低点、关节角逐项相同。
- 肩：`shoulders.shift` [0, −8, −6] mm（下沉 + 微后缩），V5 用 `v5.scapulaShift` 画出。
- 手改 fingertips 模式贴在 6 mm 垫面（r1 floor 模式压进垫 4.8 mm），脚抬垫厚；滑行 0.20 m（r1 0.21，末端肩后伸 65.2°→63.2°）。
- 坐垫：躯干后仰时臀部最低点离垫最多 9 mm（r1 也如此），`seat` 轨道逐帧（每 2 帧一键）把骨盆压回，臀 2–3 mm、大腿后侧贴垫。
- 求解提示「手腕已限制在原始手臂能够到达的位置」每帧都有（r1 无）：来自 shoulders.shift（同加推 r2，hub 手腕点不跟随肩胛平移）；V5 手骨不动（漂移 0）。
- 参考比对（MediaPipe）：未做（示范页无可轻量获取的单张垫上版示范图）。

## r1 → r2 数值对比（同一套 V5 测量；r1 用 r2 的阶段窗口量）
| 检查 | 标准 | r1 | r2 |
|---|---|---|---|
| 全程锁肘（两肘最小角） | ≥ 172 ° | 178.0 | 178.0 |
| 起始：肩后伸角（两侧较小者） | 25 … 45 ° | 36.3 | 35.2 |
| 末端：肩后伸角（保持段最小） | 50 … 65 ° | 65.2 ✗ | 63.2 |
| 末端：肩后伸角（保持段最大，不超过常模上限） | 50 … 65 ° | 65.2 ✗ | 63.2 |
| 滑出带来的肩后伸增加（末端−起始） | ≥ 20 ° | 28.9 | 28.0 |
| 末端保持（肩后伸在最大值 1° 内） | 1.2 … 2.5 s | 2.0 | 2.01 |
| 不弹不甩：肩后伸 10%→90% 最短用时 | ≥ 1.2 s | 1.46 | 1.34 |
| 每 8 s 循环次数 | 1 … 1 次 | 1 | 1 |
| 肩不耸：肩关节相对胸廓（最高处，负 = 下沉） | ≤ -5 mm | 0.0 ✗ | -8.0 |
| 肩不耸：肩关节相对胸廓上下变化 | ≤ 5 mm | 0.0 | 0.0 |
| 胸口挺起：胸廓相对骨盆不弓背（最大屈曲） | ≤ 0 ° | -6.0 | -6.0 |
| 头：下巴微收（头相对胸廓前屈，最小） | 10 … 25 ° | 0.0 ✗ | 18.0 |
| 头不后仰：视线高于水平（最大） | ≥ -20 ° | -35.6 ✗ | -14.8 |
| 头不低：视线低于水平（最大） | ≤ 10 ° | -20.8 | 1.1 |
| 手掌（V5 手骨）、脚不滑动（最大漂移） | ≤ 5 mm | 0 | 0 |
| 手不穿垫（手最低点） | ≥ -2 mm | -4.8 ✗ | -0.8 |
| 脚不穿垫（脚最低点） | ≥ -2 mm | -6 ✗ | 0 |
| 臀/大腿后侧坐在垫上（最低点，最低） | ≥ -2 mm | 1.3 | -0.6 |
| 臀/大腿后侧坐在垫上（最低点，最高 = 不悬空） | ≤ 4 mm | 7.6 ✗ | 3.4 |
| V5 身体与求解姿态一致（最大关节偏差） | ≤ 2 mm | 0 | 0 |
