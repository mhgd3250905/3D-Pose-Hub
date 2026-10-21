# 动作包 v2：生产与验收合同

`action-package@2` 以稳定动作 ID 为唯一单位，取代新生产中的 `drill-pack@1`、`action-kit@1`、`flarelab-drill-media@1`。旧包、旧 catalog 和已发布 ZIP 保留，历史 `completeness.complete` 不参与 v2 判定。`training-human-v2` 只供历史复现；新动作源固定 `training-human-v2plus` 的版本、模型清单 SHA 和 spec SHA。

六动作已确认试制位于 `F:/PoseHub-v2-pilot/neck-fix-r2/`。颈部漏色已修正，六动作五皮肤完整母版与派生已重做，action JSON 均升级为 draft.2 并接入新媒体和 QA SHA；AI 详情已重建。r1 保留历史，本规范未因材质补丁改变。技术结果及待审项见[试制状态](../../docs/action-package-v2-pilot-20261021.md)与[颈部修复](../../docs/neck-material-fix-20261021.md)。

开哥已授权全库推进；正式目录 142 个稳定 ID，复用六个试制动作，新增制作 136 个，分 20 批执行，见[全库计划](../../docs/action-library-v2-production-plan-20261021.md)与 `production-plan.json`。新母版和临时数据统一放在 `F:/PoseHub-v2-production/`，每批独立媒体根。当前已建立 28 个动作包，其余 114 个仍为计划项，不记为完成。

`actions/*.json` 是可编辑源，`pilot.json` 保留六个代表动作及类别，`skins.json` 是生产皮肤的唯一名单。五套为原配色 `realistic`、白金 `tech-white`、蓝色 `neon-night`、绿色 `neon-night-b`、全息 `hologram`。`tech-white-b` 是白金别名，`default` 在生产层映射原配色；历史实验 `plaster`、`hologram-b` 不进本轮生产矩阵。

目录中的 JSON Schema 是**允许缺项的草稿编辑合同**，用于结构/类型检查；完整度和发布资格必须由六层 gate 计算，schema 校验通过本身不表示可发布。任一层缺项或审核 pending/fail 都使动作不可发布。`status` 是生命周期标签，不能覆盖实际缺项。

## 六层

| 层 | 字段 | 发布硬条件 |
|---|---|---|
| 定义 | `definition` | 中英文名称/用途、类别/主动与协同肌群/器械/体位/场景/难度/力量拉伸控制类型、单侧与先做哪侧、3–5 条双语要点及主要点、2–3 条双语错误、注意部位/禁忌、替代/降阶/进阶、剂量与范围/rhythm、App 归属、编辑审核通过 |
| 动作源 | `source` | 新版 spec 和模型清单版本/SHA、模型固定运行源码逐一校验、起始/顶峰/结束秒数、单侧换边语义、高亮肌群、穿模/手脚/道具闪烁/循环接缝四项 QA 通过，记录实际看过的帧 |
| 母版 | `masters` | 每皮肤人物+道具透明层；高亮灰度且处理遮挡；阴影透明层；1080²、30fps、8 秒、240 帧，循环 QA 通过 |
| 派生 | `derivatives` | 从母版脚本合成；每皮肤×浅深色一份 720² H.264 循环视频、封面、统一取景缩略图和 start/peak/end 三关键帧；每皮肤透明封面；高亮开关/颜色/亮度作为合成参数；不生成镜像 |
| 语音 | `voice` | 引用试制 `catalog/voice-v2/manifest.json` 或独立 `catalog/voice-v2/batches/<批次>-manifest.json`，每动作中英文 name/primaryCue/phase.start/peak/end，双语共享词表，HipLab 声线/响度标准，技术审核和内容审稿/人工试听都通过 |
| 校验 | `validation` | 所有文件 SHA/字节数、媒体 manifest 的皮肤/尺寸/时长/模型版本，媒体引用覆盖一致，最终审核通过，无镜像 |

`editorialReview`、注意部位和禁忌的 review 必须包含 `status: pass`、`reviewer`、`reviewedAt` 和至少一条真实 `evidence` 文件引用。`items: []` 只能表示经审核没有列出的条目；未专业审核的空禁忌不能冒充通过。替代/降阶/进阶允许显式空数组，但必须经过同一编辑审核。迁移文案当前是编辑草稿，须审核后才可发布。

## 路径与引用

媒体在用户授权的 F 盘根目录下组织，包里只记录根别名：

```text
media-root/
  masters/<skin>/<actionId>/body/index.json + 0000.png ... 0239.png
  masters/<skin>/<actionId>/highlight/index.json + frames
  masters/<skin>/<actionId>/shadow/index.json + frames
  derivatives/...
  voice/<lang>/<actionId>/...
  manifests/...
  qa/...
```

机器绝对路径仅通过 CLI `--media-root media=F:/PoseHub-v2-pilot/neck-fix-r2` 传入，不进入可发布包。统一引用：

```json
{"root":"media","path":"masters/realistic/w-dead-bug/body/index.json","sha256":"<64 lowercase hex>","bytes":1234}
```

`root` 只能是固定仓库根 `repo` 或调用方绑定的 `media`；路径必须是相对 POSIX，拒绝盘符、反斜线、路径穿越与越出根目录的链接。SHA 默认对原始字节计算；spec/模型清单等源码可附 `normalization: "lf"`，此时 SHA 统一 CRLF→LF，`bytes` 仍为实际磁盘字节数。

每个母版层是 `{sequence: ref, width:1080, height:1080, frameCount:240, fps:30, durationSeconds:8, alpha:true}`。高亮另有 `grayscale:true, occlusionAware:true`。sequence 指向 JSON `{frames:[ref,...]}`，必须有 240 个路径唯一、`frame` 为 0..239 严格有序的帧，每帧逐一验证 SHA、字节数，并实际解码检查 PNG、1080²、透明通道与高亮灰度。视频和音频由 ffprobe 实测 codec、尺寸、帧数、帧率、时长和采样格式，不能靠文件扩展名或手填元数据通过。

`masters.skins[skin]` 记录实际测出的 `geometrySha256` 和 `occlusionSha256`，另以 `measurement` 引用真实 `pose-hub-layer-render@2` 报告，绑定动作/皮肤/来源 spec SHA/模型版本及测量 SHA。人体+道具层每皮肤必须独立产生。阴影和高亮层可用 `{sharedFrom:"realistic"}`，但几何和遮挡 SHA 都必须与直接来源一致，拒绝共享链、共享环或只有“同一网格”文字声称的情况。含额外几何体的皮肤高亮不得共用。几何变化若不影响阴影，当前 gate 仍采取保守策略要求单独渲阴影。

四项动作源 QA 的通过证据必须是绑定实际产物的 JSON，而非无关文本：`{id,specSha256,modelVersion,skins:[五套生产皮肤],checks:{检查名:{status:"pass",framesReviewed:[实际帧]}},fullSequences:[{skin,kind,sha256}]}`。`kind` 是 `bodyProps/highlightMask/shadow`，SHA 固定母帧 index.json。各项 review 的帧列表必须与证据一致；循环接缝必须包含首帧 0 和 t=8 边界帧 240。人工检查什么帧就记录什么，未检查项目保持 pending。

`source.dependencies` 记录新版 wrapper 的全部相对静态 import 闭包 SHA，包含原 motion spec 和共用库；固定 wrapper 自身 SHA 不能替代依赖的哈希固定。验证器实际用 Node 导入新版 spec 读取 `modelProfile`，旧模型文件中加一段新版名字的注释不会通过。

派生默认每皮肤×theme 一份 variant，各带 `highlight:{enabled,color,brightness}`、`modelVersion`、`video/cover/thumbnail` refs 与 `keyframes:[{phase,asset}]`。高亮关闭用于拼图/预览时仍从同一母版合成，不重渲 3D，不要求额外生成一套默认分发视频。`framingId` 固定统一取景；视频 `frames` 或 `frameCount` 为 240，时长 8 秒，codec `h264`。

`validation.manifest` 指向 `{format:"action-package-media-manifest@2",id,modelVersion,assets:[...]}`。每个 asset 是扁平 ref 加 `skin/kind/width/height/modelVersion`，动态层另记 `durationSeconds`。必须覆盖包里所有母版 sequence 与派生媒体的 SHA/bytes；帧清单已继续固定每帧。语音另按 voice manifest 固定。

本轮 `release` 命令只输出候选目录 JSON，不是 ZIP 发布器。母版、QA 和工作目录继续按仓库规则保留为本地制作数据；将来公开 ZIP 只收允许分发的派生和语音，不能把包含制作溯源的整个媒体根目录直接打包公开。

接触 QA 以实际可见几何表面为准，不把关节点高度当掌面，也不把道具厚度当表面高度。当前 `props.js` 的垫子向下铺厚度，其顶面为 `mat.at.y`（本轮为 0），不是 6 mm。旧 `floor.at` 是腕关节 x/z；新版标定必须保留该位置和支撑锁，单独测量包含新指骨的全部可见手部顶点。旧 Hand 骨样本或 `frames:0` 的空检查不能作为通过证据。

## 单侧动作

`unilateral` 表示单侧主力发力，也包括片内左右交替演示，**不等于剂量自动乘二**。`startingSide` 指训练/承重侧，不能把抬起的自由腿当作训练侧；`countingSemantics` 明确每次/每侧/计时的计数方式。椅子上步和哑铃弯举均是右侧先做，4 秒换到左侧，各单侧一次计一次，总默认次数不再乘二。死虫式为对侧协同，保持 `unilateral:false`，`movementSides` 明确首组右臂+左腿。

`glute-max-A` 本轮是左脚支撑的单侧演示；`source.demonstratedSide:"left"`，`oppositeSideMedia:"not-produced"`。`keyMoments.switchPoint:{kind:"loop-boundary",seconds:8,semantics:...}` 表示循环结束是**可用的换侧提示边界，不是每循环强制换侧**。默认每侧 10 次，每循环同侧 2 次，应先完成 5 循环再提示换侧。片内未做另一侧，不伪造 4 秒换边，不生成镜像文件。真正片内换侧才写 `kind:"in-clip"`。

`timeline-semantics.json` 固定本轮对实际 motion 曲线的节奏整理。蛙式 8 秒是后坐并回程，不是 8 秒静态保持；猫牛 8 秒含两个 4 秒完整循环。`rhythm.reps` 不与实际默认剂量竞争，试点不填旧 HipLab 的 `reps:6`。名称/主要点/三采样相位语音和完整运动 rhythm 分开，不能因为短 phase 容不下整句语音而修改动画。

## 命令与生成物

全库报告按 `production-plan.json` 为每个动作绑定所属批次的媒体根，不能用单一试制根校验全部动作。索引和详情由 catalog 自动生成，禁止手改生成物。报告会保留未写草稿、技术缺项、编辑/试听待审和失败；本地制作通过不等于发布通过。

```powershell
python -B -X utf8 tools/action-library-v2/report_library.py --production-root F:/PoseHub-v2-production --pilot-root F:/PoseHub-v2-pilot/neck-fix-r2 --check-files --generate --output catalog/v2/library-completeness.json

python -m unittest discover -s catalog/tools -p test_action_package_v2.py
```

`catalog/v2/completeness.json` 保留此前六动作试制快照；全库当前结果使用 `library-completeness.json`。已有六动作源、母版和派生技术层各 6/6，通过样片确认并合入 main，见[试制确认](../../docs/pilot-approval-20261021.md)。编辑、试听与最终发布审查仍待完成。

旧 `action_package_v2.py report/generate/validate/release --media-root media=...` 适用于同一媒体根的动作集合；混合多个批次时必须先按批次隔离输入。`validate --release` 的全部六层必须通过；`release` 只产生候选目录，既不发布 ZIP，也不上传。当前全库报告不是发布器。

`validate_catalog.py --v2` 和 `report.py --v2` 是显式迁移入口；不带 `--v2` 的旧脚本保留历史兼容并打印提示，不可用其退出码作为新版生产发布依据。文件核验/发布依赖 Python、`jsonschema`、Pillow、ffprobe 和 Node，缺失必要工具会拒绝通过。

回归测试的合同正例使用合成元数据并明确 mock 媒体探测，不充当制作成功或人工 QA 的证据；真实 PNG/MP4 损坏、错误尺寸与非灰度遮罩另有实际解码反向测试。测试通过不能把任何动作的 pending review 改为 pass。

`catalog/action-library/index.md`、每动作详情与 `v2/library-completeness.json` 均可从源重建。142 个正式 ID 按队列逐一制作，未建立草稿、缺媒体或审核未通过的动作都不能列为合格 v2。本工具只产生可审阅候选文件，不执行发布或上传。
