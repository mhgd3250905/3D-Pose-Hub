# clipB 相对深度

`00000.png` 至 `00091.png` 共 92 张单通道 16 位灰度 PNG。每张 1080 × 1080，按原片帧号与 `../frames/` 同名图像逐像素对齐。

像素值越大表示越近。整段使用同一个编码，模型相对逆深度值为 `uint16 × 0.00013642363847689033`，偏移为 `0`。沿用 Air Flare 的量化比例和零偏移。 原始模型输出范围约为 `0.066916607` 至 `6.2827492`。深度值无量纲，独立切片的模型尺度可能不同。叠手、并腿和快速旋转时，遮挡处和轮廓附近可能有估计偏差。

推理使用 Video Depth Anything Small 相对深度权重、输入尺寸参数 336 和 30 fps。模型按时间窗口对齐。代码与模型许可为 Apache-2.0。[代码修订](https://github.com/DepthAnything/Video-Depth-Anything/tree/4f5ae23172ba60fd7bc11ef671cca678842c7072) · [权重来源](https://huggingface.co/depth-anything/Video-Depth-Anything-Small/tree/256875362cff76724b920335dfb4b29dd611f66e)

权重 SHA-256 为 `13379300b739e659f076a59d52e9801bd8d38c541a7e71f73bbca4dcfb013609`。

全部深度 PNG 的帧号、分辨率和 16 位像素回读均通过校验，共 75,933,293 字节。
