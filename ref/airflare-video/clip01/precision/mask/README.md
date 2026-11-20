# Clip01 演示者分割

`10118.png`–`10273.png` 共 156 张 PNG。每张单通道 8 位，尺寸 1920 × 1080，像素与同名原片帧直接对齐。白色 255 代表演示者，黑色 0 代表背景。分割对象为近处表演者。

使用 [Meta SAM 2.1 Hiera Small](https://github.com/facebookresearch/sam2) 和跟踪器给出的演示者矩形逐帧提示分割。推理由 [Ultralytics SAM 接口](https://github.com/ultralytics/ultralytics/blob/main/ultralytics/models/sam/model.py) 完成，采用 [SAM 2.1 Small 发布权重](https://github.com/ultralytics/assets/releases/download/v8.3.0/sam2.1_s.pt)，SHA-256 为 `60f9e43f1307be192eef341437e02c40f32cd61cf36a97a203a0998a2952873a`。

抽查了分割叠加、换手与伸展幅度大的姿势，并比对面积、相邻帧交并比和连通域。10193–10194 帧初次分割遗漏了深色短裤及一侧腿，已扩大提示框并添加躯干和腿部的正点重新分割，回看显示两腿、短裤和躯干均包含在轮廓内。最终各帧前景面积为 47,938–95,593 像素，最大连通域占前景至少 98.1%。脚趾、手指和运动模糊边界仍为模型估计。
