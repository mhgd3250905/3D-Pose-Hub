# Native hand fit 1.0.0-r5（缩放 0.85 + 掌厚 0.8 + 腕部扭转分摊）

由冻结的 r3 生成，r3 和 r4 的文件都没改。只通过 `native-open-r1` 加载：`modelProfile='training-human-v2plus-hands-native'`，`nativeHands={version:'1.0.0-r5'}`；可选 `twistShare`，取值 0–1，默认 0.5。

- 网格和骨骼：以腕为中心整手缩放 0.85，手局部 x 在 0–35 mm 之间平滑过渡。腕部 12–28 mm 一段径向收窄 0.87。掌厚方向（手局部 y，掌侧）压缩 0.8，只作用于掌区（r3 局部 x 为 20–115 mm，两端平滑过渡；拇指第 2、3 节不压）。接缝顶点和前臂过渡带不动。骨骼名称、层级、命名手型、flexAxis 都不变。
- `wrist-twist.js`：页面运行时的包装。每次渲染前（`renderer.render` 包装，渲染完立即还原，求解出的姿态和 QA 不受影响），把手骨相对前臂轴的扭转 θ 按 twistShare 分给前臂骨（前臂绕自身轴转 share·θ），手骨反向补回，手在世界坐标里的朝向不变。这样腕部接缝只承担 (1−share)·θ，其余转动由整段前臂承担，肘部也会分到一部分。
- 生成脚本：`docs/hand-scale-r4/build_r5.py`；扭转统计：`docs/hand-scale-r4/twist-*.json`。
- 状态：reviewed=false，releaseEligible=false。
