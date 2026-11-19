# 任务卡：托马斯动作库补充 12 个动作 —— 正式渲染 + 上传 + 准备新 pack r2-v19（Windows 本机渲染机器人照抄）

开哥 2026-11-19 22:27 已同意：「先把它渲染出来，准备好，然后上传到服务器这些嘛。至于托马斯 APP 要不要用，我后面再决定」。
本卡只做：正式渲染 → 导出成片 → 合成语音 → 生成 r2-v19 目录 → 核对 → 上传新对象。**不切任何渠道指针。**

只照抄下面的命令，不判断画面好坏，不改任何代码、配方、配置、文字。
遇到本卡没写的情况：停下，把最后一行输出原文贴到话题里。每做完一步（A–I）在派任务的那条飞书话题里回复并 @hark-sk，
正文 = 「托马斯 r2-v19 第 X 步」+ 该步要求回报的内容（原样，不加评价）。任何一步报错就停下，把完整报错原样回报，不要自己修。

内容（仅供记录）：r2-v19 = 线上 r2-v18 的 249 个动作逐字节不变 + 末尾追加 12 个托马斯补充动作（`tools/thomas-sup/actions.json`）。
新对象键只追加：成片 `pack/r2-v1/media/<id>/r2-v19/`、语音 `pack/r2-v1/voice/<id>/r2-v19/`、目录 `pack/r2-v19/`。
共用词沿用 r2-v18，不重合成。各 App 都按自己的动作白名单显示，新动作进目录不会出现在 Hip/Flare 里，等开哥决定。

## 红线
- **不写任何渠道指针**：`pack/channels/dev.json`、`beta.json`、`stable.json` 一个都不写、不改、不删。本卡生成的文件里没有指针
  （`pointer-preview.json` 只给 G 步本地预检用，**不上传**；`plan.json` 里也没有它）。
- 不删除、不覆盖任何已有东西：R2 上已有对象（r2-v1 前缀下所有旧成片/语音、`pack/r2-v14`…`pack/r2-v18` 目录）一律不动；
  `F:\PoseHub-v3\runs\` 下已有的母帧和成片不动（包括 r1–r5 样片目录）。
- 不合并 PR、不推 main、不打 tag、不发 Release、不改任何仓库代码，不碰 Flare（3D-Body）仓库。
  唯一允许的推送：C 步 `produce.mjs` 自己把总览图推到孤立分支 `qa/thomas-sup-final`。
- 整机同时只跑这一个任务；有人派别的渲染/上传，回复「托马斯 r2-v19 占用中」。

## A. 准备
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
git status --porcelain --untracked-files=no      # 必须没有输出，否则停下回报
git fetch origin
git checkout --detach origin/codex/thomas-sup-publish
git log --oneline -1                             # 回报这一行，应为派卡消息里写的提交
$C = git rev-parse HEAD
$R = "F:\PoseHub-v3\runs\2026-11-19_thomas-sup-final_b33b9ad"
$P = "F:\PoseHub-v3\app-pack\r2-v19"
$V = "F:\PoseHub-v3\runs\2026-11-19_thomas-sup-voice"
$W = "F:\PoseHub-v3\work\thomas-sup-r2-v19-upload"
New-Item -ItemType Directory -Force $W | Out-Null
```
F 盘剩余不少于 20 GB，不够就停下回报。python 不叫 `python` 时先 `$env:PYTHON='<python.exe 路径>'`，下面的 `python` 都换成该路径；
ffmpeg、ffprobe 在 PATH；Edge TTS（`edge_tts`）与 r2-v14 语音时同一个 python 环境。

回报：`git log --oneline -1` 原文、F 盘剩余 GB。

## B. 回读线上（只读，不写任何东西）
1. 读 https://media.uuugk.win/pack/channels/dev.json、beta.json、stable.json，原文存到 `$W\channels-before.json`（三个一起），原样回报。
   （应都是 `pack=r2-v18`、`catalog_sha256=1de7303f…`；不一样也不要动，照实回报后继续。）
2. 读 https://media.uuugk.win/pack/r2-v19/catalog.json：必须是 404。不是 404：停下回报。

回报：三个指针原文、r2-v19 的 HTTP 状态码。

## C. 正式渲染（12 个动作，可续跑）
```powershell
node tools/thomas-sup/produce.mjs --final
```
- 与样片同一套 V5 渲染（`render-masters-v5.mjs` → `compose.py --profile tools/v5/profile-v5.json`），输出到 `$R`。
  预检会确认渲染内容与开哥看过的样片提交 b33b9ad 完全相同，不同就拒绝（退出码 1）。
- 中途断电/重启/卡死被关：重新打开 PowerShell，从 A 的 `cd` 那行起（跳过 `git checkout`，`git log -1` 仍应是同一提交）再跑同一条命令，已完成的动作会跳过。
- Vite 报 504（某动作日志 `$R\_run\logs\<id>.log` 里有 `504` / `Outdated Optimize Dep`）：只重试一次
  `Remove-Item -Recurse -Force node_modules\.vite` 后 `node tools/thomas-sup/produce.mjs --final --vite-force`；再失败停下。
- 退出码：`0` 继续；`4`（总览推送失败，成片没问题）回报 `error` 后继续；`3`（个别动作失败）先原命令重跑一次，仍是 3 就停下；`1` 停下。

回报：最后一行 JSON 里 `report` 字段原文。

## D. 导出 36 个成片（可续跑）
用与 r2-v18（V5 发布第 C 步）**同一个生产导出器、同一套参数**（x264 crf27 slow，720×1440 yuv420p，rgb 在上、alpha 在下；
cover 640 webp、thumbnail 192 webp、质量 80），只换输入、版本号和动作名单：
- 名单：`tools\thomas-sup\actions.json` 里的 12 个 id。
- 输入：`$R\packages\<id>\v5-toon\`（文件与 r2-v18 的 V5 输入同名同规格）。
- 输出（共 36 个文件）：
  - `$P\media\<id>\r2-v19\<id>.rgb-alpha.mp4`
  - `$P\media\<id>\r2-v19\<id>.cover.alpha.webp`
  - `$P\media\<id>\r2-v19\<id>.thumbnail.alpha.webp`
- 已存在且非空的输出跳过（中断后原命令重跑）。x264 报 malloc/内存错误：该动作线程 1 重试一次；仍失败停下。
- 任一动作缺 `$R\packages\<id>\package.json` 或 `v5-toon` 成片：停下，回报缺了哪些。

回报：导出文件数、耗时、失败数。

## 【文字闸门】
新动作的文字、讲解语音稿（voiceGuide）和目录字段是 AI 草稿，开哥还没审。
**派卡消息里如果写了「E 步等确认」：做完 D 就停下回报，等 hark-sk 在话题里回复「继续 E」再往下。** 没写就直接继续。

## E. 语音（160 段，可续跑）
```powershell
python tools/thomas-sup/publish/voice_ts.py --render-root $R --out $V
```
- 只合成 12 个新动作：每个动作名称、开组要领、三句相位（中英）+ voiceGuide 自写句（中英），共 160 段；共用词不合成。
- 退出码 `0` 继续；`3`（个别失败或审核不过）原命令重跑一次，仍是 3 停下回报最后一行 JSON；`1` 停下回报。

回报：最后一行 JSON 里 `report` 字段原文。

## F. 生成目录 + 本地核对 + 线上空号核对
```powershell
python tools/thomas-sup/publish/build_r2_v19.py --out $P --source-commit $C --render-root $R --media-root $P --voice-root $V
python tools/thomas-sup/publish/verify_ts_media.py local  "$P\catalog.json" --media-root $P --voice-root $V
python tools/thomas-sup/publish/verify_ts_media.py absent "$P\catalog.json" --plan "$P\plan.json"
```
- build 退出码必须 0（最后一行 JSON `problemCount` = 0、`uploadFiles` = 200、`mediaFiles` = 36、`voiceFiles` = 160）。
  不是 0：停下，回报 `$P\report.json` 里 `problems` 原文（前 50 条）。
- `$P` 下**不应该有** `channels` 目录；有就停下回报。
- verify local 退出码必须 0（`checked` 196、`ok` 196）。
- verify absent 退出码必须 0（`checked` 200、`ok` 200 = 200 个对象键线上都还不存在）。不是 0：停下回报最后一行 JSON，不上传。

回报：build 最后一行 JSON；两个 verify 的最后一行 JSON。

## G. 本地 SDK 预检（上传前，两个 SDK 版本）
在 ugk-3d-pose-sdk 仓库建两个临时 worktree（先 `git fetch origin`）：
- `<T1>` = `036b5fcdc8bbe3e7ed13e629accf2287c3004ad8`（SDK 0.8.0）
- `<T2>` = `85b57fda632f1f25eb94514d44e00e214cf9f7f5`（SDK 1.0.1，tag ugk_trainer-v1.0.1，Hip/Flare 当前锁定）
```powershell
git worktree add --detach <T1> 036b5fcdc8bbe3e7ed13e629accf2287c3004ad8
git worktree add --detach <T2> 85b57fda632f1f25eb94514d44e00e214cf9f7f5
```
把 Pose-Hub 工作树里的 `tools\thomas-sup\publish\ts_preflight_test.dart` 分别复制到 `<T1>\packages\ugk_trainer_runtime\test\`
和 `<T2>\packages\ugk_trainer_runtime\test\`，各自 `cd` 到 `packages\ugk_trainer_runtime`，`flutter pub get`，然后：
```powershell
$env:TSPF_PACK_DIR='F:\PoseHub-v3\app-pack\r2-v19'
$env:TSPF_BASE_DIR='E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110\tools\thomas-sup\publish\base-r2-v18'
flutter test test/ts_preflight_test.dart
```
（只读本地文件，不联网、不读不写线上指针。）两个都必须 `All tests passed`，且 `TS_PREFLIGHT` 行里 `outcome` = `updated`、`pack` = `r2-v19`、
`actions` = 261、`oldFieldDiff` = 0、`newMediaFiles` = 36、`guideSentences` = 521、`missingClips` = 0、`textMismatch` = 0。
任一不通过：停下，原样回报 `TS_PREFLIGHT` 整行和报错，**不上传**。

回报：两行 `TS_PREFLIGHT`（原样）。

## H. 上传（限速、可续跑、只追加）
用与 r2-v18 相同的上传方式，按 `$P\plan.json` 的顺序逐条处理，一次一个对象，不并发（36 个成片 + 160 段语音 + 最后 4 个 `pack/r2-v19/` 目录文件，共 200）：
- 先 HEAD/GET 该 objectKey：不存在 → 上传（Content-Type 用条目里的 `contentType`），再回读核验字节数和 SHA-256 与清单一致；
- 已存在且字节数和 SHA-256 一致 → 记为通过，跳过；
- 已存在但不一致 → 停下，原样回报该 objectKey，**不覆盖**；
- objectKey 以 `pack/channels/` 开头 → 停下回报（清单里不该有）；
- HTTP 429 或 5xx：依次等 2、4、8、16、32、60 秒重试，最多 6 次；都失败就停下回报（之后按同样规则从头重跑，已传的会被跳过）；
- 每个对象之间间隔 0.2 秒；日志写 `$W\upload.log`。

全部上传后公网回读核对（串行、限速、带退避，只读；含抽查 6 个 r2-v18 旧动作的 18 个成片没被动过）：
```powershell
python tools/thomas-sup/publish/verify_ts_media.py online "$P\catalog.json" --plan "$P\plan.json"
```
退出码必须 0（`checked` 218、`ok` 218）。不是 0：停下回报最后一行 JSON。

回报：新上传数 / 已存在跳过数 / 总数；online verify 最后一行 JSON。

## I. 收尾（指针只读核对）
1. 再读三个指针 dev/beta/stable，与 `$W\channels-before.json` 逐字比较：必须完全相同。不同：停下，原样回报两边，**不要改指针**。
2. `git worktree remove <T1>`、`git worktree remove <T2>`（只删这两个临时 SDK worktree）。
3. Pose-Hub 工作树保持在本卡提交不动；`$R`、`$V`、`$P`、`$W` 全部保留。

最终回报：「托马斯 r2-v19 已上传，指针未动」+ `$P\report.json` 里 `catalog.sha256` 与 `catalog.bytes` + 三个指针回读原文。
