# Air Flare r4 — 胯部蒙皮修复（共享模型 coach-v3r3）

开哥 2026-11-20：双腿张开后裆部不要有不规则凸起（隐私部位隐患）。

## 改动
- 只改 `coach-v3r3.glb` 的 pants 图元（primitive 2）蒙皮权重：以裆点 (0, 0.83, 0.005) 为心、半径 0.18 m、且 y<0.95 的区域（13977/39501 个顶点，y 0.65–0.95），
  在焊接网格上对 pelvis / spineLower / leftThigh / rightThigh 权重做调和插值（区域外权重为边界条件，不动），每顶点保留前 4 个影响。
  原模型裆部是左右大腿各 100% 的硬分界，劈叉时左右两片各随大腿转，裆顶挤出方块状棱；调和后裆中线约 大腿 0.35/0.32 + 骨盆 0.30，过渡平滑。
- 顶点位置、法线、骨骼、其他图元（皮肤、衣服、鞋袜）不变；不需要改运行时代码，任何加载 coach-v3r3.glb 的页面都直接生效。
- 动画数据未改（r4 = r3 动作），没有收窄劈叉角度。
- `coach-v3r3-r4.glb` 已重新 meshopt 压缩（1.84 MB），换掉 Pose Studio `model/coach-v3r3.glb` 即可。V5 渲染用的 `runtime/model/coach-v3r3-wristfix.glb` 未改（如需同步：`glbio.mjs unpack` → `HALF=0 helper.py` → `glbio.mjs pack`）。

## 复现
```
npm i meshoptimizer@0.22 --prefix /tmp/mo            # glbio.mjs 依赖
node glbio.mjs unpack coach-v3r3.glb raw.glb          # 解 meshopt
HALF=0 PYTHONPATH=<numpy/scipy> python3 helper.py raw.glb r4-raw.glb 0.18
node glbio.mjs pack r4-raw.glb coach-v3r3.glb coach-v3r3-r4.glb
```
`helper.py` 默认 HALF=1 会额外加 leftThighHalf/rightThighHalf 半旋辅助骨（需 app.js 每帧 slerp 驱动）——试过，3.74 s 出现新折痕，弃用。

## 验证
- `crotch_r3_vs_r4.jpg`：1.58 / 3.74 / 3.87 s 正面腿间 + 背面，同机位 r3 vs r4。
- `regression_other_moves.jpg`：托马斯全旋 f46（张腿最大）/f148、2000 r20 f192（分腿 124°）/f375 倒立 / f0 站姿，r3 模型 vs r4 模型。
- 遗留：3.74 s 背面裆中线仍有一个小的内收折角（不是凸起）；托马斯 f46 大腿根内侧多一条浅折线。
