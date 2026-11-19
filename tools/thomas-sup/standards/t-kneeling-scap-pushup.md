# 跪姿肩胛俯卧撑（t-kneeling-scap-pushup）动作标准 · 托马斯补充 r2

机器可读版：`tools/thomas-sup/standards/t-kneeling-scap-pushup.json`（`precision.py` 逐条量 V5 身体）。本文件是给人看的同一份标准。
对应托马斯制作说明 PDF 第 1 项的初级版（10 第一侧移重 / 14 第二侧移重；前锯肌为主；3 组 × 10–12 次，顶端停 1 秒；机位正侧面＋斜后上方）。

## 阶段（8 s 循环 = 2 下，每下 4 s，同 t-pushup-plus）
| 阶段 | 时间窗（s） | 要求 |
|---|---|---|
| top 顶端 | 0–1.0、4.0–5.0 | 肩胛最大前伸（把地面推开、上背微拱），停 1 s |
| 下沉 | 1.0–2.3、5.0–6.3 | 手肘锁直不动，只让胸口向地面沉（肩胛向中间夹） |
| bottom 底端 | 2.3–2.5、6.3–6.5 | 肩胛最大后缩，手肘仍锁直 |
| 推起 | 2.5–4.0、6.5–8.0 | 推地把胸口顶回最高点 |

## 数值范围（要点）
- 手肘全程锁直 ≥ 172°。
- 胸廓上下行程 30–50 mm（约一拳高，Fitwill「often no more than the height of a fist」）；肩关节相对胸廓前后平移 30–50 mm，顶端比底端靠前 ≥ 30 mm。
- 不靠腰背弯曲代替：胸廓相对骨盆屈伸变化 ≤ 4°；不耸肩：肩关节相对胸廓上下 ≤ 10 mm。
- 膝–髋–肩一条线：髋偏离 胸廓–膝 连线 −15…+15 mm（不塌腰、不往后坐/撅臀）。
- 手在肩正下方：肩相对手腕前后 −5…+6 cm。头中立（与胸廓夹角 ≤ 15°）。
- 膝跪稳：膝漂移 ≤ 5 mm，大腿/小腿最低点离垫面 −2…+3 mm；脚、手不穿垫（≥ −2 mm）；手掌、脚尖不滑（≤ 5 mm）、手掌不翻转（≤ 3°）。
- 顶端停留 0.9–1.8 s；每 8 s 恰好 2 下。

## 常见错误（制作时逐条对照）
- 屈肘，变成跪姿俯卧撑（PDF；Calixpert「Bending the elbows during the movement」）。
- 耸肩、头往前探（PDF；ahumanweb「shoulders away from your ears」）。
- 塌腰 / 收肩胛时腰往下拱（PDF；Calixpert「Arching the lower back on retraction」）。
- 髋往脚跟方向坐，变成腰在动不是肩胛在动（Fitwill「If your hips drift back toward your heels or your lower back sags…」）。
- 顶端没推到位（Calixpert「Not reaching full protraction at the top」）。
- r1 的问题：用腰部屈伸 ±9° 假装肩胛动，肩关节相对胸廓不动，胸口不升降，髋偏离膝–肩线 −30…+22 mm；手在肩前 12.6 cm；脚尖穿垫 6 mm。

## 依据
- 托马斯动作库补充制作说明 PDF，第 1 项（「初级版：膝盖着地做同样的肩胛下沉-推开」，常见错误、剂量、机位）。
- Calixpert（Malin Jansson）, Knee Scapula Push Up：膝–头一条线、肘全程锁直、收肩胛胸口下沉、推到上背微拱、顶端停 1 s、每下 3–4 s；常见错误。https://www.calixpert.com/exercises/knee-scapula-push-ups
- Fitwill, Kneeling Scapular Push Up：躯干从膝到头是一座硬桥，只有上背升降；幅度约一拳。https://fitwill.app/exercise/9760/kneeling-scapular-push-up
- ahumanweb, Scapular Push-Ups（引 Human Kinetics push-up with plus、NISMAT）：头到膝一条线、顶端停 1–2 s、肩远离耳朵。https://www.ahumanweb.com/training/how-to-do-scapular-push-ups
- Physiopedia, Push Up Plus Exercise（完整版要点相同）。https://www.physio-pedia.com/Push_Up_Plus_Exercise
- 参考示范（只用于理解动作）：https://www.youtube.com/watch?v=l8Vn171vLEU

## 制作参数（r2）
- 肩胛平移用 `shoulders.shift` 沿胸廓前方 ±20 mm，V5 通过 `spec.v5.scapulaShift = true` 画出（同 t-pushup-plus）。脊柱不弯；求解器（px、py、髋俯仰）保持两臂 178°、两膝钉在垫上，身体绕膝转动升降。
- 手比 r1 往膝方向挪 12 cm（x = 0.08），肩落在手腕正上方；膝关节中心高 0.054 m（r1 0.057）；脚抬起垫厚 6 mm。
- 求解提示「手腕已限制在原始手臂能够到达的位置」出现在推到顶端的帧（60 帧里 36 帧），与 t-pushup-plus r2 相同：hub 的手腕点不跟随 shoulders.shift，V5 手骨不动（漂移 0、离垫 0.2 mm）。
- 参考比对（MediaPipe）：未做（示范是 YouTube 视频，拿不到轻量单张示范图）。

## r1 → r2 数值对比（同一套 V5 测量；r1 用 r2 的阶段窗口量，阶段类数值仅作参考）
| 检查 | 标准 | r1 | r2 |
|---|---|---|---|
| 全程锁肘（两肘最小角） | ≥ 172 ° | 178.0 | 178.0 |
| 胸口（胸廓）上下行程 = 肩胛后缩→前伸 | 30 … 50 mm | 0.0 ✗ | 33.9 |
| 肩关节相对胸廓前后平移（真肩胛平移） | 30 … 50 mm | 0.0 ✗ | 40.0 |
| 顶端比底端肩更靠前（前伸方向正确） | ≥ 30 mm | 0.0 ✗ | 40.0 |
| 不靠拱/塌上背代替：胸廓相对骨盆屈伸变化 | ≤ 4 ° | 17.98 ✗ | 0.0 |
| 不耸肩：肩关节相对胸廓上下变化 | ≤ 10 mm | 0.0 | 0.0 |
| 不塌腰：髋低于 胸廓(肩高)–膝 连线 | ≥ -15 mm | -30.4 ✗ | -5.4 |
| 不撅臀（髋不往后坐）：髋高于 胸廓(肩高)–膝 连线 | ≤ 15 mm | 22.5 ✗ | -5.3 |
| 手在肩正下方（肩相对手腕前后，最靠前） | -5 … 6 cm | -12.62 ✗ | -1.78 |
| 手在肩正下方（最靠后） | -5 … 6 cm | -12.62 ✗ | -1.83 |
| 头中立（头与胸廓夹角） | ≤ 15 ° | 0.0 | 0.0 |
| 顶端停留（胸口在最高点 1.5 mm 内，含缓入缓出） | 0.9 … 1.8 s | 7.98 ✗ | 1.33 |
| 每 8 s 循环次数（=每次 4 s） | 2 … 2 次 | 0 ✗ | 2 |
| 手掌（V5 手骨）、脚尖接触区不滑动（最大漂移） | ≤ 5 mm | 0 | 0 |
| 膝不滑（V5 膝关节漂移，取两侧最大） | ≤ 5 mm | 1.9 | 0.1 |
| 膝着垫：大腿/小腿最低点离垫面（最低） | ≥ -2 mm | 0 | 1.2 |
| 膝着垫：大腿/小腿最低点离垫面（最高，不悬空） | ≤ 3 mm | 4.4 ✗ | 1.8 |
| 脚不穿垫（脚最低点） | ≥ -2 mm | -6 ✗ | 0 |
| 手不穿垫（手最低点） | ≥ -2 mm | 0.2 | 0.2 |
| 手掌不翻转/不晃（手骨转角变化） | ≤ 3 ° | 0.0 | 0.0 |
| V5 身体与求解姿态一致（最大关节偏差） | ≤ 2 mm | 0 | 0 |
