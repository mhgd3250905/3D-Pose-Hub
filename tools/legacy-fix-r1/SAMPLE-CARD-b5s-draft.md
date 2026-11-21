# 任务卡（草稿）：旧动作修复 r1 第 5s 批（第 5 批返工第二张）—— s-butterfly 手掌离脚 / h-sumo-pry 胸前合十，2 个动作 720p 样片，V5 裆部修复 crotchfix-v5-r2 开（Windows 本机渲染机器人照抄）

只照抄下面的命令，不判断画面好坏，不改任何代码、配方、配置。遇到本卡没写的情况：停下，把最后一行 JSON 原文贴到群里。
**这张卡只出样片。** 是否正式重渲、替换线上动作，等开哥审过样片后另定，不要自己跑别的命令。
**整机同时只跑一个渲染**：等 hark-sk 排到本卡再开始，前面有渲染在跑（包括第 5b、5r 批）就等它跑完、回报之后再开始。
**本卡取代第 5 批卡里的 s-butterfly、h-sumo-pry（lfx1 → lfx2）。第 5 批卡在分支头上预检会拒绝（配方已变），属预期。**

## 与其他卡的关系（在哪个提交上跑）
- 本卡（5s）：在分支 `codex/legacy-fix-r1` 的头上跑，`git log --oneline -1` 应显示本卡提交（`chore(legacy-fix-r1 b5s): ...`）；渲染内容提交 `RENDER` = `9213177`。
- 第 5b 批卡：仍固定在 `496ccf7` 上跑（卡里已写 `git checkout 496ccf7`），不受本卡影响。
- 第 5r 批卡：本卡的配方改动让它**在分支头上预检会拒绝**（`当前提交除本分支新增的旧动作修复文件外与基准 6ac5b21 不一致`）。正在跑的不用停；
  如果要重跑 / 断点续跑第 5r 批，先 `git checkout --detach ed30d67`（不要 `git pull`），再照第 5r 批卡的 `node tools/legacy-fix-r1/produce-b5r.mjs ...` 命令跑；跑完回到 `git checkout codex/legacy-fix-r1` 再跑本卡。第 5r 批卡文件本身没改。

## 红线
- 只出样片。不合并、不推 main、不打 tag、不发 Release、不上传媒体、不发布 pack、不切任何指针（dev/beta/stable，含回滚）。
- 不删除 `F:\PoseHub-v3\runs\` 下任何东西（脚本只会把半成品**移动**到 `_quarantine`）。
- 整机同时只跑这一个渲染。
- 本批只用 `tools/legacy-fix-r1/produce-b5s.mjs`。不要用 `produce.mjs` / `produce-b2.mjs` / `produce-b2a.mjs` / `produce-b3.mjs` / `produce-b4.mjs` / `produce-b5.mjs` / `produce-b5b.mjs` / `produce-b5r.mjs`、`tools/flare2-moves*/produce.mjs`、`tools/v5/produce-v5.mjs` 或别的脚本。
- 输出目录是新的 `2026-11-22_legacy-fix-r1-b5s_9213177`，不要指向任何已有 run 目录（包括第 1/2/3/4/5/5b/5r 批的 run 目录）。

## 命令（PowerShell，按顺序）
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
git status --short --untracked-files=no
git fetch origin
git checkout codex/legacy-fix-r1
git pull --ff-only
git log --oneline -1
node tools/legacy-fix-r1/produce-b5s.mjs --dry-run
node tools/legacy-fix-r1/produce-b5s.mjs --out F:/PoseHub-v3/runs/2026-11-22_legacy-fix-r1-b5s_9213177
```
- 渲染内容提交（`produce-b5s.mjs` 里的 `RENDER`）= `9213177`；`git log --oneline -1` 显示的是它之后只加本卡 / `produce-b5s.mjs` 的提交，正常。
- 第 2 行如果列出了任何文件（有未提交的改动），停下，把那几行贴到群里，不要往下做。
- `--dry-run` 那行最后一行 JSON 里 `"ok":true` 才继续；`"ok":false` 就停下，把那行贴到群里。
- `git checkout codex/legacy-fix-r1` 报本地没有这个分支时，改用 `git checkout -b codex/legacy-fix-r1 origin/codex/legacy-fix-r1`，其余照旧。
- python 不叫 `python` 时先 `$env:PYTHON='<python.exe 路径>'`；PATH 上要有 `ffmpeg`。
- 中途断电/重启/卡死被关：重新打开 PowerShell，从 `cd` 那行起再做一遍，同一条命令会跳过已完成的动作。

## Vite 报 504（Outdated Optimize Dep）
某个动作失败、它的日志 `F:\PoseHub-v3\runs\2026-11-22_legacy-fix-r1-b5s_9213177\_run\logs\<id>.log` 里有 `504` / `Outdated Optimize Dep` 时，只重试**一次**：
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
Remove-Item -Recurse -Force node_modules\.vite
node tools/legacy-fix-r1/produce-b5s.mjs --out F:/PoseHub-v3/runs/2026-11-22_legacy-fix-r1-b5s_9213177 --vite-force
```
再失败就停下，贴最后一行 JSON。

## 回报
结束后在派任务的那条飞书话题里回复，@hark-sk，正文 = 「旧动作修复 r1 第5s批样片」+ 最后一行 JSON 里 `report` 字段的文字（原样）。按退出码：
- `0`：全部完成。
- `3`：个别动作失败，其余已完成 —— 回报里照抄 `report`（含失败的 id）。
- `4`：总览图推送失败（样片本身没问题）—— 回报附上 `error`。
- `1`：预检拒绝，没渲染 —— 贴最后一行 JSON，停下等指示。

然后停下，不做任何上传。

## 说明（不用执行）
- 2 个动作，按这个顺序渲染（动作 id 不变；配方 `catalog/production/legacy-fix-r1/recipes/<id>.json` 已指向 lfx2；母帧 `tools/v5/render-masters-v5-cf2.mjs --crotchfix r2`）：

| # | id | spec（9213177） | 说明 |
|---|---|---|---|
| 1 | s-butterfly 蝴蝶式 | `drill-anim/specs/s-butterfly-lfx2.js` | 开哥第 5 批意见：手掌压进脚里。两手平掌扶在脚背上方，离两只脚（鞋）3–8 mm、任何帧不穿；坐直时手指外转、不再碰到另一只脚的脚趾；腕中立 |
| 2 | h-sumo-pry 相扑深蹲肘推膝停留 | `drill-anim/specs/h-sumo-pry-lfx2.js` | 开哥第 5 批意见：文案说合十，手却低在两膝间、两掌分开。改为胸前合十，两掌贴住（1.3 mm）、手指并拢朝上，肘尽量外展；膝盖修复（v2）与站距不变。文案 cue1 改「两手胸前合十，膝盖主动往外撑」，文字草稿未审 |

- 流程与第 3 批相同：母帧 → `tools/action-package-v3/compose.py --profile tools/v5/profile-v5.json`，同一套 V5 皮肤、投影、超时（单动作 25 分钟）/ 6 分钟无输出判卡死、被杀后重试一次、清理残留渲染锁。
- 预检：① 除本分支新增的文件外，与基准 `6ac5b21`（codex/legacy-audit-r1 终版审计，已合入本分支）逐字节一致；② 渲染内容必须等于 `produce-b5s.mjs` 里写死的 `RENDER`（`9213177`；之后只允许 `tools/legacy-fix-r1/`、`catalog/production/legacy-fix-r1/text` 不同，这些都不被渲染读取）。
- 产物（都留在本机）：`<out>\masters\<id>\`（1080 母帧）、`<out>\packages\<id>\v5-toon\`、`<out>\samples\<id>.720.mp4`（浅色 720p 循环样片，给开哥看的就是这个）。
- 总览拼图 `<out>\_qa\overview.jpg` 连同 `run-*.json`、`state.json`、`render.json`、`progress.log` 推到孤立分支 `qa/legacy-fix-r1-b5s`（首次运行时新建，无父提交）；视频、母帧、PNG 不进 Git。
- 样片里请重点看：蝴蝶式坐直和前屈时手掌都在脚背上方、贴近但不穿进鞋，指尖不碰另一只脚；前屈到底与过渡时手不突然跳动。相扑蹲两掌在胸前贴住、不互相穿过，手指朝上，蹲下起来时手跟着身体走、腕不过度折；膝盖仍对着脚尖方向。
- 只做预检不渲染：`node tools/legacy-fix-r1/produce-b5s.mjs --dry-run`（打印计划，不建目录、不推送）。
