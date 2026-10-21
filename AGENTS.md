# Pose-Hub 协作规则

给在本仓库工作的人和 agent。动作、人物模型和成片的唯一来源是这里。

## 主线维护分工

- 开哥本地 `E:\AII-3D\3D-Pose-Hub` 是主线维护方，负责 main、贡献 PR 审核、合并、tag 与素材 ZIP 发布；外部操作仍遵守第 5 条的用户授权要求。
- 主线维护方自己的改动在分支完成验证，经开哥同意后直接合入本地 main 并推送，不必另开 PR；贡献方仍提交 PR，由主线维护方审核、验证并经开哥同意后合并。
- Hark 是贡献方：从 main 拉分支、提交 PR，由本地主线维护方审核；不代替主线维护方发布素材或合并。
- FlareLab、HipLab 各自维护 App 功能，通过已发布的固定素材版本消费本仓库成果。

## 1. 动作只在这里改

- 动作规格（`drill-anim/specs/*.js`）、渲染工具（`drill-anim/`）、人物模型（`runtime/public/coach`、`runtime/public/anatomy`、`drill-anim/models/`）和模型制作工具（`tools/`）只在 Pose-Hub 修改。
- FlareLab（3D-Body）和 HipLab 不再改动作规格、不再自己渲染交付用成片；它们只通过 `media/tools/sync.py` 取已发布版本。需要新动作或修动作，就在本仓库提 issue 或 PR。
- 3D-Body 里仍保留 FlareLab 自己运行需要的 `src/`、`public/coach`、`public/anatomy` 副本。两边的人物模型文件改动必须同步，并在 `drill-anim/models/training-human-v2.json` 里升级模型版本（见第 4 条）。

## 2. 贡献方一个动作一个分支一个 PR

- 分支名：`drill/<动作id>`（新动作或重做）、`fix/<动作id>-<要点>`（修复）。一批相关修复可以合在一个 PR，但 PR 说明里逐个列出动作 id。
- 主线维护方和贡献方新增或修改 spec 时，都需要：
  1. 把规格的 LF 规范化 sha256 登记到 `drill-anim/data/home-pr-candidates.json`（或 `verify.mjs` 的对应表），共用模块（`specs/_*.mjs`、`lib/*.mjs`）的哈希登记进 `verify.mjs`；
  2. 原有规格不覆盖，修订版另存为 `<id>-r2.js` 这类新文件；
  3. `node drill-anim/verify.mjs` 和 `python drill-anim/test_portability.py` 必须通过；
  4. PR 里附预览帧（`--frames`）和 QA 结论，说明实际看过哪些帧。
- 历史批次（`drill-anim/batches/`、`revisions/`、`qa-reports/`）是冻结记录，不改写。里面的 `E:/AII-3D/3D-Body/...` 绝对路径是当时的机器路径，保留原样。

## 3. 发布版本只增不改

- 素材版本号用 `MAJOR.MINOR.PATCH`，一版一个 `pose-hub-media-v<版本>.zip`。ZIP 内按清单 `file` 原样存放，不加版本目录前缀，只包含 `storage: "archive"` 的公开媒体。主线维护方经用户授权上传谷歌云盘，设为“知道链接的人可查看”，回读核验后记录公开链接、ZIP 字节数和 SHA-256，再把版本标为 `published`。
- 版本一旦 `published`，该 ZIP、版本清单条目和 ZIP 哈希固定；要改成片就发新版本。ZIP 不包含清单，避免清单中记录 ZIP 哈希形成循环依赖。
- 主线维护方的素材清单、打包和发布记录可按用户授权直接在 main 完成并推送，不必开 PR；贡献方仍从 main 拉分支提 PR。当前分发不建 R2 桶、不需要公开域名或 R2 凭据。
- 绿幕母版、透明 PNG 母帧不进 Git、不进 App 公开发布 ZIP（`storage: "local"`）；原件与本地备份保留在 E 盘，按用户整理指令同步到谷歌云盘“动作素材库”，知道链接的任何人可查看和下载，见 `docs/material-cloud-sync.md`。制作归档的共享不改变 App 公开发布 ZIP 范围或冻结版本。
- 不要把成片（mp4/webm/gif、帧 PNG）提交进 Git；`.gitignore` 已排除。仓库里历史上已有的少量预览 mp4/gif 保留原样。

## 4. 人物模型版本

- `drill-anim/models/training-human-v2.json` 固定了 13 个源文件的 sha256。改动其中任何一个（网格、头、材质、肩颈配置、渲染核心）都要建立新的模型版本和验证记录，不能静默改变 `training-human-v2`。
- 模型清单里的路径是本仓库的路径（例如 `runtime/public/coach/flare-coach.glb`）；历史批次里记录的是 3D-Body 的旧路径，`drill-anim/lib/legacy-paths.mjs` 负责两者互转。

## 5. 推送和发布需要用户同意

- 推送到 GitHub（包括新分支）、开 PR、合并、打 tag、公开上传素材或任何花钱的操作，都要先得到用户明确同意；已有明确授权不重复询问。本次用户已授权本地主线直接上传云盘、开放发布链接并提交推送 main。
- 不在仓库里放任何密钥或机器配置：`drill-anim/config.json`、`media/config.json`、`.env` 都被忽略。
- 用户已明确授权将本地所有已完成动作的绿幕、透明母帧及配套素材归档到固定云盘“动作素材库”。后续由用户定期提出整理请求，再执行增量归档与云端校验；不建立定时器，也不在制作完成或入库后自动触发同步。收到整理请求后沿用已有上传授权，无需重复询问。用户于 2026-10-19 明确授权素材库设为“知道链接的任何人可查看和下载”，替代此前“目录保持私有”的限制；仅开放素材库及其内容，`3D-Pose-Hub` 和 `releases` 管理父目录仍受限。原件保留在 E 盘，不覆盖历史包，不改已 `published` 的公开版本；缺项、待复核和停止状态如实记录。

## 6. 渲染机器的规矩

- 先用 `--frames` 预览，再决定全片。整机最多两路渲染、每路 `--jobs 1`，不要把机器拖垮。
- Chrome / 渲染进程意外重启时，先查原因（内存、磁盘、驱动），再继续。
- 新输出和临时帧放在 `out_dir` / `work_dir`（默认在仓库外或 `output/`，已忽略），不要放进源码目录。
