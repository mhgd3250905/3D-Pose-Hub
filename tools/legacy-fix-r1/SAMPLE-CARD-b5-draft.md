# 任务卡（草稿）：旧动作修复 r1 第 5 批 —— s-butterfly（平掌扶脚）、h-db-shrug / h-db-overhead-shrug（V5 肩胛上提）、h-sumo-pry / h-lateral-step-lunge（膝对脚尖），5 个动作 720p 样片，V5 裆部修复 crotchfix-v5-r2 开（Windows 本机渲染机器人照抄）

只照抄下面的命令，不判断画面好坏，不改任何代码、配方、配置。遇到本卡没写的情况：停下，把最后一行 JSON 原文贴到群里。
**这张卡只出样片。** 是否正式重渲、替换线上动作，等开哥审过样片后另定，不要自己跑别的命令。
**整机同时只跑一个渲染**：等 hark-sk 排到本卡再开始，前面有渲染在跑就等它跑完、回报之后再开始。

## 红线
- 只出样片。不合并、不推 main、不打 tag、不发 Release、不上传媒体、不发布 pack、不切任何指针（dev/beta/stable，含回滚）。
- 不删除 `F:\PoseHub-v3\runs\` 下任何东西（脚本只会把半成品**移动**到 `_quarantine`）。
- 整机同时只跑这一个渲染。
- 本批只用 `tools/legacy-fix-r1/produce-b5.mjs`。不要用 `produce.mjs` / `produce-b2.mjs` / `produce-b2a.mjs` / `produce-b3.mjs` / `produce-b4.mjs`、`tools/flare2-moves*/produce.mjs`、`tools/v5/produce-v5.mjs` 或别的脚本。
- 输出目录是新的 `2026-11-21_legacy-fix-r1-b5_7c28fb7`，不要指向任何已有 run 目录（包括第 1/2/3/4 批的 run 目录）。

## 命令（PowerShell，按顺序）
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
git status --short --untracked-files=no
git fetch origin
git checkout codex/legacy-fix-r1
git pull --ff-only
git log --oneline -1
node tools/legacy-fix-r1/produce-b5.mjs --dry-run
node tools/legacy-fix-r1/produce-b5.mjs --out F:/PoseHub-v3/runs/2026-11-21_legacy-fix-r1-b5_7c28fb7
```
- 渲染内容提交（`produce-b5.mjs` 里的 `RENDER`）= `7c28fb7`；`git log --oneline -1` 显示的是它之后只加本卡 / `produce-b5.mjs` 的提交，正常。
- 第 2 行如果列出了任何文件（有未提交的改动），停下，把那几行贴到群里，不要往下做。
- `--dry-run` 那行最后一行 JSON 里 `"ok":true` 才继续；`"ok":false` 就停下，把那行贴到群里。
- `git checkout codex/legacy-fix-r1` 报本地没有这个分支时，改用 `git checkout -b codex/legacy-fix-r1 origin/codex/legacy-fix-r1`，其余照旧。
- python 不叫 `python` 时先 `$env:PYTHON='<python.exe 路径>'`；PATH 上要有 `ffmpeg`。
- 中途断电/重启/卡死被关：重新打开 PowerShell，从 `cd` 那行起再做一遍，同一条命令会跳过已完成的动作。

## Vite 报 504（Outdated Optimize Dep）
某个动作失败、它的日志 `F:\PoseHub-v3\runs\2026-11-21_legacy-fix-r1-b5_7c28fb7\_run\logs\<id>.log` 里有 `504` / `Outdated Optimize Dep` 时，只重试**一次**：
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
Remove-Item -Recurse -Force node_modules\.vite
node tools/legacy-fix-r1/produce-b5.mjs --out F:/PoseHub-v3/runs/2026-11-21_legacy-fix-r1-b5_7c28fb7 --vite-force
```
再失败就停下，贴最后一行 JSON。

## 回报
结束后在派任务的那条飞书话题里回复，@hark-sk，正文 = 「旧动作修复 r1 第5批样片」+ 最后一行 JSON 里 `report` 字段的文字（原样）。按退出码：
- `0`：全部完成。
- `3`：个别动作失败，其余已完成 —— 回报里照抄 `report`（含失败的 id）。
- `4`：总览图推送失败（样片本身没问题）—— 回报附上 `error`。
- `1`：预检拒绝，没渲染 —— 贴最后一行 JSON，停下等指示。

然后停下，不做任何上传。

## 说明（不用执行）
- 5 个动作，按这个顺序渲染（动作 id 不变；全部用第 5 批 lfx1 新配方 `catalog/production/legacy-fix-r1/recipes/<id>.json`；母帧 `tools/v5/render-masters-v5-cf2.mjs --crotchfix r2`）：

| # | id | spec（7c28fb7） | 说明 |
|---|---|---|---|
| 1 | s-butterfly 蝴蝶坐 | `drill-anim/specs/s-butterfly-lfx1.js` | 开哥第 4 批意见：双手不再压小腿。两手平掌扶在两脚脚背上（手指朝脚尖），腕近中立：背伸 82–113°→11–20°，尺桡偏 40–60°→−10~+4°，手离脚面 1–11 mm，前屈时手不滑；身体、腿、节奏不变。文案 cue3「两手扶住脚，脚跟离身体近一点，膝盖自然往下落」、开头「扶脚往前送」（文案不进渲染） |
| 2 | h-db-shrug 哑铃耸肩 | `drill-anim/specs/h-db-shrug-lfx1.js` | 原来 V5 上完全不动；打开 V5 肩胛平移，双肩连哑铃上提约 5 cm 再放下，头颈不动 |
| 3 | h-db-overhead-shrug 过头哑铃耸肩 | `drill-anim/specs/h-db-overhead-shrug-lfx1.js` | 同上，双臂举过头时肩上提约 4 cm |
| 4 | h-sumo-pry 相扑深蹲肘推膝停留 | `drill-anim/specs/h-sumo-pry-lfx1.js` | 膝对脚尖：下蹲时膝不再往里扣（膝在脚内侧 21 cm→3 cm 以内，膝比脚尖略向外 15–23°），肘推时膝再往外一点；脚、深度、上身、合掌不变 |
| 5 | h-lateral-step-lunge 侧弓步 | `drill-anim/specs/h-lateral-step-lunge-lfx1.js` | 负重腿膝对脚尖：膝在脚内侧 7 cm→3.9 cm 以内，正面看小腿接近竖直；步幅、深度、节奏不变 |

- 流程与第 3 批相同：母帧 → `tools/action-package-v3/compose.py --profile tools/v5/profile-v5.json`，同一套 V5 皮肤、投影、超时（单动作 25 分钟）/ 6 分钟无输出判卡死、被杀后重试一次、清理残留渲染锁。
- 预检：① 除本分支新增的文件外，与基准 `6ac5b21`（codex/legacy-audit-r1 终版审计，已合入本分支）逐字节一致；② 渲染内容必须等于 `produce-b5.mjs` 里写死的 `RENDER`（`7c28fb7`；之后只允许 `tools/legacy-fix-r1/`、`catalog/production/legacy-fix-r1/text` 不同，这些都不被渲染读取）。
- 产物（都留在本机）：`<out>\masters\<id>\`（1080 母帧）、`<out>\packages\<id>\v5-toon\`、`<out>\samples\<id>.720.mp4`（浅色 720p 循环样片，给开哥看的就是这个）。
- 总览拼图 `<out>\_qa\overview.jpg` 连同 `run-*.json`、`state.json`、`render.json`、`progress.log` 推到孤立分支 `qa/legacy-fix-r1-b5`（首次运行时新建，无父提交）；视频、母帧、PNG 不进 Git。
- 样片里请重点看：s-butterfly 两手平放在脚背上、手腕不再折；两个耸肩能看出肩膀上下（肩颈处衣领有无异常折线）；h-sumo-pry、h-lateral-step-lunge 正面看负重腿膝盖在脚尖方向上、不往里扣。
- 只做预检不渲染：`node tools/legacy-fix-r1/produce-b5.mjs --dry-run`（打印计划，不建目录、不推送）。
