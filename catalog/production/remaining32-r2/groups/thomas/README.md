# 专项 10 项：逐项模板草案

## 2026-10-29 夜间模板候选更新

已新增 10 份可执行动作修订（一般 r4，L 撑开合和宽腿 L 撑为 r5），并更新本目录配方。
新版 `_thomas-armfix-r1.mjs` / `_thomas-pr106-armfix-r1.mjs` 使用 armfix-r2 的髋关节静止坐标、
大腿 0.409739814 m 和小腿 0.416772719 m 重新生成腿目标与脚朝向，旧 helper/spec 保留。
世界空间掌撑锚点不整体缩放，实际身体高度由原有触地/伸臂约束重新解算。
宽腿/开合 L 撑也换用当前躯干段偏移；坐姿屈伸使用当前静止腿向量计算扭转，
并放开旧固定 rootZ 的求解；坐姿抬腿将旧 170° 肘目标改为 177.5°，保留原 >=176° QA。

团身俄挺已改为真正的 8 秒抬脚保持：`up=1`，双脚自由目标，不保留落地阶段足底 pin；
178° 双臂、前倾肩位和团膝路径需在实际 GPU 预览中检查离地净空、接触和穿模。
所有 10 项已通过 `prepareRecipe` 导入与源哈希校验；尚不能据此宣称 GPU/用户通过。
精确哈希见 `../../source-receipts/thomas-20261029.json`。颜色/材质选择保留为参数，待用户之后决定。

以下为前一轮来源审计及风险说明；其中“未重定向/未修团身俄挺”描述的是旧 r3/r4 输入，
当前应以本节、新修订和后续 GPU 回执为准。

本目录保存 32 项补齐计划中的专项 10 项配方，使用 `pose-hub-action-recipe@1`。
这些是来源已核对、待低分辨率预览的模板草案；没有新的 GPU 看样、用户逐项确认或高清生产。
所有条目保持 `reviewed:false`、`releaseEligible:false`，`adaptation.status=pending-pose-review`。
用户看过并确认某一项后，才保存该项确认记录；最终高清批量生产留到模板确认完成后。

| 动作 | 首选镜头 | 重点 |
| --- | --- | --- |
| `t-flare-side-hold` | 低位斜正面 | 同侧掌、足支撑；另一侧手放松；镜像另审 |
| `t-lsit-open-close` | 居中偏高正面 | 左右开合对称、掌撑可见、持续离地 |
| `t-lsit-tuck` | 斜侧面 | 团身收踵与伸腿切换、手腿间隙 |
| `t-lsit-vsit-circles` | 偏高斜正面 | 两个画圈方向、最高/最宽位置、腕踝连续朝向 |
| `t-lsit-wide` | 偏侧面 | 掌撑与髋腿离地可读；正面诊断宽度 |
| `t-seated-straddle-ext` | 稍高近正面 | 膝盖向两侧、掌在身前、腿/脚旋转连续性 |
| `t-seated-straddle-lifts` | 低位斜正面 | 臀部不离地、脚跟起落、掌撑不漂 |
| `t-straddle-hold` | 斜正面 | 坐下→撑起→坐下，不只看静态高点 |
| `t-tuck-planche` | 偏侧面 | 已知源语义问题，待新修订后预览 |
| `t-vsit` | 侧前方 | 髋部压缩形成 V，不用全身后仰替代 |

`t-half-straddle` 不在本目录，用户停止状态继续有效。

## 已保存的输入与检查点

每条 JSON 固定当前 spec 的 LF SHA-256，记录其递归相对导入源码与 SHA、原始 spec、
当前模型身份、左右手角色、明确固定镜头、预览时点、源 QA 和逐项适配风险。
动作内部关闭 `drift`、`orbitDegrees`、`frontSweepDegrees`；关闭地面投影，保留本来的薄垫道具。
薄垫是显式道具，其可见范围须与人体一起进入全周期固定内容矩形。

配方选择 `training-human-v3-armfix/0.1.0-r2`，不表示旧 pose 坐标已经完成重定向。
多数专项脚本使用旧人体 `R.hip`、`TH`、`SH` 计算目标；L 撑开合和宽腿 L 撑另有按旧躯干
偏移计算的肩平面，V 撑和坐姿分腿屈伸还有旧 solver 的固定 `rootZ`。
先核对真实短臂骨架和表面接触，再按需要另建动作修订；不放宽原 QA、不静默改旧文件。

已使用仓库 `drill-anim/page/engine.js` 的 `sample` / `blend`，以 30 Hz 在纯 CPU 中检查
当前源描述符的足部旋转组合及 hand finger/normal 字段。每条 JSON 保存对应结果。
这是求解前源描述符检查，没有实际骨架和蒙皮，所以不代表腕踝朝向或视觉通过。
重点复查 `t-seated-straddle-ext`：源足旋转组合最大相邻变化约 **14.71°/帧**；
`t-lsit-vsit-circles` 约 **6.27°/帧**。这些数值只是检查线索，不能独立判为扭曲。
实际渲染需连续记录左右手/足局部和世界四元数、掌/足底法线和手指/脚趾方向，检查中间姿态及
循环首尾。相同起终方向不能排除中途 180°/360° 绕转，单个欧拉角很大也不能直接判错。

## 团身俄挺的已知问题

`t-tuck-planche-r3.js` 沿用 `t-tuck-planche.js` 最后的静态导出。
该导出固定在旧预览最后/落地阶段的 `pose.base`，且 `timeline.tracks.up` 恒为 0；
继承 QA 中 `params.up<0.001` 的双脚着地条件因此始终生效。
这不能直接当作双脚离地的团身俄挺保持成片。
专项开始预览时应另建真正 hold 的修订，保留掌撑、直臂阈值及明确足部离地检查。
本次遵照最新安排仅记录问题，未创建 `t-tuck-planche-r4.js` 或修改旧 spec。

## 掌撑接口最小接入路径

仓库已有 `drill-anim/models/fixed-hand-presets-r1/presets.json` 的 `support` 数据，
与历史 `preview-r4/support-fixed.json` 逐值相同：固定源为
`hands-native-c1r2-symmetric-r1`，handScale=1，motion-rest-delta 坐标系。
运行时检查真实网格指纹、顶点/索引数及完整骨骼名，来源不匹配即失败。

1. 在全新页面通过 `training-human-v3-armfix-r2.boot` 和 `applyV3` 初始化。
2. 验证固定手包清单后，读取 `presets.json`；仅调用
   `tools/body-v3/armfix-r2/support-install.mjs` 的
   `installSupport(page, presets.support, {sourceId: presets.handSource})`。
3. 动作显式设置左右 `v2plus.handPose` 为 `support`；侧撑自由手为 `relaxed`。
   删除旧 `nativeHands.version` 字段，保留模型支持的可选 `twistShare`。
4. 在相机拟合及第一帧求解前安装。`getGroundHandPose` 提供固定掌向和真实校准腕高；
   每帧不拟合网格。原生手被隐藏或替换时不能沿用此接口。
5. 一页只安装一次；失败丢弃页面。卸载用返回对象的 `remove()`，hook 冲突须丢弃页面。

不为掌撑安装固定哑铃/腕部 r4；那套入口隐藏原生手并裁切前臂，与本掌撑接口不是可混用的同一套手。
完整 `fixed-hand-presets-r1.install()` 同时安装旧抓握基线；仅需掌撑时无需额外安装旧抓握。
此最小路径仍需在当前动作上完成外观与接触预览，不将手包的本地比较基线视作最终验收。

历史证据根：`F:/PoseHub-v2-production/action-completion-v3-20261028-r1/qa/hand-presets-r1/`。
`preview-r4/report.json` 记录 RTX 4080 实际 GPU、armfix-r2 对称手，掌撑 0/2/4/8 秒及单手支撑
共 5 个样本，`pageErrors=[]`；这些是熊式/人工单侧样例，且 `reviewed:false`、
`releaseEligible:false`。本次只回读数据，没有新看图，也没有把它们扩大为专项 10 项通过。
`support-test.mjs` 含合成骨架接口、方向、回滚测试；本次未运行该文件。

模型 README 仍声明 P4/P5 和旧 r5 接触/颈部校准未迁移，因此动作逐项的接触、外观及方向确认不能跳过。
