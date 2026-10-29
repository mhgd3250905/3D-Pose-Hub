# 居家 14 项：动作模板准备

## 2026-10-29 overnight r4 candidate update

User authorized one low-resolution candidate for all remaining actions before the
next review. All 14 home recipes now select new `*-r4.js` revisions; original
sources and r3 wrappers remain preserved. These are source-ready candidates,
not user-approved templates. `r4-source-hashes.json` records all 14 spec hashes
and the new `_home-armfix-r1.mjs` helper for registration by the main agent.

The authoring helper uses current armfix rest pelvis/hip positions, measured arm
lengths and current thigh/shin lengths. Standing actions correct the root height;
side-lying free legs are rebuilt at their intended angles; the bridge trajectory
uses current trunk segment lengths. Ground support actions retain their physical
anchors and original QA while updating seeds/span for the changed proportions.
Bear shoulder height uses the fixed support wrist calibration (~28 mm) plus the
484.827 mm arm span. Towel pass/behind target wrist reach is capped at 482 mm.
Full forearm axial sharing avoids the half-angle wrap discontinuity, but actual
render rotation and mesh inspection are still mandatory.

`r4-cpu-check.json`: all 14 imports and 241 descriptor samples each are finite,
have no zero hand-direction vectors, and close their descriptor loop exactly.
This does not execute IK or certify contacts. Main-agent GPU inspection should
prioritize bear plank, pike push-up, mountain climber, inner-thigh and open-book.
Kettlebell/towel grips retain their implement-specific original grip props, so
they require visual comparison with the current native body; they must not be
silently replaced with the accepted two-dumbbell package.

The preparation notes below describe the earlier r3 inventory and remain as
historical rationale; current spec identities are in each recipe and the r4 receipt.

本目录保存剩余 32 项中的居家 14 项生产配方草案。已固定来源、镜头建议、手型用途和检查点；本轮未运行浏览器、渲染或改变旧 spec。全部仍是 `pending-pose-review`、`reviewed:false`、`releaseEligible:false`。

当前阶段按用户安排，先少量低分辨率预览，确认动作实现、固定镜头和腕踝旋转路径。通过一项再保存该项确认记录；最终高清渲染和压缩留到模板确认之后。第一小组建议采用 `h-reverse-lunge` 检查站立、双腿切换和手扶髋。

## 配方身份

每份 JSON 使用 `pose-hub-action-recipe@1`，指定 `training-human-v3-armfix/0.1.0-r2`、精确 spec LF SHA 和本地相对模块依赖。镜头全部关闭 drift、orbit 和 frontSweep，启用全周期取景。地面投影关闭；必要地垫、墙、头垫仍作为显式道具保留，全周期内容矩形由后续真实渲染范围计算。

所有输入 spec 仍是旧 `*-r3` 包装，继承早期动作坐标。配方改用 armfix-r2 不等于已经重定向。执行层需要显式移除旧 `nativeHands.version`，因为 armfix-r2 只接受 `twistShare`。旧 spec 与登记表在本轮保持原样。

本组没有双哑铃动作。壶铃、毛巾不得直接套用固定双哑铃模板。support、relaxed、assist 使用当前对称 native 手作候选，仍需按各动作检查实际手型、手腕和接触。

| 动作 | 左手 / 右手 | 重点 |
| --- | --- | --- |
| h-bear-plank | support / support | 双掌、脚尖固定；双膝悬空与肩腕关系 |
| h-biceps-self | assist / relaxed | 左掌抵右前臂，跟随弯举 |
| h-bridge-overhead | relaxed / relaxed | 肩头与双足支撑，过头手与地面 |
| h-crossbody | assist / relaxed | 左手扶右上臂，高亮位置 |
| h-inner-thigh | support / assist | 左前臂支撑、右手扶髋、下侧腿抬起 |
| h-kb-swing | relaxed / native | 单右手壶铃握持、髋铰链与腿间净空 |
| h-mountain-climber | support / support | 左右换脚、掌撑、膝胸与对侧腿净空 |
| h-open-book | relaxed / relaxed | 叠膝、胸椎开合、手臂弧线与头垫 |
| h-pike-pushup | support / support | 掌撑、脚尖、头部下降与左右肘 |
| h-reverse-lunge | assist / assist | 双侧后撤、后膝悬空、后脚尖固定 |
| h-towel-behind | native / native | 毛巾端点握持与身后净空 |
| h-towel-pass | native / native | 毛巾过头净空、双肘伸直与对称 |
| h-towel-pulldown | native / native | 毛巾与头颈净空、双肘路径 |
| h-wall-pec | relaxed / assist | 右手抵墙，工作臂不被墙遮挡 |

## 身体重定向的最小边界

`training-human-v3-armfix-r2/proportion-base.mjs:warpBase` 按蒙皮影响将网格从旧静止骨架映射到新静止骨架；它不读取动作时间轴、不改动作目标，也不修复接触。boot 初始化新骨架后，engine 的 `E.R` 和 `E.L` 来自当前人体。两者不能替代动作重定向。

在静态 `RESET_JOINTS` 数据中，两侧上臂长 0.256780039 m、前臂长 0.228046952 m，与 v2 相同；大腿由 0.352919737 m 变为 0.409739814 m，小腿由 0.409806017 m 变为 0.416772719 m。骨盆静止位置从 `[0,0.899555,0.010183]` 变为 `[0,0.963525171859,0.008228798312]`。这些是配方/骨架数据核对，不是实际渲染量测。

engine 的 chest/hips 目标仍以旧 spec 的“静止坐标点”作为输入，再减去当前骨盆静止点、按当前姿态旋转并加到动作骨盆。world 目标则完全不变。因此不能对所有 xyz 统一乘比例：

- 肩到腕的原静止枢轴未变，手臂角度意图通常可保留；但骨盆、腰部、身体表面接触需一起核对。
- hips-frame 手扶髋/体表点应按对应躯干表面映射；不应把它当成上臂长度比例。
- free-foot 由旧 `leg()` 生成的目标，应先恢复髋膝踝方向，再用当前两段长度重建，不能只平移脚踝。
- world 支撑点、floor 手足点、墙面和头垫属于场景接触约束。优先保留其物理含义，通过当前骨架重新解算身体；必要时另存明确的支点修订。
- `pole` 是世界坐标，`poleUp`/`poleLow` 是胸/髋坐标，不能与方向向量混用同一种变换。

### 第一项：h-reverse-lunge

原中立骨盆 y=0.884 m，比旧静止骨盆低 15.555 mm。第一步诊断可增加静止骨盆差 `[0,+0.063970171859,-0.001954201688]`，保留原中立屈膝意图。此修正只解决站立基线；不能将低位也直接升高 64 mm 后宣称完成。

低位应使用当前腿长、真实脚踝位置和明确后膝离地量，重新求骨盆高度与前后位置。可在下降权重 `down` 较高时，用当前两骨段中点约束后膝 y 和前膝相对前脚踝 z，同时保留脚底/后脚尖锚点；过渡阶段保持原节奏，查看脚抬起、落下和换侧时是否出现速度或 IK 分支跳变。原 `toeDz` 硬编码前移 0.16 m、下移 0.075 m，须与实际鞋面/脚骨数据核对后决定是否重写。

建议镜头沿 `[1,0.2,0.35]` 固定，覆盖头、双掌、双肘、髋、双膝和双脚。重点时间为 0、0.45、1.05、1.9、2.3、3.6、3.85、4 s 及第二侧相应时点。配方保存了更完整的检查采样点，root 可取其中少量生成首轮预览。

### 后续代表项：h-bear-plank

原 spec 用膝中点绝对目标、肩中心高度 0.5157 m、骨盆 seed，以及 `px/py/c0` 求解。新腿长不同而手臂长度相同，旧约束不必全部可同时实现。首先标定实际掌撑面和膝部表面；由直臂撑地的实际到达关系确定肩高，再以当前腿长重新求骨盆。原 `KY0=0.0385` 是旧膝关节点接触高度，不应冒充新网格接触高度。动作的膝部抬高 30 mm、双掌/脚尖固定和两次保持节奏保留为目标。

## 腕踝旋转检查

每份配方已保存 30 Hz、0..8 s 共 241 个描述符样本的方向连续性摘要。检查过的 finger/normal 未出现零向量，连续步角最大约 3.075°；本组 foot heading 均固定，没有 180/360° raw heading 跳变；后撤弓步的 pitch 最大步差约 8.43°，需特别看脚落地前后的速度。首尾方向一致不能证明中途没有绕转。

该结果仅覆盖已列出的描述符通道，不包含实际骨骼四元数、IK pole 分支、完整组合旋转或蒙皮扭曲。后续必须检查每帧实际腕踝 quaternion 路径、掌/足底方向、左右一致性和首尾衔接。四元数 `q` 与 `-q` 等价；比较相邻转角需要处理符号连续性，同时保留展开路径及累计转角，不能仅比较起止姿态。

## 本轮验证

14 份输入模块可导入；JSON 已按真实模块依赖保存 LF SHA。所有动作仍待 low-resolution template preview。没有创建新的 spec、渲染媒体、人工验收回执、Git commit 或发布状态。
