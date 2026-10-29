# 身体 v3：当前入口与文档索引

当前已获用户网页看样确认的身体为 `training-human-v3-completed / 1.0.0-r7`。其上的可选接触扩展为 `training-human-v3-contact / 0.1.0-r5`，已完成所列局部复测和源码采纳。两者通过专用 loader 显式初始化；全局新生产配方仍由 [current-production.json](../../drill-anim/models/current-production.json) 选择 `training-human-v2plus / 1.0.0-rc2`。当前 Git／版本汇总以 [版本台账](../version-ledger.md) 为准。

2026-10-29首批32模板显式采用 `training-human-v3-armfix / 0.1.0-r2`、当前左右对称native手或固定握持，并接入脚踝 `ankle-join-r5`、大臂 `upper-arm-contour-r3` 和按需肘部 `elbow-dqs-r1`。这些成果已合入main；当前32为候选复核完成、用户验收待定，不扩大旧r7或局部大臂确认的范围。配方以 [remaining32-r4](../../catalog/production/remaining32-r4/README.md) 为入口，阶段版本、验证和后续见[收束汇总](../closeout-template-optimizations-20261029-r1.md)。

## 建议阅读顺序

| 需要了解什么 | 入口 |
| --- | --- |
| 当前腕踝肘、大臂及32模板成果；剩余219远端接力 | [本轮阶段收束](../closeout-template-optimizations-20261029-r1.md)、[弱云服务器任务](../remaining219-remote-agent-20261029-r1.md) |
| 已接受的固定握哑铃、腕部接入、main交付与阶段收束 | [手部／腕部成果交付](webxr-hand-wrist-delivery-20261028.md) |
| 保存了哪一版、源码 SHA、验证覆盖、剩余项 | [2026-10-28 r1 版本快照](snapshot-20261028-r1.md) |
| 为什么这样设计、问题如何定位、哪些方案被保留或放弃 | [设计与优化思路 r1](design-and-optimization-20261028-r1.md) |
| 用户实际接受了什么 | [r7 网页确认范围](review-approval-20261028-r2.md) |
| r7 如何独立进入 main、验收 tag 指向哪里 | [r7 集成记录](integration-20261028-r1.md) |
| PR17–22 哪些合入、哪些移植、哪些继续待审 | [选择性采纳记录](../reviews/pr17-22-adoption-20261028/adoption-record-r1.md) |

## 模型入口

| 对象 | 专用入口 | 当前证据范围 |
| --- | --- | --- |
| 身体 r7 | [loader](../../drill-anim/models/training-human-v3-completed-r7/loader.mjs)、[manifest](../../drill-anim/models/training-human-v3-completed-r7/manifest.json) | 七项身体修复的已记录采样和用户网页看样；验收 tag `body-v3-r7-accepted-20261028` |
| 接触／颈通道 r5 | [loader](../../drill-anim/models/training-human-v3-contact-r5/loader.mjs)、[manifest](../../drill-anim/models/training-human-v3-contact-r5/manifest.json) | r7 底座上的可选扩展；三个双手撑地时刻、四种颈姿及五个侧抬腿时刻的局部复核，完整动作仍逐项审核 |
| 固定握哑铃／腕部 r4 | [固定资源](../../drill-anim/models/webxr-dumbbell-wrist-r1/README.md)、[腕部loader](../../tools/body-v3/webxr-wrist-join-r1/loader.mjs) | 本次在armfix-r2初始化基础上验收的独立接入；主采样范围及75°压力失败见成果记录，尚未切换全部动作 |

`boot` 后在新页面调用一次 `applyV3`；r5 自己加载 r7，调用方直接选择最终入口。r7 的部分脚踝、法线、手腕钩子与页面同寿命，完全重新初始化需要新页面。安装和卸载规则详见各入口及[接触扩展复测](../reviews/pr17-22-adoption-20261028/pr21-adoption-r1.md)。

## 分项原始记录

| 主题 | 证据与已知限制 |
| --- | --- |
| P1 脚踝／鞋口 | [P1 复核](ankle-repair-r1.md)：保留旧最近点结果，结合三角面、多方向与四姿态；开放边限制保留 |
| P2 头颈、P3 领口、L1 手腕渐变、L2 法线 | [组合修复记录](completed-repairs-r1.md)：真实共享接缝、衣领外边界、手部 shader 与法线同步；该记录的 r5 是当时的身体组合中间版 |
| P5 肩部 | [肩部修复](shoulder-repair-r1.md)：相对姿态 morph、门控、领口材质共享状态修复及采样边界 |
| P4 髋膝 | [髋膝修复](p4-repair-r1.md)：局部姿态法线、自然膝窝接触与旧交线保留，最终消费入口为身体 r7 |
| 侧抬腿通用求解 | [PR18 采纳 r2](../reviews/pr17-22-adoption-20261028/pr18-adoption-r2.md) |
| 保速时序优化 | [PR19 采纳 r2](../reviews/pr17-22-adoption-20261028/pr19-adoption-r2.md)、[另8项待审原因](../reviews/pr17-22-adoption-20261028/pr19-timing-r1.md) |
| 新掌面拟合／颈通道 | [PR21 移植与复测](../reviews/pr17-22-adoption-20261028/pr21-adoption-r1.md) |

中间模型、manifest 的 pending 注记和日期化记录保留创建时身份；当前结论由台账与后续确认记录补充。相同 `r5` 后缀可能属于不同 profile，应同时记录 profile、version、loader 和 manifest SHA。

## 复现入口

在仓库根目录准备依赖、忽略的本机配置及 Vite。以下命令另存新输出，浏览器预览每次一路：

```sh
# 递归核验最终可选扩展及其 r7 底座
node --input-type=module -e "import('./drill-anim/models/training-human-v3-contact-r5/loader.mjs').then(async m => console.log(await m.verify()))"

# 无历史图片依赖的 r7 深蹲三姿态预览
node tools/body-v3/completed-v3-r1/preview-isolated-r7-r1.mjs <new-output-directory> --case squat --frames 1,3,5

# 新页面基线／候选的接触与颈部局部复核
node tools/body-v3/contact-r1/verify-live-r7.mjs <new-output-directory>
```

普通 `current` 渲染继续读取全局生产配方。本轮模板迁移显式选择armfix-r2，应另存动作修订并逐项审核接触、可达范围、左右语义、时序和镜头；当前范围以稳定ID清单为准：首批32候选、剩余219，旧“241动作”不是当前任务计数。远端只做串行关键帧初检，本机补完整循环和用户验收；整身GLB烘焙、正式高清及媒体／SDK升级另行安排。
