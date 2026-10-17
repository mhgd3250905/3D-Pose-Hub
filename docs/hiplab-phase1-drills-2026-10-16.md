# HipLab 开胯 · 第 1 阶段新增动作与自测对比图（2026-10-16）

> 开哥批准的 HipLab（开胯训练助手）第 1 阶段：MVP 新增动作 15 个 + 自测对比图静帧脚本 6 个。
> 本 PR 只加 drill-anim 制作源（`tools/drill-anim/specs/n-*.js`、`a-*.js`）和 SHA 登记，**不改 App、不替换任何已有动作/视频**。
> 成片与对比图已由 PR #118（`feat/hiplab-flavor`）接入 HipLab 内容包；FlareLab 的 51 个正式视频不受影响。

## 1. 怎么渲染

外观用方案 B（肌肉卡通明暗 + 边缘光晕），master 默认 theme 仍是已验收的 v7，所以要显式带预设：

```bash
cd tools/drill-anim
node verify.mjs                                   # 源契约 + SHA 校验
python3 drill.py render n-thomas-test --theme themes/glow-b.json --pr 0.75 --jobs 1
python3 drill.py render a-9090 --theme themes/glow-b.json --frames 15,45,75,135 --jobs 1   # 对比图静帧
```

- 本批是开哥要求的**快速渲染**（`--pr 0.75`），只保证无 bug、无大动作问题；精细版（`--pr 1.4`）开哥用本地 4080 自己出。
- Hark 的成片是在与 master 相同的 `lib/`、`page/`、`drill.py` 上渲的（逐文件比对一致），使用的 theme 与 `themes/glow-b.json` 的共有字段完全相同。
- 成片：1080² 30 fps 母版 → App 用 720² H.264（约 110–250 KB/个）+ 540² 封面。

## 2. 新增动作（15 个，`n-*`）

| # | id | 名称 | 场景 | 循环 | QA |
|---|---|---|---|---|---|
| 1 | `n-thomas-test` | 仰卧单膝抱胸（托马斯测试） | 居家垫 | 8 s | PASS |
| 2 | `n-leg-circles` | 仰卧直腿画圈 | 居家垫 | 12 s | PASS（求解器提示 29 帧，指标全过；自测"仰卧横跨"演示从 7.2–12 s 截取） |
| 3 | `n-prone-hip-ext` | 俯卧屈膝抬腿 | 居家垫 | 8 s | PASS |
| 4 | `n-prone-ir` | 俯卧小腿外摆（髋内旋） | 居家垫 | 8 s | PASS |
| 5 | `n-seated-knee-lift` | 坐姿抬膝悬停 | 办公椅 | 8 s | PASS |
| 6 | `n-windshield` | 仰卧雨刷式 | 居家垫 | 8 s | PASS（第 2 轮） |
| 7 | `n-chair-wiper` | 坐椅雨刷（膝内倒） | 办公椅 | 8 s | PASS（重渲版） |
| 8 | `n-pelvis-circle` | 站姿骨盆画圈 | 办公椅旁站立 | 8 s | PASS（第 2 轮） |
| 9 | `n-squat-shift` | 低位蹲姿左右移重心 | 居家垫 | 8 s | PASS |
| 10 | `n-wide-fold` | 站姿宽距体前屈（扶椅） | 居家（椅子） | 8 s | PASS（第 2 轮） |
| 11 | `n-straddle-fold` | 坐姿分腿体前屈 | 居家垫 | 8 s | PASS |
| 12 | `n-half-split` | 半跪半劈叉（扶砖） | 居家垫 + 瑜伽砖 | 8 s | PASS |
| 13 | `n-slider-lateral` | 滑垫侧向滑 | 居家（滑垫） | 8 s | PASS（第 2 轮） |
| 14 | `n-seated-ir-drop` | 坐姿后撑单膝内倒 | 居家垫 | 8 s | PASS |
| 15 | `n-seated-squeeze` | 坐姿夹砖（膝内夹） | 办公椅 + 瑜伽砖 | 8 s | PASS |

QA 口径：`drill.py` 自带 metrics（穿地、脚/手锁定点、直腿、关节限位、自穿模、手接触）全部 PASS；道具区逐帧闪烁扫描（propscan）0 帧。

### 修改与替换记录
- `n-9090-ir-lean`（90/90 向后腿侧倾）→ **换成 `n-seated-ir-drop`（坐姿后撑单膝内倒）**：两轮后在当前模型上仍无法让手掌贴垫、腰部弯曲不超过 45°，改用坐姿练同一个被动内旋末端。`n-9090-ir-lean` 不在本 PR。
- `n-seated-squeeze`：原计划"拳头夹在膝间 + 手在外侧外推"一对动作，两轮后手掌无法稳定放在膝内侧而不陷进大腿，**改为膝间夹瑜伽砖（只练内收，等长）**，外推半部分去掉。
- `n-windshield` 第 1 轮：脚锁定点漂移 11.7 mm → 去掉脚外翻，第 2 轮 PASS。
- `n-chair-wiper`：首轮渲染中途被打断，脚本修改后重渲一次，PASS。
- `n-pelvis-circle` 第 1 轮：手–大腿间隙 1.52–1.65 mm（> 1.5 mm 接触阈值）→ 接触留空 1.5→1.0 mm，第 2 轮 PASS。
- `n-wide-fold` 第 1 轮：膝角 158°（< 166°，骨盆太低）→ 骨盆高度 0.79−0.02p → 0.795−0.013p，镜头留边 0.16→0.2，第 2 轮 PASS。
- `n-slider-lateral` 第 1 轮：起始右膝 150°（< 165°）、滑到最远时过伸（求解器提示 58 帧）→ 按实测髋–踝弦长（0.994）求骨盆高度，外滑 −0.56→−0.46，滑垫 8→4 mm，镜头留边 0.16→0.22，第 2 轮 PASS。

## 3. 自测对比图脚本（6 个，`a-*`）

同一人体、同一机位、同一光线，只改姿势；每段 2 秒静止姿势，按帧号出静帧（15 fps）：

| 脚本 | 自测项 | 静帧 | 说明 |
|---|---|---|---|
| `a-butterfly` | ① 蝴蝶式膝高 | 15 / 45 / 75 = A 松 / B 一般 / C 紧 | 膝盖低于 / 平齐 / 高于脚踝 |
| `a-9090` | ② 90/90 上身直立 | 15 / 45 / 75 / 135 | A 手离地坐直；B 双手后撑后仰；C（= 追问"前腿翘"）；135 = 追问"后腿翘" |
| `a-thomas` | ③ 托马斯测试（地板版） | 15 / 45 / 75 | 伸直腿贴地 / 膝窝离地 / 大腿抬起屈膝 |
| `a-supine-cross` | ④ 仰卧单腿横跨（内收） | 15 / 45 / 75 | 脚越过对侧腿外侧 / 到对侧腿正上方 / 没到就翻骨盆 |
| `a-seated-fold` | ⑤ 坐姿体前屈 | 15 / 45 / 75 | 摸到脚尖以外 / 到小腿脚踝 / 只到膝盖 |
| `a-deep-squat` | ⑥ 深蹲到底 | 15 / 45 / 75 | 蹲到底脚跟贴地 / 半蹲 / 大腿水平附近下不去 |

共 20 张（3+5+3+3+3+3），App 里放在 `assets/hip/assessment/<item>-<a|b|c|front|back>.webp`（540²）。
`a-9090` 本次修了 B 图：后仰角度 36°→48°、撑手点后移，垫子加宽，双手真正落在垫面（之前手悬空）。

## 4. SHA 登记

21 个新脚本的规范化 SHA-256 写在 `tools/drill-anim/data/home-pr-candidates.json`（`pr: 119`），`verify.mjs` 无需改动即可校验；原 59 项与已登记脚本哈希不变。

## 5. 未做 / 待办

- **复用动作的 B 重渲**（本 PR 不含）：`s-9090`（重渲中途被中断，未完成）、`s-seated-fold`、`h-squat`（这 3 个也是自测演示）以及其余复用髋部动作（`h-knee-hug`、`h-supine-twist`、`s-figure4`、`s-frog`、`s-kneel-hipflex`、`s-lizard`、`s-pigeon`、`o-*`、`w-clamshell`、`t-seated-straddle-lift-1leg`、`hip-flexors-A`、`glute-max-A` 等）。HipLab 45 个 MVP 动作里目前 18 个有成片，9 个静帧，18 个待渲染。
- **精细渲染**：本批全部 `--pr 0.75`；精细版（`--pr 1.4`）由开哥本地 4080 出，同名替换即可。
- 坐姿夹砖的"外推"半部分、90/90 侧倾版需要模型手部/腰部改进后再做。
- 本 PR 只加制作源与 SHA 登记，不改 App；成片接入在 #118。
