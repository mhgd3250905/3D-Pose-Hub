# 保留眼窝的内部交界柔化

2026-11-10 用户要求：保留眼窝，但不要有内部锐利交界线。本轮不填平眼窝、不重新塑造头部，也不沿用此前已经停止的两种改头型试验。

独立外观候选 `eye-socket-soften / 0.1.0-r1`，叠加在 `head-surface-smooth / 0.1.0-r1` 上。基础人体仍由动作 recipe 绑定 `training-human-v3-armfix / 0.1.0-r2`，本轮分支为 `codex/eye-socket-soften-r1-20261110`。

只在双眼窝的局部范围混合相邻法线，并柔化该范围原有凹陷暗色的边缘。邻域半径 9 mm，影响权重在边缘平滑降至零；鼻梁中线、上方额头与眼窝外的法线不参与修改。材质改动仅作用于原头部材质，保留皮肤和肌群高亮流程。

所有顶点位置、三角拓扑、蒙皮权重和骨架保持不变，因此眼窝的实际深度、形状、头部外轮廓及原手型均不改变。安装时逐项核对眼窝以外的全部几何属性。关闭候选时恢复原几何与材质引用。

## 复现和记录

同一工作树启动 Vite 后：

```powershell
$env:APP_URL='http://127.0.0.1:8849'
node tools/eye-socket-soften-r1/preview.mjs catalog/production/remaining219-r1/recipes/h-squat.json F:/PoseHub-v3/eye-socket-soften-r1/new-preview
```

入口核验基础人体及候选源码哈希，按 recipe 加载场景。外观清单为 `tools/eye-socket-soften-r1/manifest.json`。本轮图片和逐帧运行证据位于 `F:/PoseHub-v3/eye-socket-soften-r1/preview-a`，本文件旁 JSON 固定其哈希。

本轮检查正面、斜侧、侧面近景及深蹲第 0、36 帧全身：前后比较全部可见网格的所有 CPU 蒙皮顶点、手型和图像透明轮廓，同时检查候选材质实际编译与浏览器错误。版本检查和 portability 7 项通过。

仍为待用户看样的本地候选；未替换生产配方、未合并推送，也未声称完整动作循环或全库验收。
