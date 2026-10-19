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
