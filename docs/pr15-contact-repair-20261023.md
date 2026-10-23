# PR15 接触与手型修复（本地候选）

基线为 PR #15 `aed8c0f9f634ccf8d2dd2a506e3d6e739ccfd98d`，分支 `codex/pr15-contact-repair`。
用户先要求修复审核发现的问题，随后明确指出两项扶髋姿态中的手指扭曲，要求继续优化。
本轮候选仍待用户看样，`releaseEligible:false`；不是整批动作验收或媒体发布。

## 前两轮候选：已被用户指出手形仍有问题

| 动作 | 规格 | 修复 |
| --- | --- | --- |
| 屈膝提踵 | `h-bent-knee-calf-raise-rr4` | 移除旧 touch，指尖沿大腿方向，手掌外移，隐式 relaxed 权重 0.2 |
| 肩靠椅单腿臀推 | `h-chair-single-leg-hip-thrust-rr5` | 相同手型修正；镜头 FOV 14，提高真实源像素占用 |

最初的 calf rr3 / hip rr4 只修掉旧接触求解器，用户对手型不满意。之后的 calf rr4 / hip rr5 调整腕姿和弯曲量，但用户再次指出掌指连接处扭曲。这四份规格及其输出保留作对照，不作为手形问题已解决的证据。
腿、髋、椅子、支撑、节奏没有修改；不把手改为承重支点，不改变动作训练目标。新手掌保持在身体外侧，不声称有严格贴肤接触。

旧 `touchBisect` 使用的网格集合不包含 v2plus 的新躯干。找不到法线时它会向腰部推进8次、每次15mm，最终返回0却未恢复手腕。本机对照已复现左右手腕各120mm异常内移。
新规格取消这个旧求解器。手型进一步将 finger 从几乎向前改为 `[0,-.95,.3]`，双侧 palmAt 调整为 `[±.18,1,.04]`，relax设0.2。不能显式设置 `handPose:'relaxed'`，因为冻结加载器会因此强制使用完整弯指量，忽略relax权重。
原姿态、open、向下open、向下浅弯四种近景均未消除掌指根部缺陷；继续调整整手方向不能替代模型修复。

## 掌指连接处的根因

关闭全部指骨旋转，并用普通光照单独显示手网格后，指根仍然呈折角、掌面仍有凹折。直接解码冻结 `training-human-v2plus-hands-base.json`，在不加载动画或蒙皮的情况下，左右手各发现224对严格非邻接三角面相交；每侧154对涉及拇指影响、70对涉及不同四指影响。分类来自骨骼权重，不等于精确解剖分区。检查排除共享顶点、共面和边界命中，数量是保守见证数，不是完整碰撞判定。

旧制作脚本 `tools/human-v2plus/hands-base/hands_a.py` 将源手指根重定位到旧v2指骨；其注释说明源/目标MCP可相差30mm、混合带约20mm，线性混合会折叠掌指皮肤。随后Poisson修整和thenar抬升不具备防自交约束。最终资产的腕缝检查不能证明整只手无折叠。这证明静止资产本身有错，但仅凭最终资产不能断言每个交点最早出现在哪个中间步骤。

本轮从经固定SHA核验的官方CC0源手重新制作，保留自然掌指形状，让新指骨匹配源手关节；新模型为 `training-human-v2plus-hands-native / 1.0.0-r1`，独立存于 `drill-anim/models/hands-native-r1/`。旧v2、v2plus、生产入口和已发布目录均保留。新规格为 calf rr5 / hip rr6，仅限这两个非承重手动作试用，待用户看样，不自动推广到握持、撑地或全库动作。

证据与本轮输出：`F:/PoseHub-v2-pilot/pr15-hand-root-20261023/`。`before-mesh/` 是无动画、无原材质影响的旧网格视图；`rest-intersections.json` 保存具体面号、顶点号及交点。

已完成的新模型验证：静止与 relaxed 0.2 两种状态，左右手严格自交见证均为0（旧模型分别为224/224和246/246）；非流形边0，两个33点边界圈仅位于手腕。`actions-r2/calf` 与 `actions-r2/hip` 各实际查看0、60、120、180、239、240帧，并查看60/120帧的左右手近景。两动作均无solver警告，0/240帧PNG逐字节一致。这里是稀疏预览，不声称完成新版全片或全库生产。

`mesh-comparison.png` 为固定视角、同样普通光照的旧/新静止网格对照，上排手背、下排手掌。`final-geometry-qa.json` 为最终数据的几何检查。16项局部测试通过，verify检查287份规格通过，portability 7项通过，catalog check通过。最后清除了新rig中从旧rig继承、已不适用的两项拟合统计与说明；手部位置、骨骼、姿态四元数、权重与已查看PNG的输入完全一致。

复现新模型预览（使用未存在的输出目录）：

```powershell
node drill-anim/models/hands-native-r1/preview.mjs drill-anim/specs/h-bent-knee-calf-raise-rr5.js <new-calf-preview-directory>
node drill-anim/models/hands-native-r1/preview.mjs drill-anim/specs/h-chair-single-leg-hip-thrust-rr6.js <new-hip-preview-directory>
```

不要将这两份独立模型规格送入会强制选择current配方的旧生产入口；这次只提供专用看样入口，是否推广到生产由后续审核决定。

## 腕部鼓包与弯曲折叠修订

用户指出 r1 拇指侧腕部鼓包后，进一步检查实际全身姿态。r1 静止/浅弯指自交为0并不能覆盖弯腕：第120帧 calf 左右分别114/118对、hip 66/64对手网格自交，手/前臂跨网格相交为0。接缝本身仍焊合，折叠位于掌与前臂之间的蒙皮过渡带。原近腕外形随整手等比放大，加上仅五圈的权重过渡，导致视觉鼓出和弯曲内侧挤压。

新独立版本 `hands-native-r2 / 1.0.0-r2` 采用近腕局部收窄（场峰值14%，最大位移约6.076mm），将前臂到手骨的过渡延展到手局部35mm，并采用三次 smoothstep 降低中段梯度。左右共19,212个保护区顶点的位置、法线、关节与权重逐字节不变，指骨rig复用r1；腕圈位置、权重与拓扑不变。规格为 calf rr6 / hip rr7，仅改id与显式模型版本，不改动作运动。独立 `refine_wrist.py` 可复现，r1工具与模型保留原固定哈希。

五次曲线在hip低位仍折叠；双四元数实验虽然可让20个采样的严格自交归零，但拇指根部出现额外褶皱，因此不采用。最终三次曲线的数据方案保持原运行时，不增加动态蒙皮补丁。20个实际骨骼姿态重算（每动作0、30、60、90、120、150、180、210、239、240帧）中，左右手自身与手/前臂严格相交见证均为0。静止网格左右也为0。几何计数是稀疏采样验证，不等于每一帧或全库通过。

本轮证据与各实验保留在 `F:/PoseHub-v2-pilot/pr15-wrist-refine-20261023/`。最终专用预览入口为 `drill-anim/models/hands-native-r2/preview.mjs`，输出另存 `final-preview/`。新版本继续 `reviewed:false` / `releaseEligible:false`，不替换 current 配方、不改已发布目录，不自动提交推送或全库重渲染。

最终另用 r2 loader 真实导出20个姿态的CPU顶点和每帧实际索引，避免仅靠离线蒙皮重算。`wrist-r2-actual-all.json` 记录左右手自交与手/前臂交叠共80项检查均为0，66个腕圈重复顶点按源ID焊合后最大偏差约0.000101mm。实际查看两动作各0、60、120、180、239、240帧的全身图，以及0/60/120帧左右手近景；两个动作的0/240帧PNG逐字节一致，solver警告为空。`wrist-before-after.png` 为同相机、同姿态、同材质的r1/r2对照。首轮并行验证曾因系统提交内存接近上限失败，之后降低并发，几何采集改为逐帧写出，保留首次失败记录。

最终20项相关回归测试通过；`verify.mjs` 在无渲染并发且Node堆上限256MB下重跑通过（289规格、旧规格哈希保留）；portability 7项和catalog check通过。所有本轮渲染与QA进程已退出。改动保存于本地 `codex/pr15-contact-repair` 工作树，尚未提交、推送或合入main。

## 整手比例与前臂接口重新匹配（r3）

用户复核r2后指出新手掌/近腕截面过大，随后看过native100试样反馈“好多了”。测量确认：r1按旧中指长度将完整源手放大约1.321倍，导致腕关节切面面积较源手增加约66.8%。r2只收近腕局部，仍增加约24.1%，并未解决整掌比例。接口点重合只能证明没有裂缝，不能证明形状和切线衔接自然；前一轮验收对此不足。

新 `hands-native-r3 / 1.0.0-r3` 从完整重摆后的源手按倍率1.0重建，网格和全部指骨关节点采用同一比例。相对r1/r2，整掌和指骨线性尺寸约为75.699%，没有分别压指根或只缩网格。保留既有前臂接口owner，重建连接过渡，使用三次平滑权重。前臂至手腕-40/-30/-20/-10/0mm截面宽度约57.18/56.41/55.54/54.56/55.64mm；跨接口面法线夹角中位约10.85°降至5.69°、最大22.76°降至12.57°。

独立检查还定位到姿态因素：原低位腕弯会把局部三角片切向长度压到静态约7%。新calf rr7 / hip rr8仅把自由手finger改为左`[-.12,-.95,.34]`、右`[.12,-.95,.34]`，略微顺前臂朝向；palmAt、normal、poleUp、手指弯曲量、腿髋运动、支撑、时间和相机保持原样。掌部目标不变，腕和肘随IK小幅重算。低位hip局部最差切向比例改善到20.2%，高位45.7%，calf37.3%。这是改善而非所有姿态形体完全合格，仍保留待人工视觉审核；不得仅凭0自交称全库可发布。

复现工具为 `tools/human-v2plus/hands-native/fit_hand.py`，专用加载/预览入口位于 `drill-anim/models/hands-native-r3/`。最终实际CPU导出每动作10帧，双手自交和手/前臂相交80项均为0，最大腕圈缝隙约0.000101mm。26项相关回归和portability 7项通过；catalog为291规格。r1/r2固定来源仍通过哈希核验。证据、同相机比例对比、试样和最终预览保存在 `F:/PoseHub-v2-pilot/pr15-wrist-fit-20261023/`；`transition-audit.md`保留压缩限制，`scale-audit.md`记录截面测量。

本次候选继续`reviewed:false` / `releaseEligible:false`，不替换正式生产配方，不改旧版本、发布目录或旧预览。代码与数据保存在本地修复工作树，未提交推送。

最终补验：`verify.mjs`通过291份规格，catalog check通过；实际看过两动作各0/60/120/180/239/240帧全身图，以及0/60/120帧双手近景。两动作0/240端点PNG逐字节一致，preview指标无warn/solverWarn。最终前后对比为`hand-fit-before-after.png`，保持相同近景镜头尺度；r3同时包含上述小幅finger方向修正，因此不称完全同姿态。稀疏预览已完成，不等于全片/全库发布审核。

## Windows 专用加载器（完整性验证记录）

`.gitattributes` 为独立模型清单引用的24个文本源固定 LF。已有工作树文本仅恢复清单要求的换行，每项转换前核对 LF SHA 和 HEAD blob；旧清单不改、完整性校验不跳过。
五套清单的实际字节哈希与 Git 属性测试通过。`contact-r5/preview.mjs`、`barefoot-r5/preview.mjs` 在本机各实际生成10张预览，均正常退出；这只验证入口恢复，不等同于接受这两个诊断动作的完整几何质量。

## 本地材料

- 首轮穿体修复与完整循环：`F:/PoseHub-v2-pilot/pr15-repair-20261023/`
- 手型四方案近景：`F:/PoseHub-v2-pilot/pr15-hand-study-20261023/`
- 最新手型候选：`F:/PoseHub-v2-pilot/pr15-hand-refine-20261023/`
- 最新视频与近景：最新目录的 `review/`；指标在 `review/qa.json`，逐帧指标在 `masters/realistic/<id>/metrics.json`。

review 视频是本地看样版，原配色、暗背景、肌群高亮，省略地面阴影；固定构图使用全周期轮廓并集，避免逐帧缩放。720×720、H.264、30fps、8秒。生成脚本拒绝覆盖已有 review 目录。

## 复现

配置独立批次目录和本机 renderer config；先用下面命令逐个生成预览。整机最多两路渲染。

```powershell
node drill-anim/tools/v2/render_layers.mjs --spec drill-anim/specs/h-bent-knee-calf-raise-rr4.js --root F:/PoseHub-v2-pilot/pr15-hand-refine-20261023 --skins realistic --frames 0,60,120,180,239,240 --layers body,highlight
node drill-anim/tools/v2/render_layers.mjs --spec drill-anim/specs/h-chair-single-leg-hip-thrust-rr5.js --root F:/PoseHub-v2-pilot/pr15-hand-refine-20261023 --skins realistic --frames 0,60,120,180,239,240 --layers body,highlight
```

看过预览后，去掉 `--frames ...` 并增加 `--reviewed`，生成240帧及独立240端点。此参数表示制作人员完成本次预览检查，不代表用户批准发布。

```powershell
python drill-anim/tools/v2/qa_layers.py --root F:/PoseHub-v2-pilot/pr15-hand-refine-20261023 --masters
python tools/action-package-v2/review_contact_repairs.py --root F:/PoseHub-v2-pilot/pr15-hand-refine-20261023
node --test drill-anim/tests/contact-manifest.test.mjs drill-anim/tools/tests/hand-touch-revisions.test.mjs
node drill-anim/verify.mjs
python drill-anim/test_portability.py
node drill-anim/tools/catalog.mjs --check
```

实际观察包括两动作起点、运动顶点、回程与手部近景。全帧指标用于发现数值异常，胶囊间隙不是全表面三角形碰撞证明；这轮不以旧 handClip=99 或 warn=[] 单独作为手型验收依据。
