# 肩部腋窝 r2 接入生产渲染链（试验，待用户看样）

用户 2026-11-11 11:47 同意"接入生产"。本次只接入**新母帧入口**并做试验重渲：不上传、不切指针、不改 reviewed/userAccepted。

## 生产链与接入点

| | 文件 | 说明 |
|---|---|---|
| 当前新母帧入口（基线） | `tools/skin-coverage-r1/render-masters.mjs` | 已批准外观 + 五皮肤修复；被 `tools/skin-coverage-r1/manifest.json` 按哈希固定，**未改** |
| 派生包 | `tools/action-package-v3/compose.py` | 母帧 → mp4 / 透明 webm / start-peak-end / 封面，**未改** |
| 旧批量驱动 | `tools/action-package-v3/produce.py` | 写死调用 action-package-v3 的旧母帧入口（无批准外观安装），**未改、不用** |
| **接入后入口（新增）** | `tools/joint-opt-r1/render-masters-joint.mjs` | = 基线入口逐行复制，只多一步：外观安装之后按开关安装 shoulder-axilla-r2 并开启 |
| 开关（新增） | `tools/joint-opt-r1/shoulder-axilla-production.json` | `"enabled": true`（本次默认开）；固定模块哈希和基线入口哈希 |
| 开关逻辑（新增） | `tools/joint-opt-r1/joint-production.mjs` | 读开关、核哈希、安装模块、逐帧记录门控/写入顶点数 |

- r2 模块本身已包含 r1 的位置修正（同区域、同权重扩散、同 90°→120° 渐入）+ 区域内法线重算。生产只装 r2 一个模块；**不再另装 r1**（两者都开会把位置修正叠两次）。这与回归里"r2"那一列的几何相同（回归里 r1 装着但关闭，关闭 = 无作用）。
- 基线入口被哈希固定：基线以后若有新版本，`joint-production.mjs` 会拒绝渲染，必须重新派生，不会拿旧复制品静默出图。
- `drill-anim/`、specs、骨骼、模型、外观/皮肤指针、recipe 均未改。

## 一键关闭 / 回退

任选其一，结果都与接入前逐像素一致：
1. 命令加 `--shoulder-axilla off`；
2. 把开关文件 `enabled` 改成 `false`；
3. 直接用基线入口 `tools/skin-coverage-r1/render-masters.mjs`（参数完全相同）。

关闭 = 模块根本不安装，页面里不执行任何关节代码。

## 用法

```powershell
node tools/joint-opt-r1/render-masters-joint.mjs --recipe <recipe.json> --root <新目录> [--shoulder-axilla on|off] [其余参数同基线入口]
python tools/action-package-v3/compose.py --root <同一目录> --id <动作>
```
`layer-manifest.json` 多两项：`jointOpt.shoulderAxilla`（开关来源、模块版本、安装证据）和每帧 `jointOpt.shoulderAxilla`（左右门控、写入顶点数、最大位移/法线变化）。

## 试验重渲（本机一条命令）

`node tools/joint-opt-r1/produce-joint-r2.mjs --out <新目录>`，计划写死在 `produce-joint-r2.plan.json`：回归中 OFF 超阈、r2 已修好的 21 个动作 + 4 个对照（abs-A、scapular-B、o-stand-crossreach 三个抬臂保护对照；h-db-curl 低臂对照，开启后应与关闭逐像素相同）。
每个动作：完整生产母帧（profile default：5 皮肤 × 3 层、1080、全部循环帧）→ compose 派生包 → 回归帧的 OFF 参照（realistic、body-highlight）→ OFF | ON 对比图（含差异区域放大）。
输出：`on/masters`、`on/packages`、`off-ref/masters`、`sheets/`、`run-log.json`、`progress.log`、`_qa/`（推送集）。

退出码：`0` 全部完成；`1` 预检拒绝（目录已存在、工作区有改动、缺 python/ffmpeg/node_modules、开发服务器起不来），未渲染；
`2` 渲染完成但 `_qa` 整理失败；`3` 未完成（某动作失败、内存不足或中断）→ 只允许执行一次 `--resume <同一目录>`。

## 测量脚本修正

`regress-r2.mjs` 的 rest 检查：以前 `motion.reset()` 后并未把求解器/手部安装动过的骨骼全部复位，"rest 开启差 1.92"测的其实是非 rest 姿态（模块关闭时同值）。
现在 `rest()` 额外恢复 openScene 后的全部骨骼快照；`restOnVsRestMax` 改为同一时刻 rest"开 vs 关"；原先的偏差另记 `restResetDriftMax`（框架复位误差，与模块无关）。不影响已有回归结论。

## 给本机渲染机器人的固定命令（只执行，不判断）

```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\joint-shoulder-axilla-r1
git fetch origin codex/joint-shoulder-axilla-r1
git checkout --detach <提交号>
git status --porcelain --untracked-files=no        # 必须没有输出，否则停止并回报
node tools/joint-opt-r1/produce-joint-r2.mjs --out F:\PoseHub-v3\trial\joint-shoulder-r2-prod-20261111
```
前置（该 worktree 上次已具备）：`npm install` 过（node_modules/vite、Playwright 1.48.2）、`drill-anim/config.json`（硬件 GL 的 chromium_args；不提交）、PATH 上的 `python`（numpy + Pillow，与 produce.py/compose.py 相同；不是这个名字就先 `$env:PYTHON='<python.exe>'`）和 `ffmpeg`（libx264 + libvpx-vp9）。开发服务器不用手动开，脚本按 config 的 app_url 自动启停（按 PID）。整机同时只跑这一个渲染。

- 退出码 `0`：完成，去推送。`1`：预检拒绝，未渲染 → 停止并回报最后一行。`2`：渲染完但 `_qa` 整理失败 → 回报。
  `3`：未完成 → **只执行一次** `node tools/joint-opt-r1/produce-joint-r2.mjs --resume F:\PoseHub-v3\trial\joint-shoulder-r2-prod-20261111`；续跑后仍非 0 → 停止并回报。
- 最后一行是一行 JSON：`{"ok":true,"complete":true,"actions":25,"done":25,"failed":[],...}`。

## 只推结果（孤立分支，不碰工作区和当前分支）

```powershell
$R="F:\PoseHub-v3\trial\joint-shoulder-r2-prod-20261111"; $S="$R\_qa"
$G=(Resolve-Path (git rev-parse --git-common-dir)).Path
$env:GIT_INDEX_FILE="$R\_qa.index"
git --git-dir="$G" --work-tree="$S" add -A .
$T=git --git-dir="$G" write-tree
$C=git --git-dir="$G" commit-tree $T -m "qa: shoulder-axilla r2 production-chain trial (results only)"
Remove-Item Env:GIT_INDEX_FILE; Remove-Item "$R\_qa.index"
git push origin "${C}:refs/heads/qa/joint-shoulder-r2-prod-1111"
git ls-remote origin qa/joint-shoulder-r2-prod-1111
```
`_qa` = sheets（每动作 OFF|ON 关键帧对比图 + 差异统计）、run-log.json、run-state.json、progress.log、plan.json、manifests（母帧摘要 + package.json）、videos（realistic 深色 720 mp4，单个 ≤8 MB 且合计 ≤60 MB，按计划顺序，超出的不推）。
完整母帧、五皮肤视频、透明 webm 留在本机 `$R\on\`（masters / packages），不上传、不进 Git。

回报格式（贴到话题）：退出码、最后一行 JSON、`git ls-remote` 输出的提交号；若失败，贴 progress.log 最后 10 行。
