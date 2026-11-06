# 脚角度 r3（2026-11-06）：通用"脚随小腿"烘焙工具 + 5 个待修动作

分支 codex/foot-angle-r1，接 r2 4271694。读数 = 踝相对真实解算小腿（tools/foot-angle-r1/scan-foot.mjs，归一化四元数）；pf 跖屈+/背屈−，add 内旋+/外旋−，inv 内翻+。

## 工具
- `tools/foot-angle-r3/foot-follow.mjs`（离线烘焙，读配方的 prepared spec）：按 spec fps 逐帧 applyAt，取解算小腿骨世界旋转，
  目标脚 = 小腿相对绑定姿态的旋转 × 偏置（跖屈/背屈、绕小腿内外旋、内外翻；可按时间关键帧线性插值）。
  落地帧（原脚最低点 < 12 mm）保持原朝向，离地后按 smoothstep 0.3 s 过渡到跟随；每帧再做地面钳制（混合后脚最低点不得低于原脚/地面，二分缩小权重）。
  结果去掉 frame 载体（hips）后分解为 Rz·Ry·Rx，解卷绕，写成每帧 linear 轨道。
- `drill-anim/lib/foot-follow.mjs`：`applyFootFollow(previous, id, data)` 把轨道注入新 spec（只替换该侧 free 脚的 rot、去掉写入该 rot 的旧 delta；踝目标、膝极、其他肢体、节奏、镜头不变）。
  生成的 -fa1 spec 导入原 spec，不覆盖原 spec，不动共用模型/安装链。
- scan-foot 新增 `--corr 1`：安装配方的渲染期动作修正器（目前只支持 mountain-airborne-foot-r2），读出与渲染一致的脚角。

## 判定
| 动作 | 判定 | 读数（修前 → 修后） | 说明 |
|---|---|---|---|
| n-prone-ir 双脚 | 已修 n-prone-ir-fa1 | 跖屈 60 → 6.5；内旋 14 → 0；内翻 24 → 0（全程） | 俯卧屈膝，脚随小腿外摆，脚底朝天；无落地帧；脚最低点 0.49 → 0.45 m |
| h-band-leg-out 右 | 已修 h-band-leg-out-et1-fa1 | 外旋 −59 → 0；背屈 18 → 3.5；翻 11 → 0 | 弹力带套脚底，脚底朝上；全程离地 |
| h-hip-gate 右 | 已修 h-hip-gate-r2-sc1-et1-fa1 | 外旋 −61 → ≤ −16（只在落地/过渡帧）；pf −16..6 → −10..6.5；翻 ≤ 2 | 26/120 帧落地保持原平放；8 帧过渡被地面钳制；最低点 −1 mm 与原相同（不新增穿地） |
| h-mountain-climber 双脚 | 不改（已由渲染期修正器解决） | 原始引擎读数背屈 86；装 mountain-airborne-foot-r2 后 pf −29..6.5、旋/翻 ≤ 1 | r2 的"背屈 90"是扫描没装修正器的读数；渲染流程 required 该修正器，离地脚已跟随小腿+10°；−29 为平板支撑踩地脚尖 |
| adductors-B 右（搭凳上腿） | 拿不准，未改 | 跖屈 88、旋 93–96、翻 146–152 | 试烘"跟随小腿+跖屈10"：脚最低点 0.430 → 0.355 m，比凳面（0.4305）低 75 mm＝插进凳子；需在凳面上重新设计整只脚朝向（绕小腿转约 90° 让脚侧面平放），要看图定，已撤回 |

脚相关自穿模（measureSelfInPage，d10>10 mm）：5 个动作修前修后都无。

## 回归（已修 3 个，r3 扫描复测）
s-figure4 右 pf −8.5..−7.9；h-chair-single-leg-hip-thrust 右 pf 10.1；h-donkey-kick 右 pf 2.2–2.3：与 r2 一致，不回退。

图：cmp-r3.png（每行：修前全身、修前脚特写、修后全身、修后脚特写）。数据：scan-before/after.json、scan-mc-raw/corr.json。
注：扫描与烘焙都不装渲染期的 fixedCorrectionStack（h-band-leg-out 配方带 ankle 修正），与 r1/r2 口径一致；最终以渲染抽帧确认。
