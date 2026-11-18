# 任务卡：V5 发布 r2-v18（只换成片，只切 dev 和 beta）

开哥 2026-11-18 10:59 已同意：上传 V5 成片、发布新 pack、切 dev 和 beta 指针。只照做下面的命令，不判断画面好坏，不改任何代码、配方、配置。
遇到本卡没写的情况：停下，把最后一行输出原文贴到话题里。每做完一步（A–H）在派任务的那条飞书话题里回复并 @hark-sk，正文 = 「V5 发布 第 X 步」+ 该步要求回报的内容（原样，不加评价）。

内容（仅供记录）：r2-v18 = 线上 r2-v16 的文字、语音、voiceGuide、定义字段完全不变，只把 249 个动作的 video/cover/thumbnail 换成 V5 全量渲染成片（新对象键 `media/<id>/r2-v18/`，不覆盖旧片）。r2-v17（已撤回的主题包）保留不动。托马斯不在本次范围。

## 红线
- stable 指针不动。只写 `pack/channels/dev.json`、`pack/channels/beta.json`。
- 不合并 PR、不推 main、不推任何分支、不打 tag、不发 Release、不改代码。
- 不删除、不覆盖任何已有东西：R2 上已有对象（含 r2-v14、r2-v16、r2-v17 的目录与成片）、`F:\PoseHub-v3\runs\` 下的母帧和成片都不动。
- 整机同时只跑这一个任务；有人派别的渲染/上传，回复「V5 发布占用中」。

## A. 准备
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\joint-shoulder-axilla-r1
git fetch origin codex/v5-publish
git checkout --detach origin/codex/v5-publish
git status --porcelain --untracked-files=no      # 必须没有输出，否则停下回报
git log --oneline -1                             # 回报这一行
$C = git rev-parse HEAD
$R = "F:\PoseHub-v3\runs\2026-11-17_v5r2_40105eb"
$P = "F:\PoseHub-v3\app-pack\r2-v18"
```
F 盘剩余不少于 10 GB，不够就停下回报。python 不叫 `python` 时用它的完整路径；ffmpeg、ffprobe 在 PATH。

## B. 回读线上（不写任何东西）
1. 读 https://media.uuugk.win/pack/channels/dev.json、beta.json、stable.json：三个都必须是 `pack=r2-v16`、`catalog_sha256=c8536ffcf13e677449c251720183bcf099ae5ca166182026be411544d9bfa562`、`min_sdk=0.8.0`。任何一项不符：停下，原样回报。
2. 读 https://media.uuugk.win/pack/r2-v18/catalog.json：必须是 404（这个包名还没用过）。不是 404：停下回报。

回报：三个指针原值（符合就写「符合」）、r2-v18 的 HTTP 状态码。

## C. 导出 V5 成片（可续跑）
用与 r2-v14 第 6 步、theme-r1 第 3 步**同一个生产导出器（r2-v1 export_worker）、同一套参数**（x264 crf27 slow，720×1440 yuv420p，rgb 在上、alpha 在下；cover 640 webp、thumbnail 192 webp、质量 80），唯一区别是输入换成 V5：
- 输入：`$R\packages\<id>\v5-toon\`（V5 只有这一套皮肤 `v5-toon`，文件与 V4 default 同名同规格），249 个动作全部（名单 = `tools\v5\v5-actions.json`）。
- 输出（共 747 个文件）：
  - `$P\media\<id>\r2-v18\<id>.rgb-alpha.mp4`
  - `$P\media\<id>\r2-v18\<id>.cover.alpha.webp`
  - `$P\media\<id>\r2-v18\<id>.thumbnail.alpha.webp`
- 已存在且非空的输出文件跳过（中断后原命令重跑即可）。某个动作 x264 报 malloc/内存错误：该动作用线程 1 重试一次；仍失败就停下回报。
- 任一动作缺 `$R\packages\<id>\package.json` 或 `v5-toon` 成片：停下，回报缺了哪些。

回报：导出文件数、耗时、失败数。

## D. 生成目录 + 本地核对
```powershell
python tools/v5/publish/build_r2_v18.py --out $P --source-commit $C --v5-root $R --media-root $P
python tools/v5/publish/verify_v5_media.py local "$P\catalog.json" --media-root $P
```
- build 退出码必须 0（最后一行 JSON 里 `problemCount` = 0）。不是 0：停下，回报 `$P\report.json` 里 `problems` 原文（前 50 条）。
- verify 退出码必须 0（`checked` 747、`ok` 747）。不是 0：停下，回报最后一行 JSON。

回报：build 最后一行 JSON（含 catalog sha256/字节数、uploadFiles）；verify 最后一行 JSON。

## E. 本地 SDK 预检（切指针前，两个 SDK 版本）
在 ugk-3d-pose-sdk 仓库建两个临时 worktree（`git fetch origin`）：
- `<T1>` = `036b5fcdc8bbe3e7ed13e629accf2287c3004ad8`（SDK 0.8.0，与 r2-v16 发布时同一个）
- `<T2>` = `c79ec5299664b6aa1cdf8657bba7235d88a987cf`（SDK main，0.9.0）

```powershell
git worktree add --detach <T1> 036b5fcdc8bbe3e7ed13e629accf2287c3004ad8
git worktree add --detach <T2> c79ec5299664b6aa1cdf8657bba7235d88a987cf
```
把 Pose-Hub 工作树里的 `tools\v5\publish\v5_preflight_test.dart` 分别复制到 `<T1>\packages\ugk_trainer_runtime\test\` 和 `<T2>\packages\ugk_trainer_runtime\test\`，各自 `cd` 到 `packages\ugk_trainer_runtime`，`flutter pub get`，然后：
```powershell
$env:V5PF_MODE='local'; $env:V5PF_PACK_DIR='F:\PoseHub-v3\app-pack\r2-v18'
$env:V5PF_BASE_DIR='E:\AII-3D\3D-Pose-Hub-worktrees\joint-shoulder-axilla-r1\release\app-pack-r2-v16'
flutter test test/v5_preflight_test.dart
```
两个都必须 `All tests passed`，且 `V5_PREFLIGHT` 行里 `outcome` = `updated`、`pack` = `r2-v18`、`newMediaFiles` = 747、`otherFieldDiff` = 0、`guideSentences` = 501。任一不通过：停下，原样回报 `V5_PREFLIGHT` 整行和报错，不上传、不切指针。临时 worktree 先留着，G 步还要用。

回报：两行 `V5_PREFLIGHT`（原样）。

## F. 上传（限速、可续跑）
按 `$P\plan.json` 的顺序逐条处理，一次一个对象，不并发（应为 747 个成片 + 最后 4 个 `pack/r2-v18/` 目录文件，共 751）：
- 先 HEAD/GET 该 objectKey：不存在 → 上传（Content-Type 用条目里的 `contentType`），再回读核验字节数和 SHA-256 与清单一致；
- 已存在且字节数和 SHA-256 一致 → 记为通过，跳过；
- 已存在但不一致 → 停下，原样回报该 objectKey，不覆盖；
- 遇到 HTTP 429 或 5xx：依次等 2、4、8、16、32、60 秒重试，最多 6 次；都失败就停下回报（之后按同样规则从头重跑，已传的会被跳过）；
- 每个对象之间间隔 0.2 秒。

全部上传后公网回读核对（串行、限速、带退避，只读）：
```powershell
python tools/v5/publish/verify_v5_media.py online "$P\catalog.json"
```
退出码必须 0（`checked` 747、`ok` 747）。不是 0：停下回报最后一行 JSON，不切指针。

回报：新上传数 / 已存在跳过数 / 总数；online verify 最后一行 JSON。

## G. 只切 dev 和 beta
1. 回滚记录：新建 `F:\PoseHub-v3\work\v5-r2-v18-upload\pointer-rollback.json`，`channelsBefore` 原样存 B 步读到的 dev、beta 指针内容（回滚 = 原样写回这两份）。
2. 只写 dev 和 beta 两个指针（与之前相同的方式，对象键 `pack/channels/dev.json`、`pack/channels/beta.json`），内容原样用 `$P\channels\dev.json` 和 `$P\channels\beta.json`。**stable 不写**（`$P\channels\` 里也没有 stable.json）。
3. 回读三个指针：dev、beta 应为 r2-v18；stable 必须仍是 r2-v16 / c8536ffc…。
4. 线上 SDK 预检，在 E 步两个 worktree 里各跑 dev、beta 两遍（共 4 遍）：
```powershell
$env:V5PF_MODE='online'; $env:V5PF_CHANNEL='dev'
$env:V5PF_BASE_DIR='E:\AII-3D\3D-Pose-Hub-worktrees\joint-shoulder-axilla-r1\release\app-pack-r2-v16'
flutter test test/v5_preflight_test.dart
```
（第二遍把 `V5PF_CHANNEL` 改成 `'beta'`。）四遍都必须 `All tests passed`、`outcome` = `updated`、`pack` = `r2-v18`。任一遍不通过：停下，原样回报；dev/beta 保持现状，**不要自己回滚**。

回报：三个指针回读（原样）；四行 `V5_PREFLIGHT`；pointer-rollback.json 路径。

## H. 收尾
`git worktree remove <T1>`、`git worktree remove <T2>`（只删这两个临时 SDK worktree）。Pose-Hub 工作树保持在本卡提交不动。

最终回报：「V5 发布 r2-v18 完成，dev/beta 已切，stable 未动」+ catalog sha256 与字节数。

任何一步报错就停下，把完整报错原样回报，不要自己修。
