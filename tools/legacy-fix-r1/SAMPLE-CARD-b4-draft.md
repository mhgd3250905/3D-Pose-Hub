# 任务卡（草稿）：旧动作修复 r1 第 4 批 —— o-supported-march（lfx1 抬膝加高）+ t-seated-straddle-ext、s-butterfly（裆部补丁 r2），3 个动作 720p 样片，V5 裆部修复 crotchfix-v5-r2 开（Windows 本机渲染机器人照抄）

只照抄下面的命令，不判断画面好坏，不改任何代码、配方、配置。遇到本卡没写的情况：停下，把最后一行 JSON 原文贴到群里。
**这张卡只出样片。** 是否正式重渲、替换线上动作，等开哥审过样片后另定，不要自己跑别的命令。
**整机同时只跑一个渲染**：等 hark-sk 排到本卡再开始，前面有渲染在跑就等它跑完、回报之后再开始。

## 红线
- 只出样片。不合并、不推 main、不打 tag、不发 Release、不上传媒体、不发布 pack、不切任何指针（dev/beta/stable，含回滚）。
- 不删除 `F:\PoseHub-v3\runs\` 下任何东西（脚本只会把半成品**移动**到 `_quarantine`）。
- 整机同时只跑这一个渲染。
- 本批只用 `tools/legacy-fix-r1/produce-b4.mjs`。不要用 `produce.mjs` / `produce-b2.mjs` / `produce-b2a.mjs` / `produce-b3.mjs`、`tools/flare2-moves*/produce.mjs`、`tools/v5/produce-v5.mjs` 或别的脚本。
- 输出目录是新的 `2026-11-21_legacy-fix-r1-b4_6fd606e`，不要指向任何已有 run 目录（包括第 1/2/3 批的 run 目录）。

## 命令（PowerShell，按顺序）
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
git status --short --untracked-files=no
git fetch origin
git checkout codex/legacy-fix-r1
git pull --ff-only
git log --oneline -1
node tools/legacy-fix-r1/produce-b4.mjs --dry-run
node tools/legacy-fix-r1/produce-b4.mjs --out F:/PoseHub-v3/runs/2026-11-21_legacy-fix-r1-b4_6fd606e
```
- 渲染内容提交（`produce-b4.mjs` 里的 `RENDER`）= `6fd606e`；`git log --oneline -1` 显示的是它之后只加本卡 / `produce-b4.mjs` 的提交，正常。
- 第 2 行如果列出了任何文件（有未提交的改动），停下，把那几行贴到群里，不要往下做。
- `--dry-run` 那行最后一行 JSON 里 `"ok":true` 才继续；`"ok":false` 就停下，把那行贴到群里。
- `git checkout codex/legacy-fix-r1` 报本地没有这个分支时，改用 `git checkout -b codex/legacy-fix-r1 origin/codex/legacy-fix-r1`，其余照旧。
- python 不叫 `python` 时先 `$env:PYTHON='<python.exe 路径>'`；PATH 上要有 `ffmpeg`。
- 中途断电/重启/卡死被关：重新打开 PowerShell，从 `cd` 那行起再做一遍，同一条命令会跳过已完成的动作。

## Vite 报 504（Outdated Optimize Dep）
某个动作失败、它的日志 `F:\PoseHub-v3\runs\2026-11-21_legacy-fix-r1-b4_6fd606e\_run\logs\<id>.log` 里有 `504` / `Outdated Optimize Dep` 时，只重试**一次**：
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
Remove-Item -Recurse -Force node_modules\.vite
node tools/legacy-fix-r1/produce-b4.mjs --out F:/PoseHub-v3/runs/2026-11-21_legacy-fix-r1-b4_6fd606e --vite-force
```
再失败就停下，贴最后一行 JSON。

## 回报
结束后在派任务的那条飞书话题里回复，@hark-sk，正文 = 「旧动作修复 r1 第4批样片」+ 最后一行 JSON 里 `report` 字段的文字（原样）。按退出码：
- `0`：全部完成。
- `3`：个别动作失败，其余已完成 —— 回报里照抄 `report`（含失败的 id）。
- `4`：总览图推送失败（样片本身没问题）—— 回报附上 `error`。
- `1`：预检拒绝，没渲染 —— 贴最后一行 JSON，停下等指示。

然后停下，不做任何上传。

## 说明（不用执行）
- 3 个动作，按这个顺序渲染（动作 id 不变；母帧 `tools/v5/render-masters-v5-cf2.mjs --crotchfix r2`，即 V5 裆部权重修复 r2 开）：

| # | id | recipe | 说明 |
|---|---|---|---|
| 1 | o-supported-march 扶椅站姿交替抬膝 | `catalog/production/legacy-fix-r1/recipes/o-supported-march.json`（指向 `drill-anim/specs/o-supported-march-lfx1.js`，6fd606e） | 抬膝加高：抬起侧大腿离竖直 49°→85°（接近水平）、膝 108°→90°、小腿竖直下垂、脚尖略勾，脚离地 11 cm→37 cm；右、左交替与时长/缓动不变，支撑腿、骨盆、左手扶椅、右手下垂都不变 |
| 2 | t-seated-straddle-ext 坐姿大分腿 | `catalog/production/remaining32-r4/groups/thomas/t-seated-straddle-ext.json`（原配方，**未改**） | 只换裆部补丁 r1→r2：腰后/臀沟上端那道折棱（r1 35.2 mm）没了，最坏 21.8 mm |
| 3 | s-butterfly 蝴蝶坐 | `catalog/production/remaining219-r1/recipes/s-butterfly.json`（原配方，**未改**） | 只换裆部补丁 r1→r2：28.9→22.8 mm，背后腰带下缘更平顺 |

- 流程与第 3 批相同：母帧 → `tools/action-package-v3/compose.py --profile tools/v5/profile-v5.json`，同一套 V5 皮肤、投影、超时（单动作 25 分钟）/ 6 分钟无输出判卡死、被杀后重试一次、清理残留渲染锁。
- 预检：① 除本分支新增的文件外，与基准 `6ac5b21`（codex/legacy-audit-r1 终版审计，已合入本分支）逐字节一致；② 渲染内容必须等于 `produce-b4.mjs` 里写死的 `RENDER`（`6fd606e`；之后只允许 `tools/legacy-fix-r1/`、`catalog/production/legacy-fix-r1/text` 不同，这些都不被渲染读取）。
- 产物（都留在本机）：`<out>\masters\<id>\`（1080 母帧）、`<out>\packages\<id>\v5-toon\`、`<out>\samples\<id>.720.mp4`（浅色 720p 循环样片，给开哥看的就是这个）。
- 总览拼图 `<out>\_qa\overview.jpg` 连同 `run-*.json`、`state.json`、`render.json`、`progress.log` 推到孤立分支 `qa/legacy-fix-r1-b4`（首次运行时新建，无父提交）；视频、母帧、PNG 不进 Git。
- 样片里请重点看：o-supported-march 前半右膝、后半左膝抬到大腿水平、小腿垂直，上身不后仰；t-seated-straddle-ext / s-butterfly 坐地时臀部后上方没有折棱或尖角。
- 只做预检不渲染：`node tools/legacy-fix-r1/produce-b4.mjs --dry-run`（打印计划，不建目录、不推送）。
