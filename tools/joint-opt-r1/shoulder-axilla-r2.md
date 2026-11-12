# shoulder-axilla-r2（原型，默认关闭，未接入生产）

r2 = r1 的位置修正（同一腋窝区域、同样的权重扩散 + rest 反解 + 抬臂 90°→120° smoothstep 渐入）
\+ **区域内着色法线修复**。r1 文件不变。

## 为什么要 r2
r1 之后产品外观 A/B 里腋下仍有黑色锯齿碎片、左侧改善偏小。逐像素追踪（pick 缓冲）结果：碎片是躯干网格
`V3_Head_Neck_Torso_Shared_R26` 的正面三角形、就在 r1 区域内；几何已经平顺，但区域内着色法线与实际表面偏差
中位 37–47°（整网格 1.1°；rest 姿态下为 0）。缝合带抬臂后被拉开 7–8 倍，刚性蒙皮的法线跟不上，toon 阈值把它切成
暗斑/亮条。左侧网格不对称（区域 611 vs 右 696 顶点）且法线偏差更大，又处在主光暗部，所以 r1 对左侧看起来改善小。

## 做法
每帧每侧（只在渐入 > 0 时）：用渐入后的目标位置重算区域内法线（焊接面法线面积加权，区域内 `normalSmooth`=2 次平滑；
区域外一圈顶点只读原蒙皮位置参与计算、不写入），按 `渐入 × 边界淡入` 混合（离区域边界 1 环为 0，`normalFadeRings`=2，
3 环起为 1）。写入方式、渲染后恢复与 r1 相同。

## 用法
```js
import {install} from './tools/joint-opt-r1/shoulder-axilla-r2.mjs';
await install(page,{enabled:false});            // window.__shoulderAxillaR2
await page.evaluate(()=>{__shoulderAxillaR2.enabled=true;});
await page.evaluate(()=>__shoulderAxillaR2.detach());
```
全局名 `__shoulderAxillaR2`（可与 r1 同时安装，测量时各自单独开）。`normalRepair:false` 时位置与 r1 相同、法线方向相同（仅浮点舍入差）。

## 已验证（沙箱 CPU）
- 安装但关闭 == 未安装：逐顶点位置和法线最大差 0；开→关后 0；rest 姿态打开 0；区域外（含其他网格）最大位移 0；detach 后 0。
- 3 个试点 + abs-A：stage-A 超阈 3→0（同 r1）；附加指标"可见肩部面法线偏差 >45°"面积 160152→115006（r1）→30343 mm²（r2）。
- 不改骨骼、权重属性、索引、材质、manifest/哈希/指针，不接入 recipe。

全量回归与出图：`regress-r2.md`。
