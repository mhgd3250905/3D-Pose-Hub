# 32动作模板优化版本快照：remaining32-template-optimizations-20261029-r1

本快照固定当前源码、32份动作配方、采用的手型/关节组件、镜头与低清预览。2份弯举模板已获动作/镜头/手型确认，30份仍为候选；熊式大臂r3另有局部外观确认，不计为第三份完整动作通过。最终高亮材质、高清批量制作和媒体发布仍待后续安排。

## 版本入口

- 机器清单：[当前32项版本索引](../../catalog/production/versions/remaining32-template-optimizations-20261029-r1.json)，记录逐项规格、配方、当前预览与SHA-256。
- 配方目录：`catalog/production/remaining32-r2/groups/`。全局生产入口仍为 `training-human-v2plus/1.0.0-rc2`，本模板批次显式使用 `training-human-v3-armfix/0.1.0-r2`。
- Git基线：`325c4c9cd633ce5552e5fe13d884cb2b6777952c`；工作分支 `codex/action-inventory-20261028`。本次本地提交以包含本文件的Git提交为准，精确提交号与源码包校验写入外部 `delivery-receipt.json`，避免清单自引用。
- 本地源码包：`F:/PoseHub-v2-production/version-snapshots/remaining32-template-optimizations-20261029-r1/source-checkpoint-final.zip`；保存本轮全部未提交源码及保留研究稿，包含文件清单、哈希和基线说明，不含成片或密钥配置。
- 本地验收：http://127.0.0.1:8844/；关节对照：http://127.0.0.1:8844/feedback-20261029/。

## 优化沿革与采用版本

| 范围 | 当前采用 | 本轮整理与验证边界 |
|---|---|---|
| 人体与双手基础 | armfix 0.1.0-r2；symmetric native c1r2 | 短臂外观、对称手源和明确姿势配置；不以名称替换代替新模型接触复核 |
| 固定握持与手腕 | webxr-dumbbell-wrist-r1，外观基准r4 | 固定握持与短腕变形带；3项哑铃动作及4项弹力带/毛巾无哑铃握持使用。已接受组件不等于全部动作通过；75度压力案例仍有失败 |
| 支撑、放松、辅助与native手 | fixed-hand-presets-r1 0.1.0-r1 | 其余25项逐动作选择；内收抬腿采用r5放松手型，未宣称四套新固定手均已用户验收 |
| 腕踝旋转路径 | 实际渲染回调逐帧采样 | 修正佐特曼半分摊分支、毛巾绕肩/下拉腕反折；检查连续路径，起止同向不能证明中途无180/360度额外扭转 |
| 脚踝 | ankle-join-r5 0.1.0-r5 | 熊式、臀桥；显式接缝对应和真实截面重整，浅鞋口纹仍保留；r1/r2/r3/r4失败或过渡试版不冒充采用版 |
| 肘部 | elbow-dqs-r1 0.1.0-r1 | L撑团身、托马斯侧撑；改善轴转时夹缩，接近180度奇异姿态及新模型仍需验证 |
| 大臂 | upper-arm-contour-r3 0.1.0-r3 | r1收凸起、r2局部补足、r3按全段测量修顺连续轮廓。熊式attempt11已局部确认，表面小波纹保留 |
| 镜头与内容范围 | 每动作固定镜头配方 | 无地面投影，保留人体明暗和必要道具；低清整循环固定内容范围，最终30FPS成片范围待生产时复核 |
| 发力肌群高亮 | highlight-presets.json | 橙红实色与半透明柔光均保留参数，selectedPreset=null；当前实色只是预览回退，不表示生理充血测量 |

`hand-wrist-corrective-r1`目录中的0.1.1-r2属于旧研究路径，不是当前已接受的WebXR腕部r4。保留稿和失败尝试仅为追溯，不进入默认生产配方。

## 当前32项与预览

| 动作 | ID | 采用规格 | 当前预览 | 验收状态 |
|---|---|---|---|---|
| 站姿踩带弹力带弯举 | `h-band-biceps-curl` | `h-band-biceps-curl-r5.js` | `attempt03` | 候选待审 |
| 扶椅背屈肘肱三头肌拉伸 | `h-chair-elbow-triceps-stretch` | `h-chair-elbow-triceps-stretch-r3.js` | `attempt01` | 候选待审 |
| 双哑铃过头耸肩 | `h-db-overhead-shrug` | `h-db-overhead-shrug-r4.js` | `attempt02` | 候选待审 |
| 站姿双哑铃反握弯举 | `h-db-reverse-curl` | `h-db-reverse-curl-r5.js` | `attempt04-warm` | 动作/镜头/手型已确认；材质待选 |
| 站姿双哑铃佐特曼弯举 | `h-db-zottman-curl` | `h-db-zottman-curl-r5.js` | `attempt02-warm` | 动作/镜头/手型已确认；材质待选 |
| 半跪姿手拉脚股四头肌拉伸 | `h-half-kneeling-quad-stretch` | `h-half-kneeling-quad-stretch-r4.js` | `attempt02` | 候选待审 |
| 站姿双臂后伸开肩 | `h-standing-arm-extension-stretch` | `h-standing-arm-extension-stretch-r5.js` | `attempt04` | 候选待审 |
| 仰卧仙人掌开胸 | `h-supine-cactus-chest` | `h-supine-cactus-chest-r3.js` | `attempt01` | 候选待审 |
| 熊式支撑 | `h-bear-plank` | `h-bear-plank-r4.js` | `attempt11` | 候选；大臂r3局部已确认 |
| 双手对抗弯举 | `h-biceps-self` | `h-biceps-self-r5.js` | `attempt04` | 候选待审 |
| 臀桥过头伸臂 | `h-bridge-overhead` | `h-bridge-overhead-r5.js` | `attempt08` | 候选待审 |
| 交叉臂肩后侧拉伸 | `h-crossbody` | `h-crossbody-r5.js` | `attempt04` | 候选待审 |
| 侧卧内收抬腿 | `h-inner-thigh` | `h-inner-thigh-r5.js` | `attempt07` | 候选待审 |
| 单臂壶铃摆荡 | `h-kb-swing` | `h-kb-swing-r5.js` | `attempt05` | 候选待审 |
| 慢速登山跑 | `h-mountain-climber` | `h-mountain-climber-r6.js` | `attempt05` | 候选待审 |
| 侧卧开书式 | `h-open-book` | `h-open-book-r5.js` | `attempt04` | 候选待审 |
| 派克俯卧撑 | `h-pike-pushup` | `h-pike-pushup-r5.js` | `attempt04` | 候选待审 |
| 后撤步弓步蹲 | `h-reverse-lunge` | `h-reverse-lunge-r5.js` | `attempt05` | 候选待审 |
| 背后握毛巾抬臂 | `h-towel-behind` | `h-towel-behind-r5.js` | `attempt05` | 候选待审 |
| 毛巾过头转肩 | `h-towel-pass` | `h-towel-pass-r6.js` | `attempt06` | 候选待审 |
| 站姿毛巾下拉 | `h-towel-pulldown` | `h-towel-pulldown-r6.js` | `attempt06` | 候选待审 |
| 靠墙单臂胸肌拉伸 | `h-wall-pec` | `h-wall-pec-r5.js` | `attempt05` | 候选待审 |
| 托马斯侧撑定格 | `t-flare-side-hold` | `t-flare-side-hold-r4.js` | `attempt08` | 候选待审 |
| L撑开合 | `t-lsit-open-close` | `t-lsit-open-close-r5.js` | `attempt02` | 候选待审 |
| L 撑↔团身 | `t-lsit-tuck` | `t-lsit-tuck-r4.js` | `attempt07` | 候选待审 |
| L 撑到 V 撑画圈 | `t-lsit-vsit-circles` | `t-lsit-vsit-circles-r4.js` | `attempt03` | 候选待审 |
| 宽腿L撑 | `t-lsit-wide` | `t-lsit-wide-r5.js` | `attempt02` | 候选待审 |
| 坐姿分腿屈伸 | `t-seated-straddle-ext` | `t-seated-straddle-ext-r5.js` | `attempt04` | 候选待审 |
| 坐姿分腿双腿抬起 | `t-seated-straddle-lifts` | `t-seated-straddle-lifts-r4.js` | `attempt03` | 候选待审 |
| 分腿支撑 | `t-straddle-hold` | `t-straddle-hold-r4.js` | `attempt02` | 候选待审 |
| 团身俄挺 | `t-tuck-planche` | `t-tuck-planche-r5.js` | `attempt02` | 候选待审 |
| V 撑 | `t-vsit` | `t-vsit-r5.js` | `attempt03` | 候选待审 |

## 已知保留项与后续边界

- 熊式大臂r3的小波纹/明暗分面在用户确认收尾时保留；不声称已消除。
- 脚踝鞋口浅纹、原生手型与其他动作外观沿各自记录待用户复核。几何检查不是任意姿态无自交的证明。
- 替换人体后必须重新校验骨架约定、尺寸、手脚接触、动作方向与固定取景；可复用的是配方和生产流程，而非自动继承验收。
- 本快照不推进新优化、高清生产、主线合并、推送或发布。继续工作时从本索引选择目标，不根据旧尝试编号重复派发整库。

## 验证与恢复

本次402份规格校验、7项可移植性测试、52项组件/工具测试均通过。暂存区检查另发现16处历史空行或行尾空格告警，已在validation.json及staged-whitespace.log列明；为保留旧源和哈希原样收录，不声称暂存区空白检查全绿。验证日志与机器结果保存在本地快照目录的 `verify.log`、`portability.log`、`component-tests.log` 和 `validation.json`。现有当前30项低清审计已完整解码；关键关节动作均保留实际渲染采样和图片哈希。旧计数401/402及早期attempt表均为当时快照，不改写历史报告。

优先从本次本地Git提交创建独立检出或工作树恢复源码。若使用源码ZIP，应先核对外部delivery receipt中的包SHA，再在上述gitBase的干净独立检出中按归档的文件清单恢复；不得在现有WIP上直接覆盖。源码包依赖该Git基线，不是独立模型素材仓库。F盘原媒体不进入Git或此源码ZIP，机器索引固定其路径和哈希；恢复后需确认这些本地证据仍可读。
