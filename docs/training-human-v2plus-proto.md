# training-human-v2plus 原型（feat/human-v2plus，2026-10-19）

> 状态：**原型 / 草稿 PR**。替代被否决的 PR #9（MakeHuman 新身体，保留不动）。
> 思路：**身体完全用已验收的 training-human-v2**，只在上面"加东西"：手指骨骼 + 设计过的肌群分区高亮。
> 只新增文件 + `lib/render.mjs` 一行可选加载；`training-human-v2` 的 13 个源文件哈希、所有原有 spec、冻结批次都不变。
> 不设 `modelProfile: 'training-human-v2plus'` 的 spec 渲染结果与之前完全相同（human-v2plus.js 根本不加载）。

## 做了什么

| 项 | 内容 |
|---|---|
| 身体 | 与 v2 **同一个** `flare-coach.glb`、头、颈部修复（training-collar 照常按 v2 运行）、T 恤、短裤、鞋、比例、求解器、相机代码。v2plus 在运行时把 profile 映射回 `training-human-v2` 再求解，所以关节位置逐帧相同（对比帧实测关节最大差 0 mm）。 |
| 1 手指骨骼 | 每只手 15 根骨（拇指/食指/中指/无名指/小指 × 3 节），挂在 Coach_Body 原有 `leftHand`/`rightHand` 下。关节点取自 v2 手模型本身（指蹼以远各手指是独立网格，按切片中心定 MCP/PIP/DIP）。新骨的静止旋转为单位、逆绑定矩阵取自手骨 → **手指不动时蒙皮矩阵与手骨完全相同，静止网格就是 v2 网格**。权重只改手部顶点里"手骨"那一份（前臂份额和手以外所有顶点不动），按到手指骨链的距离分配、指蹼区平滑过渡，指蹼以远每根手指只属于自己；按 GLB 的 Uint8 归一化权重量化，整数和严格 = 255（否则会把顶点往世界原点拉出尖刺，已踩坑修复）。 |
| 手型 | `open`、`relaxed`、`palm-floor`、`grip-bar`、`band-grip`。`grip-bar` 用最小二乘拟合已验收的 v2 烘焙握杆拳形（`assets/grip-left.json`），并加 1.5 mm 不穿杆约束；`relaxed` 拟合 v2 的 v7 放松手（自由手的弯曲程度跟随引擎原来的 relax 权重，和 v2 一致）。spec 可用 `v2plus: { handPose: { left, right } }` 指定，未指定时按手的模式/道具推断（撑地 → palm-floor，gripHand/grip/dHandle/landmine → grip-bar，弹力带 → band-grip，其余 relaxed）。v2plus 下不再使用 v7 relax 变形与 `P.bakeGrip` 顶点烘焙（握把数据照常计算，道具位置与 v2 完全一样）。 |
| 2 扭转骨 / 多节脊柱 / DQS | **没有做**。v2 静止形状不需要它们，引擎也不提供额外自由度；加了只会带来风险。留作下一步（见"已知粗糙处"）。 |
| 3 肌群高亮 | 按开哥 10-19 的新方向：把 v2 身体当画布，**手绘每个肌群的分区形状**（圆角多边形 / 圆角带 / 椭圆），画在静止姿势表面的平滑展开图上：躯干圆柱展开 (s, y)、上臂/前臂/大腿/小腿各自的 (轴向 t, 周向弧长)。每个像素用插值后的静止位置实时求有符号距离，边缘用 fwidth 窄 smoothstep 抗锯齿 → 边界是干净的曲线，与网格密度无关，没有逐三角形的台阶；同一套坐标作用在皮肤、T 恤、短裤上，过衣服边缘不断；左右镜像。BodyParts3D 只作为位置参考，不追求解剖精确。共 22 个区域，覆盖 spec 用到的 25 个 group 名。 |
| 4 开关 | `modelProfile: 'training-human-v2plus'`（模型清单 `drill-anim/models/training-human-v2plus.json`，`defaultForNewDrills: false`）。`lib/render.mjs` 只在该 profile 时加载 `lib/human-v2plus.mjs`。 |

## 对比图（同一 spec、同一求解、同一机位；第三列红色 = 有变化的像素）

- `docs/reviews/human-v2plus-proto/compare-triceps-A.jpg` 窄距俯卧撑（t=0 / 2.1 s）
- `docs/reviews/human-v2plus-proto/compare-scapular-B.jpg` 单杠肩胛引体（t=0.4 / 1.9 s）
- `docs/reviews/human-v2plus-proto/compare-h-squat.jpg` 徒手深蹲（t=0.2 / 1.2 s）
- `docs/reviews/human-v2plus-proto/muscle-highlights-front.jpg` / `-back.jpg` 12 个肌群，正面 / 背面
- `docs/reviews/human-v2plus-proto/muscle-highlights-extra.jpg` 其余 spec 用到的肌群
- `docs/reviews/human-v2plus-proto/muscle-borders-zoom.jpg` 边界 1:1 特写（看抗锯齿和过衣服边缘）
- `docs/reviews/human-v2plus-proto/hands-floor-bar.jpg` 撑地手、握杆手特写：v2 | v2plus
- `docs/reviews/human-v2plus-proto/hand-poses.jpg` 5 种手型（rest = v2 原手）

triceps-A 和 scapular-B 的原 spec 没写 modelProfile（= legacy-v7），对比时左边统一按 `training-human-v2` 渲染，右边按 `training-human-v2plus`。

## 已知粗糙处 / 下一步

1. **v2 原来的高亮在部分帧本来就不显示**（如 h-squat 的股四头肌/臀大肌、triceps-A 的肱三头肌：旧 mmRest 坐标在短裤/袖子处偏移，已知问题），所以对比图里右边"多出"高亮是改进而不是身体变化。
2. 分区画在宽松短裤上时，短裤下摆比大腿宽，高亮在下摆处跟着衣服轮廓有一个台阶（坐标是连续的，台阶是衣服本身的形状）。
3. `grip-bar` 拟合 v2 烘焙拳形平均误差约 7 mm（拇指最大，约 10–18 mm）：v2 烘焙是逐顶点雕刻，含软组织挤压，刚性指骨做不到完全一样；正面看与 v2 相当、手指不穿杆。`band-grip` 只是把握杆姿势再收紧 12%，没有在真实弹力带动作里验证。拇指只有 CMC 一个三自由度关节 + 两个铰链。
4. 关节处用的是普通 LBS：握拳时指背关节处可见轻微折痕；没做 DQS / 纠正形变。
5. 撑地手（palm-floor）与 v2 原手几乎相同（v2 的平手本来就贴地），这一项改进不明显。
6. 指尖不与地面/杆做碰撞；手型是固定库 + 按 relax 权重插值，不做逐帧 IK。
7. `drill-anim` 的手部穿模 QA（`E.handClip`）仍按 v2 的 20 骨缓存计算，未计入手指骨。
8. 只验证了这 3 个动作 6 帧 + 站姿高亮表，未出全片；`soft-highlight`（glow-soft 主题）与 v2plus 同时开启时以 v2plus 分区为准，未单独验证。

## 紧身训练服（opt-in，2026-10-19 追加）

> 开哥要求：把宽松 T 恤 + 短裤换成健身教练式紧身压缩服（类似鲨鱼皮），身体比例、头、脖子与 v2 完全一样。
> spec 写 `modelProfile: 'training-human-v2plus', v2plus: { outfit: 'compression' }` 才生效；不写 `outfit` = 现在的衣服，其它一切不变。
> 可选 `v2plus.sleeve: 'long'`（不露手臂，保留 v2 原来"整只手臂涂成上衣色"的样子）；默认 `short`。

| 项 | 内容 |
|---|---|
| 调查结论 | **T 恤/短裤下面没有皮肤**：`Coach_Body` 只有袖口以下的手臂、短裤裤口以下的腿、手和脚，躯干和骨盆只有衣服本身。v2 的手臂皮肤原本被着色成上衣色、腿着色成裤子色（看起来像长袖 + 长紧身裤，外面再套宽松 T 恤和短裤）。所以没法"隐藏衣服露出皮肤"，改用备选方案：把衣服本身收紧（shrink-wrap）。 |
| 收紧方式 | `tools/human-v2plus/build_outfit.py` 从 v2 静止网格算出**平滑位移场**（位置的连续函数，所以衣服的内外两层、UV 接缝的重复顶点一起移动，不会撕开）：①躯干：按（角度, 高度）绕竖轴径向收缩，腹部/腰从胸部截面（y=1.20，不动）收到短裤腰部截面，腰线再收 3.6 mm；短裤腰头以下 T 恤下摆贴在短裤外面（外表面间隙 0.8–7 mm）。②袖子 + 袖口条：朝上臂轴收缩，袖口贴在手臂皮肤外约 3.5 mm。③短裤腿：朝大腿轴收缩，裤口外表面贴在大腿皮肤外约 1 mm，3 mm 的内层和裤口边藏进腿皮肤里面（不再有台阶和裤口阴影）。④Taubin 平滑去掉短裤裆部/臀部/腿上的褶皱和 T 恤腹部/背部的褶皱。⑤最后逐点检查 T 恤在短裤外面（≥0.8 mm），不足处平滑外推。 |
| 不动的部分 | 胸部、肩、领口/V 领区（y ≥ 1.24 的 T 恤顶点一个都不动），所以 `training-collar.js` 的修复不受影响（领口特写左右完全一致）；头、脖子、手臂和腿的皮肤、鞋、比例、求解器、相机都不动（对比帧关节最大差 0 mm）。 |
| 权重 | 只改短裤裤口一圈（y < 0.70）：复制大腿皮肤的蒙皮权重，深蹲时裤口贴着腿走。T 恤下摆本来就和短裤一样是 pelvis/spineLower，保持 v2 原权重（复制最近短裤顶点会把大腿权重带进后腰，深蹲时翘起一片，已撤回）；袖口也保持原权重。Uint8 量化后整数和 = 255。 |
| 渲染细节 | 衣服位置是 KHR 量化的 int16，写入时夹到 [-1, 1]（裤口最低一圈下移 0.01 mm 就会溢出回绕成 35 cm 的尖刺，已修）。紧身袖在抬臂时袖口会张开一点：紧身服模式下衣服双面渲染，从袖口看进去的内侧画成阴影色、不加橙色轮廓光（原来会露出一块橙色）。 |
| 短袖 | 袖口以下的手臂皮肤在 shader 里改成灰色皮肤（以袖口环拟合的平面为界，往袖子里多涂 6 mm，抗锯齿）。腿保持全长紧身裤（v2 本来就是裤子色），所以 tights 是全长版。 |
| 肌群高亮 | v2plus 的分区按静止位置逐像素计算；衣服收紧后同步更新了静止位置纹理，所以高亮在 T 恤、短裤、手臂、腿之间连续，没有在下摆处断开的问题（下摆处只剩几毫米的几何台阶）。 |
| 运行时 | `page/human-v2plus.js` 第 3 节：在加载时把位移从静止世界坐标解回绑定空间（`p' = 重置姿势蒙皮矩阵⁻¹ · (静止位置 + d)`），切换时只写入改动的顶点，关闭时原样恢复（顶点、法线、权重、静止纹理）。 |

图（左 = v2plus 现在的衣服，右 = 紧身服；同一 spec、同一求解、同一机位）：`docs/reviews/human-v2plus-proto/outfit/`
- `compare-triceps-A.jpg` / `compare-scapular-B.jpg` / `compare-h-squat.jpg`
- `standing-hl.jpg`（正 / 侧 / 背站姿，开几个肌群高亮）、`standing-plain.jpg`（不开高亮）
- `closeups.jpg`（腰部下摆前后、袖口、裤口 / 大腿、V 领）

已知粗糙处：
1. 下摆（T 恤盖在短裤上）仍是两层衣服，正面看得到一条细的下摆线；这是"上衣 + 紧身裤"的正常分界，不是穿模。
2. 躯干形状是从原 T 恤截面收紧来的，不是真实解剖身体；侧面腹部比原来平、腰更收，但胸大肌下缘没有雕刻出来。
3. 短裤腰部以上（被 T 恤盖住的部分）的缝线 / 腰头形状没有重做；臀部仍能看到原短裤的一点后中缝。
4. 袖口条（原 T 恤的袖口滚边）保留为一圈袖口，颜色跟上衣一样；抬臂（深蹲前平举）时袖口上沿会张开约 1 cm，看得到袖子内侧（已改为阴影色）。
5. 只验证了这 3 个动作 6 帧 + 站姿；没出全片，没测 `sleeve: 'long'` 以外的主题组合。

复现：
```bash
python3 tools/human-v2plus/build_outfit.py output/human-v2plus-work/rest.json drill-anim/models/training-human-v2plus-outfit.json
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/outfit.mjs output/human-v2plus-outfit
python3 tools/human-v2plus/outfit_sheet.py output/human-v2plus-outfit docs/reviews/human-v2plus-proto/outfit
```

## 基础网格躯干（opt-in，2026-10-19 追加）

> 开哥确认保留紧身服（收紧版）的样子，但希望衣服下面有真正的躯干。spec 写
> `modelProfile: 'training-human-v2plus', v2plus: { outfit: 'compression', torso: 'base' }` 才生效（写了 `torso: 'base'` 时 `outfit` 自动是 `compression`）；
> 不写 `torso` = 上面的紧身服，不写 `outfit` = 现在的衣服，其它一切不变。默认值不变。

| 项 | 内容 |
|---|---|
| 来源 | Blender 官方 **Human Base Meshes v1.4.1**（Blender Studio 与社区贡献者，**CC0 1.0**，https://www.blender.org/download/demo-files/ ），对象 `GEO-body_male_realistic`。原包 SHA-256 `811f43ac…3515`，来源记录见 `assets/blender-studio-source/SOURCE.md`。CC0 不要求署名，这里保留来源以便追溯。不需要 Blender：`tools/human-v2plus/torso-base/blendread.py` 直接读 .blend（底模 cage + multires 位移），Catmull-Clark ×2 + 位移。 |
| 拟合（只有平滑变形） | 相似变换 → 手臂 / 大腿按估计关节平滑重摆 → 双拉普拉斯正则的低频位移场贴到 v2 紧身服轮廓（stage A）。**腋窝抬高（stage A2）**：解剖底模的腋窝顶点在肩关节下约 12 cm，v2（紧身服）腋窝只在关节下约 4.5 cm；骨骼只有普通 LBS，关节下这么远的皮肤在手臂举过头时要么鼓成圆包（部分权重），要么拉成薄片（硬分界），所以用同类平滑位移场把腋窝顶点（含前后腋褶）抬到 v2 的袖窿高度（1.315 m，往前后褶升高 4 cm）。 |
| 缝合 | 在保留的领口带下沿、手臂皮肤焊接环（离肩 0.17 m）、腿皮肤上沿切开，环形吸附 + 逐顶点 zipper 到已有网格的环（208 个缝顶点，无洞）；缝顶点在运行时直接取被焊顶点的实时位置 / 权重 / 法线。接缝两侧二面角平均 2.9°（领口）/ 5°（手臂）/ 7°（腿），最大 12°。 |
| 权重 | **逐点复制紧身服自己的蒙皮**（它举手悬垂时是干净的 V 形）：每个躯干顶点找最近的、法线方向一致的源三角形（紧身 T 恤，含 training-collar 规则 / 紧身裤的 outfit 权重 / 可见的手臂、腿皮肤），按重心坐标插值权重，所以场是连续的，没有最近点的条纹。腋窝分界保持锐利：先做多数滤波（单个顶点与邻居中位数差 >0.5 时整点复制邻居权重，不引入部分权重），再做 30 次平滑但**切断跨分界的边**，只去掉三角形跳变带来的细褶。缝顶点权重 = 被焊顶点的权重。**腋窝顶点小块（2026-10-19 打磨）**：A2 抬高后腋窝顶部挤成几排很密的小三角形，转移来的手臂份额在 2 mm 内 0.4 / 0.7 交替，悬垂时这些边被拉长 10–20 倍，背面腋窝出现小暗褶 + 橙色轮廓光。只把这一小块（|x| 0.15–0.21、y 1.27–1.345、z −0.065–0.055）的权重改成边界的调和插值（边界固定），块外不变，不会重新引入大范围部分权重（肩部圆包的原因）。 |
| 涂色 | shader 画：腰线（y = 0.935）以上上衣色、以下紧身裤色。**短袖（默认）**：手臂权重的像素在紧身服袖口平面（同一平面、同样上移 6 mm）以下画成皮肤，袖长和紧身服版一致；切线上方 6 mm 的一圈颜色压暗 22% 当袖口边。袖口到焊接环之间这段露出的皮肤用焊接环下方 v2 手臂皮肤的法线（按绕手臂轴的角度匹配），跟 v2 手臂连成一段，没有灰带 / 台阶。**长袖 `sleeve: 'long'` 支持**：躯干整块上衣色，v2 手臂沿用原来"整只手臂上衣色"，焊接环看不出来。肌群高亮用同一套静止位置画布，跨缝连续。 |
| 运行时 | `page/human-v2plus.js` 第 4 节 `loadTorso` / `setTorso`：加载时把静止位置解回绑定空间（缝顶点法线经被焊顶点自己的蒙皮矩阵求静止法线：Coach_Body 手臂的绑定姿势和静止姿势不同，原来直接用作者法线，手臂焊接环法线差约 50°），作为第二个 SkinnedMesh 绑在同一骨架上；开时隐藏领口带以下的 T 恤、焊接环以上的手臂皮肤面、袖口条和短裤（只换 index / drawRange），关时原样恢复。只有 spec 写了 `torso` 才读这份数据（`lib/human-v2plus.mjs`）。 |
| 不动的部分 | 头、脖子、手、手臂和腿的皮肤、鞋、骨架、求解器、相机；对比 6 帧关节最大差 0 mm。 |

图（左 = 紧身服（当前 PR），右 = 基础网格躯干；同一 spec、同一求解、同一机位）：`docs/reviews/human-v2plus-proto/torso-base/`
- `compare-triceps-A.jpg` / `compare-scapular-B.jpg`（悬垂，手臂过头）/ `compare-h-squat.jpg`
- `standing-plain.jpg` / `standing-hl.jpg`（正 / 侧 / 背）
- `closeups-standing.jpg`（领口缝前后、肩、腋窝、手臂焊接环前后、腰、臀）、`closeups-hang.jpg`（悬垂时腋窝 / 肩前后、双肩正面）、`closeups-squat.jpg`（深蹲髋部折痕、臀、肩）
- 全片 `video/`（720×720，H.264，各 <0.3 MB）：`torso-base-<动作>.mp4`（spec 自带的肌群高亮关掉），动作 = triceps-A / scapular-B（h-squat 旧版修复前已删，待本地重出；mp4 被 .gitignore 忽略，不在仓库里）；`video/contact-torso-base-*.jpg` 是每段均匀抽 12 帧的缩略图。用 `drill.py render` 的临时 spec（`v2plus: { outfit: 'compression', torso: 'base' }`, `highlight: { groups: [] }`, `size: 720`；合成尺寸决定橙色描边/光晕粗细，用默认 1080 再缩到 720 描边会偏细）出帧后重编码，临时 spec 不入库。高亮版未出。

已知粗糙处：
1. 悬垂（手臂过头）时双肩不鼓包，轮廓是 V 形；背面腋窝的小暗褶已去掉（权重调和 + 腋窝顶点那块皱三角形的法线换成 6 环平滑法线，位置不动）。腋窝下沿轮廓上仍有正常的橙色轮廓光（紧身服版同样有）。
2. 为了能举手，腋窝比真实解剖高（跟 v2 一样），站姿正面看腋窝更"紧"。
3. 袖口是涂色（压暗一圈），不是几何滚边；背面特写里袖口到焊接环这段皮肤比下面略暗一点（约 4%）。
4. 只验证了这 3 个动作（全片）+ 站姿 + 特写；没测其它主题。离线检查工具 `posecheck.py` 只覆盖导出的 5 个姿势。
5. h-squat 手臂前平举（约 90° 屈肩）时近侧前腋窝的小橙色轮廓光 + 暗块已去掉：只改法线（腋窝缝顶 |x| 0.15–0.21、y 1.24–1.385、z ±0.065 一块，1.5 cm 平滑过渡，换成 40 环平滑法线，缝核心再往外侧偏），权重、位置、体形都没动，所以悬垂时肩部不会再鼓包。400 px 检查图里腋下只剩手臂下沿正常的一道细轮廓光（紧身服版同样有）。`video/torso-base-h-squat.mp4`、`contact-torso-base-h-squat.jpg`、`compare-h-squat.jpg`、`closeups-squat.jpg` 处理（2026-10-20）：`compare-h-squat.jpg`、`closeups-squat.jpg` 已按修复后重出；旧的 h-squat 视频和 `contact-torso-base-h-squat.jpg` 是修复前的，已删掉，成片改在本地（4080）出，这里不再跑整段视频。修复效果见关键帧 `keyframes-armpit-fix.jpg`（h-squat t=2.10 前腋窝、scapular-B t=1.90 双肩、站立前/后腋窝）：前腋窝橙色条和暗块都没了，深蹲底部手臂下沿只剩一道细轮廓光，不比紧身服版那道大；肩部无鼓包。
6. 悬垂时左侧腰部（髂嵴）有一个约 3 px 的小暗点 + 轮廓光；紧身服版同一位置也有，几何无翻面、权重无跳变，判断是光照下的自然轮廓，未处理。

复现（不需要 Blender；numpy / scipy，zstandard 或 zstd 命令行；首次会下载 50 MB 官方包并校验 SHA-256）：
```bash
/workspace/bin/heavy -- tools/human-v2plus/torso-base/build.sh          # -> drill-anim/models/training-human-v2plus-torso-base.json（约 1.5 分钟，结果逐字节可复现）
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/torso-base.mjs output/human-v2plus-torso-base --only drills,stand,close,hangclose,squatclose
python3 tools/human-v2plus/torso_base_sheet.py output/human-v2plus-torso-base docs/reviews/human-v2plus-proto/torso-base
```

## 复现

```bash
# 1) 导出 v2 静止网格 / 权重（一路 Chromium）+ v2 放松手
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/probe.mjs output/human-v2plus-work
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/probe-relax.mjs output/human-v2plus-work
# 2) 手指骨骼 + 权重 + 手型（numpy/scipy，几秒）
python3 tools/human-v2plus/build_hand.py output/human-v2plus-work/rest.json drill-anim/models/training-human-v2plus-hands.json output/human-v2plus-work/relax-left.json
# 3) 对比图（约 4 分钟，一路 Chromium）+ 拼图
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/compare.mjs output/human-v2plus
python3 tools/human-v2plus/sheet.py output/human-v2plus docs/reviews/human-v2plus-proto
```

不需要 Blender。依赖：Python numpy / scipy / Pillow。

## 烘焙肌群分区（opt-in，草稿，2026-10-20 M2 / M3 打磨）

> 开哥的想法：把肌群分区"烤"进身体本身，像 Thomas app 的人体模型那样：浅灰身体、整身分成肌群区、细深色分区线，高亮左右对称、标准、清晰，以后能用标签 + 箭头指向某块肌肉。
> spec 写 `modelProfile: 'training-human-v2plus', v2plus: { outfit: 'compression', torso: 'base', regions: 'baked' }` 才生效；不写 `regions` 一切不变（`lib/human-v2plus.mjs` 只在这时才加载 `page/human-v2plus-regions.js`）。

| 项 | 内容 |
|---|---|
| 分区表 | `drill-anim/models/training-human-v2plus-regions.json`（`tools/human-v2plus/regions/make_table.py` 生成）：42 个基础区 × 左右 = **84 个 id**（M3 在末尾追加了 `rectus-pubic`、`brachioradialis`，原 80 个 id 不变；shader 上限 96）（id = 2×基础序号 + 侧，0 = 左 = +x）。37 个肌肉区（胸大肌、腹直肌上/中/下、腹外斜肌、前锯肌、髋屈肌、颈前、斜方肌上/中下、菱形肌区、冈下肌/小圆肌、大圆肌、背阔肌、竖脊肌、臀大/中肌、三角肌前/中/后束、肱二头肌、肱三头肌、肱肌、前臂屈/伸肌群、股直肌、股外侧/内侧肌、缝匠肌、内收肌群、腘绳肌外/内、胫骨前肌、腓骨肌、腓肠肌外/内侧头、比目鱼肌）+ 头 / 手 / 脚（非肌肉区，只为分界）。表里有中英文名、侧别，和 25 个 spec 肌群名 → 新分区的映射（`groups`）；高亮也可以直接用基础区 key（如 `delt-front`）或 `regionIds`。 |
| 做法 | ①每个基础区是一个设计形状（圆角多边形 / 盒 / 椭圆 / 胶囊），画在静止姿势表面的平滑展开图上（沿用 v2plus 的躯干圆柱 + 上臂 / 前臂 / 大腿 / 小腿图，肢体绕缝线 wrap），加软的部位门（手臂权重、腹股沟—臀褶线、肘、腕、膝、踝、颈）；值是有符号距离，分区 = 80 个 id 取最小（中线用左右门），所以每个顶点都有区，形状之间的空隙对半分。②**逐顶点烘焙**：把相邻的区（同一三角形 / 顶点环，跨网格按静止位置焊接）贪心着色到 8 个通道，每个顶点存每个通道的最小距离和对应 id（每顶点 4 个 RGBA texel，顶点着色器按 gl_VertexID 读）。③**逐像素**：8 个通道距离线性插值，最小者 = 所在区，最小与次小之差 g 除以它的屏幕梯度长度（由两个通道各自的 dFdx/dFdy 相减得到，M3 修正）= 到分界的像素距离 → 固定约 2 px 宽的抗锯齿分区线，三角形内亚像素精确，焊缝两侧一致；高亮 = 选中的 id，分界处平滑过渡。浅灰 / 暗灰阴影 / 线色是 uniform。 |
| 运行时 | 加载时只打补丁（材质 onBeforeCompile 再包一层，cache key 加 `|v2pr`）；第一次启用时按当前衣服 / 躯干状态烘焙（约 10 s，15.6 万顶点，7 个网格：Coach_Body、颈部 Mesh001、头、鞋 ×3、领口带 Mesh005、基础网格躯干），状态变了才重烤。training-collar 会把自己的 hook 换到颈部网格上，所以每次切换 profile 时检查并重新包。 |

M3 打磨（2026-10-20）：
1. **虚线 → 连续线（已修）**：真正原因不是 z-fighting（大腿处只有一个网格，隐藏其他网格后照样断），而是线宽用了 `fwidth(f2-f1)`：g = f2-f1 在分界处是 |x| 形折线，2×2 像素块跨过分界时两侧的 g 相等，导数折到≈0 → 线宽算成无穷细，于是按三角形 / 像素块一段一段地断。改为用两个通道各自插值值的屏幕导数相减求梯度长度（整个像素块一致、不会折叠），线现在连续、等宽、抗锯齿。调试 uniform `uV2pRDbg`（1 线遮罩，2 距离条纹，3 区域 id 色）默认 0。
2. **形状**：腹直肌 4 行 × 2 = 8 块（新 `rectus-pubic` 最下一行）+ 白线；胸大肌下缘改成圆弧并扫到腋窝；斜方肌中下部改成参考图那样的大菱形（颈根→肩峰→T12），上部只留肩上缘；背阔肌改成从脊柱下段到腋窝的翼形，竖脊肌改成下背中央的菱形；腓肠肌内 / 外侧头改成下端尖的形状（内侧头更低），比目鱼肌包在两侧和下方；前臂加肱桡肌条（`brachioradialis`），伸肌群让出位置。左右仍然严格镜像；25 个 spec 肌群名全部有映射（`abs` 加 `rectus-pubic`，`forearms` 加 `brachioradialis`）。
3. **鞋**不再烘焙（保持原材质，无灰色、无分区线）；头 / 手 / 脚不再画左右中线（脸上的竖线去掉），只保留颈 / 腕 / 踝分界；轮廓光改成灰色（不再有粉边）。
4. **动作**：h-squat t=1.2（股四头肌 + 臀大肌高亮）、scapular-B t=1.9（背阔肌 + 肩胛区高亮）关键帧，线和高亮跟着变形的身体走，没有漂移或断裂。

图：`docs/reviews/human-v2plus-proto/regions/m3-front-back.jpg`（站姿正 / 背，无高亮 + 腹肌 / 背阔肌 / 小腿高亮，背 / 小腿 / 大腿 / 躯干特写），`docs/reviews/human-v2plus-proto/regions/m3-poses.jpg`（两个动作关键帧，全身 + 特写）。M2 草图 `draft-front-back.jpg` 保留作对比。
复现（只出关键帧）：
```bash
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/regions.mjs output/rg --size 640 --hl abs,lats,calves --extra "torso:0,1.15,0.05:0.6:0,0.05,1;back:0,1.15,-0.05:0.6:0,0.05,-1;calf:0.09,0.3,-0.05:0.4:0.2,0.05,-1;thigh:0.08,0.65,0.05:0.45:0.3,0,1"
python3 tools/human-v2plus/regions/sheet.py output/rg docs/reviews/human-v2plus-proto/regions/m3-front-back.jpg
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/regions-poses.mjs output/rgp --size 512
python3 tools/human-v2plus/regions/poses_sheet.py output/rgp docs/reviews/human-v2plus-proto/regions/m3-poses.jpg
```

还剩的粗糙处：
1. 三角肌前 / 中 / 后束仍按上臂图的角度直切，线条不如参考图那样顺；冈下肌 / 大圆肌的线从背后看靠近侧面轮廓，不太显眼。
2. 菱形肌区仍是斜方肌中下部里的一小块（为了 `scapular` 映射保留），参考图里没有。
3. `regions` 只在 `torso: 'base'` 下试过；只看了 h-squat 和 scapular-B 两个动作。
