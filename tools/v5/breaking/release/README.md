# Breaking 动作定稿（Pose Studio 动画格式）

| 文件 | 动作 | 帧 | 来源 |
|---|---|---|---|
| breaking-2000.json | 2000（双手叠撑倒立旋转，右手轴手） | 914 @120fps | 视频驱动 r29（b2000_video/） |
| breaking-airflare.json | Air Flare（大回环，三圈） | 621 | 视频驱动 r7（airflare_r2…r7/，帧同 r5） |

- 预览：https://b2000.pose-studio.pages.dev/?anim=breaking-2000&clean=1 、?anim=breaking-airflare
- Pose Studio 部署时每个动画同时放 `<id>.json` 与 `<id>-v3r3.json`（缺了 Pages 会回 index.html）。
- Air Flare 劈叉裆部依赖 airflare_r4/r6 改过权重的 coach-v3r3.glb 和 airflare_r7/crotchfix.js；生产 pose.uuugk.win 与 V5 wristfix 模型尚未同步。
- md5：breaking-2000.json 82d1a4d9…，breaking-airflare.json 5f92dca9…
