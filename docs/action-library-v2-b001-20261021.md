# 全库重制首批：8 动作技术制作结果

2026-10-21，执行分支 `codex/action-library-v2-production`，新模型固定为 `training-human-v2plus / 1.0.0-rc2`。本批已制作、核验并接入 catalog；编辑、人工试听、开哥样片确认及发布审核仍待完成，未合入 main、未推送或公开上传。

动作：`h-squat`、`h-step-jack`、`h-crunch`、`h-superman`、`h-good-morning`、`h-russian-twist`、`h-banana`、`o-stand-sidebend`。批次来源见 [b001-gpu4080-r2.json](../catalog/v2/batches/b001-gpu4080-r2.json)。

## 产物与检查

制作根为 `F:/PoseHub-v2-production/batches/b001-gpu4080-r2/`。母版是无背景 RGBA 分层：人物与道具五皮肤分别渲染，高亮灰度遮罩和透明阴影独立保存；每动作实测五皮肤网格及遮挡 SHA 一致，才共用后两层。浅深背景只在脚本派生时合成，无镜像版。

| 项目 | 实际结果 |
| --- | --- |
| 完整母版 | 13,440 张生产 PNG，另 56 张独立第 240 帧检查图；1080²、30fps、8 秒、240 帧 |
| GPU | 8 个动作均由同一实际渲染浏览器记录 RTX 4080 Laptop 的 ANGLE/D3D11 证明；最多两路，墙钟 23 分 48 秒 |
| 派生 | 80 视频、80 封面、80 缩略图、240 关键帧、40 透明封面、80 高亮关对照，共 600 文件 |
| 视频实测 | 全部 720² H.264、30fps、240 帧、8 秒；实际 SHA/字节数核对 |
| 母版文件完整性 | 13,640 个唯一文件逐项核验，13,496 张母版/端点 PNG 实际解码，无问题 |
| 全序列检查 | 40 份皮肤序列，无空帧、边缘裁切、异常面积跳变；9,600 帧图层记录无灰度/遮挡/尺寸等数值问题 |
| 循环 | 所有动作、所有皮肤三层的独立 0/240 图像逐字节一致；姿态警告为零 |
| 实际看图 | 8 张完整时序图、五皮肤共 430 个采样格；160 格动作×皮肤×主题×高亮开关拼图 |
| 浏览器 | 实际播放深蹲并看到 0:00→0:06，实际切换蓝色/深色，视频及两张高亮对照图更新 |
| 语音 | 独立批次清单 132/132 技术通过；内容与人工试听 pending |

开合跳另建 `h-step-jack-r3.js`，只校准两条踝关节 Y 轨道，保留原修订。完整 241 帧可见鞋底全局最低点为 +0.25 毫米，原支撑判据下膝角最低 158.68°，原阈值 158°，没有违例。全局最低点不是逐脚完整接触或穷尽碰撞证明。

实际采样未见颈部漏色、明显穿模、裁切或道具闪烁。采样看图和数字检查不等于人工观看每一帧，也不授予医学、编辑、试听或用户发布批准。

## 审阅入口和证据

- [本地审片页](http://127.0.0.1:8877/batches/b001-gpu4080-r2/index.html)：5 皮肤、深浅背景、循环视频、高亮开关对照、独立中英语音。服务只监听本机；页面文件保留在制作根 `index.html`。
- [160 格拼图](F:/PoseHub-v2-production/batches/b001-gpu4080-r2/previews/action-skin-theme-highlight-mosaic.png)。
- 制作根 `qa/`：`full-integrity-qa.json`、`masters-layer-pixels.json`、`full-sequences.json`、`measured-production.json`、`stepjack-full-contact-audit.json`、`cpu-production-summary-r1.json`、`gallery-browser-review.json`。
- 实际看图记录：`F:/PoseHub-v2-production/reviews/b001-full-actual-review.json`；其 SHA/真实采样/源/GPU/逐层序列绑定在制作根 `qa/reviews/` 的 16 份 QA 记录中。
- [全库真实文件报告](../catalog/v2/library-completeness.json)：142 个目标，28 包已写，114 个待写；源/母版/派生技术层各 14 包通过（6 试制＋本批 8），六层发布资格 0/142。

`bind_qa.py` 仅接合外部实际看图记录和数值证据；`integrate_batch.py` 只接合实际媒体引用；二者均不能授予编辑、试听、合入或发布批准。报告和 [AI 索引](../catalog/action-library/index.md)已从 catalog 重新生成。

后续 b002 六动作独显预览已完成，但单腿硬拉存在腕/踝可达警告，侧抬腿存在穿地及循环漂移；保留原件并另建源修订，修正并重新预览通过后才能进入完整母版。其余批次依照[全库计划](action-library-v2-production-plan-20261021.md)推进。
