# Hark-4080 五项最终修订交付

来自 `3D-Pose` 用户于 2026-10-11 确认可用的 v1.0.0，2026-10-12 按用户授权提交到 3D-Body。此目录是独立审阅包，原 `specs/`、`data/drills.json`、App 正式媒体与选版均未改变。打开 [index.html](index.html) 可播放、查看分解图并复制名称；[catalog.json](catalog.json) 提供机器可读路径。

| ID | 版本 / 成片 | 原始引擎 QA | 已知限制 |
| --- | --- | --- | --- |
| hip-abductors-B | v3-local，8秒 / 240帧，修正脚部方向 | pass=true，240帧 solver 警告 | 警告保留，不宣称零警告 |
| s-frog | v3-local，8秒 / 240帧，修正脚部方向 | pass=true，0帧 solver 警告 | 以成片与原始 QA 为准 |
| rotator-cuff-B | v3-local，8秒 / 240帧，正面镜头 | pass=true，0帧 solver 警告 | 主镜头用于看清外旋路径；高亮位置未移到身体前侧 |
| deltoids-B | v3-local，12秒 / 360帧，优化起身节奏与支撑 | pass=true，0帧 solver 警告 | 半程至高桥，并非站起；支撑肘皮肤与垫面仍约相距10.31mm |
| s-9090-switch | v1-local，12秒 / 360帧，新增左右换髋 | pass=true，0帧 solver 警告 | 独立于原 s-9090 前屈拉伸；鞋会滚转，脚跟材料点近固定不等于固定地面接触点 |

每项目录中 spec.js 是已发布最终参数，spec.json 是等价序列化数据，theme.json 是渲染主题。MP4、GIF、poster.jpg、frames.jpg 是对应成片与图；qa.json、media-validation.json 和 render-evidence.txt 保留原始结果。三项修订和其他两项均验证媒体哈希与冻结源一致，MP4 1080×1080、30fps、H.264，GIF 解码验证通过。附加 motion / framing / foot-stability 记录仅在对应动作目录存在。

全量渲染来源为 `68043f71651056c57c72a3b8813cbb354979346f` 加原机 boot.mjs 的 Windows/GPU 兼容改动；本提交**没有包含本地兼容补丁**。PR 从 master `80298ceccf58c958e557e1b45c44ddaf1ae2c6b6` 建立，该版已有另一方的 Windows 可移植运行支持。原全片 QA 不能称为这次 PR base 上的新全量渲染 QA；本次验证是文件与参数完整性、现有工具检查及交付预览，不重新出片。

## 校验与使用

在仓库根目录运行：

```powershell
node tools/drill-anim/revisions/hark-4080-v1/verify.mjs
```

校验目录中的逐文件 SHA-256 和5项参数 / 主题 / 原始 QA 的对应关系。它不会渲染或写入 App。SHA256SUMS.json 不包含自身，校验器还检查完整文件集合，避免遗漏或意外混入文件。原59参数保持检查另由 `node tools/drill-anim/verify.mjs` 执行。

再渲染前按工具 README 设置 gitignored config.json，选择新的 work_dir / out_dir；直接向 lib/render.mjs 传此包中的 spec.js 和 theme.json，不用 drill.py render 的默认旧 spec。例：

```powershell
# 仅三帧预览；在仓库根目录，配置完成、没有冲突GPU任务后才执行。
node tools/drill-anim/lib/render.mjs tools/drill-anim/revisions/hark-4080-v1/s-frog/spec.js NEW_PREVIEW_DIR 0 240 --frames 0,60,120 --theme revisions/hark-4080-v1/s-frog/theme.json --pr 1
```

theme 相对路径由配置库以 tools/drill-anim 为基准解析。NEW_PREVIEW_DIR 需替换为专用新目录。不要覆盖旧参数 / 成片或把低清预览当正式交付。原版与工作区冻结版本均保留；是否提升为默认参数、重新全量验收、切换 App 视频，由后续明确的集成任务决定。

人物来源与署名见 [ATTRIBUTION.md](ATTRIBUTION.md)，复制衍生素材时一并保留。肌群高亮是功能示意层，并非实测激活数据。五项均为自定义 IK / 时间线参数，不是标准 GLB 动画。

完整60动作库与跨项目素材接手说明见 [项目交接入口](../../../../docs/drill-anim/hark-4080-v1.md)。本包不包含另一方 `drill/sitting-strength` 的8个动作，也不把未通过的哥本哈根动态稿、体前屈稳定化稿当已完成素材。
