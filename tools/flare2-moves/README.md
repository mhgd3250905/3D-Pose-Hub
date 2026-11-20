# 任务卡：Flare 2.0 新动作 r1 —— 8 个动作 V5 720p 样片（Windows 本机渲染机器人照抄）

只照抄下面的命令，不判断画面好坏，不改任何代码、配方、配置。遇到本卡没写的情况：停下，把最后一行 JSON 原文贴到群里。

## 红线
- 只出样片。不合并、不推 main、不打 tag、不发 Release、不上传媒体、不发布 pack、不切任何指针。
- 不删除 `F:\PoseHub-v3\runs\` 下任何东西（脚本只会把半成品**移动**到 `_quarantine`）。
- 整机同时只跑这一个渲染。

## 命令（PowerShell，按顺序）
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
git status --short --untracked-files=no
git fetch origin
git checkout codex/flare2-moves-r1
git pull --ff-only
git log --oneline -1
node tools/flare2-moves/produce.mjs --out F:/PoseHub-v3/runs/2026-11-20_flare2-moves-r1
```
- 第 2 行如果列出了任何文件（有未提交的改动），停下，把那几行贴到群里，不要往下做。
- python 不叫 `python` 时先 `$env:PYTHON='<python.exe 路径>'`；PATH 上要有 `ffmpeg`。
- 中途断电/重启/卡死被关：重新打开 PowerShell，从 `cd` 那行起再做一遍，同一条命令会跳过已完成的动作。
- 已渲染过、但之后配方有新提交（动作改过）的动作不算完成：脚本自动把它的旧母帧/成片**移动**到 `_quarantine` 再重渲，回报里写「配方已更新重渲」。

## 只重渲改过的动作（2026-11-20 手朝向修正：面墙倒立两个动作）
同上先 `cd` / `git status` / `git fetch` / `git checkout` / `git pull --ff-only` / `git log --oneline -1`，然后：
```powershell
node tools/flare2-moves/produce.mjs --out F:/PoseHub-v3/runs/2026-11-20_flare2-moves-r1 --only t-wall-handstand-hold,t-wall-handstand-shift
```
- 同一个 `--out`：这两个动作的旧结果会被移动到 `_quarantine` 后重渲，其余 6 个不动；总览图仍是 8 个动作。
- 回报同下面「回报」一节。

## Vite 报 504（Outdated Optimize Dep）
某个动作失败、它的日志 `F:\PoseHub-v3\runs\2026-11-20_flare2-moves-r1\_run\logs\<id>.log` 里有 `504` / `Outdated Optimize Dep` 时，只重试**一次**：
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
Remove-Item -Recurse -Force node_modules\.vite
node tools/flare2-moves/produce.mjs --out F:/PoseHub-v3/runs/2026-11-20_flare2-moves-r1 --vite-force
```
再失败就停下，贴最后一行 JSON。

## 回报
结束后在派任务的那条飞书话题里回复，@hark-sk，正文 = 「Flare2 新动作样片」+ 最后一行 JSON 里 `report` 字段的文字（原样）。按退出码：
- `0`：全部完成。
- `3`：个别动作失败，其余已完成 —— 回报里照抄 `report`（含失败的 id）。
- `4`：总览图推送失败（样片本身没问题）—— 回报附上 `error`。
- `1`：预检拒绝，没渲染 —— 贴最后一行 JSON，停下等指示。

然后停下，不做任何上传。

## 说明（不用执行）
- 8 个动作（`tools/flare2-moves/actions.json`）：t-chair-support-hold、t-pseudo-planche-pushup、t-tuck-lsit-hold、t-wall-handstand-hold、t-wall-handstand-shift、t-elevated-pike-hold、t-pike-hold、t-kneeling-wrist-flexor-stretch。
  配方 `catalog/production/flare2-moves-r1/recipes/<id>.json`，草稿文案 `catalog/production/flare2-moves-r1/text/<id>.json`（未审）。
- 流程与 V5 全量相同（`tools/v5/render-masters-v5.mjs` → `tools/action-package-v3/compose.py --profile tools/v5/profile-v5.json`，同一套 V5 皮肤、投影、超时/卡死处理）。
  预检：渲染内容必须等于 `6f9afdf`（托马斯补充发布分支），只允许本分支新增的文件不同（`produce.mjs` 里的 `EXCLUDE`）。
- 产物（都留在本机）：`<out>\masters\<id>\`（1080 母帧）、`<out>\packages\<id>\v5-toon\`（与 V5 相同的成片文件）、`<out>\samples\<id>.720.mp4`（浅色 720p 循环样片，给开哥看的就是这个）。
- 总览拼图 `<out>\_qa\overview.jpg`（每动作一行：浅色 start/peak/end + 深色封面）连同 `run-*.json`、`state.json`、`progress.log` 推到孤立分支 `qa/flare2-moves-r1`；视频、母帧、PNG 不进 Git。

