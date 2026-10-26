# Native hand fit 1.0.0-r4（r3 等比缩小 + 腕部过渡）

由冻结的 `hands-native-r3` 生成，r3 的文件一个都没改。profile 不变：`training-human-v2plus-hands-native`，版本 `nativeHands.version: '1.0.0-r4'`，只通过 `native-open-r1` 加载。

- 在手骨局部坐标里绕手骨原点（腕）均匀缩放 S=0.88；手局部 x 在 0–35 mm 之间，缩放系数从 1 平滑过渡到 S（smoothstep）。x≤0 的前臂过渡带和 66 个接缝顶点完全不动，所以和冻结前臂的接缝不变。
- 腕部收窄：手局部 x 在 12–28 mm 之间，截面绕截面质心径向乘 0.87；0–12 mm 和 28–45 mm 两段平滑过渡回 1（周长：x=10 mm 处 r3 为 203 mm，r4 为 176 mm；冻结前臂远端约 162 mm）。
- 手指关节用和网格相同的映射。骨骼名称、层级、flexAxis、命名手型（open/relaxed/palm-floor/grip-bar/band-grip）和权重都不变。
- 法线沿用 r3：均匀缩放不改变法线；过渡带内的误差很小，没有重新计算。
- 生成脚本：`docs/hand-scale-r4/build_r4.py`（参数 S、BAND）；实测数据见 `docs/hand-scale-r4/`。
- native-grip r1 的 32 mm 握杆贴合是按 r3 尺寸做的，不适用于 r4；握杆 profile 继续用 r3。
- 状态：reviewed=false，releaseEligible=false，未做渲染验收。
