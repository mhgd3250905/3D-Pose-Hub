# 动作素材库盘点与收纳：2026-10-28 r1

219 是已有透明测试包的交付数量。对全部本地／已抓取远端分支的 Git 树查重后，本次登记 258 个源码家族：219 个已有交付、24 个旧动态候选、8 个 PR23 新动作草稿、6 个自测静图和 1 个用户停止项。排除静图及停止项后是 **251 个动态／保持动作候选 ID**，不是 251 个已审核动作，也不证明每个 ID 的训练机制都不同。

本次只建立统一索引和待处理队列，没有移动／删除原素材，没有修改 spec、人体、生产默认、训练处方或旧目录，也没有把待审分支合入 main。镜头、动作和新人体兼容性尚未逐项看样。

机器清单：[actions-20261028-r1.json](../catalog/inventory/actions-20261028-r1.json)。每项保存家族、原交付 ID、源码 commit/path/blob/LF SHA、主线关系及归类；待选状态不能直接作为生产脚本的启动白名单。

## 固定输入与计数口径

- main：`56a479df170ec53d124ebc12fae7e77b7928a64a`，301 个 `specs/*.js`，合并明确修订／219 显式家族映射后为 243 个家族。原版和修订不重复计为新动作。
- 219 清单：`codex/app-test-pack-r1@d550cd211d878053839be1f8ac9f971f9a1655ca` 的 `catalog/test/app-test-pack-r1.json`。219 媒体交付保持 test/unreviewed 身份；本轮不核验 SDK 或 R2。
- 新增草稿：PR [#23](https://github.com/mhgd3250905/3D-Pose-Hub/pull/23)，`origin/drill/gap-batch1-20261026@c98d36a59059364964dba0520b078104f77e49fa`。直接回读 GitHub 确认为 open/draft。
- 219 与 main 相交 212 个家族；main 独有 31＝24 动态候选＋6 静图＋1 停止项；219 独有 7 个 native 家族。`243 + 7 + 8 = 258`，`258 - 6 - 1 = 251`。
- 早先接力中的“241 动作”是旧阶段口径，不能替代本次 243 个 main 源码家族的精确统计。日期化旧记录保留，不改写成新结果。
- 归并依据为 `catalog/tools/build_catalog.py` 的修订规则、219 的显式 `family/source.spec.path` 和已知 `-rrN` 修订。不会盲目删除 `-native` 后缀。

| 收纳组 | 数量 | 后续处理 |
|---|---:|---|
| 已交付透明测试包 | 219 | 保留原包；在新人体上重新整理镜头／兼容性时另建输出批次 |
| 旧动态／保持候选 | 24 | 已在 main 有源码，尚未进入219包；重复机制、专项范围及质量逐项选择 |
| PR23 新动作草稿 | 8 | 未进入 main 或219包；先修明显问题、适配新人体和做全片检查 |
| 自测静图 | 6 | 单独静图产品队列，不混入循环视频包 |
| 用户已停止 | 1 | 仅存档，禁止自动恢复生产 |
| 旧批次／修订包历史条目 | 8 | 单列；不加到上述258，含镜像、旧采样器和独立历史规格 |
| 只有名称的后续提议 | 10 | 没有spec，不计现有动作和成片 |

## 8 个真正新增、尚未集成的动作

全部来自 PR23，规格使用旧 v2plus；只有贡献方低配机关键帧预览。本轮没有重新看图或验证几何，以下问题是贡献方现有记录，均不代表新人体适配或完整循环通过。

| ID | 名称 | 已记录待办 |
|---|---|---|
| `h-band-biceps-curl` | 站姿踩带弹力带弯举 | 完整循环、踩带／握带及新版人体检查待做 |
| `h-chair-elbow-triceps-stretch` | 扶椅背屈肘肱三头肌拉伸 | 镜头／高亮不清；头椅间隙未测，肘部支撑和完整循环待做 |
| `h-db-overhead-shrug` | 双哑铃过头耸肩 | 可达范围告警；肌群、难度和剂量字段待补 |
| `h-db-reverse-curl` | 站姿双哑铃反握弯举 | 完整循环、握持及新版人体检查待做 |
| `h-db-zottman-curl` | 站姿双哑铃佐特曼弯举 | 完整循环、翻腕／握持及新版人体检查待做 |
| `h-half-kneeling-quad-stretch` | 半跪姿手拉脚股四头肌拉伸 | 贡献方记录抓脚约3–4mm陷入、膝高跨帧差／高亮碎条；难度待补 |
| `h-standing-arm-extension-stretch` | 站姿双臂后伸开肩 | 可达范围告警；完整循环待做 |
| `h-supine-cactus-chest` | 仰卧仙人掌开胸 | 完整循环、仰卧支撑及新版人体检查待做 |

## 219 包之外的旧源码候选

下列建议沿用已合入的[旧库审计](old-library-audit-20261026.md)，仅保存其当时判断，未转为本次批准。24 项中包括建议补收、重复机制、专项与范围待定项目，不能一键全部加入生产。

| 家族 | 名称 | 归类 | 历史建议 |
|---|---|---|---|
| `a-9090` | 自测·90/90 对比图 | 自测静图 | **不收**（自测静图产品，不是训练动作） |
| `a-butterfly` | 自测·蝴蝶式膝高 对比图 | 自测静图 | **不收** |
| `a-deep-squat` | 自测·深蹲到底 对比图 | 自测静图 | **不收** |
| `a-seated-fold` | 自测·坐姿体前屈 对比图 | 自测静图 | **不收** |
| `a-supine-cross` | 自测·仰卧单腿横跨 对比图 | 自测静图 | **不收** |
| `a-thomas` | 自测·托马斯测试 对比图 | 自测静图 | **不收** |
| `h-bear-plank` | 熊式支撑 | 动态／保持候选 | **建议补收**（静态、低成本，补 219 抗伸展入门档） |
| `h-biceps-self` | 双手对抗弯举 | 动态／保持候选 | **待开哥确认**：是 219 唯一无器械动态弯举，但手压前臂属双手接触，v2plus 手部接触多次失败（077/081 诊断） |
| `h-bridge-overhead` | 臀桥过头伸臂 | 动态／保持候选 | **不收**（两个机制都已覆盖，组合版收益低） |
| `h-crossbody` | 交叉臂肩后侧拉伸 | 动态／保持候选 | **建议补收** |
| `h-inner-thigh` | 侧卧内收抬腿 | 动态／保持候选 | **建议补收** |
| `h-kb-swing` | 单臂壶铃摆荡 | 动态／保持候选 | **建议补收** |
| `h-mountain-climber` | 慢速登山跑 | 动态／保持候选 | **不收**（按范围标为有氧）；若开哥认可“慢速核心版”可改名后补收——**待开哥确认** |
| `h-open-book` | 侧卧开书式 | 动态／保持候选 | **不收**（胸椎旋转 219 已有 4 个体位） |
| `h-pike-pushup` | 派克俯卧撑 | 动态／保持候选 | **建议补收** |
| `h-reverse-lunge` | 后撤步弓步蹲 | 动态／保持候选 | **建议补收**（后撤步对膝更友好，常用基础动作） |
| `h-towel-behind` | 背后握毛巾抬臂 | 动态／保持候选 | **待开哥确认**（肩伸 219 已有坐姿版，站姿版要不要再收） |
| `h-towel-pass` | 毛巾过头转肩 | 动态／保持候选 | **建议补收**（需按新模型重做，不复用旧片） |
| `h-towel-pulldown` | 站姿毛巾下拉 | 动态／保持候选 | **不收**（已有带负荷的同肌群动作） |
| `h-wall-pec` | 靠墙单臂胸肌拉伸 | 动态／保持候选 | **不收** |
| `t-flare-side-hold` | 托马斯侧撑定格 | 动态／保持候选 | **待开哥确认**（是否单独做托马斯专项包） |
| `t-half-straddle` | 半分腿支撑 | 用户已停止 | **不收**（用户已停止） |
| `t-lsit-open-close` | L撑开合 | 动态／保持候选 | **待开哥确认**（宽腿 L 撑的动态进阶） |
| `t-lsit-tuck` | L 撑↔团身 | 动态／保持候选 | **不收**（用 abs-B） |
| `t-lsit-vsit-circles` | L 撑到 V 撑画圈 | 动态／保持候选 | **不收**（高阶、旧片问题多；先收 V 撑本身） |
| `t-lsit-wide` | 宽腿L撑 | 动态／保持候选 | **建议补收**（与 t-straddle-hold 二选一，选本项） |
| `t-seated-straddle-ext` | 坐姿分腿屈伸 | 动态／保持候选 | **待开哥确认** |
| `t-seated-straddle-lifts` | 坐姿分腿双腿抬起 | 动态／保持候选 | **不收**（如要进阶档，再与开哥确认） |
| `t-straddle-hold` | 分腿支撑 | 动态／保持候选 | **不收**（与 t-lsit-wide 重叠，素材更差） |
| `t-tuck-planche` | 团身俄挺 | 动态／保持候选 | **待开哥确认**（高阶技能，补收需重做且改时长） |
| `t-vsit` | V 撑 | 动态／保持候选 | **待开哥确认**（高阶；若做托马斯/进阶包则优先收） |

旧审计建议优先补收的8项是：`h-pike-pushup`、`h-reverse-lunge`、`h-kb-swing`、`h-inner-thigh`、`h-bear-plank`、`h-crossbody`、`h-towel-pass`、`t-lsit-wide`。其中有旧片问题或新人体接触需要重做；建议不等于已选中。

## 已在219包中、源码尚未进 main 的7项

这些不是新增动作，应整理其来源并适配当前身体，不能再次增加动作总数。

| 原交付 ID | 归并家族 | 来源位置 |
|---|---|---|
| `h-bilateral-farmer-hold-native` | `h-bilateral-farmer-hold` | `codex/app-test-pack-r1:drill-anim/specs/h-bilateral-farmer-hold-native.js` |
| `h-chair-progressive-front-split-native` | `h-chair-progressive-front-split` | `codex/app-test-pack-r1:drill-anim/specs/h-chair-progressive-front-split-native.js` |
| `h-close-stance-forward-fold-native` | `h-close-stance-forward-fold` | `codex/app-test-pack-r1:drill-anim/specs/h-close-stance-forward-fold-native.js` |
| `h-doorframe-forearms-pec-native-r3` | `h-doorframe-forearms-pec` | `codex/app-test-pack-r1:drill-anim/specs/h-doorframe-forearms-pec-native-r3.js` |
| `h-knee-wall-dorsiflexion-native` | `h-knee-wall-dorsiflexion` | `codex/app-test-pack-r1:drill-anim/specs/h-knee-wall-dorsiflexion-native.js` |
| `h-straight-arm-hang-native` | `h-straight-arm-hang` | `codex/app-test-pack-r1:drill-anim/specs/h-straight-arm-hang-native.js` |
| `h-unsupported-star-reach-native` | `h-unsupported-star-reach` | `codex/app-test-pack-r1:drill-anim/specs/h-unsupported-star-reach-native.js` |

219 清单精确选择的源码中，174 个路径在 main 且 LF SHA 一致，45 个路径不在 main。45＝上述7个家族＋38个已有家族在生产／测试分支上的专用修订；不等于缺45个动作。后续生产必须固定每个家族选用的 commit＋path＋SHA，不能自动用 main 原版替换旧包的精确来源。

7个native条目记录的原 `source.commit=89c9c4f...` 在当前仓库不可读取；本轮按备份分支实际文件验证，其内容的 LF／CRLF 精确表示与原清单 SHA 相符。清单保留原来源声明，并另存本仓库可复核的备份 commit/blob，不把旧来源声明冒充已核验的本仓库提交。

## 同动作修订与模型包装单独存放

| 来源 | 当前状态 | 计数处理 |
|---|---|---|
| PR19 | 12项时序修订，4项已独立采纳、8项待审 | 新增家族0 |
| PR22／PR24 的237份旧模型包装 | 原PR22关闭未合；r7身体已独立合入，旧动作包装未整体采纳 | 新增家族0；不以最高修订号自动选用 |
| PR17 | 8项语义提案已保存 | 不新增动作，不自动批准词表或处方 |
| PR18／PR21 | 有效能力已选择性移植到r7 | 原旧模型包装保持历史身份 |

当前 GitHub 开放草稿为PR19／23／24。PR19尚待审的8项：`chest-A-r3`、`deltoids-B-r2`、`forearms-A-r2`、`hip-abductors-A-r2`、`n-leg-circles-r2`、`scapular-A-r2`、`t-seated-straddle-lift-1leg-r2`、`triceps-B-r2`。

四个路径在 main 和 `feat/body-v3` 同名但内容不同：`chest-B-r2.js`、`serratus-A-r2.js`、`triceps-A-r2.js`、`quadriceps-C-r2.js`。main为已采纳时序；旧分支为模型包装候选，合并时不可按文件名覆盖。详见[选择性采纳记录](reviews/pr17-22-adoption-20261028/adoption-record-r1.md)。

## 历史条目与仅规划项

| 历史条目 | 名称 | 处理 |
|---|---|---|
| `s-9090-switch` | 90/90左右换髋 | **待开哥确认**：要么补收本项，要么把 219 `s-9090` 中文名改成“90/90 坐姿拉伸”（名不副实） |
| `t-flare-side-hold-left` | 托马斯侧撑定格（左侧） | **不收**（随 t-flare-side-hold 一起决定） |
| `history-straddleLift` | 坐姿分腿 · 单腿压缩抬起 | **不收** |
| `history-scapPush` | 直臂推地 · 肩带控制示意 | **不收**（体位**待开哥确认**） |
| `history-supportShift` | 双手支撑 · 小幅左右移重 | **不收**（需整段重写才能进生产） |
| `history-rearSupport` | 脚辅助后撑 · 单腿小幅抬起 | **不收**（同上） |
| `history-hipOpening` | 坐姿开腿 · 主动开合控制 | **不收**（同上） |
| `flare-v41-loop` | Flare 托马斯全旋（v41正式循环） | **不收** |

上述含真正另存的 `s-9090-switch`、镜像和旧姿态采样器；全部按历史条目保存，不与标准spec家族相加。旧审计将 `history-scapPush` 视作 `serratus-A` 的结论仍是推定，不能视为本轮看图确认。

PR23第二批只有名称、尚无spec的10项：`h-seated-chin-tuck`、`h-seated-upper-trap-stretch`、`h-seated-levator-stretch`、`h-prone-neck-extension`、`h-seated-neck-isometric`、`h-prone-pec-stretch`、`h-side-lying-quad-stretch`、`h-prone-quad-stretch`、`h-wall-biceps-stretch`、`h-db-concentration-curl`。旧计划中的颈／手掌能力依赖应按现有r7/r5重新评估，不能照抄“引擎未合入”作为当前事实。

## 下一轮镜头与生产整理的入口

1. 先确定要收录的家族及精确源码来源，219包作为历史基线；PR23八项和旧审计建议八项单独评估，不为了凑数自动加入。
2. 在明确选择的新人体上逐项检查完整循环：固定镜头、动作可读性、人体／道具不裁切、明显接触／穿模和循环跳变。输出另建修订，不覆盖旧spec。
3. 新派生目标关闭地面投影；保留人体自身明暗。为整段循环计算人体＋必要道具的内容范围并集，写入清单，供App使用固定内容矩形居中。
4. 确认镜头配方后进入通用渲染／压缩流水线；直接产生App最终下载文件和真实SHA／体积报告，母版与下载目录分开。
5. inventory中的`newProductionSelection=not-selected`、`cameraReview=not-performed`不能被消费者解释为通过。`t-half-straddle`的用户停止状态必须阻止自动排队。

## 验证范围

本轮静态回读 528 条主线／新增／旧包选中源码引用，按Git blob读取 354 个独立内容并验证LF SHA及原清单的精确LF/CRLF表示；扫描 53 个本地与已抓取远端引用的spec树，没有清单外家族。另查全部现有工作树的spec/catalog未提交项，本轮没有发现额外未登记的新spec。

GitHub状态为2026-10-28直接查询快照。未渲染、未重解码219视频、未逐项审核动作／镜头；此次源码存在性和计数校验不改变原有内容审核、素材发布或App验收状态。

## 原219基线逐项索引

“精确源”只说明原包所选spec在当前main是否同内容，不代表新的生产版本已选定。

| 原交付 ID | 名称 | main有同家族 | main有原包精确源 |
|---|---|---|---|
| `abs-A` | 空心体支撑 | 是 | 否 |
| `abs-B` | 平行杆团身 L 撑 | 是 | 是 |
| `abs-C` | 双杠直臂支撑举腿 | 是 | 是 |
| `adductors-A` | 哥萨克蹲 | 是 | 否 |
| `adductors-B` | 屈膝哥本哈根侧撑 | 是 | 是 |
| `adductors-C` | 绳索站姿髋内收 | 是 | 是 |
| `chest-A` | 俯卧撑转侧撑 | 是 | 否 |
| `chest-B` | 平行杆深幅俯卧撑 | 是 | 是 |
| `chest-C` | 绳索单臂站姿推胸 | 是 | 是 |
| `deltoids-A` | 直臂侧平板支撑 | 是 | 否 |
| `deltoids-B` | 哑铃半程土耳其起立（至高桥） | 是 | 否 |
| `deltoids-C` | 地雷杆半跪单臂推举 | 是 | 是 |
| `erectors-A` | 反向平板（后撑抬髋） | 是 | 是 |
| `erectors-B` | 瑞士球背伸 | 是 | 是 |
| `erectors-C` | 45° 罗马椅背伸 | 是 | 是 |
| `forearms-A` | 跪姿多方向腕部摇摆 | 是 | 否 |
| `forearms-B` | 哑铃腕屈 + 腕伸 | 是 | 是 |
| `forearms-C` | 壶铃倒握行走 | 是 | 是 |
| `g-cable-hip-abduction` | 低位绳索髋外展 | 是 | 是 |
| `g-cable-hip-extension` | 低位绳索髋后伸 | 是 | 是 |
| `glute-max-A` | 单腿臀桥 | 是 | 是 |
| `glute-max-B` | 弹力带四足直腿后踢 | 是 | 是 |
| `glute-max-C` | 反向背伸机 | 是 | 是 |
| `h-9090-liftoff` | 90/90 后腿主动抬起 | 是 | 否 |
| `h-adductor-rock` | 四足单腿侧伸后摇 | 是 | 是 |
| `h-banana` | 仰卧香蕉式侧伸 | 是 | 否 |
| `h-band-chest-fly` | 站姿单臂弹力带夹胸 | 是 | 是 |
| `h-band-face-pull` | 站姿弹力带面拉 | 是 | 是 |
| `h-band-hip-extension` | 扶椅弹力带髋后伸 | 是 | 是 |
| `h-band-hip-ir` | 坐椅弹力带髋内旋 | 是 | 是 |
| `h-band-leg-out` | 仰卧弹力带单腿侧落 | 是 | 是 |
| `h-band-pallof` | 弹力带抗旋转推 | 是 | 是 |
| `h-band-pull-apart` | 弹力带水平拉开 | 是 | 是 |
| `h-band-row` | 弹力带坐姿划船 | 是 | 是 |
| `h-band-shoulder-ir` | 弹力带站姿肩内旋 | 是 | 是 |
| `h-band-standing-abduction` | 扶椅弹力带站姿外展 | 是 | 是 |
| `h-band-standing-adduction` | 弹力带站姿内收 | 是 | 是 |
| `h-band-stepout` | 弹力带侧向步出抗旋转 | 是 | 是 |
| `h-band-straight-leg-raise` | 扶椅弹力带直腿前抬 | 是 | 是 |
| `h-band-triceps-pressdown` | 站姿单臂弹力带下压 | 是 | 是 |
| `h-bent-knee-calf-raise` | 屈膝承重提踵 | 是 | 是 |
| `h-bilateral-farmer-hold-native` | 双哑铃农夫站立保持 | 否 | 否 |
| `h-bilateral-upper-back-hug` | 双臂前抱上背拉伸 | 是 | 是 |
| `h-bridge-march` | 臀桥交替踏步 | 是 | 是 |
| `h-bulgarian` | 椅子保加利亚分腿蹲 | 是 | 是 |
| `h-butterfly-active` | 仰卧蝴蝶主动开合 | 是 | 否 |
| `h-calf-raise` | 扶墙提踵 | 是 | 是 |
| `h-catcow-quad` | 四足猫牛式 | 是 | 是 |
| `h-chair-dip` | 椅子臂屈伸 | 是 | 是 |
| `h-chair-kickback` | 扶椅站姿后踢腿 | 是 | 是 |
| `h-chair-lat` | 扶椅背阔肌拉伸 | 是 | 是 |
| `h-chair-progressive-front-split-native` | 扶椅前后劈叉渐进 | 否 | 否 |
| `h-chair-single-leg-hip-thrust` | 肩靠椅单腿臀推 | 是 | 是 |
| `h-chair-sit-to-stand` | 普通椅双脚坐站 | 是 | 是 |
| `h-chair-step-up` | 椅子上步 | 是 | 是 |
| `h-chair-tspine` | 跪姿椅面胸椎伸展 | 是 | 是 |
| `h-close-stance-forward-fold-native` | 并脚微屈膝无扶体前屈 | 否 | 否 |
| `h-cobra` | 眼镜蛇式 | 是 | 是 |
| `h-couch-stretch` | 沙发拉伸（后脚搭矮凳） | 是 | 是 |
| `h-crunch` | 卷腹 | 是 | 否 |
| `h-db-calf-raise` | 双哑铃站姿提踵 | 是 | 是 |
| `h-db-curl` | 哑铃交替弯举 | 是 | 是 |
| `h-db-floor-fly` | 哑铃地板飞鸟 | 是 | 是 |
| `h-db-floor-press` | 哑铃地板卧推 | 是 | 是 |
| `h-db-front-raise` | 站姿双哑铃前平举 | 是 | 是 |
| `h-db-hammer-curl` | 站姿双哑铃锤式弯举 | 是 | 是 |
| `h-db-kickback` | 双哑铃俯身臂屈伸 | 是 | 是 |
| `h-db-lateral` | 哑铃侧平举 | 是 | 是 |
| `h-db-overhead-triceps-extension` | 单臂哑铃过头臂屈伸 | 是 | 是 |
| `h-db-press` | 站姿哑铃推举 | 是 | 是 |
| `h-db-rdl` | 哑铃罗马尼亚硬拉 | 是 | 是 |
| `h-db-reverse-fly` | 哑铃俯身飞鸟 | 是 | 是 |
| `h-db-row` | 扶椅单臂哑铃划船 | 是 | 是 |
| `h-db-shrug` | 双哑铃站姿耸肩 | 是 | 是 |
| `h-db-split-squat` | 双哑铃原地分腿蹲 | 是 | 是 |
| `h-db-supported-calf-raise` | 单手哑铃扶墙双脚提踵 | 是 | 是 |
| `h-dd-shoulder` | 下犬式压肩 | 是 | 是 |
| `h-donkey-kick` | 四足屈膝后踢 | 是 | 是 |
| `h-doorframe-forearms-pec-native-r3` | 门框双前臂胸肌拉伸 | 否 | 否 |
| `h-fixed-bar-vertical-pull` | 固定单杠舒适范围引体 | 是 | 是 |
| `h-floor-nordic-hand-reset` | 地面北欧离心及手撑复位 | 是 | 是 |
| `h-forearm-plank` | 前臂平板支撑 | 是 | 是 |
| `h-forward-lunge` | 前跨步弓步蹲 | 是 | 是 |
| `h-goblet-squat` | 哑铃高脚杯深蹲 | 是 | 是 |
| `h-good-morning` | 徒手早安式 | 是 | 否 |
| `h-hip-gate` | 扶椅站姿开髋门 | 是 | 是 |
| `h-incline-pushup` | 扶凳上斜俯卧撑 | 是 | 是 |
| `h-knee-hug` | 仰卧抱膝 | 是 | 否 |
| `h-knee-wall-dorsiflexion-native` | 膝碰墙背屈（前脚跟不离地） | 否 | 否 |
| `h-kneeling-instep-stretch` | 跪姿脚背支撑拉伸 | 是 | 是 |
| `h-kneeling-pushup` | 跪姿俯卧撑 | 是 | 是 |
| `h-kneeling-thread-needle` | 跪姿低位穿针（小范围修订） | 是 | 是 |
| `h-lateral-step-lunge` | 侧跨步弓步蹲 | 是 | 是 |
| `h-overhead-triceps-stretch` | 站姿过头肱三头肌拉伸 | 是 | 是 |
| `h-pike-scapular-elevation` | 派克位直臂肩带提压 | 是 | 是 |
| `h-plank-side-step` | 直臂俯撑交替侧点地 | 是 | 是 |
| `h-quad-cars` | 四足髋关节画圈 | 是 | 是 |
| `h-quadruped-open` | 四足跪姿单臂开胸 | 是 | 是 |
| `h-quadruped-rockback` | 四足中立背后坐 | 是 | 是 |
| `h-reverse-clam` | 侧卧反向蚌式 | 是 | 否 |
| `h-reverse-crunch` | 反向卷腹 | 是 | 是 |
| `h-russian-twist` | 俄罗斯转体 | 是 | 否 |
| `h-seated-reachback` | 坐姿后撑滑臀 | 是 | 是 |
| `h-short-side-plank` | 屈膝短杠杆侧平板 | 是 | 是 |
| `h-side-er` | 侧卧肩外旋 | 是 | 是 |
| `h-side-leg-raise` | 站姿侧抬腿 | 是 | 否 |
| `h-sleeper-stretch` | 侧卧睡姿肩内旋拉伸 | 是 | 是 |
| `h-slider-body-saw` | 双脚滑盘长杠杆回收 | 是 | 是 |
| `h-squat` | 徒手深蹲 | 是 | 否 |
| `h-standing-forearm-rotation` | 站姿屈肘前臂旋转 | 是 | 是 |
| `h-standing-wrist-deviation` | 站姿屈肘腕侧偏控制 | 是 | 是 |
| `h-standing-wrist-extensor-stretch` | 站姿主动腕伸肌拉伸 | 是 | 是 |
| `h-step-jack` | 低冲击开合跳 | 是 | 否 |
| `h-straight-arm-hang-native` | 单杠直臂悬垂保持 | 否 | 否 |
| `h-suitcase-hold` | 单手哑铃静态提握抗侧屈 | 是 | 是 |
| `h-suitcase-march` | 单手哑铃交替踏步抗侧屈 | 是 | 是 |
| `h-sumo-pry` | 相扑深蹲肘推膝停留 | 是 | 否 |
| `h-superman` | 俯卧超人式 | 是 | 否 |
| `h-supine-bilateral-leg-raise` | 仰卧双直腿举腿 | 是 | 是 |
| `h-supine-heel-slide` | 仰卧足跟滑 | 是 | 是 |
| `h-supine-twist` | 仰卧屈膝扭转 | 是 | 否 |
| `h-supported-single-leg-calf` | 扶墙单腿提踵 | 是 | 是 |
| `h-tabletop` | 桌面式后撑抬髋 | 是 | 是 |
| `h-tib-raise` | 靠墙勾脚尖 | 是 | 是 |
| `h-towel-isometric-curl` | 毛巾脚锚等长弯举（卷束毛巾示意） | 是 | 是 |
| `h-unsupported-star-reach-native` | 无扶单腿三向点地 | 否 | 否 |
| `h-wall-angel` | 靠墙天使 | 是 | 是 |
| `h-wall-calf` | 靠墙小腿拉伸 | 是 | 是 |
| `h-wall-calf-bent-knee` | 扶墙屈膝小腿拉伸 | 是 | 是 |
| `h-wall-palm-lift` | 墙面指端接触掌根抬起诊断 | 是 | 是 |
| `h-wall-straddle` | 靠墙仰卧 V 字分腿 | 是 | 是 |
| `h-wall-wrist-flexor-stretch` | 站姿扶墙腕屈肌拉伸 | 是 | 是 |
| `hamstrings-A` | 徒手单腿罗马尼亚硬拉 | 是 | 否 |
| `hamstrings-B` | 滑盘腿弯举 | 是 | 是 |
| `hamstrings-C` | GHD 北欧离心 | 是 | 是 |
| `hip-abductors-A` | 侧平板抬腿 | 是 | 否 |
| `hip-abductors-B` | 仰卧弹力带 V 字开腿 | 是 | 是 |
| `hip-abductors-C` | 器械髋外展 | 是 | 是 |
| `hip-flexors-A` | 坐姿直腿抬腿（压缩） | 是 | 否 |
| `hip-flexors-B` | 弹力带站姿高抬膝 | 是 | 是 |
| `hip-flexors-C` | 绳索站姿直腿前抬 | 是 | 是 |
| `lats-A` | 坐姿撑地抬臀 | 是 | 是 |
| `lats-B` | 弹力带直臂下拉 | 是 | 是 |
| `lats-C` | 双杠支撑耸肩下压 | 是 | 是 |
| `n-chair-wiper` | 坐椅雨刷（膝内倒） | 是 | 是 |
| `n-half-split` | 半跪半劈叉 | 是 | 是 |
| `n-leg-circles` | 仰卧直腿画圈 | 是 | 否 |
| `n-pelvis-circle` | 站姿骨盆画圈 | 是 | 否 |
| `n-prone-hip-ext` | 俯卧屈膝抬腿 | 是 | 是 |
| `n-prone-ir` | 俯卧小腿外摆 | 是 | 是 |
| `n-seated-ir-drop` | 坐姿后撑单膝内倒 | 是 | 否 |
| `n-seated-knee-lift` | 坐姿抬膝悬停 | 是 | 是 |
| `n-seated-squeeze` | 坐姿夹砖（膝内夹） | 是 | 是 |
| `n-slider-lateral` | 滑垫侧向滑 | 是 | 是 |
| `n-squat-shift` | 低位蹲姿左右移重心 | 是 | 否 |
| `n-straddle-fold` | 坐姿分腿体前屈 | 是 | 是 |
| `n-thomas-test` | 仰卧单膝抱胸 | 是 | 否 |
| `n-wide-fold` | 站姿宽距体前屈（扶椅） | 是 | 是 |
| `n-windshield` | 仰卧雨刷式 | 是 | 否 |
| `o-chair-knee-extension` | 坐椅徒手伸膝 | 是 | 是 |
| `o-seated-calf-raise` | 坐椅提踵 | 是 | 是 |
| `o-seated-catcow` | 坐姿猫牛式 | 是 | 是 |
| `o-seated-fig4` | 坐姿四字前压 | 是 | 是 |
| `o-seated-ham` | 坐姿腘绳肌前伸 | 是 | 是 |
| `o-seated-hip-er` | 坐椅无阻力髋外旋控制 | 是 | 是 |
| `o-seated-sidebend` | 坐椅单臂侧伸 | 是 | 是 |
| `o-seated-twist` | 坐姿扶椅扭转 | 是 | 是 |
| `o-stand-crossreach` | 扶椅站姿交叉侧伸 | 是 | 是 |
| `o-stand-ham` | 扶椅站姿单腿腘绳肌拉伸 | 是 | 是 |
| `o-stand-lunge` | 扶椅站姿弓步屈髋拉伸 | 是 | 是 |
| `o-stand-quad` | 扶椅站姿股四头肌拉伸 | 是 | 是 |
| `o-stand-sidebend` | 站姿举手侧屈 | 是 | 否 |
| `o-supported-ankle-eversion` | 扶椅悬空足外翻控制 | 是 | 是 |
| `o-supported-ankle-inversion` | 扶椅悬空足内翻控制 | 是 | 是 |
| `o-supported-ankle-pump` | 扶椅悬空踝屈伸 | 是 | 是 |
| `o-supported-hip-airplane` | 扶椅单腿髋飞机 | 是 | 是 |
| `o-supported-hip-hitch` | 扶椅单腿骨盆提拉 | 是 | 是 |
| `o-supported-hip-ir` | 扶椅屈膝髋内旋控制 | 是 | 是 |
| `o-supported-knee-curl` | 扶椅站姿徒手屈膝 | 是 | 是 |
| `o-supported-march` | 扶椅站姿交替抬膝 | 是 | 是 |
| `o-supported-mini-squat` | 扶椅浅蹲 | 是 | 是 |
| `o-supported-single-leg-rdl` | 扶椅单腿髋铰链 | 是 | 是 |
| `o-supported-star-reach` | 扶椅单腿三向点地 | 是 | 是 |
| `o-wall-hip-hinge-stretch` | 扶墙髋后移躯干延展 | 是 | 是 |
| `obliques-A` | 熊爬穿腿 | 是 | 是 |
| `obliques-B` | 弹力带抗旋转推 | 是 | 是 |
| `obliques-C` | 绳索高位伐木 | 是 | 是 |
| `quadriceps-A` | 跪姿反向北欧 | 是 | 是 |
| `quadriceps-B` | 弹力带终末伸膝 | 是 | 是 |
| `quadriceps-C` | 器械腿屈伸（顶端锁直） | 是 | 是 |
| `rotator-cuff-A` | 俯撑交替触肩 | 是 | 是 |
| `rotator-cuff-B` | 弹力带肘贴体侧外旋 | 是 | 是 |
| `rotator-cuff-C` | 绳索 90/90 外旋 | 是 | 是 |
| `s-9090` | 90/90 坐姿换髋 | 是 | 否 |
| `s-butterfly` | 蝴蝶式 | 是 | 否 |
| `s-figure4` | 仰卧 4 字拉伸 | 是 | 否 |
| `s-frog` | 青蛙式 | 是 | 是 |
| `s-kneel-hipflex` | 半跪髋屈肌拉伸 | 是 | 是 |
| `s-lizard` | 蜥蜴式低弓步 | 是 | 是 |
| `s-pigeon` | 鸽子式（直立扶砖版） | 是 | 是 |
| `s-seated-fold` | 坐姿体前屈 | 是 | 否 |
| `scapular-A` | 俯卧 Y-T-W 举 | 是 | 否 |
| `scapular-B` | 单杠肩胛引体 | 是 | 是 |
| `scapular-C` | 吊环直臂支撑 | 是 | 是 |
| `serratus-A` | 俯撑肩胛前伸 | 是 | 是 |
| `serratus-B` | 泡沫轴墙面上滑 | 是 | 是 |
| `serratus-C` | 吊环俯卧撑加前伸 | 是 | 是 |
| `t-seated-straddle-lift-1leg` | 坐姿分腿单腿抬起 | 是 | 否 |
| `triceps-A` | 窄距俯卧撑（锁肘停顿） | 是 | 是 |
| `triceps-B` | 平行杆直臂支撑 | 是 | 否 |
| `triceps-C` | 双杠臂屈伸 | 是 | 是 |
| `w-bird-dog` | 鸟狗式 | 是 | 是 |
| `w-chair-hip-thrust` | 椅子臀推 | 是 | 是 |
| `w-clamshell` | 侧卧蚌式开合 | 是 | 否 |
| `w-dead-bug` | 死虫式 | 是 | 是 |
| `w-feet-on-chair-bridge` | 脚踩椅面臀桥 | 是 | 是 |
| `w-fire-hydrant` | 四足消防栓 | 是 | 是 |
| `w-prone-swimmer` | 俯卧游泳式 | 是 | 是 |
| `w-wall-sit` | 靠墙静蹲 | 是 | 是 |
