# 零预算动作人物与静态肌群参考

2026-10-09当前默认网页/App动作已同步到v41：脚踝扭转与领口蒙皮优化，保留Snow原衣服、面孔及材质。网页保留原编辑器，App使用对应烘焙GLB；来源、复现与验证以 [v41同步合约](../app/docs/motion-v41.md) 为准。以下制作与历史展示说明保留；原网页GLB已独立备份为 `public/coach/flare-coach-before-web-v41.glb`，没有覆盖Blender原件或个人导出。

本项目保持零预算，使用本机 Blender 和合法免费成熟人物网格。Snow 继续承担友善卡通动作教学；点击肌群后，默认在独立浮窗中查看官方 Realistic 男性完整人物与肌群位置色区，解剖结构另行切换。此前收费模型文档保留为历史研究，本轮没有采购或调用收费生成服务。

## 已交付资产

- 可编辑人物与灯光场景：`assets/coach/flare-coach.blend`。
- Three.js 模型：`public/coach/flare-coach.glb`。
- 真实关节点与来源：`public/coach/coach-rig.json`、`public/coach/ATTRIBUTION.md`。
- Blender 全身渲染：`output/blender/coach-preview.png`；面部近景：`output/blender/coach-portrait.png`。
- 可复现制作脚本：`tools/blender/build_coach.py`；七个必需生成 helper 及调用顺序见下文“用本机 Blender 重建”。
- 默认静态肌群位置参考：`public/anatomy/fitness-reference.glb`、`public/anatomy/fitness-reference.json`；可编辑场景为 `assets/coach/fitness-reference.blend`，制作脚本为 `tools/blender/build_fitness_reference.py`。
- 解剖结构模式保留的同源完整体表：`public/anatomy/muscle-reference.glb`、`public/anatomy/muscle-reference.json`；可编辑文件和制作脚本仍为 `assets/coach/muscle-reference.blend`、`tools/blender/build_muscle_reference.py`。这些静态参考与 Snow 动作资产分开。

Snow 动作人物的身体、面孔、眼睛、眉毛、头发、衣服和鞋均来自 Blender Studio 免费发布的 Snow v4.2。这个项目使用完整成熟网格，调整运动服、肤色、表情和灯光。没有用球、柱等体块拼接人体。原始专业 rig 及贴图仍保存在 `assets/blender-studio-source/snow-rig-v4/Snow/`，未改动源文件。

## 当前人物与正式展示

当前人物为深棕短寸头、浅灰上衣、哑光黑色短裤和白鞋，保留自然掌弓与手掌厚度。网页使用 20 个平行变形骨，原有身体权重按身体区域归并，面孔表情烘焙后随头骨运动，服装与皮肤共用骨架。自然手掌版本的既有导出计数为 211,060 个 GLB 顶点；本次文档对齐没有重新导出模型或重跑下文所列的历史资产与姿势检查。

正式分步骤来自 `托马斯/16.json` 的原步骤 **9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 9**，末帧复用原第 9 步，保持保存的位置、手脚朝向及支撑锁定。网页展示的阶段名称遵照用户确认的画面方位，人物左／右支撑手则以保存的锁定标记为准。

升级此正式循环时独立备份旧展示，不改个人步骤与草稿。个人姿势通过“用于正式展示”显式采用：至少 16 步的库优先匹配正式来源的步骤 ID，否则按列表第 9–16 步再接回第 9 步；完整九步库可按列表发布。旧的 `5.json + 镜像4/3/2/1` 属于此前展示版本，不再是当前正式来源。

动作用于说明 Flare 的支撑与摆腿，需要真实运动捕捉时应另行采集；肌群功能颜色不是肌电激活百分比。

2026-10-07 Snow 主动画的发力提示改为浅色柔边区域，减弱高饱和换色并移除额外发光。整件短裤不参加任何发力区域着色，默认、悬浮及训练时均保留原哑光黑色，避免亮色放大裤裆褶皱；髋部继续由动态卡片、引线和方向箭头说明。此次只改网页显示代码，没有重建人物网格、服装、骨架或保存动画。

同日将动画导览统一为青蓝肩臂支撑、淡紫核心协调、青柠髋腿摆动。默认不常驻三张文字卡片；悬浮身体功能色区或小热点时，仅展开一张发力说明卡。点击暂停当前动画并打开独立的全息肌群浮窗，默认人物改用 Human Base Meshes v1.4.1 的 Realistic male：保留同源头、耳、颈、躯干、双臂与手足，采用浅色低反光皮肤与哑光深蓝运动短裤。派生面部作低细节平滑并闭合眼口深凹，最终不显示独立眼睛。

默认色区落在这个成熟人物的体表与覆盖相关部位的服饰表面，说明相关肌群的位置与功能关联；静态短裤可用宽色区定位其覆盖的髋前与臀部，不增加肌肉形状。深层肌群是所在部位示意，功能区不代表肌肉边界。内部真实网格在 **解剖结构**模式中独立查看，使用原 BodyParts3D 肌群与同源 `muscle-reference.glb`。两个不同人物不混合展示，保留 BodyParts3D 的源名称、左右、网格、坐标与缺失结构说明。

浮窗以独立相机放大相关部位，完整人物留在场景中；同一场景通过 scissor 和第二相机绘制真实全身定位图，可查看全身、返回局部、切换正面／背面、独立旋转、缩放与复位。完整人物通过本地 Three.js `GLTFLoader` 读取，骨骼／肌肉二进制按原加载方式管理。底部固定已有练法的文字入口，本轮没有新增训练动作模型。

默认静态参考没有动作绑定，不用于替换 Snow。原 Skin、肌肉、骨骼、旧完整体表及源人物资产保留；新派生人物的材质、原细分、统一坐标、隐私外观与短裤改动记录在 `fitness-reference.json`。Snow 的完整服装、骨架和保存动画保留；主动作 Snow 黑短裤继续排除着色，上衣不受下肢色区影响，短弧与撑手环仍来自原动画。

## 静态参考人物的来源与制作

默认静态人物取自 Blender Studio 与社区贡献者发布的 [Human Base Meshes v1.4.1](https://www.blender.org/download/demo-files/)，源对象为 `GEO-body_male_realistic`，许可 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)。官方完整包、下载地址与原包哈希保留在 `assets/blender-studio-source/SOURCE.md`。它允许免费修改和商业使用，保留来源记录方便追溯。

制作脚本复制源作者的完整身体，在副本上求值原有细分、统一坐标和材质，从源骨盆／大腿表面派生运动短裤，并对同源面部局部低细节平滑、闭合眼口深凹。最终派生模型省略独立眼睛，官方源库中的配套眼结构保持原样。没有用球、柱等程序化体块拼人体；原始 ZIP、Blender 文件和 BodyParts3D、Snow 资产保留。静态人物的实际交付和渲染检查记录见下文。

Adam 免费包本轮未取得或采用：访客下载需要 ArtStation 账号，未找到作者授权匿名文件入口。具体来源与阻碍保存在 `assets/model-candidates/adam/SOURCE.md`，本轮采用已在本地保存的官方 CC0 底模。

### 本轮静态资产交付记录

2026-10-07 最终 `fitness-reference.glb` 实际大小为 **2,523,408 字节，约 2.52 MB**，共 **2 个网格、81,002 个三角形**：身体 74,274、短裤 6,728，无独立眼睛。SHA-256 为 `47b9427d19d82cb4f573196028e1513c20b719c41a2a5fd961579360412f442d`，已与来源 JSON 及实际文件核对；完整高度约 1.690 米，双脚落在 `Y=0`。

实际 Blender 渲染保存在 `output/fitness-reference-20261007/front.png`、`back.png`、`portrait.png`，可编辑场景已保存。最终制作检查覆盖完整身体、闭合体表、独立眼睛省略、独立服装、有限范围、落地和中心，以及源文件与源原始几何保持；面部处理前后，颈以下 27,754 个唯一顶点位置不变，短裤的属性、索引、材质和矩阵逐字节一致。记录保存在同目录 `checks.json` 与公开来源 JSON，其中 `closedBodySurface:true`、`independentEyesIncluded:false`。最终 12 项定向检查已通过，12 份原资产保持。本记录仅说明静态资产交付和文件核对，浏览器功能色区、交互与手机布局由主流程另外验证。

## 制作与历史验证记录

以下保留各次修复当时的数值、截图路径和验证结果，本次文档对齐没有重跑这些检查。旧八预设、266,744 顶点及旧工作区检查数量是相应历史版本的记录，不能当作当前正式九步已重新验收的结果。

2026-10-05 衣裤改为浅灰上衣、哑光黑色短裤，降低镜面反光以弱化裤裆原有褶皱的明暗。采用轻量材质调整，未增加布纹贴图或修改服装网格与权重。`tools/blender/style_coach_outfit.py` 同时更新派生 `.blend` 与 GLB，已接入重建脚本。实际网页材质对照在 `output/outfit/`，改动前资产备份在 `output/outfit/before/`。

同日修复单手侧撑时裤腰穿出浅灰衣摆的问题：原衣摆局部增加 9 mm 包覆，低端延长 3 mm，向上平滑渐隐。保持材质、UV、衣服权重和骨架。当时第 3、7 步的局部对照与备份在 `output/outfit-hem/`，仅对这两个实际姿势做近景检查。

2026-10-05 按用户要求将卷发和发髻换成普通短寸头：沿用原人物完整的头发底层，删除另外 11 个卷束及发髻部件，并轻微外移覆盖头皮，使用哑光深棕色。面孔、服装、骨架与关节点保留，已有姿势继续沿用。发型对照图在 `output/buzzcut/`，更换前的派生资产备份在 `assets/coach/backups/2026-10-05-before-buzzcut/`。

此前只保留鞋口以上的小腿，虽然遮住了脚掌穿出白鞋底的问题，却会在脚踝旋转时暴露断开的皮肤边缘。本版重新保留原 Snow 连续的脚踝和脚部皮肤，把鞋内部分平滑收进白鞋内部，并调整 Shin / Foot 的过渡权重。鞋子、脚踝关节点及腿长保留；网页的地面约束按真实鞋面和鞋底计算，避免把有少量 Foot 权重的小腿皮肤当成整只鞋旋转。鞋底检查脚本为 `tools/blender/inspect_coach_shoes.py`，历史修复图保留在 `output/blender/coach-shoes-before.png` 和 `output/blender/coach-shoes-after.png`。

之前为撑地而将原手掌横截面强制投到固定平面，产生了刀切般的掌面；腕部从关节前 65 mm 到后 12 mm 的混合权重也会让弯折收缩出现在前臂末端。2026-10-05 根据用户指出的问题去掉这两种处理：恢复自然掌弓、鱼际及厚度，用原指骨轴与原权重舒展弯曲指节，腕部权重限定在原关节前 18 mm 到后 22 mm。整片手掌沿掌法线统一平移约 11.78 mm，并只在腕部短距离渐变，保留旧姿势的 25 mm 接触偏移；没有压平、裁切或缩薄掌面。20 个关节、骨长及保存格式保留，原始 Snow 未改动。预设仍按真实蒙皮顶点校正接触，掌弓的起伏不代表每根手指都完全接地。独立对照图及测量在 `output/hand-natural/`，更换前派生资产备份在 `assets/coach/backups/2026-10-05-before-natural-hands/`。手脚朝向与真实接触范围由 `tools/inspect-pose-orientations.mjs` 复核。

自然手掌修复阶段的导出记录为 211,060 个 GLB 顶点；当时导出 12 项、动作约束 354 个姿势、关键预设 8 个均通过，八姿势的朝向检查无异常。12 张同机位网页近景覆盖左右撑地、约 45° 弯腕、掌心与手背，四格对照为 `output/hand-natural/comparison.png`。六个旧对照快照在新模型中重放，最大姿势数值差为 1.11×10⁻¹⁶，支撑手最低高度为 6.137–6.495 mm。它们为独立复核快照，并非读取用户个人五步。源关节数据与更换前逐项相同，手掌接触不靠再次压平曲面实现。

短裤沿身体中线连续扩宽，替换原来分别绕左右腿中心扩宽的公式，消除裤裆约 13.12 mm 的反向重叠。真正的裤裆使用窄幅骨盆权重过渡，裤筒和裤脚仍保留原作者的大腿权重；原服装拓扑与 3 mm 内壳保留。局部修复会同时写入可编辑 Blender 文件与网页 GLB。

此前裤裆、脚踝与手腕修复的 2026-10-05 导出保留全部 20 个骨骼名称、顺序、静态变换和关节点。六个修复前保存的对照姿势在当时 GLB 中重放，最大数值差为 1.11×10⁻¹⁶；它们是用于复核的姿势快照，不是读取用户另一浏览器中的个人步骤。每个姿势检查 266,744 个真实蒙皮顶点，地面以下顶点均为 0；当时鞋底的 16,634 条射线中，皮肤穿出的数量为 0。开腿、左右单撑、站姿及额外 25° 脚踝旋转的网页近景在 `output/mesh-repair/web-before.png` 与 `output/mesh-repair/web-after.png`，对应快照、兼容性报告及真实接触测量也保存在同目录。

同一修复阶段的历史检查结果为：导出检查 12 项、动作约束 354 个姿势、关键预设 8 个、姿势编辑 29 项、镜像保存 31 项、桌面及移动工作区 149 项均通过。镜像回归仍要求原五步保存数据逐字节不变；重新求解后活跃草稿的浮点数比较使用 10⁻¹² 容差，实际最大差为 3.47×10⁻¹⁸。裤裆诊断的中央自交计数由 3,698 降至 339，实际可见的锯齿裂口已消失，少量内壳与压褶相交仍保留，不能把它表述为所有姿势都无任何内部相交。原版派生资产备份在 `assets/coach/backups/2026-10-05-mesh-repair/`。

## 来源与许可

**Snow Rig © Blender Foundation | studio.blender.org**，来源：[Blender Studio Snow](https://studio.blender.org/characters/snow/)，许可：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。网页署名与同目录 ATTRIBUTION.md 一并保留，且注明本项目改动。原包大小、SHA256 和下载来源见 `assets/blender-studio-source/SOURCE.md`。

所有资产与工具费用为 **0 元**。未购买模型、插件、订阅，也未调用收费生成服务。

默认静态人物为 Human Base Meshes 的 CC0 底模。详细解剖结构来自独立的 BodyParts3D 4.0，其 CC BY 4.0 许可、源几何、名称与本人左右继续保留，缺少独立网格的结构继续注明。表面功能色区只用于位置讲解；Realistic 人物、BodyParts3D 解剖和 Snow 动作均未精确配准。完整来源和覆盖说明见 `docs/anatomy-assets.md`、`public/anatomy/ATTRIBUTION.md`。

## 用本机 Blender 重建

`build_coach.py` 必需导入同目录的以下七个 helper；它们不是可省略的单独补丁。实际调用顺序为：

| 顺序 | 生成 helper | 调用位置与作用 |
| --- | --- | --- |
| 1 | `tools/blender/prepare_coach_hands.py` | 在原身体完整求值网格上舒展手指，保留自然掌形及既有接触偏移 |
| 2 | `tools/blender/fix_coach_joints.py` | 裁除被遮挡面之前，整理腕部与脚踝形态、可见性及过渡权重 |
| 3 | `tools/blender/fix_coach_clothing.py` | 短裤裁短、权重归并后，3 mm Solidify 之前连续扩宽与修正裤裆权重 |
| 4 | `tools/blender/style_coach_hair.py` | 人物网格与骨架创建后，保留原头发底层、删除卷束及发髻并外移 4 mm |
| 5 | `tools/blender/refine_coach_ankles.py` | 在已有脚部收缩基础上细化鞋口宽度及 Shin / Foot 权重 |
| 6 | `tools/blender/fix_coach_hem.py` | 为原上衣下摆增加局部包覆及延长 |
| 7 | `tools/blender/style_coach_outfit.py` | GLB 导出前最终设置浅灰上衣、灰袖口与哑光黑裤材质 |

已验证本机路径：`E:\AII\toolchains\blender\4.5.3\blender-4.5.3-windows-x64\blender.exe`。

```powershell
& 'E:\AII\toolchains\blender\4.5.3\blender-4.5.3-windows-x64\blender.exe' --background --factory-startup 'E:\AII-3D\3D-Body\assets\blender-studio-source\snow-rig-v4\Snow\snow_v4.2.blend' --python 'E:\AII-3D\3D-Body\tools\blender\build_coach.py'
```

脚本会保存派生的 .blend、GLB、关节点 JSON 与两张 Cycles 实际渲染。渲染优先使用本机 NVIDIA GPU，无 GPU 时回退 CPU。源人物文件只读，已验收的 `E:\AII-3D\3D-Wrist` 不参与修改。


### 重建独立静态参考

原 Human Base Meshes 包中的 Realistic male 已在本地保存；不要用 `build_coach.py` 将它替换到动作人物骨架。运行独立制作脚本：

```powershell
& 'E:\AII\toolchains\blender\4.5.3\blender-4.5.3-windows-x64\blender.exe' --background --factory-startup --python 'E:\AII-3D\3D-Body\tools\blender\build_fitness_reference.py'
```

源场景路径、原包和派生文件的校验记录见 `docs/anatomy-assets.md`。脚本写入 `fitness-reference.blend`、`fitness-reference.glb/json` 和实际渲染，静态窗只显示独立人物。旧 BodyParts3D 体表的复现脚本 `build_muscle_reference.py` 保留用于解剖结构模式。

## 2026-10-07 动画与模型优化（design/elegant-editor 分支）

- **关键姿势 v4（髋带腿）**：`public/coach/flare-sequence.json`，原稿完整保留为 `flare-sequence-before-rekey-2026-10-07.json`，`tools/rekey/rekey-flare.mjs --write` 从原稿复现（v3 在提交 5a71a30）。分腿形状固定在髋部坐标里（每侧外展约 56°），髋部朝向由“离胸口最近、屈髋在 -15°~110° 内”自动求出，所以髋与腿一起转；侧撑时分腿平面跟随胸口左右轴竖起（高腿上到耳侧），离地下限约束低腿 ≥0.23 m；第 10/16 步整个身体绕支撑手转到腿方位 ±135°，消除倒转；空手自动推离双腿 ≥0.36 m（受手臂长度限制，网格间隙 ≥8.6 cm）。整圈膝角 ≥176°。依据：Thomas flair 生物力学（进入阶段由躯干和下肢驱动髋部翻转；髋关节角度变动过大不利于轨迹稳定）。
- **v5 髋部圆弧轨迹**（用户反馈后侧髋部轨迹不够圆润饱满）：俯视看，v4 的髋在后撑段先往里缩再甩出（第 9 步在两条折线的尖角上，第 10 步髋和腿往相反方向走）。v5 把第 9/10/16 步的髋放到以 (0, -0.1) 为圆心、半径约 0.3 m 的圆上（第 10 步重新瞄准躯干，让支撑肩落在支撑手上方），运行时 `src/coach-motion.js` 的 `roundHipPath` 让循环序列的髋部沿相邻关键帧的 Catmull-Rom 曲线移动，不再走直线（`?hip=linear` 可对比旧行为）。后半圈半径 0.29–0.31 m，高度 0.80→0.68→0.56 m 连续下降。
- **v6 侧撑提前顶髋**（用户反馈：bboy 托马斯在侧面要肩+髋+核心一起发力，更早把下半身拉起来，后侧才好推进）：`liftHips()` 以支撑肩为轴整体转动第 10/11/12 步（支撑手不动），髋高 10: 0.80 m、11: 0.74 m、12: 0.60 m（v5 为 0.68/0.56/0.45），之后重新做分腿和空手避让；后侧圆半径相应收到约 0.25 m（AZ .27）。
- **v7 肩顶躯干整体推起**（用户纠正：bboy 托马斯靠支撑肩把腰、背、髋整块推起来再旋转，不是拧髋；腿不用开那么大，这是和体操托马斯最大的区别）：单手撑的第 10/11/12（及 14/15/16）步，骨盆朝向与躯干一致（`stradBody`，微屈髋 18°、单侧外展 30°），双腿顺着躯干延长线伸出；高度仍由以支撑肩为轴的整体翻起获得（`liftHips`）。双撑第 9/13 步外展 56°→36°。两脚间距 1.43–1.58 m → 0.93–1.20 m。
- **匀速播放**：播放时钟按手、脚、骨盆的实际位移调速，去掉循环接缝处 1 秒定格（重复的第 09 步）。只改时钟，不改姿势、K 帧和时间。`?pacing=raw` 对比原节奏。
- **分段脊柱**：`src/spine-helpers.js` 在 20 个可编辑关节之外增加两根隐藏的下/上脊柱辅助骨，每帧取骨盆与躯干之间的插值，腹部权重平滑分配，腰部不再在裤腰处折成一道硬折痕。存档格式不变，`?spine=off` 对比。
- **投影与环境光**：主光投射柔和阴影到透明接影地面，低强度 RoomEnvironment 反射。
- **模型瘦身**：`flare-coach.glb` 15.1 MB → 7.5 MB（gzip 约 3.7 MB），去掉无贴图时用不到的 UV 与第二套顶点色，KHR_mesh_quantization 量化；外观 PSNR 52 dB，与原版肉眼无差。脚本 `tools/slim-coach-glb.mjs`。


### 肌群解析卡片（2026-10-07）
- 人体：冷灰瓷感皮肤 + 深蓝短裤，菲涅尔轮廓光随肌群颜色变化；肌群区域改为有清晰轮廓线、细微肌纤维纹理、缓慢呼吸发光的“发光肌肉片”，打开时从中心向外点亮（仍是体表部位定位，不代表肌电数据）。
- 舞台：聚光灯渐变背景、淡网格、肌群色背光、脚下发光圆盘。
- 展开动画：卡片从被点击的热点处展开（缩放 + 模糊 + 圆角裁切），内容依次上浮，边框光扫一圈，人体区有一次扫描线，人体从侧转回正面；关闭时快速收起。`prefers-reduced-motion` 下全部关闭。
- 修复：画布尺寸改用 clientWidth，避免在缩放动画中被设成小尺寸导致模糊。

### 托马斯关键帧 v8（2026-10-07）
- 斜后方（第 10/16 步）双腿 Y 字向躯干折：屈髋约 62°，侧撑约 34°，换腿约 40°，两腿夹角约 60°；参考原稿手 K 姿态，不照搬。第 9 步后撑腿略抬（踝高约 0.42 m），避免绷脚触地导致膝盖被迫弯曲。
- 脚：按小腿方向重算，全程绷脚约 55°，无内外翻。原来脚掌方向是旧关键帧遗留的世界朝向，腿移动后脚尖会歪。
- 手：支撑手整段不在地面转动（右手 9→13、左手 13→9 方向固定，v7 第 10 步曾转 48°）；空手腕部自然伸直，手掌尽量朝地。

### 托马斯关键帧 v9（2026-10-07）：腿部主动剪刀摆动
- 依据真实 B-boy 托马斯：单撑时空手一侧的腿主动踢向同侧耳朵（这一踢把髋带高），另一条腿从下方低扫绕到前面，形成剪刀。
- 第 10/11/12 步：踢腿屈髋约 84°/74°/58°，扫腿约 40°/-4°/22°；平均屈髋保留 v8 的 Y 字。14–16 步镜像（换手后右腿上踢、左腿低扫）。
- 膝盖全程 176°，最低脚踝约 0.28 m，手腿无穿模。
