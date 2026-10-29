# 熊式支撑：大臂后缘轮廓修订

用户截图箭头指向远侧支撑臂袖口下方的大臂后缘。原版本为 `h-bear-plank/attempt08`，不是肘部扭转塌陷问题。实际渲染中的前臂轴转连续，骨骼并无180/360度翻转；DQS与法线控制没有解决箭头处轮廓，因此未加入该动作配方。

## 定位与修正

同镜头近景、逐像素三角面命中和源顶点映射定位到当前共享躯干网格 `V3_Head_Neck_Torso_Shared_R26` 的上臂接环。该环与limbs逐点相合。此前“旧P2长臂残留”或“单独衣物尾片”猜测均被源数据排除；实际为两块表面共用的局部上臂轮廓偏鼓。

独立 `upper-arm-contour-r1/0.1.0-r1` 组件根据接环上下各55mm真实截面，小幅收顺多余凸度，单点上限6mm，保留至少55%的原有凸度。双侧同规则、56对接环同步；不改变骨架、权重、拓扑、材料与原始冻结文件。未来与动态肘部修正组合时，需先安装该静态轮廓组件，再安装肘部修正并单独验证。

## 当前证据

- 同镜头修订前：`F:/PoseHub-v2-production/elbow-review-20261029/bear-arm-contour-baseline-r2/`。
- 同镜头候选：`F:/PoseHub-v2-production/elbow-review-20261029/bear-arm-contour-candidate-r1/`，实际最大调整5.867mm，箭头三点约3.44/3.35/1.96mm。
- 独立近景复核：凸起收小、后缘更顺，保留自然肌肉曲线。实际56对接环保持重合，骨架、非目标采样网格、权重和拓扑均不变。
- 臀桥过头姿态t2作为额外回归样本：`bridge-upper-arm-regression-r1`。该样本无本批匹配baseline，因此只声明可见表面与真实接环检查，不声称完整循环前后几何相等。
- 完整熊式低清候选：`F:/PoseHub-v2-production/remaining32-template-r2-20261029/overnight/h-bear-plank/attempt09/`。241个实际渲染样本记录 `jointCorrections.upperArm`，接环最大间隙0、stress 0、无页面异常。此前脚踝r5保留。
- 25项针对性测试通过，`git diff --check` 通过。

低清预览用于用户验收；未进行正式高清生产、推送或发布。保留自然肌肉曲线，不以完全削平大臂为通过条件。

完整循环独立复核通过，`visual-review.json` 与 `independent-cycle-audit.json` 已保存。对attempt08，骨架、实际腕/足朝向、足底和脚踝诊断均保持一致。当前30个候选的配方、媒体哈希及视频解码检查通过；新审计保存为 `overnight/upper-arm-feedback-audit-r1.json`，此前审计保留。收尾清单为 `catalog/production/remaining32-r2/bear-upper-arm-feedback-20261029-r1.json`。
