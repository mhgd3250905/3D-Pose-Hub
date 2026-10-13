# 统一人体演示素材库 · 2026-10-13

用户后续验看追加并认可[瑞士球背伸鞋向修正](erectors-B-footfix-2026-10-13.md)，当前选用94项图库另存`output/training-human-v2-library-footfix-20261013`。仅该项更新鞋向与墙面，其余93项与以下原批次保持；原素材包和冻结来源作为历史基线保留。当前选用仍56ready/38review，新鞋修两视频另有独立完整解码，其它93项以不变媒体哈希绑定原解码证据；用户认可鞋修不扩大为所有QA或App验收。

用户明确要求在本会话把所有已制作的演示动作改用已验收的 `training-human-v2` 重渲，并另存素材。此次制作不替换现有 App 视频，也不重新调整已验收的动作、节奏、高亮、道具和镜头。原成片、原参数与历史检查点保留。

94个冻结版本已全部另存成片，共23,454帧、781.8秒：60个正式动作库版本、8个办公室、8个久坐强化、11个托马斯专项与1个左侧变体、5个实际早期运行时示范，以及1个正式Flare v41全旋。明确停止的托马斯第1项不恢复。用户提供的Air-Flare原片、静态条目和图标不计作自产演示，同一Flare动作的启动剪影与旧历史版本不重复计数。制作流程最终记录为83项ready、11项review_required；最终独立审计为56项ready、38项review_required、failed/pending均0。两种状态的检查范围不同，94项成片完成不表示全部动作QA或用户验收通过。

冻结输入见 [批次清单](../tools/drill-anim/batches/training-human-v2-20261013/job-catalog.json)与 [来源哈希](../tools/drill-anim/batches/training-human-v2-20261013/source-sha256.json)。已有 App 51 项只是此集合中的使用子集。55 个普通旧成片无法精确追溯当时的渲染输入，故使用已冻结的成熟参数生成新版，不能宣称与旧视频逐像素重现。14 项缺少旧成片，但有实际制作源。5 个早期示范使用原 `src/training-motion.js`，没有用相似动作替代。

## 手机与母版

每个版本保存 1080×1080、30fps H.264/yuv420p 高清母版（CRF18），720×720、30fps 手机版本（CRF20），以及 540×540 JPEG 封面。视频带 faststart，方便手机开始播放。手机版本从同一高清合成帧缩小，不单独求解动作。App 原 51 项是方形展示，封面保留原来对应的播放时间；其它版本使用各自制作源的静帧时间。

原冻结批次生产目录为 `E:/AII-3D/3D-Body/output/training-human-v2-library-final-20261013/`，当时最终画廊及独立审计另存在 `audit-final/`，此前 `audit/` 保留。原批次所选94项共188个1080/720视频均完整解码；另保留托马斯2/10原构图的4个视频，当时审计实际完整解码192个视频。`audit-final/manifest.json`记录原批次状态和选用媒体，`directory-manifest.json`记录审计时完整目录快照；输入/指标/QA/成片有明确哈希，raw及合成PNG仅清点字节，不能称所有PNG都重新计算了SHA。当前鞋修选版另用curated_media_selection清单，不把新鞋向视频冒称原批次同源全关节差0。

## 人体与动作约束

已验收外观仍是人体 `2.0.0` 的网格、服装、灰色头、骨架和肩颈配置。模型清单补丁版 `2.0.1` 只修复旧 `sideplank-v7` 求解入口漏启人体配置的问题，外观配置没有变更。新规格显式使用 `modelProfile: 'training-human-v2'`、`alignClavicles: false`。

批量驱动对同一冻结规格的旧、新人体逐关键帧及完整循环的每一帧比较全部骨架世界矩阵和手脚等关节。贴肩动作的接触求解继续使用原制作人体表面，避免新肩部表面推动手臂；实际可见人体和穿透检查均使用新人体。原、新人体各自保存完整指标和 QA，以区分继承问题和新版新增问题。合成缩放和位置以同一规格的原人体静帧为基准，不因换人体自动改变构图。

托马斯2 `t-tuck-planche` 与10 `t-lsit-vsit-circles` 的原raw全身完整，原静帧构图在环绕/宽腿阶段产生手机成片裁边。两项在独立目录 `output/training-human-v2-library-framing-20261013/` 另存整周期恒定二维缩放/位置的构图派生：720＋300编码帧及两份原静帧共1022次边界检查，边缘触碰均0，1080画布最小人体边距分别58/59px。原raw和原成片保持，动作、时序、运镜路径、高亮及道具不变；只选择派生媒体，不改变原QA和review状态。派生清单、原/新place与全周期证明见该目录的 `delivery-manifest.json` 及各项 `framing-proof.json`。这两项不增加冻结动作数量或23,454帧的动作采样总数。

Flare v41 使用原烘焙 GLB 的 AnimationMixer 与 22 骨世界矩阵，不再做 IK、节奏处理或重烘焙。实际循环 8.991662288 秒按原时钟取样，输出 270 帧／9 秒，只在编码时产生 8.3377 毫秒循环尾间隔，不拉伸动作。机位采用原完整周期实测正交相机，保留原画布占比，不按初始姿态再次放大。来源及 270 帧实际对照见 [Flare v41 清单](../tools/drill-anim/batches/training-human-v2-20261013/flare-v41-source-manifest.json)。

每个版本保留源规格、新规格、主题、来源 SHA256、制作代码哈希、动作对照、完整帧指标、QA 和编码探测结果。完成条件包括所有帧齐全、实际视频尺寸与帧数正确、两种视频完整解码及输出哈希。[独立审计工具](../tools/drill-anim/batch-library-audit.mjs)再次读取实际视频并解码，独立比对整圈旧、新关节记录；骨矩阵保持来自制作流程逐帧记录，不冒称另有原下载视频逐帧骨架。既有数值问题或未满足检查的成片仍保存到待核对集合，不标成全部通过；早期示范和烘焙 Flare 没有原生 drill-anim QA，单独注明检查范围。

最终94项旧/新关节记录的独立整循环比对全部通过；全部骨矩阵逐帧最大差0来自producer记录，独立审计没有重新渲染骨架。身体QA归因为1项新版提示、9项继承提示、84项无身体标记；独立38项review还包含原求解警告等检查条件，不能等同于38项新身体问题。唯一新增身体提示为 `quadriceps-A`：左手新体表接触估计6/240帧记录4.02mm，超过原4mm标准最多0.02mm；原对应值3.19mm。该K6顶点片区估计不是手到三角面的精确距离，动作关节及接触质心差0、无穿模或新求解警告，仍保留 `qa.pass=false` 与待核对状态，不改阈值、不重求解姿态。实证见 `output/rerender-planning-20261013/quadriceps-contact-triage.md` 和同名JSON。

首次便携包历史目录为 `output/training-human-v2-library-portable-20261013/`，由 [package-library.mjs](../tools/drill-anim/package-library.mjs)独立保存，不覆盖。当前选用包为 `output/training-human-v2-library-footfix-20261013/`，由 [package-footfix.mjs](../tools/drill-anim/package-footfix.mjs)保留原全部文件后新增鞋修素材与选版清单。打开当前包内 `index.html` 播放720视频，`portable-catalog.json` 提供1080母版、540封面及证据的相对链接；整个目录可一起搬移，播放不依赖原项目路径或联网。包包含离线播放和规格/QA追溯所需内容，不附全部原始PNG、3D资源或运行时依赖，不承诺异机直接重渲；原机器绝对路径仅作历史出处。实际文件身份由包内 `package-manifest.json`、`directory-manifest.json` 与 `SHA256SUMS.txt` 保存，回读及手机画廊检查归入版本台账与验证记录。

## 断点执行

生产入口是 [batch-rerender.mjs](../tools/drill-anim/batch-rerender.mjs)。先启动项目 Vite 服务，再使用同一清单和新的输出目录；最多两个渲染浏览器，合成按互不重叠帧段并行。运行中的冻结源和制作代码不得修改。恢复时校验已完成视频及封面的哈希，完整项目跳过，失败项目单独重试。制作代码或人体版本改变时使用新的批次目录，不能覆盖先前产物。

```powershell
node tools/drill-anim/batch-rerender.mjs --catalog tools/drill-anim/batches/training-human-v2-20261013/job-catalog.json --out output/training-human-v2-library-final-20261013 --app-url http://127.0.0.1:8871 --workers 2
```

当前 App 安装身份仍为 L43；完整素材库的生成不表示手机已安装新版本，也不表示待核对动作已经取得用户验收。
