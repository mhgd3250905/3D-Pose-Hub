# 熊式大臂近端局部饱满度候选 r2

用户指出上臂轮廓r1试版的袖口下方仍有凹陷，希望肱三头肌更饱满。此次按实际箭头命中面补足上臂近端过渡体积；该面未作生理肌群分区验证，不把图像朝后的表面直接等同于已验证的肱三头肌分割。

`upper-arm-contour-r2/0.1.0-r2` 完整替代r1，保留其共同接环的凸起抑制，在肩下约89–149mm、随骨骼运动的局部方向内少量补足。默认maxFillMm=4，上限5；零值复现r1。双侧同规则，原始冻结资产、骨骼、动作、权重、拓扑和材质不变。注册器拒绝同时选r1和r2，避免叠加。

## 近景证据

同镜头对照目录位于 `F:/PoseHub-v2-production/elbow-review-20261029/`：

- 上一版 `bear-arm-contour-candidate-r1` → 本版 `bear-arm-fullness-candidate-r2`，t2双侧近景。
- 额外过头姿态 `bridge-upper-arm-regression-r1` → `bridge-upper-arm-regression-r2`，t2。

独立复核看到轻微自然补足，仍保留正常转折，未把原凸起加回。实际新增位移最大约3.916mm，仅上臂近端目标点改变；原问题顶点18329/35538/35539对r1的新增位移为0。两组56对接环保持闭合，骨架、非目标采样网格、权重和拓扑不变。每组保存独立几何与视觉记录。

## 完整循环候选

`F:/PoseHub-v2-production/remaining32-template-r2-20261029/overnight/h-bear-plank/attempt10/` 为低清完整循环。241个实际渲染样本接环最大间隙0，stress 0，无页面异常；脚踝r5保留。26项针对性测试和重复组件拒绝检查通过，`git diff --check` 通过。

用户验收仍为pending。采用局部饱满度试版并不表示所有凹陷都应消失；最终以用户对这个姿势和饱满程度的确认决定。未做正式高清生产、推送或发布。

完整循环独立复核通过。相对attempt09，骨架、实际腕脚朝向、足底位置及脚踝诊断保持一致。当前30个候选配方和视频解码检查通过，审计另存 `overnight/upper-arm-fullness-audit-r2.json`；本轮配方、组件和媒体哈希固定在 `catalog/production/remaining32-r2/bear-upper-arm-fullness-20261029-r2.json`。此前试版和审计保留。
