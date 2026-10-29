# remaining219-r1 远端关键帧配方

按 `docs/remaining219-remote-agent-20261029-r1.md` 串行制作。每项一个 `recipes/<stableId>.json`（armfix 0.1.0-r2、固定镜头、无地影），批次索引在 `batches/`。

状态只到 `remote-keyframe-reviewed` 或 `needs-fix`；全部 `sampledOnly:true`、`fullCycleValidated:false`、`userAccepted:false`、`releaseEligible:false`。关键帧PNG不进Git，哈希记录在批次索引中，需本机按配方重放。

| 批次 | 动作 | 状态 |
| --- | --- | --- |
| batch01 | h-squat | 关键帧初查通过 |
| batch01 | w-dead-bug | 关键帧初查通过（镜头 k 0.75→0.95） |
| batch01 | h-short-side-plank | 待修：疑似肘撑屈膝侧平板被渲染为直臂掌撑 |
