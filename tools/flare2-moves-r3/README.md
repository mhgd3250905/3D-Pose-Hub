# 任务卡：Flare 2.0 r3 第 2a 批 —— 6 个新动作 V5 720p 样片（Windows 本机渲染机器人照抄）

只照抄下面的命令，不判断画面好坏，不改任何代码、配方、配置。遇到本卡没写的情况：停下，把最后一行 JSON 原文贴到群里。
**这张卡只出样片。** 正式渲染（`--final`）等开哥审过样片后另发任务卡，不要自己跑。

## 红线
- 只出样片。不合并、不推 main、不打 tag、不发 Release、不上传媒体、不发布 pack、不切任何指针。
- 不删除 `F:\PoseHub-v3\runs\` 下任何东西（脚本只会把半成品**移动**到 `_quarantine`）。
- 整机同时只跑这一个渲染。
- 不要用 `tools/flare2-moves/produce.mjs`（r1 / r2-v20 的 8 个老动作）或 `tools/flare2-moves-r2/produce.mjs`（r2 第 1 批），本批只用 `tools/flare2-moves-r3/produce.mjs`。

## 命令（PowerShell，按顺序）
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
git status --short --untracked-files=no
git fetch origin
git checkout codex/flare2-moves-r3
git pull --ff-only
git log --oneline -1
node tools/flare2-moves-r3/produce.mjs --out F:/PoseHub-v3/runs/2026-11-21_flare2-moves-r3
```
- 渲染内容提交（`produce.mjs` 里的 `RENDER`）= `103c7c9`；`git log --oneline -1` 显示的是它之后只改任务卡/`produce.mjs` 的那个提交，正常。
- 第 2 行如果列出了任何文件（有未提交的改动），停下，把那几行贴到群里，不要往下做。
- python 不叫 `python` 时先 `$env:PYTHON='<python.exe 路径>'`；PATH 上要有 `ffmpeg`。
- 中途断电/重启/卡死被关：重新打开 PowerShell，从 `cd` 那行起再做一遍，同一条命令会跳过已完成的动作。
- 已渲染过、但之后配方有新提交（动作改过）的动作不算完成：脚本自动把它的旧母帧/成片**移动**到 `_quarantine` 再重渲，回报里写「配方已更新重渲」。

## Vite 报 504（Outdated Optimize Dep）
某个动作失败、它的日志 `F:\PoseHub-v3\runs\2026-11-21_flare2-moves-r3\_run\logs\<id>.log` 里有 `504` / `Outdated Optimize Dep` 时，只重试**一次**：
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
Remove-Item -Recurse -Force node_modules\.vite
node tools/flare2-moves-r3/produce.mjs --out F:/PoseHub-v3/runs/2026-11-21_flare2-moves-r3 --vite-force
```
再失败就停下，贴最后一行 JSON。

## 回报
结束后在派任务的那条飞书话题里回复，@hark-sk，正文 = 「Flare2 r3 第2a批样片」+ 最后一行 JSON 里 `report` 字段的文字（原样）。按退出码：
- `0`：全部完成。
- `3`：个别动作失败，其余已完成 —— 回报里照抄 `report`（含失败的 id）。
- `4`：总览图推送失败（样片本身没问题）—— 回报附上 `error`。
- `1`：预检拒绝，没渲染 —— 贴最后一行 JSON，停下等指示。

然后停下，不做任何上传。

## 说明（不用执行）
- 6 个动作（`tools/flare2-moves-r3/actions.json` 的 `actions`，全部新 id，不覆盖任何已有动作）：t-kneeling-wrist-pushup 跪姿手腕俯卧撑、
  t-kneeling-fist-plank 跪姿拳面支撑、t-prone-t-w 俯卧 T-W、t-forearm-side-plank 前臂侧桥（直腿）、t-straight-arm-side-plank-switch 直臂侧桥转换、
  t-planche-lean-hold 前倾支撑。本批没有 `deferred`。
  配方 `catalog/production/flare2-moves-r3/recipes/<id>.json`，草稿文案 `catalog/production/flare2-moves-r3/text/<id>.json`（AI 草稿，未审；剂量为草稿）。
- 流程与 r2 相同（母帧 → `tools/action-package-v3/compose.py --profile tools/v5/profile-v5.json`，同一套 V5 皮肤、投影、超时/卡死处理），
  母帧渲染器 `tools/flare2-moves-r3/v5/render-masters-v5r2.mjs`（r2 那份的副本，只改路径）+ 按动作开启的 `v5r2-ext.js`（与 r2 逐字节相同：手指姿势）；
  `tools/v5`、r1、r2 的文件一字未改，老动作不受影响。
- 预检：① 除本分支新增的文件外，与基准 `2b59eff`（codex/flare2-moves-r2 最新提交）逐字节一致；② 渲染内容必须等于
  `produce.mjs` 里写死的 `RENDER` 提交（回报给开哥的那个提交；之后只允许本卡 / `produce.mjs` / 文案草稿不同）。
- 产物（都留在本机）：`<out>\masters\<id>\`（1080 母帧）、`<out>\packages\<id>\v5-toon\`（与 V5 相同的成片文件）、`<out>\samples\<id>.720.mp4`（浅色 720p 循环样片，给开哥看的就是这个）。
- 总览拼图 `<out>\_qa\overview.jpg` 连同 `run-*.json`、`state.json`、`render.json`、`progress.log` 推到孤立分支 `qa/flare2-moves-r3`；视频、母帧、PNG 不进 Git。
- 正式渲染（开哥审过样片之后）：同一提交上 `node tools/flare2-moves-r3/produce.mjs --final`（默认 `--out F:/PoseHub-v3/runs/2026-11-21_flare2-r3-final_<RENDER 前 7 位>`，
  不接受 `--only`，QA 推 `qa/flare2-moves-r3-final`）。届时另发卡。
