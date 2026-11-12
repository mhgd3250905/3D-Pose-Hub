# 弹力带穿模 r1（2026-11-07）

扫描：tools/band-fix-r1/scan-band.mjs（band 道具管体中心线 49 点 × 关键时刻+10 采样，对最近皮肤顶点算 pen = r − 法向距离；手握端不计）。
22 个带 band 道具的弹力带动作（毛巾类、绳索 cable 不在本轮）。13 个无穿模（≤0.5 mm）：
h-band-hip-extension、h-band-standing-abduction、h-band-standing-adduction、h-band-straight-leg-raise、h-band-chest-fly、
h-band-face-pull、h-band-pallof、h-band-shoulder-ir、h-band-stepout、h-band-triceps-pressdown、lats-B、obliques-B、rotator-cuff-B。

根因：带端挂在脚/小腿骨骼中心附近（bone offset 在肢体里面），带子最后几厘米从肢体内部穿出。
修法（--trim）：每个挂在骨骼上的带端，沿自己这股带子退回到带子离开皮肤的位置（每个采样帧都留 ≥ 管半径），换算回骨骼局部 offset。
只改带端 offset，不改人体姿态、节奏、镜头、其它道具。新 spec 后缀 -bf1。

| 动作 | 中文名 | 穿模部位 | 修前最大 | 结果 |
|---|---|---|---|---|
| h-band-hip-ir | 坐椅弹力带髋内旋 | 右脚踝/右小腿（带端） | 10.4 mm | 已修 → 0（h-band-hip-ir-sc1-et1-bf1） |
| glute-max-B | 弹力带四足直腿后踢 | 左小腿 21.7、双脚踝 | 21.7 mm | 已修 → 0（glute-max-B-bf1） |
| hip-abductors-B | 仰卧弹力带 V 字开腿 | 双小腿/双脚踝 | 8.3 mm | 已修 → 0（hip-abductors-B-r3-et1-bf1） |
| h-band-biceps-curl | 站姿踩带弹力带弯举 | 双脚 | 13.7 mm | 未修：清零需把带端从脚底移到脚背（踩带语义变），配方在 remaining32-r2 组 |
| h-band-pull-apart | 弹力带水平拉开 | 双前臂 | 14.2 mm | 待复核：共享启动下测得（未装该配方握手修正），可能是握带姿态本身；不改姿态不修 |
| h-band-row | 弹力带坐姿划船 | 双脚掌 | 9.2 mm | 未修：裁端会与脚底横带错开 ~5 cm，需重做绕脚掌路径 |
| hip-flexors-B | 弹力带站姿高抬膝 | 右脚 | 6.8 mm | 未修：裁端后与脚背外圈断开，需重做绕法 |
| quadriceps-B | 弹力带终末伸膝 | 右大腿（膝后外圈） | 3.9 mm | 未修：裁端后外圈反穿大腿 12.6 mm，需重做绕法 |
| h-band-leg-out | 仰卧弹力带单腿侧落 | 右脚（带端） | 3.4 mm | 未修：轻微；裁端会与外圈断开，且正在 r2-v6 渲染 |

h-band-hip-ir 截图中大腿外侧的橙色：扫描未发现任何带子/道具进大腿；该动作高亮组为 hip-abductors + glute-max（右侧），判断是肌肉高亮色，不是道具。
