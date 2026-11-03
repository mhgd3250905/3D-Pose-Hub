# 地面穿模修复 r1 · 里程碑 M1（膝/肘被姿态压到地面下，A1/A2）2026-11-03

分支 `fix/ground-contact-r1`（基于 `fix/ground-penetration-audit` 85af967）。只改各动作自己的 spec（新建 `-gc1` 修订版，原 spec 不动）和 recipe 指向（`spec` / `specSha256Lf` / `source.selectedSpec`，并记 `groundContactFix.r1`）。
未改 recipe-scene.mjs、求解器/引擎、模型、蒙皮、共享库；其他动作指纹不变。

复测：`tools/ground-audit-r1/ground-penetration-audit.mjs --stride 16 --size 128`（每 16 帧 1 帧，整循环 15 帧，生产安装链），结果 `after-*.jsonl`。
调参：`tools/ground-contact-r1/probe.mjs`（同一套测量，一次开页测多组内存变体）。

| 动作 | 修前最深 | 修后（支撑点最低皮肤，整循环） | 改了什么 |
|---|---|---|---|
| h-floor-nordic-hand-reset | 双膝 115.9 | 膝/小腿 −2.8…+8.9（最低点 ≥ −2.8），脚背 +2.5 | A1 离线帧表按 armfix-r2 腿长重算骨盆（以膝为铰点，大腿 0.408 m）+逐 16 帧膝高校准；脚踝后移 7 mm、抬 14 mm |
| h-quadruped-rockback | 双膝 90.2 | −1.0…+0.8 | 骨盆 y +50 mm；髋俯仰随后坐进度 −10°→−17°（中段 −6p(1−p) 缓和） |
| h-kneeling-pushup | 双膝 60.0 | −2.0…+3.8 | 两脚着地点后移 71 mm（膝极向量 +35.5 mm） |
| h-quadruped-open | 双膝 49.0 | +0.1…+4.8 | 骨盆 +63 mm，俯仰 12.778→7.778° |
| w-bird-dog / w-fire-hydrant / h-quad-cars | 双膝 45.3 | −0.5…−0.3 | 骨盆 +52 mm，俯仰 12.778→7.778°；HIPR（工作腿轨迹的髋点）+51 mm，工作腿相对身体轨迹不变 |
| h-donkey-kick | 膝 45.3、垫面 +6 mm | −0.3；双手贴垫 0 | 同上 + 垫子 at.y 0.006→0（D 类归零） |
| deltoids-C | 后膝 27.8 | +1.3（后脚尖仍 0.8） | 骨盆 +32 mm（地雷杆轨迹不动） |
| h-short-side-plank | 膝 24.1 / 肘 20.1 | 膝 +1.9 / 肘 −0.2 | 骨盆 +26 mm |
| h-supine-heel-slide | 双肘 19.4 | −0.6…+0.3 | 双手着地点向脚侧移 57 mm |
| h-supine-bilateral-leg-raise | 双肘 47.4 | −1.4…+2.7 | 双手着地点向脚侧移 67.5 mm（上臂随之离地约 2–3 cm，肘/前臂接地） |
| h-adductor-rock | 左膝 52.4 | +0.9…+4.9 | 起始骨盆 +52 mm、俯仰 7.778°；后摇时不再下沉 1 cm（第 3 次取前两次插值） |

## 未完成
- h-kneeling-thread-needle：不修。穿针段（腰扭 55°）引擎提示「躯干位置已限制，以保持锁定手掌、真实骨长和地面高度」，把躯干/骨盆压低约 11 cm，膝随之压到 −100 mm 以下；抬骨盆+俯仰只修好静止段（0 mm），两次改左撑手位置（内收 / 内收+前移）无效。需要重做穿针段的躯干轨迹（或放开锁定手），超出本里程碑。
- s-pigeon 膝：不修。抬骨盆 +45 mm 前侧右膝到 −2.8，但后侧左膝只 −32→−28.6（后脚脚背着地点/极向量决定），需移后脚，且该动作还有立砖重叠（D），留到 M2 一起处理。
- 手低 7.4 mm / 12.8 mm（B 类，原生 palm-floor）原样保留，未顺手改。
- h-floor-nordic-hand-reset 在 f128–160 手撑段双手 −6.8 mm（B 类）未改；其腿部最低点 −2.8 mm（小腿），站直时膝区比小腿高 6–9 mm，属小腿贴地，非悬空。
- h-short-side-plank 下侧脚原本就离地 26.7 mm（非接触），骨盆抬高后 52.7 mm。

## 对比图
`m1-before-after.jpg`：256px 侧视调试图（红色 = y=0 地面以下），左修前右修后。
