# 动作包 v2 试制合成与接合

生产规范和六层发布门禁见 [catalog/v2](../../catalog/v2/README.md)。浏览器分层渲染见 [render tools](../../drill-anim/tools/v2/README.md)，语音见 [voice v2](../../catalog/voice-v2/README.md)。旧 `training-human-v2` 仅用于历史复现，新生产使用固定新版人体清单。

以下六动作试制命令使用 `F:/PoseHub-v2-pilot/neck-fix-r2/`。颈部漏色修正后的六动作五皮肤母版与派生、catalog draft.2 和 AI 详情按原批次保留；r1 父目录保留历史，已有输出不可覆盖或重复生产。结果与待审项见[六动作记录](../../docs/action-package-v2-pilot-20261021.md)及[颈部修复](../../docs/neck-material-fix-20261021.md)。

PR15 本机审阅另用 `build_review_bundle.py`，从已完成的专用 `review.json` 核验循环、字节数和 SHA 后复制视频与封面，生成离线页面。七项入口与明确的生成命令见[交付记录](../../docs/pr15-local-repair-delivery-20261024.md)；它不生产或接入 v2 分层母版，不替代六层 gate。各独立模型的当前版本与审批范围见[台账](../../docs/version-ledger.md)。

本工具不进行 3D 渲染。`composite.py` 从人物加道具 RGBA、高亮灰度遮罩、透明阴影三层生成派生。各皮肤独立保留人物层；共享层从权威 layer manifest 的 sequence 引用解析，不按文件名猜来源。缺帧、错误尺寸或已有目标会拒绝执行，保留部分输出供诊断，不清理或覆盖。

母版没有背景底色。地垫、椅子和哑铃等属于动作道具，保留在人物道具层；投影独立透明。深浅底只在派生合成时加入，透明封面不烘焙背景或地面投影。

每动作统一取景基于全部五套皮肤、所有 240 帧人物和道具 alpha 的包围框并集，加固定留白，一次计算后供视频、封面、缩略图与三关键帧共用。不会每帧重新取景。深浅底、缩小尺寸和高亮开关/色彩/亮度只经合成变化，不重新跑 3D，不生成镜像。

```powershell
# 先看实际样帧：从 qa/preview/ 的权威帧清单取图
python tools/action-package-v2/composite.py --root F:/PoseHub-v2-pilot/neck-fix-r2 --preview

# 母版完成后合成；按 action/skin 子集追加时保留已有清单
python tools/action-package-v2/composite.py --root F:/PoseHub-v2-pilot/neck-fix-r2

# 有足够 CPU 时，最多两个不同动作的 worker；仍仅一路 3D 渲染
# worker 使用 --skip-mosaic，跨进程锁合并 derivatives.json
python tools/action-package-v2/composite.py --root F:/PoseHub-v2-pilot/neck-fix-r2 --ids w-dead-bug --skip-mosaic
# 所有派生完成后只生成完整拼图，避免再次写已有视频
python tools/action-package-v2/composite.py --root F:/PoseHub-v2-pilot/neck-fix-r2 --mosaic-only

# 输出已经存在会先拒绝，另建批次修订后才更改配方
# 高亮可用 --highlight-off / --highlight-color '#f08a3c' / --highlight-brightness 0.45
# 同一母版尝试另一合成参数，独立保存且不覆盖默认派生
python tools/action-package-v2/composite.py --root F:/PoseHub-v2-pilot/neck-fix-r2 --derivative-set blue-highlight --highlight-color '#9fdcff'

# 只接合真实完成产物，不自动批准 QA、编辑或试听
python tools/action-package-v2/import_pilot.py --root F:/PoseHub-v2-pilot/neck-fix-r2
python catalog/tools/action_package_v2.py generate --check-files --media-root media=F:/PoseHub-v2-pilot/neck-fix-r2

# 本地审片页面；不上传、不发布
python tools/action-package-v2/create_gallery.py --root F:/PoseHub-v2-pilot/neck-fix-r2

# 生成跨时间采样审阅图与完整生产几何/接缝测量汇总，不自动授予 QA 通过
python tools/action-package-v2/review_frames.py --root F:/PoseHub-v2-pilot/neck-fix-r2
python tools/action-package-v2/audit_metrics.py --root F:/PoseHub-v2-pilot/neck-fix-r2
python tools/action-package-v2/qa_sequences.py --root F:/PoseHub-v2-pilot/neck-fix-r2
```

`masters/` 为 1080² / 30fps / 8 秒、0–239 帧；240 仅是循环闭合 QA 端点，不重复进入视频。派生为 720² H.264 yuv420p、无音轨；封面 720、缩略图 240、关键帧 720、透明封面 1080。每个皮肤 × 深浅色默认一套高亮开视频，另产同一顶峰关键帧的高亮关对照。需要另一套视频合成参数时使用新的输出修订。

`manifests/derivatives.json` 保存派生引用与实际合成参数，`manifests/framing/` 保存固定取景配方。`import_pilot.py` 将完成母版和派生引用接入 `catalog/v2/actions/` 并生成逐动作媒体 manifest，保持 `review` 状态；未实际审阅的字段继续 pending。动作名、要点和相位语音独立维护，不把独立语音误称已给循环视频配音。

所有制作产物放在用户批准的 F 盘，Git 仅记录工具、规格、定义、清单及 QA 文档。历史素材不清理、冻结 ZIP 不覆盖。六动作 r2 样片已获确认并进入 main；后续全库制作快照与 PR15 修复分属独立分支，状态见台账。本次文档收束不重新生产、修改 App 或同步云端。
