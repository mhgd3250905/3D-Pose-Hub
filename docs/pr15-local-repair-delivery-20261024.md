# PR15 七项本地修复交付

本轮保存已接受的 native-r3 手部，并完成下面七项可供用户看样的修订。代码、独立模型与复现工具保存在本地 `codex/pr15-contact-repair` 分支；审阅视频留在 F 盘，不进 Git。未推送、合入 main 或发布媒体。动作的 `reviewed` / `releaseEligible` 均保持 false；用户对手部外观的接受不替代整个动作的审核。

离线入口：`F:/PoseHub-v2-pilot/pr15-final-review-20261024/index.html`。同目录的 `review-manifest.json` 记录视频字节数、SHA-256、源报告哈希和源提交。先前六项目录与所有失败尝试保留。

| 动作 | 新规格 | 视频字节数 | 结果与边界 |
| --- | --- | ---: | --- |
| 墙面掌根抬起 | `h-wall-palm-lift-rr5` | 201203 | 四个指端接触区；掌根有意撤离，专项接触证据另存 |
| 屈膝提踵 | `h-bent-knee-calf-raise-rr7` | 321298 | 采用已接受的 native-r3 手部；原腿部运动保留 |
| 肩靠椅单腿臀推 | `h-chair-single-leg-hip-thrust-rr8` | 286933 | native-r3 手部；审阅镜头修正 FOV 拟合裁切 |
| 固定杆舒适范围引体 | `h-fixed-bar-vertical-pull-rr7` | 193538 | 原 32 mm 杆与 185 mm 行程；新原生握姿 |
| 单臂哑铃过头臂屈伸 | `h-db-overhead-triceps-extension-rr4` | 60932 | 固定肘、共面 70–165° 屈伸；中立腕随前臂转动 |
| 跪姿脚背拉伸 | `h-kneeling-instep-stretch-rr6` | 217369 | native-r3 手与原脚桥组合；脚部几何及轨迹保持 |
| 跪姿低位穿针（小范围修订） | `h-kneeling-thread-needle-rr1` | 190664 | 低位真实下穿，腕行程约 92 mm；未恢复原高位起点 |

全部视频为 720×720、30 fps、8 秒 H.264，各有完整 241 姿态和首尾 PNG 循环记录。六个原引擎动作的求解/诊断警告均 0；091 是独立 CPU 显示网格，原隐藏骨架诊断不适用，另有 241 整数帧 / 67 姿态和 13 个实际捕获表面的独立几何检查。报告保留具体接触边界、失败记录和检查范围，不把抽样或局部几何检查当作全模型的发布证明。

验证：48 项相关 Node 测试、297 个规格校验、7 项可移植性测试和 catalog 一致性检查均通过；固定模型哈希与 091 全部证据哈希吻合。完整视频的周期联系表和相关手/腕近景已实际查看。

复现入口：

```powershell
# 091；先实际查看 preview，再制作 full。输出必须使用新目录。
node drill-anim/tools/review-threadneedle-r1.mjs preview drill-anim/specs/h-kneeling-thread-needle-rr1.js F:/PoseHub-v2-pilot/new-review/091-preview
node drill-anim/tools/review-threadneedle-r1.mjs full drill-anim/specs/h-kneeling-thread-needle-rr1.js F:/PoseHub-v2-pilot/new-review/091-full --preview F:/PoseHub-v2-pilot/new-review/091-preview
# 其余六项按各自已有报告绑定 r1/r3/r4 入口；不可跨工具版本复用预览。
python tools/action-package-v2/build_review_bundle.py F:/PoseHub-v2-pilot/pr15-actions-20261023/review-plan-final-7.json F:/PoseHub-v2-pilot/new-review/bundle
```

专项记录：[手部接受范围](hand-r3-approval-20261023.md)、[固定杆握持](pr15-fixed-bar-repair-20261024.md)、[过头臂屈伸](pr15-overhead-triceps-repair-20261023.md)、[脚背拉伸](pr15-instep-native-repair-20261023.md)、[低位穿针](pr15-threadneedle-native-repair-20261024.md)、[审阅入口与历史输出](pr15-special-profile-review-20261024.md)。
