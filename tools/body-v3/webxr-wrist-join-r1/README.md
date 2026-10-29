# 固定握哑铃模板：腕部接入原型

用户已认可固定握持外观；当前工作是连续接到人体前臂。实际 source rig 为
`training-human-v3-armfix-r2`，不是适用于任意人体的通用接口。**r4 的 ±60°
实际采样检查通过，75° 压力测试未通过**。用户于2026-10-28查看接入预览后
明确确认“可以看起来还不错 我验收通过了”，握持与腕部接入外观均已验收，
作为后续动作接入基准。全动作检查、生产配方切换与发布仍是独立事项。

独立验收记录位于外部 QA 根
`webxr-wrist-join-r1/user-acceptance-r4-20261028.json`，固定原候选回执与运行时
哈希；原候选回执、实际采样和QA报告不覆盖。

最新证据为外部 QA 根 `webxr-wrist-join-r1/gpu-grid-r4/` 和
`gpu-grid-r4-independent-qa.json`。17个主验收样本（左右共34侧）通过实际完整
旋转、接缝位置/法线、局部自交/压缩、固定手与哑铃、恢复及重复无累积检查。
新腕带仅在 Y=0..20mm 内侧使用最大4mm的平滑退让，双端位置与一阶导归零；
已接受的固定手、哑铃和源 forearm 未改。此版本并不保证所有中间姿态或全动作无碰撞。

## 固定来源与本地路径

合入用的可移植入口为
`drill-anim/models/webxr-dumbbell-wrist-r1/recipe.json`，资源、MIT许可、用户验收和
精简QA记录均随仓库保存。`verify()` / `install(page)` 默认使用这份配方；
传入 `recipePath` 时，配方内的相对来源及 `recipe.templateDir` 按配方所在目录解析。
`node tools/body-v3/webxr-wrist-join-r1/test_portable.mjs` 验证换目录及完整性，
`build.py --output <新目录>` 默认使用仓库sources；不会覆盖已验收配方。
以下F盘路径保留原始制作和实际GPU证据位置，不是默认运行依赖。

原制作工作目录（历史位置）：`E:/AII-3D/3D-Pose-Hub-worktrees/action-inventory-20261028`。

原外部模板包（历史位置，默认使用仓库内模板）：

`F:/PoseHub-v2-production/action-completion-v3-20261028-r1/qa/hand-presets-r1/webxr-grasp-r1/reference-power-grip-r1/template-package/`

其中 `template.mjs` 导出
`await loadDumbbellHandTemplate('left' | 'right', loader?)`，返回米制、scale=1、
以腕骨中心为原点的 `wrist_anchor` 固定组合。左右完整 GLB 各含手、握柄和
两块实际哑铃片；`manifest.json` 固定文件哈希，`LICENSE-source.md` 和
`evidence/` 保存来源、许可、局部修形与独立检查。单独加载模板不等于腕口已接好。
握柄为 **32×165 mm**，六角片外接半径 42 mm、厚 60 mm，中心沿柄轴位于
±111 mm；不另叠加同一手的 action dumbbell。旧 25 mm 保存版不变。

原外部接入 recipe（历史输入，保留复现）：

`F:/PoseHub-v2-production/action-completion-v3-20261028-r1/qa/hand-presets-r1/webxr-wrist-join-r1/static-build-r1/recipe.json`

SHA-256：`5055d918b104ed4ad7001e0d66e9ce3f6f4577905f00501d73c6398d16392fd3`。
recipe 固定左右最终手 JSON、neutral/reference JSON 的路径与 SHA，以及 limb
源顶点数、规范化 uint32 索引哈希。新 GPU 中立采样与旧输入完全等价的证据为
同一 QA 根下 `source-rest-r1/old-capture-equivalence.json`。loader 验证 recipe
指向的源 JSON 哈希，并记录实际 recipe/prop GLB 哈希到返回的 source pins。

## 可复用入口与坐标

`loader.mjs` 导出 `verify(options?)`、`await install(page, options?)` 和
`await detach(page)`。`recipePath` 可省略，默认使用仓库内固定配方；`enabled`
和 `showDumbbells` 默认 true。模板目录按以下优先级解析：显式
`options.templateDir`（相对当前工作目录）、配方的 `recipe.templateDir`（相对
配方目录）、旧手源包相邻的 `template-package` 回退。按 `capture.mjs` 的实际顺序：先调用
`training-human-v3-armfix-r2/loader.mjs` 的 `boot()` 和 `applyV3(page,spec)`，
再 install；使用新页面，不与旧拓扑 wrist corrective 同时启用。

```js
import {install, detach} from './loader.mjs';
// page 已由 armfix-r2.boot / applyV3 初始化；默认加载仓库内固定包。
await install(page);
// 兼容显式旧配方：await install(page, {recipePath, templateDir});
// ...沿用人体动作入口，手与哑铃保持固定关系。
await detach(page);
```

固定手 canonical 为 +Y 朝手指、+Z 朝掌侧，腕 pivot 为原点。映射到原人体
Hand-local 后再乘实时 Hand.matrixWorld，**左右映射不同**：

| 侧别 | canonical `(x,y,z)` → Hand-local | 原骨局部长轴 | 掌侧 |
| --- | --- | --- | --- |
| left | `(y,-z,-x)` | +X | -Y |
| right | `(-y,-z,x)` | -X | -Y |

原 native hand 仅隐藏，原 limb geometry/material 引用保留。安装时替换为
**Y=-40 mm 精确裁切的 limb clone**，新手裁为 **Y≥+20 mm**；-40..-20 mm 为
直过渡，-20..+20 mm 为初始圆弧带。只用新切口，不套旧 native seam IDs。
recipe 含 source 插值、ordered boundaries、重合组、端点映射与中性多环轮廓；
手 Y≥20 mm 的 1,222 个原顶点逐值保留，腕 pivot 与手比例不移动。

`setEnabled(false)` 暂时恢复旧 limb geometry/material 和手可见性；`detach()`
还恢复 scene hooks/renderer、移除新对象并 dispose 分配资源，不改冻结源
buffer。不要在 render 中卸载；若后装了别的 hook，先逆序卸载后装的 hook。
更换模型/比例/geometry/绑定后须重新编制和验证 recipe，不沿用旧中立缓存。

## 实际采样与检查命令

从仓库工作目录执行，capture 目录和 checker 报告都必须是新路径。占位值需
替换为 root 已固定的 runtime 文件与新输出目录；不要为了检查另启 GPU lane。

```powershell
$wristRecipe = 'drill-anim/models/webxr-dumbbell-wrist-r1/recipe.json'
node tools/body-v3/webxr-wrist-join-r1/cpu-test.mjs $wristRecipe
python -B tools/body-v3/webxr-wrist-join-r1/test_build.py --recipe $wristRecipe

$wristRuntimePin = '<PINNED_RUNTIME_JSON 的绝对路径>'
$wristNewCapture = '<尚不存在的捕获目录绝对路径>'
node tools/body-v3/webxr-wrist-join-r1/capture.mjs $wristNewCapture $wristRuntimePin $wristRecipe grid
python -B tools/body-v3/webxr-wrist-join-r1/check.py $wristNewCapture --output "$wristNewCapture/independent-qa.json"
```

实际 CLI 为 `capture.mjs NEW_DIR PINNED_RUNTIME_JSON RECIPE_JSON [pilot|grid]`。
默认 pilot 只含 0/±60° flexion 与重复中立；grid 才覆盖 0/±30/±60/±75° flexion、
0/±60° twist 和重复中立/非零姿态。采集的是 actual after-render combined ROI、
实际 DB 顶点、矩阵和腕部 GPU PNG。75° 单列 stress，不计入 ±60° 名义验收。
`check.py` 不启动 GPU；字段与限制见 [contract.md](./contract.md)。

静态 builder/独立中立重建已过接边二度反向、无退化、完整中立装配无自交、
保护点精确保留；证据在 QA 根的 `static-build-r1/` 与
`builder-independent-r1.json`。`cpu-test.mjs` 使用合成刚性 forearm fixture，
不能替代真实 production skinning 或 GPU 外观。全动作原材质表现、肌群高亮、
全动作碰撞和正式生产接入仍有独立门槛，不因局部接缝闭合而宣称完成。

## Runtime implementation details

`loader.mjs` exports `verify(options?)`, `install(page, options?)`, and `detach(page)`.
The default `recipePath` points to the pinned repository package; an explicit
path preserves support for an earlier authored recipe. Template resolution uses
explicit `options.templateDir` first (relative to the current working directory),
then `recipe.templateDir` (relative to the recipe), then the legacy adjacent
hand-source package fallback. `enabled` and `showDumbbells` default
to true. Install after `training-human-v3-armfix-r2.applyV3`, on a fresh page
without the old-topology wrist corrective. Use no separate action dumbbell when
showing the fixed template's prop.

The adapter retains the original native hand, geometry and material references.
It hides the native hand and temporarily replaces the limbs mesh geometry with
a clipped clone. Every attribute is interpolated; skin influences are merged by
bone ID, reduced to four and normalized. New cut positions reproduce the actual
neutral skinned surface. Native limb vertex-ID material textures are remapped to
the new vertex order. New hand and bridge meshes share the body's skin, shade,
tint and rim uniforms and the same two-step light equation; muscle-highlight
mapping on the new topology is not implemented in this prototype.

The body endpoint is canonical Y=-40 mm. Y=-40 to -20 mm remains a straight
transition; the initial bend kernel uses equal 20 mm tangent distances from
-20 to +20 mm. Authored cross-section offsets and tapers are retained. Actual
clipped endpoint positions override the ideal sweep at the boundaries, and
their residuals are smoothly distributed inside. Shared edge normals use the
area-weighted faces on both sides of each interface. No old native seam IDs or
old corrective topology are reused.

The source hand above +20 mm and all three actual dumbbell meshes are one rigid
group. The source wrist origin, scale and hand-to-prop relationship remain fixed.
Props are read from the accepted GLBs, not replaced with approximate cylinders.

All live geometry is updated in `scene.onBeforeRender`, inside the existing
render-time twist wrapper, and remains valid through `scene.onAfterRender`.
An outer renderer transaction restores allocated geometry buffers afterward.
Frozen source geometry buffers are never changed. `detach()` restores the
original limbs geometry/material and hand visibility and disposes allocations.

## Diagnostics

`window.__webxrWristJoin` exposes:

- `setDiagnosticPose(flexDeg, twistDeg)` for the diagnostic grid only.
- `sample(callback)`, synchronous and safe for nesting inside its callback.
- `capture(side)` or `capture()` for actual render-time world positions.
- `reference(side)`, called in a zero-command actual render, for combined
  limb-ROI, bridge and hand topology, seam pairs, neutral frames and prop points.
- `last`, `lastRestoreCheck`, `meshes`, `setEnabled(value)`, and `detach()`.

`capture` and `reference` require the after-render phase. After `sample` returns,
read `lastRestoreCheck` and associate it with that sample: restoration happens
after the callback, so the `restoreCheck` inside the callback's capture is from
the preceding render. Hashes are FNV1a32 byte checks and accompany explicit
restoration assertions. Independent QA should also compare repeated actual
captures. Hand/forearm matrices are column-major native body bone matrices;
longitudinal is left +X/right -X and palmar is -Y. Positive signed flexion bends
the longitudinal direction toward palmar. Swing and axial twist are separate.

The nominal first-pass scope is swing/twist up to 60 degrees. 75 degrees is a
stress case. Neither nominal scope nor seam closure implies that the swept
surface is free of folds: the diagnostic conservative Jacobian bound can become
negative, and actual triangle QA plus GPU inspection is required.

Run `node cpu-test.mjs <recipe.json>` for the source-pin, geometry, callback,
buffer-restoration and detach checks. Its skin is a synthetic rigid-forearm
fixture on the pinned actual neutral limb positions/topology, so it is not
evidence of actual production skinning, materials or GPU acceptance.

## 只读查看实际捕获

最终 capture 目录已有 `report.json`、左右 reference 和姿态 JSON 后，可运行：

```powershell
node tools/body-v3/webxr-wrist-join-r1/serve-review.mjs $wristNewCapture '<全新且在capture目录之外的review目录>'
```

命令只启动绑定 `127.0.0.1` 的只读白名单 HTTP 服务，终端打印 URL；不会启动
浏览器或新 GPU 采样。第三个可选参数为端口，默认由系统分配。Ctrl+C 停服务。
review 输出保存独立 HTML/manifest，既有 capture 不改写。

默认中立和 ≤60° 已捕获样本；＞60° 需切换到“压力测试”，可能尚未通过。
查看器只替换离散样本坐标，提供 OrbitControls、实际角度和同姿态 GPU PNG
画廊，不插值或伪造弯曲过程。三维窗口为几何检查示意材质；原材质以 PNG
为准，全动作尚未验收。中立全身 GPU 图单列“整个人体接入”，不冒充当前
所选姿态。数据缺失时明确提示，不以其它姿态或近似
器械补齐。

Diagnostic input calibration samples actual render-time neutral and uses a bounded
finite-difference inverse solve for each hand. `setDiagnosticPose` returns
`diagnosticPose` with requested, authored, measured, convergence and iteration
history; captures retain that record. It may perform multiple synchronous
renders exclusively for diagnostics. Production motion and frozen twist sharing
are unchanged. Requested flex/twist tolerance is 0.02 degrees.

Material revision r2 selects region paint only when actual RSk, Ron and V2pOn
flags are active. Realistic/default uses body base/shade/rim/finish slot0,
including its sheen equation, fixing realistic incorrectly using region gray.
Per-vertex cavity, texture/pattern, muscle highlight, cuff and rim attenuation
data do not exist on this topology: cavity/pattern are zero and rim attenuation
is one. Those limitations remain separate from matching basic skin lighting.

The diagnostic solver now uses three authored local rotation degrees of freedom
and a quaternion-log residual. Its exact target is native-hand-local
`Qflex * QaxialTwist`, with zero sidebend. It records target neutral-relative
quaternions as well as measured sidebend and orientation error. Matching only
signed flex/twist was insufficient: the earlier two-parameter solution left
unconstrained radial/ulnar bend in combined poses. That earlier capture remains
evidence of its measured pose, not the requested zero-sidebend 60-degree pose.
