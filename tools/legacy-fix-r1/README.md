# 任务卡：旧动作修复 r1 第 1 批 —— 4 个修复动作 V5 720p 样片（Windows 本机渲染机器人照抄）

只照抄下面的命令，不判断画面好坏，不改任何代码、配方、配置。遇到本卡没写的情况：停下，把最后一行 JSON 原文贴到群里。
**这张卡只出样片。** 是否正式重渲、替换线上动作，等开哥审过样片后另定，不要自己跑别的命令。
**整机同时只跑一个渲染**：等 hark-sk 排到本卡再开始，前面有渲染在跑就等它跑完、回报之后再开始。

## 红线
- 只出样片。不合并、不推 main、不打 tag、不发 Release、不上传媒体、不发布 pack、不切任何指针（dev/beta/stable，含回滚）。
- 不删除 `F:\PoseHub-v3\runs\` 下任何东西（脚本只会把半成品**移动**到 `_quarantine`）。
- 整机同时只跑这一个渲染。
- 本批只用 `tools/legacy-fix-r1/produce.mjs`。不要用 `tools/flare2-moves*/produce.mjs`、`tools/v5/produce-v5.mjs` 或别的脚本。
- 输出目录是新的 `2026-11-21_legacy-fix-r1-b1_76d3312`，不要指向任何已有 run 目录。

## 命令（PowerShell，按顺序）
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
git status --short --untracked-files=no
git fetch origin
git checkout codex/legacy-fix-r1
git pull --ff-only
git log --oneline -1
node tools/legacy-fix-r1/produce.mjs --out F:/PoseHub-v3/runs/2026-11-21_legacy-fix-r1-b1_76d3312
```
- 渲染内容提交（`produce.mjs` 里的 `RENDER`）= `76d3312`；`git log --oneline -1` 显示的是它之后只加任务卡 / `produce.mjs` / 其他新文件的提交，正常。
- 第 2 行如果列出了任何文件（有未提交的改动），停下，把那几行贴到群里，不要往下做。
- `git checkout codex/legacy-fix-r1` 报本地没有这个分支时，改用 `git checkout -b codex/legacy-fix-r1 origin/codex/legacy-fix-r1`，其余照旧。
- python 不叫 `python` 时先 `$env:PYTHON='<python.exe 路径>'`；PATH 上要有 `ffmpeg`。
- 中途断电/重启/卡死被关：重新打开 PowerShell，从 `cd` 那行起再做一遍，同一条命令会跳过已完成的动作。
- 已渲染过、但之后配方有新提交（动作改过）的动作不算完成：脚本自动把它的旧母帧/成片**移动**到 `_quarantine` 再重渲，回报里写「配方已更新重渲」。

## Vite 报 504（Outdated Optimize Dep）
某个动作失败、它的日志 `F:\PoseHub-v3\runs\2026-11-21_legacy-fix-r1-b1_76d3312\_run\logs\<id>.log` 里有 `504` / `Outdated Optimize Dep` 时，只重试**一次**：
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
Remove-Item -Recurse -Force node_modules\.vite
node tools/legacy-fix-r1/produce.mjs --out F:/PoseHub-v3/runs/2026-11-21_legacy-fix-r1-b1_76d3312 --vite-force
```
再失败就停下，贴最后一行 JSON。

## 回报
结束后在派任务的那条飞书话题里回复，@hark-sk，正文 = 「旧动作修复 r1 第1批样片」+ 最后一行 JSON 里 `report` 字段的文字（原样）。按退出码：
- `0`：全部完成。
- `3`：个别动作失败，其余已完成 —— 回报里照抄 `report`（含失败的 id）。
- `4`：总览图推送失败（样片本身没问题）—— 回报附上 `error`。
- `1`：预检拒绝，没渲染 —— 贴最后一行 JSON，停下等指示。

然后停下，不做任何上传。

## 说明（不用执行）
- 4 个动作，按这个顺序渲染（动作 id 不变，每个配方指向新 spec，原 spec / 配方一字未改）：

| 顺序 | id | 配方 | 新 spec | 改了什么 |
|---|---|---|---|---|
| 1 | h-short-side-plank 屈膝短杠杆侧平板 | `catalog/production/legacy-fix-r1/recipes/h-short-side-plank.json` | `drill-anim/specs/h-short-side-plank-lfx1.js` | 双脚不再翻上：小腿平放身后、双脚叠放贴垫 |
| 2 | s-9090 90/90 坐姿换髋 | `catalog/production/legacy-fix-r1/recipes/s-9090.json` | `drill-anim/specs/s-9090-lfx1.js` | 按 Flare 文案重做为左右换髋往返、上身坐直 |
| 3 | h-squat 徒手深蹲 | `catalog/production/legacy-fix-r1/recipes/h-squat.json` | `drill-anim/specs/h-squat-lfx1.js` | 到底膝对脚尖，不再外翻 |
| 4 | deltoids-B 哑铃半程土耳其起立（至高桥） | `catalog/production/legacy-fix-r1/recipes/deltoids-B.json` | `drill-anim/specs/deltoids-B-lfx1.js` | 高桥撑地脚收到髋宽、膝对脚 |

  adductors-A（本分支之后单独修，未经复核）和 h-floor-nordic-hand-reset（误报，不修）**不在本卡**，脚本不会渲染它们。
- 流程与现有 V5 成片相同：母帧 `tools/v5/render-masters-v5.mjs`（普通 V5 渲染器，不用 flare2 r2/r3 扩展）→ `tools/action-package-v3/compose.py --profile tools/v5/profile-v5.json`，
  同一套 V5 皮肤、投影、超时（单动作 25 分钟）/ 6 分钟无输出判卡死、被杀后重试一次、清理残留渲染锁。`tools/v5` 一字未改，老动作不受影响。
- 预检：① 除本分支新增的文件外，与基准 `45a1c48`（codex/legacy-audit-r1）逐字节一致；② 渲染内容必须等于 `produce.mjs` 里写死的 `RENDER`（`76d3312`，hark-sk 复核通过的那个提交；
  之后只允许 `tools/legacy-fix-r1/`、s-9090 文字草稿、adductors-A 的新 spec/配方不同，这些都不被本卡渲染读取）。
- 产物（都留在本机）：`<out>\masters\<id>\`（1080 母帧）、`<out>\packages\<id>\v5-toon\`（与 V5 相同的成片文件）、`<out>\samples\<id>.720.mp4`（浅色 720p 循环样片，给开哥看的就是这个）。
- 总览拼图 `<out>\_qa\overview.jpg` 连同 `run-*.json`、`state.json`、`render.json`、`progress.log` 推到孤立分支 `qa/legacy-fix-r1-b1`（首次运行时新建，无父提交）；视频、母帧、PNG 不进 Git。
- 已知项（样片里可能看到，不是本卡问题）：s-9090 现行 Hub 文字仍是旧的单侧前倾，换髋版文字草稿 `catalog/production/legacy-fix-r1/text/s-9090.json` 未审，用哪版由开哥选；
  裆部鼓包（h-squat、s-9090、deltoids-B）是 V5 模型级问题，第 2 批统一修。
- 只做预检不渲染：`node tools/legacy-fix-r1/produce.mjs --dry-run`（打印计划，不建目录、不推送）。
