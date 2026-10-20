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

## 烘焙肌群分区（opt-in，草稿，2026-10-20 M2 / M3 / M4 打磨）

> 开哥的想法：把肌群分区"烤"进身体本身，像 Thomas app 的人体模型那样：浅灰身体、整身分成肌群区、细深色分区线，高亮左右对称、标准、清晰，以后能用标签 + 箭头指向某块肌肉。
> spec 写 `modelProfile: 'training-human-v2plus', v2plus: { outfit: 'compression', torso: 'base', regions: 'baked' }` 才生效；不写 `regions` 一切不变（`lib/human-v2plus.mjs` 只在这时才加载 `page/human-v2plus-regions.js`）。

| 项 | 内容 |
|---|---|
| 分区表 | `drill-anim/models/training-human-v2plus-regions.json`（`tools/human-v2plus/regions/make_table.py` 生成）：42 个基础区 × 左右 = **84 个 id**（M3 在末尾追加了 `rectus-pubic`、`brachioradialis`，原 80 个 id 不变；shader 上限 96）（id = 2×基础序号 + 侧，0 = 左 = +x）。37 个肌肉区（M4 起菱形肌区退役，实际 36 个）（胸大肌、腹直肌上/中/下、腹外斜肌、前锯肌、髋屈肌、颈前、斜方肌上/中下、菱形肌区、冈下肌/小圆肌、大圆肌、背阔肌、竖脊肌、臀大/中肌、三角肌前/中/后束、肱二头肌、肱三头肌、肱肌、前臂屈/伸肌群、股直肌、股外侧/内侧肌、缝匠肌、内收肌群、腘绳肌外/内、胫骨前肌、腓骨肌、腓肠肌外/内侧头、比目鱼肌）+ 头 / 手 / 脚（非肌肉区，只为分界）。表里有中英文名、侧别，和 25 个 spec 肌群名 → 新分区的映射（`groups`）；高亮也可以直接用基础区 key（如 `delt-front`）或 `regionIds`。 |
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

M4（2026-10-20）：肩部形状 + 标注锚点
1. **三角肌**：前 / 中 / 后束的分界改成曲线（a = ±B(t)，从肩峰处约 6 cm 弧长收到止点约 1 cm，再加一个正弦弓形），三束在三角肌粗隆处汇合；前束是靠近锁骨 / 胸大肌的泪滴形，后束朝肩胛冈展开，中束在两者之间。三角肌外形多边形也改圆。斜方肌上部延伸到肩上缘—锁骨（躯干展开图在颈根处 s 很宽，之前那片被前束"抢"走，前束一直延伸到颈旁），三角肌门改为 `2×(0.118-|x|)`，前束只留在肩头。左右镜像。
2. **肩胛区**：斜方肌中下部的菱形收窄到肩胛骨内缘 + 肩胛冈；冈下肌 / 小圆肌移到肩胛冈下方、肩胛骨背面（下缘向内下斜到下角），大圆肌是从下角斜向腋窝的一条，背阔肌上缘让开——从背后看就是参考图那样的肩胛块。**菱形肌区退役**（之前 0 个顶点，只是占位）：id 20/21 保留（`kind: 'retired'`，形状永不取胜），`scapular` 映射改为 `trap-mid + infraspinatus + teres-major`。
3. **标注锚点**：每个区 id 一个稳定的表面点，写进分区表 `anchors`（`tools/human-v2plus/regions/anchors.py`，输入为 `regions.mjs --dump` 的静止姿势烘焙）：取该区三角形最多的网格，算面积加权质心，在区内"深度"（到区边界的图距离）≥ 最大深度一半的顶点里取离质心最近的那个；法线 = 该顶点一圈三角形的面积加权法线（朝外）。存 `mesh`、`meshVerts`、`vertex`、`rest`、`normal`、`ring`（顶点环三角形）、`ringSign`；`state` 记录烘焙状态（compression + base 躯干）。80/84 个 id 有锚点；缺的是 rhomboid（已退役）和 sartorius（缝匠肌条太细，0 个顶点，见下）。`make_table.py` 重写表时保留 `anchors`；改形状后要重跑 `anchors.py`。
4. **运行时 API**：`__v2p.getRegionAnchor(id)`（= `__v2p.regions.getRegionAnchor`）→ `{ id, key, side, position, normal, mesh, stale }`，当前姿势下世界坐标：锚点顶点和它的三角形环在 CPU 上蒙皮（`SkinnedMesh.getVertexPosition`，用最近一次摆好的骨骼），法线由蒙皮后的三角形重算。`stale` = 当前烘焙状态和锚点计算时不同。调试叠加：`__v2p.regions.showAnchors(true[, ids])` 在高亮区（或给定 id）的锚点画红点 + 6 cm 法线短棍（scene.onBeforeRender 里刷新），还没有文字 / 箭头 UI。
5. **工具**：`regions.mjs` 的 `--extra` 第 5 段可写高亮组 / 基础 key（逗号分隔）或 `dbg3`（区域 id 色）；`--dump` 额外导出三角形索引；`regions-poses.mjs` 加 `--hl`、`--anchors`、`--stand`、`--only`；`regions/offline.mjs` 不开浏览器、按 dump 重新算每顶点分区（改形状时 1 s 自查顶点数）；`regions/grid_sheet.py` 拼带文件名的关键帧网格。

图：`docs/reviews/human-v2plus-proto/regions/m4-shoulders.jpg`（肩部正 / 侧 / 背特写：无高亮、前束、中束、后束 + 冈下肌、大圆肌 + 斜方肌中下部；站姿背面无高亮 / 三角肌 + 肩胛区高亮），`m4-anchors.jpg`（锚点调试：站姿正 / 背、h-squat t=1.2、scapular-B t=1.9；胸、背阔肌（含大圆肌）、股四头肌、冈下肌），`m4-poses-shoulders.jpg`（h-squat t=1.2、scapular-B t=1.9，三角肌 + 冈下肌高亮）。
复现（只出关键帧）：
```bash
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/regions.mjs output/rg5 --size 640 --dump --hl deltoids,scapular --extra "4-back:0.13,1.28,-0.02:0.5:0.45,0.1,-1;5-back-hl:0.13,1.28,-0.02:0.5:0.45,0.1,-1:delt-rear,infraspinatus"
PYTHONPATH=/workspace/work/pylib python3 tools/human-v2plus/regions/anchors.py output/rg5/dump.json
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/regions-poses.mjs output/rga --size 512 --anchors --stand --hl chest,lats,quadriceps,rotator-cuff
PYTHONPATH=/workspace/work/pylib python3 tools/human-v2plus/regions/grid_sheet.py out.jpg --cols 3 output/rga/raw/*.png
```

还剩的粗糙处：
1. 缝匠肌（`sartorius`）是 6 mm 宽的线段形状，烘焙后 0 个顶点（M3 起就这样，之前没发现）：图上看不到，也没有锚点；要么加宽成条带，要么并入股直肌 / 内收肌。另外大圆肌、肱肌、腓骨肌顶点很少（< 200），锚点"深度"只有 1。
2. 锚点只对 compression + base 躯干这个烘焙状态有效（`stale` 会标出来）；位置来自 CPU 蒙皮，不含着色器里的额外位移（若有），贴面误差几毫米级，调试图上看不出偏。
3. 斜方肌中下部在肩胛冈上方向外伸到肩峰，背面看像 T 形；参考图里冈上部分不单独画，可以接受，但还可以再收。
4. `regions` 只在 `torso: 'base'` 下试过；动作只看了 h-squat 和 scapular-B。

M5（2026-10-20）：补完肌肉区 + 文字 / 箭头标注
1. **缝匠肌**：改成一条可见的斜向条带，髂前上棘（大腿前上外侧）→ 膝内侧（折线 `SART`，大腿展开图）。细条在 argmin 里会输给它穿过的股四头肌大区内部，所以它的距离乘 `SART_K = 4`（连续，烘焙里没有跳变），和邻区相接处约 1.4 cm 宽；股直肌 / 股外侧肌的上端相应下移、内收肌上端外扩，条带内侧不再留股直肌碎片。左右镜像，有锚点。大圆肌、肱肌、腓骨肌加宽（顶点 ~280 / ~160 / ~75，锚点都在区内，深度 ≥ 2–3）。锚点重烘焙：**82/84**，只缺退役的 rhomboid。
2. **斜方肌**：改成经典的风筝形——上部纤维（`trap-upper`）从颈到肩峰并盖住冈上区；中下部（`trap-mid`）在上部下方，外缘从肩胛冈内侧端（展开图 b ≈ 0.09）向内下收到约 T12 的脊柱上，不再沿肩胛冈伸到肩峰（M4 的"T 形"去掉）。冈下肌上缘相应下移到肩胛冈。左右镜像。
3. **标注（默认关闭）**：`__v2p.setLabels(list, opts)`（= `__v2p.regions.setLabels`），`list` 项为 `{ id }` 或 `{ key: 'delt-front', side?: 'L'|'R' }`，可带 `text`；`null` / `[]` 关闭。只给基础 key 不给侧别时，每帧取锚点更朝向相机的那一侧，文字去掉"（左 / 右）"。`opts`：`lang`（`'zh'` 默认 / `'en'` / `'both'`）、`auto: true`（另外给所有高亮的基础区各加一个标签，最多 `maxAuto` = 8）、`fontPx`（默认画面高 / 40）、`color`。每帧（标注层自己的 onBeforeRender）：锚点（`getRegionAnchor`，当前姿势）画小圆点 → 沿投影法线的引线 → 水平折线到身体左 / 右侧的标签列（按锚点投影在身体中线哪一侧；列位置 = 关节投影外包 + 边距）；同侧标签按高度排序后推开（不重叠、不出画面）；锚点背向相机时淡出（法线·视线 0.05–0.35），完全背向就不画。实现：2D canvas → CanvasTexture → 全屏四边形（不做深度测试、renderOrder 最后），和场景同一次 WebGL 渲染，所以截图 / 逐帧导出都带标注；没有新依赖。`__v2p.regions.labelState.items` 给出每个标签的文字、侧别、透明度、锚点和文字框（像素），便于自查。
4. **工具**：`regions-poses.mjs` 加 `--labels`（站姿正 / 背用固定的 5 个标签，动作帧 auto 标高亮区）、`--views`（只出指定视图）、`--lang`；无头 Chromium 没有中文字体，工具注册 `tools/human-v2plus/regions/label-font-zh.woff2`（14 KB 的 Noto Sans SC 子集，只含分区表里的中文名，SIL OFL），运行时字体列表里它排第一，其后是系统中文字体（PingFang / 微软雅黑 / Noto CJK）。

图：`docs/reviews/human-v2plus-proto/regions/m5-fixes.jpg`（缝匠肌正面 / 内侧、斜方肌背面高亮 / 无高亮、大圆肌 + 肱肌、腓骨肌），`m5-labels.jpg`（站姿正面 5 个标签、站姿背面 5 个、scapular-B t=1.9 背面 auto、h-squat t=1.2 正 / 背 auto）。
复现（只出关键帧）：
```bash
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/regions.mjs output/m5c --size 560 --dump --extra "1-sartorius-front:0.08,0.62,0.05:0.55:0.15,0.05,1:sartorius;3-trapezius-back:0,1.22,-0.05:0.6:0,0.05,-1:trap-mid,trap-upper"
PYTHONPATH=/workspace/work/pylib python3 tools/human-v2plus/regions/anchors.py output/m5c/dump.json
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/regions-poses.mjs output/m5l --size 560 --stand --labels --views stand-front,stand-back,front,back
```

还剩的粗糙处（M5 后）：
1. 标注没有遮挡测试（只看法线朝向）：h-squat t=1.2 正面"股直肌"的锚点被手挡住，圆点画在手上。可以加关节胶囊的屏幕空间遮挡检查，或读深度。
2. 引线水平段会横穿身体（锚点在身体中间时，如腹直肌、斜方肌中下部），和解剖图一样可以接受；标签多于 ~6 个 / 侧时只是堆叠，不会换列。
3. 缝匠肌在穿过股内侧肌上端处（大腿内侧中段）边界有些碎（三角形较大处几个零碎小块），正面看是完整的条带。
4. 上面 M4 的第 2、4 条仍然成立；M4 的第 1、3 条已在 M5 解决。

## 基础网格四肢（opt-in，2026-10-20 打磨第 1 步 / M6）

> spec 写 `v2plus: { outfit: 'compression', torso: 'base', limbs: 'base' }` 才生效（必须同时有 `torso: 'base'`，只支持短袖；可再加 `regions: 'baked'`）。
> 不写 `limbs` = 上面的基础网格躯干，一切不变（`training-human-v2plus-torso-base.json` 重新构建后逐字节相同，默认 anchors 不变）。

| 项 | 内容 |
|---|---|
| 来源 | 和躯干同一个对象：Blender **Human Base Meshes v1.4.1** `GEO-body_male_realistic`（CC0），同一份 L2 细分 + multires 位移（`male_l2.npz`）。 |
| 范围 | 手臂：躯干的手臂焊接环（肩下 0.17 m）→ 前臂上距腕关节 3.5 cm 的腕环；腿：躯干的腿环（y 0.631）→ 踝环 y 0.19（在 v2 紧身裤脚口 0.17 和鞋口 0.112 之上，所以脚口、鞋口仍是 v2 原样）。手、脚、头、脖子、鞋、骨架、求解器都不动。 |
| 拟合（只有平滑变形） | 底模关节按切片估计（肩 = 躯干构建的估计值，腕 = 前臂最细切片，膝 / 肘按 v2 的上下段比例），每段（上臂 / 前臂 / 手，大腿 / 小腿 / 脚）相似变换到 v2 的关节上，关节处 ±3 cm 平滑混合；再用双拉普拉斯正则的低频位移场贴到 v2 手臂 / 腿皮肤（λ 8000→2500，只 3 轮，保留肌肉中频形状）。 |
| 缝合 | 4 个上环直接焊到躯干焊的同一组 Coach_Body 环顶点（躯干缝顶点和四肢缝顶点运行时都取同一个 Coach_Body 顶点的实时位置 / 权重 / 法线，所以无缝无洞）；4 个下环焊到 v2 手 / 脚的环。切口停在环前 4 mm 再 zipper（直接贴到环上会产生零宽三角形，第一版腿环处有一条黑色锯齿线，就是这个原因），接缝 5 环双拉普拉斯平滑，两侧都有固定 ghost 环（Coach_Body 一侧 + 躯干网格一侧）。翻面三角形 0。 |
| 权重 | 被替换的 v2 手臂 / 腿皮肤自己的权重做最近点重心插值（源距离 p50 0.5 mm / p99 4 mm），10 次轻平滑，缝顶点 = 被焊顶点的权重。腕环顶点都不在 v2plus 手部重写权重的顶点里（检查 = 0）。 |
| 涂色 / 运行时 | 第 5 节 `loadLimbs` / `setLimbs`（和躯干共用 `buildPiece`）；色调权重：手臂皮肤、腿（waistY 以下）紧身裤色；隐藏 Coach_Body 两环之间的手臂 / 腿面（hideFaces 含躯干自己的，所以在 setTorso 之后应用，关时恢复到躯干模式的 index）。`lib/human-v2plus.mjs` 只在 spec 写了 `limbs` 时才读这份数据（0.95 MB）。 |
| 肌群分区 | `regions: 'baked'` 时自动烘焙到新网格（bake key 带 `limbs`，7→8 个网格）；anchors 另存在 `anchorsByState["{…\"limbs\":\"base\"}|torso"]`（82/84，只缺已退役的 rhomboid；27 个落在四肢网格上），运行时按当前 bake key 选，`getRegionAnchor` 不 stale。L/R 镜像；hamstring-lat 左右落在不同网格是原来就有的（默认 anchors 一样）。 |
| 验证 | 4 个关键帧（h-squat t=1.2、scapular-B t=1.9、h-db-rdl t=2.3、chest-A 俯卧撑底部 t=1.15）开 / 关四肢关节最大差 **0 mm**（`limbs-check.mjs`）；`verify.mjs`、`git diff --check` 通过。 |

图：`docs/reviews/human-v2plus-proto/limbs-base/`
- `sketch.jpg`：方向草图（离线 numpy 渲染，静止姿势，粗裁剪）：左 v2 四肢，右基础网格四肢。
- `stand.jpg`：站姿正 / 背 / 手臂 / 腿特写，左当前（躯干 base + v2 四肢），右 `limbs: 'base'`。
- `poses.jpg`：上面 4 个关键帧（全身 + 肘 / 膝 / 肩 / 髋特写），同一求解、同一机位。
- `regions.jpg`：`limbs: 'base'` + `regions: 'baked'` 站姿正 / 背（无高亮 + 腹斜肌高亮示例）。

已知粗糙处 / 下一步：
1. 改善主要在腿（膝盖不再是圆球，股内侧肌 / 小腿腓肠肌轮廓、跟腱）和前臂形状；toon 着色下手臂差别较小。拟合较紧（残差 1.3 mm），再松一档（只 2 轮）位移 p50 只差 1.6 mm，没换。
2. 手仍是 v2 的手：底模的手要重新做手指骨骼权重 + 5 个手型 / 握姿拟合，超出这一步的时间盒，没做。
3. 只支持短袖（`sleeve: 'long'` + `limbs` 会报错）。
4. 只看了这 4 个关键帧 + 站姿；其它动作（深屈膝、手臂过头负重等）没测。

复现（不需要 Blender，需要先跑躯干构建拿到工作目录）：
```bash
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/probe.mjs output/human-v2plus-work      # rest.json
/workspace/bin/heavy -- tools/human-v2plus/torso-base/build.sh
/workspace/bin/heavy -- tools/human-v2plus/limbs-base/build.sh       # -> drill-anim/models/training-human-v2plus-limbs-base.json（< 1 分钟）
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/limbs-poses.mjs output/human-v2plus-limbs --set stand   # 或 --set poses
python3 tools/human-v2plus/limbs_sheet.py output/human-v2plus-limbs out.jpg h-squat-t0.00
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/limbs-check.mjs                     # 关节差 + anchors
# 分区 anchors（改了四肢网格后重跑）：
/workspace/bin/heavy -- tools/human-v2plus/run.sh tools/human-v2plus/regions.mjs output/rg-limbs --limbs --dump
python3 tools/human-v2plus/regions/anchors.py output/rg-limbs/dump.json '{"outfit":"compression","sleeve":"short","torso":"base","limbs":"base"}|torso'
```

## M7 hands-base (2026-10-20) — opt-in `v2plus.hands:'base'`

`v2plus: { outfit:'compression', torso:'base', limbs:'base', hands:'base' }` swaps the v2 hands for the hands of the same Blender Human
Base Meshes v1.4.1 realistic male (CC0). Needs `limbs:'base'` (throws otherwise); defaults and every existing option are unchanged
(`verify.mjs`: originalSpecHashesPreserved true). Build: `tools/human-v2plus/hands-base/build.sh` (numpy/scipy, < 30 s) ->
`drill-anim/models/training-human-v2plus-hands-base.json` (22 890 verts, 45 710 faces, 1.06 MB).

- Retarget (hands_a.py, left hand in hand-bone local coordinates): base hand from limbs stage A *before* its skin fit; fingertips =
  geodesic local maxima; per-finger re-pose onto the v2 phalanges at the base/v2 hand scale 0.757 (palm scaled 1/0.757, faded to
  identity at the wrist ring). Thumb: the base's adducted thumb turns ~60 deg out; thumb / palm split by geodesic distance from
  the thumb tip, harmonic rotation (+ stretch) field over the thenar band and a Poisson solve of the rotated edges (no folds or
  tears; linear blending folded the web). Finger roots get the same Poisson pass (base MCPs sit up to 3 cm from the v2 ones).
- Right hand = exact mirror of the left in hand-local coordinates (same mirror as the finger rig). Weld (hands_b.py): cut at the
  same Coach_Body wrist rings the limbs piece ends at, arc-length snap 4 mm short of the ring, zipper to the exact ring vertices,
  ghost-ring fairing (the limbs piece's first ring across the seam): 0 folded / flipped zipper faces (max dihedral 23 deg),
  limbs + hands closed at both rings.
- Runtime: `V2P.loadHands` / `setHands`, piece `V2P_Base_Hands` bound to **Coach_Body's** skeleton (the grafted `v2p_*` finger bones;
  `buildPiece` takes `data.skin`), so the named hand poses drive it like the v2 hand; always skin-painted; hides everything limbs
  hides plus the Coach_Body hands beyond the wrist rings. Regions: the bake picks the piece up (no region lines on the hands);
  label anchors reuse the limbs state's set (`anchorKey`), since no anchor sits on a hand.
- Checks: `tools/human-v2plus/run.sh tools/human-v2plus/hands-poses.mjs <out>` (limbs vs hands, whole body + hand close-ups,
  joint max diff 0.0000 mm at h-db-rdl 1.2 / scapular-B 1.9 / chest-A 1.15 / h-squat 1.2); `regions.mjs --limbs --hands`.
- Images (`docs/reviews/human-v2plus-proto/hands-base/`): `sketch2.jpg` / `sketch2-closeup.jpg` (offline v2 vs base, thumb web),
  `poses.jpg` (key frames), `regions.jpg` (regions bake with hands). `sketch.jpg` = the earlier folded thumb.
- Remaining: the thenar sits a few mm below the palm plane at rest; palm-floor (chest-A) left hand not checked close up (camera
  inside the body), right hand fine; a faint shading line can show at the wrist weld in some lights.
- `sleeve:'long'` with `limbs:'base'` (with or without `hands:'base'`) now works: the base-mesh arms are top colour down to the
  wrist weld ring with the darker 8 mm cuff band (`uV2pLimb` on the limbs piece only, wrist planes `uV2pWristL/R` from the ring
  centroids + forearm->hand direction at reset); legs and the short sleeve unchanged. `hands-poses.mjs --sleeve long`,
  `sleeve-long.jpg`.

## M8 hands polish (2026-10-20) — `hands:'base'` only; defaults unchanged

- **Thenar** (`tools/human-v2plus/hands-base/thenar.py`, called by hands_b.py on the left hand before mirroring): the retargeted thenar
  pad hung up to ~14 mm palmar of the hypothenar pad line at rest (side profile: a lump under the palm). Reference = the hypothenar
  pad's most palmar point per 5 mm bin (linear in x, flat across the palm); the thenar's excess is soft-clamped to ≤ 2 mm (tanh) and the
  lift is spread as a Laplacian-relaxed displacement field (max lift 10.4 mm, residual excess ≤ 4.4 mm where the region fades out).
  Thumb proper, wrist ring and finger roots are outside the region, so the weld and the grips are unchanged.
- **Wrist weld normals**: the wrist seam vertices used to take Coach_Body's own (v2 forearm) rest normal at runtime and the first rings on
  both sides blended toward it — up to 9.5° off either welded surface, which showed as a faint line in some lights. Now
  `seam.ownNormals` (hands JSON): one normal per wrist seam vertex = area-weighted face normals of both pieces, then the normals (not
  positions) are relaxed over 5 rings on both sides as one surface (the zipper band's small ripples made the toon terminator step).
  The limbs piece gets the same normals for its wrist seams + 5 rings (`limbsNrm`, 927 verts, converted to bind space in `loadHands`,
  swapped in / out by `setHands`), so limbs-only mode keeps its weld to the v2 hand exactly as before. `H_WELDN=0` rebuilds the old way.
- **chest-A t=1.15 left hand** (palm on the floor) checked with cameras outside the body: flat palm, fingers on the floor, no folds.
- Check: `tools/human-v2plus/run.sh tools/human-v2plus/hands-poses.mjs <out> --set fix` (hands only, 6 close-ups incl. the h-db-rdl 1.2 grip; `HANDS_JSON=<file>`
  loads another hands build for an A/B). Image: `docs/reviews/human-v2plus-proto/hands-base/fix.jpg` (top: M8; bottom: wrist welds with
  the old seam normals). `verify.mjs` originalSpecHashesPreserved true. Tag `v2plus-hands-fix`.

## M8 head-base sketch (2026-10-20) — direction only, not implemented

`docs/reviews/human-v2plus-proto/head-base/sketch.jpg` (offline raster, `tools/human-v2plus/head-base/sketch.py`): top = the current
head (`Toon_Mannequin_Head_v5`), bottom = the Blender Human Base Meshes v1.4.1 realistic male head (CC0, same `male_l2.npz` as the
torso / limbs / hands), aligned by skull depth and ear position (base frame + (0, 0.043, 0.012 − 0.035)); front / 3-4 / profile.
The base head is clearly better (jawline, cheekbones, brow, nose, lips, ears; same skull height 1.727 vs 1.729, width 0.183 vs 0.193,
depth 0.220 vs 0.221), so `head:'base'` is worth doing — but it is a milestone of its own, not a polish step, for these reasons:

- The current head is a separate, rigid mesh (100 % `head` bone) ending in a flat 230-vertex neck ring at y 1.479 (r ≈ 6.6 cm); it is
  not welded to anything. The torso piece ends at the V-neck collar weld (y 1.33–1.45, tee collar band). A hole-free `head:'base'`
  therefore needs the base **neck** too, from the torso piece's top loop up to the head.
- Plan: cut the base head + neck from `male_l2.npz` above the torso piece's collar loop (same source mesh, so the neck continues the
  torso's own surface almost natively), similarity-align (above), fit the lower neck to the torso loop with the hands-style arc-length
  snap + zipper + ghost-ring fairing; the seam is piece-to-piece (torso piece vertices), so `buildPiece` needs a seam source that is
  a v2plus piece (skinned positions / weights / normals of `V2P_Base_Torso` at reset) or the torso build must emit the neck itself.
- Eye openings of the base mesh are holes (no eyeballs): cap each loop with a slightly convex harmonic dome (neutral closed-eye look),
  or fill with a sphere segment. Mouth is closed in the base mesh (fine).
- Weights: `head` above the jaw / occiput, `neck` → `torso` blend down the neck (transfer from the torso piece at the seam).
  Hide `Toon_Mannequin_Head_v5` (hideMeshes) and keep the skin material (skinPaint).
- Key frames to check: standing front / 3-4 / profile, scapular-B t=1.9 (head between the arms), h-db-rdl t=2.3; joints must stay 0.000 mm.
Suggested as M9 with a draft-first image (one standing front + profile) before the full build.

## M9 skins (2026-10-20) — `__v2p.setSkin(name)` / spec `v2plus.skin`; defaults unchanged
Game-style presets on the same mesh: only shader uniforms of the baked-regions pass (`page/human-v2plus-regions.js`, `V2P.SKINS`) plus the toon highlight colour. No skin set = the look as before (no-skin specs never load the regions file; `regions:'baked'` without a skin keeps the draft atlas uniforms exactly).
- Presets: `tech-white` (white matte body, shoes included, cyan glowing outlines), `neon-night` (graphite body, neon purple lines, cyan rim, for dark backgrounds), `hologram` (semi-transparent cyan-blue body, bright lines, rest-space scan lines), `plaster` (off-white sculpture, thin soft outlines), `realistic` (the compression outfit look, outlines off). `null` / `'default'` = no skin.
- Per preset: body lit / shade colour, outline colour / half-width px / opacity, glow `[halo falloff px, strength]` (emissive halo from the per-pixel border distance, computed in the shader, so it works in the headless render path, no post pass), fresnel rim colour, lit tint, active-muscle highlight colour + shade, and `bg` (suggested background centre / edge for the compositor, `__v2p.skinState().bg`).
- Hologram transparency: the material stays opaque (no blending, normal depth test), and the fragment writes premultiplied colour + alpha straight into the transparent canvas. Only the front-most surface shows, so there's no transparency sorting between pieces.
- Which skin applies: `spec.v2plus.skin`, else the `setSkin` override, else none. An outline skin turns the baked regions on, `realistic` turns them off. Works with torso / limbs / hands:'base' (the regions bake covers every piece).
- Check: `tools/human-v2plus/run.sh tools/human-v2plus/skins.mjs <dir> [--size 360] [--only ...]` then `python3 tools/human-v2plus/skins_sheet.py <dir> <out.jpg>` → `docs/reviews/human-v2plus-proto/skins/compare.jpg` (top: h-squat t=0 standing 3/4 front; bottom: h-db-rdl t=1.2 with glutes + hamstrings highlighted, rear 3/4).
- Known limits: the glow stays on the body surface (no bloom past the silhouette). Neon-night's head / hands read a little lighter than the torso because of the rim. The production compositor doesn't read `bg` yet.

### M9b skins redo (2026-10-20) — premium / restrained 1–3, A/B variants
Feedback: plaster + realistic good; 1–3 right idea but colours ugly and lines far too thick. Redo (plaster / realistic untouched):
- Lines: hairline, `lw` 0.5 px half-width (screen-space border distance, AA → ~1 px at any framing; was 1.0–1.1 + fat glow), opacity 0.42–0.65, glow off or a faint 1–1.4 px halo at 0.05–0.10.
- Highlight: new per-skin `hi.a` (opacity, 0.58–0.80) and `hi.fe` (soft inward edge, 5 px; no seam between two selected regions); hologram `scan` frequency 520/m (was 251), strength 0.12–0.16. Uniform `uV2pRHi` defaults [0.94, 1, 251.3] = old behaviour for no skin / plaster.
- Colours are sRGB hex in the source (`L()` → linear). Presets (A = plain name, B = `-b`):
  - `tech-white` body #e9ecf0 / shade #a3aebd, line #7f93a8 @0.55, highlight muted coral #e08a72 @0.78, bg #eef1f4→#b9c1cb. `tech-white-b` body #e6ebf1 / #9eabbd, line ice blue #8eaecb @0.65, soft blue #6f96cf @0.72.
  - `neon-night` (dark premium) body #50545b / #1d1f23, line icy cyan #a6d6e2 @0.42, amber #d39a5c @0.72, bg #26282d→#08090b. `neon-night-b` warm graphite #4b4a49 / #1c1b1b, champagne line #d8c49e @0.45, copper-amber #c8875a @0.72.
  - `hologram` teal #6aa3b4 / #2a5566, line #dcedf5 @0.55, pale gold #e9d49c @0.58, body alpha 0.42. `hologram-b` blue #7896bd / #2e4468, line #e6efff @0.5, white-cyan #c6eef2 @0.58.
- Sheet: `docs/reviews/human-v2plus-proto/skins/redo.jpg` (6 cols 1A…3B; standing + RDL glute/ham; bottom strip = torso 1:1 crops of a 720 px render). `skins.mjs --only` now keeps the given order; `skins.json` may carry `labels`.

### M9c skins — user's own palettes (2026-10-20)
Feedback on M9b: better, still not pretty enough; user gave the colours. Hairline line system unchanged (`lw` 0.5, AA ~1 px). hologram / plaster / realistic / default untouched.
- `tech-white`: matte white body #eeece8 / shade #b4b0aa, rim #f2f0ec (≈ albedo → no sheen; painted meshes already have fin = 0), dark-gold line #9a7a3a @0.90, no glow; highlight translucent orange #f08a3c, `hi.a` 0.55, `hi.fe` 7 px, shade [0.62, 0.36, 0.06]; bg #f3f2ef→#cfccc6. `tech-white-b` is now an alias of `tech-white`.
- `neon-night` (A): matte skin-like dark body #3e3a38 / #161414, rim #4a4240 (low, warm), fluorescent blue line #39c6ff @0.95, halo [1.2 px, 0.13]; highlight light blue #9fdcff `hi.a` 0.45, `hi.fe` 7, shade [0.60, 0.38, 0.06]; bg #22252a→#07080a.
- `neon-night-b` (B): same body, fluorescent green line #4dff9a @0.95, halo [1.2, 0.13]; highlight #b6ffd0 @0.45.
- Sheet: `docs/reviews/human-v2plus-proto/skins/user-palette.jpg` (3 cols; standing h-squat t=0 + h-db-rdl t=1.2 glute/ham; bottom = torso close-up with pecs highlighted, white-gold + dark-blue, 400 px tiles unscaled). `skins.mjs` gained `--rows torso` (upper-body framing) and `--torso-only <skins>`; `skins_sheet.py` leaves missing tiles blank.

### M9d skins tweak (2026-10-20)
`tech-white` line one step darker #9a7a3a → #8a6a2e (lw 0.5, @0.90 unchanged); highlights more transparent: `tech-white` `hi.a` 0.55 → 0.45, `neon-night` / `neon-night-b` 0.45 → 0.38. Sheet: `docs/reviews/human-v2plus-proto/skins/user-palette-m9d.jpg` (RDL rear row ×3 + torso close-up tech-white / neon-night).

## M10 head-base (2026-10-20) — opt-in `v2plus.head:'base'`; defaults unchanged

`v2plus: { outfit:'compression', torso:'base', …, head:'base' }` swaps the v2 head (`Toon_Mannequin_Head_v5`) and the v2 neck skin
(`Mesh001`) for the head + neck of the same Blender Human Base Meshes v1.4.1 realistic male (CC0, `male_l2.npz`). Needs `torso:'base'`
(throws otherwise; works with or without limbs / hands). Build: `tools/human-v2plus/head-base/build.sh` (numpy / scipy, < 1 min) ->
`drill-anim/models/training-human-v2plus-head-base.json` (55 124 verts, 110 046 faces, 2.1 MB; loaded only for specs that ask for it).

- **Align / scale**: the M8 sketch transform (skull depth / ear position, base + (0, 0.043, −0.023)): same skull height as the v2 head
  (1.727 vs 1.729), so camera framing is unchanged.
- **Neck** (head_a.py): cut on the angle-dependent height of Mesh001's own bottom boundary loop (200 verts; the v2 neck skin's edge,
  which sits just under the tee collar band all round) + 4 mm. The band under / just above the collar is moved radially onto the v2
  neck surface (alpha 1 up to 2 cm above the loop, 0 at y 1.478, below the chin), as a bi-Laplacian displacement field, so the base
  neck's SCM / trapezius / clavicle shape shows above the collar and runs under it where the v2 skin did. Collar clearance
  (head_b.py): band vertices closer than 2.5 mm to the collar band are pushed under it (654 verts, smoothed).
- **Weld** (head_b.py): polar-angle snap (monotone) of the cut loop onto the Mesh001 loop (+3 mm), 12-ring bi-Laplacian field, zipper to
  the exact loop vertices (seam = Mesh001 vids: live position / weights at runtime), 4-ring fairing. Piece closed (one boundary loop
  = the seam). Seam normals are the piece's own (`ownNormals`; the ring is under the collar band).
- **Eyes**: the base lids wrap into an empty socket; the inward-facing socket lining is cut (normal z < 0.35 inside the eye box) and
  each opening capped with 5 concentric rings, faired together with 2 rings of lid margin, then domed 2.5 mm forward (closed lids
  over an eyeball). Jaw, cheekbones, brow, nose, lips and ears are the base mesh untouched.
- **Weights**: the training-collar neck rule (the field the live Mesh001 neck gets: torso -> neck with height 1.39–1.48, scapula share
  by |x|, head above 1.49–1.53) times (1 − head mask) + head mask (smoothstep over y + 0.1 (z − 0.02) from 1.475 to 1.505: face, chin,
  skull 100 % head), 10 smoothing passes; seams = live Mesh001 weights.
- **Runtime**: `V2P.loadHead` / `setHead` (section 7 of `page/human-v2plus.js`, `buildPiece` bound to Coach_Body's skeleton, skin
  paint); hides `Toon_Mannequin_Head_v5` and `Mesh001` by draw range, off = restored. `outfitState.head`; regions bake picks the piece
  up (bake key carries `head`; 82 ids present); label anchors reuse the head-less state's set (`anchorKey` strips head; no anchor sits
  on Mesh001 / the v2 head).
- **Check**: `tools/human-v2plus/run.sh tools/human-v2plus/head-poses.mjs <out>` (8 key-frame close-ups; joint max diff with vs without
  head 0.0000 mm at h-squat 0 / chest-A 1.15 / scapular-B 1.9). Image: `docs/reviews/human-v2plus-proto/head-base/m10.jpg` (front 3/4,
  side, neck into collar from behind, neck front, push-up chest-A 1.15, hang scapular-B 1.9, tech-white, neon-night). `verify.mjs`
  originalSpecHashesPreserved true. Tag `v2plus-head-base`.
- **Remaining**: build stats report 34 folded edges (dihedral > 120°) — around y 1.61–1.62 (lid margin creases at the eye caps) and a
  few at the weld; none visible in the key frames. A thin crease line stays along the upper lid. The seam was checked under the
  default lights only (no extra strong side light) and the push-up frame shows the neck from above (flexion region partly hidden);
  deep head nods / turns were not rendered separately. The base neck is a little more upright than the base pose (lower band follows
  the v2 neck, up to ~5 cm radial move under the collar).

### M10b mannequin face (2026-10-20) — `head:'base'` face is now a shop-mannequin face
User feedback: no rich facial detail, just a clothing-store mannequin face. New stage `head_m.py` (between head_a and head_b in
`build.sh`; `HD_MANNEQUIN=0` gives the M10 face back): (1) the mouth slit and nostril cavities (box vertices hidden from the front by a
+z ray) and the whole M10 lid + eye-cap patch are cut and re-capped (rings + bi-Laplacian fairing); (2) the piece is split into a
screened bi-Laplacian low-pass S ((I + T LᵀL) S = V, T 15000) and detail D, V' = S + k·D with smooth region factors (face 0.25, nose 0.25,
eyes 0, mouth 0.06, ears 0.15, y < 1.505 = neck / weld exactly 1); (3) mouth + eye cores bi-Laplacian faired (one gently convex mouth
plane, shallow smooth eye recess). Skull, jaw, chin, cheekbone mass, neck, weld and weights unchanged (y < 1.505 max move 0.000 mm;
joint max diff with vs without head 0.0000 mm). Folded edges (dihedral > 120°) 34 → 7 (all 7 at the weld, y ≈ 1.445, pre-existing;
0 in the face); zipper flips 11 as before. 46 919 verts / 93 636 faces (cavity linings removed), 1.8 MB.
Image: `docs/reviews/human-v2plus-proto/head-base/m10b.jpg` (M10 vs M10b front, 3/4, side, tech-white, neon-night;
`head-poses.mjs --set m10b`). Tag `v2plus-head-mannequin`.
Remaining: in strong front light the nose underside still reads as a darker toon band (nostrils are closed, the low nose ridge keeps its
underside); ears keep a faint inner fold in side view; a very faint mouth-plane shading remains (intended).

### M10c faceless egg head (2026-10-20) — `head:'base'` head is now an analytic egg mannequin head (default)
User picked a fully faceless store-mannequin head (concept `mannequin-head-concept.png`) and asked for it round, silky-smooth and
symmetric (no faceted / knife-cut look). New stage `head_e.py`; `build.sh` switch `HD_FACE=egg` (default) | `soft` (M10b face, `head_m.py`)
| `detail` (M10 face; `HD_MANNEQUIN=0` still = detail). Everything above y = 1.46 (just under the jaw) is generated, not smoothed:
implicit smooth union (polynomial smin, k 3 cm) of a tilted ovoid (long axis 28° back, semi-axes 76 / 124 / 96 mm, 14–16 % taper toward the
chin, crown height solved to the old top of head 1.7275) and the base neck's own radial profile (x-mirrored, Hermite-continued above
1.46 to a slim 56 / 56 / 50 mm neck, C1 fade-out inside the egg). Mesh: 192 meridians (mirror-symmetric azimuth set) traced as the F = 0
contour (marching squares, 0.4 mm grid) and resampled to 128 rows from a crown pole; x<0 half copied from x>0 with mirrored quad
diagonals. The base neck is cut exactly on the y = 1.46 plane (crossing triangles split) and zipped; the bottom 14 grid rows fade onto the
real contour (≤ 2.8 mm). No eyes, nose, mouth, ears or brow. Neck / weld / weights / collar rule unchanged (head_b), joints 0.0000 mm.
Stats: 28 268 verts / 56 334 faces (1.1 MB, was 46 919 / 1.8 MB); head part exactly symmetric (mirror error 0.05 mm above y 1.49,
≤ 1.2 mm only in the fade band at the neck); dihedral above the chin p99 4.8°, max 8.6° (nape fillet); 0 sharp (> 30°) edges in the
generated head; 0 zero-area tris. Folded edges 15 (all under the collar at the weld, y 1.440–1.446; M10b 7), zipper flips 12 (was 11).
Image: `docs/reviews/human-v2plus-proto/head-base/m10c.jpg` (front, 3/4, side, back 3/4 from above, tech-white, neon-night;
`head-poses.mjs --set m10c`). Tag `v2plus-head-egg`.
Remaining: one ~23° edge at the side of the neck in the fade band (y ≈ 1.474, trapezius flare transition); weld folds under the collar
went 7 → 15 (hidden by the tee collar band).
