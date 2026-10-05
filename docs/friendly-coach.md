# 零预算友善卡通人体

用户最终方向是友善卡通健身人物、零预算，使用本机 Blender。默认展示完整运动人物，点选肌群时查看实际局部解剖，避免全身裸露的肌骨结构。此前现成收费模型文档保留为历史研究，不再作为本阶段的采购建议。

## 已交付资产

- 可编辑人物与灯光场景：`assets/coach/flare-coach.blend`。
- Three.js 模型：`public/coach/flare-coach.glb`。
- 真实关节点与来源：`public/coach/coach-rig.json`、`public/coach/ATTRIBUTION.md`。
- Blender 全身渲染：`output/blender/coach-preview.png`；面部近景：`output/blender/coach-portrait.png`。
- 可复现制作脚本：`tools/blender/build_coach.py`；七个必需生成 helper 及调用顺序见下文“用本机 Blender 重建”。

人物的身体、面孔、眼睛、眉毛、头发、衣服和鞋均来自 Blender Studio 免费发布的 Snow v4.2。这个项目使用完整成熟网格，调整运动服、肤色、表情和灯光。没有用球、柱等体块拼接人体。原始专业 rig 及贴图仍保存在 `assets/blender-studio-source/snow-rig-v4/Snow/`，未改动源文件。

## 当前人物与正式展示

当前人物为深棕短寸头、浅灰上衣、哑光黑色短裤和白鞋，保留自然掌弓与手掌厚度。网页使用 20 个平行变形骨，原有身体权重按身体区域归并，面孔表情烘焙后随头骨运动，服装与皮肤共用骨架。自然手掌版本的既有导出计数为 211,060 个 GLB 顶点；本次文档对齐没有重新导出模型或重跑下文所列的历史资产与姿势检查。

正式分步骤来自 `托马斯/16.json` 的原步骤 **9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 9**，末帧复用原第 9 步，保持保存的位置、手脚朝向及支撑锁定。网页展示的阶段名称遵照用户确认的画面方位，人物左／右支撑手则以保存的锁定标记为准。

升级此正式循环时独立备份旧展示，不改个人步骤与草稿。个人姿势通过“用于正式展示”显式采用：至少 16 步的库优先匹配正式来源的步骤 ID，否则按列表第 9–16 步再接回第 9 步；完整九步库可按列表发布。旧的 `5.json + 镜像4/3/2/1` 属于此前展示版本，不再是当前正式来源。

动作用于说明 Flare 的支撑与摆腿，需要真实运动捕捉时应另行采集；肌群功能颜色不是肌电激活百分比。

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

详细肌群来自独立的 BodyParts3D 4.0。它与 Snow 的比例、拓扑不同，所以只在选中肌群时展示对应的实际局部网格，不把它们宣称为卡通人物体内的精确肌肉。缺少独立结构的肌肉继续在内容中注明。

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
