# PR #17–#22 选择性采纳交付记录

2026-10-28，用户澄清应采纳与身体无关的有效优化，淘汰因身体 r7 更新而过时的适配，随后明确授权“帮我推进采纳合并”。这项后续授权允许本轮审核、main 合入及 PR 取舍记录，补充此前身体独立合入时“不操作 PR #17–#22”的范围限制；不扩大为全动作迁移或媒体发布。

## 最终取舍

| PR | 处理结果 | 已进入 main 的内容／保留事项 |
| --- | --- | --- |
| [#17](https://github.com/mhgd3250905/3D-Pose-Hub/pull/17) | 已合并 | 8 项训练说明提案和审核清单；仍为 proposal-unreviewed，不批准新 taxonomy、借用剂量或动作。另存来源修订 r2，八项来源逐一匹配 |
| [#18](https://github.com/mhgd3250905/3D-Pose-Hub/pull/18) | 有效部分独立采纳，原旧包关闭、未合并 | 侧抬腿欠约束 pz 和旧代理 touch 失败路径的处理；不导入35份旧 v2 规格、旧鞋角／踝高／掌心／RDL毫米校准。原分支保留 |
| [#19](https://github.com/mhgd3250905/3D-Pose-Hub/pull/19) | 4 项时序独立采纳；原 PR 保持 open/draft | chest-B-r2、serratus-A-r2、triceps-A-r2、quadriceps-C-r2 及 helper；其余8项因节奏、换侧或处方消费语义待审，不判为被身体更新淘汰 |
| [#20](https://github.com/mhgd3250905/3D-Pose-Hub/pull/20) | 已合并 | 编制时旧库与219目录的漏收／重复／改名报告；不自动新增动作或目录条目 |
| [#21](https://github.com/mhgd3250905/3D-Pose-Hub/pull/21) | 有效能力移植到 r7，原旧入口关闭、未合并 | 新可选 training-human-v3-contact-r5 / 0.1.0-r5，包含双手掌面／指腹拟合和 neck 三通道；不导入旧 r3 loader 及单枢轴颈部缝合方案。原分支保留 |
| [#22](https://github.com/mhgd3250905/3D-Pose-Hub/pull/22) | 关闭、未合并 | 237个未渲染旧身体／手部包装不采纳；源分支和历史资料保留，不因关闭而删除 |

原 PR #24 仍 open/draft，旧混合祖先没有整体合入。身体 r7 已通过独立合入解决，其验收标记 `body-v3-r7-accepted-20261028` 和冻结 manifest SHA 不变。

## 实际 Git 成果

| 内容 | 实际提交 |
| --- | --- |
| #17 合并 | `45e60760abb817973dd8fe32c30888693b3edbc5` |
| #20 合并 | `fc0bf0401cfeaf8f4985b06c3609510d42250047` |
| #17 来源元数据另存 r2 | `e6e002e06607b15541c4d02900e8fa1085c0b3b6` |
| #19 四项时序及51帧证据 | `29129383f9062e3c4bcdc809295b4071d669139f` |
| #18 通用处理 + #21 r7 扩展、CPU/GPU复测和对比图 | `793a07b53ea6a384ac32faef82a9fb7208e1390e` |

上述代码与审核材料均已推送 main。最后一项从干净 main `2912938` 快进到 `793a07b`，推送后 `git ls-remote` 回读相同 SHA。本文件及台账属于其后的文档对齐提交，完整最终交付由包含本记录的 Git 提交标识，避免引用自身哈希。

## 验证与记录

- #17 [来源修订](../../r1-pending8-semantics-review-20261028-r2.md)：修正农夫保持不存在的来源 commit、四项 CRLF 哈希记录；原提案保留，正式处方没有写入。
- #19 [取舍](pr19-timing-r1.md)、[采纳及预览](pr19-adoption-r2.md)、[机器摘要](pr19-sampled-evidence-r1.json)：四项各240帧独立采样检查，实际 r7 共51帧对照；最大骨位置差约0.000164 mm、角度差0.000048°，原可达范围告警逐项保留并披露。
- #18 [实测](pr18-adoption-r2.md)：五个时间点，冷／热前后分支差约221.235 mm，处理后对应输出相同；完整手掌贴腰与鞋底验收仍属后续迁移。
- #21 [新入口与实测](pr21-adoption-r1.md)、[数据／原图哈希](pr21-sampled-evidence-r1.json)：三个撑地时刻的两手逐指验收通过；四个头颈角度侧／后图检查通过；52骨／30指骨静止变换、引用、父子关系和控制器状态不变，卸载恢复原钩子与手姿，页面错误0。局部自动复核不替代用户对后续新动作的审核。

每次代码推送前均通过 `node drill-anim/verify.mjs`、`python -B drill-anim/test_portability.py`（7项）及 `node drill-anim/tools/catalog.mjs --check`；最后代码检查为301规格、catalog up to date，原 spec 哈希保留。新扩展另做递归 manifest／依赖验签和 CPU 检查。代码检查通过后只有本记录和台账变化，文档另核对本地链接与 whitespace，不为文档重复渲染。

## 当前入口与边界

用户已看样接受的身体底座仍是 `training-human-v3-completed / 1.0.0-r7`。新增 `training-human-v3-contact / 0.1.0-r5` 是显式可选能力，manifest LF SHA `60aed9cff5e0754cbead7afbd305aad903f835b52ea3044defeb3de641dc045c`；其建包时 pending 字段不改写，由实测记录补充。

全局 `current-production.json` 仍为 `training-human-v2plus / 1.0.0-rc2`，AI catalog 仍0.3.0／142稳定ID，公开 App 媒体仍0.2.0 published。spec开发总表由297增至301只来自四项另存时序，不能当作已审核动作总数。未迁移动作241项、未升级媒体／SDK、未烘焙整身GLB、未改已发布包或已接受r7标记；也未清理旧工作树和实验文件。
