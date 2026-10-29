# 第一批32动作：修正后验收版 r3

从已保存的7613e53检查点派生。原r2配方、两项动作确认与熊式局部确认保留。当前32项已完成本轮候选复核，保存为 [remaining32-template-finalization-20261029-r1](../versions/remaining32-template-finalization-20261029-r1.json)；用户逐项验收仍待完成。

25项native路径与7项固定握持分别使用明确的组合配方。固定握持的拓扑映射及恢复顺序已接入；Thomas可达性、接地、辅助接触和动作专属指姿按新spec版本记录。旧源和失败试版保留。

要求：动作语义、支撑和握持、腕踝连续旋转、关节几何、完整固定取景、无地影、完整低清循环。高亮仍参数化，正式渲染留到最后。plan.json已更新候选完成状态并保留启动阶段记录；当前逐项证据以版本快照及输出根status.json为准。毛巾过头转肩按用户放宽的肩部标准保留放大近景材质层纹，详情见[版本说明](../../../docs/production-snapshots/remaining32-template-finalization-20261029-r1.md)。

当前复核入口：`http://127.0.0.1:8845/`，输出根为 `F:/PoseHub-v2-production/template-finalization-20261029/`。每个完整预览包含覆盖全周期的30Hz实际姿态采样（含独立循环终点）、480px/12fps回放、关键近景、来源哈希及人工看样回执。诊断probe只证明其列明的采样范围。

`tools/action-completion-v3-r2/seal-template-candidates.py` 只在32项候选复核完成、原伸直角度约束通过、全部捕获来源哈希仍一致时生成新快照；快照不授予用户验收或发布资格。换适配模型可复用镜头和动作意图，仍需重新核对接触与取景。

## 复用与检查

配方按稳定ID位于 `groups/`，保存动作源、身体组件、手型、镜头、关节修正及外观参数。不要直接修改已经绑定预览的配方或旧spec；修订另存新spec，并生成新attempt。配方中的历史适配说明不作为验收回执，当前候选状态取决于capture与看样记录的哈希绑定。

以下命令从仓库根执行，传入一份或多份配方后串行生成低清预览。`<新attempt>`必须使用尚不存在的名称；已有目录会被跳过，不能据此认为已重新验证。

```powershell
python tools/action-completion-v3-r2/batch-finalization-r8.py --out F:/PoseHub-v2-production/template-finalization-20261029/captures --runtime F:/PoseHub-v2-production/planning/render-runtime-gpu4080-r1.json --attempt <新attempt> --lane 1 catalog/production/remaining32-r3/groups/home/h-bear-plank.json
python tools/action-completion-v3-r2/finalization-status.py
```

整机最多两路、每路串行；运行前保留内存门槛检查。脚本保存完整30Hz姿态/关节检查、12fps预览、来源清单和原始警告；看样回执必须记录实际看过的图片，不由批处理自动授予通过。

预览的 `review/review.json` 保存12fps回放采样的固定内容矩形并集及视频哈希。正式高清制作时需从最终完整帧序列重新计算内容并集；不把预览采样边界当作最终App素材边界。肌群颜色、透明度和发光仍由appearance配方选择，换材质后另出预览供确认。
