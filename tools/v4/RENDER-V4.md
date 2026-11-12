# 任务卡：V4 全量渲染（249 个动作 × 5 套皮肤），每 10 个动作回报一次

只照做下面的命令，不判断画面好坏，不改任何代码、配方、配置。遇到本卡没写的情况：停下，把最后一行 JSON 原文贴到群里。

## 红线
- 不合并、不推 main、不打 tag、不发 Release、不上传媒体、不发布 pack、不切任何指针。
- 不删除 `F:\PoseHub-v3\runs\` 下任何东西（脚本只会把半成品**移动**到 `_quarantine`）。
- 整机同时只跑这一个渲染；跑期间不接别的渲染任务（有人派，回复「V4 全量渲染占用中」）。

## 一次性准备
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
git fetch origin
git checkout codex/v4-render
git pull --ff-only
git log --oneline -1
$R="F:\PoseHub-v3\runs\2026-11-12_v4_d6fb47c"
```
（python 不叫 `python` 时先 `$env:PYTHON='<python.exe 路径>'`。）

## 循环：第 1 批到第 25 批，依次执行
```powershell
node tools/v4/produce-v4.mjs --out $R --batch <N>
```
`<N>` 从 1 开始，每批结束后：

1. 在派任务的那条飞书话题里回复，@hark-sk，正文 = 「V4 进度」+ 最后一行 JSON 里 `report` 字段的文字（原样）。
2. 按退出码处理：
   - `0` 或 `3`（3 = 本批个别动作失败，其余已完成）：发完回报后**立刻**跑下一批 `N+1`。
   - `4`（预览推送失败，渲染本身没问题）：回报里附上 `error`，继续下一批。
   - `1`（预检拒绝，没渲染）：贴最后一行 JSON，停下等指示。
3. 中途断电/重启/卡死被关：重新打开 PowerShell，做「一次性准备」里的 `cd` 和 `$R`，用**同一个**批次号重跑，脚本会跳过已完成动作。

## 25 批跑完后
```powershell
node tools/v4/produce-v4.mjs --out $R --batch retry
```
只跑一次，按同样方式回报，并写「V4 全量渲染结束」。之后停下，不做任何上传。

## 说明（不用执行）
- 每个动作：`render-masters-joint.mjs --shoulder-axilla on --profile default`（5 套皮肤母帧）→ `compose.py --profile default`（每套皮肤的透明 webm、深/浅 mp4、封面、缩略图、关键帧）。与 r2-v12/r2-v13 线上成片同一入口；渲染内容固定为 main d6fb47c。
- 单个动作超过 90 分钟会被自动结束并记失败（`V4_ACTION_TIMEOUT_MIN` 可调），retry 批会补。
- 每批预览图（每动作一行、五皮肤一列）与进度推到孤立分支 `qa/v4-render-1112`，母帧和成片留在本机 `$R`。
