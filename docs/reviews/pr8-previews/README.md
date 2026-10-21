# PR #8 对照图来源与验收边界

本目录记录 17 份镜头／构图修订的三帧对照。每张图上排是 before 来源，下排是 after 修订；列顺序与下表帧号一致。路径相对于仓库根目录，机器可读记录见 [manifest.json](manifest.json)。规格输入基于 `dc33af6`，主题均为 `glow-soft`，预览参数 `--pr 0.5 --jobs 1`。

## 来源更正

`rotator-cuff-B-r2.jpg` 与 `hip-abductors-B-r2.jpg` 的旧 before 对照未清楚锁定冻结源路径；其中 rotator-cuff-B 已确认用了另一历史镜头，hip-abductors-B 的旧图是否用错来源未得到确证。为消除来源歧义，本次以冻结目录 `drill-anim/revisions/hark-4080-v1/<动作>/spec.js` 重建这两张对照，分别使用帧 `9,30,54` 与 `5,24,66`。两排均显式选用 `training-human-v2`、`alignClavicles: false`，统一人体后比较镜头；通过渲染输入选择人体，不修改冻结源文件。新图替代本目录的旧图，不追改历史 GitHub 评论或历史提交中的图片。

其余 15 张保留作者原图，其帧号依据[作者修复说明](https://github.com/mhgd3250905/3D-Pose-Hub/pull/8#issuecomment-6258916486)。其中 9 份 before 源规格未声明 `modelProfile`；普通 CLI 无覆盖时默认 `legacy-v7`，但旧图是否使用了人体覆盖配方未确认，实际 before 人体与 alignClavicles 设置均不能仅从源规格推断。另外 6 份 before 源规格显式声明 `training-human-v2`、`alignClavicles: false`；此处依据源规格登记，并非取得了额外的逐排渲染配方。after 的 17 份修订均显式采用 `training-human-v2`、`alignClavicles: false`。保留旧图不能一概视为已证明同人体隔离镜头的对照，也不能把所有视觉差异都归为镜头变化。

## 逐图输入

“v2”表示规格声明 `training-human-v2` 且 `alignClavicles: false`；before 的“v2（源声明）”只依据源规格，不代表另有逐排渲染配方。“未确认（源未声明）”表示 before 源规格缺少 profile 和 alignClavicles，旧图实际是否覆盖未知；普通 CLI 无覆盖时默认 `legacy-v7`。“v2（覆盖）”表示本次重建比较显式选择人体。

| 对照图 | before 来源 | after 修订 | 帧号 | before 人体 | after 人体 |
|---|---|---|---|---|---|
| [rotator-cuff-B-r2](rotator-cuff-B-r2.jpg) | `drill-anim/revisions/hark-4080-v1/rotator-cuff-B/spec.js` | `drill-anim/specs/rotator-cuff-B-r2.js` | 9, 30, 54 | v2（覆盖） | v2 |
| [rotator-cuff-C-r2](rotator-cuff-C-r2.jpg) | `drill-anim/specs/rotator-cuff-C.js` | `drill-anim/specs/rotator-cuff-C-r2.js` | 0, 22, 45 | 未确认（源未声明） | v2 |
| [h-band-pull-apart-r2](h-band-pull-apart-r2.jpg) | `drill-anim/specs/h-band-pull-apart.js` | `drill-anim/specs/h-band-pull-apart-r2.js` | 0, 15, 30 | v2（源声明） | v2 |
| [w-prone-swimmer-r2](w-prone-swimmer-r2.jpg) | `drill-anim/specs/w-prone-swimmer.js` | `drill-anim/specs/w-prone-swimmer-r2.js` | 0, 15, 30 | 未确认（源未声明） | v2 |
| [h-incline-pushup-r2](h-incline-pushup-r2.jpg) | `drill-anim/specs/h-incline-pushup.js` | `drill-anim/specs/h-incline-pushup-r2.js` | 0, 22, 45 | v2（源声明） | v2 |
| [hip-abductors-B-r2](hip-abductors-B-r2.jpg) | `drill-anim/revisions/hark-4080-v1/hip-abductors-B/spec.js` | `drill-anim/specs/hip-abductors-B-r2.js` | 5, 24, 66 | v2（覆盖） | v2 |
| [o-stand-crossreach-r2](o-stand-crossreach-r2.jpg) | `drill-anim/specs/o-stand-crossreach.js` | `drill-anim/specs/o-stand-crossreach-r2.js` | 0, 15, 30 | 未确认（源未声明） | v2 |
| [s-9090-r3](s-9090-r3.jpg) | `drill-anim/specs/s-9090-r2.js` | `drill-anim/specs/s-9090-r3.js` | 0, 22, 45 | v2（源声明） | v2 |
| [abs-C-r2](abs-C-r2.jpg) | `drill-anim/specs/abs-C.js` | `drill-anim/specs/abs-C-r2.js` | 0, 15, 30 | 未确认（源未声明） | v2 |
| [chest-A-r2](chest-A-r2.jpg) | `drill-anim/specs/chest-A.js` | `drill-anim/specs/chest-A-r2.js` | 0, 22, 45 | 未确认（源未声明） | v2 |
| [rotator-cuff-A-r2](rotator-cuff-A-r2.jpg) | `drill-anim/specs/rotator-cuff-A.js` | `drill-anim/specs/rotator-cuff-A-r2.js` | 0, 15, 30 | 未确认（源未声明） | v2 |
| [obliques-A-r2](obliques-A-r2.jpg) | `drill-anim/specs/obliques-A.js` | `drill-anim/specs/obliques-A-r2.js` | 0, 30, 60 | 未确认（源未声明） | v2 |
| [t-lsit-wide-r2](t-lsit-wide-r2.jpg) | `drill-anim/specs/t-lsit-wide.js` | `drill-anim/specs/t-lsit-wide-r2.js` | 0, 15, 30 | v2（源声明） | v2 |
| [t-lsit-open-close-r2](t-lsit-open-close-r2.jpg) | `drill-anim/specs/t-lsit-open-close.js` | `drill-anim/specs/t-lsit-open-close-r2.js` | 0, 45, 90 | v2（源声明） | v2 |
| [w-clamshell-r2](w-clamshell-r2.jpg) | `drill-anim/specs/w-clamshell.js` | `drill-anim/specs/w-clamshell-r2.js` | 0, 15, 30 | 未确认（源未声明） | v2 |
| [h-supine-twist-r3](h-supine-twist-r3.jpg) | `drill-anim/specs/h-supine-twist-r2.js` | `drill-anim/specs/h-supine-twist-r3.js` | 0, 30, 60 | v2（源声明） | v2 |
| [hip-abductors-C-r2](hip-abductors-C-r2.jpg) | `drill-anim/specs/hip-abductors-C.js` | `drill-anim/specs/hip-abductors-C-r2.js` | 0, 30, 60 | 未确认（源未声明） | v2 |

## 验收边界

这些图片用于采样帧的镜头、构图与动作可读性审核。作者对保留图片的采样 QA 结论及保留项记录在上述评论中；本目录的输入清单不追加未经实看的视觉通过结论。完整循环视觉 QA 与完整成片 QA 未完成，本次未渲染全片。

已知保留项仍按原评审记录：`hip-abductors-C-r2` 正面机位看不到髋外侧高亮；`w-prone-swimmer-r2` 的 T 位仍略有抬起感；L 撑系列臀部离地高度属于后续姿态复核范围，不能用镜头采样图宣告解决。

本次证据更正不改主规格、冻结历史记录或已发布公开素材版本，也不代表旧成片已重渲。合并验收依据应同时包括 PR 的规格与哈希校验、便携性检查、媒体测试，以及主线对当前图片的实际审看记录。


## 主线合并前复核（2026-10-19）

主线已实看全部 17 张图的 after 行，共 51 张采样帧。新重建的两张图还逐排核对了 before 与 after：rotator-cuff-B 使用帧 9、30、54，hip-abductors-B 使用帧 5、24、66；两组各排的采样人体触边数均为 0，肘贴体侧／前臂外旋和仰卧双腿 V 字开合的关系可读。其余 15 图保留已实看的作者预览，未观察到新增人体裁边；不把缺失的逐排渲染配方补写为已知事实。

规格验证（200 份、13 个人体源文件哈希）、7 项便携性测试及 45 项媒体测试已在 `dc33af6e39473064cf25974dea35b0cfd52336fc` 独立通过。本次后续仅改对照 JPG、README 与 manifest，制作代码及规格输入与该验证版本完全相同，沿用上述结果。图片 SHA-256、源规格 LF 规范化哈希与逐图采样记录保存在 manifest 中。

本次达到规格／采样预览的合并要求；完整循环与公开成片交付仍须另行制作、核验和登记，不能据本次合并覆盖既有媒体或 published 版本。
