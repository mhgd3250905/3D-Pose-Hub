# WholeBody 2D 关键点

源帧号 0–91，共 92 帧。 每个 JSON 的文件名为五位十进制原片帧号，`frame` 保存整数帧号。像素原点为左上角，x 向右，y 向下，`image_width` 和 `image_height` 为原帧尺寸。

使用 RTMW-x 384×288，133 个原生 COCO-WholeBody 点包含 COCO 身体、脚跟、大脚趾、小脚趾及左右手各 21 点。`left_middle_finger1` 和 `right_middle_finger1` 指中指根。第 133、134 号点是由同侧手腕和四个指根求均值的掌心估计，组成点出现任一不确定标记时，掌心坐标及分数置空。`confidence` 为未校准的原生 SimCC 响应分数，取值可大于 1。

以同一人在 GVHMR 的目标框为输入，运行四个图像旋转方向，把结果逆变换回原片像素后按跨帧连续性选择候选。`pose_rotation_deg` 为输入图像逆时针旋转度数，`side_assignment=swapped` 表示按 COCO 点位对应表整体交换了候选的左右编号。`side_review=uncertain` 表示身体、手腕或脚存在置信度、遮挡或候选一致性标记。

原生估计保留原坐标与分数。`flags` 记录候选间分歧、未落在扩张后的人物蒙版、低分、叠手、并脚和逐帧复核中的可疑情形。重叠的手和鞋可能出现位置或身份错误，支撑轴手和握腕手以 `../labels.txt` 的手工证据为准。

RTMW 代码与模型来源：[OpenMMLab RTMW](https://github.com/open-mmlab/mmpose/tree/main/projects/rtmpose)。
