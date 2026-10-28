# 旧素材库 × 219 目录核对清单（任务 4，2026-10-26）

> 只读核对，**不改目录、不改 spec、不改媒体**。结论供开哥决定是否补收。

## 1. 对照基准

- **219 目录**：SDK 素材包 `posehub-app-test-pack-r1-v2` 的 `catalog.json`（219 个 action，`actions[].id / family / source.spec.path`），对应 Pose-Hub 生产分支 `origin/codex/app-test-pack-r1`（核对时 `8fbc43d`）。
- **“已收”判定**：旧 id 去掉修订后缀（`-r2/-r3/-rr1…`）后，命中 219 的 `id`、`family` 或 spec 文件名（去后缀）任一项即算已收。219 中 7 个 `*-native` 改名项（如 `h-doorframe-forearms-pec-native-r3`）的 `family` 仍是旧 id，因此按 family 匹配后已自动吸收，不再计为“改名遗漏”。
- **旧库来源（全部扫过）**：
  - `drill-anim/specs/*.js`（main，301 个文件，含 `_*.mjs` 共用模块）
  - `docs/drill-catalog.md`（自动生成目录，297 spec）
  - `drill-anim/data/drills.json`（FlareLab 51）
  - `catalog/catalog.json`（0.3.0，142）
  - `media/manifest.json`、`media/releases/0.1.0|0.2.0.sources.json`（HipLab 46）
  - `drill-anim/batches/training-human-v2-20261013/`（`job-catalog.json` 94 项 + 5 份历史 JSON + Flare v41）
  - `drill-anim/revisions/`（`hark-4080-v1`、`hiplab-media-fix-20261017`、`erectors-B-footfix-20261013`）
  - `media/drive-sync.json`（云盘 232 条，用于看成片现状）
  - 全部远程分支 `git ls-tree` 中的 `specs/*.js`
- **辅助依据**：`origin/codex/action-library-v2-production:catalog/v2/production-plan.json` 的 `additionalFamilies`（31 项，与本次扫描结果完全一致），以及机制审计文档 `docs/mechanism-coverage-audit-50-2026-10-20.md`、`docs/hip-core-flare-audit-42-2026-10-19.md`、`docs/085-v2plus-triceps-stretch-FAILED-diagnostic-2026-10-21.md`、`docs/076-v2plus-forward-lunge-2026-10-21.md` 等。

## 2. 结果概览

- FlareLab 51、0.3.0 的 142、HipLab v0.1.0/v0.2.0 的 46：**全部已在 219 内**，无遗漏。
- 各分支上不存在 main 以外的、又不在 219 里的 spec。
- 不在 219 的旧动作共 **39 项**：spec 目录 31 项（= production-plan 的 `additionalFamilies` 31）+ 只存在于 10-13 批次/修订包的 8 项。

| 判断 | 数量 |
|---|---:|
| 改名 | 0 |
| 重复 | 6 |
| 漏收 | 25 |
| 范围外 | 8 |
| **合计** | **39** |

漏收 25 项的建议：**建议补收 8**、**待开哥确认 8**、**不收 9**（见第 4 节）。范围外 8 项中 `h-mountain-climber` 另带“慢速核心版是否改名补收”待确认。

“素材现状”列说明：spec profile 取自 `docs/drill-catalog.md`（“旧”= 未设 `modelProfile` 的历史人物；“v2”= `training-human-v2`）。成片取自 `media/drive-sync.json`（2026-10-18 云盘同步，均为 v2 时期旧片，**没有任何一项有 v2plus 成片**），状态为该文件的 `state`。补收都意味着要按当前生产配方（`models/current-production.json`，v2plus）重做。

## 3. 逐项清单

### 3.1 居家 h-*（PR #111–115、Pose-Hub PR #5）

| 旧 id | 中文名 | 来源位置 | 判断 | 对应 219 id | 依据 | 素材现状 | 建议 |
|---|---|---|---|---|---|---|---|
| `h-bear-plank` | 熊式支撑 | `drill-anim/specs/h-bear-plank.js`（PR #111） | 漏收（无氧·核心） | 最近：`obliques-A`、`h-forearm-plank` | spec：四足位双膝离垫约 3 cm 静撑，高亮 abs+quadriceps；`obliques-A` 是熊爬穿腿（转体），`h-forearm-plank` 是前臂平板，体位/动作都不同。042/050 审计把它列为“抗伸展”已有机制，219 未收 | spec v2，15fps 8s；旧片 review_required | **建议补收**（静态、低成本，补 219 抗伸展入门档） |
| `h-biceps-self` | 双手对抗弯举 | `specs/h-biceps-self.js`（PR #112） | 漏收（无氧·力量） | 最近：`h-towel-isometric-curl`、`h-db-curl` | spec：左手压右前臂做动态自抗阻弯举（约 70→122°）；081 文档明确它与毛巾等长弯举、哑铃弯举机制不同 | spec v2；旧片 review_required | **待开哥确认**：是 219 唯一无器械动态弯举，但手压前臂属双手接触，v2plus 手部接触多次失败（077/081 诊断） |
| `h-bridge-overhead` | 臀桥过头伸臂 | `specs/h-bridge-overhead.js`（PR #115） | 漏收（拉伸+力量混合） | 最近：`glute-max-A`、`h-bridge-march`、`w-feet-on-chair-bridge` | spec：双臂过头贴垫+双腿臀桥，肩屈与髋伸同时；臀桥主体 219 已有 3 个，肩屈拉伸 `h-dd-shoulder`/`h-chair-lat` 已覆盖 | spec v2；旧片 review_required | **不收**（两个机制都已覆盖，组合版收益低） |
| `h-crossbody` | 交叉臂肩后侧拉伸 | `specs/h-crossbody.js`（PR #112） | 漏收（拉伸） | 无等价；相关 `h-sleeper-stretch` | spec：右臂水平内收横过胸前，左手压上臂，高亮 panels deltRear/infraspinatus；219 的 `h-sleeper-stretch` 是肩内旋，没有水平内收肩后侧拉伸（085 文档列为“水平内收”机制） | spec v2；旧片 review_required；高亮用 panels，补收需映射到 deltoids/rotator-cuff | **建议补收** |
| `h-inner-thigh` | 侧卧内收抬腿 | `specs/h-inner-thigh.js`（PR #111） | 漏收（无氧·力量） | 最近：`adductors-B`、`n-seated-squeeze`、`h-band-standing-adduction` | spec：左侧卧，下侧直腿内收抬起约 17°；219 内收力量要么是哥本哈根（难度高），要么要砖/弹力带，缺徒手入门档。050 审计列为内收已有机制 | spec v2；旧片 review_required | **建议补收** |
| `h-kb-swing` | 单臂壶铃摆荡 | `specs/h-kb-swing.js`（Pose-Hub PR #5）、`docs/home-small-equipment-2026-10-18.md` | 漏收（无氧·力量/爆发） | 最近：`h-db-rdl`、`h-good-morning` | spec：弹震式髋铰链，3 次/8s，壶铃挂右手；219 只有慢速铰链，无弹震摆荡。已从双手改单臂解决拳头重叠 | spec v2；旧片 **ready**；HD 清单 `media/inventory/pr5-pr6-hd-2026-10-18.json` 有记录 | **建议补收** |
| `h-mountain-climber` | 慢速登山跑 | `specs/h-mountain-climber.js`（PR #111） | 范围外（有氧倾向） | 最近：`h-plank-side-step`、`rotator-cuff-A` | 名称“登山跑”在训练语义上是有氧；本 spec 实际是慢速版（每侧 4s，含 0.6s 收膝停顿），高亮 abs+hip-flexors，偏核心抗伸展 | spec v2；旧片 review_required | **不收**（按范围标为有氧）；若开哥认可“慢速核心版”可改名后补收——**待开哥确认** |
| `h-open-book` | 侧卧开书式 | `specs/h-open-book.js`（PR #115） | 漏收（拉伸/灵活） | 最近：`h-quadruped-open`、`h-kneeling-thread-needle`、`h-supine-twist`、`o-seated-twist` | spec：侧卧屈髋屈膝，上臂大弧线打开胸椎旋转；055 文档写明 `h-quadruped-open` 是另一独立目标（掌撑闭链），085 文档对 h-open-book 结论是“只归类，不制作变体” | spec v2；旧片 review_required | **不收**（胸椎旋转 219 已有 4 个体位） |
| `h-pike-pushup` | 派克俯卧撑 | `specs/h-pike-pushup.js`（PR #111） | 漏收（无氧·力量） | 最近：`h-pike-scapular-elevation`、`h-db-press` | spec：倒 V 位屈肘，头向垫下行再推起；041/042 文档明确 041 只做肩带提压、派克俯卧撑靠肘屈伸，二者不同。219 无徒手垂直推 | spec v2；旧片 review_required | **建议补收** |
| `h-reverse-lunge` | 后撤步弓步蹲 | `specs/h-reverse-lunge.js`（PR #111） | 漏收（无氧·力量） | 最近：`h-forward-lunge`、`h-db-split-squat`、`h-bulgarian` | spec：一脚后撤约 65 cm 再下蹲，左右各一次；076 文档明确前跨步不是后撤步倒放，二者不同机制 | spec v2；旧片 review_required | **建议补收**（后撤步对膝更友好，常用基础动作） |
| `h-towel-behind` | 背后握毛巾抬臂 | `specs/h-towel-behind.js`（PR #115） | 漏收（拉伸） | 最近：`h-seated-reachback` | spec：背后双手握毛巾直臂上抬做肩伸拉伸；042/050 审计把它和 `h-seated-reachback` 并列为“后撑及肩伸”机制，219 只收了后者 | spec v2；旧片 review_required；道具登记为弹力带（实为毛巾） | **待开哥确认**（肩伸 219 已有坐姿版，站姿版要不要再收） |
| `h-towel-pass` | 毛巾过头转肩 | `specs/h-towel-pass.js`（PR #115） | 漏收（拉伸/灵活） | 无等价；相关 `h-wall-angel` | spec：直臂握毛巾从体前过头到身后，肩屈 34→212°；219 无转肩 | spec v2；旧片 review_required；`docs/reviews/2026-10-19-visual-audit.md` 记录“棍子穿头、两臂不对称” | **建议补收**（需按新模型重做，不复用旧片） |
| `h-towel-pulldown` | 站姿毛巾下拉 | `specs/h-towel-pulldown.js`（PR #112） | 漏收（无氧·力量） | 最近：`lats-B`、`h-band-row`、`h-fixed-bar-vertical-pull` | spec：双手外拉毛巾做下拉，自对抗、负荷不可量化；背阔肌 219 已有弹力带/单杠 3 个 | spec v2；旧片 review_required | **不收**（已有带负荷的同肌群动作） |
| `h-wall-pec` | 靠墙单臂胸肌拉伸 | `specs/h-wall-pec.js`（PR #112） | 重复 | `h-doorframe-forearms-pec-native`（219 id `h-doorframe-forearms-pec-native-r3`） | 同为站姿、手/前臂抵墙（门框）、转体做胸大肌静态拉伸；差异只是单直臂 vs 双前臂支点 | spec v2；旧片 review_required；PR #112 作者 QA 右肘报警 | **不收** |

### 3.2 托马斯专项 t-*（PR #106）

| 旧 id | 中文名 | 来源位置 | 判断 | 对应 219 id | 依据 | 素材现状 | 建议 |
|---|---|---|---|---|---|---|---|
| `t-flare-side-hold` | 托马斯侧撑定格 | `specs/t-flare-side-hold.js` | 漏收（无氧·技能定格） | 最近：`deltoids-A`、`hip-abductors-A` | spec：下侧脚+同侧掌承重，躯干近水平，上腿抬起、自由臂上举；`deltoids-A` 是直臂侧平板（无抬腿），`hip-abductors-A` 是前臂侧撑抬腿 | spec 旧人物；旧片 **ready**（另有 `t-flare-side-hold-left` 镜像片） | **待开哥确认**（是否单独做托马斯专项包） |
| `t-half-straddle` | 半分腿支撑 | `specs/t-half-straddle.js` | 漏收（无氧） | — | `job-catalog.json` `exclusions`：“User stopped Thomas action 1; preserve history and do not restore rendering.” | spec 旧人物；云盘 state=stopped | **不收**（用户已停止） |
| `t-lsit-open-close` | L撑开合 | `specs/t-lsit-open-close.js`、`-r2.js`（仅改机位） | 漏收（无氧·核心） | 最近：`abs-B` | spec：地面 L 撑中双腿开合，高亮 hip-flexors+adductors；219 只有平行杆团身 L 撑静态 | spec v2；旧片 **ready** | **待开哥确认**（宽腿 L 撑的动态进阶） |
| `t-lsit-tuck` | L 撑↔团身 | `specs/t-lsit-tuck.js` | 重复 | `abs-B`（平行杆团身 L 撑） | 同为支撑位团身 L 撑，abs-B 的 `tuck` 轨道本身就驱动膝从髋高到胸前；差异是地面 vs 平行杆道具 | spec v2；旧片 ready | **不收**（用 abs-B） |
| `t-lsit-vsit-circles` | L 撑到 V 撑画圈 | `specs/t-lsit-vsit-circles.js` | 漏收（无氧·核心高阶） | — | spec：L 撑抬到 V 撑后正反画圈，10s/300f | spec v2；旧片 review_required，手机构图裁边（`docs/training-media-library-2026-10-13.md`） | **不收**（高阶、旧片问题多；先收 V 撑本身） |
| `t-lsit-wide` | 宽腿L撑 | `specs/t-lsit-wide.js`、`-r2.js`（仅改机位） | 漏收（无氧·核心） | 最近：`abs-B` | spec：地面宽腿 L 撑静态呼吸保持，高亮 hip-flexors+abs；与 `t-straddle-hold` 动作模式几乎相同（见下） | spec v2；旧片 **ready**，r2 修好机位 | **建议补收**（与 t-straddle-hold 二选一，选本项） |
| `t-seated-straddle-ext` | 坐姿分腿屈伸 | `specs/t-seated-straddle-ext.js` | 漏收（无氧·核心压缩） | 最近：`hip-flexors-A`、`t-seated-straddle-lift-1leg` | spec：坐姿分腿、双脚离地、双掌在骨盆前，膝屈伸；与 219 两个压缩动作同体位但动作不同 | spec 旧人物；旧片 ready | **待开哥确认** |
| `t-seated-straddle-lifts` | 坐姿分腿双腿抬起 | `specs/t-seated-straddle-lifts.js` | 重复 | `t-seated-straddle-lift-1leg` | 同为坐姿宽分腿、双掌撑于两腿间、直腿抬离地数厘米；差异只是双腿 vs 单腿（进阶版） | spec 旧人物；旧片 review_required（24 帧求解警告） | **不收**（如要进阶档，再与开哥确认） |
| `t-straddle-hold` | 分腿支撑 | `specs/t-straddle-hold.js` | 漏收（无氧·核心） | 最近：`abs-B`；旧库内与 `t-lsit-wide` 重叠 | spec：地面宽分腿，双掌推地把髋和直腿抬离地面保持；与 t-lsit-wide 同体位同目标 | spec 旧人物；旧片 review_required（40 帧求解警告） | **不收**（与 t-lsit-wide 重叠，素材更差） |
| `t-tuck-planche` | 团身俄挺 | `specs/t-tuck-planche.js` | 漏收（无氧·技能高阶） | 最近：`serratus-A`、`triceps-B` | spec：蹲撑前倾锁臂，团身双脚离地手撑平衡；219 无俄挺类 | spec 旧人物，24s/720f（非 8s 标准）；旧片 review_required，裁边，120 帧求解警告 | **待开哥确认**（高阶技能，补收需重做且改时长） |
| `t-vsit` | V 撑 | `specs/t-vsit.js` | 漏收（无氧·核心高阶） | 最近：`hip-flexors-A`、`abs-B` | spec：大腿向胸折叠的 V 撑（注释 R09 强调不是全身后仰） | spec v2；旧片 **ready** | **待开哥确认**（高阶；若做托马斯/进阶包则优先收） |

### 3.3 自测静图 a-*（HipLab PR #119/#121）

| 旧 id | 中文名 | 来源位置 | 判断 | 对应 219 id | 依据 | 素材现状 | 建议 |
|---|---|---|---|---|---|---|---|
| `a-9090` | 自测·90/90 对比图 | `specs/a-9090.js`、`-r2.js` | 范围外 | （相关动作 `s-9090` 已收） | production-plan：`static-self-assessment`，“Separate still-image product; no 8-second loop movie queue.” | spec v2；云盘 state=static | **不收**（自测静图产品，不是训练动作） |
| `a-butterfly` | 自测·蝴蝶式膝高 对比图 | `specs/a-butterfly.js` | 范围外 | （`s-butterfly` 已收） | 同上 | 同上 | **不收** |
| `a-deep-squat` | 自测·深蹲到底 对比图 | `specs/a-deep-squat.js`、`-r2.js` | 范围外 | （`h-squat` 已收） | 同上 | 同上 | **不收** |
| `a-seated-fold` | 自测·坐姿体前屈 对比图 | `specs/a-seated-fold.js` | 范围外 | （`s-seated-fold` 已收） | 同上 | 同上 | **不收** |
| `a-supine-cross` | 自测·仰卧单腿横跨 对比图 | `specs/a-supine-cross.js` | 范围外 | — | 同上 | 同上 | **不收** |
| `a-thomas` | 自测·托马斯测试 对比图 | `specs/a-thomas.js`、`-r2.js` | 范围外 | （`n-thomas-test` 已收） | 同上 | 同上 | **不收** |

### 3.4 只在 10-13 批次 / 修订包里的 8 项（无 `drill-anim/specs` 文件）

| 旧 id | 中文名 | 来源位置 | 判断 | 对应 219 id | 依据 | 素材现状 | 建议 |
|---|---|---|---|---|---|---|---|
| `s-9090-switch` | 90/90左右换髋 | `drill-anim/revisions/hark-4080-v1/s-9090-switch/spec.js`；`job-catalog.json` | 漏收（拉伸/灵活） | 最近：`s-9090`、`h-9090-liftoff` | `hark-4080-v1/README.md`：“独立于原 s-9090 前屈拉伸；新增左右换髋”，12s/360f。219 的 `s-9090`（spec `s-9090-r4.js`←r3←r2←`s-9090.js`）注释为 “90/90 hip stretch”，是单侧定格+前屈，**没有换边**，但 nameZh 写的是“90/90 坐姿换髋” | spec 在修订包；旧片 **ready**（云盘 historical-extra） | **待开哥确认**：要么补收本项，要么把 219 `s-9090` 中文名改成“90/90 坐姿拉伸”（名不副实） |
| `t-flare-side-hold-left` | 托马斯侧撑定格（左侧） | `job-catalog.json`（`sourceSpecExport: leftSide`，源 `t-flare-side-hold.js`） | 重复 | `t-flare-side-hold`（本身未收） | 同一 spec 的左侧骨骼镜像导出，App 可镜像 | 旧片 ready | **不收**（随 t-flare-side-hold 一起决定） |
| `history-straddleLift` | 坐姿分腿 · 单腿压缩抬起 | `batches/training-human-v2-20261013/specs/straddleLift.json` | 重复 | `t-seated-straddle-lift-1leg` | 名称与高亮（hip-flexors/quadriceps/abs）一致；但它是 3D-Body `src/training-motion.js` v1 姿态采样器的历史片段（`not_an_alias_of_current_drill: true`），不是改名 | 无 drill spec，`qaAuthored: false`；旧片 review_required | **不收** |
| `history-scapPush` | 直臂推地 · 肩带控制示意 | `batches/.../specs/scapPush.json` | 重复（推定） | `serratus-A` | 名称“直臂推地·肩带控制”+高亮 deltoids/triceps/scapular/abs 与俯撑肩胛前伸一致；原始姿态在 3D-Body 仓库，本次未打开，体位未逐帧核对 | 同上 | **不收**（体位**待开哥确认**） |
| `history-supportShift` | 双手支撑 · 小幅左右移重 | `batches/.../specs/supportShift.json` | 漏收（无氧） | 最近：`triceps-B`、`lats-A` | 托马斯支撑换重心示意；219 只有静态直臂支撑 | 无 drill spec，v1 采样器；旧片 review_required | **不收**（需整段重写才能进生产） |
| `history-rearSupport` | 脚辅助后撑 · 单腿小幅抬起 | `batches/.../specs/rearSupport.json` | 漏收（无氧） | 最近：`h-tabletop`、`erectors-A` | 后撑位单腿小抬；219 后撑只有双脚固定抬髋 | 同上 | **不收**（同上） |
| `history-hipOpening` | 坐姿开腿 · 主动开合控制 | `batches/.../specs/hipOpening.json` | 漏收（灵活） | 最近：`h-butterfly-active`、`t-seated-straddle-lift-1leg` | 坐姿双腿主动开合；219 主动开合版是仰卧蝴蝶 | 同上 | **不收**（同上） |
| `flare-v41-loop` | Flare 托马斯全旋（v41正式循环） | `batches/.../specs/flare-v41-loop.json`、`page/flare-v41-demo-adapter.js` | 范围外 | — | 完整托马斯全旋技巧动作（GLB 骨骼烘焙），不是肌肉训练或拉伸演示 | 旧片 review_required（historical-extra） | **不收** |

## 4. 建议补收清单（8）

| 优先 | 旧 id | 中文名 | 补的空白 |
|---|---|---|---|
| 1 | `h-pike-pushup` | 派克俯卧撑 | 徒手垂直推 |
| 1 | `h-reverse-lunge` | 后撤步弓步蹲 | 基础下肢，膝友好 |
| 1 | `h-kb-swing` | 单臂壶铃摆荡 | 弹震式髋铰链（旧片 ready） |
| 2 | `h-inner-thigh` | 侧卧内收抬腿 | 徒手内收入门档 |
| 2 | `h-bear-plank` | 熊式支撑 | 抗伸展入门静撑 |
| 2 | `h-crossbody` | 交叉臂肩后侧拉伸 | 水平内收/肩后侧拉伸 |
| 2 | `h-towel-pass` | 毛巾过头转肩 | 转肩灵活（旧片有穿模，需重做） |
| 3 | `t-lsit-wide` | 宽腿L撑 | 地面分腿 L 撑（与 t-straddle-hold 二选一） |

漏收中“待开哥确认”8 项：`h-biceps-self`、`h-towel-behind`、`t-flare-side-hold`、`t-lsit-open-close`、`t-seated-straddle-ext`、`t-tuck-planche`、`t-vsit`、`s-9090-switch`；另加范围外的 `h-mountain-climber`（慢速核心版是否收）。

漏收中“不收”9 项：`h-bridge-overhead`、`h-open-book`、`h-towel-pulldown`（机制已覆盖）；`t-half-straddle`（用户已停止）；`t-lsit-vsit-circles`、`t-straddle-hold`（高阶或与 t-lsit-wide 重叠且素材差）；`history-supportShift`、`history-rearSupport`、`history-hipOpening`（v1 采样器、无 drill spec）。

## 5. 遗留问题

1. **219 `s-9090` 名不副实**：nameZh “90/90 坐姿换髋”，但 spec 链（`s-9090.js`→r4）只做单侧定格+前屈；真正换髋的是 `s-9090-switch`（未收）。需开哥定：补收 switch，或改 219 名称。
2. **219 内含有氧项**：`h-step-jack`（低冲击开合跳，category=cardio）在 219 里，与“本项目不做有氧演示”的范围不一致。本次不改，提请开哥决定是否移出。
3. **219 内疑似重复**：`obliques-B` 与 `h-band-pallof` 中文名都是“弹力带抗旋转推”、同肌群同道具。不在本任务范围，仅记录。
4. **history-* 五项**的原始姿态代码在 3D-Body 仓库 `src/training-motion.js`，本次未打开，体位判断依据只有名称、高亮和批次说明；`history-scapPush` 对应 `serratus-A` 为推定。
5. 所有旧片都是 v2 时期素材；任何补收都要按 v2plus 当前配方重做，旧片只能作动作参考。
