# 任务卡（草稿）：旧动作修复 r1 第 5b 批 —— serratus-A（肩胛平移手固定）、obliques-A（支撑脚随髋转）、h-side-leg-raise / hamstrings-A（单腿站重心上脚）、o-stand-quad / erectors-B（腕中立），6 个动作 720p 样片，V5 裆部修复 crotchfix-v5-r2 开（Windows 本机渲染机器人照抄）

只照抄下面的命令，不判断画面好坏，不改任何代码、配方、配置。遇到本卡没写的情况：停下，把最后一行 JSON 原文贴到群里。
**这张卡只出样片。** 是否正式重渲、替换线上动作，等开哥审过样片后另定，不要自己跑别的命令。
**整机同时只跑一个渲染**：等 hark-sk 排到本卡再开始，前面有渲染在跑就等它跑完、回报之后再开始。
**本卡固定在提交 `496ccf7`（第 5b 批脚本提交）上跑：分支头之后还有第 5r 批提交（改了两个耸肩配方），在分支头上跑本卡预检会以「渲染内容与 026a351 不一致」拒绝，所以下面用 `git checkout --detach 496ccf7`，不要 `git pull` 到分支头。**

## 红线
- 只出样片。不合并、不推 main、不打 tag、不发 Release、不上传媒体、不发布 pack、不切任何指针（dev/beta/stable，含回滚）。
- 不删除 `F:\PoseHub-v3\runs\` 下任何东西（脚本只会把半成品**移动**到 `_quarantine`）。
- 整机同时只跑这一个渲染。
- 本批只用 `tools/legacy-fix-r1/produce-b5b.mjs`。不要用 `produce.mjs` / `produce-b2.mjs` / `produce-b2a.mjs` / `produce-b3.mjs` / `produce-b4.mjs` / `produce-b5.mjs` / `produce-b5r.mjs`、`tools/flare2-moves*/produce.mjs`、`tools/v5/produce-v5.mjs` 或别的脚本。
- 输出目录是新的 `2026-11-22_legacy-fix-r1-b5b_026a351`，不要指向任何已有 run 目录（包括第 1/2/3/4/5 批的 run 目录）。

## 命令（PowerShell，按顺序）
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
git status --short --untracked-files=no
git fetch origin
git checkout --detach 496ccf7
git log --oneline -1
node tools/legacy-fix-r1/produce-b5b.mjs --dry-run
node tools/legacy-fix-r1/produce-b5b.mjs --out F:/PoseHub-v3/runs/2026-11-22_legacy-fix-r1-b5b_026a351
```
- 渲染内容提交（`produce-b5b.mjs` 里的 `RENDER`）= `026a351`；`git log --oneline -1` 应显示 `496ccf7`（026a351 之后只加了本卡 / `produce-b5b.mjs`）。
- 第 2 行如果列出了任何文件（有未提交的改动），停下，把那几行贴到群里，不要往下做。
- `--dry-run` 那行最后一行 JSON 里 `"ok":true` 才继续；`"ok":false` 就停下，把那行贴到群里。
- `git checkout --detach 496ccf7` 报找不到这个提交时，先再 `git fetch origin` 一次；还不行就停下贴报错。
- python 不叫 `python` 时先 `$env:PYTHON='<python.exe 路径>'`；PATH 上要有 `ffmpeg`。
- 中途断电/重启/卡死被关：重新打开 PowerShell，从 `cd` 那行起再做一遍（第 2 行若报有改动照样停下），同一条命令会跳过已完成的动作。

## Vite 报 504（Outdated Optimize Dep）
某个动作失败、它的日志 `F:\PoseHub-v3\runs\2026-11-22_legacy-fix-r1-b5b_026a351\_run\logs\<id>.log` 里有 `504` / `Outdated Optimize Dep` 时，只重试**一次**：
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
Remove-Item -Recurse -Force node_modules\.vite
node tools/legacy-fix-r1/produce-b5b.mjs --out F:/PoseHub-v3/runs/2026-11-22_legacy-fix-r1-b5b_026a351 --vite-force
```
再失败就停下，贴最后一行 JSON。

## 回报
结束后在派任务的那条飞书话题里回复，@hark-sk，正文 = 「旧动作修复 r1 第5b批样片」+ 最后一行 JSON 里 `report` 字段的文字（原样）。按退出码：
- `0`：全部完成。
- `3`：个别动作失败，其余已完成 —— 回报里照抄 `report`（含失败的 id）。
- `4`：总览图推送失败（样片本身没问题）—— 回报附上 `error`。
- `1`：预检拒绝，没渲染 —— 贴最后一行 JSON，停下等指示。

然后停下，不做任何上传。

## 说明（不用执行）
- 6 个动作，按这个顺序渲染（动作 id 不变；全部用第 5b 批 lfx1 新配方 `catalog/production/legacy-fix-r1/recipes/<id>.json`；母帧 `tools/v5/render-masters-v5-cf2.mjs --crotchfix r2`）：

| # | id | spec（026a351） | 说明 |
|---|---|---|---|
| 1 | serratus-A 俯卧撑加强 | `drill-anim/specs/serratus-A-lfx1.js` | 打开 V5 肩胛平移：肩胛前伸/后缩时双手固定在垫子上（原来手随肩上下：沉入垫子 22–28 mm、抬离 18–31 mm；现手离垫最低 1–2 mm） |
| 2 | obliques-A 野兽踢穿 | `drill-anim/specs/obliques-A-lfx1.js` | 支撑脚随髋绕前脚掌转：脚尖与膝方向差 89°→35°，不再拧脚踝；手、髋滚转、穿腿不变 |
| 3 | h-side-leg-raise 站姿侧抬腿 | `drill-anim/specs/h-side-leg-raise-lfx1.js` | 抬腿前先把重心移到站立脚（骨盆横移 9 cm，hark-sk 00:09 认可）：重心从站立脚外 4.5–5.6 cm → 脚内 2.9 cm；躯干侧倾 0°、骨盆水平、支撑膝不内扣 |
| 4 | hamstrings-A 单腿罗马尼亚硬拉 | `drill-anim/specs/hamstrings-A-lfx1.js` | 骨盆移向站立脚：重心从站立脚外 3.3–4.5 cm → 脚内 1.5 cm；髋保持方正 |
| 5 | o-stand-quad 站姿拉股四头 | `drill-anim/specs/o-stand-quad-lfx1.js` | 右手平掌扶在脚踝外侧（手指朝下盖住踝/跟），腕背伸 139–150°→约 8°、不偏（V5 手是一块张开的网格，握不拢） |
| 6 | erectors-B 瑞士球背伸 | `drill-anim/specs/erectors-B-lfx1.js` | 双手顺前臂贴在头侧/耳后（指尖朝太阳穴），腕背伸 103–106°→约 15°、不偏；身体、球、节奏不变 |

- 流程与第 3 批相同：母帧 → `tools/action-package-v3/compose.py --profile tools/v5/profile-v5.json`，同一套 V5 皮肤、投影、超时（单动作 25 分钟）/ 6 分钟无输出判卡死、被杀后重试一次、清理残留渲染锁。
- 预检：① 除本分支新增的文件外，与基准 `6ac5b21`（codex/legacy-audit-r1 终版审计，已合入本分支）逐字节一致；② 渲染内容必须等于 `produce-b5b.mjs` 里写死的 `RENDER`（`026a351`；之后只允许 `tools/legacy-fix-r1/`、`catalog/production/legacy-fix-r1/text` 不同，这些都不被渲染读取）。
- 产物（都留在本机）：`<out>\masters\<id>\`（1080 母帧）、`<out>\packages\<id>\v5-toon\`、`<out>\samples\<id>.720.mp4`（浅色 720p 循环样片，给开哥看的就是这个）。
- 总览拼图 `<out>\_qa\overview.jpg` 连同 `run-*.json`、`state.json`、`render.json`、`progress.log` 推到孤立分支 `qa/legacy-fix-r1-b5b`（首次运行时新建，无父提交）；视频、母帧、PNG 不进 Git。
- 样片里请重点看：serratus-A 肩胛动时手不离垫、不沉垫；obliques-A 踢穿时支撑脚跟着转、脚踝不拧；两个单腿站动作重心在站立脚上、上身不歪；o-stand-quad 右手扶在脚踝外侧、腕不折；erectors-B 双手贴头侧、腕不折。
- 只做预检不渲染：`node tools/legacy-fix-r1/produce-b5b.mjs --dry-run`（打印计划，不建目录、不推送）。
