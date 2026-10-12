# 训练动作制作工具整合记录

本文件保留首次纳入 `feature/drill-anim` 的阶段事实，范围截至 `1f87cc6180532857c1b53dba4c9898915a9aa49a`；下文59项数量及PR #8待处理均是当时状态。后续PR #94–#105、#107、#108已合入master，默认制作源现75项，PR #8已被iOS整合覆盖并在GitHub标为MERGED。当前收据见 [主线整合审核](integration-pr-audit-2026-10-12.md)，版本/验证/待办分别以 [版本台账](../app/docs/version-ledger.md)、[验证记录](../app/docs/verification.md)、[实施路线](../app/docs/development-roadmap.md) 为准；本文件不是后续主线全量验证报告。

2026-10-12，按用户批准的计划将 `feature/drill-anim` 的制作源码纳入本地 L43，并把已有成片备份到用户 Google Drive。App 仍为 L43 / 1.0.0+1 / v41，当前51项视频、封面、媒体清单和运行时代码保持；此次没有创建 L44 或新安装包。

## 源码与版本

本地起点为 `3a8955d14157a0ee8406cf640e00f40d68b4ae9f`，来源为 `68043f71651056c57c72a3b8813cbb354979346f`。在独立工作树 `codex/drill-anim-integration` 无冲突合并，原117个工具文件和双方历史保存为合并提交 `7666e82`，随后另存 Windows 补修与文档提交；没有变更动作算法、动作参数或正式人物模型。

`tools/drill-anim/specs` 有59项参数：A/B/C各17项，加8项拉伸。它们与来源Git内容一致；Windows检出的CRLF与Git的LF差异在源码检查中归一。`3D-Pose` 的 v1.0.0 正式库则有60 MP4、48 GIF、60封面，并采用五项本地最终修订：deltoids-B、hip-abductors-B、rotator-cuff-B、s-frog、s-9090-switch。最后一项不在原分支59个spec中，其余四项的分支参数也不能取代最终修订。正式选版按 [素材接手地图](../../3D-Pose/交接/README.md) 与其素材索引的 `frozen_path`，不按文件更新时间猜测。

历史 `tools/drill-anim/HANDOFF.md` 的“永远不要合并进 master”及 `COLLAB.md` 的制作阶段base规则保留为原协作记录。本次用户明确批准整合源码到L43，覆盖这两份文件的阶段性限制；没有替其他制作人员验收动作或更新共享进度表。

## Windows 运行与输出保护

配置与运行见 [工具说明](../tools/drill-anim/README.md)，示例为 `config.windows.example.json`。本机 gitignored 配置使用项目根 Vite、既有 E 盘 Python / Playwright 环境及新 E 盘输出目录。启动不依赖 POSIX `.bin/vite`、`python3`、`killpg` 或 `/tmp`；文件模块通过 Node file URL 导入，Python子进程使用当前解释器并隐藏辅助窗口。相对路径以工具根目录解析。

已有成品默认拒覆盖；显式 `--overwrite` 只用于主动替换。删除动作临时帧前校验动作ID、存在的源参数及绝对路径边界，禁止删除源码或成品目录。编码临时文件位于 `work_dir`，合成失败或缺帧停止编码。Windows文件名中的范围冒号改为连字符。Three.js或浏览器启动失败时关闭本次浏览器并给出诊断，Vite只关闭本次自行启动的进程。

运行时人物继续来自 Snow 的既有派生；无新模型采购、无收费生成、无CDN。来源与许可见 [人物来源](friendly-coach.md)、[训练媒体来源](../app/assets/licenses/Drill-media-ATTRIBUTION.md)。色区表示功能关联；这些自定义动作参数尚不是60个标准GLB AnimationClip，也不表示实测肌电。

## 云盘备份

新增 [drill-anim整合备份 2026-10-12 L43](https://drive.google.com/drive/folders/16ErhrmGbJMner-h0g9Tv7XNWJYoC1tXR)，位于用户已有 Hark项目备份 / 3D-Body 动画项目下，沿用既有共享状态。

| 内容 | 文件 | 大小 | 校验 |
| --- | --- | --- | --- |
| 正式60 MP4、60封面、JSON/CSV索引、交接说明 | [正式视频包](https://drive.google.com/file/d/1NRTbgw2vZDbHK_z5Pj5pZZ3ssd4y2qle/view) | 49,789,199字节 | SHA256 `907c0b274c13b480aee141e07be183a4ffc56eeb8890a4417c347d52b331a564` |
| 去重后1 MP4 + 1 GIF未验收构图稿及清单 | [未验收草稿包](https://drive.google.com/file/d/1sRNidGMNBQzZVCgUdSS-WtZP4XC8HfEC/view) | 2,576,134字节 | SHA256 `ca04bc87443ab0e8c4a4ce9bd18391c1ec2398a731da51c435300d14e215bbce` |

两包均逐项核对冻结源大小与SHA256，ZIP读回全部媒体验证，并从Drive下载整包比对SHA256一致。源文件、旧版本、失败稿和GIF均未删除。旧 [v1.0.0完整备份](https://drive.google.com/drive/folders/1nRi_L9WrysQzOt-zT9rZTlTO3Xx6uI4w) 保留65 MP4、53 GIF及源码历史；本次检查其云端存在、大小及本地包与既有回执一致，没有重复上传旧四包，也未重新下载旧四包。

整合Git备份、工具源码包及云端回执在同一新增目录；本地详细回执位于 `output/drill-anim-integration-20261012/`。这些大包与逐帧验证输出是gitignored，不能只靠源码克隆恢复所有本地成片。正式成片与未验收稿分包，后者不进入App展示。

## 验证与边界

2026-10-12，本机 Node24.15.0、Python3.14.2环境：

- `node tools/drill-anim/verify.mjs`：59个spec内容、51个训练ID、8个拉伸、模块语法和JSON解析通过。
- `python tools/drill-anim/test_portability.py`：7项回归通过，覆盖绝对路径Node导入、主题、根相对配置、非法ID、删除边界、已有输出保护及缺帧拒编码。
- `npm run build`：独立副本 `dist` 构建通过，保留原编辑器；常规大chunk提示保持。
- 实际Chromium / Vite / WebGL与Python合成通过：deltoids-A的0/63/120帧，triceps-B、lats-C、s-9090的第0帧，包含各动作额外still帧；1080×1080图片已查看，人物、目标高亮与道具加载正常。没有渲染或验收全部59项。
- 当前App的51项选版、102个视频/封面文件与冻结v1.0.0逐项大小/SHA256一致，媒体清单字节一致；本次相对于L43的 `app/`、`src/`、`public/` 与根依赖文件无变更。

真实渲染与日志位于 `output/playwright/drill-anim-integration-20261012/`。这项验证证明工具在当前Windows工程中可启动和输出代表静帧，不承诺与上游成片逐像素一致，也不将历史qa-reports当作新版全片验证。全片动作、接触、穿模与循环仍应逐项预览、QA和人工审阅。

2026-10-12，用户随后明确授权直接同步 GitHub `master`，无需另提 PR。同步范围包含此前本地 L43 提交、drill-anim 原分支历史、Windows 补修与本记录；推送后以本地 `HEAD`、`origin/master` 和 GitHub `refs/heads/master` 的完整 SHA 一致核对。

云盘 Git bundle 固定在 `8a75ff30a9b2d6b8fcb684746555eab90aa4832a`，保存工具与 L43 源码，不含随后这项同步说明提交。GitHub 保存已提交的源码和 App 运行素材；`dist/`、`output/`、机器配置、原始 Blender 资源、个人备份及21项用户未跟踪资源继续保留在本机，不因推送而自动进入 GitHub。成片和制作源码云盘备份见上文。本轮不发布新 App 包；iOS PR #8 的三项审核问题保持独立待处理，未纳入此次整合。
