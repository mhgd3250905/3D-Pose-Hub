# 任务卡：V5 全量渲染（249 个动作 × 1 套 V5 皮肤）+ 托马斯全旋，每 10 个动作回报一次

只照做下面的命令，不判断画面好坏，不改任何代码、配方、配置。遇到本卡没写的情况：停下，把最后一行 JSON 原文贴到群里。

## 红线
- 不合并、不推 main、不打 tag、不发 Release、不上传媒体、不发布 pack、不切任何指针。
- 不删除 `F:\PoseHub-v3\runs\` 下任何东西（脚本只会把半成品**移动**到 `_quarantine`）。
- 整机同时只跑这一个渲染；跑期间不接别的渲染任务（有人派，回复「V5 全量渲染占用中」）。

## 一次性准备
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
git fetch origin
git checkout codex/v5-toon-render
git pull --ff-only
git log --oneline -1
$R="F:\PoseHub-v3\runs\2026-11-17_v5_e4c3c78"
```
（python 不叫 `python` 时先 `$env:PYTHON='<python.exe 路径>'`。）

## A. 训练动作：第 1 批到第 25 批，依次执行
```powershell
node tools/v5/produce-v5.mjs --out $R --batch <N>
```
`<N>` 从 1 开始，每批结束后：

1. 在派任务的那条飞书话题里回复，@hark-sk，正文 = 「V5 进度」+ 最后一行 JSON 里 `report` 字段的文字（原样）。
2. 按退出码处理：
   - `0` 或 `3`（3 = 本批个别动作失败，其余已完成）：发完回报后**立刻**跑下一批 `N+1`。
   - `4`（预览推送失败，渲染本身没问题）：回报里附上 `error`，继续下一批。
   - `1`（预检拒绝，没渲染）：贴最后一行 JSON，停下等指示。
3. 中途断电/重启/卡死被关：重新打开 PowerShell，做「一次性准备」里的 `cd` 和 `$R`，用**同一个**批次号重跑，脚本会跳过已完成动作。

25 批跑完后：
```powershell
node tools/v5/produce-v5.mjs --out $R --batch retry
```
只跑一次，按同样方式回报，并写「V5 动作渲染结束」。

## B. 托马斯全旋（一条命令）
A 的 retry 跑完后执行（也可以被单独派发；同样先做「一次性准备」）：
```powershell
node tools/v5/thomas/render-thomas.mjs --out $R
```
结束后在同一话题回复 @hark-sk，正文 = 「V5 托马斯」+ 最后一行 JSON 的 `report`（原样）。退出码 `0`：完成；`4`：预览推送失败（成片没问题），回报附 `error`；`1`/`3`：贴最后一行 JSON，停下等指示。中断后用同一条命令重跑即可（已完成会直接跳过）。之后停下，不做任何上传。

## 说明（不用执行）
- V5 画面 = Pose Studio v3r7 定版日漫三渲二（coach-v3r3 模型 + toon r5 画法：屏幕空间粗色线描边、两阶硬边平涂、无边缘光）+ v3r8b 手腕修复（coach-v3r3-wristfix.glb：每侧 6 根前臂扭转骨 + 2 根腕部辅助骨，wristfix-r2 驱动；hub 腕扭转分摊对 V5 为 0，不叠加）。
- A 每个动作：`tools/v5/render-masters-v5.mjs`（hub 配方场景照常逐帧求解动作、道具、固定机位，和 V4 同一套；姿势拷到 V5 模型上渲染，光头、无特效、地面硬边投影；hub 脊柱弯曲时在骨盆→躯干间重分配 spineLower/Upper，躯干枢轴与 hub 重合）→ `compose.py --profile tools/v5/profile-v5.json`。成片与 V4 default 同一套文件、尺寸、帧率、命名：`packages/<id>/v5-toon/loop.alpha.720.webm`、`{dark,light}/loop.720.mp4`、`cover.720.jpg`、`thumbnail.240.jpg`、`{start,peak,end}.720.png`、`peak.highlight-off.720.png`、`cover.transparent.1080.png`、`first-frame.transparent.1080.png`，以及 `framing.json`、`package.json`。只有 1 套皮肤 `v5-toon`；V5 没有肌肉高亮，所以 highlight-off 与正常图相同。
- B：Pose Studio v3r7 默认入口的 flare-arm8legs 双腿伸直托马斯，刺猬头 spiky，fx 全开（火焰脚尖拖尾、星点、撑地圈、硬边投影）+ 手腕修复；30fps、81 帧一圈（= 网页默认 0.5× 播放速度），输出 `packages/thomas-flare-arm8legs/v5-toon/` 下与 A 同一套格式。透明成片里投影改为半透明暖黑（浅色背景下与网页观感一致，深色背景下不发亮）。
- 单个动作超过 90 分钟会被自动结束并记失败（`V5_ACTION_TIMEOUT_MIN` 可调），retry 批会补。
- 每批预览图（每动作一行：浅色 start/peak/end + 深色封面）与进度推到孤立分支 `qa/v5-render-1117`，母帧和成片留在本机 `$R`。渲染内容固定为 main e4c3c78 + 本分支 `tools/v5/`。
