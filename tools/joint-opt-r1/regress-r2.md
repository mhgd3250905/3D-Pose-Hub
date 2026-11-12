# regress-r2：肩部腋窝 OFF / r1 / r2 全量回归 + 产品外观 A/B 出图（一条命令）

给本机渲染 Agent：**只执行下面的命令，不做任何判断、不改任何文件、不加参数。**

```powershell
cd <repo>
git fetch origin codex/joint-shoulder-axilla-r1
git checkout --detach <提交号>
git status --porcelain --untracked-files=no        # 必须没有输出
node tools/joint-opt-r1/regress-r2.mjs --out F:\PoseHub-v3\trial\shoulder-axilla-r2-regress-20261111
```

- `--out` 必须是**不存在的新目录**，已存在就报错退出（不覆盖）。
- 退出码：`0` 全部完成；`3` 中途中断/有动作失败/内存不足 → **只执行一次**
  `node tools/joint-opt-r1/regress-r2.mjs --resume F:\PoseHub-v3\trial\shoulder-axilla-r2-regress-20261111`
  （跳过已完成的动作，HEAD 或源文件变了会拒绝）；`2` 出图失败；`1` 启动失败。除上面那一次续跑外不要重试。
- 最后一行是一行 JSON 摘要：`{"ok":true,"complete":true,"actions":54,...}`。

## 做了什么（全部写死在 regress-r2.plan.json）
1. 54 个动作：普查里 47 个上臂抬举 >100° 的动作（同样的峰值帧，每动作至多 4 帧）+ 阶段 A 保护组中不在其中的 7 个
   （h-db-curl、h-catcow-quad、h-cobra、forearms-B、s-butterfly、h-russian-twist、h-crunch）。
2. 每帧：未安装（OFF）→ r1、r2 都装上并关闭（必须与 OFF 逐顶点相同）→ 只开 r1 → 只开 r2 → 再关闭（必须相同）。
   另查 rest 姿态打开、区域外位移、detach 后恢复。生产链 loadRecipe/openScene/stageAt，64 px，CPU 蒙皮读数。
3. 指标 = 阶段 A 肩部指标（翻面/折叠/压瘪、生产机位可见、固定阈值 11 个且 104.5 mm²），外加"可见法线偏差 >45°"面积。
4. 每测完一个动作追加一行到 `actions.jsonl`；全部完成后写 `regression.json`、`summary.txt`。
5. 然后自动出图：`render-ab-r1.mjs --plan <out>\render-plan.json --out <out>\render`
   （= render-ab-r2.plan.json 的 3 个试点 + 3 个对照，再加回归中 OFF→r2 变化最大的 3 个动作；每个都有全身 + 左右两侧特写，OFF | r2）。
   出图的前置条件同 render-ab-r1.md（npm install、Playwright 1.48.2、config.json、开发服务器自动启停、渲染锁）。

## 输出目录
`regress-state.json`、`progress.log`、`actions.jsonl`、`regression.json`、`summary.txt`、`render-plan.json`、
`render\ab-log.json`、`render\sheets\*.jpg`、`render\png\*.png`、`vite.log`（若脚本自己启动了开发服务器）。

## 只推结果文件（孤立分支，不碰工作区和当前分支）
```powershell
$R="F:\PoseHub-v3\trial\shoulder-axilla-r2-regress-20261111"; $S="$R-qa"
New-Item -ItemType Directory "$S\render" -Force | Out-Null
Copy-Item "$R\regress-state.json","$R\progress.log","$R\actions.jsonl","$R\regression.json","$R\summary.txt","$R\render-plan.json" $S -ErrorAction SilentlyContinue
Copy-Item "$R\render\ab-log.json" "$S\render" -ErrorAction SilentlyContinue
Copy-Item "$R\render\sheets" "$S\render\sheets" -Recurse -ErrorAction SilentlyContinue
$G=(Resolve-Path (git rev-parse --git-common-dir)).Path
$env:GIT_INDEX_FILE="$S.index"
git -C "$S" --git-dir="$G" --work-tree="$S" add -A .
$T=git --git-dir="$G" write-tree
$C=git --git-dir="$G" commit-tree $T -m "qa: shoulder-axilla r2 regression + OFF|r2 sheets (results only)"
Remove-Item Env:GIT_INDEX_FILE; Remove-Item "$S.index"
git push origin "${C}:refs/heads/qa/joint-shoulder-r2-1111"
git ls-remote origin qa/joint-shoulder-r2-1111
```
`render\png` 不推。

## 仅供沙箱测试的隐藏参数（本机不要用）
`--only <动作,…>`、`--no-render`、`--render-width <px>`；用了会在 regress-state.json 里标 `testMode:true`。
