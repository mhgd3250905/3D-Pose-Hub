# 32动作候选 r2：四项直臂支撑肘部修正

用户在r1验收页指出坐姿分腿屈伸、坐姿分腿双腿抬起、分腿支撑及V撑的肘部突然收细，并要求复用正常动作的做法、高效修复。

这四项配方漏接了已有的 `elbow-dqs-r1 / 0.1.0-r1`；原实际渲染新增前臂轴转约77–119°，会压缩普通线性蒙皮的混合区。已正常使用该组件的L撑团身约97°、托马斯侧撑承重侧约145°，因此本轮直接补接同一冻结组件。没有修改动作源、模型、手型、原始QA、镜头或支撑点，其他28项配方保持原字节。

四项分别生成新的480px/12fps完整低清预览，每项241个实际姿态样本。肘部体积修正逐帧生效，每帧5232个混合区顶点参与；与各旧capture逐帧比较，所有骨点位置最大差0毫米，镜头一致。看过主视完整关键帧和侧视对照后，四项候选复核通过；最终视觉验收仍由用户确认。

新配方集合为 [remaining32-r4](../../catalog/production/remaining32-r4/README.md)，[r2机器快照](../../catalog/production/versions/remaining32-template-finalization-20261029-r2.json)固定32项当前候选。来源复核473份文件、原始伸直约束61项均通过，32项当前原始triage无警告。仅本次四项重新生成预览，不重复制作其他28项，也不重复运行与此次配方接入无关的全库测试。

输出为 `F:/PoseHub-v2-production/template-finalization-20261029/captures/<动作ID>/attempt04/`，其中 `visual-review.json`、`elbow-integration-audit.json` 及部分动作的独立审计保存实际证据。当前问题清单另存为 `qa/known-issues-r2.json`，旧r1的清单、配方、预览及版本快照保留原字节。r1中毛巾肩部按用户放宽标准保留的材质层纹仍按原范围记录。

验收入口：`http://127.0.0.1:8845/?revision=elbow-r2`。本版保持 `userReviewed:false` / `releaseEligible:false`，正式高清制作仍留到最后。仅作本地版本保存；精确提交和源码增量包回执位于 `F:/PoseHub-v2-production/version-snapshots/remaining32-template-finalization-20261029-r2/delivery-receipt.json`。
