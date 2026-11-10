# 原头部表面平滑 0.1.0-r1

2026-11-10 最新用户要求：保留原来的头型和五官，只平滑头部、面部的棱面观感。此前圆润无五官头被用户淘汰；随后“保留鼻梁、简化五官”的造型方案也被用户明确停止。不能再将这些方案当作当前目标。

当前候选是 `head-surface-smooth / 0.1.0-r1`，清单在 `tools/head-surface-smooth-r1/manifest.json`。基础仍为 recipe 固定的 `training-human-v3-armfix / 0.1.0-r2`，保留已有场景手型与默认 realistic 皮肤。仅将原头部独立材质的阶梯式明暗改为连续过渡；顶点位置、法线、三角索引、蒙皮、骨架及全部五官均不修改。

代码位于 `codex/head-surface-smooth-r1-20261110`，工作树为 `E:/AII-3D/3D-Pose-Hub-worktrees/human-polish-v3-20261110`。对比图的全身基线沿用上轮身体美化候选，前后仅切换头部明暗开关。

## 复现

先启动同一工作树的 Vite 服务，再执行：

```powershell
$env:APP_URL='http://127.0.0.1:8849'
node tools/head-surface-smooth-r1/preview.mjs catalog/production/remaining219-r1/recipes/h-squat.json F:/PoseHub-v3/head-surface-smooth-r1/new-preview
```

入口自动核对基础人体冻结源、外观源码和皮肤哈希，再按动作配方加载。输出目录必须是新目录。每批保存版本报告、配方快照、来源清单及前后 PNG。

## 验证范围

本轮目录：`F:/PoseHub-v3/head-surface-smooth-r1/preview-a`。检查正面、斜侧、侧面近景，以及深蹲第 0、36 帧全身。渲染后比较全部可见网格的所有 CPU 蒙皮顶点和手型状态，包含头、颈、躯干及双手；另比较图像 alpha 通道，确保轮廓一致。最终回执见本文旁的 JSON。

完整循环、其他动作及用户看样尚未验收。既有全库 `verify.mjs` 的 `abs-A-r3.js` 未审核问题仍然存在，与本次头部着色改动无关。

## 已停止的试验

`faceless-head-r1` 与 `head-detail-simplify-r1` 仅保留追溯，清单状态均为 `stopped-by-user`，预览入口已阻断，未进入任何生产 recipe，也未发布。相关 F 盘图像不是当前候选。

补充更正：上轮 `default-body-polish / 0.1.0-r1` 的头部覆盖说明过宽。原头使用独立的 `head-neck-toon-r4-*` 材质，之前的身体明暗补丁没有处理它；本次独立外观版本才处理原头部明暗。
