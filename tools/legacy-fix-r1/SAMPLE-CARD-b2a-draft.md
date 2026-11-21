# 任务卡（草稿）：旧动作修复 r1 第 2 批补充 —— adductors-A（哥萨克蹲 lfx1）+ V5 裆部修复 crotchfix-v5-r1，1 个动作 720p 样片（Windows 本机渲染机器人照抄）

只照抄下面的命令，不判断画面好坏，不改任何代码、配方、配置。遇到本卡没写的情况：停下，把最后一行 JSON 原文贴到群里。
**这张卡只出样片。** 是否正式重渲、替换线上动作，等开哥审过样片后另定，不要自己跑别的命令。
**整机同时只跑一个渲染**：等 hark-sk 排到本卡再开始，前面有渲染在跑就等它跑完、回报之后再开始。

## 红线
- 只出样片。不合并、不推 main、不打 tag、不发 Release、不上传媒体、不发布 pack、不切任何指针（dev/beta/stable，含回滚）。
- 不删除 `F:\PoseHub-v3\runs\` 下任何东西（脚本只会把半成品**移动**到 `_quarantine`）。
- 整机同时只跑这一个渲染。
- 本批只用 `tools/legacy-fix-r1/produce-b2a.mjs`。不要用第 1 批的 `produce.mjs`、`tools/flare2-moves*/produce.mjs`、`tools/v5/produce-v5.mjs` 或别的脚本。
- 输出目录是新的 `2026-11-21_legacy-fix-r1-b2a-adductors-crotchfix_5ada6bc`，不要指向任何已有 run 目录（包括第 1 批的 `..._legacy-fix-r1-b1_76d3312`）。

## 命令（PowerShell，按顺序）
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
git status --short --untracked-files=no
git fetch origin
git checkout codex/legacy-fix-r1
git pull --ff-only
git log --oneline -1
node tools/legacy-fix-r1/produce-b2a.mjs --dry-run
node tools/legacy-fix-r1/produce-b2a.mjs --out F:/PoseHub-v3/runs/2026-11-21_legacy-fix-r1-b2a-adductors-crotchfix_5ada6bc
```
- 渲染内容提交（`produce-b2a.mjs` 里的 `RENDER`）= `5ada6bc`；`git log --oneline -1` 显示的是它之后只加本卡 / `produce-b2a.mjs` / CHANGES 的提交，正常。
- 第 2 行如果列出了任何文件（有未提交的改动），停下，把那几行贴到群里，不要往下做。
- `--dry-run` 那行最后一行 JSON 里 `"ok":true` 才继续；`"ok":false` 就停下，把那行贴到群里。
- `git checkout codex/legacy-fix-r1` 报本地没有这个分支时，改用 `git checkout -b codex/legacy-fix-r1 origin/codex/legacy-fix-r1`，其余照旧。
- python 不叫 `python` 时先 `$env:PYTHON='<python.exe 路径>'`；PATH 上要有 `ffmpeg`。
- 中途断电/重启/卡死被关：重新打开 PowerShell，从 `cd` 那行起再做一遍，同一条命令会跳过已完成的动作。

## Vite 报 504（Outdated Optimize Dep）
某个动作失败、它的日志 `F:\PoseHub-v3\runs\2026-11-21_legacy-fix-r1-b2a-adductors-crotchfix_5ada6bc\_run\logs\<id>.log` 里有 `504` / `Outdated Optimize Dep` 时，只重试**一次**：
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
Remove-Item -Recurse -Force node_modules\.vite
node tools/legacy-fix-r1/produce-b2a.mjs --out F:/PoseHub-v3/runs/2026-11-21_legacy-fix-r1-b2a-adductors-crotchfix_5ada6bc --vite-force
```
再失败就停下，贴最后一行 JSON。

## 回报
结束后在派任务的那条飞书话题里回复，@hark-sk，正文 = 「旧动作修复 r1 第2批补充样片（adductors-A）」+ 最后一行 JSON 里 `report` 字段的文字（原样）。按退出码：
- `0`：全部完成。
- `3`：个别动作失败，其余已完成 —— 回报里照抄 `report`（含失败的 id）。
- `4`：总览图推送失败（样片本身没问题）—— 回报附上 `error`。
- `1`：预检拒绝，没渲染 —— 贴最后一行 JSON，停下等指示。

然后停下，不做任何上传。

## 说明（不用执行）
- 改了什么：V5 模型 `CoachV3r3_3`（短裤/腿网格）裆部的蒙皮权重换成平滑过渡（补丁 `tools/v5/runtime/model/crotchfix-v5-r1.weights.json`），
  修掉髋深屈/大外展时裆部被单侧大腿拖出的鼓包。不改几何、不加骨骼、不改任何动作。母帧用 `tools/v5/render-masters-v5-cf1.mjs --crotchfix on`
  （普通 V5 渲染器的拷贝 + 这一个开关；不开时与原渲染器逐字节一致）。原渲染器和其他流水线一字未改，线上和别的批次不受影响。
- 1 个动作（动作 id 不变）：
| # | id | recipe | 说明 | 裆部鼓包 mm 修前 → 修后 |
|---|---|---|---|---|
| 1 | adductors-A | `catalog/production/legacy-fix-r1/recipes/adductors-A.json`（指向 `drill-anim/specs/adductors-A-lfx1.js`，921c1b3） | 哥萨克蹲第 1 批修复：站距 0.81 m、骨盆先侧移再下蹲、到底重心在下蹲脚内 3 cm、膝在脚内侧 1.5 cm、小腿拧转 -25.6° | 40.9 → 12.6 |

- 流程与第 1 批相同：母帧 → `tools/action-package-v3/compose.py --profile tools/v5/profile-v5.json`，同一套 V5 皮肤、投影、超时（单动作 25 分钟）/ 6 分钟无输出判卡死、被杀后重试一次、清理残留渲染锁。
- 预检：① 除本分支新增的文件外，与基准 `45a1c48`（codex/legacy-audit-r1）逐字节一致；② 渲染内容必须等于 `produce-b2a.mjs` 里写死的 `RENDER`（`5ada6bc`；之后只允许 `tools/legacy-fix-r1/`、`catalog/production/legacy-fix-r1/text` 不同，这些都不被渲染读取）。
- 产物（都留在本机）：`<out>\masters\<id>\`（1080 母帧）、`<out>\packages\<id>\v5-toon\`、`<out>\samples\<id>.720.mp4`（浅色 720p 循环样片，给开哥看的就是这个）。
- 总览拼图 `<out>\_qa\overview.jpg` 连同 `run-*.json`、`state.json`、`render.json`、`progress.log` 推到孤立分支 `qa/legacy-fix-r1-b2a`（首次运行时新建，无父提交）；视频、母帧、PNG 不进 Git。
- 样片里请重点看：到底时骨盆坐在下蹲脚正上方、下蹲膝对第二脚趾、伸直腿膝伸直且脚跟着地脚尖朝上；左右两侧镜像。
- 只做预检不渲染：`node tools/legacy-fix-r1/produce-b2a.mjs --dry-run`（打印计划，不建目录、不推送）。
