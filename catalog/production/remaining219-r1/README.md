# remaining219-r1 远端关键帧配方

按 `docs/remaining219-remote-agent-20261029-r1.md` 在弱云服务器（aarch64、2核、8GB、软件 WebGL）串行制作。每项一个 `recipes/<stableId>.json`（armfix 0.1.0-r2、固定镜头、无地影），批次索引在 `batches/`，诊断镜头配方在 `diagnostics/`（不用于交付）。

每项两道检查：
1. `remote-rotation-r1.mjs`：15Hz 顺序求解、不出图，计算前臂|大臂、手|前臂、脚|小腿的轴向扭转并展开角度，标出范围>120°、单步>25°、净转>150°（首尾相同的180/360°绕圈会被看到）。
2. `remote-keyframes-r1.mjs`：256px 3–6 张，被标记的关节在扭转最大时刻另拍 320px 近景。

状态只到 `remote-keyframe-reviewed*` 或 `needs-fix`；全部 `sampledOnly:true`、`fullCycleValidated:false`、`userAccepted:false`、`releaseEligible:false`。关键帧PNG不进Git，哈希在批次索引中，本机按配方重放。

源码恢复包补回的50个旧规格登记在 `drill-anim/data/home-pr-candidates.json`（status `restored-remaining219-source-pack-r1`，reviewed false），内容与固定队列的 LF SHA 一致。

| 批次 | 动作 | 状态 |
| --- | --- | --- |
| batch01 | h-squat | 关键帧初查通过，扭转正常 |
| batch01 | w-dead-bug | 关键帧初查通过；镜头 k 0.75→0.95；举臂过头时前臂轴向扭转187°被标记，320px 近景未见扭结，留本机复核 |
| batch01 | h-short-side-plank | 姿态正确（肘撑、屈膝68°）；仅改为高位镜头以看清前臂和屈膝，待用户确认镜头 |
