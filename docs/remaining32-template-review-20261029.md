# 剩余 30 个动作模板：低清验收版

> 本文保留当时的候选快照与验证计数。当前采用版本、最新预览和局部用户确认以[优化版本快照](production-snapshots/remaining32-template-optimizations-20261029-r1.md)为准；原JSON报告不改写。

30 个剩余动作均已保存可复用配方、最新人体与手型配置、固定镜头，以及完整循环低清预览。此前两个弯举动作的动作/镜头认可保持独立。本轮 30 项仅通过代理候选检查，等待用户逐项验收。

验收页：http://127.0.0.1:8844/。输出保存在 `F:/PoseHub-v2-production/remaining32-template-r2-20261029/overnight/`。当前工作分支为 `codex/action-inventory-20261028`，工作目录为 `E:/AII-3D/3D-Pose-Hub-worktrees/action-inventory-20261028`。

## 保存内容与边界

- 配方入口：`catalog/production/remaining32-r2/groups/`；逐项证据与哈希清单：`catalog/production/remaining32-r2/overnight-candidates-20261029.json`。
- 明确采用 `training-human-v3-armfix/0.1.0-r2`；各动作显式选择握拳、支撑、放松或辅助手。必要墙面、垫块与器械保留，无地面投影。
- 480 像素、12 FPS 完整循环预览；动作求解与实际腕踝路径逐帧按 30 FPS 检查。镜头整段固定，预览内容矩形取播放采样帧并集；最终 30 FPS 成片的精确内容矩形仍留待正式生产。
- 保留实色橙红与半透明柔光参数；`highlight-presets.json` 中 `selectedPreset:null`，等用户决定后切换。
- 不覆盖历史动作或失败尝试；旧预览保留，验收索引选择最新已完成候选。模型更换后仍须检查兼容性、手脚接触与取景，原模板并不自动证明新模型通过。
- 尚未进行最终高清制作、用户内容验收、发布、合并或推送。

## 验证

30/30 当前配方与预览哈希一致，视频完整解码通过；全部有候选视觉记录。已检查连续腕踝相对路径，并检查固定握拳腕部变形压力；最终候选无未解决的多圈旋转或固定腕部压力标记。15 个工具测试、401 个动作规格验证、7 个可移植性检查通过。关节与蒙皮指标不能替代用户的完整视觉验收。

毛巾绕肩与下拉在复核中发现持续腕部反折，已改用与实际前臂一致的固定手基准；最新 241 帧均无压力标记，累计相对腕部旋转分别约 1.55° 与 0.68°。登山跑另外记录了足部蒙皮最低点，确认每帧至少一只脚贴地。

## 待验收候选

| 动作 | ID | 预览尝试 |
|---|---|---|
| 站姿踩带弹力带弯举 | `h-band-biceps-curl` | `attempt03` |
| 扶椅背屈肘肱三头肌拉伸 | `h-chair-elbow-triceps-stretch` | `attempt01` |
| 双哑铃过头耸肩 | `h-db-overhead-shrug` | `attempt02` |
| 半跪姿手拉脚股四头肌拉伸 | `h-half-kneeling-quad-stretch` | `attempt02` |
| 站姿双臂后伸开肩 | `h-standing-arm-extension-stretch` | `attempt04` |
| 仰卧仙人掌开胸 | `h-supine-cactus-chest` | `attempt01` |
| 熊式支撑 | `h-bear-plank` | `attempt01` |
| 双手对抗弯举 | `h-biceps-self` | `attempt04` |
| 臀桥过头伸臂 | `h-bridge-overhead` | `attempt04` |
| 交叉臂肩后侧拉伸 | `h-crossbody` | `attempt04` |
| 侧卧内收抬腿 | `h-inner-thigh` | `attempt03` |
| 单臂壶铃摆荡 | `h-kb-swing` | `attempt05` |
| 慢速登山跑 | `h-mountain-climber` | `attempt05` |
| 侧卧开书式 | `h-open-book` | `attempt04` |
| 派克俯卧撑 | `h-pike-pushup` | `attempt04` |
| 后撤步弓步蹲 | `h-reverse-lunge` | `attempt05` |
| 背后握毛巾抬臂 | `h-towel-behind` | `attempt05` |
| 毛巾过头转肩 | `h-towel-pass` | `attempt06` |
| 站姿毛巾下拉 | `h-towel-pulldown` | `attempt06` |
| 靠墙单臂胸肌拉伸 | `h-wall-pec` | `attempt05` |
| 托马斯侧撑定格 | `t-flare-side-hold` | `attempt05` |
| L撑开合 | `t-lsit-open-close` | `attempt02` |
| L 撑↔团身 | `t-lsit-tuck` | `attempt03` |
| L 撑到 V 撑画圈 | `t-lsit-vsit-circles` | `attempt03` |
| 宽腿L撑 | `t-lsit-wide` | `attempt02` |
| 坐姿分腿屈伸 | `t-seated-straddle-ext` | `attempt04` |
| 坐姿分腿双腿抬起 | `t-seated-straddle-lifts` | `attempt03` |
| 分腿支撑 | `t-straddle-hold` | `attempt02` |
| 团身俄挺 | `t-tuck-planche` | `attempt02` |
| V 撑 | `t-vsit` | `attempt03` |

## 本地恢复验收页

如本地服务关闭，在本工作目录执行：

```powershell
python -m http.server 8844 --bind 127.0.0.1 --directory F:/PoseHub-v2-production/remaining32-template-r2-20261029/overnight
```

收到用户反馈后，仅修订对应动作配方并生成新的尝试目录；通过的模板另存用户认可记录，最终统一生产。
