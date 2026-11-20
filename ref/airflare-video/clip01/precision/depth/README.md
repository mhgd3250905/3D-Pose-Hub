# Air Flare clip01 相对深度

`10118.png` 至 `10273.png` 共 156 张单通道 16 位灰度 PNG。每张 1920 × 1080，与 `../frames/` 中同名原片帧按像素对齐，坐标原点为左上角。

像素值越大，物体估计越近。整段共用一个编码，模型相对逆深度值为 `uint16 × 0.00013642363847689033`，偏移为 0。这是无量纲估计。模型处理时使用时间窗口对齐，仍可能在手脚边缘、遮挡及快速翻转处出现误差。

推理使用 Video Depth Anything Small 的相对深度权重、336 输入尺寸参数和 30 fps。代码与模型为 Apache-2.0。[代码修订](https://github.com/DepthAnything/Video-Depth-Anything/tree/4f5ae23172ba60fd7bc11ef671cca678842c7072) · [权重来源](https://huggingface.co/depth-anything/Video-Depth-Anything-Small/tree/256875362cff76724b920335dfb4b29dd611f66e)

权重 SHA-256 为 `13379300b739e659f076a59d52e9801bd8d38c541a7e71f73bbca4dcfb013609`。

全部 PNG 回读后与编码前数组逐像素一致。156 帧中，近处草地块的深度像素中位数均高于远处背景块。抽查了起势、倒立、换手和收势的 6 张原图与深度对照。PNG 合计 160,974,732 字节。
