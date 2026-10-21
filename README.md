# Pose-Hub · 动作库

> **第一次来？先读 [docs/START-HERE.md](docs/START-HERE.md)**（半小时上手、低配机验证、贡献流程）；动作总表见 [docs/drill-catalog.md](docs/drill-catalog.md)，审核标准见 [docs/review-rubric.md](docs/review-rubric.md)。

新生产以 [动作包 v2](catalog/v2/README.md) 为合同，按稳定动作 ID 管理定义、动作源、分层母版、派生、双语语音和校验六层；AI 的 [action-library](catalog/action-library/index.md) 从 catalog 自动生成。现有 App 尚在使用的 [catalog/catalog.json](catalog/catalog.json) 为 0.3.0 历史兼容目录，其完整度不等于 v2 发布资格。版本规则见 [版本管理](docs/version-management.md)，当前版本、PR 合入与接入待办见 [版本对齐台账](docs/version-ledger.md)。

Pose-Hub 是 FlareLab（托马斯训练助手）和 HipLab（开胯训练助手）共用的**动作库**：动作渲染工具 drill-anim、训练人物模型及其制作工具、每个动作的规格（spec）、以及成片素材清单都在这里。各 App 不再自己改动作，只按固定版本从这里取成片。

2026-10-17 从 [3D-Body](https://github.com/mhgd3250905/3D-Body) `master@66067a6` 迁来，保留了相关文件的 Git 历史。迁移细节、路径对照和验证结果见 [MIGRATION.md](MIGRATION.md)；协作规则见 [AGENTS.md](AGENTS.md)。

## 目录

```
drill-anim/          动作渲染工具（原 3D-Body tools/drill-anim）
  specs/<id>.js      动作规格与版本化修订；共用模块为 specs/_*.mjs
  page/ lib/         浏览器端求解/着色、Node/Python 渲染与合成、QA
  models/            current-production.json 生产配方；training-human-v2plus.json 新版身份；training-human-v2.json 保留旧 13 个固定源
  themes/ theme.json 外观（默认 v7；方案 B themes/glow-b.json = v0.1.0；柔和高亮 themes/glow-soft.json = HipLab 新成片）
  batches/ revisions/ qa-reports/ data/   历史批次、修订稿、QA 记录、App 选用清单
runtime/             渲染时启动的 3D 场景（原 3D-Body 根目录的 index.html、src/、public/coach、public/anatomy 中渲染用到的部分）
tools/               人物模型制作工具：blender/（Snow 派生教练、健身/肌肉参考体）、mannequin/（灰色人台头）、cloth/（衣服蒙皮）、face/
assets/              blender-studio-source/SOURCE.md（Blender 源文件获取说明；.blend 本体不进 Git）
media/               成片素材清单 manifest.json + ingest / pack / sync 脚本（见 media/README.md）
catalog/             三 App / ugk_coach 的统一 AI 动作目录、Schema、人工裁定与生成校验工具（见 catalog/README.md）
docs/                人物标准、动作批次与审核记录；docs/consumers.md 是 App 接入说明；docs/migration/ 是迁移对照表
licenses/            three / lucide 许可、动作媒体署名
package.json         根目录 npm 工程（three 0.170.0、lucide、vite 7.3.6），vite.config.js 把 root 指到 runtime/
```

## 环境

- Node `^20.19.0 || >=22.12.0`；Python 3（渲染需要 numpy、scipy、Pillow；media 脚本只用标准库）；ffmpeg（带 libx264）。
- Playwright + Chromium（不在 package.json，按需 `npm i --no-save playwright@1.48.2 && npx playwright install chromium`，config 里 `playwright_module` 填 `../node_modules/playwright/index.mjs`；详见 START-HERE）。无 GPU 时用 SwiftShader（`--use-gl=swiftshader --enable-unsafe-swiftshader`）；Windows 4080 用 `config.windows.example.json` 里的 `--use-angle=d3d11`。

```bash
npm ci                                   # 仓库根目录（需完整 clone：verify 要读基线提交 1adcab8，--depth 1 会失败）
cp drill-anim/config.example.json drill-anim/config.json        # Windows: config.windows.example.json
# 编辑 config.json：playwright_module、playwright_browsers_path、font、out_dir、work_dir（app_dir 保持 ".."）
```

## 验证

```bash
node drill-anim/verify.mjs               # 规格/模型源哈希契约（不渲染）
python drill-anim/test_portability.py    # 文件系统保护与路径解析
python -m unittest discover -s media/tests -v   # 素材脚本
```

## 渲染

`training-human-v2` 已退出新生产，只保留冻结历史复现。新人体先做六个代表动作、原配色/白金/蓝色/绿色/全息五套试制；分层渲染见 [tools/v2](drill-anim/tools/v2/README.md)，脚本派生和本地审片见 [action-package-v2](tools/action-package-v2/README.md)。新产物按用户授权统一放在 F 盘；开哥看样同意后才合入、推送，全库铺开另等确认。

下面旧命令用于历史配方复现，不作为 v2 新生产入口：

```bash
python drill-anim/drill.py render deltoids-A --frames 0,63,120 --jobs 1        # 先预览几帧
python drill-anim/drill.py render h-9090-liftoff --jobs 1                       # 全片：mp4 + gif + 拼图 + QA
python drill-anim/drill.py render h-9090-liftoff --theme themes/glow-b.json     # 方案 B 外观
```

`drill.py` 会在 `app_port` 上自动启动 Vite（根目录 `vite.config.js`，root=`runtime/`），渲染完自动关掉。整机最多两路渲染、每路 `--jobs 1`；已有同名成片默认拒绝覆盖（要覆盖需显式 `--overwrite`）。更多参数和 spec 格式见 [drill-anim/README.md](drill-anim/README.md)。

2026-10-21 新版人体已随 [PR #12](https://github.com/mhgd3250905/3D-Pose-Hub/pull/12) 合入 main 并推送，采用 `training-human-v2plus` / `1.0.0-rc2`：原配色、动作肌群高亮、不显示肌群分区线，新版躯干/四肢/手与原 v2 头。新制作读取 [生产配置](drill-anim/models/current-production.json)，普通旧 spec 和历史批次仍按原配方；尚未批量重渲或更新 App。来源、检查与后续待办见 [版本对齐台账](docs/version-ledger.md)。

## 发布成片

Git 只放代码、模型、规格与 SHA-256 清单。公开媒体一版一个 `pose-hub-media-v<版本>.zip`，主线维护方经用户授权上传谷歌云盘并开放链接；绿幕与透明母帧只留本地备份，不进 ZIP。当前不建 R2。

制作新版本时先设置新的版本号和实际素材目录。以下以 v0.2.0 制作过程为例；已发布版本不能重新 ingest。

```powershell
Copy-Item media/config.example.json media/config.json  # 设置本地 src 和规则
py media/tools/ingest.py --version 0.2.0 --dry-run
py media/tools/ingest.py --version 0.2.0
py media/tools/pack.py --version 0.2.0
```

ZIP 内按清单 `file` 命名，只有媒体，不含清单。上传后在版本发布记录和清单登记公开链接、ZIP 大小和 SHA-256，才标为 `published`。主线维护方按用户授权直接提交推送 main，不开清单 PR。已发布包与条目固定，内容变化发新版本。详见 [media/README.md](media/README.md)、[v0.2.0 soft-v1](media/releases/0.2.0.md) 与 [v0.1.0](media/releases/0.1.0.md)。

## App 怎么取

App 保存固定版本的 lock、`media/tools/sync.py` 的单文件副本，以及同一发布提交的清单副本。下载 ZIP、核对 SHA-256 并解压后：

```bash
python tools/pose_hub_sync.py --lock pose-hub.lock.json --from-dir ./pose-hub-media-v0.2.0
python tools/pose_hub_sync.py --lock pose-hub.lock.json --check
```

每个文件都核对大小和 SHA-256；无需 baseUrl。Windows、macOS 和离线接入示例见 [docs/consumers.md](docs/consumers.md)。要新动作或改动作，由贡献方到本仓库提 issue / PR；发布后 App 更新 lock 和清单副本。

## AI 动作目录版本

历史兼容目录为 **0.3.0 / formatVersion 1**：[PR #11](https://github.com/mhgd3250905/3D-Pose-Hub/pull/11) 的 0.2.0 修复后，[PR #13](https://github.com/mhgd3250905/3D-Pose-Hub/pull/13) 已合入 `rhythm` 字段。仍收录 142 个稳定动作 id：FlareLab 51、HipLab 46、SmartFit 93，各 App 有重叠。本轮六个新版修订加入后，spec 开发总表为 206 文件（33 修订），与 173 个基础动作 ID、46 个动作的历史媒体发布包分别统计；六个试点仍须按 v2 六层逐项验收。

目录 0.3.0 与媒体 ZIP 0.2.0 是独立版本。目录合入不等于消费端已升级：SmartFit 的 8 项剂量、7 项侧别同步与 SDK `holdSeconds`、`rhythm` 执行语义仍待接入验收；本次没有新增目录发布 tag 或媒体 ZIP。具体提交、验证范围与待办见 [版本对齐台账](docs/version-ledger.md)。
