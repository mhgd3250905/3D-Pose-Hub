# 任务卡：托马斯动作库补充 r1 —— 12 个动作 V5 720p 样片（Windows 本机渲染机器人照抄）

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
git checkout codex/thomas-supplement-r1
git pull --ff-only
git log --oneline -1
node tools/thomas-sup/produce.mjs --out F:/PoseHub-v3/runs/2026-11-19_thomas-supplement-r1
```
- 第 2 行如果列出了任何文件（有未提交的改动），停下，把那几行贴到群里，不要往下做。
- python 不叫 `python` 时先 `$env:PYTHON='<python.exe 路径>'`；PATH 上要有 `ffmpeg`。
- 中途断电/重启/卡死被关：重新打开 PowerShell，从 `cd` 那行起再做一遍，同一条命令会跳过已完成的动作。

## Vite 报 504（Outdated Optimize Dep）
某个动作失败、它的日志 `F:\PoseHub-v3\runs\2026-11-19_thomas-supplement-r1\_run\logs\<id>.log` 里有 `504` / `Outdated Optimize Dep` 时，只重试**一次**：
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
Remove-Item -Recurse -Force node_modules\.vite
node tools/thomas-sup/produce.mjs --out F:/PoseHub-v3/runs/2026-11-19_thomas-supplement-r1 --vite-force
```
再失败就停下，贴最后一行 JSON。

## 回报
结束后在派任务的那条飞书话题里回复，@hark-sk，正文 = 「托马斯补充样片」+ 最后一行 JSON 里 `report` 字段的文字（原样）。按退出码：
- `0`：全部完成。
- `3`：个别动作失败，其余已完成 —— 回报里照抄 `report`（含失败的 id）。
- `4`：总览图推送失败（样片本身没问题）—— 回报附上 `error`。
- `1`：预检拒绝，没渲染 —— 贴最后一行 JSON，停下等指示。

然后停下，不做任何上传。

## 说明（不用执行）
- 12 个动作（`tools/thomas-sup/actions.json`）：t-pushup-plus、t-kneeling-scap-pushup、t-frog-stand、t-planche-lean、t-seated-shoulder-ext-slide、
  t-self-resisted-wrist-flexion、t-self-resisted-wrist-extension、t-seated-forearm-rotation、t-hanging-leg-raise、t-straddle-active-lift、t-straddle-planche、t-pbar-support-swing。
  配方 `catalog/production/thomas-supplement-r1/recipes/<id>.json`，草稿文案 `catalog/production/thomas-supplement-r1/text/<id>.json`（未审）。
- 流程与 V5 全量相同（`tools/v5/render-masters-v5.mjs` → `tools/action-package-v3/compose.py --profile tools/v5/profile-v5.json`，同一套 V5 皮肤、投影、超时/卡死处理）。
  预检：渲染内容必须等于 main `94ff057`，只允许本分支新增的文件不同（`produce.mjs` 里的 `EXCLUDE`）。
- 产物（都留在本机）：`<out>\masters\<id>\`（1080 母帧）、`<out>\packages\<id>\v5-toon\`（与 V5 相同的成片文件）、`<out>\samples\<id>.720.mp4`（浅色 720p 循环样片，给开哥看的就是这个）。
- 总览拼图 `<out>\_qa\overview.jpg`（每动作一行：浅色 start/peak/end + 深色封面）连同 `run-*.json`、`state.json`、`progress.log` 推到孤立分支 `qa/thomas-supplement-r1`；视频、母帧、PNG 不进 Git。

## 正式发布（r2-v19，分支 codex/thomas-sup-publish）
开哥 2026-11-19 22:27 同意正式渲染、上传、准备新 pack（托马斯 App 用不用之后定；不切任何渠道指针）。
任务卡 `tools/thomas-sup/publish/PUBLISH-THOMAS-SUP.md`；`node tools/thomas-sup/produce.mjs --final` 是正式渲染入口（渲染内容必须等于样片通过的 b33b9ad）。
待开哥确认的文字/目录草稿汇总见 `tools/thomas-sup/publish/REVIEW-DRAFTS.md`。
