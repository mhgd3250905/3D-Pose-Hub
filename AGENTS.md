# Pose-Hub 协作规则

给在本仓库工作的人和 agent。动作、人物模型和成片的唯一来源是这里。

## 1. 动作只在这里改

- 动作规格（`drill-anim/specs/*.js`）、渲染工具（`drill-anim/`）、人物模型（`runtime/public/coach`、`runtime/public/anatomy`、`drill-anim/models/`）和模型制作工具（`tools/`）只在 Pose-Hub 修改。
- FlareLab（3D-Body）和 HipLab 不再改动作规格、不再自己渲染交付用成片；它们只通过 `media/tools/sync.py` 取已发布版本。需要新动作或修动作，就在本仓库提 issue 或 PR。
- 3D-Body 里仍保留 FlareLab 自己运行需要的 `src/`、`public/coach`、`public/anatomy` 副本。两边的人物模型文件改动必须同步，并在 `drill-anim/models/training-human-v2.json` 里升级模型版本（见第 4 条）。

## 2. 一个动作一个分支一个 PR

- 分支名：`drill/<动作id>`（新动作或重做）、`fix/<动作id>-<要点>`（修复）。一批相关修复可以合在一个 PR，但 PR 说明里逐个列出动作 id。
- 新增或修改 spec 时：
  1. 把规格的 LF 规范化 sha256 登记到 `drill-anim/data/home-pr-candidates.json`（或 `verify.mjs` 的对应表），共用模块（`specs/_*.mjs`、`lib/*.mjs`）的哈希登记进 `verify.mjs`；
  2. 原有规格不覆盖，修订版另存为 `<id>-r2.js` 这类新文件；
  3. `node drill-anim/verify.mjs` 和 `python drill-anim/test_portability.py` 必须通过；
  4. PR 里附预览帧（`--frames`）和 QA 结论，说明实际看过哪些帧。
- 历史批次（`drill-anim/batches/`、`revisions/`、`qa-reports/`）是冻结记录，不改写。里面的 `E:/AII-3D/3D-Body/...` 绝对路径是当时的机器路径，保留原样。

## 3. 发布版本只增不改

- 素材版本号用 `MAJOR.MINOR.PATCH`，R2 路径 `v<版本>/`。版本一旦 `published`，其中的文件和 `v<版本>/manifest.json` 永不覆盖、不删除；要改成片就发新版本。
- 清单变更（`media/manifest.json`）走 PR：ingest 后提一个 PR，发布后把状态改为 published 的清单再提一个 PR。
- 绿幕母版、透明 PNG 母帧不进 Git、不上 R2（`storage: "local"`），由用户本地保存并做异地备份。
- 不要把成片（mp4/webm/gif、帧 PNG）提交进 Git；`.gitignore` 已排除。仓库里历史上已有的少量预览 mp4/gif 保留原样。

## 4. 人物模型版本

- `drill-anim/models/training-human-v2.json` 固定了 13 个源文件的 sha256。改动其中任何一个（网格、头、材质、肩颈配置、渲染核心）都要建立新的模型版本和验证记录，不能静默改变 `training-human-v2`。
- 模型清单里的路径是本仓库的路径（例如 `runtime/public/coach/flare-coach.glb`）；历史批次里记录的是 3D-Body 的旧路径，`drill-anim/lib/legacy-paths.mjs` 负责两者互转。

## 5. 推送和发布需要用户同意

- 推送到 GitHub（包括新分支）、开 PR、合并、打 tag、上传到 R2（`publish.py --yes`）、建桶或任何花钱的操作，都要先得到用户明确同意。
- 不在仓库里放任何密钥或机器配置：`drill-anim/config.json`、`media/config.json`、`.env` 都被忽略；R2 凭据只从环境变量读。

## 6. 渲染机器的规矩

- 先用 `--frames` 预览，再决定全片。整机最多两路渲染、每路 `--jobs 1`，不要把机器拖垮。
- Chrome / 渲染进程意外重启时，先查原因（内存、磁盘、驱动），再继续。
- 新输出和临时帧放在 `out_dir` / `work_dir`（默认在仓库外或 `output/`，已忽略），不要放进源码目录。
